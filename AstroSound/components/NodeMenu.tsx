
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';
import { ALL_NODE_TYPES, SoundNodeType } from './nodeTypes';
import { NODE_PREFABS } from './nodePrefabs';

interface NodeMenuProps {
    x: number;
    y: number;
    onClose: () => void;
}

export const NodeMenu: React.FC<NodeMenuProps> = ({ x, y, onClose }) => {
    const { addNode, addNodePrefab, soundCreatorTransform } = useAppStore(state => ({
        addNode: state.actions.addNode,
        addNodePrefab: state.actions.addNodePrefab,
        soundCreatorTransform: state.soundCreator.transform,
    }), shallow);

    const [filter, setFilter] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleAdd = (type: 'node' | 'prefab', name: string) => {
        const { transform } = { transform: soundCreatorTransform };
        const position = {
            x: (x - transform.x) / transform.k,
            y: (y - transform.y) / transform.k,
        };
        if (type === 'node') addNode(name, position);
        else addNodePrefab(name, position);
        onClose();
    };

    const groupedNodes = useMemo(() => {
        const groups: Record<string, SoundNodeType[]> = {};
        const f = filter.toLowerCase();
        const nodes = ALL_NODE_TYPES.filter(n => n.type !== 'Output' && (n.label.toLowerCase().includes(f) || n.category.toLowerCase().includes(f)));
    
        nodes.forEach(node => {
            if (!groups[node.category]) {
                groups[node.category] = [];
            }
            groups[node.category].push(node);
        });
        
        const categoryOrder = ['Input', 'Generator', 'Utility', 'Effect'];
        const sortedGroups: {category: string, nodes: SoundNodeType[]}[] = [];
        categoryOrder.forEach(cat => {
            if (groups[cat]) {
                sortedGroups.push({ category: cat, nodes: groups[cat] });
            }
        });
    
        return sortedGroups;
    }, [filter]);

    const filteredPrefabs = useMemo(() => {
        const f = filter.toLowerCase();
        return NODE_PREFABS.filter(p => p.name.toLowerCase().includes(f));
    }, [filter]);


    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div 
            ref={menuRef} 
            id="sound-creator-context-menu"
            className="fixed dynamic-blur border border-white/10 rounded-lg shadow-2xl w-64 z-30 flex flex-col" 
            style={{ top: y, left: x, maxHeight: '400px' }}
            onWheel={(e) => e.stopPropagation()}
        >
            <input ref={inputRef} type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search nodes & prefabs..." className="w-full px-3 py-2 bg-black/30 border-b border-white/10 text-white text-sm outline-none rounded-t-lg"/>
            <div className="overflow-y-auto p-1">
                {filteredPrefabs.length > 0 && (
                    <div className="mb-1">
                        <h4 className="text-xs text-green-300/80 uppercase font-bold mb-1 px-2 pt-1">Prefabs</h4>
                        {filteredPrefabs.map(prefab => (
                            <button key={prefab.name} onMouseDown={() => handleAdd('prefab', prefab.name)} className="w-full text-left px-3 py-1.5 hover:bg-green-500/20 text-sm text-green-300 rounded-md">
                                {prefab.name}
                            </button>
                        ))}
                    </div>
                )}
                
                {groupedNodes.map(({ category, nodes }) => (
                    <div key={category} className="mb-1">
                        <h4 className="text-xs text-indigo-300/80 uppercase font-bold mb-1 px-2 pt-1">{category}</h4>
                        {nodes.map(nodeType => (
                            <button key={nodeType.type} onMouseDown={() => handleAdd('node', nodeType.type)} className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 text-sm rounded-md">
                                {nodeType.label}
                            </button>
                        ))}
                    </div>
                ))}
        
                {(filteredPrefabs.length === 0 && groupedNodes.length === 0) && (
                    <p className="p-4 text-sm text-gray-400 text-center">No results found.</p>
                )}
            </div>
        </div>
    );
};
