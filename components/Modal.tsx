
import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity pointer-events-auto"
            onClick={onClose}
        >
            <div
                className="dynamic-blur border border-white/10 rounded-xl p-8 relative w-full max-w-lg shadow-2xl m-4"
                onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up to the backdrop
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl w-8 h-8 flex items-center justify-center"
                    aria-label="Close modal"
                >
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;