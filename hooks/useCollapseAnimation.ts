
import React, { useState, useLayoutEffect, useRef } from 'react';
import { smoothEase, lerp } from '../utils/mathUtils';

const PANEL_ANIMATION_DURATION = 500; // ms

export const useCollapseAnimation = (isCollapsed: boolean, contentRef: React.RefObject<HTMLDivElement | null>) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        height: isCollapsed ? 0 : undefined,
        overflow: isCollapsed ? 'hidden' : undefined, // Initialize correctly based on prop
        flex: isCollapsed ? '0 0 auto' : undefined, // Initialize flex to prevent fighting if collapsed
    });
    const animationFrameRef = useRef<number | null>(null);
    const isInitialRender = useRef(true);

    useLayoutEffect(() => {
        const contentEl = contentRef.current;
        if (!contentEl) return;
        
        // On initial render, set correct state without animation.
        if (isInitialRender.current) {
            isInitialRender.current = false;
            setStyle({
                height: isCollapsed ? 0 : undefined,
                overflow: isCollapsed ? 'hidden' : undefined,
                flex: isCollapsed ? '0 0 auto' : undefined,
            });
            return;
        }
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const startHeight = contentEl.offsetHeight;
        let targetHeight = 0;
        if (!isCollapsed) { // expanding
            contentEl.style.height = 'auto'; // Temporarily set to auto to measure scroll height
            targetHeight = contentEl.scrollHeight;
            contentEl.style.height = `${startHeight}px`; // Set it back for animation start
        }

        const startTime = performance.now();

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / PANEL_ANIMATION_DURATION, 1);
            const easedProgress = smoothEase(progress, 'ease-in-out');

            const currentHeight = lerp(startHeight, targetHeight, easedProgress);
            
            // Crucially, keep overflow hidden and disable flex growth during animation
            setStyle({ 
                height: currentHeight, 
                overflow: 'hidden',
                flex: '0 0 auto' 
            });

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                if (!isCollapsed) {
                    // Animation finished (Expanded): remove inline styles so CSS takes over
                    setStyle({ height: undefined, overflow: undefined, flex: undefined });
                } else {
                    // Animation finished (Collapsed): Lock to 0 height
                    setStyle({ height: 0, overflow: 'hidden', flex: '0 0 auto' });
                }
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isCollapsed, contentRef]);

    return style;
};
