import React, { useState, useLayoutEffect, useRef } from 'react';

interface UIGuidePulseProps {
    targetId: string;
    onComplete: () => void;
    loop?: boolean;
}

const UIGuidePulse: React.FC<UIGuidePulseProps> = ({ targetId, onComplete, loop = false }) => {
    const pulseRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: 100,
        borderRadius: '50%',
        border: '2px solid rgba(102, 126, 234, 0.8)',
    });

    useLayoutEffect(() => {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) {
            // If the element can't be found, complete immediately to clean up.
            onComplete();
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5; // Make pulse larger than element

        setStyle(prev => ({
            ...prev,
            top: rect.top + rect.height / 2,
            left: rect.left + rect.width / 2,
            width: size,
            height: size,
            transform: 'translate(-50%, -50%)',
            visibility: 'visible',
        }));

        const pulseElement = pulseRef.current;
        if (pulseElement && !loop) {
            const handleAnimationEnd = () => {
                onComplete();
            };
            pulseElement.addEventListener('animationend', handleAnimationEnd);
            return () => {
                pulseElement.removeEventListener('animationend', handleAnimationEnd);
            };
        }
    }, [targetId, onComplete, loop]);

    return (
        <>
            <style>
                {`
                    @keyframes pulse-ring {
                        0% {
                            transform: translate(-50%, -50%) scale(0.8);
                            opacity: 1;
                            box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
                        }
                        80% {
                            transform: translate(-50%, -50%) scale(1.5);
                            opacity: 0;
                            box-shadow: 0 0 0 15px rgba(102, 126, 234, 0);
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(1.5);
                            opacity: 0;
                        }
                    }
                `}
            </style>
            <div
                ref={pulseRef}
                style={{
                    ...style,
                    animation: `pulse-ring 1s cubic-bezier(0.215, 0.61, 0.355, 1) ${loop ? 'infinite' : '3'}`,
                }}
            />
        </>
    );
};

export default UIGuidePulse;