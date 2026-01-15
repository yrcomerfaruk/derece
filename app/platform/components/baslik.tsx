'use client';

interface BaslikProps {
    daySchedule: { day: string; date: string } | undefined;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onPrevDay: () => void;
    onNextDay: () => void;
    hasPrevDay: boolean;
    hasNextDay: boolean;
}

export default function Baslik({
    daySchedule,
    onPrevWeek,
    onNextWeek,
    onPrevDay,
    onNextDay,
    hasPrevDay,
    hasNextDay
}: BaslikProps) {
    return (
        <div className="shrink-0 bg-transparent z-10 border-b border-gray-100">
            <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
                {/* Left Controls */}
                <div className="flex items-center gap-2">
                    {/* Week Previous */}
                    <button
                        onClick={onPrevWeek}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                        title="Önceki Hafta"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                        </svg>
                    </button>

                    {/* Day Previous */}
                    <button
                        onClick={onPrevDay}
                        disabled={!hasPrevDay}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all"
                        title="Önceki Gün"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                </div>

                {/* Center Info */}
                <div className="flex flex-col items-center">
                    <span className="font-bold text-gray-900 tracking-tight" style={{ fontSize: '14px' }}>
                        {daySchedule?.day}
                    </span>
                    <span className="font-medium text-gray-400" style={{ fontSize: '12px' }}>
                        {daySchedule?.date
                            ? new Date(daySchedule.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                        }
                    </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    {/* Day Next */}
                    <button
                        onClick={onNextDay}
                        disabled={!hasNextDay}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all"
                        title="Sonraki Gün"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>

                    {/* Week Next */}
                    <button
                        onClick={onNextWeek}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                        title="Sonraki Hafta"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
