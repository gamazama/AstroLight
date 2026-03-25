import React from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';
import Modal from './Modal';

const JplDebugModal: React.FC = () => {
    const { jplDebugData, actions } = useAppStore(state => ({
        jplDebugData: state.jplDebugData,
        actions: {
            closeJplDebugModal: state.actions.closeJplDebugModal,
        }
    }), shallow);

    if (!jplDebugData) {
        return null;
    }

    const { planetName, rawData } = jplDebugData;

    return (
        <Modal isOpen={!!jplDebugData} onClose={actions.closeJplDebugModal}>
            <div>
                <h2 className="text-2xl font-bold mb-4">JPL HORIZONS Raw Data: <span className="text-indigo-300">{planetName}</span></h2>
                <div className="max-h-[60vh] overflow-auto bg-black/30 p-4 rounded-md border border-white/10">
                    <pre 
                        className="text-xs text-gray-300 whitespace-pre-wrap break-all"
                        style={{ userSelect: 'text' }}
                    >
                        {rawData}
                    </pre>
                </div>
            </div>
        </Modal>
    );
};

export default JplDebugModal;