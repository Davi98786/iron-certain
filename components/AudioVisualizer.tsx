import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let phase = 0;
    
    const render = () => {
      // Resize
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Clear
      ctx.clearRect(0, 0, width, height);
      
      if (!isActive) return;
      
      const centerY = height / 2;
      const baseAmplitude = 5;
      const amplitude = Math.max(baseAmplitude, volume * (height / 1.5)); 
      
      // EU Theme: Official Golden Yellow (#FFCC00) with transparency
      const colors = ['rgba(255, 204, 0, 0.4)', 'rgba(255, 204, 0, 0.7)', 'rgba(255, 204, 0, 1)'];
      
      colors.forEach((color, i) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + i;
        ctx.lineCap = 'round';
        
        const offset = i * 15; // Phase shift
        
        for (let x = 0; x < width; x++) {
          // Envelope to taper ends
          const envelope = Math.sin((x / width) * Math.PI); 
          const y = centerY + Math.sin((x * 0.05) + phase + offset) * amplitude * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      
      phase += 0.15 + (volume * 0.1); 
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, volume]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-12 rounded-full"
    />
  );
};

export default AudioVisualizer;