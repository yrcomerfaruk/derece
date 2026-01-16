'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, authHelpers } from '@/lib/supabase';
import ProgramAssistant from './asistan';
import Baslik from './baslik';
import Cizelge from './cizelge';

interface ProgramItem {
    id: string;
    day_index: number; // 0-6
    slot_index: number;
    topic: {
        id: string;
        title: string;
        subject: string;
    };
    activity_type: string;
    duration_minutes: number;
    is_completed: boolean;
}

interface DaySchedule {
    day: string;
    date: string;
    items: ProgramItem[];
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function ProgramPage() {
    const [loading, setLoading] = useState(true);

    const [hasProgram, setHasProgram] = useState(false);
    const [programId, setProgramId] = useState<string | null>(null);
    const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSwitchingWeek, setIsSwitchingWeek] = useState(false);

    // Navigation State
    const [selectedIndex, setSelectedIndex] = useState(() => {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1; // Default to Today
    });

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Load Chat History
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await fetch('/platform/api/program-assistant');
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        setChatMessages(data.messages);
                    } else {
                        // Default welcome if no history
                        setChatMessages([{ role: 'assistant', content: "Merhaba, Derece AI Program Asistanı'nım. Programında yapmak istediğin değişiklikleri bana iletebilirsin." }]);
                    }
                }
            } catch (e) {
                console.error("Chat history load error", e);
            }
        };
        loadHistory();
    }, []);
    const [chatInput, setChatInput] = useState('');

    const router = useRouter();


    const weekDayOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    const fetchProgram = async (dateRef: Date = currentDate, showLoading = true) => {
        if (showLoading) setLoading(true);
        else setIsSwitchingWeek(true);

        const { user } = await authHelpers.getUser();
        if (!user) return;

        // 1. Calculate Week Dates Locally
        const d = new Date(dateRef);
        // Normalize to noon
        d.setHours(12, 0, 0, 0);

        const day = d.getDay(); // 0=Sun
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);

        const weekDates: { date: string, dayIndex: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const temp = new Date(monday);
            temp.setDate(monday.getDate() + i);
            const yyyy = temp.getFullYear();
            const mm = String(temp.getMonth() + 1).padStart(2, '0');
            const dd = String(temp.getDate()).padStart(2, '0');
            weekDates.push({ date: `${yyyy}-${mm}-${dd}`, dayIndex: i });
        }

        let currentProgramId = programId;

        // Fetch user's active program
        const { data: programs } = await supabase
            .from('user_programs')
            .select('id, start_date')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        // 2. Fetch User Program only if we don't have it
        if (!currentProgramId) {
            const { data: programs } = await supabase
                .from('user_programs')
                .select('id, start_date')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle();

            if (programs) {
                currentProgramId = programs.id;
                setProgramId(programs.id);
                setHasProgram(true);
                if (programs.start_date) setProgramStartDate(new Date(programs.start_date));
            } else {
                setHasProgram(false);
            }
        }

        if (currentProgramId) {
            // Fetch Items
            const { data: rawItems, error } = await supabase
                .from('program_items')
                .select(`
                    id, day_index, slot_index, activity_type, duration_minutes, is_completed, session_date,
                    topic:topics (id, subject, title)
                `)
                .eq('program_id', currentProgramId);

            const items = (!error && rawItems) ? rawItems.sort((a, b) => a.slot_index - b.slot_index) : [];

            // Organize into days using API dates
            const days: DaySchedule[] = weekDayOrder.map((dayName, idx) => {
                const targetDateStr = weekDates[idx].date; // YYYY-MM-DD

                return {
                    day: dayName,
                    date: targetDateStr,
                    items: items.filter((i: any) => {
                        // If item has session_date, match exactly
                        if (i.session_date) {
                            return i.session_date === targetDateStr;
                        }
                        // Fallback for old items: match day_index (legacy)
                        return i.day_index === idx;
                    }).map((i: any) => ({
                        ...i,
                        topic: Array.isArray(i.topic) ? i.topic[0] : i.topic
                    }))
                };
            });
            setSchedule(days);
        } else {
            // No Program -> Create Empty Schedule structure
            setHasProgram(false);
            const days: DaySchedule[] = weekDayOrder.map((dayName, idx) => {
                const targetDateStr = weekDates[idx].date;
                return {
                    day: dayName,
                    date: targetDateStr,
                    items: []
                };
            });
            setSchedule(days);
        }

        if (showLoading) setLoading(false);
        else setIsSwitchingWeek(false);
    };

    useEffect(() => {
        fetchProgram();
    }, []);

    // Auto-refresh at midnight
    useEffect(() => {
        const checkMidnight = () => {
            const now = new Date();
            const currentDay = now.getDay();
            const expectedIndex = currentDay === 0 ? 6 : currentDay - 1;

            if (selectedIndex !== expectedIndex) {
                setSelectedIndex(expectedIndex);
                setCurrentDate(new Date());
                fetchProgram(new Date(), false);

                // Clear chat messages for new day
                setChatMessages([{
                    role: 'assistant',
                    content: "Merhaba, Derece AI Program Asistanı'nım. Programında yapmak istediğin değişiklikleri bana iletebilirsin."
                }]);
            }
        };

        const interval = setInterval(checkMidnight, 60000);
        return () => clearInterval(interval);
    }, [selectedIndex]);


    // Handlers extracted for cleaner passing to Baslik/Cizelge
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleToggleComplete = async (itemId: string, currentStatus: boolean, date: string) => {
        // Date check
        const today = new Date().toLocaleDateString('en-CA');
        if (date !== today) {
            showToast('Geçmiş veya gelecek günlerin programına müdahale edemezsin.');
            return;
        }

        // Optimistic update
        const updatedSchedule = schedule.map(day => ({
            ...day,
            items: day.items.map(item =>
                item.id === itemId ? { ...item, is_completed: !currentStatus } : item
            )
        }));
        setSchedule(updatedSchedule);

        await supabase.from('program_items').update({ is_completed: !currentStatus }).eq('id', itemId);
    };

    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleChatSend = async () => {
        if (!chatInput.trim()) return;

        const userText = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userText }]);
        setIsChatLoading(true);

        try {
            const response = await fetch('/platform/api/program-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    chatHistory: chatMessages.slice(-6)
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error('AI Error:', data.error);
                setChatMessages(prev => [...prev, { role: 'assistant', content: 'Üzgünüm, bir hata oluştu: ' + data.error }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
                await fetchProgram(currentDate, false);
            }
        } catch (error) {
            console.error('Network Error:', error);
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Navigation Handlers
    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        const today = new Date();
        if (newDate.getMonth() !== today.getMonth()) {
            showToast("Sadece bu ayın programını görüntüleyebilirsin.");
            return;
        }
        if (programStartDate && newDate.getTime() < programStartDate.getTime() - (6 * 86400000)) {
            showToast("Program başlangıcından önceki haftalara gidemezsin.");
            return;
        }
        setCurrentDate(newDate);
        fetchProgram(newDate, false);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        const today = new Date();
        if (newDate.getMonth() !== today.getMonth() && newDate > today) {
            showToast("Sadece bu ayın programını görüntüleyebilirsin.");
            return;
        }
        setCurrentDate(newDate);
        fetchProgram(newDate, false);
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );

    const daySchedule = schedule[selectedIndex];

    return (
        <div className="h-full bg-white relative overflow-hidden">
            {/* SCHEDULE VIEW (Full Height) */}
            <div className={`h-full flex flex-col bg-white overflow-hidden`}>

                {/* Header Component */}
                <Baslik
                    daySchedule={daySchedule}
                    onPrevWeek={handlePrevWeek}
                    onNextWeek={handleNextWeek}
                    onPrevDay={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                    onNextDay={() => setSelectedIndex(prev => Math.min(schedule.length - 1, prev + 1))}
                    hasPrevDay={selectedIndex > 0}
                    hasNextDay={selectedIndex < schedule.length - 1}
                />

                {/* Timeline Component */}
                <Cizelge
                    items={daySchedule?.items}
                    isSwitchingWeek={isSwitchingWeek}
                    date={daySchedule?.date}
                    onToggleComplete={handleToggleComplete}
                />
            </div>

            {/* PROGRAM ASSISTANT (POPUP) */}
            <ProgramAssistant
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(prev => !prev)}
                messages={chatMessages}
                input={chatInput}
                setInput={setChatInput}
                onSend={handleChatSend}
                isLoading={isChatLoading}
                onClose={() => setIsChatOpen(false)}
            />

            {/* TOAST MESSAGE */}
            {
                toastMessage && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full text-sm shadow-xl z-[60] animate-in fade-in slide-in-from-bottom-5">
                        {toastMessage}
                    </div>
                )
            }
        </div >
    );
}
