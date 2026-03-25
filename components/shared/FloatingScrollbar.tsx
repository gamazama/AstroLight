import React, { useState, useLayoutEffect, useRef, useCallback, useEffect } from 'react';

interface FloatingScrollbarProps {
    panelRef: React.RefObject<HTMLDivElement>;
    contentRef: React.RefObject<HTMLDivElement>;
    isVisible: boolean;
    position?: { x: number; y: number } | null;
}

const FloatingScrollbar: React.FC<FloatingScrollbarProps> = ({ panelRef, contentRef, isVisible, position }) => {
    const [thumbStyle, setThumbStyle] = useState({ height: 0, top: 0 });
    const [trackStyle, setTrackStyle] = useState({ top: 0, left: 0, height: 0 });
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const dragStartY = useRef(0);
    const dragStartScrollTop = useRef(0);
    const lastIsVisible = useRef(isVisible);

    const updateThumb = useCallback(() => {
        if (!contentRef.current || !panelRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const panelRect = panelRef.current.getBoundingClientRect();
        
        // Use panelRect.height as the scrollbar height for consistency
        const scrollbarHeight = panelRect.height;

        const thumbHeight = Math.max(20, (clientHeight / scrollHeight) * scrollbarHeight); // min height 20px
        const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (scrollbarHeight - thumbHeight);

        setThumbStyle({ height: thumbHeight, top: thumbTop });
        setTrackStyle({
            top: panelRect.top,
            left: panelRect.right + 8, // 8px margin to the right of the panel
            height: panelRect.height
        });
    }, [contentRef, panelRef]);

    useLayoutEffect(() => {
        if (!contentRef.current) return;

        const contentEl = contentRef.current;
        
        if (isVisible) {
            updateThumb(); // Initial calculation
            contentEl.addEventListener('scroll', updateThumb);

            const resizeObserver = new ResizeObserver(updateThumb);
            if (panelRef.current) resizeObserver.observe(panelRef.current);
            resizeObserver.observe(contentEl);

            return () => {
                contentEl.removeEventListener('scroll', updateThumb);
                resizeObserver.disconnect();
            };
        }
    }, [isVisible, updateThumb, contentRef, panelRef, position]);
    
    // This effect handles the drag logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current || !contentRef.current || !panelRef.current || thumbStyle.height === 0) return;
            
            const deltaY = e.clientY - dragStartY.current;
            const scrollbarHeight = panelRef.current.offsetHeight;
            const { scrollHeight, clientHeight } = contentRef.current;
            
            // This ratio determines how many pixels the content scrolls for each pixel the thumb is dragged.
            const scrollRatio = (scrollHeight - clientHeight) / (scrollbarHeight - thumbStyle.height);

            // Clamp the scroll top to prevent over-scrolling
            const newScrollTop = dragStartScrollTop.current + deltaY * scrollRatio;
            contentRef.current.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight));
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [thumbStyle.height, panelRef, contentRef]);
    
    const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!contentRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = true;
        dragStartY.current = e.clientY;
        dragStartScrollTop.current = contentRef.current.scrollTop;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    };

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!contentRef.current || !panelRef.current || isDraggingRef.current) return;
        const trackRect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top; // Y-position relative to the track

        const { scrollHeight, clientHeight } = contentRef.current;
        const scrollbarHeight = panelRef.current.offsetHeight;
        
        // Calculate new scrollTop based on click position, centering the thumb on the click
        const thumbHeight = thumbStyle.height;
        const newThumbTop = clickY - thumbHeight / 2;
        const scrollPercentage = newThumbTop / (scrollbarHeight - thumbHeight);
        
        contentRef.current.scrollTop = scrollPercentage * (scrollHeight - clientHeight);
    };

    // Use a ref to control the fading animation, allowing for a delay before hiding
    const [isRendered, setIsRendered] = useState(isVisible);
    useEffect(() => {
        if(isVisible) {
            setIsRendered(true);
        } else {
            // Wait for fade-out animation before un-mounting
            const timer = setTimeout(() => setIsRendered(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    lastIsVisible.current = isVisible;
    if (!isRendered) return null;

    return (
        <div
            ref={scrollbarRef}
            className="fixed w-2.5 z-20"
            style={{ ...trackStyle, transition: 'opacity 0.2s ease-in-out', opacity: isVisible ? 1 : 0 }}
            onClick={handleTrackClick}
        >
            <div className="relative w-full h-full bg-black/20 rounded-full">
                <div
                    className="absolute w-full bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                    style={{
                        height: `${thumbStyle.height}px`,
                        top: `${thumbStyle.top}px`,
                        cursor: 'ns-resize'
                    }}
                    onMouseDown={handleThumbMouseDown}
                />
            </div>
        </div>
    );
};

export default FloatingScrollbar;