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
    onClose
}: ProgramAssistantProps) {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatPopupRef = useRef<HTMLDivElement>(null);
    const fabRef = useRef<HTMLButtonElement>(null);

    // Click outside handler
    useEffect(() => {
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
    }, [isOpen, onClose]);

    // Scroll to bottom
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    return (
        <>
            {/* CHAT POPUP */}
            {isOpen && (
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
                    <div className="p-2 bg-white border-t border-gray-100">
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
            )}

            {/* FLOATING ACTION BUTTON */}
            <button
                ref={fabRef}
                onClick={onToggle}
                className="fixed bottom-6 right-6 w-10 h-10 bg-black text-white rounded-full shadow-xl flex items-center justify-center z-50"
            >
                {isOpen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    </>
                )}
            </button>
        </>
    );
}
