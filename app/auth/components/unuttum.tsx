'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
            className={`w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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

// Password validation helper
function validatePassword(password: string) {
    return {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
}

export default function UnuttumPage() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const passwordRules = validatePassword(password);
    const isPasswordValid = passwordRules.length && passwordRules.uppercase && passwordRules.symbol;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isPasswordValid) {
            setError('Lütfen şifre kurallarını kontrol edin');
            return;
        }

        setLoading(true);

        try {
            const { error } = await authHelpers.updatePassword(password);

            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/platform');
                }, 2000);
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
                        <h2 className="text-lg font-bold mb-2">Şifre Güncellendi!</h2>
                        <p className="text-xs text-black mb-4">
                            Şifreniz başarıyla güncellendi. Platform sayfasına yönlendiriliyorsunuz...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        <span className="text-black">DERECE</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-400"> AI</span>
                    </h1>
                    <p className="text-sm text-black mt-2">Yeni şifrenizi belirleyin</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-black mb-1.5">
                                Yeni Şifre
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e: any) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all text-black bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Password Rules */}
                            {password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className={passwordRules.length ? 'text-green-600' : 'text-gray-500'}>
                                            En az 6 karakter
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.uppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className={passwordRules.uppercase ? 'text-green-600' : 'text-gray-500'}>
                                            En az 1 büyük harf
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordRules.symbol ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className={passwordRules.symbol ? 'text-green-600' : 'text-gray-500'}>
                                            En az 1 sembol (!@#$%...)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button type="submit" loading={loading}>
                            Şifreyi Güncelle
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
