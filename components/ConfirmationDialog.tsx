import React from 'react';
import Modal from './Modal';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

const ConfirmationDialog: React.FC = () => {
    const { confirmationDialog, actions } = useAppStore(state => ({
        confirmationDialog: state.confirmationDialog,
        actions: {
            closeConfirmationDialog: state.actions.closeConfirmationDialog,
        }
    }), shallow);

    if (!confirmationDialog) {
        return null;
    }

    const { title, message, onConfirm } = confirmationDialog;

    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        actions.closeConfirmationDialog();
    };

    return (
        <Modal isOpen={!!confirmationDialog} onClose={handleCancel}>
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <p className="text-gray-300 mb-6 whitespace-pre-wrap">
                    {message}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 text-white rounded-lg font-medium bg-white/10 border border-white/20 transition-colors hover:bg-white/20"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 text-white rounded-lg font-medium bg-red-600/80 border border-red-500/50 transition-colors hover:bg-red-600"
                    >
                        Discard & Proceed
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationDialog;