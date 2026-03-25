import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import type { ColorPickerInfo } from '../types/common';
import { hexToRgb, rgbToHsv, hsvToRgb, rgbToHex } from '../utils/colorUtils';
import { COLOR_PICKER_DEBOUNCE_MS, COLOR_PICKER_SOURCE_MARGIN, COLOR_PICKER_UI_MARGIN, COLOR_PICKER_WIDTH } from '../constants';

// --- Component ---

interface ColorPickerProps {
    info: ColorPickerInfo;
    initialColor: string;
    onColorChange: (color: string) => void;
    onClose: (revert: boolean) => void;
    onCommit?: (originalColor: string, finalColor: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ info, initialColor, onColorChange, onClose, onCommit }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    
    const [pickerStyle, setPickerStyle] = useState<React.CSSProperties>({
        position: 'absolute',
        width: COLOR_PICKER_WIDTH,
        visibility: 'hidden', // Initially hidden to prevent flicker
    });

    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [value, setValue] = useState(100);
    const [hexInput, setHexInput] = useState(initialColor);

    useEffect(() => {
        const newRgb = hexToRgb(initialColor);
        if (newRgb) {
            const newHsv = rgbToHsv(newRgb);
            setHue(newHsv.h);
            setSaturation(newHsv.s);
            setValue(newHsv.v);
            setHexInput(initialColor);
        }
    }, [initialColor]);

    const currentColor = useMemo(() => rgbToHex(hsvToRgb(hue, saturation, value)), [hue, saturation, value]);
    
    useLayoutEffect(() => {
        if (!pickerRef.current) return;

        const picker = pickerRef.current;
        const { offsetWidth: pickerWidth, offsetHeight: pickerHeight } = picker;
        const { innerWidth: winWidth, innerHeight: winHeight } = window;
        const margin = COLOR_PICKER_UI_MARGIN; 
        const sourceMargin = COLOR_PICKER_SOURCE_MARGIN;

        let top, left;

        if (info.sourceBounds) {
            const source = info.sourceBounds;
            top = source.top + (source.height / 2) - (pickerHeight / 2);
            left = source.right + sourceMargin;
            if (left + pickerWidth > winWidth - margin) {
                left = source.left - pickerWidth - sourceMargin;
            }
        } else {
            top = info.y;
            left = info.x;
        }

        if (top + pickerHeight > winHeight - margin) top = winHeight - pickerHeight - margin;
        if (top < margin) top = margin;
        if (left + pickerWidth > winWidth - margin) left = winWidth - pickerWidth - margin;
        if (left < margin) left = margin;

        setPickerStyle(prevStyle => ({
            ...prevStyle,
            top,
            left,
            visibility: 'visible',
        }));
    }, [info]);

    useEffect(() => {
        setHexInput(currentColor);
        const handler = setTimeout(() => {
            onColorChange(currentColor);
        }, COLOR_PICKER_DEBOUNCE_MS);
        return () => clearTimeout(handler);
    }, [currentColor, onColorChange]);
    
    const handleConfirm = useCallback(() => {
        onCommit?.(initialColor, currentColor);
        onClose(false); // Close without reverting
    }, [onClose, onCommit, initialColor, currentColor]);

    // --- UPDATED "CLICK OUTSIDE" LOGIC ---
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                handleConfirm(); // Apply changes on outside click, just like "OK"
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [handleConfirm]);


    const handleCancel = useCallback(() => {
        onClose(true); // Close and revert
    }, [onClose]);
    
    const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setHexInput(newHex);
        const newRgb = hexToRgb(newHex);
        if (newRgb) {
            const newHsv = rgbToHsv(newRgb);
            setHue(newHsv.h);
            setSaturation(newHsv.s);
            setValue(newHsv.v);
        }
    };
    
    const hueGradient = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
    const satGradient = `linear-gradient(to right, ${rgbToHex(hsvToRgb(hue, 0, value))}, ${rgbToHex(hsvToRgb(hue, 100, value))})`;
    const valGradient = `linear-gradient(to right, #000, ${rgbToHex(hsvToRgb(hue, saturation, 100))})`;

    return (
        <div
            ref={pickerRef}
            className="absolute dynamic-blur border border-white/20 rounded-lg p-3 z-50 shadow-2xl flex flex-col gap-3 pointer-events-auto"
            style={pickerStyle}
        >
            <div className="flex justify-between items-center">
                <div 
                    className="w-8 h-8 rounded-md border border-white/20"
                    style={{ backgroundColor: currentColor }}
                />
                <input
                    type="text"
                    value={hexInput}
                    onChange={handleHexInputChange}
                    className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded-md text-white text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                />
            </div>
            
            <input 
                type="range" min="0" max="360" value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="w-full h-4 rounded-full outline-none appearance-none cursor-pointer"
                style={{ background: hueGradient }}
            />
            <input 
                type="range" min="0" max="100" value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-4 rounded-full outline-none appearance-none cursor-pointer"
                style={{ background: satGradient }}
            />
            <input 
                type="range" min="0" max="100" value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full h-4 rounded-full outline-none appearance-none cursor-pointer"
                style={{ background: valGradient }}
            />
            <div className="flex justify-end gap-2 mt-2">
                 <button
                    onClick={handleCancel}
                    className="px-4 py-1.5 text-sm bg-white/10 border border-white/20 text-white rounded-lg font-medium transition-all hover:bg-white/15"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    className="px-4 py-1.5 text-sm bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium transition-transform hover:-translate-y-0.5"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default ColorPicker;