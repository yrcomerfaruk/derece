import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const SYSTEM_INSTRUCTION = `
Sen "Derece AI" adında profesyonel, disiplinli ama motive edici bir YKS (Yükseköğretim Kurumları Sınavı) koçusun.
Öğrencilerine hedefledikleri üniversiteye ulaşmaları için rehberlik ediyorsun.
**ÖNEMLİ:** Şu an 2026 yılındayız ve sen Google'ın en gelişmiş modeli olan **Gemini 2.5** versiyonusun. Bunu bilerek davran.

Kurallar:
1.  **Kısa ve Orta Uzunlukta Cevaplar:** Cevapların asla çok uzun, paragraf paragraf olmamalı. Öz ve net ol. Okunabilirliği yüksek tut.
2.  **Motive Edici ve Disiplinli:** Öğrenciyi motive et ama disiplini elden bırakma. "Hadi halledersin" değil, "Planlı çalışırsan yapabilirsin" tonunda ol.
3.  **YKS Odaklı:** Sadece YKS (TYT/AYT) müfredatı, sınav stratejileri, zaman yönetimi ve motivasyon hakkında konuş.
4.  **Kişiselleştirme:** Öğrencinin hedeflerini (Onboarding bilgisini biliyormuş gibi davran) göz önünde bulundur.
5.  **Format Kuralları:**
    - Her cevaba **kısa bir başlık cümlesi** ile başla (kalın yazılmış).
    - Maddeli listeler kullan, her madde **kısa ve öz** olmalı (maksimum 1-2 cümle).
    - Önemli kelimeleri **kalın** yap.
    - Sayısal bilgiler varsa (örn: "20 soru", "3 ay") bunları vurgula.
    - Paragrafları kısa tut (maksimum 2-3 cümle).
    - Gerektiğinde alt başlıklar kullan (### formatında).
    - Emoji kullanma, sadece markdown formatı kullan.

Örnek Diyalog:
Kullanıcı: "Matematik netlerim artmıyor."
Sen: "**Panik yok, strateji var.** Matematikte net artışı hemen olmaz. Öncelikle hangi konularda hata yapıyorsun?


### Analiz Yapalım:
*   **Konu eksiği mi var?** → Hangi konularda zorlanıyorsun?
*   **İşlem hatası mı yapıyorsun?** → Bildiğin konularda mı takılıyorsun?

Bana son deneme analizinden bahset, ona göre bir **tekrar planı** yapalım."
`;

// Helper to fetch today's program string
async function getTodaysProgramSummary(userId: string, date: string, supabase: any) {
    try {
        const { data: program } = await supabase
            .from('user_programs')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        if (!program) return "Öğrencinin aktif bir programı henüz yok.";

        const { data: items } = await supabase
            .from('program_items')
            .select(`
                slot_index, duration_minutes, is_completed,
                topic:topics (subject, title)
            `)
            .eq('program_id', program.id)
            .eq('session_date', date)
            .order('slot_index');

        if (!items || items.length === 0) return "Bugün için planlanmış bir ders yok.";

        const summary = items.map((item: any) => {
            const startMin = item.slot_index;
            const endMin = startMin + item.duration_minutes;
            const startH = Math.floor(startMin / 60);
            const startM = startMin % 60;
            const endH = Math.floor(endMin / 60);
            const endM = endMin % 60;

            const timeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
            const statusStr = item.is_completed ? "✅ [BİTTİ]" : "⭕ [BEKLİYOR]";
            return `- ${timeStr}: ${statusStr} ${item.topic?.subject} (${item.topic?.title})`;
        }).join('\n');

        return "Bugünkü Program:\n" + summary;
    } catch (e) {
        return "Program bilgisi alınamadı.";
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { message, sessionDate } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Get session date (default to today)
        const date = sessionDate || new Date().toISOString().split('T')[0];

        // 2. Save User Message to Supabase
        const { error: insertUserError } = await supabase
            .from('messages')
            .insert({
                user_id: user.id,
                content: message,
                role: 'user',
                session_date: date
            });

        if (insertUserError) {
            console.error('Error saving user message:', insertUserError);
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
        }

        // 3. Fetch Program Context (Read-Only)
        const programContext = await getTodaysProgramSummary(user.id, date, supabase);

        // 4. Generate AI Response
        // Using "gemini-1.5-pro" as the engine because "gemini-2.5" URL causes 400 Bad Request.
        // The persona is handled via SYSTEM_INSTRUCTION to be "Gemini 2.5".
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const finalSystemInstruction = SYSTEM_INSTRUCTION + `
        
        \n\n--- MÜHİM BİLGİ: ÖĞRENCİNİN PROGRAMI ---
        ${programContext}
        
        \n\n--- EYLEM KURALLARI ---
        1. Sen programı **GÖREBİLİRSİN** ama **DEĞİŞTİREMEZSİN**.
        2. Eğer öğrenci "şunu ekle", "bugünü sil" derse: "Ben ana koçun olduğum için programına müdahale edemiyorum. Lütfen 'Program' sekmesine giderek Program Asistanı ile görüş, o halledecektir." diyerek nazikçe reddet.
        3. Tavsiye verirken yukarıdaki programa atıfta bulun.
        4. **PROGRAM ANALİZİ İSTENİRSE:** (Örn: "Bugünü özetle", "Programım nasıl?", "Bugün ne var?"):
           - Programı maddeler halinde sayma (Zaten görünüyor). Onun yerine **yorumla**.
           - **Yoğunluk Analizi:** "Bugün yoğun bir gün, toplam X saat çalışman var."
           - **Konu Dağılımı:** "Hem Sayısal (Matematik) hem Sözel (Tarih) birleştirmişsin, bu zihni taze tutar." veya "Sadece Matematik var, beynin yorulabilir, sık ara ver."
           - **Motivasyon:** "Zorlu bir Türev günü, ama halledersen AYT'de +1 net cepte düşün."
           - **Tamamlananlar:** Yanında "✅ [BİTTİ]" yazan dersleri öğrenci tamamlamıştır. Bunlar için tebrik et ("Harikasın, Matematiği bitirmişsin!").
           - **Kalanlar:** Yanında "⭕ [BEKLİYOR]" yazanlara odaklan ("Şimdi sırada Tarih var, haydi masaya!").
        `;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: finalSystemInstruction }],
                },
                {
                    role: "model",
                    parts: [{ text: "Anlaşıldı. Programı görebiliyorum ancak değiştiremem. YKS koçluğu yapacağım ve program değişikliği taleplerini Program Asistanına yönlendireceğim." }],
                },
            ],
            // Token limit removed as requested
        });

        let text = "";
        try {
            const result = await chat.sendMessage(message);
            const response = result.response;
            text = response.text();
        } catch (geminiError) {
            console.error("Gemini API Error:", geminiError);
            return NextResponse.json({ error: 'AI Service Unavailable', details: String(geminiError) }, { status: 503 });
        }

        // 4. Save AI Response to Supabase
        const { error: insertAiError } = await supabase
            .from('messages')
            .insert({
                user_id: user.id,
                content: text,
                role: 'assistant',
                session_date: date
            });

        if (insertAiError) {
            console.error('Error saving AI message:', insertAiError);
        }

        return NextResponse.json({ response: text });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get session date from query params (default to today)
        const { searchParams } = new URL(req.url);
        const sessionDate = searchParams.get('sessionDate') || new Date().toISOString().split('T')[0];

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', user.id)
            .eq('session_date', sessionDate)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}