/**
 * Centralized render loop — replaces 4 independent requestAnimationFrame loops
 * with a single coordinated one. Callbacks run in priority order each frame.
 *
 * Priority guide:
 *   0  = simulation (updates state)
 *  10  = WebGL renderer (Three.js background + foreground)
 *  20  = 2D canvas renderer (planets, lines, particles)
 *  30  = orbit renderer (2D orbit paths)
 */

type FrameCallback = () => void;

interface Entry {
    id: string;
    fn: FrameCallback;
    priority: number;
}

const entries: Entry[] = [];
let frameId: number | null = null;

function tick() {
    frameId = requestAnimationFrame(tick);

    // Skip all rendering when tab is hidden — RAF is already throttled,
    // but this avoids wasted work on the rare ticks that still fire.
    if (document.hidden) return;

    for (let i = 0; i < entries.length; i++) {
        entries[i].fn();
    }
}

export function registerFrameCallback(id: string, fn: FrameCallback, priority: number) {
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) entries.splice(idx, 1);

    entries.push({ id, fn, priority });
    entries.sort((a, b) => a.priority - b.priority);

    if (frameId === null) {
        frameId = requestAnimationFrame(tick);
    }
}

export function unregisterFrameCallback(id: string) {
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) entries.splice(idx, 1);

    if (entries.length === 0 && frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
    }
}
