

import React, { useState, useEffect, useLayoutEffect } from 'react';
import type { ConnectionLineInfo } from '../types/common';

interface ConnectionLineProps {
    info: ConnectionLineInfo;
    onAnimationEnd: () => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ info, onAnimationEnd }) => {
    const { startX, startY, endX, endY, status, fromTargetId, toTargetId } = info;

    // We use a single state for the path's 'd' attribute. This makes it easy
    // to apply a CSS transition to morph the entire path at once.
    const [pathD, setPathD] = useState(`M ${startX} ${startY} L ${endX} ${endY}`);

    // Update the path when drawing (as the mouse is moving)
    useEffect(() => {
        if (status === 'drawing') {
            setPathD(`M ${startX} ${startY} L ${endX} ${endY}`);
        }
    }, [startX, startY, endX, endY, status]);

    // On success, calculate the final path and set it, letting CSS handle the animation.
    useLayoutEffect(() => {
        if (status === 'success' && fromTargetId && toTargetId) {
            const fromElement = document.getElementById(fromTargetId);
            const toElement = document.getElementById(toTargetId);

            if (fromElement && toElement) {
                const fromRect = fromElement.getBoundingClientRect();
                const toRect = toElement.getBoundingClientRect();
                
                const finalStartX = fromRect.right;
                const finalStartY = fromRect.top + fromRect.height / 2;
                const finalEndX = toRect.left;
                const finalEndY = toRect.top + toRect.height / 2;
                
                // Set the final path string, which will trigger the animation
                setPathD(`M ${finalStartX} ${finalStartY} L ${finalEndX} ${finalEndY}`);
            } else {
                 // Fallback: if elements aren't found, just fade out
                 setTimeout(() => onAnimationEnd(), 300);
            }
        }
    }, [status, fromTargetId, toTargetId, onAnimationEnd]);
    
    const handleTransitionEnd = (e: React.TransitionEvent<SVGSVGElement>) => {
        // Cleanup happens when the fade-out completes
        if (e.propertyName === 'opacity' && parseFloat(e.currentTarget.style.opacity) === 0) {
             onAnimationEnd();
        }
    };

    const isFading = status === 'fail' || status === 'success';
    
    // Animate the 'd' attribute on success. Fade out on fail or after success animation.
    const svgStyle: React.CSSProperties = {
        opacity: isFading ? 0 : 1,
        transition: status === 'fail' 
            ? 'opacity 0.3s ease-out' 
            : 'opacity 0.2s ease-in 0.4s', // Fade out after animation
    };

    const pathStyle: React.CSSProperties = {
        // The 'd' property can be transitioned, allowing smooth path morphing.
        transition: status === 'success' ? 'd 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    };

    return (
        <svg
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100]"
            style={svgStyle}
            onTransitionEnd={handleTransitionEnd}
        >
            <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#764ba2', stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path
                d={pathD}
                stroke="url(#line-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                style={pathStyle}
            />
        </svg>
    );
};
export default ConnectionLine;