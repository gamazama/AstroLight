

export interface BackgroundPreset {
  name: string;
  colors: [string, string];
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
    // --- Dark & Thematic ---
    { name: 'Deep Space', colors: ['#0a0e27', '#1a1f3a'] },
    { name: 'Cosmic Ocean', colors: ['#0d1b2a', '#415a77'] },
    { name: 'Twilight', colors: ['#1c2d4a', '#3e5e8e'] },
    { name: 'Orion', colors: ['#2c003e', '#5a189a'] },
    { name: 'Andromeda', colors: ['#03071e', '#370617'] },
    { name: 'Emerald Nebula', colors: ['#0b2e26', '#1a594a'] },
    { name: 'Crimson Dawn', colors: ['#2c0a1f', '#5a1d3d'] },
    { name: 'Supernova', colors: ['#6a040f', '#f72585'] },
    
    // --- Monochromatic & Greys ---
    { name: 'Void', colors: ['#4A4A4A', '#000000'] },
    { name: 'Charcoal Sky', colors: ['#A9A9A9', '#2C2F33'] },
    { name: 'Lunar Surface', colors: ['#4A4A4A', '#BCC2C7'] },
    { name: 'Silver Mist', colors: ['#686868', '#E0E0E0'] },

    // --- Light ---
    { name: 'Starlight', colors: ['#7D705C', '#f7f3e3'] },
    { name: 'Paper', colors: ['#333333', '#FFFFFF'] },
];