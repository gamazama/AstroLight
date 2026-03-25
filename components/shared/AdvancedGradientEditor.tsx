
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { GradientStop } from '../../types';
import { hexToRgb, rgbToHex, lerpRGB, getGradientCssString } from '../../utils/colorUtils';
import Slider from './Slider';
import EmbeddedColorPicker from './EmbeddedColorPicker';
import { GRADIENT_PRESETS } from '../../data/gradientPresets';

// --- Types ---

type InterpolationMode = 'linear' | 'step' | 'smooth' | 'cubic';

interface AdvancedGradientKnot {
    id: string;
    position: number;
    color: string;
    bias: number; // 0.0 to 1.0, default 0.5
    interpolation: InterpolationMode;
}

interface DragPayload {
    type: 'knot' | 'bias' | 'bracket_move' | 'bracket_scale_left' | 'bracket_scale_right' | 'marquee';
    ids: string[];
    startX: number;
    startY: number;
    initialKnots: AdvancedGradientKnot[];
}

interface AdvancedGradientEditorProps {
    stops: GradientStop[];
    onChange: (stops: GradientStop[]) => void;
    openColorPicker: (id: string, event: React.MouseEvent, color: string) => void;
}

// --- Pure Helper Functions ---

const getInterpolatedColor = (knots: AdvancedGradientKnot[], pos: number): string => {
    const sorted = [...knots].sort((a, b) => a.position - b.position);
    if (sorted.length === 0) return '#FFFFFF';
    if (pos <= sorted[0].position) return sorted[0].color;
    if (pos >= sorted[sorted.length - 1].position) return sorted[sorted.length - 1].color;

    for (let i = 0; i < sorted.length - 1; i++) {
        if (pos >= sorted[i].position && pos <= sorted[i + 1].position) {
            const t = (pos - sorted[i].position) / (sorted[i + 1].position - sorted[i].position);
            const c1 = hexToRgb(sorted[i].color) || { r: 255, g: 255, b: 255 };
            const c2 = hexToRgb(sorted[i + 1].color) || { r: 255, g: 255, b: 255 };
            return rgbToHex(lerpRGB(c1, c2, t));
        }
    }
    return '#FFFFFF';
};

// --- Visual Components ---

const BiasIcon = () => (
    <svg width="12" height="12" viewBox="0 0 10 10" className="fill-gray-700 hover:fill-white drop-shadow-md stroke-white stroke-[0.5] pointer-events-none">
        <path d="M 5 0 L 10 5 L 5 10 L 0 5 Z" />
    </svg>
);

const KnotIcon = ({ color, isSelected }: { color: string, isSelected: boolean }) => (
    <svg width="14" height="18" viewBox="0 0 14 18" className="drop-shadow-md pointer-events-none">
        <path 
            d="M 7 0 L 14 7 L 14 17 L 0 17 L 0 7 Z" 
            fill={color} 
            stroke={isSelected ? "white" : "#555"} 
            strokeWidth={isSelected ? "2" : "1"} 
        />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const ContextMenu: React.FC<{ x: number; y: number; options: { label: string; action: () => void; disabled?: boolean; isHeader?: boolean; }[]; onClose: () => void; }> = ({ x, y, options, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    let top = y, left = x;
    // Simple bounds checking (can be improved)
    if (top + (options.length * 32) > window.innerHeight) top -= (options.length * 32 + 20);
    if (left + 200 > window.innerWidth) left -= 200;

    return createPortal(
        <div 
            ref={menuRef} 
            className="fixed bg-[#1a1f3a] border border-white/20 rounded-md shadow-2xl py-1 z-[9999] w-[200px] max-h-[400px] overflow-y-auto custom-scroll" 
            style={{ top, left }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {options.map((opt, i) => (
                opt.isHeader ? (
                    <div key={i} className="px-4 py-1 text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-white/5 mt-1 mb-1">
                        {opt.label}
                    </div>
                ) : (
                    <button key={i} onClick={() => { opt.action(); onClose(); }} disabled={opt.disabled} className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                        {opt.label}
                    </button>
                )
            ))}
        </div>, document.body
    );
};

// --- Main Component ---

const AdvancedGradientEditor: React.FC<AdvancedGradientEditorProps> = ({ stops, onChange }) => {
    const [knots, setKnots] = useState<AdvancedGradientKnot[]>([]);
    const onChangeRef = useRef(onChange); // Stable callback ref
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    // Sync props to internal state
    useEffect(() => {
        setKnots(stops.map(stop => ({
            id: stop.id, 
            position: stop.position, 
            color: stop.color,
            bias: stop.bias ?? 0.5,
            interpolation: (stop.interpolation as InterpolationMode) ?? 'linear'
        })).sort((a, b) => a.position - b.position));
    }, [stops]);

    const knotsRef = useRef(knots);
    useEffect(() => { knotsRef.current = knots; }, [knots]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; type: 'context' | 'main' } | null>(null);
    const [isBiasHandlesVisible, setIsBiasHandlesVisible] = useState(true);
    
    // Drag State
    const dragPayloadRef = useRef<DragPayload | null>(null);
    const [isDragRemoving, setIsDragRemoving] = useState(false);
    // Ref to track drag removing state synchronously for event handlers
    const isDragRemovingRef = useRef(false);
    
    const [marqueeRect, setMarqueeRect] = useState<{x:number, y:number, w:number, h:number} | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const knotTrackRef = useRef<HTMLDivElement>(null);

    // --- Logic ---

    const emitChange = useCallback((newKnots: AdvancedGradientKnot[]) => {
        const sorted = [...newKnots].sort((a, b) => a.position - b.position);
        setKnots(sorted);
        onChangeRef.current(sorted.map(({ id, position, color, bias, interpolation }) => ({ 
            id, position, color, bias, interpolation 
        })));
    }, []);

    const handleColorChange = useCallback((color: string) => {
        // Update all selected knots to the new color
        if (selectedIds.size > 0) {
            emitChange(knotsRef.current.map(k => selectedIds.has(k.id) ? { ...k, color } : k));
        }
    }, [selectedIds, emitChange]);

    // --- Clipboard & Presets ---

    const handleCopy = () => {
        const data = JSON.stringify(knotsRef.current.map(({ position, color, bias, interpolation }) => ({ position, color, bias, interpolation })));
        navigator.clipboard.writeText(data).then(() => {
             // Could add toast notification here
             console.log('Gradient copied to clipboard');
        });
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length >= 2 && data.every(k => typeof k.position === 'number' && typeof k.color === 'string')) {
                const newKnots: AdvancedGradientKnot[] = data.map((k: any, i: number) => ({
                    id: `${Date.now()}_${i}`,
                    position: k.position,
                    color: k.color,
                    bias: k.bias ?? 0.5,
                    interpolation: (k.interpolation as InterpolationMode) ?? 'linear'
                }));
                emitChange(newKnots);
                setSelectedIds(new Set());
            } else {
                alert("Invalid gradient data on clipboard.");
            }
        } catch (e) {
            console.error("Paste failed", e);
        }
    };

    const loadPreset = (presetStops: GradientStop[]) => {
        const newKnots: AdvancedGradientKnot[] = presetStops.map((s, i) => ({
             id: `${Date.now()}_${i}`,
             position: s.position,
             color: s.color,
             bias: s.bias ?? 0.5,
             interpolation: (s.interpolation as InterpolationMode) ?? 'linear'
        }));
        emitChange(newKnots);
        setSelectedIds(new Set());
    };

    // --- Interaction Handlers ---

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const payload = dragPayloadRef.current;
        if (!payload) return;
        
        const { type, ids, startX, startY, initialKnots } = payload;
        
        // Always re-measure the track rect to handle scrolling/layout shifts during drag
        const trackRect = knotTrackRef.current?.getBoundingClientRect();
        if (!trackRect) return;

        const deltaX = e.clientX - startX;
        const deltaXRatio = deltaX / trackRect.width;

        if (type === 'marquee') {
            setMarqueeRect({ 
                x: Math.min(startX, e.clientX), 
                y: Math.min(startY, e.clientY), 
                w: Math.abs(e.clientX - startX), 
                h: Math.abs(e.clientY - startY) 
            });
            return;
        }

        if (type === 'knot' || type === 'bracket_move') {
            // Kill Zone Detection
            const vDist = Math.abs(e.clientY - (trackRect.top + trackRect.height / 2));
            const hDist = Math.max(0, trackRect.left - e.clientX, e.clientX - trackRect.right);
            const isPullingAway = (vDist > 50 || hDist > 50) && initialKnots.length > ids.length;
            
            if (isDragRemovingRef.current !== isPullingAway) {
                isDragRemovingRef.current = isPullingAway;
                setIsDragRemoving(isPullingAway); // Trigger render for visual feedback
                document.body.style.cursor = isPullingAway ? 'no-drop' : 'ew-resize';
            }

            const updatedKnots = initialKnots.map(k => {
                if (ids.includes(k.id)) {
                    let newPos = Math.max(0, Math.min(1, k.position + deltaXRatio));
                    if (e.shiftKey) newPos = Math.round(newPos * 20) / 20;
                    return { ...k, position: newPos };
                }
                return k;
            });
            setKnots(updatedKnots);
        }

        if (type.startsWith('bracket_scale')) {
             const selectedKnotsInitial = initialKnots.filter(k => ids.includes(k.id));
             if (selectedKnotsInitial.length < 2) return;

             const initMin = Math.min(...selectedKnotsInitial.map(k => k.position));
             const initMax = Math.max(...selectedKnotsInitial.map(k => k.position));
             
             const pivot = type === 'bracket_scale_left' ? initMax : initMin;
             const targetEdge = type === 'bracket_scale_left' 
                ? Math.min(pivot - 0.01, initMin + deltaXRatio) 
                : Math.max(pivot + 0.01, initMax + deltaXRatio);
             
             const scale = Math.abs(targetEdge - pivot) / Math.abs(initMax - initMin);

             const updatedKnots = initialKnots.map(k => {
                 if (ids.includes(k.id)) {
                     let newPos = pivot + ((k.position - pivot) * scale);
                     return { ...k, position: Math.max(0, Math.min(1, newPos)) };
                 }
                 return k;
             });
             setKnots(updatedKnots);
        }

        if (type === 'bias') {
            const knotId = ids[0];
            const knotIndex = initialKnots.findIndex(k => k.id === knotId);
            if (knotIndex === -1 || knotIndex >= initialKnots.length - 1) return;
            
            const segmentWidth = initialKnots[knotIndex + 1].position - initialKnots[knotIndex].position;
            if (segmentWidth > 0.001) {
                let newBias = Math.max(0, Math.min(1, initialKnots[knotIndex].bias + (deltaXRatio / segmentWidth)));
                if (e.shiftKey) newBias = Math.round(newBias * 20) / 20;
                
                const newKnots = [...initialKnots];
                newKnots[knotIndex] = { ...newKnots[knotIndex], bias: newBias };
                setKnots(newKnots);
            }
        }
    }, []);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        const payload = dragPayloadRef.current;
        if (!payload) return;

        if (payload.type === 'marquee' && knotTrackRef.current) {
            const r = knotTrackRef.current.getBoundingClientRect();
            const x1 = Math.min(payload.startX, e.clientX), x2 = Math.max(payload.startX, e.clientX);
            const y1 = Math.min(payload.startY, e.clientY), y2 = Math.max(payload.startY, e.clientY);

            const newSelected = new Set<string>();
            knotsRef.current.forEach(k => {
                const kX = r.left + k.position * r.width;
                const kY = r.top + r.height / 2;
                if (kX >= x1 && kX <= x2 && kY >= y1 - 20 && kY <= y2 + 20) newSelected.add(k.id);
            });
            
            setSelectedIds(prev => (e.shiftKey || e.ctrlKey) ? new Set([...prev, ...newSelected]) : newSelected);
            setMarqueeRect(null);

        } else if (payload.type === 'knot' || payload.type === 'bracket_move') {
             if (isDragRemovingRef.current) {
                 emitChange(knotsRef.current.filter(k => !payload.ids.includes(k.id)));
                 setSelectedIds(new Set());
             } else {
                 emitChange(knotsRef.current);
             }
             isDragRemovingRef.current = false;
             setIsDragRemoving(false);

        } else {
            emitChange(knotsRef.current);
        }

        dragPayloadRef.current = null;
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [emitChange, handleMouseMove]);

    const startDrag = (type: DragPayload['type'], ids: string[], e: React.MouseEvent, overrideKnots?: AdvancedGradientKnot[]) => {
        e.preventDefault(); e.stopPropagation();
        dragPayloadRef.current = {
            type, ids, startX: e.clientX, startY: e.clientY,
            initialKnots: JSON.parse(JSON.stringify(overrideKnots || knots))
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleTrackMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click creates knots

        // Only trigger if clicking the track itself, not a child (handled by stopPropagation on children)
        if ((e.target as HTMLElement).closest('.gradient-interactive-element') || !knotTrackRef.current) return;

        const rect = knotTrackRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const color = getInterpolatedColor(knots, pos);
        
        const newKnot: AdvancedGradientKnot = {
            id: Date.now().toString(), position: pos, color, bias: 0.5, interpolation: 'linear'
        };
        
        const newKnots = [...knots, newKnot].sort((a, b) => a.position - b.position);
        
        // Immediate update
        setKnots(newKnots);
        setSelectedIds(new Set([newKnot.id]));
        emitChange(newKnots);

        // Initiate drag immediately
        startDrag('knot', [newKnot.id], e, newKnots);
    };

    // --- Menus & Keyboard ---
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIds.size === 0 || (e.target as HTMLElement).tagName === 'INPUT') return;

            if ((e.key === 'Delete' || e.key === 'Backspace') && knots.length > selectedIds.size) {
                emitChange(knots.filter(k => !selectedIds.has(k.id)));
                setSelectedIds(new Set<string>());
            } else if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                const dir = e.key === 'ArrowLeft' ? -1 : 1;
                const step = e.shiftKey ? 0.05 : 0.01;
                emitChange(knots.map(k => selectedIds.has(k.id) ? { ...k, position: Math.max(0, Math.min(1, k.position + dir * step)) } : k));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, knots, emitChange]);

    const selectionRange = useMemo(() => {
        if (selectedIds.size < 2) return null;
        const selected = knots.filter(k => selectedIds.has(k.id));
        if (selected.length === 0) return null;
        return { min: Math.min(...selected.map(k => k.position)), max: Math.max(...selected.map(k => k.position)) };
    }, [selectedIds, knots]);

    const selectedNodes = useMemo(() => knots.filter(k => selectedIds.has(k.id)), [knots, selectedIds]);
    
    const commonInterpolation = useMemo(() => {
        if (selectedNodes.length === 0) return 'linear';
        const first = selectedNodes[0].interpolation;
        return selectedNodes.every(k => k.interpolation === first) ? first : 'mixed';
    }, [selectedNodes]);

    const commonBias = useMemo(() => {
        if (selectedNodes.length === 0) return 0.5;
        const first = selectedNodes[0].bias;
        return selectedNodes.every(k => k.bias === first) ? first : -1; // -1 indicates mixed
    }, [selectedNodes]);

    const commonColor = useMemo(() => {
        if (selectedNodes.length === 0) return '#FFFFFF';
        const first = selectedNodes[0].color;
        return selectedNodes.every(k => k.color === first) ? first : selectedNodes[0].color; // Default to first if mixed
    }, [selectedNodes]);

    const handleMultiPropertyChange = (prop: keyof AdvancedGradientKnot, value: any) => {
        const updatedKnots = knots.map(k => selectedIds.has(k.id) ? { ...k, [prop]: value } as AdvancedGradientKnot : k);
        emitChange(updatedKnots);
    };
    
    const getContextMenuOptions = () => {
        // Default Right-Click Options
        const baseOptions = [
            { label: 'Invert Gradient', action: () => emitChange(knots.map(k => ({ ...k, position: 1 - k.position })).reverse()) },
            { label: 'Double Knots', action: () => emitChange([...knots.map(k => ({...k, position: k.position * 0.5})), ...knots.map((k, i) => ({...k, id: `${Date.now()}_${i}`, position: 0.5 + k.position * 0.5}))]) },
            { label: 'Distribute Selected', disabled: selectedIds.size < 3, action: () => {
                const targets = knots.filter(k => selectedIds.has(k.id)).sort((a,b)=>a.position-b.position);
                const step = (targets[targets.length-1].position - targets[0].position) / (targets.length - 1);
                emitChange(knots.map(k => selectedIds.has(k.id) ? { ...k, position: targets[0].position + step * targets.findIndex(t => t.id === k.id) } : k));
            }},
            { label: 'Delete Selected', disabled: selectedIds.size === 0 || knots.length <= 2, action: () => { emitChange(knots.filter(k => !selectedIds.has(k.id))); setSelectedIds(new Set<string>()); } },
            { label: isBiasHandlesVisible ? 'Hide Bias Handles' : 'Show Bias Handles', action: () => setIsBiasHandlesVisible(!isBiasHandlesVisible) },
            { label: 'Reset', action: () => { emitChange([{ id: '1', position: 0, color: '#000000', bias: 0.5, interpolation: 'linear' }, { id: '2', position: 1, color: '#FFFFFF', bias: 0.5, interpolation: 'linear' }]); setSelectedIds(new Set<string>()); } }
        ];
        return baseOptions;
    };

    const getMainMenuOptions = () => {
        return [
            { label: 'Actions', isHeader: true, action: () => {} },
            { label: 'Copy Gradient', action: handleCopy },
            { label: 'Paste Gradient', action: handlePaste },
            { label: 'Presets', isHeader: true, action: () => {} },
            ...GRADIENT_PRESETS.map(p => ({
                label: p.name,
                action: () => loadPreset(p.stops)
            }))
        ];
    };

    return (
        <div 
            className="w-full select-none p-4 -m-2" 
            ref={containerRef}
            onMouseDown={(e) => {
                if (e.button !== 0) return; 
                if (!(e.target as HTMLElement).closest('.gradient-interactive-element')) {
                    if (!e.shiftKey && !e.ctrlKey && !knotTrackRef.current?.contains(e.target as Node)) {
                         setSelectedIds(new Set<string>());
                    }
                    if (!knotTrackRef.current?.contains(e.target as Node)) {
                        startDrag('marquee', [] as string[], e);
                    }
                }
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div 
                    className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider gradient-interactive-element" 
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span>Color Gradient</span>
                    <span className={`transform transition-transform duration-200 text-base ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                </div>
                
                {/* Main Menu Button */}
                <button
                    className="gradient-interactive-element p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY + 10, type: 'main' }); }}
                >
                    <MenuIcon />
                </button>
            </div>

            <div className="relative" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'context' }); }}>
                {/* Gradient Bar */}
                <div 
                    className="h-8 w-full rounded-t border border-white/20 relative mb-0 cursor-pointer" 
                    style={{ background: getGradientCssString(knots) }} 
                    onDoubleClick={(e) => { e.preventDefault(); setSelectedIds(new Set(knots.map(k => k.id))); }} 
                    title="Double-click to select all"
                >
                     {isBiasHandlesVisible && [...knots].sort((a, b) => a.position - b.position).map((k, i, arr) => {
                        if (i >= arr.length - 1 || arr[i+1].position - k.position < 0.02) return null;
                        const visualPos = k.position + (arr[i+1].position - k.position) * k.bias;
                        return (
                            <div 
                                key={`bias-${k.id}`} 
                                className="bias-handle gradient-interactive-element absolute top-1/2 -translate-y-1/2 w-3 h-3 transform -translate-x-1/2 cursor-ew-resize z-10" 
                                style={{ left: `${visualPos * 100}%` }} 
                                onMouseDown={(e) => {
                                    if(e.button === 0) startDrag('bias', [k.id], e);
                                }}
                            >
                                <BiasIcon />
                            </div>
                        );
                    })}
                </div>

                {/* Knot Track */}
                <div 
                    ref={knotTrackRef} 
                    className="h-6 w-full bg-white/5 border-x border-b border-white/10 relative rounded-b cursor-crosshair" 
                    onMouseDown={handleTrackMouseDown} 
                    title="Click & Drag to add/move knot"
                >
                    {knots.map(knot => (
                        <div 
                            key={knot.id} 
                            className={`gradient-interactive-element absolute top-0 w-4 h-5 -ml-2 cursor-grab active:cursor-grabbing z-20 flex flex-col items-center group transition-opacity duration-200 ${isDragRemoving && selectedIds.has(knot.id) ? 'opacity-30' : 'opacity-100'}`} 
                            style={{ left: `${knot.position * 100}%` }} 
                            onMouseDown={(e) => {
                                e.stopPropagation(); 
                                const isRightClick = e.button === 2;
                                let newSel = new Set(selectedIds);
                                if (e.shiftKey || e.ctrlKey) {
                                    if (selectedIds.has(knot.id)) newSel.delete(knot.id);
                                    else newSel.add(knot.id);
                                } else {
                                    if (!selectedIds.has(knot.id) || !isRightClick) {
                                        newSel = new Set([knot.id]);
                                    }
                                }
                                setSelectedIds(newSel);
                                if (!isRightClick) {
                                    startDrag('knot', Array.from(newSel), e);
                                }
                            }}
                        >
                            <KnotIcon color={knot.color} isSelected={selectedIds.has(knot.id)} />
                        </div>
                    ))}

                    {/* Multi-Select Bracket */}
                    {selectionRange && (
                        <div className="gradient-interactive-element absolute -bottom-3 h-3 border-l-2 border-r-2 border-b-4 border-[#6D48E3] z-10" style={{ left: `calc(${selectionRange.min * 100}% - 15px)`, width: `calc(${(selectionRange.max - selectionRange.min) * 100}% + 30px)`, pointerEvents: 'none' }}>
                             <div className="absolute bottom-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing pointer-events-auto" onMouseDown={(e) => { if(e.button===0) startDrag('bracket_move', Array.from(selectedIds), e); }} />
                             <div className="absolute bottom-0 -left-0 w-2 h-4 bg-[#6D48E3] cursor-ew-resize pointer-events-auto rounded-sm" onMouseDown={(e) => { if(e.button===0) startDrag('bracket_scale_left', Array.from(selectedIds), e); }} />
                             <div className="absolute bottom-0 -right-0 w-2 h-4 bg-[#6D48E3] cursor-ew-resize pointer-events-auto rounded-sm" onMouseDown={(e) => { if(e.button===0) startDrag('bracket_scale_right', Array.from(selectedIds), e); }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Panel */}
            {isExpanded && (
                <div className="mt-4 p-2 bg-black/20 rounded border border-white/10 space-y-3 animate-fade-in gradient-interactive-element">
                    {selectedNodes.length > 0 ? (
                        <>
                             <div className="flex justify-between items-center">
                                <label className="text-xs text-gray-400">Interpolation</label>
                                <select 
                                    value={commonInterpolation} 
                                    onChange={(e) => handleMultiPropertyChange('interpolation', e.target.value as InterpolationMode)} 
                                    className="bg-black/40 border border-white/20 rounded text-xs px-1 py-0.5 text-white"
                                >
                                    {commonInterpolation === 'mixed' && <option value="mixed">Mixed</option>}
                                    <option value="linear">Linear</option>
                                    <option value="step">Step</option>
                                    <option value="smooth">Smooth</option>
                                </select>
                             </div>
                             
                             {selectedNodes.length === 1 && (
                                 <Slider label="Position" value={selectedNodes[0].position * 100} min={0} max={100} step={0.1} onChange={(val) => handleMultiPropertyChange('position', val / 100)} />
                             )}
                             
                             <Slider 
                                label="Bias" 
                                value={commonBias === -1 ? 50 : commonBias * 100} 
                                min={0} max={100} step={1} 
                                onChange={(val) => handleMultiPropertyChange('bias', val / 100)}
                                overrideInputText={commonBias === -1 ? "Mixed" : undefined}
                             />
                             
                             <div className="mt-3 pt-2 border-t border-white/10">
                                <EmbeddedColorPicker color={commonColor} onColorChange={handleColorChange} />
                             </div>
                        </>
                    ) : (
                        <div className="text-xs text-gray-400 text-center py-2">Select knot(s) to edit properties</div>
                    )}
                </div>
            )}

            {/* Marquee & Menu */}
            {marqueeRect && createPortal(<div className="fixed border border-blue-400 bg-blue-500/20 z-[9999] pointer-events-none" style={{ left: marqueeRect.x, top: marqueeRect.y, width: marqueeRect.w, height: marqueeRect.h }} />, document.body)}
            
            {contextMenu && <ContextMenu 
                x={contextMenu.x} 
                y={contextMenu.y} 
                onClose={() => setContextMenu(null)} 
                options={contextMenu.type === 'main' ? getMainMenuOptions() : getContextMenuOptions()} 
            />}
        </div>
    );
};

export default AdvancedGradientEditor;
