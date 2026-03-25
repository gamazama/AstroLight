import React from 'react';
import type { SoundNode, SoundNodeType } from '../types';

// --- Icon Components ---
const SoundOnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const SoundOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4 4m0-4l-4 4" />
</svg>;

interface AttributePanelHeaderProps {
    primaryNode: SoundNode;
    selectedNodes: SoundNode[];
    nodeDef: SoundNodeType;
    onNameChange: (name: string) => void;
    onColorChange: (e: React.MouseEvent) => void;
    onBypassToggle: () => void;
}

export const AttributePanelHeader: React.FC<AttributePanelHeaderProps> = ({ 
    primaryNode, 
    selectedNodes, 
    nodeDef, 
    onNameChange, 
    onColorChange,
    onBypassToggle 
}) => {
    // Handle "Mixed" states for multi-selection
    const isNameMixed = selectedNodes.length > 1 && !selectedNodes.every(n => n.params.customName === primaryNode.params.customName);
    const nameValue = isNameMixed ? "" : (primaryNode.params.customName || "");
    const namePlaceholder = isNameMixed ? "Mixed Names" : (nodeDef.label || "");
    
    const isColorMixed = selectedNodes.length > 1 && !selectedNodes.every(n => n.params.displayColor === primaryNode.params.displayColor);
    const colorValue = isColorMixed ? '#000000' : (primaryNode.params.displayColor || '#4a5568');
    
    const bypassValue = primaryNode.params.isBypassed || false;

    if (primaryNode.type === 'Output') {
        return (
            <div className="p-4 flex-shrink-0 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold">Master Output</h3>
            </div>
        );
    }

    return (
        <div className="p-3 flex-shrink-0 border-b border-white/10 flex items-center gap-3">
            <div
                onClick={onColorChange}
                className="w-8 h-8 rounded-md cursor-pointer border border-white/20 flex-shrink-0"
                style={{ backgroundColor: colorValue }}
                title="Change node color"
            />
            <input
                type="text"
                value={nameValue}
                placeholder={namePlaceholder}
                onChange={e => onNameChange(e.target.value)}
                onFocus={e => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="w-full bg-transparent text-lg font-bold outline-none focus:bg-white/5 rounded px-2 py-1 -ml-2 text-white placeholder:text-gray-400"
                title="Edit node name"
            />
            <button
                onClick={onBypassToggle}
                className={`p-2 rounded-md hover:bg-white/10 ${bypassValue ? 'text-gray-500' : 'text-white'}`}
                title={bypassValue ? 'Un-Bypass Node' : 'Bypass Node'}
            >
                {bypassValue ? <SoundOffIcon /> : <SoundOnIcon />}
            </button>
        </div>
    );
};
