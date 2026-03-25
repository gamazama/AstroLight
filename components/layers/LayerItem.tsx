
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { smoothEase } from '../../utils/mathUtils';
import { lerp } from '../../utils/mathUtils';

const ANIMATION_DURATION = 300; // ms

// --- Icons ---
const EyeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22" />
    </svg>
);
const CaretRightIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;

interface LayerItemProps {
    label: React.ReactNode;
    isVisible: boolean;
    onToggleVisibility?: () => void;
    isExpandable?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    onHeaderClick?: () => void;
    children?: React.ReactNode;
    hideVisibilityToggle?: boolean;
    icon?: React.ReactNode;
    className?: string;
    onAnimationEnd?: () => void;
    rightAccessory?: React.ReactNode;
    headerId?: string;
}

const LayerItem: React.FC<LayerItemProps> = ({
    label,
    isVisible,
    onToggleVisibility,
    isExpandable = false,
    isExpanded = false,
    onToggleExpand,
    onHeaderClick,
    children,
    hideVisibilityToggle = false,
    icon,
    className = '',
    onAnimationEnd,
    rightAccessory,
    headerId,
}) => {
    const effectiveHeaderClick = onHeaderClick ?? onToggleExpand;
    const contentWrapperRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        height: isExpanded ? 'auto' : 0,
        overflow: 'hidden',
    });

    useLayoutEffect(() => {
        if (!isExpandable) return;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        const contentEl = contentWrapperRef.current;
        if (!contentEl) return;

        const startHeight = contentEl.offsetHeight;
        let targetHeight = 0;

        if (isExpanded) {
            // To get the target height, we temporarily set it to 'auto'
            contentEl.style.height = 'auto';
            targetHeight = contentEl.scrollHeight;
            contentEl.style.height = `${startHeight}px`;
        }

        const startTime = performance.now();
        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
            const easedProgress = smoothEase(progress, 'ease-in-out');

            const currentHeight = lerp(startHeight, targetHeight, easedProgress);
            setStyle({ height: currentHeight, overflow: 'hidden' });

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                // If we expanded fully, set height to 'auto' to accommodate dynamic content.
                if (isExpanded) {
                    setStyle({ height: 'auto' });
                } else {
                    setStyle({ height: 0, overflow: 'hidden' });
                }
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isExpanded, isExpandable]);

    return (
        <div 
            className={`bg-white/5 rounded-md ${className}`}
            onAnimationEnd={onAnimationEnd}
        >
            <div 
                id={headerId}
                className={`flex items-center justify-between p-2 hover:bg-white/5 rounded-md transition-colors duration-150 ${isExpandable ? 'cursor-pointer' : ''} ${isVisible ? '' : 'text-gray-500'}`}
                onClick={isExpandable ? effectiveHeaderClick : undefined}
                title={onHeaderClick ? "Toggle and collapse others" : ""}
            >
                <div className="flex items-center gap-2 flex-grow pointer-events-none">
                    {isExpandable ? (
                        <div 
                            onClick={(e) => { e.stopPropagation(); onToggleExpand?.() }} 
                            className="p-1 -ml-1 rounded-full cursor-pointer hover:bg-white/10 pointer-events-auto"
                            title="Toggle only this layer"
                        >
                            <CaretRightIcon className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
                        </div>
                    ) : (
                        <div className="w-6"></div> // Placeholder for alignment
                    )}
                    <div className="flex items-center gap-2">
                        {icon && <div className="w-4 h-4 text-gray-400">{icon}</div>}
                        <span className="text-sm">{label}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {rightAccessory}
                    {!hideVisibilityToggle && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(); }}
                            className="p-1 rounded-md hover:bg-white/10"
                            title={`Toggle ${label} visibility`}
                        >
                            {isVisible ? <EyeIcon /> : <EyeOffIcon />}
                        </button>
                    )}
                </div>
            </div>
            {isExpandable && (
                <div ref={contentWrapperRef} style={style}>
                    <div className="border-t border-white/10">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayerItem;
