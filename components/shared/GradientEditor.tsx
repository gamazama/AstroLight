
import React, { useRef, useEffect } from 'react';
import type { GradientStop } from '../../types';
import { getGradientCssString } from '../../utils/colorUtils';
import { useAppStore } from '../../store/appStore';

interface GradientEditorProps {
    stops: GradientStop[];
    setStop: (id: string, position: number) => void;
    addStop: (position: number, color: string) => void;
    removeStop: (id: string) => void;
    openColorPicker: (id: string, event: React.MouseEvent, color: string) => void;
}

const GradientEditor: React.FC<GradientEditorProps> = ({ stops, setStop, addStop, removeStop, openColorPicker }) => {
    const barRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Left click drags, right click deletes
        if (e.button === 2) {
            if (stops.length > 2) {
                removeStop(id);
            }
            return;
        }

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!barRef.current) return;
            const rect = barRef.current.getBoundingClientRect();
            const rawX = moveEvent.clientX - rect.left;
            const position = Math.max(0, Math.min(1, rawX / rect.width));
            setStop(id, position);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleBarClick = (e: React.MouseEvent) => {
        // Only add stop if not clicking an existing thumb
        if ((e.target as HTMLElement).closest('.gradient-thumb')) return;
        if (!barRef.current) return;

        const rect = barRef.current.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        // Find approximate color at this position to initialize
        // (For now just default to white or interpolated? Simple white is fine)
        addStop(position, '#FFFFFF');
    };

    const sortedStops = [...stops].sort((a, b) => a.position - b.position);

    return (
        <div className="w-full py-2 relative select-none">
             <div 
                ref={barRef}
                className="h-6 w-full rounded-md cursor-copy relative border border-white/20"
                style={{ background: getGradientCssString(sortedStops) }}
                onMouseDown={handleBarClick}
            >
                {stops.map(stop => (
                    <div
                        key={stop.id}
                        className="gradient-thumb absolute top-0 h-full w-3 -ml-1.5 bg-white border-2 border-black rounded shadow-md cursor-ew-resize hover:scale-110 transition-transform z-10"
                        style={{ left: `${stop.position * 100}%`, backgroundColor: stop.color }}
                        onMouseDown={(e) => handleMouseDown(e, stop.id)}
                        onClick={(e) => { e.stopPropagation(); openColorPicker(stop.id, e, stop.color); }}
                        onContextMenu={(e) => { e.preventDefault(); if(stops.length > 2) removeStop(stop.id); }}
                        title="Drag to move. Click to change color. Right-click to remove."
                    />
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
            </div>
        </div>
    );
};

export default GradientEditor;
