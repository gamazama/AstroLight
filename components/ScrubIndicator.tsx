import React from 'react';

interface ScrubIndicatorProps {
    label: string;
    value: number;
    formatValue: (value: number) => string;
    mousePosition: { x: number; y: number };
}

const ScrubIndicator: React.FC<ScrubIndicatorProps> = ({ label, value, formatValue, mousePosition }) => {
    
    const indicatorStyle: React.CSSProperties = {
        position: 'fixed',
        top: mousePosition.y,
        left: mousePosition.x,
        transform: 'translate(20px, -50%)',
        pointerEvents: 'none',
        zIndex: 1001,
        transition: 'opacity 0.1s ease-in-out',
    };

    return (
        <div style={indicatorStyle}>
            <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
                <span className="text-sm text-gray-300">{label}</span>
                <span className="text-lg font-bold">{formatValue(value)}</span>
            </div>
        </div>
    );
};

export default ScrubIndicator;