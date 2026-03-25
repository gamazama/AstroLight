import React, { useState, useEffect, useRef } from 'react';

interface ControlCircleProps {
    position: { x: number; y: number };
    size: number;
    visible: boolean;
}

const ControlCircle: React.FC<ControlCircleProps> = ({ position, size, visible }) => {
    // This ref tracks the previous value of 'visible' to detect when it changes from true to false.
    const wasVisibleRef = useRef(visible);
    // This state tracks if the circle is in the process of fading out.
    const [isHiding, setIsHiding] = useState(false);

    useEffect(() => {
        if (wasVisibleRef.current && !visible) {
            // The circle was visible, but the prop is now false, so we start the hiding process.
            setIsHiding(true);
        } else if (!wasVisibleRef.current && visible) {
            // The circle was hidden, but the prop is now true, so it's appearing.
            // We ensure 'isHiding' is false for the appear animation.
            setIsHiding(false);
        }
        // Update the ref for the next render.
        wasVisibleRef.current = visible;
    }, [visible]);

    // Determine the scale based on the current state.
    // - When appearing (visible=true), scale is 1.
    // - When hiding (visible=false, isHiding=true), scale is also 1 (to prevent scaling on fade out).
    // - When initially hidden (visible=false, isHiding=false), scale is 1.5 (the starting point for the appear animation).
    const scale = visible || isHiding ? 1 : 1.5;

    const circleStyle: React.CSSProperties = {
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: `2px solid rgba(255, 255, 255, 0.4)`,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
        pointerEvents: 'none',
        zIndex: 1000,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: visible ? 1 : 0,
        transition: visible
            // "In" animation: Animate both transform (scale) and opacity over 150ms.
            ? 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 150ms ease-in-out'
            // "Out" animation: Only animate opacity over 500ms. The scale remains at 1.
            : 'opacity 500ms ease-in-out',
    };

    return <div style={circleStyle} />;
};

export default ControlCircle;