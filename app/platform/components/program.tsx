'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { supabase, authHelpers } from '@/lib/supabase';


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

export default function ProgramPage() {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
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
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);

    // Load Chat History
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await fetch('/platform/api/program');
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

        // 1. Calculate Week Dates Locally (No API call)
        // Helper inline for now or defined outside. Let's define it inside to be safe with closurescope if needed, or better, just executing logic.
        const d = new Date(dateRef);
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
                setLoading(false);
                return;
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

            if (error) {
                console.error('Error fetching items:', error);
                setLoading(false);
                return;
            }

            // Sort items in JavaScript
            const items = rawItems?.sort((a, b) => a.slot_index - b.slot_index);

            if (items) {
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
            }
        }

        if (showLoading) setLoading(false);
        else setIsSwitchingWeek(false);
    };

    useEffect(() => {
        fetchProgram();
    }, []);

    const handleCreateProgram = async () => {
        setGenerating(true);
        try {
            const response = await fetch('/platform/api/program', { method: 'POST' });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Program oluşturulamadı');
            }

            const result = await response.json();
            if (result.success) {
                await fetchProgram();
            }
        } catch (error: any) {
            alert('Hata: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
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
            const response = await fetch('/platform/api/program', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    chatHistory: chatMessages.slice(-6) // Context
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error('AI Error:', data.error);
                setChatMessages(prev => [...prev, { role: 'assistant', content: 'Üzgünüm, bir hata oluştu: ' + data.error }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
                // Refresh program without full loading spinner (background fade only)
                await fetchProgram(currentDate, false);
            }
        } catch (error) {
            console.error('Network Error:', error);
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Dynamic Time Calculation
    // slotIndex artık gece yarısından itibaren toplam dakika (7:15 = 435 dakika)
    const getSlotMetrics = (slotIndex: number, durationMinutes: number = 50) => {
        // slotIndex = gece yarısından itibaren toplam dakika
        const startHour = Math.floor(slotIndex / 60);
        const startMinute = slotIndex % 60;

        // Saat 6'dan itibaren pozisyon hesapla (timeline 6:00'dan başlıyor)
        const startFrom6 = slotIndex - (6 * 60); // 6:00 = 360 dakika
        const height = durationMinutes;

        // Zaman etiketi oluştur
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

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatPopupRef = useRef<HTMLDivElement>(null);
    const fabRef = useRef<HTMLButtonElement>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // ... (rest of logic same)
            if (isChatOpen &&
                chatPopupRef.current && !chatPopupRef.current.contains(event.target as Node) &&
                fabRef.current && !fabRef.current.contains(event.target as Node)
            ) {
                setIsChatOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isChatOpen]);

    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, isChatOpen]);

    // ... existing fetch loops ...

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );

    if (!hasProgram) {
        // ... (Keep existing No Program View) ...
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz Programın Yok</h2>
                    <p className="text-gray-500 mb-8 text-sm">Hedeflerine uygun, kişiselleştirilmiş haftalık çalışma programını hemen oluştur.</p>

                    <button
                        onClick={handleCreateProgram}
                        disabled={generating}
                        className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {generating ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                        )}
                        {generating ? 'Program Oluşturuluyor...' : 'Programımı Oluştur'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-4">Program oluşturulurken seviyen ve hedeflerin dikkate alınır.</p>
                </div>
            </div>
        );
    }

    const daySchedule = schedule[selectedIndex];

    return (
        <div className="h-full bg-white relative overflow-hidden">
            {/* SCHEDULE VIEW (Full Height) */}
            <div className={`h-full flex flex-col bg-white overflow-hidden transition-opacity duration-300 ${isSwitchingWeek ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Day Header */}
                <div className="shrink-0 bg-transparent z-10 border-b border-gray-100">
                    <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
                        {/* Left Controls */}
                        <div className="flex items-center gap-2">
                            {/* Week Previous */}
                            <button
                                onClick={() => {
                                    const newDate = new Date(currentDate);
                                    newDate.setDate(newDate.getDate() - 7);

                                    // Limit: Don't go before program start date
                                    if (programStartDate) {
                                        // Simple check: if newDate is more than 6 days BEFORE start date
                                        if (newDate.getTime() < programStartDate.getTime() - (6 * 86400000)) {
                                            showToast("Program başlangıcından önceki haftalara gidemezsin.");
                                            return;
                                        }
                                    }

                                    setCurrentDate(newDate);
                                    fetchProgram(newDate, false);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                                title="Önceki Hafta"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                                </svg>
                            </button>

                            {/* Day Previous */}
                            <button
                                onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                                disabled={selectedIndex === 0}
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
                                onClick={() => setSelectedIndex(prev => Math.min(schedule.length - 1, prev + 1))}
                                disabled={selectedIndex === schedule.length - 1}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all"
                                title="Sonraki Gün"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>

                            {/* Week Next */}
                            <button
                                onClick={() => {
                                    const newDate = new Date(currentDate);
                                    newDate.setDate(newDate.getDate() + 7);

                                    // Limit: Only show days within THIS month (User request)
                                    // Actually just checking if month changed relative to TODAY
                                    const today = new Date();
                                    // If new week starts in a different month than today AND is in future
                                    if (newDate.getMonth() !== today.getMonth() && newDate > today) {
                                        // Allow if it's just the end of the month overlap?
                                        // User said "sadece bu ayın günlerini göster". Strict check.
                                        showToast("Sadece bu ayın programını görüntüleyebilirsin.");
                                        return;
                                    }

                                    setCurrentDate(newDate);
                                    fetchProgram(newDate, false);
                                }}
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

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto no-scrollbar relative w-full">
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
                            {daySchedule?.items.map((item) => {
                                const metrics = getSlotMetrics(item.slot_index, item.duration_minutes);

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            const today = new Date().toISOString().slice(0, 10);
                                            if (daySchedule.date !== today) {
                                                showToast('Geçmiş veya gelecek günlerin programına müdahale edemezsin.');
                                                return;
                                            }
                                            handleToggleComplete(item.id, item.is_completed);
                                        }}
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
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-gray-100 text-gray-600">
                                                    {item.activity_type === 'study' ? 'Konu' : item.activity_type === 'test' ? 'Test' : 'Tekrar'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                    {metrics.timeLabel}
                                                </span>
                                            </div>
                                            <h4 className={`text-sm font-semibold text-gray-900 ${item.is_completed ? 'line-through text-gray-400' : ''} truncate`}>
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
            </div>

            {/* CHAT POPUP */}
            {
                isChatOpen && (
                    <div
                        ref={chatPopupRef}
                        className="fixed bottom-20 right-6 w-full max-w-[300px] h-[400px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5 fade-in duration-200 z-50"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white bg-opacity-90 backdrop-blur">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm font-bold text-gray-800">Program Asistanı</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-white border border-gray-200 text-gray-500 rounded-bl-none shadow-sm flex items-center gap-1">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        {/* Input */}
                        <div className="p-2 bg-white border-t border-gray-100">
                            <div className="bg-gray-50 border border-gray-200 rounded-3xl flex items-center px-1 py-0.5 shadow-sm transition-all focus-within:ring-1 focus-within:ring-gray-200 min-h-[32px]">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleChatSend()}
                                    placeholder="Değişiklik yap..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none py-0 px-2 text-gray-700 placeholder-gray-400 text-sm"
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={handleChatSend}
                                    disabled={!chatInput.trim() || isChatLoading}
                                    className={`w-7 h-7 flex items-center justify-center rounded-full transition-all shrink-0 m-0.5 ${chatInput.trim() && !isChatLoading
                                        ? 'bg-black text-white hover:bg-gray-800'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* FLOATING ACTION BUTTON */}
            <button
                ref={fabRef}
                onClick={() => setIsChatOpen(prev => !prev)}
                className="fixed bottom-6 right-6 w-10 h-10 bg-black text-white rounded-full shadow-xl flex items-center justify-center z-50"
            >
                {isChatOpen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    </>
                )}
            </button>

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


