
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import { useBeginnerMode } from '../hooks/useBeginnerMode';
import UIGuidePulse from './UIGuidePulse';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const LightbulbIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;

const BeginnerHint: React.FC = () => {
    const { actions, isFullscreen } = useAppStore(state => ({ 
        actions: state.actions,
        isFullscreen: state.isFullscreen
    }), shallow);
    const { currentHint, availableDiscoveryHint } = useBeginnerMode();
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, transform: 'scale(0.9)' });
    const [isVisible, setIsVisible] = useState(false);
    const [showConfirmExit, setShowConfirmExit] = useState(false);

    // Effect to trigger side-effects (like expanding layers) when a hint appears
    useEffect(() => {
        if (currentHint && currentHint.onEnter) {
            currentHint.onEnter(actions);
        }
        // Reset confirm state when hint changes
        setShowConfirmExit(false);
    }, [currentHint, actions]);

    useLayoutEffect(() => {
        // If we have an active hint (auto or manually triggered discovery), show the card.
        if (currentHint) {
            setIsVisible(true);
            
            const updatePosition = () => {
                const target = currentHint.targetId ? document.getElementById(currentHint.targetId) : null;
                
                let baseStyle: React.CSSProperties = {
                    opacity: 1,
                    transform: 'scale(1)',
                    position: 'fixed',
                    zIndex: 60,
                };

                let rect: DOMRect | null = null;
                
                // Only use the target if it is visible and has dimensions
                if (target) {
                    const r = target.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        rect = r;
                    }
                }

                if (rect) {
                    const margin = 16;
                    const hintWidth = 320; // Estimated width of the hint card
                    const hintHeight = 150; // Estimated height

                    let pos = currentHint.position || 'right';

                    // --- Smart Flip Logic ---
                    // Check if the preferred position pushes the hint off-screen.
                    // If so, try to flip it to the opposite side.
                    if (pos === 'left' && rect.left < hintWidth) {
                        pos = 'right';
                    } else if (pos === 'right' && (window.innerWidth - rect.right) < hintWidth) {
                        pos = 'left';
                    } else if (pos === 'top' && rect.top < hintHeight) {
                        pos = 'bottom';
                    } else if (pos === 'bottom' && (window.innerHeight - rect.bottom) < hintHeight) {
                        pos = 'top';
                    }

                    switch (pos) {
                        case 'top':
                            baseStyle.top = rect.top - margin;
                            baseStyle.left = rect.left + rect.width / 2;
                            baseStyle.transform = 'translate(-50%, -100%)';
                            break;
                        case 'bottom':
                            baseStyle.top = rect.bottom + margin;
                            baseStyle.left = rect.left + rect.width / 2;
                            baseStyle.transform = 'translate(-50%, 0)';
                            break;
                        case 'left':
                            baseStyle.top = rect.top + rect.height / 2;
                            baseStyle.left = rect.left - margin;
                            baseStyle.transform = 'translate(-100%, -50%)';
                            break;
                        case 'right':
                            baseStyle.top = rect.top + rect.height / 2;
                            baseStyle.left = rect.right + margin;
                            baseStyle.transform = 'translate(0, -50%)';
                            break;
                        default: // center
                            baseStyle.bottom = '140px';
                            baseStyle.left = '50%';
                            baseStyle.transform = 'translate(-50%, 0)';
                    }
                } else {
                    // Default fallback position if target is missing or hidden (unobtrusive bottom center)
                    baseStyle.bottom = '140px';
                    baseStyle.left = '50%';
                    baseStyle.transform = 'translate(-50%, 0)';
                }
                
                setStyle(baseStyle);
            };

            // Update position immediately
            updatePosition();

            // Continuously update position in an RAF loop to track animations (like panel expansion)
            let rafId: number;
            const loop = () => {
                updatePosition();
                rafId = requestAnimationFrame(loop);
            };
            loop();

            window.addEventListener('resize', updatePosition);
            return () => {
                cancelAnimationFrame(rafId);
                window.removeEventListener('resize', updatePosition);
            };
        } else {
            setIsVisible(false);
        }

    }, [currentHint]);

    // --- Discovery Bulb ---
    // If no active hint, but a discovery hint is available, show the bulb.
    // Hide bulb in fullscreen mode to avoid clutter.
    if (!currentHint && availableDiscoveryHint && !isFullscreen) {
        return (
            <button
                onClick={() => actions.setCurrentHint(availableDiscoveryHint.id)}
                className="fixed bottom-8 left-6 z-[60] w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 animate-bounce pointer-events-auto cursor-pointer"
                title="Discover something new!"
                aria-label="Show discovery hint"
            >
                <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20"></div>
                <LightbulbIcon />
            </button>
        );
    }

    if (!isVisible || !currentHint) return null;

    return (
        <>
            {/* Target Highlighter Pulse */}
            {currentHint.highlightTarget && currentHint.targetId && (
                 <UIGuidePulse targetId={currentHint.targetId} onComplete={() => {}} loop={true} />
            )}

            <div 
                className="transition-all duration-500 ease-out pointer-events-auto max-w-xs z-[60]"
                style={style}
            >
                <div className="dynamic-blur border border-indigo-400/30 bg-indigo-900/80 rounded-xl p-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md">
                    {showConfirmExit ? (
                        <div className="text-center animate-fade-in">
                            <h3 className="font-bold text-white text-sm mb-2">Turn off Hints?</h3>
                            <p className="text-xs text-gray-300 mb-3">You can re-enable them from the Help menu.</p>
                            <div className="flex justify-center gap-2">
                                <button 
                                    onClick={() => actions.toggleBeginnerMode()}
                                    className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-200 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    Turn Off
                                </button>
                                <button 
                                    onClick={() => {
                                        actions.dismissHint(currentHint.id);
                                        setShowConfirmExit(false);
                                    }}
                                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md transition-colors"
                                >
                                    Just this hint
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                    <h3 className="font-bold text-white text-sm">{currentHint.title}</h3>
                                </div>
                                <button 
                                    onClick={() => setShowConfirmExit(true)} 
                                    className="text-gray-400 hover:text-white transition-colors -mt-1 -mr-1 p-1 cursor-pointer"
                                    title="Dismiss hint"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <p className="text-sm text-gray-200 leading-relaxed mb-3">
                                {currentHint.text}
                            </p>
                            <div className="flex justify-end gap-2">
                                {currentHint.action && (
                                    <button
                                        onClick={() => {
                                            currentHint.action?.onClick(actions);
                                            actions.dismissHint(currentHint.id);
                                        }}
                                        className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
                                    >
                                        {currentHint.action.label}
                                    </button>
                                )}
                                <button 
                                    onClick={() => actions.dismissHint(currentHint.id)}
                                    className="text-xs bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer font-medium"
                                >
                                    Got it
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default BeginnerHint;