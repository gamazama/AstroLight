import React, { useState, useRef, useEffect } from 'react';

interface UseDraggablePanelProps {
    panelRef: React.RefObject<HTMLDivElement | null>;
    position: { x: number; y: number } | null;
    onPositionChange: (position: { x: number; y: number }) => void;
}

export const useDraggablePanel = ({ panelRef, position, onPositionChange }: UseDraggablePanelProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartOffset = useRef({ x: 0, y: 0 });
    const onPositionChangeRef = useRef(onPositionChange);

    useEffect(() => {
        onPositionChangeRef.current = onPositionChange;
    }, [onPositionChange]);

    const handleStart = (clientX: number, clientY: number) => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            dragStartOffset.current = {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
            setIsDragging(true);
            document.body.style.userSelect = 'none';
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 0) { // Left click only
            handleStart(e.clientX, e.clientY);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    // Enforce screen boundaries on window resize
    useEffect(() => {
        const handleResize = () => {
            if (!panelRef.current || !position) return;
            
            const panelWidth = panelRef.current.offsetWidth;
            const panelHeight = panelRef.current.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const padding = 20;

            let newX = position.x;
            let newY = position.y;
            let needsUpdate = false;

            if (newX + panelWidth > windowWidth - padding) {
                newX = Math.max(padding, windowWidth - panelWidth - padding);
                needsUpdate = true;
            }
            if (newY + panelHeight > windowHeight - padding) {
                newY = Math.max(padding, windowHeight - panelHeight - padding);
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                onPositionChangeRef.current({ x: newX, y: newY });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [position, panelRef]);


    useEffect(() => {
        const handleMove = (clientX: number, clientY: number) => {
            if (!panelRef.current) return;

            const panelWidth = panelRef.current.offsetWidth;
            const windowWidth = window.innerWidth;
            const boundaryPadding = 20;

            let newX = clientX - dragStartOffset.current.x;
            newX = Math.max(boundaryPadding, newX);
            newX = Math.min(newX, windowWidth - panelWidth - boundaryPadding);

            let newY = clientY - dragStartOffset.current.y;
            newY = Math.max(boundaryPadding, newY);
            // Let panel go off bottom slightly if needed, but keep header visible
            
            onPositionChangeRef.current({ x: newX, y: newY });
        };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                e.preventDefault(); // Prevent scrolling while dragging
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
            document.body.style.userSelect = '';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
            document.body.style.userSelect = '';
        };
    }, [isDragging, panelRef]);

    return { handleMouseDown, handleTouchStart };
};