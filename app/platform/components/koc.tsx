'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import icon from '../../icon.svg';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'report';
}

interface OnboardingData {
    target_degree: string;
    current_level: string;
    daily_study_hours: number;
}

function ReportCard() {
    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HAFTALIK PERFORMANS RAPORU</span>
            </div>

            <p className="text-[12px] text-gray-700 leading-relaxed mb-6 font-medium">
                Şu anki genel ilerlemen <span className="font-bold text-black">%38</span> seviyesinde. Toplam <span className="font-bold text-black">67</span> konudan <span className="font-bold text-black">0</span> tanesini başarıyla tamamladın. Henüz yolun başındasın ama istikrarlı bir çalışma ile netlerini hızla artırabiliriz. Eksik olduğun konulara odaklanmaya ne dersin? Unutma, her büyük başarı küçük bir adımla başlar.
            </p>

            <div className="flex items-start gap-12 border-t border-gray-100 pt-4">
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">DERS DURUMU</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-black"></div>
                        <span className="text-xs font-semibold text-gray-700">9 Aktif Ders</span>
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">KONU TAKİBİ</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        <span className="text-xs font-semibold text-gray-500">67 Kalan Konu</span>
                    </div>
                </div>
            </div>
        </div>
    );
}




const SUGGESTED_QUESTIONS = [
    "Haftalık Program Oluştur",
    "Matematik netlerimi nasıl artırabilirim?",
    "Haftalık ilerlememi özetle",
    "Sınav takvimi ne zaman?",
    "TYT Türkçe için kaynak önerisi",
    "Günde kaç saat çalışmalıyım?",
    "Odaklanma sorunumu nasıl çözerim?",
    "AYT Matematik konuları neler?",
    "Deneme analizini nasıl yaparım?",
    "Biyoloji ezberleri için taktik ver",
    "Geometriye nasıl çalışılır?",
    "Motivasyonum düştü, ne yapmalıyım?"
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getLocalISOString = () => {
        const date = new Date();
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
    };

    // Date/Session States
    const [currentDate, setCurrentDate] = useState<string>(getLocalISOString());
    const [viewDate, setViewDate] = useState<string>(getLocalISOString()); // For calendar navigation
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [isReportMode, setIsReportMode] = useState(false);

    // Calendar Helpers
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

    // Onboarding States
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0); // 0: Hedef, 1: Seviye, 2: Saat, 3: Done
    const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // iOS Keyboard Fix - Prevent input from being hidden behind keyboard
    useEffect(() => {
        const handleResize = () => {
            // iOS Safari için viewport yüksekliği değiştiğinde scroll yap
            if (textareaRef.current === document.activeElement) {
                setTimeout(() => {
                    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        };

        const handleFocus = () => {
            // Input focus olduğunda scroll yap
            setTimeout(() => {
                if (inputContainerRef.current) {
                    inputContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 300);
        };

        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('focus', handleFocus);
        }

        window.addEventListener('resize', handleResize);
        window.visualViewport?.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('resize', handleResize);
            if (textarea) {
                textarea.removeEventListener('focus', handleFocus);
            }
        };
    }, []);

    // 0. Redirect if accessed directly via /chat
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname === '/chat') {
            router.replace('/');
        }
    }, [pathname, router]);

    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // 1. Initialize User & Check Onboarding
    useEffect(() => {
        const initUser = async () => {
            // Check Local Storage for Onboarding Status
            const localOnboarding = localStorage.getItem('yks_coach_onboarded');

            if (localOnboarding === 'true') {
                setIsOnboarded(true);
                setIsHistoryLoading(true);
                // Fetch Chat History for current date
                try {
                    const res = await fetch(`/platform/api/chat?sessionDate=${currentDate}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.messages && data.messages.length > 0) {
                            setMessages(data.messages);
                        }
                    }
                } catch (error) {
                    console.error("Geçmiş mesajlar yüklenemedi:", error);
                } finally {
                    setIsHistoryLoading(false);
                }
            } else {
                setIsOnboarded(false);
                // Initial Greeter for Onboarding
                setMessages([
                    {
                        id: 'welcome',
                        role: 'assistant',
                        content: "Merhaba! Seni daha iyi tanımak ve sana özel bir program hazırlamak için birkaç soru sormam gerekiyor. Öncelikle, YKS'deki hedefin ne? (Örn: İlk 1000, Tıp, Mühendislik veya 'Eşit Ağırlık 50k')"
                    }
                ]);
            }
            setLoadingAuth(false);
        };

        initUser();
    }, []);

    // Fetch available dates
    useEffect(() => {
        const fetchDates = async () => {
            try {
                const res = await fetch('/platform/api/chat/dates');
                if (res.ok) {
                    const data = await res.json();
                    setAvailableDates(data.dates || []);
                }
            } catch (error) {
                console.error('Error fetching dates:', error);
            }
        };
        if (isOnboarded) {
            fetchDates();
        }
    }, [isOnboarded, messages]); // Refresh when messages change

    const handleOnboardingAnswer = async (text: string) => {
        // Echo user message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Process based on step
        try {
            await new Promise(resolve => setTimeout(resolve, 600)); // Fake think time

            let nextMessage = '';

            if (onboardingStep === 0) {
                // Captured: Target Degree
                setOnboardingData(prev => ({ ...prev, target_degree: text }));
                nextMessage = "Süper! Peki şu anki seviyeni nasıl tanımlarsın? (Başlangıç, Orta, İleri)";
                setOnboardingStep(1);
            } else if (onboardingStep === 1) {
                // Captured: Current Level
                setOnboardingData(prev => ({ ...prev, current_level: text }));
                nextMessage = "Anlaşıldı. Son olarak, günde ortalama kaç saat ders çalışabilirsin?";
                setOnboardingStep(2);
            } else if (onboardingStep === 2) {
                // Captured: Hours -> FINISH
                const hours = parseInt(text.replace(/[^0-9]/g, '')) || 4; // Fallback to 4 if parse fails
                const finalData = { ...onboardingData, daily_study_hours: hours, user_id: userId };

                // Save to Local Storage (Mock DB - Onboarding Data)
                localStorage.setItem('yks_coach_onboarding_data', JSON.stringify(finalData));
                localStorage.setItem('yks_coach_onboarded', 'true');

                nextMessage = "Harika! Profilini oluşturdum. Artık sorularını sorabilirsin.";

                setIsOnboarded(true);
                setOnboardingStep(3); // Completed
            }

            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: nextMessage }]);

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChat = async (text: string) => {
        // Optimistic Update
        const tempId = Date.now().toString();
        const userMsg: Message = { id: tempId, role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/platform/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, sessionDate: currentDate }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Details:", errorData);
                throw new Error(errorData.details || errorData.error || 'Network response was not ok');
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now().toString(), // Or use ID from DB if returned
                role: 'assistant',
                content: data.response
            }]);

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Üzgünüm, bir hata oluştu. Lütfen tekrar dene."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = (text: string = input) => {
        if (!text.trim() || isLoading) return;

        if (!isOnboarded) {
            handleOnboardingAnswer(text.trim());
        } else {
            handleChat(text.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };

    const handleDateChange = async (newDate: string) => {
        setIsHistoryLoading(true);
        setCurrentDate(newDate);
        setIsReportMode(false); // Reset report mode
        setShowCalendar(false);
        setMessages([]); // Clear previous messages to avoid confusion

        // Load messages for the new date
        try {
            const res = await fetch(`/platform/api/chat?sessionDate=${newDate}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error loading messages for date:', error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handlePrevWeek = () => {
        const date = new Date(viewDate);
        date.setDate(date.getDate() - 7);
        setViewDate(date.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        const date = new Date(viewDate);
        date.setDate(date.getDate() + 7);
        setViewDate(date.toISOString().split('T')[0]);
    };

    // Reset viewDate when calendar opens
    useEffect(() => {
        if (showCalendar) {
            setViewDate(currentDate);
        }
    }, [showCalendar]);

    const handleOpenReport = async () => {
        if (isLoading) return;
        setIsReportMode(true);
        setShowCalendar(false);
        setMessages([]); // Clear chat for report view
        setIsLoading(true);

        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: '',
            type: 'report'
        }]);
        setIsLoading(false);
    };

    if (loadingAuth) {
        return (
            <div className="h-full flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Messages Area */}
            <div className="flex-1 relative">
                {/* Background Icon - Always visible */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                    <Image
                        src={icon}
                        alt=""
                        className="w-96 h-96 opacity-[0.03]"
                        priority
                    />
                </div>
                <div ref={containerRef} className="absolute inset-0 overflow-y-auto no-scrollbar p-4" style={{ paddingBottom: messages.length === 0 ? '1rem' : '50px' }}>
                    {isHistoryLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : isReportMode ? (
                        <div className="h-full flex items-center justify-center relative z-10 w-full">
                            <ReportCard />
                        </div>
                    ) : messages.length === 0 && isOnboarded ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in relative z-10">
                            {currentDate === getLocalISOString() ? (
                                <>
                                    <div className="space-y-2 relative z-10">
                                        <h2 className="text-2xl font-bold text-black">
                                            Merhaba, Koçun Burada!
                                        </h2>
                                        <p className="text-gray-500 text-sm font-medium">Sana nasıl yardımcı olabilirim?</p>
                                    </div>

                                    <div className="w-full max-w-4xl space-y-3 overflow-hidden relative z-10">
                                        {/* Suggested Questions */}
                                        <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 pb-1" onWheel={handleWheel} style={{ scrollbarWidth: 'none' }}>
                                            {SUGGESTED_QUESTIONS.slice(0, Math.ceil(SUGGESTED_QUESTIONS.length / 2)).map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSend(q)}
                                                    className="whitespace-nowrap px-3 py-1.5 bg-white rounded-xl transition-all border border-gray-200 text-gray-700 text-[11px] font-medium shrink-0 hover:bg-gray-50 bg-opacity-80 backdrop-blur-sm"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex overflow-x-auto no-scrollbar gap-2 px-4" onWheel={handleWheel} style={{ scrollbarWidth: 'none' }}>
                                            {SUGGESTED_QUESTIONS.slice(Math.ceil(SUGGESTED_QUESTIONS.length / 2)).map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSend(q)}
                                                    className="whitespace-nowrap px-3 py-1.5 bg-white rounded-xl transition-all border border-gray-200 text-gray-700 text-[11px] font-medium shrink-0 hover:bg-gray-50 bg-opacity-80 backdrop-blur-sm"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-400 text-xs font-medium">
                                    Bu tarihte bir sohbet geçmişi bulunmuyor.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-3xl mx-auto relative z-10">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : (msg.type === 'report' ? 'justify-center w-full' : 'justify-start')}`}
                                >
                                    <div
                                        className={`${msg.type === 'report' ? 'w-full flex justify-center' : 'max-w-[85%]'} ${msg.role === 'user'
                                            ? 'bg-gray-100 text-gray-900 rounded-2xl rounded-br-sm px-3 py-2'
                                            : 'bg-transparent text-gray-800 px-0'
                                            }`}
                                    >
                                        {msg.role === 'assistant' && msg.type !== 'report' && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    <Image
                                                        src={icon}
                                                        alt="AI"
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Derece Koçu</span>
                                            </div>
                                        )}

                                        {msg.type === 'report' ? (
                                            <ReportCard />
                                        ) : (
                                            <div className="leading-relaxed text-xs break-words prose prose-sm max-w-none">
                                                {msg.role === 'assistant' ? (
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <Image
                                                src={icon}
                                                alt="AI"
                                                className="w-full h-full animate-pulse"
                                            />
                                        </div>
                                        <div className="flex gap-1 bg-gray-50 px-3 py-2 rounded-2xl rounded-tl-sm border border-gray-100">
                                            <span className="w-1 h-3 bg-black rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                                            <span className="w-1 h-3 bg-black rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                                            <span className="w-1 h-3 bg-black rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

            </div>

            {/* Input Area - Fixed Bottom */}
            <div
                ref={inputContainerRef}
                className="fixed bottom-0 left-0 right-0 bg-white pt-1 pb-2 px-4 border-t border-gray-50 z-30"
                style={{
                    paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right))'
                }}
            >
                <div className="max-w-3xl mx-auto relative">
                    {/* Calendar Popover */}
                    <div className={`absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-left ${showCalendar ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`} style={{ width: '240px' }}>
                        <div className="p-2">
                            {/* Week Navigation Header */}
                            {(() => {
                                const currentWeekDays = getWeekDays(viewDate);
                                const startOfWeek = currentWeekDays[0];
                                const endOfWeek = currentWeekDays[6];
                                const today = getLocalISOString();
                                const oldestDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : today;

                                const canGoPrev = new Date(startOfWeek) > new Date(oldestDate);
                                const canGoNext = new Date(endOfWeek) < new Date(today);

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

                            <div className="space-y-1">
                                {getWeekDays(viewDate).map((date) => {
                                    const hasMessages = availableDates.includes(date);
                                    const isSelected = currentDate === date && !isReportMode;
                                    const isToday = date === getLocalISOString();

                                    return (
                                        <button
                                            key={date}
                                            onClick={() => handleDateChange(date)}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${isSelected
                                                ? 'bg-black text-white'
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

                                        // Set deadline to Sunday 23:00
                                        const reportAvailableTime = new Date(endOfWeekStr);
                                        reportAvailableTime.setHours(23, 0, 0, 0);

                                        const now = new Date();
                                        const isWeekFinished = now >= reportAvailableTime;

                                        return (
                                            <button
                                                onClick={handleOpenReport}
                                                disabled={!isWeekFinished}
                                                title={!isWeekFinished ? "Rapor Pazar günü 23:00'dan sonra görüntülenebilir." : "Haftalık Raporu Görüntüle"}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${isReportMode
                                                    ? 'bg-black text-white'
                                                    : !isWeekFinished
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium">Haftalık Rapor</div>
                                                </div>
                                                {!isWeekFinished ? (
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
                                    onClick={() => handleDateChange(getLocalISOString())}
                                    className="w-full mt-2 text-center text-[10px] font-medium text-gray-500 hover:text-black transition-colors border-t border-gray-50 pt-2"
                                >
                                    Bugüne Git
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-3xl flex items-center px-1 py-0.5 shadow-sm transition-all focus-within:ring-1 focus-within:ring-gray-200 min-h-[32px]">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`p-1 rounded-full transition-all m-0.5 shrink-0 text-gray-400 hover:bg-gray-200 ${showCalendar ? 'bg-gray-200 text-gray-600' : ''}`}
                            title="Tarih Seç"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                                <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={currentDate < getLocalISOString() || isReportMode}
                            placeholder={isReportMode ? "Rapor görüntüleniyor..." : (currentDate < getLocalISOString() ? "Geçmiş günlere mesaj gönderilemez." : (isOnboarded ? "Bir şeyler sor..." : "Cevabını buraya yaz..."))}
                            className={`flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none max-h-32 py-0 px-2 text-gray-700 placeholder-gray-400 appearance-none no-scrollbar flex items-center placeholder-13 ${currentDate < getLocalISOString() || isReportMode ? 'cursor-not-allowed opacity-50' : ''}`}
                            style={{
                                minHeight: '24px',
                                scrollbarWidth: 'none',
                                lineHeight: '24px',
                                fontSize: '16px' // iOS zoom'u önlemek için 16px
                            }}
                            rows={1}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading || currentDate < getLocalISOString() || isReportMode}
                            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all shrink-0 m-0.5 ${input.trim() && !isLoading && currentDate >= getLocalISOString() && !isReportMode
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
        </div >
    );
}
