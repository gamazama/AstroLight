
import React from 'react';

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
    return (
        <div className="mb-6 pb-5 border-b border-white/10 last:border-b-0 last:mb-0 last:pb-0">
            <h2 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">
                {title}
            </h2>
            {children}
        </div>
    );
};

export default Section;
