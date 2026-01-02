'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import icon from '../../icon.svg';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface OnboardingData {
    target_degree: string;
    current_level: string;
    daily_study_hours: number;
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
    const [showSuggestions, setShowSuggestions] = useState(false);

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

    // 1. Initialize User & Check Onboarding
    useEffect(() => {
        const initUser = async () => {
            let currentUserId = localStorage.getItem('yks_coach_user_id');
            if (!currentUserId) {
                currentUserId = crypto.randomUUID();
                localStorage.setItem('yks_coach_user_id', currentUserId);
            }
            setUserId(currentUserId);

            setUserId(currentUserId);

            // Check Local Storage for Onboarding Status
            const localOnboarding = localStorage.getItem('yks_coach_onboarded');

            if (localOnboarding === 'true') {
                setIsOnboarded(true);
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

        // Delay slightly to prevent hydration mismatch or abrupt flash
        initUser();
    }, []);

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

                // Save to Local Storage (Mock DB)
                localStorage.setItem('yks_coach_onboarding_data', JSON.stringify(finalData));
                localStorage.setItem('yks_coach_onboarded', 'true');

                nextMessage = "Harika! Profilini oluşturdum. Artık sorularını sorabilir veya 'Haftalık Program Oluştur' diyerek sana özel programı hazırlamamı isteyebilirsin.";

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
        // Normal Chat Logic (Placeholder for RAG)
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Mock RAG Response for now
        // TODO: Connect to backend API
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Bu bir demo yanıtıdır. Backend entegrasyonu tamamlanınca burada gerçek yapay zeka cevapları görünecek."
            }]);
            setIsLoading(false);
        }, 1000);
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

    if (loadingAuth) {
        return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Yükleniyor...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Messages Area */}
            <div ref={containerRef} className="flex-1 overflow-y-auto no-scrollbar p-4 relative" style={{ paddingBottom: '120px' }}>
                {/* Background Icon - Always visible */}
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                    <Image
                        src={icon}
                        alt=""
                        className="w-96 h-96 opacity-[0.03]"
                        priority
                    />
                </div>
                {messages.length === 0 && isOnboarded ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in relative z-10">

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
                    </div>
                ) : (
                    <div className="space-y-4 max-w-3xl mx-auto relative z-10">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-3 py-2 ${msg.role === 'user'
                                        ? 'bg-gray-100 text-gray-900 rounded-br-sm'
                                        : 'bg-transparent text-gray-800 px-0'
                                        }`}
                                >
                                    {msg.role === 'assistant' && (
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
                                    <div className="leading-relaxed text-xs whitespace-pre-wrap break-words">
                                        {msg.content}
                                    </div>
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

            {/* Input Area - Fixed Bottom */}
            <div
                ref={inputContainerRef}
                className="fixed bottom-0 left-0 right-0 bg-white pt-2 pb-2 px-4 border-t border-gray-50 z-30"
                style={{
                    paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right))'
                }}
            >
                <div className="max-w-3xl mx-auto relative">
                    {/* Suggestions Popover */}
                    <div className={`absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-left ${showSuggestions ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`} style={{ width: '300px' }}>
                        <div className="p-2 space-y-1 max-h-[240px] overflow-y-auto no-scrollbar">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Önerilen Sorular</div>
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        handleSend(q);
                                        setShowSuggestions(false);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-full flex items-center p-1 shadow-sm transition-all focus-within:ring-1 focus-within:ring-gray-200 min-h-[32px]">
                        <button
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className={`p-1 rounded-full transition-all m-0.5 shrink-0 text-gray-400 hover:bg-gray-200 ${showSuggestions ? 'bg-gray-200 text-gray-600' : ''}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isOnboarded ? "Bir şeyler sor..." : "Cevabını buraya yaz..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none max-h-32 py-0 px-2 text-gray-700 placeholder-gray-400 appearance-none no-scrollbar flex items-center placeholder-13"
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
                            disabled={!input.trim() || isLoading}
                            className={`p-1 rounded-full transition-all m-0.5 shrink-0 ${input.trim() && !isLoading
                                ? 'bg-black text-white hover:bg-gray-800 transform hover:scale-105'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
