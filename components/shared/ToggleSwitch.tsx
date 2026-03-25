

import React from 'react';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    tooltip?: string;
    onMouseEnter?: (e: React.MouseEvent, content: string) => void;
    onMouseLeave?: () => void;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, tooltip, onMouseEnter, onMouseLeave, disabled = false }) => {
    const handleMouseEnter = (e: React.MouseEvent) => {
        if (tooltip && onMouseEnter) {
            onMouseEnter(e, tooltip);
        }
    };

    const handleMouseLeave = () => {
        if (tooltip && onMouseLeave) {
            onMouseLeave();
        }
    };
    
    return (
        <div className={`flex items-center justify-between py-2 relative ${disabled ? 'opacity-60' : ''}`}>
            <label className="text-sm">
                <span
                    className={`${tooltip ? 'underline decoration-dotted' : ''} ${disabled ? 'cursor-not-allowed' : (tooltip ? 'cursor-help' : '')}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {label}
                </span>
            </label>
            <div
                onClick={() => !disabled && onChange(!checked)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-white/10'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${checked ? 'transform translate-x-6' : ''}`}
                ></div>
            </div>
             <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
};

export default ToggleSwitch;