'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Types
interface NetData {
    current: number | string;
    target: number | string;
}

interface OnboardingData {
    class_level: string;
    department: string;
    study_start_time: string;
    nets: Record<string, NetData>;
    subject_proficiency: Record<string, string>;
    study_session: {
        duration: number;
        break_time: number;
        lunch_break: number;
        session_count: number;
    };
    study_structure: Record<string, number>;
}

// Step descriptions
const STEP_INFO = [
    {
        title: "Sınıf Durumun",
        description: "Sana özel bir program hazırlamamız için önce sınıf durumunu öğrenmemiz gerekiyor. Bu bilgi, içeriklerin ve hedeflerin doğru belirlenmesini sağlayacak."
    },
    {
        title: "Alan Bilgin",
        description: "Sayısal alan için hazırlanıyorsun. İleride diğer alanlar için de destek ekleyeceğiz."
    },
    {
        title: "Çalışma Geçmişin",
        description: "Ne zamandır YKS'ye hazırlanıyorsun? Bu bilgi, programını oluştururken hangi aşamada olduğunu anlamamıza yardımcı olacak."
    },
    {
        title: "Net Durumun",
        description: "Güncel netlerini ve hedef netlerini gir. Hedef netlerin güncel netlerinden yüksek olmalı. Bu veriler, gelişimini takip etmemize yardımcı olacak."
    },
    {
        title: "Konu Durumun",
        description: "Her konu için seviyeni seç. Bu bilgi, hangi konulara öncelik vermemiz gerektiğini belirlememize yardımcı olacak."
    },
    {
        title: "Etüt Tercihlerin",
        description: "Etüt süreni, mola sürelerini ve günlük kaç etüt yapabileceğini belirle. Önerilen: 50dk etüt + 10dk mola."
    },
    {
        title: "Çalışma Dağılımın",
        description: "Etütlerini derslere nasıl dağıtmak istiyorsun? Önerilen dağılım: %50 Matematik, %25 Fen, %25 Diğer Dersler. Toplamın %100 olması gerekiyor."
    }
];

// Options
const CLASS_OPTIONS = [
    { value: '12', label: '12. Sınıf' },
    { value: 'mezun', label: 'Mezun' }
];

const STUDY_START_OPTIONS = [
    { value: 'baslamadim', label: 'Henüz Başlamadım' },
    { value: '3ay', label: '3 Ay Önce' },
    { value: '6ay', label: '6 Ay Önce' },
    { value: '1yil', label: '1 Yıl Önce' },
    { value: 'sene_basi', label: 'Sene Başından Beri' }
];

const NET_SUBJECTS = {
    tyt: [
        { key: 'tyt_turkce', label: 'TYT Türkçe', max: 40 },
        { key: 'tyt_matematik', label: 'TYT Matematik', max: 40 },
        { key: 'tyt_fen', label: 'TYT Fen', max: 20 },
        { key: 'tyt_sosyal', label: 'TYT Sosyal', max: 20 }
    ],
    ayt: [
        { key: 'ayt_matematik', label: 'AYT Matematik', max: 40 },
        { key: 'ayt_fizik', label: 'AYT Fizik', max: 14 },
        { key: 'ayt_kimya', label: 'AYT Kimya', max: 13 },
        { key: 'ayt_biyoloji', label: 'AYT Biyoloji', max: 13 }
    ]
};

const SUBJECT_TOPICS = [
    {
        subject: 'TYT Türkçe',
        topics: [
            { key: 'tyt_turkce_paragraf', label: 'Paragraf' },
            { key: 'tyt_turkce_dilbilgisi', label: 'Dil Bilgisi' },
            { key: 'tyt_turkce_yazim', label: 'Yazım ve Noktalama' },
            { key: 'tyt_turkce_anlam', label: 'Anlam Bilgisi' }
        ]
    },
    {
        subject: 'TYT Matematik',
        topics: [
            { key: 'tyt_mat_ilk12', label: 'İlk 12 Konu' },
            { key: 'tyt_mat_problemler', label: 'Problemler' },
            { key: 'tyt_mat_kume', label: 'Küme-Mantık-Fonksiyon' },
            { key: 'tyt_mat_ayt_ortak', label: 'AYT Ortak Konular' }
        ]
    },
    {
        subject: 'TYT Fen',
        topics: [
            { key: 'tyt_fen_fizik', label: 'Fizik' },
            { key: 'tyt_fen_kimya', label: 'Kimya' },
            { key: 'tyt_fen_biyoloji', label: 'Biyoloji' }
        ]
    },
    {
        subject: 'TYT Sosyal',
        topics: [
            { key: 'tyt_sosyal_tarih', label: 'Tarih' },
            { key: 'tyt_sosyal_cografya', label: 'Coğrafya' },
            { key: 'tyt_sosyal_din', label: 'Din Kültürü' },
            { key: 'tyt_sosyal_felsefe', label: 'Felsefe' }
        ]
    },
    {
        subject: 'AYT Matematik',
        topics: [
            { key: 'ayt_mat_ortak', label: 'TYT Ortak Konular' },
            { key: 'ayt_mat_parabol', label: 'Parabol' },
            { key: 'ayt_mat_trigonometri', label: 'Trigonometri' },
            { key: 'ayt_mat_logaritma', label: 'Logaritma' },
            { key: 'ayt_mat_diziler', label: 'Diziler' },
            { key: 'ayt_mat_limit', label: 'Limit' },
            { key: 'ayt_mat_turev', label: 'Türev' },
            { key: 'ayt_mat_integral', label: 'İntegral' }
        ]
    },
    {
        subject: 'AYT Fen',
        topics: [
            { key: 'ayt_fen_fizik', label: 'Fizik' },
            { key: 'ayt_fen_kimya', label: 'Kimya' },
            { key: 'ayt_fen_biyoloji', label: 'Biyoloji' }
        ]
    }
];

const PROFICIENCY_OPTIONS = [
    { value: 'baslangic', label: 'Başlangıç', selectedClass: 'bg-black text-white border-black' },
    { value: 'orta', label: 'Orta', selectedClass: 'bg-black text-white border-black' },
    { value: 'iyi', label: 'İyi', selectedClass: 'bg-black text-white border-black' }
];

const STUDY_SESSION_OPTIONS = {
    duration: [
        { value: 50, label: '50 dk' },
        { value: 75, label: '75 dk' },
        { value: 90, label: '90 dk' }
    ],
    break_time: [
        { value: 10, label: '10 dk' },
        { value: 15, label: '15 dk' },
        { value: 20, label: '20 dk' }
    ],
    lunch_break: [
        { value: 60, label: '60 dk' },
        { value: 75, label: '75 dk' },
        { value: 90, label: '90 dk' }
    ]
};

const STUDY_STRUCTURE_PRESETS = [
    {
        id: 'mat_agirlikli',
        title: 'Matematik Ağırlıklı',
        desc: '%50 Matematik, %30 Fen, %20 Diğer Dersler',
        values: { matematik: 50, fen: 30, diger_dersler: 20 }
    },
    {
        id: 'fen_agirlikli',
        title: 'Fen Ağırlıklı',
        desc: '%35 Matematik, %50 Fen, %15 Diğer Dersler',
        values: { matematik: 35, fen: 50, diger_dersler: 15 }
    },
    {
        id: 'dengeli',
        title: 'Dengeli Dağılım',
        desc: '%40 Matematik, %40 Fen, %20 Diğer Dersler',
        values: { matematik: 40, fen: 40, diger_dersler: 20 }
    },
    {
        id: 'rutin',
        title: 'Genel YKS Rutini',
        desc: '%45 Matematik, %40 Fen, %15 Diğer Dersler',
        values: { matematik: 45, fen: 40, diger_dersler: 15 }
    }
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [showIntroModal, setShowIntroModal] = useState(true);

    // Form data
    const [data, setData] = useState<OnboardingData>({
        class_level: '',
        department: 'sayisal',
        study_start_time: '',
        nets: {},
        subject_proficiency: {},
        study_session: {
            duration: 50,
            break_time: 10,
            lunch_break: 60,
            session_count: 8
        },
        study_structure: {
            matematik: 0,
            fen: 0,
            diger_dersler: 0
        }
    });

    // Check auth
    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth?tab=giris');
                return;
            }

            setUserId(user.id);

            // Check if already onboarded
            const { data: existingOnboarding } = await supabase
                .from('user_onboarding')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingOnboarding) {
                router.push('/platform');
                return;
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [router]);

    // Initialize nets with empty values
    useEffect(() => {
        const initialNets: Record<string, NetData> = {};
        [...NET_SUBJECTS.tyt, ...NET_SUBJECTS.ayt].forEach(subject => {
            initialNets[subject.key] = { current: '', target: '' };
        });
        setData(prev => ({ ...prev, nets: initialNets }));
    }, []);

    // Remove automatic proficiency initialization to force selection

    const handleNext = () => {
        if (currentStep < 6) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 0:
                return !!data.class_level;
            case 1:
                return true; // Sayısal default
            case 2:
                return !!data.study_start_time;
            case 3:
                // Check if all nets are filled and targets >= current
                const allNets = [...NET_SUBJECTS.tyt, ...NET_SUBJECTS.ayt];
                return allNets.every(subject => {
                    const net = data.nets[subject.key];
                    // Check if strictly not empty string (allows 0 but must be typed)
                    // But usually inputs empty means empty string.
                    if (!net || net.current === '' || net.target === '') return false;
                    return Number(net.target) >= Number(net.current);
                });
            case 4:
                // Check if all proficiency is filled
                return SUBJECT_TOPICS.every(subject =>
                    subject.topics.every(topic => !!data.subject_proficiency[topic.key])
                );
            case 5:
                return data.study_session.session_count > 0;
            case 6:
                const total = Object.values(data.study_structure).reduce((a, b) => a + b, 0);
                return total === 100;
            default:
                return false;
        }
    };

    const handleSave = async () => {
        if (!userId) return;

        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('user_onboarding')
                .insert({
                    user_id: userId,
                    class_level: data.class_level,
                    department: data.department,
                    study_start_time: data.study_start_time,
                    nets: data.nets,
                    subject_proficiency: data.subject_proficiency,
                    study_session: data.study_session,
                    study_structure: data.study_structure
                });

            if (error) throw error;

            // Clear old localStorage
            localStorage.removeItem('yks_coach_onboarded');
            localStorage.removeItem('yks_coach_onboarding_data');

            router.push('/platform');
        } catch (error) {
            console.error('Error saving onboarding:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white">
                <div className="h-2 w-full border border-black rounded-full overflow-hidden bg-white">
                    <div
                        className="h-full bg-black transition-all duration-500 ease-out"
                        style={{ width: `${((currentStep + 1) / 7) * 100}%` }}
                    />
                </div>
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-black">%{Math.round(((currentStep + 1) / 7) * 100)}</span>
                    <span className="text-xs text-black">{currentStep + 1} / 7</span>
                </div>
            </div>

            {/* Content */}
            <div className="pt-16 pb-32 px-4 max-w-2xl mx-auto">
                {/* Step Info */}
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-black mb-2">
                        {STEP_INFO[currentStep].title}
                    </h1>
                    <p className="text-sm text-black">
                        {STEP_INFO[currentStep].description}
                    </p>
                </div>

                {currentStep === 0 && (
                    <div className="space-y-3">
                        {CLASS_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setData(prev => ({ ...prev, class_level: option.value }))}
                                className={`w-full p-3 rounded-xl text-sm border transition-all flex items-center justify-center ${data.class_level === option.value
                                    ? 'border-black bg-black text-white'
                                    : 'border-black bg-white text-black hover:bg-black hover:text-white'
                                    }`}
                            >
                                <span className="font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-3">
                        <button
                            className="w-full p-3 rounded-xl text-sm border border-black bg-black text-white flex items-center justify-center"
                        >
                            <div className="text-center">
                                <span className="font-medium block">Sayısal</span>
                                <span className="text-xs text-white">Matematik, Fizik, Kimya, Biyoloji</span>
                            </div>
                        </button>
                        <p className="text-xs text-black text-center mt-4">
                            Diğer alanlar yakında eklenecek.
                        </p>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-3">
                        {STUDY_START_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setData(prev => ({ ...prev, study_start_time: option.value }))}
                                className={`w-full p-3 rounded-xl text-sm border transition-all flex items-center justify-center ${data.study_start_time === option.value
                                    ? 'border-black bg-black text-white'
                                    : 'border-black bg-white text-black hover:bg-black hover:text-white'
                                    }`}
                            >
                                <span className="font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 3: Nets */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        {/* TYT */}
                        <div>
                            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">TYT Netleri</h3>
                            <div className="space-y-3">
                                {NET_SUBJECTS.tyt.map(subject => (
                                    <div key={subject.key} className="bg-white rounded-xl border border-black p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-sm text-black">{subject.label}</span>
                                            <span className="text-xs text-black">Max: {subject.max}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-black block mb-1">Güncel Net</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={subject.max}
                                                    value={data.nets[subject.key]?.current ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setData(prev => ({
                                                            ...prev,
                                                            nets: {
                                                                ...prev.nets,
                                                                [subject.key]: {
                                                                    ...prev.nets[subject.key],
                                                                    current: val === '' ? '' : Math.min(Number(val), subject.max)
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg border border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black text-center font-medium text-black"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-black block mb-1">Hedef Net</label>
                                                <input
                                                    type="number"
                                                    min={typeof data.nets[subject.key]?.current === 'number' ? data.nets[subject.key]?.current : 0}
                                                    max={subject.max}
                                                    value={data.nets[subject.key]?.target ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setData(prev => ({
                                                            ...prev,
                                                            nets: {
                                                                ...prev.nets,
                                                                [subject.key]: {
                                                                    ...prev.nets[subject.key],
                                                                    target: val === '' ? '' : Math.min(Number(val), subject.max)
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg border border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black text-center font-medium text-black"
                                                />
                                            </div>
                                        </div>
                                        {data.nets[subject.key]?.target < data.nets[subject.key]?.current && (
                                            <p className="text-xs text-red-500 mt-2">Hedef net, güncel netten düşük olamaz.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AYT */}
                        <div>
                            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">AYT Netleri</h3>
                            <div className="space-y-3">
                                {NET_SUBJECTS.ayt.map(subject => (
                                    <div key={subject.key} className="bg-white rounded-xl border border-black p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-sm text-black">{subject.label}</span>
                                            <span className="text-xs text-black">Max: {subject.max}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-black block mb-1">Güncel Net</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={subject.max}
                                                    value={data.nets[subject.key]?.current ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setData(prev => ({
                                                            ...prev,
                                                            nets: {
                                                                ...prev.nets,
                                                                [subject.key]: {
                                                                    ...prev.nets[subject.key],
                                                                    current: val === '' ? '' : Math.min(Number(val), subject.max)
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg border border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black text-center font-medium text-black"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-black block mb-1">Hedef Net</label>
                                                <input
                                                    type="number"
                                                    min={typeof data.nets[subject.key]?.current === 'number' ? data.nets[subject.key]?.current : 0}
                                                    max={subject.max}
                                                    value={data.nets[subject.key]?.target ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setData(prev => ({
                                                            ...prev,
                                                            nets: {
                                                                ...prev.nets,
                                                                [subject.key]: {
                                                                    ...prev.nets[subject.key],
                                                                    target: val === '' ? '' : Math.min(Number(val), subject.max)
                                                                }
                                                            }
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg border border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black text-center font-medium text-black"
                                                />
                                            </div>
                                        </div>
                                        {data.nets[subject.key]?.target < data.nets[subject.key]?.current && (
                                            <p className="text-xs text-red-500 mt-2">Hedef net, güncel netten düşük olamaz.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Subject Proficiency */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        {SUBJECT_TOPICS.map(subject => (
                            <div key={subject.subject}>
                                <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">{subject.subject}</h3>
                                <div className="space-y-2">
                                    {subject.topics.map(topic => (
                                        <div key={topic.key} className="bg-white rounded-xl border border-black p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-black">{topic.label}</span>
                                                <div className="flex gap-1">
                                                    {PROFICIENCY_OPTIONS.map(option => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => setData(prev => ({
                                                                ...prev,
                                                                subject_proficiency: {
                                                                    ...prev.subject_proficiency,
                                                                    [topic.key]: option.value
                                                                }
                                                            }))}
                                                            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${data.subject_proficiency[topic.key] === option.value
                                                                ? option.selectedClass
                                                                : 'bg-white border-black text-black hover:bg-black hover:text-white'
                                                                }`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 5: Study Session */}
                {currentStep === 5 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-black p-4">
                            <h3 className="font-medium text-black mb-3">Etüt Süresi</h3>
                            <div className="flex gap-2">
                                {STUDY_SESSION_OPTIONS.duration.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setData(prev => ({
                                            ...prev,
                                            study_session: { ...prev.study_session, duration: option.value }
                                        }))}
                                        className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${data.study_session.duration === option.value
                                            ? 'border-black bg-black text-white'
                                            : 'border-black text-black hover:bg-black hover:text-white'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-black p-4">
                            <h3 className="font-medium text-black mb-3">Etüt Molası</h3>
                            <div className="flex gap-2">
                                {STUDY_SESSION_OPTIONS.break_time.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setData(prev => ({
                                            ...prev,
                                            study_session: { ...prev.study_session, break_time: option.value }
                                        }))}
                                        className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${data.study_session.break_time === option.value
                                            ? 'border-black bg-black text-white'
                                            : 'border-black text-black hover:bg-black hover:text-white'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-black p-4">
                            <h3 className="font-medium text-black mb-3">Öğle Arası</h3>
                            <div className="flex gap-2">
                                {STUDY_SESSION_OPTIONS.lunch_break.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setData(prev => ({
                                            ...prev,
                                            study_session: { ...prev.study_session, lunch_break: option.value }
                                        }))}
                                        className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${data.study_session.lunch_break === option.value
                                            ? 'border-black bg-black text-white'
                                            : 'border-black text-black hover:bg-black hover:text-white'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-black p-4">
                            <h3 className="font-medium text-black mb-3">Günlük Etüt Sayısı</h3>
                            <input
                                type="number"
                                min="1"
                                max={Math.floor((15 * 60) / data.study_session.duration)}
                                value={data.study_session.session_count}
                                onChange={(e) => {
                                    const maxSessions = Math.floor((15 * 60) / data.study_session.duration);
                                    let val = Number(e.target.value);
                                    if (val > maxSessions) val = maxSessions;
                                    setData(prev => ({
                                        ...prev,
                                        study_session: { ...prev.study_session, session_count: val }
                                    }));
                                }}
                                className="w-full px-4 py-2 rounded-xl text-sm border-2 border-black focus:border-black focus:outline-none text-center text-xl font-bold text-black"
                            />
                            <p className="text-xs text-black text-center mt-2">
                                Toplam: {data.study_session.session_count * data.study_session.duration} dakika ({Math.floor(data.study_session.session_count * data.study_session.duration / 60)} saat {data.study_session.session_count * data.study_session.duration % 60} dk)
                                <br />
                                <span className="text-gray-500">(Max 15 saat: {Math.floor((15 * 60) / data.study_session.duration)} etüt)</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 6: Study Structure */}
                {currentStep === 6 && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {STUDY_STRUCTURE_PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => setData(prev => ({ ...prev, study_structure: preset.values }))}
                                    className={`w-full p-4 rounded-xl border text-left transition-all group ${JSON.stringify(data.study_structure) === JSON.stringify(preset.values)
                                        ? 'border-black bg-black text-white'
                                        : 'border-black bg-white text-black hover:bg-black hover:text-white'
                                        }`}
                                >
                                    <div className="font-bold text-lg mb-1">{preset.title}</div>
                                    <div className={`text-sm font-medium ${JSON.stringify(data.study_structure) === JSON.stringify(preset.values)
                                        ? 'text-white'
                                        : 'text-black group-hover:text-white'
                                        }`}>
                                        {preset.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black p-4">
                <div className="max-w-2xl mx-auto flex gap-3">
                    {currentStep > 0 && (
                        <button
                            onClick={handleBack}
                            className="px-6 py-2 rounded-xl text-sm border border-black bg-white text-black font-medium hover:bg-black hover:text-white transition-all"
                        >
                            Geri
                        </button>
                    )}

                    {currentStep < 6 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${canProceed()
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-white border border-black text-black cursor-not-allowed'
                                }`}
                        >
                            Devam Et
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={!canProceed() || isSaving}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${canProceed() && !isSaving
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-white border border-black text-black cursor-not-allowed'
                                }`}
                        >
                            {isSaving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Kaydediliyor...
                                </span>
                            ) : (
                                'Tamamla'
                            )}
                        </button>
                    )}
                </div>
            </div>
            {/* Intro Warning Modal */}
            {showIntroModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-black animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-bold text-black">
                                Dikkat!
                            </h2>

                            <p className="text-sm text-gray-600 leading-relaxed">
                                Size en uygun çalışma programını hazırlayabilmemiz için vereceğiniz bilgilerin <span className="font-bold text-black">doğru ve eksiksiz</span> olması çok önemlidir.
                                <br /><br />
                                Lütfen tüm adımları dikkatlice doldurunuz.
                            </p>

                            <button
                                onClick={() => setShowIntroModal(false)}
                                className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                            >
                                Anladım, Başla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
