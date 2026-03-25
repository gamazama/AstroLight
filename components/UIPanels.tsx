
import React from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

import TopMenu from './TopMenu';
import BrushCursor from './BrushCursor';
import BrushPanel from './BrushPanel';
import TimeDatePanel from './TimeDatePanel';
import PlanetInfoPanel from './PlanetInfoPanel';
import ObjectsPanel from './ObjectsPanel';
import BottomControls from './BottomControls';
import SettingsPanel from './SettingsPanel';

const UIPanels: React.FC = () => {
    const { showIntroScreen, isFullscreen, isBrushMode, useRealisticPhysics, markFeatureUsed } = useAppStore(state => ({
        showIntroScreen: state.showIntroScreen,
        isFullscreen: state.isFullscreen,
        isBrushMode: state.isBrushMode,
        useRealisticPhysics: state.useRealisticPhysics,
        markFeatureUsed: state.actions.markFeatureUsed,
    }), shallow);

    if (showIntroScreen) {
        return null;
    }
    
    // --- SANDBOX MODE ---
    return (
        <>
            {!isFullscreen && (
                <>
                    <TopMenu />
                    <SettingsPanel />

                    {isBrushMode && <BrushCursor />}
                    {isBrushMode && <BrushPanel />}

                    <TimeDatePanel showDateControls={true} />
                    <PlanetInfoPanel />
                    <ObjectsPanel 
                        showConnectionsLayer={true}
                        showLinesLayer={true}
                        showOrbitsLayer={true}
                        showBackgroundLayer={true}
                        showCameraLayer={true}
                        areConnectionsExpandable={true}
                        showConnectionColor={true}
                        showConnectionDelete={true}
                        showPlanetSettings={!useRealisticPhysics}
                        animateLayer={null}
                        isLinesActivationRequired={false}
                        onLinesActivate={() => {}}
                    />
                </>
            )}
            <BottomControls 
                showSpeedSlider={true}
                showPlayPause={true}
                showRewind={true}
                showSaveImage={true}
                showFullscreen={true}
                onSpeedSliderUsed={() => markFeatureUsed('speed_slider_ui')}
                onSaveImageClick={() => markFeatureUsed('save_image_clicked')}
            />
        </>
    );
};

export default UIPanels;