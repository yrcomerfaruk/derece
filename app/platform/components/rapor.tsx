import { useEffect, useState } from 'react';

interface ReportCardProps {
    date?: string | null;
}

export default function ReportCard({ date }: ReportCardProps) {
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        progress: 0,
        activeSubjects: 0,
        remaining: 0,
        analysis: ""
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const url = date ? `/platform/api/report?date=${date}` : '/platform/api/report';
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Report fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [date]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-6"></div>
                <div className="flex gap-12 pt-4 border-t border-gray-100">
                    <div className="h-8 w-20 bg-gray-100 rounded"></div>
                    <div className="h-8 w-20 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HAFTALIK PERFORMANS RAPORU</span>
            </div>

            <p className="text-[12px] text-gray-700 leading-relaxed mb-6 font-medium">
                Şu anki genel ilerlemen <span className="font-bold text-black">%{stats.progress}</span> seviyesinde. Toplam <span className="font-bold text-black">{stats.total}</span> konudan <span className="font-bold text-black">{stats.completed}</span> tanesini başarıyla tamamladın. {stats.analysis}
            </p>

            <div className="flex items-start gap-12 border-t border-gray-100 pt-4">
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">DERS DURUMU</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-black"></div>
                        <span className="text-xs font-semibold text-gray-700">{stats.activeSubjects} Aktif Ders</span>
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">KONU TAKİBİ</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        <span className="text-xs font-semibold text-gray-500">{stats.remaining} Kalan Konu</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
