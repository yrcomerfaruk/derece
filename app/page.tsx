'use client';

import { useState } from 'react';
import ChatPage from '@/app/chat/page';
import ProgramPage from '@/app/program/page';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'koc' | 'program'>('koc');

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Centered Header with Toggle */}
      <div className="flex items-center justify-between px-6 py-2 md:px-8 md:py-2 sticky top-0 bg-white z-20">
        <div className="text-xl font-black tracking-tighter text-black antialiased">
          DERECE <span className="text-gray-500">AI</span>
        </div>
        <div className="bg-gray-100/50 p-0.5 rounded-full flex relative">
          <button
            onClick={() => setActiveTab('koc')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 z-10 ${activeTab === 'koc'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Koç
          </button>
          <button
            onClick={() => setActiveTab('program')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 z-10 ${activeTab === 'program'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Program
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'koc' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          <ChatPage />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'program' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          <ProgramPage />
        </div>
      </div>
    </div>
  );
}
