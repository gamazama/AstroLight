import React, { useMemo } from 'react';
import type { SoundNode } from '../types';
import { useAppStore } from '../../store/appStore';

interface FilterNodeVizProps {
    node: SoundNode;
}

const FilterNodeViz: React.FC<FilterNodeVizProps> = ({ node }) => {
    const soundNodeOutputs = useAppStore(state => state.soundNodeOutputs);

    // Use the live cutoff value from the audio thread if available, otherwise fallback to the static param.
    const liveCutoff = soundNodeOutputs[node.id]?.cutoff ?? node.params.cutoff;

    const { type, q: Q, gain: gainDb, slope } = node.params;
    const sampleRate = 48000; // Assume a standard sample rate for visualization
    const numPoints = 128; // Number of points to calculate for the curve

    const curvePath = useMemo(() => {
        const pathData: [number, number][] = [];
        
        // --- Calculate Filter Coefficients (once per curve render) ---
        const w0_cutoff = 2 * Math.PI * liveCutoff / sampleRate;
        const cos_w0_cutoff = Math.cos(w0_cutoff);
        const sin_w0_cutoff = Math.sin(w0_cutoff);
        const alpha = sin_w0_cutoff / (2 * Q);
        const A = Math.pow(10, gainDb / 40);

        let b0 = 0, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;
        
        // Coefficient calculation from BiquadFilter.setParams
        switch (type) {
            case 'lowpass': b0=(1-cos_w0_cutoff)/2; b1=1-cos_w0_cutoff; b2=(1-cos_w0_cutoff)/2; a0=1+alpha; a1=-2*cos_w0_cutoff; a2=1-alpha; break;
            case 'highpass': b0=(1+cos_w0_cutoff)/2; b1=-(1+cos_w0_cutoff); b2=(1+cos_w0_cutoff)/2; a0=1+alpha; a1=-2*cos_w0_cutoff; a2=1-alpha; break;
            case 'bandpass': b0=alpha; b1=0; b2=-alpha; a0=1+alpha; a1=-2*cos_w0_cutoff; a2=1-alpha; break;
            case 'notch': b0=1; b1=-2*cos_w0_cutoff; b2=1; a0=1+alpha; a1=-2*cos_w0_cutoff; a2=1-alpha; break;
            case 'peaking': b0=1+alpha*A; b1=-2*cos_w0_cutoff; b2=1-alpha*A; a0=1+alpha/A; a1=-2*cos_w0_cutoff; a2=1-alpha/A; break;
            case 'lowshelf': b0=A*((A+1)-(A-1)*cos_w0_cutoff+2*Math.sqrt(A)*alpha); b1=2*A*((A-1)-(A+1)*cos_w0_cutoff); b2=A*((A+1)-(A-1)*cos_w0_cutoff-2*Math.sqrt(A)*alpha); a0=(A+1)+(A-1)*cos_w0_cutoff+2*Math.sqrt(A)*alpha; a1=-2*((A-1)+(A+1)*cos_w0_cutoff); a2=(A+1)+(A-1)*cos_w0_cutoff-2*Math.sqrt(A)*alpha; break;
            case 'highshelf': b0=A*((A+1)+(A-1)*cos_w0_cutoff+2*Math.sqrt(A)*alpha); b1=-2*A*((A-1)+(A+1)*cos_w0_cutoff); b2=A*((A+1)+(A-1)*cos_w0_cutoff-2*Math.sqrt(A)*alpha); a0=(A+1)-(A-1)*cos_w0_cutoff+2*Math.sqrt(A)*alpha; a1=2*((A-1)-(A+1)*cos_w0_cutoff); a2=(A+1)-(A-1)*cos_w0_cutoff-2*Math.sqrt(A)*alpha; break;
        }

        for (let i = 0; i <= numPoints; i++) {
            // Logarithmic frequency scale from 20Hz to 20kHz
            const freq = 20 * Math.pow(1000, i / numPoints); 
            
            const w = 2 * Math.PI * freq / sampleRate;
            // Using the formula for |H(w)|^2 to get magnitude without complex math
            const phi = Math.pow(Math.sin(w/2), 2);
            const numerator = Math.pow(b0+b1+b2, 2) - 4*(b0*b1 + 4*b0*b2 + b1*b2)*phi + 16*b0*b2*phi*phi;
            const denominator = Math.pow(a0+a1+a2, 2) - 4*(a0*a1 + 4*a0*a2 + a1*a2)*phi + 16*a0*a2*phi*phi;
            
            let mag = denominator > 0 ? Math.sqrt(numerator / denominator) : 0;
            if (slope === '24db' && (type === 'lowpass' || type === 'highpass')) mag = mag * mag;
            
            const db = 20 * Math.log10(mag || 1e-6); // Use a small floor to prevent log(0)
            
            // Map to SVG coordinates
            const x = (Math.log10(freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * 100;
            const y = 50 - (db / 48) * 50; // Map -48dB to +48dB range to 0-100% height
            pathData.push([x, Math.max(0, Math.min(100, y))]);
        }
        return pathData.map((p, i) => (i === 0 ? 'M' : 'L') + `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    }, [type, Q, gainDb, slope, liveCutoff]);

    // Helper to map a frequency to its X coordinate on the log scale
    const freqToX = (freq: number) => {
        const clampedFreq = Math.max(20, Math.min(20000, freq));
        return (Math.log10(clampedFreq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * 100;
    }

    const cutoffX = freqToX(liveCutoff);
    const gridLines = [100, 1000, 10000];

    return (
        <div className="w-full h-32 bg-black/30 rounded-md p-2 mb-4 relative">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid */}
                {gridLines.map(freq => (
                    <line key={freq} x1={freqToX(freq)} y1="0" x2={freqToX(freq)} y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                ))}
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

                {/* Response Curve */}
                <path d={curvePath} stroke="#667eea" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
                
                {/* Cutoff Marker Line */}
                <line x1={cutoffX} y1="0" x2={cutoffX} y2="100" stroke="rgba(255, 193, 7, 0.5)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* Labels */}
            <div className="absolute -bottom-1 left-1 text-[8px] text-gray-500">20Hz</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-gray-500">1kHz</div>
            <div className="absolute -bottom-1 right-1 text-[8px] text-gray-500">20kHz</div>
            <div className="absolute top-1 left-2 text-[8px] text-gray-500">+24dB</div>
            <div className="absolute bottom-1 left-2 text-[8px] text-gray-500">-24dB</div>
        </div>
    );
};

export default FilterNodeViz;