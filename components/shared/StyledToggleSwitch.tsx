import React from 'react';

interface StyledToggleSwitchProps {
    labelLeft: string;
    labelRight: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    tooltipLeft?: string;
    tooltipRight?: string;
    onMouseEnter?: (e: React.MouseEvent, content: string) => void;
    onMouseLeave?: () => void;
}

const StyledToggleSwitch: React.FC<StyledToggleSwitchProps> = ({ labelLeft, labelRight, checked, onChange, tooltipLeft, tooltipRight, onMouseEnter, onMouseLeave }) => {
    return (
        <div className="flex items-center justify-between my-4 mx-2">
            <span 
                className={`text-sm cursor-pointer transition-colors duration-200 ${!checked ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'} ${tooltipLeft ? 'underline decoration-dotted cursor-help' : ''}`}
                onClick={() => onChange(false)}
                onMouseEnter={(e) => tooltipLeft && onMouseEnter?.(e, tooltipLeft)}
                onMouseLeave={onMouseLeave}
            >
                {labelLeft}
            </span>
            <div
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${checked ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-white/10'}`}
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${checked ? 'transform translate-x-6' : ''}`}
                />
            </div>
            <span 
                className={`text-sm cursor-pointer transition-colors duration-200 ${checked ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'} ${tooltipRight ? 'underline decoration-dotted cursor-help' : ''}`}
                onClick={() => onChange(true)}
                onMouseEnter={(e) => tooltipRight && onMouseEnter?.(e, tooltipRight)}
                onMouseLeave={onMouseLeave}
            >
                {labelRight}
            </span>
        </div>
    );
};

export default StyledToggleSwitch;
