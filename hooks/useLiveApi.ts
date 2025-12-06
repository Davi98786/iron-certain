import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, base64Decode, pcmToAudioBuffer, PCM_SAMPLE_RATE_INPUT, PCM_SAMPLE_RATE_OUTPUT } from '../utils/audio';
import { Message } from '../types';
import { getFriendlyErrorMessage } from '../utils/errors';

interface UseLiveApiParams {
  onMessage: (message: Message) => void;
}

interface UseLiveApiReturn {
  isConnected: boolean;
  isStreaming: boolean;
  isModelSpeaking: boolean;
  volume: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
  error: string | null;
  resetError: () => void;
}

export const useLiveApi = ({ onMessage }: UseLiveApiParams): UseLiveApiReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // Audio Contexts and Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // API Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const currentSessionRef = useRef<any>(null);

  // Playback state
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Transcription state
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');
  
  // Volume visualization frame loop
  const volumeIntervalRef = useRef<number | null>(null);

  const resetError = useCallback(() => setError(null), []);

  const cleanupAudio = useCallback(() => {
    // Stop all scheduled audio
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    scheduledSourcesRef.current.clear();
    setIsModelSpeaking(false);

    // Close input streams
    if (inputSourceRef.current) {
      inputSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      inputSourceRef.current.disconnect();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    
    // Close contexts
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
    }
    
    // Clear intervals
    if (volumeIntervalRef.current) {
      window.clearInterval(volumeIntervalRef.current);
    }
    
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    setVolume(0);
  }, []);

  const disconnect = useCallback(async () => {
    if (currentSessionRef.current) {
        try {
           // @ts-ignore
           if (typeof currentSessionRef.current.close === 'function') {
               // @ts-ignore
               currentSessionRef.current.close();
           }
        } catch (e) {
            console.warn("Error closing session:", e);
        }
    }
    currentSessionRef.current = null;
    sessionPromiseRef.current = null;
    
    cleanupAudio();
    setIsConnected(false);
    setIsStreaming(false);
  }, [cleanupAudio]);

  const sendText = useCallback((text: string) => {
    if (!text.trim()) return;

    // Optimistically add user message via callback
    onMessage({
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      isComplete: true
    });

    // Send to Gemini
    sessionPromiseRef.current?.then((session) => {
        session.sendRealtimeInput({
            clientContent: {
                turns: [{ role: 'user', parts: [{ text }] }],
                turnComplete: true
            }
        });
    }).catch(e => {
        setError(getFriendlyErrorMessage(e));
    });
  }, [onMessage]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) throw new Error("AudioContext not supported");
      
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: PCM_SAMPLE_RATE_INPUT });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: PCM_SAMPLE_RATE_OUTPUT });
      
      analyserRef.current = outputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.5;
      
      outputGainNodeRef.current = outputAudioContextRef.current.createGain();
      outputGainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(outputAudioContextRef.current.destination);

      // 2. Get Microphone Stream
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        throw new Error("Permission denied: Unable to access microphone.");
      }
      
      // 3. Init Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 4. Setup Session
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };

      const handleMessage = async (message: LiveServerMessage) => {
        // Handle Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
          const ctx = outputAudioContextRef.current;
          const buffer = pcmToAudioBuffer(base64Decode(base64Audio), ctx);
          
          const now = ctx.currentTime;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
          
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(outputGainNodeRef.current!);
          
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          
          scheduledSourcesRef.current.add(source);
          setIsModelSpeaking(true);
          
          source.onended = () => {
              scheduledSourcesRef.current.delete(source);
              if (scheduledSourcesRef.current.size === 0) {
                  setIsModelSpeaking(false);
              }
          };
        }

        // Handle Transcriptions
        const outputTrans = message.serverContent?.outputTranscription?.text;
        const inputTrans = message.serverContent?.inputTranscription?.text;
        
        if (outputTrans || inputTrans) {
           if (outputTrans) currentOutputTransRef.current += outputTrans;
           if (inputTrans) currentInputTransRef.current += inputTrans;
        }

        // Handle Turn Complete
        if (message.serverContent?.turnComplete) {
           const userText = currentInputTransRef.current;
           const modelText = currentOutputTransRef.current;
           
           if (userText && userText.trim().length > 0) {
              onMessage({
                id: Date.now().toString() + '-user-trans',
                role: 'user',
                text: userText,
                timestamp: new Date(),
                isComplete: true
              });
           }
           
           if (modelText) {
             onMessage({
               id: Date.now().toString() + '-model',
               role: 'model',
               text: modelText,
               timestamp: new Date(),
               isComplete: true
             });
           }

           currentInputTransRef.current = '';
           currentOutputTransRef.current = '';
        }

        // Handle Interruption
        if (message.serverContent?.interrupted) {
          scheduledSourcesRef.current.forEach(s => s.stop());
          scheduledSourcesRef.current.clear();
          setIsModelSpeaking(false);
          nextStartTimeRef.current = 0;
          currentOutputTransRef.current = ''; 
        }
      };

      // Connect to Live API
      sessionPromiseRef.current = ai.live.connect({
        ...config,
        callbacks: {
          onopen: async () => {
            setIsConnected(true);
            setIsStreaming(true);
            
            if (!inputAudioContextRef.current) return;
            
            inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmBlob = createPcmBlob(inputData);
               sessionPromiseRef.current?.then(session => {
                 session.sendRealtimeInput({ media: pcmBlob });
               });
            };
            
            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: handleMessage,
          onclose: () => {
             setIsConnected(false);
             setIsStreaming(false);
             setIsModelSpeaking(false);
             console.log("Session closed");
          },
          onerror: (err) => {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
            disconnect();
          }
        }
      });
      
      currentSessionRef.current = await sessionPromiseRef.current;
      
      // Volume loop
      volumeIntervalRef.current = window.setInterval(() => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolume(avg / 255);
        }
      }, 50);

    } catch (e: any) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
      cleanupAudio();
      setIsConnected(false);
    }
  }, [cleanupAudio, disconnect, onMessage]);

  return {
    isConnected,
    isStreaming,
    isModelSpeaking,
    volume,
    connect,
    disconnect,
    sendText,
    error,
    resetError
  };
};
