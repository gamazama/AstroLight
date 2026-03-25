import React from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

const BrushCursor: React.FC = () => {
    const { brushColor, brushSize, brushStrength, mousePosition } = useAppStore(state => ({
        brushColor: state.brushColor,
        brushSize: state.brushSize,
        brushStrength: state.brushStrength,
        mousePosition: state.mousePosition,
    }), shallow);

    const cursorStyle: React.CSSProperties = {
        position: 'fixed',
        top: mousePosition.y,
        left: mousePosition.x,
        width: `${brushSize * 2}px`,
        height: `${brushSize * 2}px`,
        borderRadius: '50%',
        border: `1px dashed rgba(255, 255, 255, 0.7)`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'width 0.1s ease-out, height 0.1s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const innerCircleStyle: React.CSSProperties = {
        width: `${brushSize * 2 * brushStrength}px`,
        height: `${brushSize * 2 * brushStrength}px`,
        borderRadius: '50%',
        backgroundColor: brushColor,
        opacity: 0.4,
        transition: 'width 0.1s ease-out, height 0.1s ease-out',
    };

    return (
        <div style={cursorStyle}>
            <div style={innerCircleStyle} />
        </div>
    );
};

export default BrushCursor;
