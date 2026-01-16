'use client';

interface ProgramItem {
    id: string;
    slot_index: number;
    activity_type: string;
    duration_minutes: number;
    is_completed: boolean;
    topic: {
        subject: string;
        title: string;
    };
}

interface CizelgeProps {
    items: ProgramItem[] | undefined;
    isSwitchingWeek: boolean;
    date: string | undefined;
    onToggleComplete: (id: string, currentStatus: boolean, date: string) => void;
}

export default function Cizelge({ items, isSwitchingWeek, date, onToggleComplete }: CizelgeProps) {

    // Helper function for metrics - duplicated/moved from parent
    const getSlotMetrics = (slotIndex: number, durationMinutes: number = 50) => {
        const startHour = Math.floor(slotIndex / 60);
        const startMinute = slotIndex % 60;

        // Timeline starts from 6:00 (360 minutes)
        const startFrom6 = slotIndex - (6 * 60);
        const height = durationMinutes;

        const endTotalMin = slotIndex + durationMinutes;
        const endHour = Math.floor(endTotalMin / 60);
        const endMinute = endTotalMin % 60;

        const timeLabel = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

        return {
            top: startFrom6, // 1px = 1min
            height: height,
            timeLabel
        };
    };

    // Helper to get today's date in YYYY-MM-DD local time
    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isToday = date === getTodayString();

    return (
        <div className={`flex-1 overflow-y-auto no-scrollbar relative w-full transition-opacity duration-300 ${isSwitchingWeek ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="relative min-h-[1140px] max-w-3xl mx-auto pt-4 pb-20">

                {/* Time Markers - Gray Background */}
                <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gray-50 border-r border-gray-100 h-full">
                    {Array.from({ length: 19 }).map((_, i) => (
                        <div key={i} className="absolute w-full text-center text-[11px] text-gray-400 font-medium" style={{ top: `${(i * 60) + 10}px` }}>
                            {String(6 + i).padStart(2, '0')}:00
                        </div>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute left-16 right-0 top-0 bottom-0">
                    {Array.from({ length: 19 }).map((_, i) => (
                        <div key={i} className="absolute w-full border-t border-gray-100 border-dashed" style={{ top: `${(i * 60) + 20}px` }}></div>
                    ))}
                </div>

                {/* Items */}
                <div className="absolute left-16 right-0 top-0 bottom-0">
                    {items?.map((item) => {
                        const metrics = getSlotMetrics(item.slot_index, item.duration_minutes);

                        return (
                            <div
                                key={item.id}
                                onClick={() => date && onToggleComplete(item.id, item.is_completed, date)}
                                className={`absolute left-2 right-4 rounded-xl border flex items-center px-4 cursor-pointer transition-all z-20
                                    ${item.is_completed
                                        ? 'bg-gray-50 border-gray-100 opacity-60'
                                        : 'bg-white border-gray-100 shadow-sm border-l-4 border-l-black'
                                    }`}
                                style={{
                                    top: `${metrics.top + 20}px`,
                                    height: `${metrics.height}px`
                                }}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-gray-100 text-gray-600">
                                            {item.activity_type === 'study' ? 'Konu' : item.activity_type === 'test' ? 'Test' : 'Tekrar'}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                                            {metrics.timeLabel}
                                        </span>
                                    </div>
                                    <h4 className={`text-[12px] font-semibold text-gray-900 ${item.is_completed ? (isToday ? 'line-through text-gray-400' : 'text-gray-400') : ''} truncate`}>
                                        {/* @ts-ignore */}
                                        {item.topic ? `${item.topic.subject} - ${item.topic.title}` : 'Ders'}
                                    </h4>
                                </div>

                                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${item.is_completed ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'}`}>
                                    {item.is_completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
