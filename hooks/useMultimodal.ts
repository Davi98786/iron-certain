import { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';
import { fileToBase64 } from '../utils/file';
import { getFriendlyErrorMessage } from '../utils/errors';

interface UseMultimodalReturn {
  isLoading: boolean;
  generateContent: (
    prompt: string, 
    mode: 'chat' | 'image' | 'video', 
    file: File | null,
    imageSize: string
  ) => Promise<Message | null>;
  error: string | null;
  resetError: () => void;
}

export const useMultimodal = (): UseMultimodalReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);

  const generateContent = useCallback(async (
    prompt: string, 
    mode: 'chat' | 'image' | 'video',
    file: File | null,
    imageSize: string
  ): Promise<Message | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create new AI instance to ensure latest key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let message: Message | null = null;

      if (mode === 'chat') {
        // Standard Chat + Search + Image Editing (if file present)
        let response;
        if (file) {
          // Image Editing / Vision
          const base64Data = await fileToBase64(file);
          // Use gemini-2.5-flash-image for image editing/reasoning
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { mimeType: file.type, data: base64Data } },
                { text: prompt }
              ]
            }
          });
        } else {
          // Standard Text + Search
          // Use Gemini 2.5 Flash Lite for low-latency responses
          response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
        }

        const text = response.text || "I couldn't generate a text response.";
        const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
          .filter(Boolean);

        message = {
          id: Date.now().toString(),
          role: 'model',
          text,
          timestamp: new Date(),
          isComplete: true,
          groundingUrls: grounding,
        };
      } 
      else if (mode === 'image') {
        // Image Generation
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              imageSize: imageSize as any, 
              aspectRatio: '1:1'
            }
          }
        });

        // Extract image
        let imgUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imgUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imgUrl) {
          message = {
            id: Date.now().toString(),
            role: 'model',
            text: response.text || 'Image generated successfully',
            timestamp: new Date(),
            isComplete: true,
            media: {
              type: 'image',
              url: imgUrl,
              mimeType: 'image/png'
            }
          };
        } else {
           throw new Error("No image returned from API");
        }
      } 
      else if (mode === 'video') {
        // Veo Video Generation
        // Check for paid API key
        // @ts-ignore
        if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
            // @ts-ignore
           await window.aistudio.openSelectKey();
           // Re-instantiate to pick up new key
        }
        
        // Re-create AI with potentially new key context
        const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let operation;
        if (file) {
             const base64Data = await fileToBase64(file);
             operation = await veoAi.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt || "Animate this image",
                image: {
                    imageBytes: base64Data,
                    mimeType: file.type
                },
                config: {
                    numberOfVideos: 1,
                    aspectRatio: '16:9', // Or 9:16, picking 16:9 default
                    resolution: '720p'
                }
             });
        } else {
             operation = await veoAi.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    aspectRatio: '16:9',
                    resolution: '720p'
                }
             });
        }

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await veoAi.operations.getVideosOperation({ operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            // Fetch the actual bytes with the key
            const vidRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            const vidBlob = await vidRes.blob();
            const localUrl = URL.createObjectURL(vidBlob);
            
            message = {
                id: Date.now().toString(),
                role: 'model',
                text: 'Video generated successfully',
                timestamp: new Date(),
                isComplete: true,
                media: {
                    type: 'video',
                    url: localUrl,
                    mimeType: 'video/mp4'
                }
            };
        } else {
            throw new Error("Video generation failed. No video URI returned.");
        }
      }

      return message;

    } catch (e: any) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generateContent, isLoading, error, resetError };
};
