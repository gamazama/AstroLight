
import React, { useRef, useEffect } from 'react';
import { useRenderer } from './hooks/useRenderer';
import { useCameraInput } from './hooks/useCameraInput';
import { useBrushInput } from './hooks/useBrushInput';
import { useOrbitRenderer } from './hooks/useOrbitRenderer';
import { useOrbitInput } from './hooks/useOrbitInput';
import { useWebGLRenderer } from './hooks/useWebGLRenderer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUIEffects } from './hooks/useUIEffects';
import UIPanels from './components/UIPanels';
import UIOverlays from './components/UIOverlays';
import { useAppStore, AppStoreState } from './store/appStore';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import { useSoundEngine } from './AstroSound/hooks/useSoundEngine';
import { useAutomaticEffects } from './hooks/useAutomaticEffects';
import { shallow } from 'zustand/shallow';
import ShareSnapshotEffect from './components/ShareSnapshotEffect';
import { usePresetTransition } from './hooks/usePresetTransition';
import { usePhysicsTransition } from './hooks/usePhysicsTransition';
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization';

const App: React.FC = () => {
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const orbitDisplayCanvasRef = useRef<HTMLCanvasElement>(null);
    const orbitIdCanvasRef = useRef<HTMLCanvasElement>(null);
    const webglCanvasRef = useRef<HTMLCanvasElement>(null);
    const appContainerRef = useRef<HTMLDivElement>(null);
    
    const idToNodeIdMapRef = useRef<Map<number, number>>(new Map());
    const { updateUI, handleGlobalMouseUp, loadFromUrl } = useAppStore(state => state.actions);


    // Initialize all core hooks
    useWebGLRenderer(webglCanvasRef);
    useRenderer(mainCanvasRef);
    useCameraInput(mainCanvasRef);
    useBrushInput(mainCanvasRef);
    useOrbitRenderer({ orbitDisplayCanvasRef, orbitIdCanvasRef, idToNodeIdMapRef });
    useOrbitInput({ mainCanvasRef, orbitIdCanvasRef, idToNodeIdMapRef });
    useAutomaticEffects();
    useKeyboardShortcuts();
    useUIEffects({ canvasRef: mainCanvasRef });
    useSimulationLoop();
    useSoundEngine();
    usePresetTransition();
    usePhysicsTransition();
    usePerformanceOptimization();

    // Effect to handle loading shared configurations from URL on app start
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const configData = urlParams.get('cconfig') || urlParams.get('config');
        if (configData) {
            loadFromUrl(configData);
        }
    }, [loadFromUrl]);

    useEffect(() => {
        appContainerRef.current?.focus();
    }, []);

    // Global mouse state listeners for parameter adjustment counting
    useEffect(() => {
        const handleMouseDown = () => {
            updateUI({ isMouseDown: true, adjustmentPending: false });
        };
        const handleMouseUp = () => {
            handleGlobalMouseUp();
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [updateUI, handleGlobalMouseUp]);
    
    return (
        <div ref={appContainerRef} className="h-screen w-screen bg-black relative outline-none" tabIndex={-1}>
            {/* --- Canvas Layer --- */}
            <canvas ref={webglCanvasRef} id="webgl-canvas" className="absolute top-0 left-0 w-full h-full block" />
            <canvas 
                ref={mainCanvasRef} 
                id="main-canvas" 
                className="absolute top-0 left-0 w-full h-full block active:cursor-grabbing z-[2]"
            />
            <canvas ref={orbitDisplayCanvasRef} id="orbit-display-canvas" className="absolute top-0 left-0 w-full h-full block pointer-events-none z-[1]" />
            <canvas ref={orbitIdCanvasRef} id="orbit-id-canvas" className="absolute top-0 left-0 w-full h-full block pointer-events-none" style={{ display: 'none' }} />

            {/* --- UI Layer --- */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                 <UIPanels />
                 <UIOverlays />
            </div>

            {/* --- Global Effects Layer --- */}
            <ShareSnapshotEffect />
        </div>
    );
};

export default App;
