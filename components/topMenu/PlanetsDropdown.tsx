
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import PlanetNodeChip from '../connectionsUI/PlanetNodeChip';
import type { PlanetNode } from '../../types';

interface PlanetsDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const PlanetsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12C3.5 9.51472 5.51472 7.5 8 7.5C10.4853 7.5 12.5 9.51472 12.5 12C12.5 14.4853 10.4853 16.5 8 16.5C5.51472 16.5 3.5 14.4853 3.5 12ZM8 12L19 12M19 12L15.5 8.5M19 12L15.5 15.5" /></svg>;

const PlanetsDropdown: React.FC<PlanetsDropdownProps> = ({ isOpen, onToggle, onClose }) => {
    const { 
        planetNodes, 
        planetConnectionDragInfo, 
        hoveredPlanetId, 
        mousePosition,
        actions 
    } = useAppStore(state => ({
        planetNodes: state.planetNodes,
        planetConnectionDragInfo: state.planetConnectionDragInfo,
        hoveredPlanetId: state.hoveredPlanetId,
        mousePosition: state.mousePosition,
        actions: {
            startPlanetConnection: state.actions.startPlanetConnection,
            updatePlanetConnection: state.actions.updatePlanetConnection,
            promotePlanetConnectionToClickMode: state.actions.promotePlanetConnectionToClickMode,
            clearPlanetConnection: state.actions.clearPlanetConnection,
            createUiConnection: state.actions.createUiConnection,
            setHoveredPlanetId: state.actions.setHoveredPlanetId,
        }
    }), shallow);
    const { startPlanetConnection, updatePlanetConnection, promotePlanetConnectionToClickMode, clearPlanetConnection, createUiConnection, setHoveredPlanetId } = actions;

    const dropdownRef = useRef<HTMLDivElement>(null);
    const chipRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const isDraggingRef = useRef(false);

    // Click outside to close
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen, onClose]);

    // If the dropdown is closing and a connection is in progress, cancel it.
    useEffect(() => {
        if (!isOpen && planetConnectionDragInfo) {
            clearPlanetConnection();
        }
    }, [isOpen, planetConnectionDragInfo, clearPlanetConnection]);

    const getSwatchCenter = useCallback((nodeId: number): { x: number; y: number } | null => {
        const chip = chipRefs.current.get(nodeId);
        if (!chip) return null;
        const swatch = chip.querySelector('.planet-swatch') as HTMLDivElement;
        if (!swatch) return null;

        const rect = swatch.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    }, []);

    // Global listeners for drag logic
    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (planetConnectionDragInfo) {
                if (planetConnectionDragInfo.mode === 'drag' && !isDraggingRef.current) {
                    const dx = e.clientX - planetConnectionDragInfo.startX;
                    const dy = e.clientY - planetConnectionDragInfo.startY;
                    if (Math.hypot(dx, dy) > 5) {
                        isDraggingRef.current = true;
                    }
                }
                
                let endX = e.clientX;
                let endY = e.clientY;

                if (hoveredPlanetId && hoveredPlanetId !== planetConnectionDragInfo.fromNodeId) {
                    const targetSwatchCenter = getSwatchCenter(hoveredPlanetId);
                    if (targetSwatchCenter) {
                        endX = targetSwatchCenter.x;
                        endY = targetSwatchCenter.y;
                    }
                }
                updatePlanetConnection({ x: endX, y: endY });
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDraggingRef.current && planetConnectionDragInfo && planetConnectionDragInfo.mode === 'drag') {
                const targetIsChip = (e.target as HTMLElement).closest('.planet-node-chip');
                const targetIsCanvas = (e.target as HTMLElement).id === 'main-canvas';
        
                if (targetIsChip && hoveredPlanetId && hoveredPlanetId !== planetConnectionDragInfo.fromNodeId) {
                    // Case 1: Drop on another chip in the dropdown.
                    createUiConnection(planetConnectionDragInfo.fromNodeId, hoveredPlanetId);
                } else if (targetIsCanvas) {
                    // Case 2: Drop on the main canvas.
                    // The global hoveredPlanetId is updated by useOrbitInput when hovering an orbit.
                    if (hoveredPlanetId && hoveredPlanetId !== planetConnectionDragInfo.fromNodeId) {
                        // A valid connection can be made.
                        createUiConnection(planetConnectionDragInfo.fromNodeId, hoveredPlanetId);
                    } else {
                        // Dropped on canvas but not on a valid orbit, so cancel.
                        clearPlanetConnection();
                    }
                } else {
                    // Case 3: Drop anywhere else (not a chip, not the canvas). Cancel the connection.
                    clearPlanetConnection();
                }
            }
            isDraggingRef.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isOpen, planetConnectionDragInfo, hoveredPlanetId, updatePlanetConnection, createUiConnection, clearPlanetConnection, getSwatchCenter]);

    const handleChipMouseDown = (node: PlanetNode, e: React.MouseEvent<HTMLDivElement>) => {
        if (planetConnectionDragInfo) return;

        isDraggingRef.current = false;
        const swatchCenter = getSwatchCenter(node.id);
        if (!swatchCenter) return;
        
        startPlanetConnection(node.id, node.color, swatchCenter.x, swatchCenter.y, 'drag');
    };

    const handleChipClick = (nodeId: number) => {
        if (isDraggingRef.current) return;

        if (planetConnectionDragInfo) {
            if (planetConnectionDragInfo.mode === 'drag') {
                promotePlanetConnectionToClickMode();
            } else if (planetConnectionDragInfo.mode === 'click') {
                if (planetConnectionDragInfo.fromNodeId === nodeId) {
                    clearPlanetConnection();
                } else {
                    createUiConnection(planetConnectionDragInfo.fromNodeId, nodeId);
                }
            }
        }
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button 
                id="planets-dropdown-trigger"
                onClick={onToggle} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-sm"
            >
                <PlanetsIcon />
                Available Planets
            </button>
            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-2 dynamic-blur border border-white/10 rounded-lg shadow-2xl w-80 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && planetConnectionDragInfo) {
                            clearPlanetConnection();
                        }
                    }}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {planetNodes.map(node => (
                            <PlanetNodeChip
                                key={node.id}
                                ref={el => { if (el) chipRefs.current.set(node.id, el); else chipRefs.current.delete(node.id); }}
                                node={node}
                                isConnecting={planetConnectionDragInfo?.fromNodeId === node.id}
                                isHovered={hoveredPlanetId === node.id}
                                onMouseDown={(e) => handleChipMouseDown(node, e)}
                                onClick={() => handleChipClick(node.id)}
                                onMouseEnter={() => setHoveredPlanetId(node.id)}
                                onMouseLeave={() => setHoveredPlanetId(null)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanetsDropdown;
