'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ChatPage from '@/app/platform/components/koc';
import ProgramPage from '@/app/platform/components/program';
import { authHelpers } from '@/lib/supabase';

export default function PlatformPage() {
    const [activeTab, setActiveTab] = useState<'koc' | 'program'>('koc');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { user } = await authHelpers.getUser();
            if (!user) {
                router.push('/auth?tab=giris');
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleSignOut = async () => {
        await authHelpers.signOut();
        router.push('/auth?tab=giris');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
            <div className="flex-none h-[50px] border-b border-gray-100 bg-white z-20 w-full">
                <div className="w-full h-full flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center">
                        <span className="text-[23px] font-bold tracking-tight text-black">DERECE AI</span>
                    </div>
                    <div className="flex items-center" style={{ gap: '7px' }}>
                        <div className="bg-gray-100/50 p-0.5 rounded-full flex relative">
                            <button
                                onClick={() => setActiveTab('koc')}
                                className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all duration-200 z-10 ${activeTab === 'koc'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Koç
                            </button>
                            <button
                                onClick={() => setActiveTab('program')}
                                className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all duration-200 z-10 ${activeTab === 'program'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Program
                            </button>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-7 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                            title="Çıkış Yap"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden w-full">
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'koc' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <ChatPage />
                </div>
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${activeTab === 'program' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <ProgramPage />
                </div>
            </div>
        </div >
    );
}
