'use client';

import { useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ProgramAssistantProps {
    isOpen: boolean;
    onToggle: () => void;
    messages: Message[];
    input: string;
    setInput: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    onClose: () => void;
}

export default function ProgramAssistant({
    isOpen,
    onToggle,
    messages,
    input,
    setInput,
    onSend,
    isLoading,
    onClose,
    mode = 'popup' // Default to popup
}: ProgramAssistantProps & { mode?: 'popup' | 'sidebar' }) {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatPopupRef = useRef<HTMLDivElement>(null);
    const fabRef = useRef<HTMLButtonElement>(null);

    // Click outside handler - Only for popup mode
    useEffect(() => {
        if (mode === 'sidebar') return;

        function handleClickOutside(event: MouseEvent) {
            if (isOpen &&
                chatPopupRef.current && !chatPopupRef.current.contains(event.target as Node) &&
                fabRef.current && !fabRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, mode]);

    // Scroll to bottom
    useEffect(() => {
        if (isOpen || mode === 'sidebar') {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, mode]);

    const isSidebar = mode === 'sidebar';

    // If sidebar, render content directly.
    if (isSidebar) {
        return (
            <div className="w-full h-full flex flex-col bg-white border-l border-gray-100">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-white shrink-0">
                    <span className="text-sm font-bold text-gray-800">Program Asistanı</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-50">
                            <p className="text-gray-500 text-xs">Programında değişiklik yapmak için yazabilirsin.</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
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
                <div className="p-2 bg-white border-t border-gray-100 shrink-0">
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl flex items-center px-1 py-0.5 shadow-sm transition-all focus-within:ring-1 focus-within:ring-gray-200 min-h-[32px]">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSend()}
                            placeholder="Değişiklik yap..."
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none py-0 px-2 text-gray-700 placeholder-gray-400 text-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={onSend}
                            disabled={!input.trim() || isLoading}
                            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all shrink-0 m-0.5 ${input.trim() && !isLoading
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
        );
    }

    // MOBILE DRAWER MODE

    return (
        <>
            {/* SIDE TRIGGER (Mobile Only - When Closed) */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed right-0 top-1/2 -translate-y-1/2 bg-gray-50 text-gray-600 border border-gray-200 border-r-0 p-2 rounded-l-xl shadow-sm z-50 flex flex-col items-center gap-1 active:scale-95 transition-transform lg:hidden"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="10" x="3" y="11" rx="2" />
                        <circle cx="12" cy="5" r="2" />
                        <path d="M12 7v4" />
                        <line x1="8" y1="16" x2="8.01" y2="16" />
                        <line x1="16" y1="16" x2="16.01" y2="16" />
                    </svg>
                    <span className="text-[9px] font-bold rotate-180" style={{ writingMode: 'vertical-rl' }}>ASİSTAN</span>
                </button>
            )}

            {/* DRAWER (Mobile Only) */}
            {isOpen && (
                <div
                    ref={chatPopupRef}
                    className="fixed bottom-0 top-[50px] left-0 right-0 bg-white z-[100] flex flex-col animate-in slide-in-from-right duration-300 border-t border-gray-100 rounded-none lg:hidden"
                >
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                            <span className="text-[16px] font-bold text-gray-800">Program Asistanı</span>
                        </div>
                        <button onClick={onClose} className="p-1 text-black rounded-full">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-50">
                                <p className="text-gray-500 text-xs text-balance">Ders eklemek, çıkarmak veya değiştirmek için bana yazabilirsin.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-2 py-1.5 rounded-xl text-xs ${msg.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-white border border-gray-200 text-gray-500 rounded-bl-none shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-2 bg-white border-t border-gray-100 safe-area-bottom">
                        <div className="bg-gray-50 border border-gray-200 rounded-[20px] flex items-center px-1.5 py-0.5 shadow-sm transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSend()}
                                placeholder="Bir şeyler yaz..."
                                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none py-1 px-2 text-gray-700 placeholder-gray-400 text-sm"
                                disabled={isLoading}
                            />
                            <button
                                onClick={onSend}
                                disabled={!input.trim() || isLoading}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ${input.trim() && !isLoading
                                    ? 'bg-black text-white hover:bg-gray-800 shadow-md transform hover:scale-105'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
