
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const frequencyToNote = (frequency: number): string => {
    if (!frequency || !isFinite(frequency) || frequency <= 0) return '---';
    
    // A4 = 440Hz, MIDI note 69
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
    const midi = Math.round(noteNum);
    const noteIndex = (midi % 12 + 12) % 12; // Handle negative midi indices safely
    const note = NOTES[noteIndex];
    const octave = Math.floor(midi / 12) - 1;
    const cents = Math.floor((noteNum - midi) * 100);
    
    const sign = cents >= 0 ? '+' : '';
    return `${note}${octave} ${sign}${cents}c`;
};
