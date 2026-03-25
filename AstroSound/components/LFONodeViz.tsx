import React from 'react';
import type { SoundNode } from '../types';
import { useAppStore } from '../../store/appStore';

const WAVEFORM_PATHS: Record<string, string> = { 
    sine: 'M 0 50 C 25 5, 75 95, 100 50', 
    square: 'M 0 5 L 50 5 L 50 95 L 100 95', 
    sawtooth: 'M 0 95 L 100 5', 
    triangle: 'M 0 95 L 50 5 L 100 95', 
    noise: 'M 0 50 L 15 20 L 30 80 L 45 40 L 60 60 L 75 30 L 90 70 L 100 50' 
};

export const LFONodeViz: React.FC<{node: SoundNode}> = ({ node }) => {
    const soundNodeOutputs = useAppStore(state => state.soundNodeOutputs);
    const liveOutputValue = soundNodeOutputs[node.id]?.out ?? 0;
    const liveOutput = Array.isArray(liveOutputValue) ? (liveOutputValue[0] + liveOutputValue[1]) * 0.5 : liveOutputValue;
    const liveFreq = (soundNodeOutputs[node.id]?.frequency ?? node.params.frequency) as number;
    const liveAmp = (soundNodeOutputs[node.id]?.amplitude ?? node.params.amplitude) as number;
    const indicatorY = 50 - (liveOutput * 45);

    return (
        <div className="w-full h-28 bg-black/30 rounded-md p-2 mb-4 relative select-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
                <path d={WAVEFORM_PATHS[node.params.waveform] || WAVEFORM_PATHS.sine} stroke="#818cf8" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
                <circle cx="50" cy={indicatorY} r="3" fill="#facc15" stroke="#000" strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>
            </svg>
             <div className="absolute top-1 left-2 text-[10px] text-gray-400 font-mono">Rate: {liveFreq.toFixed(2)}Hz</div>
            <div className="absolute top-1 right-2 text-[10px] text-gray-400 font-mono">Amp: {liveAmp.toFixed(2)}</div>
        </div>
    );
};