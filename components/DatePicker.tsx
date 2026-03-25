import React, { useState, useEffect, useRef } from 'react';

// --- Helper Components ---
const YearInput: React.FC<{ year: number; onChange: (year: number) => void; }> = ({ year, onChange }) => {
    const [inputValue, setInputValue] = useState(year.toString());

    useEffect(() => {
        setInputValue(year.toString());
    }, [year]);

    const commitChange = () => {
        const newYear = parseInt(inputValue, 10);
        if (!isNaN(newYear) && newYear >= 1000 && newYear <= 9999) {
            onChange(newYear);
        } else {
            setInputValue(year.toString()); // Revert if invalid
        }
    };

    return (
        <div className="relative flex items-center">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={commitChange}
                onKeyDown={(e) => e.key === 'Enter' && commitChange()}
                className="w-24 text-center bg-white/5 border border-white/10 rounded-md py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <div className="absolute right-1 flex flex-col">
                <button onClick={() => onChange(year + 1)} className="h-4 w-4 text-xs text-gray-400 hover:text-white flex items-center justify-center">▲</button>
                <button onClick={() => onChange(year - 1)} className="h-4 w-4 text-xs text-gray-400 hover:text-white flex items-center justify-center">▼</button>
            </div>
        </div>
    );
};

const JumpButton: React.FC<{amount: number, unit: string, onClick: (amount: number) => void}> = ({amount, unit, onClick}) => (
    <button 
        onClick={() => onClick(amount)}
        className="flex-1 text-xs py-1.5 bg-white/5 rounded-md transition-colors duration-100 ease-in-out hover:bg-white/15 active:bg-white/20"
    >
        {amount > 0 ? '+' : ''}{amount}{unit}
    </button>
);


// --- Main Component ---
interface DatePickerProps {
    currentDate: Date;
    onClose: () => void;
    onDateSelect: (date: Date) => void;
    onClear?: () => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DatePicker: React.FC<DatePickerProps> = ({ currentDate, onClose, onDateSelect, onClear }) => {
    const [displayDate, setDisplayDate] = useState(new Date(currentDate));
    const pickerRef = useRef<HTMLDivElement>(null);
    
    // Sync with prop, but only when it actually changes
    useEffect(() => {
        setDisplayDate(new Date(currentDate));
    }, [currentDate.getTime()]);

    // Handle closing when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const adjustYear = (amount: number) => {
        setDisplayDate(current => {
            const newDate = new Date(current);
            newDate.setFullYear(newDate.getFullYear() + amount);
            return newDate;
        });
    };
    
    const changeYear = (year: number) => {
        setDisplayDate(current => {
            const newDate = new Date(current);
            newDate.setFullYear(year);
            return newDate;
        });
    };

    const changeMonth = (monthIndex: number) => {
        setDisplayDate(current => {
            const newDate = new Date(current);
            newDate.setMonth(monthIndex);
            return newDate;
        });
    };
    
    const changeDay = (day: number) => {
        const newDate = new Date(displayDate);
        newDate.setDate(day);
        onDateSelect(newDate); // Selecting a day confirms the date
    };

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    const renderDays = () => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="grid grid-cols-7 gap-y-1 text-center">
                {DAYS_OF_WEEK.map((day, i) => <div key={i} className="text-xs text-gray-400 mb-2">{day}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map(day => {
                    const isSelected = currentDate.getDate() === day && currentDate.getMonth() === month && currentDate.getFullYear() === year;
                    return (
                        <div key={day} className="flex justify-center items-center">
                            <button
                                onClick={() => changeDay(day)}
                                className={`w-8 h-8 text-xs rounded-full transition-colors ${isSelected ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold' : 'hover:bg-white/10'}`}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div 
            ref={pickerRef} 
            className="fixed top-[85px] right-5 dynamic-blur border border-white/10 rounded-xl p-4 w-80 text-sm shadow-2xl z-50 flex flex-col gap-4 pointer-events-auto"
        >
            {/* Year Controls */}
            <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 px-1">
                    <JumpButton amount={-100} unit="Y" onClick={adjustYear} />
                    <JumpButton amount={-10} unit="Y" onClick={adjustYear} />
                    <JumpButton amount={-1} unit="Y" onClick={adjustYear} />
                    <JumpButton amount={1} unit="Y" onClick={adjustYear} />
                    <JumpButton amount={10} unit="Y" onClick={adjustYear} />
                    <JumpButton amount={100} unit="Y" onClick={adjustYear} />
                </div>
                <div className="flex justify-center">
                     <YearInput year={year} onChange={changeYear} />
                </div>
            </div>

            {/* Month Controls */}
            <div className="grid grid-cols-4 gap-1">
                {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => changeMonth(i)}
                        className={`p-2 text-xs rounded-md transition-colors ${i === month ? 'bg-indigo-500/50 font-semibold' : 'hover:bg-white/10 bg-white/5'}`}
                    >
                        {m.substring(0,3)}
                    </button>
                ))}
            </div>

            {/* Day Grid */}
            <div className="border-t border-white/10 pt-4">
                 {renderDays()}
            </div>
           
            {/* Action Buttons */}
            <div className="flex justify-between gap-2 pt-4 border-t border-white/10">
                {onClear ? (
                     <button onClick={onClear} className="px-4 py-2 text-sm bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg font-medium transition-all hover:bg-red-500/20">
                        Clear
                    </button>
                ) : <div/>}
                <div className="flex justify-end gap-2">
                    <button onClick={() => onDateSelect(new Date())} className="px-4 py-2 text-sm bg-white/10 border border-white/20 text-white rounded-lg font-medium transition-all hover:bg-white/15">
                        Today
                    </button>
                    <button onClick={() => onDateSelect(displayDate)} className="px-4 py-2 text-sm bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium transition-transform hover:-translate-y-0.5">
                        Set
                    </button>
                     <button onClick={onClose} className="px-4 py-2 text-sm bg-white/10 text-white rounded-lg font-medium transition-all hover:bg-white/15">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatePicker;