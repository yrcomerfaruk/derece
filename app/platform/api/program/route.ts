import { createClient } from '@/utils/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const WEEK_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

import { tools, executeAddSession, executeDeleteSession } from '@/app/platform/api/utils/program-tools';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: activeProgram } = await supabase
            .from('user_programs')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!activeProgram) return NextResponse.json({ messages: [] });

        const { data: messages, error } = await supabase
            .from('program_assistant_messages')
            .select('*')
            .eq('user_id', user.id)
            .eq('program_id', activeProgram.id)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Error fetching messages:', error);
            return NextResponse.json({ messages: [] });
        }

        return NextResponse.json({ messages: messages || [] });
    } catch (error) {
        console.error('Error in GET /program:', error);
        return NextResponse.json({ messages: [] });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { message, chatHistory } = await request.json();

        const { data: activeProgram } = await supabase
            .from('user_programs')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!activeProgram) return NextResponse.json({ error: 'No active program found' }, { status: 404 });

        await supabase.from('program_assistant_messages').insert({
            user_id: user.id,
            program_id: activeProgram.id,
            content: message,
            role: 'user'
        });

        const systemPrompt = `You are a strict YKS (Turkish University Entrance Exam) Program Coach.
        Your goal is to modify their study schedule based on their requests.
        Today's Date: ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
        
        CRITICAL RULES:
        1. ONLY accept subjects and topics that are part of the detailed YKS (TYT/AYT/YDT) curriculum.
           - Valid Subjects: Matematik, Geometri, Fizik, Kimya, Biyoloji, Türkçe, Edebiyat, Tarih, Coğrafya, Felsefe, Din Kültürü, İngilizce.
           - If user asks for something outside YKS (e.g., "Piano", "Coding", "Spanish", "Meditation"), REFUSE politely stating it's not in YKS curriculum.
        2. When adding a session, you MUST define both 'subject' (Ders) and 'topicName' (Konu).
           - If user just says "Türev ekle", infer subject is "AYT Matematik".
           - If user says "Fizik çalışacağım", ask "Hangi fizik konusunu ekleyelim?" or default to "Genel Tekrar" if vague.
        3. Use 'add_study_session' to ADD.
        4. Use 'delete_study_session' to DELETE.
        5. Response Language: Turkish. Be motivating but strict about the curriculum.
        6. **NO PAST DATES:** You CANNOT create or modify programs for past dates. If the user asks for a date that is BEFORE "Today's Date", you MUST refuse. Say "Geçmiş tarihlere program ekleyemem." explicitly. Do not try to guess they meant next year. Use standard year 2026.`;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                ...(chatHistory || []).map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ],
            tools: tools as any
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const functionCalls = response.functionCalls();
        let aiText = response.text();

        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                if (call.name === 'add_study_session') {
                    const args = call.args;
                    const res = await executeAddSession(user.id, args, supabase);
                    aiText = res.message;
                } else if (call.name === 'delete_study_session') {
                    const args = call.args;
                    const res = await executeDeleteSession(user.id, args, supabase);
                    aiText = res.message;
                }
            }
        }

        // SAVE ASSISTANT RESPONSE
        await supabase.from('program_assistant_messages').insert({
            user_id: user.id,
            program_id: activeProgram.id,
            content: aiText,
            role: 'assistant'
        });

        return NextResponse.json({ content: aiText });

    } catch (error: any) {
        console.error('Error in program chat:', error);
        return NextResponse.json({ error: error.message || 'Bir hata oluştu.' }, { status: 500 });
    }
}
