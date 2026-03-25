import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import type { PlanetConnectionDragInfo } from '../types';

// Custom hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const PlanetConnectionLine: React.FC = () => {
    const dragInfo = useAppStore(state => state.planetConnectionDragInfo, shallow);
    const prevDragInfo = usePrevious(dragInfo);
    
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [pathD, setPathD] = useState('');
    const [swatchStyle, setSwatchStyle] = useState<React.CSSProperties>({});
    
    useEffect(() => {
        if (dragInfo) {
            // State: A connection is actively being dragged or in click-mode.
            // Action: Make the line visible and update its path and swatch position.
            setIsVisible(true);
            setIsExiting(false);
            
            const { startX, startY, currentX, currentY, fromNodeColor } = dragInfo;
            const controlPointOffset = Math.max(30, Math.abs(currentX - startX) * 0.4);
            const newPathD = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${currentX - controlPointOffset} ${currentY}, ${currentX} ${currentY}`;
            setPathD(newPathD);

            setSwatchStyle({
                top: startY,
                left: startX,
                backgroundColor: fromNodeColor,
                opacity: 1,
            });

        } else if (!dragInfo && prevDragInfo) {
            // State: The connection has just been cancelled.
            // Action: Start the exit animation for both line and swatch.
            setIsExiting(true);
            const { startX, startY } = prevDragInfo;
            const collapsedPathD = `M ${startX} ${startY} C ${startX} ${startY}, ${startX} ${startY}, ${startX} ${startY}`;
            setPathD(collapsedPathD);
            setSwatchStyle(prev => ({ ...prev, opacity: 0 }));
        }
    }, [dragInfo, prevDragInfo]);

    const handleTransitionEnd = (e: React.TransitionEvent<SVGSVGElement>) => {
        if (isExiting && e.propertyName === 'opacity' && e.target === e.currentTarget) {
            setIsVisible(false);
            setIsExiting(false);
        }
    };

    const opacity = isVisible && !isExiting ? 1 : 0;
    const pathTransition = isExiting ? 'd 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
    const svgTransition = isExiting ? 'opacity 0.2s ease-out' : 'opacity 0.15s ease-in';

    if (!isVisible && !isExiting) return null;

    return (
        <>
            <svg
                className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100]"
                style={{ opacity, transition: svgTransition }}
                onTransitionEnd={handleTransitionEnd}
            >
                <defs>
                    <linearGradient id="planet-connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
            <path
                d={pathD}
                stroke="url(#planet-connection-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                style={{ filter: 'url(#glow)', transition: pathTransition }}
            />
            </svg>
            {(isVisible || isExiting) && (
                <div
                    className="fixed w-4 h-4 rounded-full pointer-events-none"
                    style={{
                        transform: 'translate(-50%, -50%)',
                        zIndex: 101,
                        transition: 'opacity 0.2s ease-out',
                        ...swatchStyle
                    }}
                />
            )}
        </>
    );
};
export default PlanetConnectionLine;