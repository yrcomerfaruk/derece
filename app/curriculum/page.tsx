'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Topic {
    id: string;
    category: string;
    subject: string;
    title: string;
    description: string;
    study_hours: number;
    test_hours: number;
    review_hours: number;
    order_index: number;
}

const CATEGORIES = ['TYT', 'AYT'];

const SUBJECTS = [
    'Matematik',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'Türkçe',
    'Tarih',
    'Coğrafya',
    'Felsefe',
    'Din Kültürü',
    'Edebiyat'
];

export default function CurriculumPage() {
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [form, setForm] = useState({
        category: 'TYT',
        title: '',
        description: '',
        study_hours: '',
        test_hours: '',
        review_hours: ''
    });

    // Fetch existing topics for the subject
    const fetchTopics = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('topics')
            .select('*')
            .eq('subject', selectedSubject)
            .order('order_index', { ascending: true });

        if (data) setTopics(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTopics();
    }, [selectedSubject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newOrderIndex = topics.length > 0
            ? Math.max(...topics.map(t => t.order_index)) + 1
            : 1;

        const { error } = await supabase
            .from('topics')
            .insert({
                category: form.category,
                subject: selectedSubject,
                title: form.title,
                description: form.description,
                study_hours: Number(form.study_hours) || 0,
                test_hours: Number(form.test_hours) || 0,
                review_hours: Number(form.review_hours) || 0,
                order_index: newOrderIndex,
                slug: `${form.category.toLowerCase()}_${selectedSubject.toLowerCase()}_${form.title.toLowerCase().replace(/ /g, '_')}`
            });

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            // Reset form and refresh
            setForm({ ...form, title: '', description: '', study_hours: '', test_hours: '', review_hours: '' });
            fetchTopics();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu konuyu silmek istediğinize emin misiniz?')) return;

        await supabase.from('topics').delete().eq('id', id);
        fetchTopics();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-black">Müfredat Yönetimi</h1>
                        <p className="text-gray-600">Ders ve konu ekleme paneli</p>
                    </div>
                    <a href="/platform" className="text-sm text-blue-600 hover:underline">Platforma Dön</a>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Input Form */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-semibold text-black mb-4">Yeni Konu Ekle</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-black"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Ders</label>
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-black"
                                        >
                                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Konu Adı</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Örn: Temel Kavramlar"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Açıklama</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Konu içeriği hakkında kısa bilgi..."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm text-black resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Çalışma (Saat)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={form.study_hours}
                                            onChange={e => setForm({ ...form, study_hours: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Test (Saat)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={form.test_hours}
                                            onChange={e => setForm({ ...form, test_hours: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-1">Tekrar (Saat)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={form.review_hours}
                                            onChange={e => setForm({ ...form, review_hours: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center text-black"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Ekle
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: List */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-black">{selectedSubject} Akışı</h2>
                                <span className="text-xs text-gray-500">{topics.length} Konu</span>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-sm text-gray-400">Yükleniyor...</div>
                            ) : topics.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    Henüz konu eklenmemiş. Soldaki formdan ekleyebilirsiniz.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {topics.map((topic, index) => (
                                        <div key={topic.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-black transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${topic.category === 'AYT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {topic.category || 'TYT'}
                                                        </span>
                                                        <h3 className="text-sm font-semibold text-black">{topic.title}</h3>
                                                    </div>
                                                    {topic.description && (
                                                        <p className="text-[10px] text-gray-500 mb-1 line-clamp-1">{topic.description}</p>
                                                    )}
                                                    <div className="flex gap-2 text-[10px] text-gray-500">
                                                        <span>Ç: {topic.study_hours}s</span>
                                                        <span>•</span>
                                                        <span>T: {topic.test_hours}s</span>
                                                        <span>•</span>
                                                        <span>R: {topic.review_hours}s</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(topic.id)}
                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
