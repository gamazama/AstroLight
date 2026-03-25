# 5. Server & Build Reference

## The Server (`server/`)
A lightweight Node.js/Express server is provided to handle API proxying.

*   **`server/server.js`**:
    *   **Static Serving**: Serves the built frontend files (index.html, assets).
    *   **API Proxy (`/api-proxy`)**: Forwards requests to the Google Gemini API. This hides the API key from the client-side code. It handles both standard HTTP requests and WebSocket upgrades for the Gemini Live API.
    *   **Rate Limiting**: Uses `express-rate-limit` to prevent abuse.

## Build Configuration
*   **`tsconfig.json`**: TypeScript configuration.
*   **`vite.config.ts`** (implied): The project uses Vite for bundling.
*   **`index.html`**: Uses an `importmap` to load dependencies like React, Three.js, and Zustand from CDNs (e.g., `aistudiocdn.com`). This allows the app to run without a heavy local `node_modules` bundle in some environments.

## Environment Variables
*   **`API_KEY`**: The Google Gemini API key. Should be set in a `.env` file for the server.
