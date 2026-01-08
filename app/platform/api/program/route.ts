import { createClient } from '@/utils/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const WEEK_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Tool Definitions
const tools = [
    {
        functionDeclarations: [
            {
                name: "add_study_session",
                description: "Adds a study session to the user's weekly schedule. Use this when the user asks to add a study plan, lesson, or topic to a specific day and time range.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        day: {
                            type: SchemaType.STRING,
                            description: "The day of the week (e.g., Pazartesi, Salı, Bugün, Yarın)."
                        },
                        startTime: {
                            type: SchemaType.STRING,
                            description: "Starting time in HH:MM format (e.g., '07:00'). Use 24-hour format."
                        },
                        endTime: {
                            type: SchemaType.STRING,
                            description: "Ending time in HH:MM format (e.g., '08:00'). Use 24-hour format."
                        },
                        topicName: {
                            type: SchemaType.STRING,
                            description: "The name of the subject or topic."
                        },
                        activityType: {
                            type: SchemaType.STRING,
                            description: "Type: 'study', 'test', 'review'."
                        }
                    },
                    required: ["day", "startTime", "endTime", "topicName"]
                }
            },
            {
                name: "delete_study_session",
                description: "Deletes a specific study session from the schedule.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        day: {
                            type: SchemaType.STRING,
                            description: "The day of the week."
                        },
                        timeHint: {
                            type: SchemaType.STRING,
                            description: "Optional time reference."
                        },
                        topicHint: {
                            type: SchemaType.STRING,
                            description: "Optional subject/topic name to identify session."
                        }
                    },
                    required: ["day"]
                }
            }
        ]
    }
];

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

        const systemPrompt = `You are a Program Assistant for a YKS Student.
        Your goal is to modify their schedule.
        Today's Date: ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
        If user mentions times, convert to HH:MM.
        Use 'add_study_session' to ADD.
        Use 'delete_study_session' to DELETE or REMOVE.
        Response Language: Turkish.`;

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

        await supabase.from('program_assistant_messages').insert({
            user_id: user.id,
            program_id: activeProgram.id,
            content: aiText,
            role: 'assistant'
        });

        return NextResponse.json({ role: 'assistant', content: aiText });

    } catch (error: any) {
        console.error('Program Assistant Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function executeAddSession(userId: string, args: any, supabase: any) {
    const { day, startTime, endTime, topicName, activityType = 'study' } = args;

    const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes, totalMinutes: hours * 60 + minutes };
    };
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (end.totalMinutes <= start.totalMinutes) return { success: false, message: "Bitiş saati başlangıçtan sonra olmalı." };

    const { data: program } = await supabase.from('user_programs').select('id, start_date').eq('user_id', userId).eq('status', 'active').single();
    if (!program) return { success: false, message: "Program bulunamadı." };

    let targetDayIndex = -1;
    let targetDate = new Date();
    const normalizedDay = day.toLowerCase();
    const today = new Date();
    const currentDayIndex = (today.getDay() + 6) % 7;

    if (normalizedDay.includes('bugün')) {
        targetDayIndex = currentDayIndex; targetDate = today;
    } else if (normalizedDay.includes('yarın')) {
        targetDayIndex = (currentDayIndex + 1) % 7; targetDate.setDate(today.getDate() + 1);
    } else {
        const days = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
        const foundIndex = days.findIndex(d => normalizedDay.includes(d));
        if (foundIndex !== -1) {
            targetDayIndex = foundIndex;
            let diff = targetDayIndex - currentDayIndex;
            if (normalizedDay.includes('haftaya') || normalizedDay.includes('gelecek')) diff += 7;
            targetDate.setDate(today.getDate() + diff);
        }
    }

    if (targetDayIndex === -1) return { success: false, message: "Gün anlaşılamadı." };

    const sessionDateStr = targetDate.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (sessionDateStr < todayStr) return { success: false, message: "Geçmişe ders eklenemez." };

    const { data: topics } = await supabase.from('topics').select('id, subject, topic').ilike('topic', `%${topicName}%`).limit(1);
    if (!topics || topics.length === 0) return { success: false, message: `"${topicName}" bulunamadı.` };
    const topicId = topics[0].id;

    const slotIndex = start.totalMinutes;
    const durationMinutes = end.totalMinutes - start.totalMinutes;

    const { error } = await supabase.from('program_items').insert({
        program_id: program.id, day_index: targetDayIndex, slot_index: slotIndex, topic_id: topicId,
        session_date: sessionDateStr, activity_type: activityType, duration_minutes: durationMinutes
    });

    if (error) return { success: false, message: "Veritabanı hatası." };
    return { success: true, message: `${WEEK_DAYS[targetDayIndex]} günü ${startTime}-${endTime} arasına "${topics[0].topic}" eklendi.` };
}

async function executeDeleteSession(userId: string, args: any, supabase: any) {
    const { day, topicHint } = args;

    const { data: program } = await supabase.from('user_programs').select('id').eq('user_id', userId).eq('status', 'active').single();
    if (!program) return { success: false, message: "Program bulunamadı." };

    // Day Logic (Same as Add)
    let targetDayIndex = -1;
    let targetDate = new Date();
    const normalizedDay = day.toLowerCase();
    const today = new Date();
    const currentDayIndex = (today.getDay() + 6) % 7;

    if (normalizedDay.includes('bugün')) {
        targetDayIndex = currentDayIndex; targetDate = today;
    } else if (normalizedDay.includes('yarın')) {
        targetDayIndex = (currentDayIndex + 1) % 7; targetDate.setDate(today.getDate() + 1);
    } else {
        const days = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
        const foundIndex = days.findIndex(d => normalizedDay.includes(d));
        if (foundIndex !== -1) {
            targetDayIndex = foundIndex;
            let diff = targetDayIndex - currentDayIndex;
            if (normalizedDay.includes('haftaya') || normalizedDay.includes('gelecek')) diff += 7;
            targetDate.setDate(today.getDate() + diff);
        }
    }
    if (targetDayIndex === -1) return { success: false, message: "Gün anlaşılamadı." };
    const sessionDateStr = targetDate.toISOString().slice(0, 10);

    if (topicHint) {
        // Find items to delete
        const { data: candidates } = await supabase
            .from('program_items')
            .select(`id, topic:topics!inner(subject, topic)`)
            .eq('program_id', program.id)
            .eq('session_date', sessionDateStr);

        if (!candidates || candidates.length === 0) return { success: false, message: `${day} günü ders bulunamadı.` };

        const lowerHint = topicHint.toLowerCase();
        const itemsToDelete = candidates.filter((item: any) => {
            const s = item.topic?.subject?.toLowerCase() || '';
            const t = item.topic?.topic?.toLowerCase() || '';
            return s.includes(lowerHint) || t.includes(lowerHint);
        });

        if (itemsToDelete.length === 0) return { success: false, message: `"${topicHint}" dersi bulunamadı.` };

        const ids = itemsToDelete.map((i: any) => i.id);
        await supabase.from('program_items').delete().in('id', ids);
        return { success: true, message: `${day} gününden ${itemsToDelete.length} adet "${topicHint}" silindi.` };
    }

    return { success: false, message: "Lütfen silinecek konuyu belirtin." };
}
