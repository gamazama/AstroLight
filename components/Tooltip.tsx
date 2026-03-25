

import React, { useRef, useState, useLayoutEffect } from 'react';
import type { TooltipInfo } from '../types/common';
import { TOOLTIP_MARGIN } from '../constants';

interface TooltipProps {
    info: TooltipInfo;
}

const Tooltip: React.FC<TooltipProps> = ({ info }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: -9999, left: -9999 });

    useLayoutEffect(() => {
        if (!tooltipRef.current) return;

        const tooltip = tooltipRef.current;
        const { offsetWidth: width, offsetHeight: height } = tooltip;
        const { innerWidth: winWidth, innerHeight: winHeight } = window;
        const margin = TOOLTIP_MARGIN; // Space from cursor

        let top = info.y + margin;
        let left = info.x + margin;

        // Adjust horizontally if it overflows
        if (left + width > winWidth - margin) {
            left = info.x - width - margin;
        }

        // Adjust vertically if it overflows
        if (top + height > winHeight - margin) {
            top = info.y - height - margin;
        }

        // Ensure it's not off-screen on the top/left after adjustment
        if (left < margin) {
            left = margin;
        }
        if (top < margin) {
            top = margin;
        }
        
        setPosition({ top, left });
    }, [info]);

    return (
        <div
            ref={tooltipRef}
            className="absolute bg-[rgba(20,25,40,0.95)] border border-white/20 rounded-md px-3 py-2 text-sm text-white pointer-events-none z-50 transition-opacity opacity-100 max-w-xs"
            style={{
                top: position.top,
                left: position.left,
                visibility: position.top === -9999 ? 'hidden' : 'visible',
            }}
        >
            {info.content}
        </div>
    );
};

export default Tooltip;