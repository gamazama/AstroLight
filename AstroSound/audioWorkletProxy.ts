/**
 * A simple proxy object to hold a reference to the AudioWorklet's port.
 * This allows Zustand actions (which are outside the React component tree)
 * to post messages directly to the audio thread without prop drilling.
 */
export const audioWorkletProxy: { port: MessagePort | null } = {
  port: null,
};
