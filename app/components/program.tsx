'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Topic {
    id: string;
    name: string;
    duration: string;
    completed: boolean;
    startHour: number;
}

interface DaySchedule {
    day: string;
    date: string;
    topics: Topic[];
}

export default function ProgramPage() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = Current, -1 = Previous, 1 = Next
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname === '/program') {
            router.replace('/');
        }
    }, [pathname, router]);

    const weekDayOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    // Helper to generate dates
    const generateDates = (offsetDays: number) => {
        return weekDayOrder.map((day, i) => ({
            day,
            date: new Date(new Date().setDate(new Date().getDate() + i + offsetDays)).toISOString().slice(0, 10),
        }));
    };

    // Initialize Mock Data
    useEffect(() => {
        // Calculate offset based on weekOffset (7 days per week)
        const daysOffset = weekOffset * 7;
        const dates = generateDates(daysOffset);

        const SUBJECTS = [
            'TYT Türkçe - Paragraf', 'AYT Matematik - Türev', 'TYT Fizik - Optik',
            'AYT Kimya - Gazlar', 'TYT Biyoloji - Hücre', 'AYT Edebiyat - Divan',
            'Geometri - Üçgenler', 'Tarih - Kurtuluş Savaşı'
        ];

        const newSchedule: DaySchedule[] = dates.map((d, dayIdx) => {
            const dailyTopics: Topic[] = [];
            let currentHour = 9.0; // Start at 09:00

            for (let i = 0; i < 8; i++) {
                // Lunch Break after 4th session (Index 3 -> 4th lesson)
                if (i === 4) {
                    // Previous lesson (3) started at 12:00, ended at 12:50.
                    // Lunch is 12:50 - 13:50.
                    // So next lesson (4) should start at 13:50 (13.8333 hours)
                    currentHour = 13 + (50 / 60);
                }

                // Cyclic subject selection for variety
                const subject = SUBJECTS[(dayIdx * 3 + i) % SUBJECTS.length];

                dailyTopics.push({
                    id: `t-${d.date}-${i}`,
                    name: subject,
                    duration: '50 dk',
                    completed: false,
                    startHour: currentHour
                });

                // Next lesson starts 1 hour later (50m lesson + 10m gap)
                // If we want exact 10 min gap: 50 min = 0.833 h. Gap = 0.166 h. Total 1.0 h.
                // So startHour increments by 1.
                currentHour += 1;
            }

            return {
                ...d,
                topics: dailyTopics
            };
        });
        setSchedule(newSchedule);
    }, [weekOffset]);


    const parseDurationHours = (duration: string) => {
        const hMatch = duration.match(/([0-9]*\.?[0-9]+)\s*saat/);
        if (hMatch) return parseFloat(hMatch[1]);
        const mMatch = duration.match(/([0-9]+)\s*dk/);
        if (mMatch) return parseInt(mMatch[1], 10) / 60;
        return 1;
    };

    const prevDay = () => setSelectedIndex((s) => Math.max(0, s - 1));
    const nextDay = () => setSelectedIndex((s) => Math.min(schedule.length - 1, s + 1));

    const prevWeek = () => {
        setWeekOffset(prev => prev - 1);
        setSelectedIndex(0);
    };

    const nextWeek = () => {
        setWeekOffset(prev => prev + 1);
        setSelectedIndex(0);
    };

    const toggleTopicCompletion = (dayIndex: number, topicId: string) => {
        const day = schedule[dayIndex];
        const today = new Date().toISOString().slice(0, 10);

        // Prevent modifying past days
        if (day.date < today) {
            setShowToast(true);
            setToastMessage("Geçmiş programları işaretleyemezsiniz.");
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        // Prevent modifying future days (optional, keeping existing logic if desired, but user focused on past)
        if (day.date > today) {
            setShowToast(true);
            setToastMessage("Henüz günü gelmeyen programı işaretleyemezsin.");
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        setSchedule(prev => {
            const newSchedule = [...prev];
            const d = { ...newSchedule[dayIndex] };
            d.topics = d.topics.map(t =>
                t.id === topicId ? { ...t, completed: !t.completed } : t
            );
            newSchedule[dayIndex] = d;
            return newSchedule;
        });
    };

    // Loading state or safe render
    if (schedule.length === 0) return <div className="p-4 text-center text-gray-400">Yükleniyor...</div>;

    const daySchedule = schedule[selectedIndex];

    return (
        <div className="bg-white h-full flex flex-col relative">
            {/* Toast Notification */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="bg-zinc-800 text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {toastMessage}
                </div>
            </div>

            {/* Calendar/Schedule View */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Day Header */}
                <div className="shrink-0 bg-white z-10">
                    <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={prevWeek}
                                title="Önceki Hafta"
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
                            </button>
                            <button
                                onClick={prevDay}
                                disabled={selectedIndex === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="font-bold text-gray-900 text-lg tracking-tight">{daySchedule.day}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-400">{daySchedule.date}</span>
                                {weekOffset < 0 && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Geçmiş</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={nextDay}
                                disabled={selectedIndex === schedule.length - 1}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                            <button
                                onClick={nextWeek}
                                title="Sonraki Hafta"
                                disabled={weekOffset >= 0}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative overflow-y-auto overflow-x-hidden no-scrollbar bg-white" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="relative min-h-[1040px] px-0 pb-0 max-w-3xl mx-auto">

                        {/* Time Markers - Gray Background */}
                        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gray-50 border-r border-gray-100 h-full">
                            {/* Added h-full and removed some potential issues, relying on absolute bottom-0 to stretch to parent padding edge */}
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div key={i} className="absolute w-full text-right pr-4 text-[11px] text-gray-500 font-medium font-numeric" style={{ top: `${40 + i * 60}px`, transform: 'translateY(-50%)' }}>
                                    {i < 17 ? `${String(7 + i).padStart(2, '0')}:00` : ''}
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines */}
                        <div className="absolute left-16 right-0 top-0 bottom-0">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div key={i} className="absolute w-full border-t border-dashed border-gray-100" style={{ top: `${40 + i * 60}px` }} />
                            ))}
                        </div>

                        {/* Events - Floating Cards */}
                        <div className="absolute left-16 right-2 top-0 bottom-0 pl-2">
                            {daySchedule.topics.map((topic, idx) => {
                                const startHour = topic.startHour || 9;
                                const durationHours = parseDurationHours(topic.duration);
                                const top = 40 + (startHour - 7) * 60;
                                const height = durationHours * 60;
                                return (
                                    <div key={topic.id}
                                        onClick={() => toggleTopicCompletion(selectedIndex, topic.id)}
                                        className={`absolute left-2 right-2 rounded-xl px-4 py-3 text-xs transition-all cursor-pointer shadow-sm
                                            ${topic.completed
                                                ? 'bg-gray-50/80 text-gray-400 border border-transparent'
                                                : 'bg-white text-gray-800 border border-l-4 border-gray-100 border-l-black hover:border-l-gray-800'}`}
                                        style={{ top: `${top}px`, height: `${height}px`, minHeight: '44px' }}>
                                        <div className="flex justify-between items-center h-full gap-3">
                                            <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                                <p className={`font-semibold text-[11px] truncate select-none ${topic.completed ? 'line-through decoration-gray-300' : ''}`}>{topic.name}</p>
                                                <span className="text-[9px] text-gray-400 mt-0.5 font-medium select-none">{topic.duration}</span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${topic.completed ? 'bg-black text-white scale-100' : 'bg-gray-100 text-gray-300'}`}>
                                                {topic.completed ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                ) : (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .font-numeric { font-variant-numeric: tabular-nums; }
            `}</style>
        </div>
    );
}
