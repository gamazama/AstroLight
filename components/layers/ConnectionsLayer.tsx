


import React from 'react';
import LayerItem from './LayerItem';
import ConnectionItem from '../connectionsUI/ConnectionItem';
import { useAppStore } from '../../store/appStore';
import { shallow } from 'zustand/shallow';

const ConnectionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;

interface ConnectionsLayerProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    onHeaderClick: () => void;
    areConnectionsExpandable: boolean;
    showConnectionColor: boolean;
    showConnectionDelete: boolean;
    showPlanetSettings?: boolean; // Deprecated, kept optional to prevent break if passed
}

const ConnectionsLayer: React.FC<ConnectionsLayerProps> = (props) => {
    const { 
        isExpanded, onToggleExpand, onHeaderClick, areConnectionsExpandable, 
        showConnectionColor, showConnectionDelete
    } = props;

    const { connections, clearConnections, selectedConnectionId, setSelectedConnectionId } = useAppStore(state => ({
        connections: state.connections,
        clearConnections: state.actions.clearConnections,
        selectedConnectionId: state.selectedConnectionId,
        setSelectedConnectionId: state.actions.setSelectedConnectionId,
    }), shallow);


    return (
        <LayerItem
            label="Connections"
            icon={<ConnectionsIcon />}
            isVisible={true}
            hideVisibilityToggle={true}
            isExpandable
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onHeaderClick={onHeaderClick}
        >
            <div className="p-2 pb-3">
                <div className="space-y-2 mb-2">
                    {connections.map((conn, index) => (
                        <ConnectionItem
                            key={conn.id}
                            connection={conn}
                            index={index}
                            isSelected={selectedConnectionId === conn.id}
                            onSelect={() => setSelectedConnectionId(selectedConnectionId === conn.id ? null : conn.id)}
                            isExpandable={areConnectionsExpandable}
                            showDelete={showConnectionDelete}
                            showColor={showConnectionColor}
                        />
                    ))}
                </div>
                {connections.length > 0 && showConnectionDelete && (
                    <button onClick={clearConnections} className="w-full text-center px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm text-gray-300">
                        Clear All Connections
                    </button>
                )}
                 {connections.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No connections yet.</p>
                )}
            </div>
        </LayerItem>
    );
};

export default ConnectionsLayer;