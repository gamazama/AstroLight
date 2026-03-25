
import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { SoundNode } from '../types';
import { useAppStore } from '../../store/appStore';

interface Point {
    x: number; // 0 to 1
    y: number; // -1 to 1
}

interface CurveNodeVizProps {
    node: SoundNode;
}

const CurveNodeViz: React.FC<CurveNodeVizProps> = ({ node }) => {
    const { updateNodeParam, soundNodeOutputs } = useAppStore(state => ({
        updateNodeParam: state.actions.updateNodeParam,
        soundNodeOutputs: state.soundNodeOutputs,
    }));

    const points: Point[] = node.params.points || [{x:0, y:0}, {x:1, y:0}];
    const interpolation = node.params.interpolation || 'linear';
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [ghostPoint, setGhostPoint] = useState<Point | null>(null);

    // Live playhead visualization
    const livePhase = (soundNodeOutputs[node.id]?.phase ?? 0) as number;
    const playheadX = (livePhase % 1.0) * 100;

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        e.stopPropagation(); // Prevent node dragging
        setDraggingIndex(index);
    };

    const handleBackgroundMouseMove = (e: React.MouseEvent) => {
        if (draggingIndex !== null || !containerRef.current) {
            setGhostPoint(null);
            return;
        }
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const valY = (y * 2) - 1;
        
        setGhostPoint({ x, y: valY });
    };

    const handleBackgroundLeave = () => {
        setGhostPoint(null);
    };

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (draggingIndex !== null) return;
        e.stopPropagation();

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)); // Invert Y for display (0 at bottom)
        const valY = (y * 2) - 1; // Map 0..1 to -1..1

        const newPoints = [...points, { x, y: valY }].sort((a, b) => a.x - b.x);
        updateNodeParam(node.id, 'points', newPoints);
    };

    const handlePointDelete = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        e.preventDefault();
        // Cannot delete start or end points
        if (index === 0 || index === points.length - 1) return;

        const newPoints = points.filter((_, i) => i !== index);
        updateNodeParam(node.id, 'points', newPoints);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (draggingIndex === null || !containerRef.current) return;
            
            const rect = containerRef.current.getBoundingClientRect();
            const rawX = (e.clientX - rect.left) / rect.width;
            const rawY = 1 - (e.clientY - rect.top) / rect.height;
            
            let newX = Math.max(0, Math.min(1, rawX));
            const newY = Math.max(-1, Math.min(1, (rawY * 2) - 1));

            // Constrain X based on neighbors
            if (draggingIndex === 0) newX = 0;
            else if (draggingIndex === points.length - 1) newX = 1;
            else {
                const prevX = points[draggingIndex - 1].x + 0.01;
                const nextX = points[draggingIndex + 1].x - 0.01;
                newX = Math.max(prevX, Math.min(nextX, newX));
            }

            const newPoints = [...points];
            newPoints[draggingIndex] = { x: newX, y: newY };
            updateNodeParam(node.id, 'points', newPoints);
        };

        const handleMouseUp = () => {
            setDraggingIndex(null);
        };

        if (draggingIndex !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingIndex, points, node.id, updateNodeParam]);


    // Generate Path Data
    const pathD = useMemo(() => {
        if (points.length < 2) return '';
        
        let d = `M ${points[0].x * 100} ${50 - (points[0].y * 50)}`;
        
        if (interpolation === 'step') {
            for (let i = 0; i < points.length - 1; i++) {
                const curr = points[i];
                const next = points[i+1];
                const currY = 50 - (curr.y * 50);
                const nextX = next.x * 100;
                // Horizontal line to next X, then Vertical
                d += ` L ${nextX} ${currY} L ${nextX} ${50 - (next.y * 50)}`;
            }
        } else if (interpolation === 'smooth') {
            // Simple spline or cosine interp approximation using Bezier
             for (let i = 0; i < points.length - 1; i++) {
                const curr = points[i];
                const next = points[i+1];
                
                const currX = curr.x * 100;
                const currY = 50 - (curr.y * 50);
                const nextX = next.x * 100;
                const nextY = 50 - (next.y * 50);
                
                const midX = (currX + nextX) / 2;
                
                // Control points for "S" shape
                d += ` C ${midX} ${currY}, ${midX} ${nextY}, ${nextX} ${nextY}`;
            }
        } else {
            // Linear
            for (let i = 1; i < points.length; i++) {
                d += ` L ${points[i].x * 100} ${50 - (points[i].y * 50)}`;
            }
        }
        return d;
    }, [points, interpolation]);

    return (
        <div 
            className="w-full h-32 bg-black/40 rounded-md p-0 relative border border-white/5 cursor-crosshair select-none overflow-hidden" 
            ref={containerRef}
            onMouseDown={handleBackgroundClick}
            onMouseMove={handleBackgroundMouseMove}
            onMouseLeave={handleBackgroundLeave}
        >
            {/* SVG Layer for Lines */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
                {/* Zero Line */}
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

                {/* Curve */}
                <path d={pathD} stroke="#22d3ee" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                
                {/* Fill area under curve */}
                <path d={`${pathD} L 100 100 L 0 100 Z`} fill="rgba(34, 211, 238, 0.1)" stroke="none" />
                
                {/* Playhead */}
                <line x1={playheadX} y1="0" x2={playheadX} y2="100" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* Interactive HTML Layer for Handles */}
            {points.map((p, i) => {
                const top = `${50 - (p.y * 50)}%`;
                const left = `${p.x * 100}%`;
                const isEndpoint = i === 0 || i === points.length - 1;
                const isInteractable = hoveredIndex === i || draggingIndex === i;
                
                return (
                    <div
                        key={i}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                        style={{ top, left, zIndex: 10 }}
                        onMouseDown={(e) => handleMouseDown(e, i)}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onDoubleClick={(e) => handlePointDelete(e, i)}
                        onContextMenu={(e) => handlePointDelete(e, i)}
                    >
                        {/* Invisible larger hit area */}
                        <div className="w-6 h-6 bg-transparent" />
                        
                        {/* Visible Handle */}
                        <div 
                            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-sm transition-transform duration-100 ${isInteractable ? 'scale-125 ring-2 ring-white/50' : 'scale-100'}`}
                            style={{ 
                                backgroundColor: isEndpoint ? '#facc15' : '#ffffff',
                                cursor: 'grab',
                            }}
                        />
                    </div>
                );
            })}

            {/* Ghost Point Preview */}
            {ghostPoint && draggingIndex === null && (
                 <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/30 border border-white/50 pointer-events-none"
                    style={{ 
                        top: `${50 - (ghostPoint.y * 50)}%`, 
                        left: `${ghostPoint.x * 100}%` 
                    }}
                />
            )}
        </div>
    );
};

export default CurveNodeViz;
