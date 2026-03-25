import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import PlanetEditor from './connectionsUI/PlanetEditor';
import type { PlanetNode, CelestialBodyData } from '../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

interface PlanetEditorPanelProps {
    planetId: number;
    initialPosition: { x: number; y: number };
}

const PlanetEditorPanel: React.FC<PlanetEditorPanelProps> = ({ planetId, initialPosition }) => {
    const { 
        planetNode, 
        planetData, 
        position, 
        actions 
    } = useAppStore(state => {
        const planetNode = state.planetNodes.find(n => n.id === planetId);
        const planetData = planetNode ? state.actions.getCelestialBody(planetNode.name) : null;
        const panelState = state.planetEditorPanels.find(p => p.planetId === planetId);
        return {
            planetNode,
            planetData,
            position: panelState?.position ?? initialPosition,
            actions: state.actions
        };
    }, shallow);

    const [isDragging, setIsDragging] = useState(false);
    const dragStartOffset = useRef({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        // Use timeout to trigger animation after initial render with max-height: 0
        const timer = setTimeout(() => {
            setIsRevealed(true);
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        if (panelRef.current) {
            panelRef.current.classList.add('panel-closing-animation');
        }
    };

    const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
        // When the custom closing animation finishes, remove the component
        if (e.animationName === 'panel-close') {
            actions.removePlanetEditorPanel(planetId);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            dragStartOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            setIsDragging(true);
            document.body.style.userSelect = 'none';
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !panelRef.current) return;
            const newX = e.clientX - dragStartOffset.current.x;
            const newY = e.clientY - dragStartOffset.current.y;
            actions.updatePlanetEditorPanelPosition(planetId, { x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.userSelect = '';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, actions, planetId]);

    if (!planetNode || !planetData) {
        return null;
    }
    
    return (
        <>
            {/* Inject keyframes for the closing animation */}
            <style>
                {`
                @keyframes panel-close {
                    to { 
                        height: 0px;
                        transform: translateY(var(--panel-height));
                    }
                }
                .panel-closing-animation {
                    --panel-height: 0px; /* Will be set via JS */
                    animation: panel-close 850ms cubic-bezier(0.6, 0.04, 0.2, 1) forwards;
                }
                `}
            </style>
            <div
                ref={panelRef}
                className="fixed flex flex-col dynamic-blur border border-white/10 rounded-xl shadow-2xl text-white select-none z-10 w-80 pointer-events-auto overflow-hidden"
                style={{ top: position.y, left: position.x }}
                onAnimationEnd={handleAnimationEnd}
            >
                <div
                    className="bg-white/5 px-3 py-2 rounded-t-xl cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center justify-between"
                    onMouseDown={handleMouseDown}
                >
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{planetNode.name}</h2>
                    <button
                        onClick={() => {
                            if (panelRef.current) {
                                // Set the panel height as a CSS variable for the animation
                                const height = panelRef.current.offsetHeight;
                                panelRef.current.style.setProperty('--panel-height', `${height}px`);
                                // Set the height explicitly to override any dynamic height calculations during animation
                                panelRef.current.style.height = `${height}px`;
                                panelRef.current.classList.add('panel-closing-animation');
                            }
                        }}
                        className="p-1 rounded-md hover:bg-white/10"
                        title={`Close ${planetNode.name} Editor`}
                    >
                        <CloseIcon />
                    </button>
                </div>
                <div 
                    className="transition-[max-height] duration-[850ms]"
                    style={{
                        transitionTimingFunction: 'cubic-bezier(0.6, 0.04, 0.2, 1)',
                        maxHeight: isRevealed ? '500px' : '0px'
                    }}
                >
                    <div className="p-2 space-y-1 border-t border-white/10">
                         <PlanetEditor 
                            planet={planetData} 
                            node={planetNode} 
                            updatePlanetOverride={actions.updatePlanetOverride} 
                            resetPlanetOverrides={actions.resetPlanetOverrides} 
                            resetPlanetPropertyOverride={actions.resetPlanetPropertyOverride} 
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlanetEditorPanel;