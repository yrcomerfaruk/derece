'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { authHelpers } from '@/lib/supabase';

// Input Component
function Input({ label, error, className = '', ...props }: any) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-black mb-1.5">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-2.5 rounded-lg border text-black bg-white ${error
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-black'
                    } focus:outline-none focus:ring-1 focus:ring-black transition-all ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

// Button Component
function Button({ children, loading, className = '', ...props }: any) {
    return (
        <button
            className={`w-full bg-black text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Yükleniyor...
                </span>
            ) : (
                children
            )}
        </button>
    );
}

export default function SifrePage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Send password reset email
            // Note: For security reasons, we always show success message
            // even if email doesn't exist (prevents email enumeration)
            const { error } = await authHelpers.resetPassword(email);

            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white px-4">
                <div className="w-full max-w-sm">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg text-black font-bold mb-2">Email Gönderildi!</h2>
                        <p className="text-xs text-black mb-4">
                            Şifre sıfırlama linki email adresinize gönderildi. Lütfen email'inizi kontrol edin.
                        </p>
                        <Link
                            href="/auth?tab=giris"
                            className="inline-block text-xs text-black font-semibold hover:underline"
                        >
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8 flex flex-col items-center">
                    <Image src="/logo-new.svg" alt="Derece AI" width={120} height={32} className="h-8 w-auto" />
                    <p className="text-sm text-black mt-4">Şifrenizi sıfırlayın</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                                {error}
                            </div>
                        )}

                        <Input
                            type="email"
                            label="Email"
                            placeholder="ornek@email.com"
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />

                        <Button type="submit" loading={loading}>
                            Sıfırlama Linki Gönder
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link href="/auth?tab=giris" className="text-xs text-black hover:underline">
                            Giriş sayfasına dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
