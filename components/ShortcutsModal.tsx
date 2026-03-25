import React from 'react';
import Modal from './Modal';

interface ShortcutItemProps {
    keys: string[];
    description: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/10">
        <span className="text-gray-300">{description}</span>
        <div className="flex items-center gap-1">
            {keys.map(key => (
                <kbd key={key} className="px-2 py-1 text-sm font-semibold text-gray-200 bg-white/10 border border-white/20 rounded-md">
                    {key}
                </kbd>
            ))}
        </div>
    </div>
);


const ShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const shortcuts = {
        'General Navigation': [
            { keys: ['Left Click', '+ Drag'], description: 'Rotate Camera' },
            { keys: ['Middle Click', '+ Drag'], description: 'Pan Camera' },
            { keys: ['Scroll Wheel'], description: 'Zoom Camera' },
            { keys: ['Double Click'], description: 'Reset Tilt & Position' },
        ],
        'Playback & Time': [
            { keys: ['Space'], description: 'Toggle Play / Pause' },
            { keys: ['R'], description: 'Reset Simulation' },
            { keys: ['S', '+ Drag'], description: 'Scrub Time Speed' },
        ],
        'Brush Mode': [
            { keys: ['B'], description: 'Toggle Brush Mode' },
            { keys: ['Left Click', '+ Drag'], description: 'Brush Lines' },
            { keys: ['Middle Click', '+ Drag'], description: 'Adjust Brush Size' },
            { keys: ['Alt', '+ Drag'], description: 'Rotate Camera (in Brush Mode)' },
        ],
        'Toggles': [
            { keys: ['F'], description: 'Toggle Fullscreen' },
            { keys: ['M'], description: 'Toggle Mute' },
            { keys: ['O'], description: 'Toggle Orbits' },
            { keys: ['P'], description: 'Toggle Planets' },
            { keys: ['L'], description: 'Toggle Live Lines' },
            { keys: ['K'], description: 'Toggle Sparkles' },
        ],
        'Advanced Controls': [
            { keys: ['['], description: 'Decrease Line Brightness' },
            { keys: [']'], description: 'Increase Line Brightness' },
            { keys: ['Z'], description: 'Reset Planet Offset (Tap)' },
            { keys: ['Z', '+ Drag ↑↓'], description: 'Scrub Planet Offset (Hold)' },
            { keys: ['D'], description: 'Disable Drift Mode (Tap)' },
            { keys: ['D', '+ Drag'], description: 'Enable & Scrub Drift (Hold)' },
            { keys: ['V'], description: 'Toggle Render Mode (Tap)' },
            { keys: ['V', '+ Drag ↑↓'], description: 'Scrub FOV (Hold, in Persp.)' },
            { keys: ['Ctrl', '+ Click'], description: 'Reset any slider value' },
        ]
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-transparent bg-clip-text">
                    Controls & Shortcuts
                </h2>
                <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 text-left">
                    <div className="space-y-4">
                        {Object.entries(shortcuts).map(([category, items]) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{category}</h3>
                                {items.map(item => <ShortcutItem key={item.description} keys={item.keys} description={item.description} />)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShortcutsModal;