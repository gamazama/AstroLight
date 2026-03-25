import React, { useState, useEffect, useRef } from 'react';
import { smoothEase, lerp } from '../utils/mathUtils';

const PANEL_ANIMATION_DURATION = 500; // ms

type Direction = 'up' | 'down';

export const useSlideInAnimation = (isCollapsed: boolean, direction: Direction, isCenteredX: boolean = false) => {
    const initialPos = isCollapsed ? 1 : 0;
    
    const getTransform = (pos: number) => {
        const translateProp = 'translateY';
        const multiplier = direction === 'up' ? 1 : -1;
        
        let transformString = '';
        if (isCenteredX) {
            transformString += 'translateX(-50%) ';
        }
        transformString += `${translateProp}(calc(${pos * multiplier * 100}% + ${pos * multiplier * 20}px))`;
        
        return transformString;
    };

    const [style, setStyle] = useState<React.CSSProperties>({
        transform: getTransform(initialPos),
    });

    const animationFrameRef = useRef<number | null>(null);
    const animationStartPosRef = useRef(initialPos);
    const prevIsCollapsed = useRef(isCollapsed);

    useEffect(() => {
        if (prevIsCollapsed.current === isCollapsed) return;
        
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        const startTime = performance.now();
        const startPos = animationStartPosRef.current;
        const endPos = isCollapsed ? 1 : 0; // 1 is hidden, 0 is visible

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / PANEL_ANIMATION_DURATION, 1);
            const easedProgress = smoothEase(progress, 'ease-out');

            const currentPos = lerp(startPos, endPos, easedProgress);
            animationStartPosRef.current = currentPos;

            setStyle({ transform: getTransform(currentPos) });

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        prevIsCollapsed.current = isCollapsed;

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isCollapsed, direction, isCenteredX]);

    return style;
};
