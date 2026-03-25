import React, { useEffect, useState } from 'react';
import { NOTIFICATION_DURATION_MS } from '../constants';

interface NotificationProps {
    message: string;
    isTopMenuVisible: boolean;
}

const parseMessage = (message: string) => {
    // Splits on **keyword** to allow for selective bolding
    const parts = message.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const Notification: React.FC<NotificationProps> = ({ message, isTopMenuVisible }) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setCurrentMessage(message);
            setIsVisible(true);

            const timer = setTimeout(() => {
                setIsVisible(false);
            }, NOTIFICATION_DURATION_MS);

            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleTransitionEnd = () => {
        if (!isVisible) {
            setCurrentMessage('');
        }
    };

    if (!currentMessage) {
        return null;
    }

    const topClass = isTopMenuVisible ? 'top-[60px]' : 'top-5';

    return (
        <div
            className={`fixed ${topClass} left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8e98f3]/95 to-[#9c78d6]/95 backdrop-blur-sm text-white px-5 py-3 rounded-lg text-sm shadow-lg transition-opacity duration-300 pointer-events-none z-50 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onTransitionEnd={handleTransitionEnd}
        >
            {parseMessage(currentMessage)}
        </div>
    );
};

export default Notification;