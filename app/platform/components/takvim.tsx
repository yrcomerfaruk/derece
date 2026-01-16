'use client';

import { useRef, useEffect, useState } from 'react';

// Calendar Helpers (duplicated here to keep component self-contained or exported from a utils file if preferred)
const getWeekDays = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    const monday = new Date(date.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
};

const formatWeekRange = (days: string[]) => {
    if (days.length === 0) return '';
    const start = new Date(days[0]);
    const end = new Date(days[6]);
    return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`;
};

interface CalendarPopupProps {
    show: boolean;
    onToggle: () => void;
    onClose: () => void;
    viewDate: string;
    setViewDate: (date: string) => void;
    currentDate: string;
    onDateChange: (date: string) => void;
    availableDates: string[];
    isReportMode: boolean;
    reportWeekStart: string | null;
    onOpenReport: () => void;
    getLocalISOString: () => string;
}

export default function CalendarPopup({
    show,
    onToggle,
    onClose,
    viewDate,
    setViewDate,
    currentDate,
    onDateChange,
    availableDates,
    isReportMode,
    reportWeekStart,
    onOpenReport,
    getLocalISOString
}: CalendarPopupProps) {
    const calendarRef = useRef<HTMLDivElement>(null);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, onClose]);

    const handlePrevWeek = () => {
        setDirection('left');
        const date = new Date(viewDate);
        date.setDate(date.getDate() - 7);
        setViewDate(date.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        setDirection('right');
        const date = new Date(viewDate);
        date.setDate(date.getDate() + 7);
        setViewDate(date.toISOString().split('T')[0]);
    };

    return (
        <div className="relative" ref={calendarRef}>
            {/* Calendar Popover */}
            <div className={`absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ease-out origin-bottom-left ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`} style={{ width: '240px' }}>
                <div className="p-2">
                    {/* Week Navigation Header */}
                    {(() => {
                        const currentWeekDays = getWeekDays(viewDate);
                        const today = getLocalISOString();
                        const startOfCurrentWeek = getWeekDays(today)[0];
                        const startOfViewWeek = currentWeekDays[0];

                        // Oldest date determines the "start week" we can go back to
                        const oldestDate = availableDates.length > 0 ? availableDates[0] : today;
                        const startOfOldestWeek = getWeekDays(oldestDate)[0];

                        // Navigation Logic
                        const canGoPrev = new Date(startOfViewWeek) > new Date(startOfOldestWeek);
                        const canGoNext = new Date(startOfViewWeek) < new Date(startOfCurrentWeek);

                        return (
                            <div className="flex items-center justify-between mb-3 px-1">
                                <button
                                    onClick={handlePrevWeek}
                                    disabled={!canGoPrev}
                                    className={`p-1 rounded-full ${canGoPrev ? 'hover:bg-gray-100 text-gray-500' : 'text-gray-200 cursor-not-allowed'}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                    {formatWeekRange(currentWeekDays)}
                                </div>
                                <button
                                    onClick={handleNextWeek}
                                    disabled={!canGoNext}
                                    className={`p-1 rounded-full ${canGoNext ? 'hover:bg-gray-100 text-gray-500' : 'text-gray-200 cursor-not-allowed'}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })()}

                    <div key={viewDate} className={`space-y-1 ${direction === 'right' ? 'animate-slide-in-right' : direction === 'left' ? 'animate-slide-in-left' : ''}`}>
                        {getWeekDays(viewDate).map((date) => {
                            const hasMessages = availableDates.includes(date);
                            const isSelected = currentDate === date && !isReportMode;
                            const isToday = date === getLocalISOString();

                            // Lock logic: before first message OR after today
                            const oldestDate = availableDates.length > 0 ? availableDates[0] : getLocalISOString();
                            const isLocked = new Date(date) < new Date(oldestDate) || new Date(date) > new Date(getLocalISOString());

                            return (
                                <button
                                    key={date}
                                    onClick={() => !isLocked && onDateChange(date)}
                                    disabled={isLocked}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${isSelected
                                        ? 'bg-black text-white'
                                        : isLocked
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium">{new Date(date).toLocaleDateString('tr-TR', { weekday: 'long' })}</div>
                                        {isToday && <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">Bugün</span>}
                                    </div>
                                    <div className={`text-[10px] ${hasMessages ? 'opacity-70' : 'opacity-40'}`}>{new Date(date).toLocaleDateString('tr-TR')}</div>
                                </button>
                            );
                        })}

                        {/* Weekly Report Button (8th Day) */}
                        <div className="pt-1 mt-1 border-t border-gray-50">
                            {(() => {
                                const currentWeekDays = getWeekDays(viewDate);
                                const endOfWeekStr = currentWeekDays[6]; // Sunday "YYYY-MM-DD"
                                const reportAvailableTime = new Date(endOfWeekStr);
                                reportAvailableTime.setHours(23, 0, 0, 0);

                                const now = new Date();
                                const isWeekFinished = now >= reportAvailableTime;
                                const isFutureWeek = new Date(currentWeekDays[0]) > new Date(getWeekDays(getLocalISOString())[0]);
                                const isDisabled = !isWeekFinished || isFutureWeek;

                                const isThisWeekReportOpen = isReportMode && reportWeekStart === currentWeekDays[0];

                                return (
                                    <button
                                        onClick={onOpenReport}
                                        disabled={isDisabled}
                                        title={isDisabled ? "Rapor Pazar günü 23:00'dan sonra görüntülenebilir." : "Haftalık Raporu Görüntüle"}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${isThisWeekReportOpen
                                            ? 'bg-black text-white'
                                            : isDisabled
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium">Haftalık Rapor</div>
                                        </div>
                                        {isDisabled ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 17V17.01M12 13.5C12 13.5 14 12.5 14 10C14 7.79086 12.2091 6 10 6C8.5 6 7 7 7 8M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 17H15M9 13H15M9 9H10M13 3L18.6 8.6C18.8 8.8 19 9.1 19 9.4V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3H12.6C12.9 3 13.2 3.2 13.4 3.4L13 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Show "Go to Today" if not in view */}
                    {!getWeekDays(viewDate).includes(getLocalISOString()) && (
                        <button
                            onClick={() => onDateChange(getLocalISOString())}
                            className="w-full mt-2 text-center text-[10px] font-medium text-gray-500 hover:text-black transition-colors border-t border-gray-50 pt-2"
                        >
                            Bugüne Git
                        </button>
                    )}
                </div>
            </div>

            <button
                onClick={onToggle}
                className={`p-1 rounded-full transition-all m-0.5 shrink-0 text-gray-400 hover:bg-gray-200 ${show ? 'bg-gray-200 text-gray-600' : ''}`}
                title="Tarih Seç"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
}

// Export helpers if needed
export { getWeekDays, formatWeekRange };
