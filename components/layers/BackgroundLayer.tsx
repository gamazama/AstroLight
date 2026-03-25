
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import LayerItem from './LayerItem';
import ToggleSwitch from '../shared/ToggleSwitch';
import Slider from '../shared/Slider';
import { BACKGROUND_PRESETS } from '../../data/backgroundPresets';
import { SKYBOX_IMAGES } from '../../data/skyboxData';
import { shallow } from 'zustand/shallow';
import { initialBackgroundState } from '../../initialState';

const BackgroundIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 14l4.5-4.5a2.12 2.12 0 013 0l2.5 2.5M13 11l3.5-3.5a2.12 2.12 0 013 0l2.5 2.5" />
    </svg>
);
const NebulaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 13.5C3.5 13.5 2 11.5 2 9.5C2 7.5 3.5 6 5.5 6C6.5 6 7.5 6.5 8 7.5C8.5 5.5 10.5 4 12.5 4C15 4 16.5 6 16.5 8C18 8 19 8.5 20 9.5C21.5 11 21.5 13.5 19.5 15.5C18.5 16.5 16.5 18 14 18C11.5 18 10.5 16.5 9.5 15.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18C10 20 7 20 5.5 18.5C4 17 4 15 5.5 13.5" />
    </svg>
);
const StarsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.5 18.75l1.188-.648a2.25 2.25 0 011.423-1.423L16.25 15l.648 1.188a2.25 2.25 0 011.423 1.423L18.75 18l-1.188.648a2.25 2.25 0 01-1.423 1.423z" /></svg>;

// Updated Colors Icon
const ColorsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402a3.75 3.75 0 00-.625-6.25a3.75 3.75 0 00-6.25-.625l-6.402 6.401a3.75 3.75 0 000 5.304m7.072-7.072l2.122-2.122a1.5 1.5 0 000-2.122l-2.122-2.122a1.5 1.5 0 00-2.122 0l-2.122 2.122m7.072 7.072l-2.122 2.122a1.5 1.5 0 000 2.122l2.122 2.122a1.5 1.5 0 002.122 0l2.122-2.122" />
    </svg>
);


interface BackgroundLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
    isStarsExpanded: boolean;
    onToggleStarsExpand: () => void;
    isNebulaExpanded: boolean;
    onToggleNebulaExpand: () => void;
    isSkyboxExpanded: boolean;
    onToggleSkyboxExpand: () => void;
    isBgColorExpanded: boolean;
    onToggleBgColorExpand: () => void;
    animate: boolean;
}

const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ isExpanded, onToggleExpand, onHeaderClick, isStarsExpanded, onToggleStarsExpand, isNebulaExpanded, onToggleNebulaExpand, isSkyboxExpanded, onToggleSkyboxExpand, isBgColorExpanded, onToggleBgColorExpand, animate }) => {
    const { 
        isSkyboxEnabled, skyboxImage, skyboxOpacity, 
        nebulaOpacity, nebulaParticleSize, nebulaYOffset, showStars, starCount, starSize, 
        starOpacity, showStarColors, starTwinkleAmount, useGradientBackground, 
        backgroundColor1, backgroundColor2, showNebula, 
        showBackgroundColor,
        webGLStarSpeed, webGLStarColor,
        openColorPicker,
        adjustParameter,
        updateUI,
        markFeatureUsed,
    } = useAppStore(state => ({
        isSkyboxEnabled: state.isSkyboxEnabled,
        skyboxImage: state.skyboxImage,
        skyboxOpacity: state.skyboxOpacity,
        nebulaOpacity: state.nebulaOpacity,
        nebulaParticleSize: state.nebulaParticleSize,
        nebulaYOffset: state.nebulaYOffset,
        showStars: state.showStars,
        starCount: state.starCount,
        starSize: state.starSize,
        starOpacity: state.starOpacity,
        showStarColors: state.showStarColors,
        starTwinkleAmount: state.starTwinkleAmount,
        useGradientBackground: state.useGradientBackground,
        backgroundColor1: state.backgroundColor1,
        backgroundColor2: state.backgroundColor2,
        showNebula: state.showNebula,
        showBackgroundColor: state.showBackgroundColor,
        webGLStarSpeed: state.webGLStarSpeed,
        webGLStarColor: state.webGLStarColor,
        openColorPicker: state.actions.openColorPicker,
        adjustParameter: state.actions.adjustParameter,
        updateUI: state.actions.updateUI,
        markFeatureUsed: state.actions.markFeatureUsed,
    }), shallow);
    
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (animate) {
            setAnimationClass('animate-layer-reveal');
        }
    }, [animate]);

    const handleSubLayerHeaderClick = (layerToExpand: 'skybox' | 'nebula' | 'stars' | 'bgColor') => {
        const expandedStates = {
            skybox: isSkyboxExpanded,
            nebula: isNebulaExpanded,
            stars: isStarsExpanded,
            bgColor: isBgColorExpanded,
        };
        const toggles = {
            skybox: onToggleSkyboxExpand,
            nebula: onToggleNebulaExpand,
            stars: onToggleStarsExpand,
            bgColor: onToggleBgColorExpand,
        };

        const isTargetCurrentlyExpanded = expandedStates[layerToExpand];

        // Close all layers that are currently open
        for (const layer in expandedStates) {
            if (expandedStates[layer as keyof typeof expandedStates]) {
                toggles[layer as keyof typeof toggles]();
            }
        }

        // If the target layer was not already expanded, open it.
        if (!isTargetCurrentlyExpanded) {
            toggles[layerToExpand]();
            markFeatureUsed('background_tweaked'); // Mark as used when user explores background
        }
    };

    return (
        <div id="background-layer-header">
            <LayerItem
                label="Background"
                icon={<BackgroundIcon />}
                isVisible={true}
                hideVisibilityToggle={true}
                isExpandable
                isExpanded={isExpanded}
                onToggleExpand={onToggleExpand}
                onHeaderClick={onHeaderClick}
                className={animationClass}
                onAnimationEnd={() => setAnimationClass('')}
            >
                <div className="p-2 space-y-1 pb-3">
                    <LayerItem
                        label="Background Image"
                        icon={<BackgroundIcon />}
                        isVisible={isSkyboxEnabled}
                        onToggleVisibility={() => adjustParameter({ isSkyboxEnabled: !isSkyboxEnabled })}
                        isExpandable
                        isExpanded={isSkyboxExpanded}
                        onToggleExpand={onToggleSkyboxExpand}
                        onHeaderClick={() => handleSubLayerHeaderClick('skybox')}
                    >
                        <div className="pt-2 px-2 pb-3">
                            <div className="mb-4">
                                <label className="text-sm flex justify-between items-center mb-2">
                                    <span>Skybox Image</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SKYBOX_IMAGES.map(image => (
                                        <button
                                            key={image.path}
                                            onClick={() => adjustParameter({ skyboxImage: image.path })}
                                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${skyboxImage === image.path ? 'bg-indigo-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                                        >
                                            {image.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Slider
                                label="Image Opacity"
                                value={skyboxOpacity}
                                min={0} max={1} step={0.01}
                                onChange={(v) => adjustParameter({ skyboxOpacity: v })}
                                onReset={() => adjustParameter({ skyboxOpacity: initialBackgroundState.skyboxOpacity })}
                            />
                        </div>
                    </LayerItem>

                    <LayerItem
                        label="Nebula"
                        icon={<NebulaIcon />}
                        isVisible={showNebula}
                        onToggleVisibility={() => adjustParameter({ showNebula: !showNebula })}
                        isExpandable
                        isExpanded={isNebulaExpanded}
                        onToggleExpand={onToggleNebulaExpand}
                        onHeaderClick={() => handleSubLayerHeaderClick('nebula')}
                    >
                        <div className="pt-2 px-2 pb-3">
                            <Slider
                                label="Nebula Opacity"
                                value={nebulaOpacity}
                                min={0.01} max={1} step={0.01}
                                onChange={(v) => adjustParameter({ nebulaOpacity: v })}
                                onReset={() => adjustParameter({ nebulaOpacity: initialBackgroundState.nebulaOpacity })}
                                logarithmic
                                logMin={0.01}
                                logMax={1}
                            />
                            <Slider
                                label="Nebula Particle Size"
                                value={nebulaParticleSize}
                                min={10} max={1000} step={1}
                                onChange={(v) => adjustParameter({ nebulaParticleSize: v })}
                                onReset={() => adjustParameter({ nebulaParticleSize: initialBackgroundState.nebulaParticleSize })}
                            />
                            <Slider
                                label="Nebula Offset"
                                value={nebulaYOffset}
                                min={-1000} max={1000} step={1}
                                onChange={(v) => adjustParameter({ nebulaYOffset: v })}
                                onReset={() => adjustParameter({ nebulaYOffset: initialBackgroundState.nebulaYOffset })}
                            />
                        </div>
                    </LayerItem>
                    <LayerItem
                        label="Stars"
                        icon={<StarsIcon />}
                        isVisible={showStars}
                        onToggleVisibility={() => adjustParameter({ showStars: !showStars })}
                        isExpandable
                        isExpanded={isStarsExpanded}
                        onToggleExpand={onToggleStarsExpand}
                        onHeaderClick={() => handleSubLayerHeaderClick('stars')}
                        rightAccessory={
                            !showStarColors && (
                                <div 
                                    className="w-6 h-6 rounded-md border border-white/30 cursor-pointer"
                                    style={{ backgroundColor: webGLStarColor }}
                                    onClick={(e) => { e.stopPropagation(); openColorPicker({ type: 'background', key: 'webGLStarColor' as any }, e, webGLStarColor); }}
                                    title="Set star color tint"
                                ></div>
                            )
                        }
                    >
                        <div className="pt-2 px-2 pb-3">
                            <Slider
                                label="Density"
                                value={starCount}
                                min={0} max={50000} step={100}
                                onChange={(v) => adjustParameter({ starCount: v })}
                                onHighFrequencyChange={(v) => adjustParameter({ starCount: v })}
                                onReset={() => adjustParameter({ starCount: initialBackgroundState.starCount })}
                            />
                            <Slider
                                label="Size"
                                value={starSize}
                                min={0.1} max={200} step={0.1}
                                onChange={(v) => adjustParameter({ starSize: v })}
                                onReset={() => adjustParameter({ starSize: initialBackgroundState.starSize })}
                                logarithmic
                                logMin={0.1}
                                logMax={200}
                            />
                            <Slider
                                label="Opacity"
                                value={starOpacity}
                                min={0} max={1} step={0.01}
                                onChange={(v) => adjustParameter({ starOpacity: v })}
                                onReset={() => adjustParameter({ starOpacity: initialBackgroundState.starOpacity })}
                            />
                            <div className="mt-2 pt-3 pb-2 border-t border-white/10">
                                <ToggleSwitch
                                    label="Fixed Star Colors"
                                    checked={showStarColors}
                                    onChange={v => adjustParameter({ showStarColors: v })}
                                />
                                <Slider
                                    label="Twinkle Amount"
                                    value={starTwinkleAmount}
                                    min={0} max={1} step={0.01}
                                    onChange={(v) => adjustParameter({ starTwinkleAmount: v })}
                                    onReset={() => adjustParameter({ starTwinkleAmount: initialBackgroundState.starTwinkleAmount })}
                                />
                                <Slider
                                    label="Twinkle Speed"
                                    value={webGLStarSpeed}
                                    min={0} max={30} step={0.1}
                                    onChange={(v) => adjustParameter({ webGLStarSpeed: v })}
                                    onReset={() => adjustParameter({ webGLStarSpeed: initialBackgroundState.webGLStarSpeed })}
                                />
                            </div>
                        </div>
                    </LayerItem>
                    <LayerItem
                        label="Background Colors"
                        icon={<ColorsIcon />}
                        isVisible={showBackgroundColor}
                        hideVisibilityToggle={false}
                        onToggleVisibility={() => adjustParameter({ showBackgroundColor: !showBackgroundColor })}
                        isExpandable
                        isExpanded={isBgColorExpanded}
                        onToggleExpand={onToggleBgColorExpand}
                        onHeaderClick={() => handleSubLayerHeaderClick('bgColor')}
                    >
                        <div className="pt-2 px-2 pb-3">
                             {useGradientBackground && (
                                <div className="mb-3 relative group">
                                    <div 
                                        className="h-8 w-full rounded-md border border-white/20" 
                                        style={{ background: `linear-gradient(to right, ${backgroundColor1}, ${backgroundColor2})` }}
                                    />
                                    <div className="absolute inset-0 flex justify-between items-center px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); openColorPicker({ type: 'background', key: 'backgroundColor1' }, e, backgroundColor1); }} 
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" 
                                            style={{backgroundColor: backgroundColor1}}
                                            title="Centre Color"
                                        ></div>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); openColorPicker({ type: 'background', key: 'backgroundColor2' }, e, backgroundColor2); }} 
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" 
                                            style={{backgroundColor: backgroundColor2}}
                                            title="Outer Color"
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {!useGradientBackground && (
                                <div className="flex items-center justify-between py-2 relative">
                                    <label className="text-sm">Solid Color</label>
                                    <div
                                        className="w-8 h-6 rounded-md border border-white/20 cursor-pointer"
                                        style={{ backgroundColor: backgroundColor2 }}
                                        onClick={(e) => openColorPicker({ type: 'background', key: 'backgroundColor2' }, e, backgroundColor2)}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                            )}

                            <ToggleSwitch
                                label="Use Gradient"
                                checked={useGradientBackground}
                                onChange={v => adjustParameter({ useGradientBackground: v })}
                            />
                            <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-white/10">
                                {BACKGROUND_PRESETS.map(p => (
                                    <button
                                        key={p.name}
                                        title={p.name}
                                        onClick={() => {
                                            adjustParameter({ backgroundColor1: p.colors[0] });
                                            adjustParameter({ backgroundColor2: p.colors[1] });
                                        }}
                                        className="h-8 w-full rounded-md border-2 border-transparent hover:border-white/50 transition-colors"
                                        style={{ background: `linear-gradient(45deg, ${p.colors[0]}, ${p.colors[1]})` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </LayerItem>
                </div>
            </LayerItem>
        </div>
    );
};

export default BackgroundLayer;
