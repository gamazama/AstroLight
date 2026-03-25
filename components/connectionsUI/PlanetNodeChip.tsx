import React, { forwardRef } from 'react';
import type { PlanetNode } from '../../types';

interface PlanetNodeChipProps {
    node: PlanetNode;
    isConnecting: boolean;
    isHovered: boolean;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const PlanetNodeChip = forwardRef<HTMLDivElement, PlanetNodeChipProps>(
    ({ node, isConnecting, isHovered, onMouseDown, onClick, onMouseEnter, onMouseLeave }, ref) => {
        
        let stateClasses = '';
        if (isConnecting) {
            stateClasses = 'bg-indigo-500/50 ring-2 ring-indigo-400 animate-pulse';
        } else if (isHovered) {
            stateClasses = 'bg-white/15 scale-105';
        } else {
            stateClasses = 'bg-white/5 hover:bg-white/10';
        }

        return (
            <div
                ref={ref}
                onMouseDown={onMouseDown}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`planet-node-chip flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-150 transform relative ${stateClasses}`}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
                <div
                    className="planet-swatch w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: node.color, zIndex: 101 }}
                />
                <span className="text-sm font-medium truncate" style={{ zIndex: 101 }}>{node.name}</span>
            </div>
        );
    }
);

export default PlanetNodeChip;