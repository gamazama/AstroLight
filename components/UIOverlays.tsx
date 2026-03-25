import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';

import ScrubIndicator from './ScrubIndicator';
import SoundCreator from '../AstroSound/components/SoundCreator';
import UIGuidePulse from './UIGuidePulse';
import ControlCircle from './ControlCircle';
import IntroScreen from './IntroScreen';
import ColorPicker from './ColorPicker';
import DatePicker from './DatePicker';
import ConnectionLine from './ConnectionLine';
import PlanetConnectionLine from './PlanetConnectionLine';
import Notification from './Notification';
import Tooltip from './Tooltip';
import Modal from './Modal';
import ShortcutsModal from './ShortcutsModal';
import BeginnerHint from './BeginnerHint';
import SoundEngineLoader from '../AstroSound/components/SoundEngineLoader';
import ConfirmationDialog from './ConfirmationDialog';
import PlanetEditorPanel from './PlanetEditorPanel';
import { shallow } from 'zustand/shallow';
import JplDebugModal from './JplDebugModal';
import AboutContent from './AboutContent';
import BackgroundLoader from './BackgroundLoader';

const UIOverlays: React.FC = () => {
    const appState = useAppStore(state => state, shallow);
    const { actions } = appState;

    const prevIsSoundCreator2Open = useRef(appState.isSoundCreator2Open);
    const originalFullscreenState = useRef<boolean | null>(null);

    useEffect(() => {
        if (appState.isSoundCreator2Open && !prevIsSoundCreator2Open.current) { // Just opened
            originalFullscreenState.current = appState.isFullscreen;
            actions.updateUI({ isFullscreen: true });
        } else if (!appState.isSoundCreator2Open && prevIsSoundCreator2Open.current) { // Just closed
            if (originalFullscreenState.current !== null) {
                actions.updateUI({ isFullscreen: originalFullscreenState.current });
                originalFullscreenState.current = null;
            }
        }
        prevIsSoundCreator2Open.current = appState.isSoundCreator2Open;
    }, [appState.isSoundCreator2Open, appState.isFullscreen, actions]);

    const formatSpeed = (s: number) => {
        if (s < 100) return s.toFixed(3);
        return s.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const isTopMenuVisible = !appState.isFullscreen && !appState.showIntroScreen;

    return (
        <>
            {appState.isSpeedScrubbing && <ScrubIndicator label="Speed" value={appState.timeSpeed} formatValue={s => `${formatSpeed(s)}x`} mousePosition={appState.mousePosition} />}
            {appState.isZOffsetScrubbing && <ScrubIndicator label="Planet Offset" value={appState.targetZOffset} formatValue={v => v.toFixed(0)} mousePosition={appState.mousePosition} />}
            {appState.isDriftScrubbing && <ScrubIndicator label="Drift Speed" value={appState.lineZDriftSpeed} formatValue={v => v.toFixed(2)} mousePosition={appState.mousePosition} />}
            {appState.isFovScrubbing && <ScrubIndicator label="Field of View" value={appState.targetFov} formatValue={v => `${Math.round(v)}°`} mousePosition={appState.mousePosition} />}
            
            {appState.isSoundCreator2Open && <SoundCreator />}
            
            <SoundEngineLoader />

            <BackgroundLoader />

            {appState.uiGuidePulse && (
                <UIGuidePulse
                    targetId={appState.uiGuidePulse.targetId}
                    onComplete={actions.clearUIGuidePulse}
                    loop={appState.uiGuidePulse.loop}
                />
            )}

            {appState.controlCircle && (
                <ControlCircle
                    position={{ x: appState.controlCircle.x, y: appState.controlCircle.y }}
                    size={appState.controlCircle.size}
                    visible={appState.controlCircle.visible}
                />
            )}
            
            {appState.showIntroScreen && (
                 <IntroScreen
                    onOpenAbout={() => actions.updateUI({ isAboutModalOpen: true })}
                    onStartSandbox={actions.handleStartSandbox}
                    onImport={actions.importConfig}
                />
            )}

            {appState.isStartDatePickerOpen && (
                <DatePicker
                    currentDate={appState.startDate}
                    onClose={actions.closeStartDatePicker}
                    onDateSelect={actions.setStartDateAndReset}
                />
            )}
            
            {appState.isEndDatePickerOpen && (
                <DatePicker
                    currentDate={appState.endDate || appState.startDate}
                    onClose={actions.closeEndDatePicker}
                    onDateSelect={actions.setEndDateAndReset}
                    onClear={actions.clearEndDate}
                />
            )}

            {appState.colorPicker && (
                <ColorPicker
                    info={appState.colorPicker}
                    initialColor={appState.colorPicker.initialColor}
                    onColorChange={actions.updateColor}
                    onClose={(revert) => actions.closeColorPicker(revert)}
                />
            )}
            
            {appState.connectionLine && (
                <ConnectionLine
                    info={appState.connectionLine}
                    onAnimationEnd={actions.clearConnectionLine}
                />
            )}
            
            <PlanetConnectionLine />

            <Notification message={appState.notification} isTopMenuVisible={isTopMenuVisible} />
            {appState.tooltip && <Tooltip info={appState.tooltip} />}
            
            <ConfirmationDialog />
            
            {appState.planetEditorPanels.map(panel => (
                <PlanetEditorPanel 
                    key={panel.planetId} 
                    planetId={panel.planetId} 
                    initialPosition={panel.position} 
                />
            ))}

            <JplDebugModal />

            {/* New Beginner Hint System */}
            <BeginnerHint />

            <Modal isOpen={appState.isAboutModalOpen} onClose={() => actions.updateUI({ isAboutModalOpen: false })}>
                <AboutContent />
            </Modal>

            <Modal isOpen={appState.isSaveInstrumentModalOpen} onClose={actions.closeSaveInstrumentModal}>
                <div>
                    <h2 className="text-2xl font-bold mb-4">Save as Instrument</h2>
                    <p className="text-sm text-gray-400 mb-6">Save the current sound graph as a reusable instrument. 'Parameter' and 'Data Source' nodes will become its controls.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold mb-1 block">Instrument Name</label>
                            <input
                                type="text"
                                value={appState.instrumentToSaveInfo?.name || ''}
                                onChange={e => actions.updateInstrumentToSaveInfo('name', e.target.value)}
                                placeholder="e.g., Cosmic Theremin"
                                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                            />
                        </div>
                         <div>
                            <label className="text-sm font-semibold mb-1 block">Description (Optional)</label>
                            <textarea
                                value={appState.instrumentToSaveInfo?.description || ''}
                                onChange={e => actions.updateInstrumentToSaveInfo('description', e.target.value)}
                                placeholder="A short description of what this instrument does or how it sounds."
                                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={actions.closeSaveInstrumentModal}
                            className="px-4 py-1.5 text-sm bg-white/10 border border-white/20 text-white rounded-lg font-medium transition-all hover:bg-white/15"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={actions.saveInstrument}
                            disabled={!appState.instrumentToSaveInfo?.name}
                            className="px-4 py-2 text-sm bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Instrument
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!appState.instrumentDataModalContent} onClose={actions.closeInstrumentDataModal}>
                {appState.instrumentDataModalContent && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{appState.instrumentDataModalContent.name} Blueprint</h2>
                        <div className="max-h-[60vh] overflow-auto bg-black/30 p-4 rounded-md border border-white/10">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                                {JSON.stringify(appState.instrumentDataModalContent, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>

            <ShortcutsModal 
                isOpen={appState.isShortcutsModalOpen}
                onClose={() => actions.updateUI({ isShortcutsModalOpen: false })}
            />
        </>
    );
};

export default UIOverlays;