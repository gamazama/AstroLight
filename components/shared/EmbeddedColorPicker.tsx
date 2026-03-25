
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { hexToRgb, rgbToHsv, hsvToRgb, rgbToHex } from '../../utils/colorUtils';

interface EmbeddedColorPickerProps {
    color: string; // The canonical color from the global store
    onColorChange: (color: string) => void; // Callback to update the global store
}

const EmbeddedColorPicker: React.FC<EmbeddedColorPickerProps> = ({ color, onColorChange }) => {
    /**
     * STATE MANAGEMENT STRATEGY:
     * 1. `displayColor`: This is the component's internal, "live" color state. All UI elements (sliders, swatch)
     *    update this state *immediately* for a perfectly responsive user experience.
     * 2. `hexInput`: A separate state for the text input to allow for a better typing experience without
     *    triggering color changes on every keystroke if the hex is invalid.
     * 3. `useEffect [color]`: This effect's only job is to sync the component's internal state FROM the parent
     *    if the `color` prop changes externally (e.g., loading a preset).
     * 4. `useEffect [displayColor]`: This effect's only job is to debounce changes and notify the parent component
     *    (via `onColorChange`) when the user has settled on a new color. Separating these effects prevents race conditions.
     */

    // Internal state for immediate UI feedback.
    const [displayColor, setDisplayColor] = useState(color);
    const [hexInput, setHexInput] = useState(color);

    // --- Synchronization ---

    // Effect 1: Sync FROM the parent component's `color` prop.
    useEffect(() => {
        // If the external color is different from our internal display color, update our internal state.
        if (color.toLowerCase() !== displayColor.toLowerCase()) {
            setDisplayColor(color);
            setHexInput(color);
        }
    }, [color]);

    // Effect 2: Debounce updates TO the parent component.
    useEffect(() => {
        // If the color is already what the parent has, we don't need to do anything.
        if (displayColor.toLowerCase() === color.toLowerCase()) {
            return;
        }

        const handler = setTimeout(() => {
            onColorChange(displayColor);
        }, 100); // Debounce delay of 100ms.

        // This cleanup function is crucial. It cancels the previously scheduled update
        // if the user continues to interact with the color picker.
        return () => clearTimeout(handler);
    }, [displayColor, onColorChange, color]);

    // --- Derived Values & Event Handlers ---

    // Derive HSV values for sliders from the immediate-feedback `displayColor`.
    const { h: hue, s: saturation, v: value } = useMemo(() => {
        const rgb = hexToRgb(displayColor);
        return rgb ? rgbToHsv(rgb) : { h: 0, s: 0, v: 100 };
    }, [displayColor]);

    // Handler for all three HSV sliders.
    const handleHsvChange = (newH: number, newS: number, newV: number) => {
        const newHex = rgbToHex(hsvToRgb(newH, newS, newV));
        setDisplayColor(newHex);
        setHexInput(newHex);
    };

    // Handler for typing in the hex input field.
    const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value.toUpperCase();
        setHexInput(newHex);
        // If the typed hex is valid, update the display color immediately.
        if (hexToRgb(newHex)) {
            setDisplayColor(newHex);
        }
    };

    // Handler for when the hex input loses focus.
    const handleHexInputBlur = () => {
        // On blur, if the input is invalid, revert it to the last valid display color.
        if (!hexToRgb(hexInput)) {
            setHexInput(displayColor);
        }
    };
    
    // --- Gradients for Sliders ---
    const hueGradient = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
    const satGradient = `linear-gradient(to right, ${rgbToHex(hsvToRgb(hue, 0, value))}, ${rgbToHex(hsvToRgb(hue, 100, value))})`;
    const valGradient = `linear-gradient(to right, #000, ${rgbToHex(hsvToRgb(hue, saturation, 100))})`;

    return (
        <div className="flex flex-col gap-3">
            {/* Top row: Color Swatch and Hex Input */}
            <div className="flex justify-between items-center">
                <div 
                    className="w-10 h-10 rounded-md border border-white/20"
                    style={{ backgroundColor: displayColor }}
                />
                <input
                    type="text"
                    value={hexInput}
                    onChange={handleHexInputChange}
                    onBlur={handleHexInputBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    maxLength={7}
                    className="w-28 px-2 py-1 bg-white/10 border border-white/20 rounded-md text-white text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
            </div>
            
            {/* HSV Sliders */}
            <input 
                type="range" min="0" max="360" value={hue}
                onChange={(e) => handleHsvChange(Number(e.target.value), saturation, value)}
                className="w-full h-4 rounded-full outline-none appearance-none cursor-pointer"
                style={{ background: hueGradient }}
            />
            <input 
                type="range" min="0" max="100" value={saturation}
                onChange={(e) => handleHsvChange(hue, Number(e.target.value), value)}
                className="w-full h-4 rounded-full outline-none appearance-none cursor-pointer"
                style={{ background: satGradient }}
            />
            <input 
                type="range" min="0" max="100" value={value}
                onChange={(e) => handleHsvChange(hue, saturation, Number(e.target.value))}
                className="w-full h-4 rounded-full outline-none appearance-none cursor-pointer"
                style={{ background: valGradient }}
            />
        </div>
    );
};

export default EmbeddedColorPicker;
