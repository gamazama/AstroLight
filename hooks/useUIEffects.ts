import React, { useEffect, useRef } from 'react';
import type { UIState } from '../types/uiState';
import type { VisualsState } from '../types/visuals';
import type { AppState } from '../types/state';
import type { Actions } from '../store/appStore';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

interface UIEffectsProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const useUIEffects = ({ canvasRef }: UIEffectsProps) => {
    const { ui, visuals, actions } = useAppStore(state => ({
        ui: state,
        visuals: state,
        actions: state.actions
    }), shallow);
    
    const { uiBackgroundOpacity, uiBlurAmount, isPerformanceMode } = ui;
    const { updateUI, updateVisuals } = actions;
    const prevBgSettingsRef = useRef({
        bg1: visuals.backgroundColor1,
        bg2: visuals.backgroundColor2,
        grad: visuals.useGradientBackground,
    });

    useEffect(() => {
        document.documentElement.style.setProperty('--ui-blur-amount', `${uiBlurAmount}px`);
        document.documentElement.style.setProperty('--ui-bg-opacity', `${uiBackgroundOpacity}`);
    }, [uiBlurAmount, uiBackgroundOpacity]);

    useEffect(() => {
        if (isPerformanceMode) {
            document.body.classList.add('performance-mode');
        } else {
            document.body.classList.remove('performance-mode');
        }
    }, [isPerformanceMode]);
    
    useEffect(() => {
        const { useGradientBackground, backgroundColor1, backgroundColor2, lineBlendMode } = visuals;
        const prevBg = prevBgSettingsRef.current;
    
        if (
            useGradientBackground !== prevBg.grad ||
            backgroundColor1 !== prevBg.bg1 ||
            backgroundColor2 !== prevBg.bg2
        ) {
            prevBgSettingsRef.current = {
                grad: useGradientBackground,
                bg1: backgroundColor1,
                bg2: backgroundColor2,
            };
    
            const hexToRgb = (hex: string): {r: number, g: number, b: number} | null => {
                if (!hex) return null;
                hex = hex.replace(/^#/, '');
                if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                if (hex.length !== 6) return null;
                const bigint = parseInt(hex, 16);
                return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
            };

            const getBrightness = (rgb: {r: number, g: number, b: number} | null) => {
                if (!rgb) return 0;
                return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
            };

            const rgb2 = hexToRgb(backgroundColor2);
            const brightness2 = getBrightness(rgb2);
            const isThemeLight = brightness2 > 160;

            if (isThemeLight) {
                document.body.classList.add('light-ui');
            } else {
                document.body.classList.remove('light-ui');
            }

            const newLabelColor = isThemeLight ? '#1a1f3a' : '#e0e6ed';
            updateVisuals({ labelColor: newLabelColor });
    
            let averageBrightness = 0;
            if (useGradientBackground) {
                const rgb1 = hexToRgb(backgroundColor1);
                if (rgb1 && rgb2) {
                    averageBrightness = (getBrightness(rgb1) + getBrightness(rgb2)) / 2;
                } else {
                    averageBrightness = getBrightness(rgb1 || rgb2);
                }
            } else {
                averageBrightness = brightness2;
            }
            
            const isBlendModeLight = averageBrightness > 160;
    
            if (isBlendModeLight !== (lineBlendMode === 'multiply')) {
                const newMode = isBlendModeLight ? 'multiply' : 'screen';
                updateVisuals({ lineBlendMode: newMode });
                actions.showNotification(`Auto-set blend mode to '${newMode}' for background`, 3000);
            }
        }
    }, [visuals.backgroundColor1, visuals.backgroundColor2, visuals.useGradientBackground, visuals.lineBlendMode, visuals.labelColor, updateVisuals, actions.showNotification]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            let cursor = visuals.isBrushMode ? 'none' : (ui.hoveredPlanetId ? 'crosshair' : 'grab');
            if (ui.isSpeedScrubbing) {
                cursor = 'all-scroll';
            } else if (ui.isZOffsetScrubbing || ui.isFovScrubbing) {
                cursor = 'ns-resize';
            } else if (ui.isDriftScrubbing) {
                cursor = visuals.lineDriftAxis === 'x' ? 'ew-resize' : 'ns-resize';
            }
            canvas.style.cursor = cursor;
        }
    }, [visuals.isBrushMode, ui.hoveredPlanetId, ui.isSpeedScrubbing, ui.isZOffsetScrubbing, ui.isDriftScrubbing, ui.isFovScrubbing, visuals.lineDriftAxis, canvasRef]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            updateUI({ mousePosition: { x: e.clientX, y: e.clientY } });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [updateUI]);

    const animationFrameRef = useRef<number | null>(null);
    const isScrubbingActive = ui.isSpeedScrubbing || ui.isZOffsetScrubbing || ui.isDriftScrubbing || ui.isFovScrubbing;

    useEffect(() => {
        const runUpdate = () => {
            actions.updateScrub();
            animationFrameRef.current = requestAnimationFrame(runUpdate);
        };
        
        if (isScrubbingActive) {
            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(runUpdate);
            }
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isScrubbingActive, actions]);
};