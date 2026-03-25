
import React from 'react';
import LayerItem from './LayerItem';
import PhysicsSettings from './PhysicsSettings';
import JplSettings from './JplSettings';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

// Science Flask Icon
const RealismIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;

interface RealismLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
    // Props for child components
    tooltips: { [key: string]: string };
    handleMouseEnter: (e: React.MouseEvent, content: string) => void;
    handleMouseLeave: () => void;
    isJplExpanded: boolean;
    onToggleJplExpand: () => void;
}

const RealismLayer: React.FC<RealismLayerProps> = ({ 
    isExpanded, 
    onToggleExpand, 
    onHeaderClick,
    tooltips,
    handleMouseEnter,
    handleMouseLeave,
    isJplExpanded,
    onToggleJplExpand
}) => {
    const { simulation, adjustParameter, toggleLayer } = useAppStore(state => ({
        simulation: {
            useJplHorizons: state.useJplHorizons,
        },
        adjustParameter: state.actions.adjustParameter,
        toggleLayer: state.actions.toggleLayer,
    }), shallow);
    
    // Satellite Dish Icon for JPL
    const JplIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a8 8 0 100-16 8 8 0 000 16zM12 18v4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 22h8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v8" />
            <circle cx="12" cy="10" r="1" fill="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76a6 6 0 010 8.49" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
    );

    return (
        <LayerItem
            label="Realism"
            icon={<RealismIcon />}
            isVisible={true}
            hideVisibilityToggle={true}
            isExpandable
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onHeaderClick={onHeaderClick}
        >
            <div className="p-2 pb-3">
                <PhysicsSettings 
                    tooltips={tooltips} 
                    handleMouseEnter={handleMouseEnter} 
                    handleMouseLeave={handleMouseLeave} 
                />

                <div className="mt-3 pt-3 border-t border-white/10">
                     <LayerItem
                        label="NASA JPL Data"
                        icon={<JplIcon />}
                        isVisible={simulation.useJplHorizons}
                        onToggleVisibility={() => adjustParameter({ useJplHorizons: !simulation.useJplHorizons })}
                        isExpandable
                        isExpanded={isJplExpanded}
                        onToggleExpand={onToggleJplExpand}
                    >
                        <JplSettings handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave} />
                    </LayerItem>
                </div>
            </div>
        </LayerItem>
    );
};

export default RealismLayer;
