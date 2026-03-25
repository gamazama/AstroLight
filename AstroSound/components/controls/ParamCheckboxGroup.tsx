import React, { useState } from 'react';
import type { SoundNodeParameter } from '../../types';

const CollapsibleSection: React.FC<{title: string, children: React.ReactNode, defaultOpen?: boolean}> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="my-1">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 py-1 hover:text-white">
                <span>{title}</span>
                <span className={`transition-transform text-gray-500 ${isOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {isOpen && <div className="space-y-1">{children}</div>}
        </div>
    );
};

interface ParamCheckboxGroupProps {
    param: SoundNodeParameter;
    value: string[];
    onChange: (value: string[]) => void;
    labelPrefix?: React.ReactNode;
    isMixed: boolean;
    nodeId: string;
}

export const ParamCheckboxGroup: React.FC<ParamCheckboxGroupProps> = ({ param, value, onChange, labelPrefix, isMixed, nodeId }) => {
    const activeOutputs = (isMixed ? [] : value) || [];
    
    const handleCheckboxChange = (optionValue: string) => {
        const newActiveOutputs = activeOutputs.includes(optionValue)
            ? activeOutputs.filter((v) => v !== optionValue)
            : [...activeOutputs, optionValue];
        onChange(newActiveOutputs);
    };

    return (
        <div className="py-2">
            <label className="text-sm flex items-center gap-2 text-gray-300 mb-2">
                {labelPrefix}
                {param.label}
            </label>
            <div className="space-y-1">
                {(param.options as any[])?.map(group => {
                    if (!group.items || group.items.length === 0) return null;
                    
                    return (
                        <CollapsibleSection key={group.group} title={group.group} defaultOpen={true}>
                            <div className="pl-2 space-y-2 py-1">
                                {group.items.map((item: any) => (
                                    <div key={item.value} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id={`${nodeId}-${param.name}-${item.value}`}
                                            checked={isMixed ? false : activeOutputs.includes(item.value)}
                                            onChange={() => handleCheckboxChange(item.value)}
                                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`${nodeId}-${param.name}-${item.value}`} className="text-sm text-gray-300">{item.label}</label>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    );
                })}
            </div>
        </div>
    );
};