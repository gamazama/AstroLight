
import React from 'react';
import ToggleSwitch from '../../../components/shared/ToggleSwitch';
import type { SoundNodeParameter } from '../../types';
import type { Connection, PlanetNode } from '../../../types/simulation';

interface ParamSelectProps {
    param: SoundNodeParameter;
    value: any;
    onChange: (value: any) => void;
    labelPrefix?: React.ReactNode;
    isMixed: boolean;
    connections?: Connection[]; // For connection_select
    planetNodes?: PlanetNode[]; // For connection_select and planet_select
}

export const ParamSelect: React.FC<ParamSelectProps> = ({ param, value, onChange, labelPrefix, isMixed, connections, planetNodes }) => {
    // Boolean parameters render as ToggleSwitch
    if (typeof param.defaultValue === 'boolean') {
        return (
            <div className="relative">
                <ToggleSwitch
                    label={param.label}
                    checked={isMixed ? false : !!value}
                    onChange={onChange}
                />
                 {/* Add prefix if needed (modulator button usually not on booleans, but for consistency) */}
                 {labelPrefix && <div className="absolute top-2 left-0">{labelPrefix}</div>}
            </div>
        );
    }

    // connection_select logic
    if (param.type === 'connection_select' && connections && planetNodes) {
        return (
             <div className="py-2 relative">
                <label className="text-sm flex items-center gap-2 text-gray-300 mb-2">{labelPrefix}{param.label}</label>
                <select
                    value={isMixed ? 'MIXED' : (value === null ? 'none' : value)}
                    onChange={e => onChange(e.target.value === 'none' ? null : parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 bg-black/20 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#667eea]"
                >
                    {isMixed && <option value="MIXED" disabled>Mixed</option>}
                    <option value="none">None</option>
                    {connections.map((conn, i) => (
                        <option key={i} value={i}>
                            {`${planetNodes.find(n => n.id === conn.from)?.name} ↔ ${planetNodes.find(n => n.id === conn.to)?.name}`}
                        </option>
                    ))}
                </select>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
        );
    }

    // planet_select logic
    if (param.type === 'planet_select' && planetNodes) {
        return (
             <div className="py-2 relative">
                <label className="text-sm flex items-center gap-2 text-gray-300 mb-2">{labelPrefix}{param.label}</label>
                <select
                    value={isMixed ? 'MIXED' : (value === null ? 'none' : value)}
                    onChange={e => onChange(e.target.value === 'none' ? null : parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 bg-black/20 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#667eea]"
                >
                    {isMixed && <option value="MIXED" disabled>Mixed</option>}
                    <option value="none">None</option>
                    {planetNodes.map(node => (
                        <option key={node.id} value={node.id}>
                            {node.name}
                        </option>
                    ))}
                </select>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
        );
    }

    // Standard Select
    return (
        <div className="py-2 relative">
            <label className="text-sm flex items-center gap-2 text-gray-300 mb-2">{labelPrefix}{param.label}</label>
            <select
                value={isMixed ? 'MIXED' : value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-2 py-1.5 bg-black/20 border border-white/20 rounded-md text-white text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#667eea]"
            >
                {isMixed && <option value="MIXED" disabled>Mixed</option>}
                {param.options?.filter((opt): opt is { value: string | number; label: string } => 'value' in opt).map(opt => (
                    <option key={opt.value.toString()} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
};
