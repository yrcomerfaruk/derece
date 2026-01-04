'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import GirisComponent from './components/giris';
import KayitComponent from './components/kayit';
import SifreComponent from './components/sifre';
import UnuttumComponent from './components/unuttum';

function AuthContent() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'giris';

    switch (tab) {
        case 'kayit':
            return <KayitComponent />;
        case 'sifre':
            return <UnuttumComponent />;
        case 'unuttum':
            return <SifreComponent />;
        default:
            return <GirisComponent />;
    }
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}
