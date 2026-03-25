import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

interface OscilloscopeNodeVizProps {
    nodeId: string;
    timeScale: number;
    triggerLevel: number;
}

const OscilloscopeNodeViz: React.FC<OscilloscopeNodeVizProps> = ({ nodeId, timeScale, triggerLevel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const data = useAppStore(state => state.oscilloscopeData[nodeId], shallow);
    const autoTrigger = useAppStore(state => state.graph.nodes.find(n => n.id === nodeId)?.params.autoTrigger);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;

        // --- Background ---
        ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // --- Graticule (Grid) ---
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Dashed Quarter lines
        ctx.setLineDash([2, 2]);
        ctx.moveTo(width / 4, 0); ctx.lineTo(width / 4, height);
        ctx.moveTo(width * 3 / 4, 0); ctx.lineTo(width * 3 / 4, height);
        ctx.moveTo(0, height / 4); ctx.lineTo(width, height / 4);
        ctx.moveTo(0, height * 3 / 4); ctx.lineTo(width, height * 3 / 4);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Solid Center lines
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.beginPath();
        ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
        ctx.moveTo(0, midY); ctx.lineTo(width, midY); // The "0" Line
        ctx.stroke();


        // --- Trigger Level Indicator ---
        if (!autoTrigger) {
            const triggerY = midY - (triggerLevel * midY);
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)'; // yellow-400
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, triggerY);
            ctx.lineTo(width, triggerY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (!data) return;

        // --- Waveform Drawing ---
        ctx.save();
        
        // Glow effect
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        
        // Main waveform line
        ctx.strokeStyle = '#67e8f9'; // cyan-300
        ctx.lineWidth = 2;
        ctx.beginPath();

        const zoomFactor = Math.max(1, timeScale);
        const bufferLength = data.length;
        const samplesToDraw = Math.floor(bufferLength / zoomFactor);
        const startSample = Math.floor((bufferLength - samplesToDraw) / 2);
        
        let firstX = -1, firstY = -1;

        for (let i = 0; i < samplesToDraw; i++) {
            const sampleIndex = startSample + i;
            if (sampleIndex >= bufferLength) break;
            
            const x = (i / (samplesToDraw - 1)) * width;
            const value = Math.max(-1, Math.min(1, data[sampleIndex] || 0));
            const y = midY - (value * midY);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.restore();

    }, [data, timeScale, triggerLevel, autoTrigger]);

    return (
        <canvas
            ref={canvasRef}
            width="264" // 280 (node width) - 16 (padding)
            height="120"
            className="rounded-md"
        />
    );
};

export default OscilloscopeNodeViz;