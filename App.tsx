import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveApi } from './hooks/useLiveApi';
import { useMultimodal } from './hooks/useMultimodal';
import AudioVisualizer from './components/AudioVisualizer';
import { Message } from './types';
import { fileToBase64 } from './utils/file';

const MicIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

const SendIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

const PaperClipIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
);

const SparklesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const PhotoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const FilmIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const ExclamationIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <div className="w-8 h-8 rounded-full bg-[#003399] border border-[#FFCC00] flex items-center justify-center text-[#FFCC00] shrink-0 shadow-sm">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  </div>
);

const ModelIcon = () => (
  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#003399] shrink-0 border border-blue-200">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
       <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    </svg>
  </div>
);

// Component to render 12 stars in a circle
const EuStarsIcon = ({ className = "w-10 h-10" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    {[...Array(12)].map((_, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        fill="#FFCC00"
        className="absolute w-[18%] h-[18%]"
        style={{
          transform: `rotate(${i * 30}deg) translate(0, -150%)`
        }}
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ))}
  </div>
);

const ErrorBanner = ({ error, onDismiss }: { error: string | null, onDismiss: () => void }) => {
  if (!error) return null;
  return (
    <div className="absolute top-20 left-4 right-4 z-50 flex items-start gap-3 p-4 bg-red-600/90 text-white rounded-xl shadow-lg border border-red-400 backdrop-blur-md animate-in slide-in-from-top-2">
      <ExclamationIcon className="w-6 h-6 shrink-0 text-red-100" />
      <div className="flex-1 text-sm font-medium">{error}</div>
      <button 
        onClick={onDismiss} 
        className="text-red-100 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
};

type Mode = 'chat' | 'image' | 'video';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<Mode>('chat');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState('1K');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  const handleLiveMessage = useCallback((msg: Message) => {
    setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'user' && lastMsg.text === msg.text) {
            return prev;
        }
        return [...prev, msg];
    });
  }, []);

  const { 
    isConnected, 
    volume, 
    isModelSpeaking, 
    connect, 
    disconnect, 
    sendText: sendLiveText, 
    error: liveError, 
    resetError: resetLiveError 
  } = useLiveApi({ 
    onMessage: handleLiveMessage 
  });

  const { 
    generateContent, 
    isLoading: isMultiLoading, 
    error: multiError, 
    resetError: resetMultiError 
  } = useMultimodal();

  useEffect(() => {
    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isMultiLoading, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    if (isConnected) {
        sendLiveText(inputText);
        setInputText('');
    } else {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputText,
            timestamp: new Date(),
            isComplete: true,
            media: selectedFile ? {
                type: selectedFile.type.startsWith('video') ? 'video' : 'image',
                url: URL.createObjectURL(selectedFile),
                mimeType: selectedFile.type
            } : undefined
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        
        const fileToSend = selectedFile;
        setSelectedFile(null);

        const response = await generateContent(userMsg.text, mode, fileToSend, imageSize);
        if (response) {
            setMessages(prev => [...prev, response]);
        }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
    }
  };

  // Status text for the header
  const getStatusText = () => {
      if (isConnected) {
          if (isModelSpeaking) return 'Gemini Speaking...';
          if (volume > 0.01) return 'Listening...';
          return 'Live Connected';
      }
      return 'Multimodal AI';
  };

  const activeError = liveError || multiError;
  const dismissError = () => {
    if (liveError) resetLiveError();
    if (multiError) resetMultiError();
  };

  return (
    // EU Theme: Official Reflex Blue Background
    <div className="flex flex-col h-screen bg-[#003399] text-white font-sans selection:bg-[#FFCC00] selection:text-[#003399] relative">
      
      <ErrorBanner error={activeError} onDismiss={dismissError} />

      {/* Header */}
      <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-[#FFCC00]/30 bg-[#003399]/90 backdrop-blur-xl z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <EuStarsIcon className="w-10 h-10" />
            {isConnected && (
               <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isModelSpeaking ? 'bg-green-400' : 'bg-[#FFCC00]'}`}></span>
                 <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-[#003399] ${isModelSpeaking ? 'bg-green-400' : 'bg-[#FFCC00]'}`}></span>
               </span>
            )}
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Gemini EU Edition 🇪🇺</h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isModelSpeaking ? 'text-green-300' : 'text-[#FFCC00]'}`}>
               {getStatusText()}
            </p>
          </div>
        </div>
        
        {!isConnected && (
             <div className="flex bg-[#002266] p-1 rounded-full border border-[#FFCC00]/20">
                {(['chat', 'image', 'video'] as Mode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                            mode === m 
                            ? 'bg-[#FFCC00] text-[#003399] shadow-md transform scale-105' 
                            : 'text-blue-200 hover:text-white hover:bg-[#003399]'
                        }`}
                    >
                        {m}
                    </button>
                ))}
             </div>
        )}

        <div className="flex items-center gap-3">
             {isConnected && (
                 <button 
                    onClick={disconnect}
                    className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20"
                    title="End Session"
                 >
                    <StopIcon className="w-5 h-5" />
                 </button>
             )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[#002266] scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto space-y-6">
           {messages.length === 0 ? (
               <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 opacity-60">
                   <div className="w-24 h-24 rounded-full bg-[#002266] border-2 border-[#FFCC00]/50 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,204,0,0.15)]">
                       <MicIcon className="w-10 h-10 text-[#FFCC00]" />
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">GEMINI EU</h2>
                   <p className="text-blue-200/70 max-w-xs">Chat, Generate & Animate with European excellence.</p>
               </div>
           ) : (
               messages.map((msg) => (
                   <div key={msg.id} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                       {msg.role === 'model' ? <ModelIcon /> : <UserIcon />}
                       
                       <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                           <div className={`px-5 py-3 rounded-2xl shadow-md text-[15px] leading-relaxed relative border ${
                               msg.role === 'user' 
                               ? 'bg-[#0044CC] text-white border-[#0055FF] rounded-tr-none' 
                               : 'bg-white text-slate-900 border-slate-200 rounded-tl-none'
                           }`}>
                               {msg.media && (
                                   <div className="mb-3 rounded-lg overflow-hidden border border-black/10">
                                       {msg.media.type === 'image' && (
                                           <img 
                                             src={msg.media.url} 
                                             alt="Generated" 
                                             className="max-w-full h-auto" 
                                             onLoad={scrollToBottom}
                                           />
                                       )}
                                       {msg.media.type === 'video' && (
                                           <video src={msg.media.url} controls className="max-w-full h-auto" />
                                       )}
                                   </div>
                               )}
                               
                               {msg.text}

                               {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                                   <div className={`mt-3 pt-3 border-t flex flex-wrap gap-2 ${msg.role === 'user' ? 'border-white/20' : 'border-slate-200'}`}>
                                       {msg.groundingUrls.map((url, i) => (
                                           <a 
                                             key={i} 
                                             href={url.uri} 
                                             target="_blank" 
                                             rel="noreferrer"
                                             className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                                                msg.role === 'user' ? 'bg-blue-800 hover:bg-blue-900' : 'bg-slate-100 hover:bg-slate-200 text-blue-700'
                                             }`}
                                           >
                                               <span className="truncate max-w-[150px]">{url.title}</span>
                                           </a>
                                       ))}
                                   </div>
                               )}
                           </div>
                           <span className="text-[10px] text-blue-300/50 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                       </div>
                   </div>
               ))
           )}
           
           {isMultiLoading && (
               <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <ModelIcon />
                   <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-3">
                       {/* Animated Loader Icon based on mode */}
                       <div className="relative w-6 h-6 flex items-center justify-center">
                            {mode === 'chat' && (
                                <SparklesIcon className="w-5 h-5 text-blue-500 animate-pulse" />
                            )}
                            {mode === 'image' && (
                                <PhotoIcon className="w-5 h-5 text-purple-500 animate-pulse" />
                            )}
                            {mode === 'video' && (
                                <FilmIcon className="w-5 h-5 text-rose-500 animate-spin-slow" />
                            )}
                       </div>
                       
                       <div className="flex flex-col">
                           <span className="text-sm font-medium text-slate-700">
                                {mode === 'chat' && "Thinking..."}
                                {mode === 'image' && `Generating ${imageSize} Image...`}
                                {mode === 'video' && "Generating Video with Veo..."}
                           </span>
                           {mode === 'video' && (
                               <span className="text-[10px] text-slate-400">This may take a minute</span>
                           )}
                       </div>
                   </div>
               </div>
           )}

           <div ref={bottomRef} className="h-1" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 bg-[#002266]/90 backdrop-blur-md border-t border-[#FFCC00]/20">
          <div className="max-w-3xl mx-auto">
             <div className="relative flex flex-col gap-2 p-2 bg-[#003399] rounded-3xl border border-[#FFCC00]/30 ring-1 ring-white/5 focus-within:ring-[#FFCC00]/50 transition-all shadow-xl">
                {isConnected && (
                  <div className="absolute -top-16 left-0 right-0 flex justify-center pb-4 pointer-events-none">
                     <div className="w-48">
                        <AudioVisualizer isActive={isConnected} volume={volume} />
                     </div>
                  </div>
                )}
                
                {selectedFile && (
                    <div className="flex items-center justify-between px-4 py-2 bg-[#002266] rounded-xl mx-2 mt-2 border border-[#FFCC00]/30">
                        <span className="text-xs text-blue-200 truncate max-w-[200px]">{selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)} className="text-[#FFCC00] hover:text-white">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                             </svg>
                        </button>
                    </div>
                )}
                
                {mode === 'image' && !isConnected && (
                     <div className="flex items-center gap-2 px-4 pb-1">
                         <span className="text-xs text-[#FFCC00]">Size:</span>
                         <select 
                             value={imageSize} 
                             onChange={(e) => setImageSize(e.target.value)}
                             className="bg-[#002266] text-xs text-white rounded px-2 py-1 border border-[#FFCC00]/30 outline-none focus:ring-1 focus:ring-[#FFCC00]"
                         >
                             <option value="1K">1K</option>
                             <option value="2K">2K</option>
                             <option value="4K">4K</option>
                         </select>
                     </div>
                )}

                <div className="flex items-end gap-2">
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                     />
                     <button 
                        type="button"
                        disabled={isConnected} 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-full transition-colors ${isConnected ? 'text-blue-800 cursor-not-allowed' : 'text-[#FFCC00] hover:text-white hover:bg-[#002266]'}`}
                        title="Upload Image"
                     >
                        <PaperClipIcon />
                     </button>

                    <form onSubmit={handleSend} className="flex-1 flex items-center gap-2 py-2">
                        <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={
                              isConnected ? "Speak with Gemini..." : 
                              mode === 'image' ? "Describe the image..." :
                              mode === 'video' ? "Describe the video..." :
                              "Ask anything..."
                          }
                          className="flex-1 bg-transparent border-none outline-none text-white placeholder-blue-300/50 h-10"
                        />
                        <button 
                          type="submit"
                          disabled={(!inputText.trim() && !selectedFile) || isMultiLoading}
                          className="p-2 text-[#FFCC00] hover:text-white disabled:opacity-30 disabled:hover:text-[#FFCC00] transition-colors"
                        >
                          <SendIcon />
                        </button>
                    </form>

                    <div className="pr-2 pb-2">
                        {!isConnected ? (
                            <button 
                                onClick={connect}
                                className="w-12 h-12 rounded-full bg-[#FFCC00] text-[#003399] flex items-center justify-center hover:scale-105 hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
                                title="Start Live Voice"
                            >
                                <MicIcon />
                            </button>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 animate-pulse">
                                <MicIcon className="text-red-500" />
                            </div>
                        )}
                    </div>
                </div>
             </div>
             
             <div className="text-center mt-3">
                <span className="text-[10px] text-[#FFCC00]/80 font-bold tracking-widest uppercase">
                   Made by John J Slotz ™
                </span>
             </div>
          </div>
      </footer>
    </div>
  );
};

export default App;
