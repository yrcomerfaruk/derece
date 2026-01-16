'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import icon from '../../icon.svg';
import SuggestedQuestions from './oneri';
import CalendarPopup from './takvim';
import Mesaj from './mesaj';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'report';
    reportDate?: string;
}

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
    const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);
    const [isReportMode, setIsReportMode] = useState(false);
    const [reportWeekStart, setReportWeekStart] = useState<string | null>(null); // Track which week's report is open


    // Helper for Report Logic (needs to replicate what we had or import)
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


    // Loading State
    const [loadingAuth, setLoadingAuth] = useState(true);

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

    // Initialize - Load Chat History
    useEffect(() => {
        const initChat = async () => {
            setIsHistoryLoading(true);
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
                setLoadingAuth(false);
            }
        };

        initChat();
    }, []);

    // Fetch available dates
    useEffect(() => {
        const fetchDates = async () => {
            try {
                const res = await fetch('/platform/api/dates');
                if (res.ok) {
                    const data = await res.json();
                    const sortedDates = (data.dates || []).sort();
                    setAvailableDates(sortedDates);
                }
            } catch (error) {
                console.error('Error fetching dates:', error);
            }
        };
        fetchDates();
    }, [messages]);


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
        if (!text.trim() || isLoading || currentDate !== getLocalISOString() || isReportMode) return;
        handleChat(text.trim());
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

    const handleOpenReport = async () => {
        if (isLoading) return;
        setIsReportMode(true);
        const currentWeekStart = getWeekDays(viewDate)[0];
        setReportWeekStart(currentWeekStart);
        setShowCalendar(false);
        setMessages([]); // Clear chat for report view
        setIsLoading(true);

        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: '',
            type: 'report',
            reportDate: currentWeekStart
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
                <div ref={containerRef} className="absolute inset-0 overflow-y-auto no-scrollbar p-4" style={{ paddingBottom: messages.length === 0 || isReportMode ? '1rem' : '50px' }}>
                    {isHistoryLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : isReportMode ? (
                        <div className="h-full flex items-center justify-center relative z-10 w-full max-w-3xl mx-auto">
                            <Mesaj msg={{ id: 'report-view', role: 'assistant', content: '', type: 'report', reportDate: reportWeekStart || undefined }} />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in relative z-10">
                            {currentDate === getLocalISOString() ? (
                                <>
                                    <div className="space-y-2 relative z-10">
                                        <h2 className="text-2xl font-bold text-black">
                                            Merhaba, Koçun Burada!
                                        </h2>
                                        <p className="text-gray-500 text-sm font-medium">Sana nasıl yardımcı olabilirim?</p>
                                    </div>

                                    <div className="w-full max-w-3xl mx-auto space-y-2 overflow-hidden relative z-10">
                                        {/* Suggested Questions Inline for Empty State */}
                                        <div className="flex overflow-x-auto no-scrollbar gap-1.5 px-4 md:px-0 pb-1" onWheel={handleWheel} style={{ scrollbarWidth: 'none' }}>
                                            {require('./oneri').SUGGESTED_QUESTIONS.slice(0, Math.ceil(require('./oneri').SUGGESTED_QUESTIONS.length / 2)).map((q: string, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSend(q)}
                                                    className="whitespace-nowrap px-2 py-1 bg-white rounded-lg transition-all border border-gray-200 text-gray-700 text-[10px] font-medium shrink-0 hover:bg-gray-50 bg-opacity-80 backdrop-blur-sm"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex overflow-x-auto no-scrollbar gap-1.5 px-4 md:px-0" onWheel={handleWheel} style={{ scrollbarWidth: 'none' }}>
                                            {require('./oneri').SUGGESTED_QUESTIONS.slice(Math.ceil(require('./oneri').SUGGESTED_QUESTIONS.length / 2)).map((q: string, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSend(q)}
                                                    className="whitespace-nowrap px-2 py-1 bg-white rounded-lg transition-all border border-gray-200 text-gray-700 text-[10px] font-medium shrink-0 hover:bg-gray-50 bg-opacity-80 backdrop-blur-sm"
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
                                <Mesaj key={msg.id} msg={msg} />
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
                    <div ref={messagesEndRef} />
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

                    <div className="bg-gray-50 border border-gray-200 rounded-3xl flex items-center px-1 py-0.5 shadow-sm transition-all focus-within:ring-1 focus-within:ring-gray-200 min-h-[32px]">

                        {/* Calendar Popup Component */}
                        <CalendarPopup
                            show={showCalendar}
                            onToggle={() => setShowCalendar(!showCalendar)}
                            onClose={() => setShowCalendar(false)}
                            viewDate={viewDate}
                            setViewDate={setViewDate}
                            currentDate={currentDate}
                            onDateChange={handleDateChange}
                            availableDates={availableDates}
                            isReportMode={isReportMode}
                            reportWeekStart={reportWeekStart}
                            onOpenReport={handleOpenReport}
                            getLocalISOString={getLocalISOString}
                        />

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={currentDate !== getLocalISOString() || isReportMode}
                            placeholder={isReportMode ? "Rapor görüntüleniyor..." : (currentDate !== getLocalISOString() ? "Geçmiş günlere mesaj gönderilemez." : "Bir şeyler sor...")}
                            className={`flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none max-h-32 py-0 px-2 text-gray-700 placeholder-gray-400 appearance-none no-scrollbar flex items-center placeholder-13 ${currentDate !== getLocalISOString() || isReportMode ? 'cursor-not-allowed opacity-50' : ''}`}
                            style={{
                                minHeight: '24px',
                                scrollbarWidth: 'none',
                                lineHeight: '24px',
                                fontSize: '16px' // iOS zoom'u önlemek için 16px
                            }}
                            rows={1}
                        />

                        {/* Suggested Questions Popup Component */}
                        {messages.length > 0 && currentDate === getLocalISOString() && !isReportMode && (
                            <SuggestedQuestions
                                show={showSuggestedQuestions}
                                onToggle={() => setShowSuggestedQuestions(!showSuggestedQuestions)}
                                onSelect={handleSend}
                                onClose={() => setShowSuggestedQuestions(false)}
                            />
                        )}

                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading || currentDate !== getLocalISOString() || isReportMode}
                            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all shrink-0 m-0.5 ${input.trim() && !isLoading && currentDate === getLocalISOString() && !isReportMode
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
