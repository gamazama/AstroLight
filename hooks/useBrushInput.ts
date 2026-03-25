import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import type { Line } from '../types/index';
import { project2D } from './renderer/calculations';
import { hexToRgb, rgbToHex, lerpRGB } from '../utils/colorUtils';
import { distToSegmentSq } from '../utils/geometryUtils';
import { useAppStore } from '../store/appStore';
import { BRUSH_SIZE_MAX, BRUSH_SIZE_MIN } from '../constants';

export const useBrushInput = (
    canvasRef: React.RefObject<HTMLCanvasElement>
) => {
    const { updateSimulation, updateVisuals } = useAppStore.getState().actions;

    const isPainting = useRef(false);
    const isResizing = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | null>(null);
    const colorUpdatesMap = useRef(new Map<number, string>());
    
    const paint = useCallback(() => {
        const s = useAppStore.getState();
        const canvas = canvasRef.current;
        if (!isPainting.current || !s.isBrushMode || !canvas) return;

        const { brushColor, brushSize, brushStrength, lineHistory } = s;
        const brushColorRgb = hexToRgb(brushColor);
        if (!brushColorRgb) return;

        const mousePos = lastMousePos.current;
        
        colorUpdatesMap.current.clear();
        let changed = false;

        for (const line of lineHistory) {
            // Lines without an ID (e.g., from older presets) cannot be painted.
            if (line.id === undefined) continue;

            const fromProj = project2D(line.from, canvas, s);
            const toProj = project2D(line.to, canvas, s);
            if (fromProj.behind || toProj.behind) continue;
            
            const dist = Math.sqrt(distToSegmentSq(mousePos, fromProj, toProj));

            const influence = Math.max(0, 1 - dist / brushSize);
            if (influence > 0) {
                const oldColorRgb = hexToRgb(line.color);
                if (oldColorRgb) {
                    const newRgb = lerpRGB(oldColorRgb, brushColorRgb, brushStrength * influence);
                    const newHex = rgbToHex(newRgb);
                    if (line.color !== newHex) {
                        colorUpdatesMap.current.set(line.id, newHex);
                        changed = true;
                    }
                }
            }
        }
        
        if (changed) {
            const currentLineHistory = useAppStore.getState().lineHistory;
            const updates = colorUpdatesMap.current;
            const newLineHistory = currentLineHistory.map((line: Line) => {
                if (updates.has(line.id)) {
                    return { ...line, color: updates.get(line.id)! };
                }
                return line;
            });
            updateSimulation({ lineHistory: newLineHistory });
        }

        animationFrameRef.current = requestAnimationFrame(paint);
    }, [canvasRef, updateSimulation]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onMouseDown = (e: MouseEvent) => {
            if (!useAppStore.getState().isBrushMode) return;
            
            if (e.button === 0 && !e.altKey) { // Left-click, not while rotating
                e.preventDefault();
                isPainting.current = true;
                lastMousePos.current = { x: e.clientX, y: e.clientY };
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = requestAnimationFrame(paint);
            } else if (e.button === 1) { // Middle-click
                e.preventDefault();
                isResizing.current = true;
            }
        };
        
        const onMouseMove = (e: MouseEvent) => {
            if (isPainting.current) {
                lastMousePos.current = { x: e.clientX, y: e.clientY };
            }
            if (isResizing.current) {
                const newSize = Math.max(BRUSH_SIZE_MIN, Math.min(BRUSH_SIZE_MAX, useAppStore.getState().brushSize + e.movementX));
                updateVisuals({ brushSize: newSize });
            }
        };

        const onMouseUp = (e: MouseEvent) => {
            if (isPainting.current) {
                isPainting.current = false;
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            }
            if (isResizing.current) {
                isResizing.current = false;
            }
        };

        const onContextMenu = (e: MouseEvent) => {
            if (isResizing.current) e.preventDefault();
        };

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mouseleave', onMouseUp);
        canvas.addEventListener('contextmenu', onContextMenu);

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mouseleave', onMouseUp);
            canvas.removeEventListener('contextmenu', onContextMenu);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [canvasRef, paint, updateVisuals]);
};