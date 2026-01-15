export default function ReportCard() {
    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm w-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HAFTALIK PERFORMANS RAPORU</span>
            </div>

            <p className="text-[12px] text-gray-700 leading-relaxed mb-6 font-medium">
                Şu anki genel ilerlemen <span className="font-bold text-black">%38</span> seviyesinde. Toplam <span className="font-bold text-black">67</span> konudan <span className="font-bold text-black">0</span> tanesini başarıyla tamamladın. Henüz yolun başındasın ama istikrarlı bir çalışma ile netlerini hızla artırabiliriz. Eksik olduğun konulara odaklanmaya ne dersin? Unutma, her büyük başarı küçük bir adımla başlar.
            </p>

            <div className="flex items-start gap-12 border-t border-gray-100 pt-4">
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">DERS DURUMU</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-black"></div>
                        <span className="text-xs font-semibold text-gray-700">9 Aktif Ders</span>
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">KONU TAKİBİ</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        <span className="text-xs font-semibold text-gray-500">67 Kalan Konu</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
