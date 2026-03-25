
import React from 'react';
import { useAppStore } from '../store/appStore';
import { shallow } from 'zustand/shallow';

interface TimeDatePanelProps {
    showDateControls: boolean;
}

const TimeDatePanel: React.FC<TimeDatePanelProps> = ({ showDateControls }) => {
    const { 
        time, 
        startDate, 
        endDate, 
        currentSystem, 
        isTimeDatePanelCollapsed, 
        actions 
    } = useAppStore(
        (state) => ({
            time: state.time,
            startDate: state.startDate,
            endDate: state.endDate,
            currentSystem: state.currentSystem,
            isTimeDatePanelCollapsed: state.isTimeDatePanelCollapsed,
            actions: state.actions,
        }),
        shallow
    );
    
    let timeString: string;
    const usesRealTimeData = currentSystem === 'Sol' || currentSystem === 'Sol (Extended)' || currentSystem === 'Geo-centric';
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    if (usesRealTimeData) {
        const currentDate = new Date(startDate.getTime() + time * MS_PER_DAY);
        timeString = formatDate(currentDate);
    } else {
        const years = Math.floor(time / 365.25);
        const days = Math.floor(time % 365.25);
        timeString = `${years}yrs, ${days}d`;
    }

    return (
        <div id="time-date-panel" className={`fixed top-[60px] right-5 transition-transform duration-300 ease-in-out ${isTimeDatePanelCollapsed ? 'translate-x-[calc(100%+20px)]' : 'translate-x-0'} pointer-events-auto`}>
            <div 
                id="time-date-display"
                className="dynamic-blur border border-white/10 rounded-xl p-4 min-w-[220px] text-sm shadow-2xl"
            >
                <InfoItem label="Time" value={timeString} />
                {showDateControls && usesRealTimeData && (
                    <>
                        <hr className="border-white/10 my-2" />
                        <div 
                            className="flex justify-between items-center cursor-pointer group"
                            onClick={actions.openStartDatePicker}
                        >
                            <span className="text-gray-400 group-hover:text-white transition-colors">Start Date:</span>
                            <span className="font-medium text-white underline decoration-dotted group-hover:decoration-solid transition-all">{formatDate(startDate)}</span>
                        </div>
                        <div 
                            className="flex justify-between items-center mt-2 cursor-pointer group"
                            onClick={actions.openEndDatePicker}
                        >
                            <span className="text-gray-400 group-hover:text-white transition-colors">End Date:</span>
                            <span 
                                className={`font-medium transition-all ${endDate ? 'text-white underline decoration-dotted group-hover:decoration-solid' : 'text-gray-500'}`}>
                                {endDate ? formatDate(endDate) : 'Not Set'}
                            </span>
                        </div>
                    </>
                )}
            </div>
            <div
                className="absolute top-1/2 -left-4 -translate-y-1/2 w-4 h-12 dynamic-blur border border-r-0 border-white/10 rounded-l-lg flex items-center justify-center cursor-pointer text-gray-400"
                onClick={() => actions.updateUI({ isTimeDatePanelCollapsed: !isTimeDatePanelCollapsed })}
            >
                {isTimeDatePanelCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                )}
            </div>
        </div>
    );
};

const InfoItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between">
        <span className="text-gray-400">{label}:</span>
        <span className="font-medium text-white">{value}</span>
    </div>
);

export default TimeDatePanel;
