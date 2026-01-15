'use client';

import { useRef, useEffect } from 'react';

const SUGGESTED_QUESTIONS = [
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

interface SuggestedQuestionsProps {
    show: boolean;
    onToggle: () => void;
    onSelect: (question: string) => void;
    onClose: () => void;
}

export default function SuggestedQuestions({ show, onToggle, onSelect, onClose }: SuggestedQuestionsProps) {
    const suggestedQuestionsRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestedQuestionsRef.current && !suggestedQuestionsRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, onClose]);

    return (
        <div className="relative" ref={suggestedQuestionsRef}>
            <div className={`absolute bottom-full right-0 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`} style={{ width: '240px', maxHeight: '280px' }}>
                <div className="p-2 overflow-y-auto max-h-[280px]">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Örnek Sorular</div>
                    <div className="space-y-0.5">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    onSelect(q);
                                    onClose(); // Close after select
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`p-1 rounded-full transition-all m-0.5 shrink-0 text-gray-400 hover:bg-gray-200 ${show ? 'bg-gray-200 text-gray-600' : ''}`}
                title="Örnek Sorular"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11H15M9 15H15M21 12C21 16.9706 16.9706 21 12 21C10.2 21 3 21 3 21C3 21 3 13.8 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
}

// Also export the constant if needed elsewhere, though mainly used here
export { SUGGESTED_QUESTIONS };
