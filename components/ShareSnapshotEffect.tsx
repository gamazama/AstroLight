import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { cubicBezier, smoothEase } from '../utils/mathUtils';

const HORIZONTAL_DURATION = 600; // ms
const VERTICAL_DURATION = 600; // ms
const VERTICAL_OFFSET = 200; // ms
const TOTAL_DURATION = VERTICAL_OFFSET + VERTICAL_DURATION;

// Horizontal motion: 60% strength at beginning, 80% at end. (Weaker ease-in, stronger ease-out)
const horizontalEase = cubicBezier(0.6, 0, 0.2, 1);

// Vertical motion: 80% strength at beginning, 60% at end. (Stronger ease-in, weaker ease-out)
const verticalEase = cubicBezier(0.8, 0, 0.4, 1);


const ShareSnapshotEffect: React.FC = () => {
    const { shareSnapshotEffect, clearShareSnapshotEffect } = useAppStore(state => ({
        shareSnapshotEffect: state.shareSnapshotEffect,
        clearShareSnapshotEffect: state.actions.clearShareSnapshotEffect,
    }), shallow);

    const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' });
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (shareSnapshotEffect) {
            const { startTime } = shareSnapshotEffect;

            const shareButton = document.getElementById('share-button');
            if (!shareButton) {
                clearShareSnapshotEffect();
                return;
            }
            const rect = shareButton.getBoundingClientRect();
            const targetX = rect.left + rect.width / 2;
            const targetWidth = rect.width;

            const animate = (time: number) => {
                const elapsed = time - startTime;

                // Opacity fades over the total duration.
                const totalProgress = Math.min(elapsed / TOTAL_DURATION, 1);
                const opacity = 0.3 * (1 - totalProgress * totalProgress);

                let currentScaleX = 1.0;
                let currentTranslateX = 0;
                let currentScaleY = 1.0;

                // --- Phase 1: Horizontal Animation (0ms to 800ms) ---
                if (elapsed <= HORIZONTAL_DURATION) {
                    const progress = smoothEase(elapsed / HORIZONTAL_DURATION, horizontalEase);
                    currentScaleX = 1 - (1 - (targetWidth / window.innerWidth)) * progress;
                    currentTranslateX = (targetX - (window.innerWidth / 2)) * progress;
                } else {
                    // Animation is complete for this phase, snap to final state.
                    currentScaleX = targetWidth / window.innerWidth;
                    currentTranslateX = targetX - (window.innerWidth / 2);
                }

                // --- Phase 2: Vertical Animation (starts at 300ms, duration 800ms) ---
                if (elapsed > VERTICAL_OFFSET) {
                    const verticalElapsed = elapsed - VERTICAL_OFFSET;
                    const progress = smoothEase(Math.min(verticalElapsed / VERTICAL_DURATION, 1), verticalEase);
                    currentScaleY = 1 - progress;
                }

                setStyle({
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'white',
                    pointerEvents: 'none',
                    zIndex: 5, // Place it above the canvas but below the UI panels.
                    opacity,
                    transform: `translateX(${currentTranslateX}px) scaleX(${currentScaleX}) scaleY(${currentScaleY})`,
                    transformOrigin: `center top`, // Scale horizontally from center, vertically from top.
                });

                if (elapsed < TOTAL_DURATION) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    clearShareSnapshotEffect();
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);

        } else {
            setStyle({ display: 'none' });
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [shareSnapshotEffect, clearShareSnapshotEffect]);

    return <div style={style} />;
};

export default ShareSnapshotEffect;