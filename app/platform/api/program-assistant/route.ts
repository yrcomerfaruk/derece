import { createClient } from '@/utils/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tools, executeAddSession, executeDeleteSession, executeMoveSession } from '@/app/platform/api/utils/program-tools';
import { getProgramAssistantPrompt } from '@/app/platform/api/utils/prompts';

// Initialize Gemini
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

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
        console.error('Error in GET /program-assistant:', error);
        return NextResponse.json({ messages: [] });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { message, chatHistory } = await request.json();

        let { data: activeProgram } = await supabase
            .from('user_programs')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!activeProgram) {
            // Auto-create program for new users
            const { data: newProgram, error: createError } = await supabase
                .from('user_programs')
                .insert({
                    user_id: user.id,
                    status: 'active',
                    start_date: new Date().toISOString(),
                    // Default end date: 1 year from now
                    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
                })
                .select('id')
                .single();

            if (createError || !newProgram) {
                console.error("Program Creation Error:", createError);
                return NextResponse.json({ error: `Failed to create initial program: ${createError?.message || 'Unknown error'}` }, { status: 500 });
            }
            activeProgram = newProgram;
        }

        await supabase.from('program_assistant_messages').insert({
            user_id: user.id,
            program_id: activeProgram.id,
            content: message,
            role: 'user'
        });

        const todayDate = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const systemPrompt = getProgramAssistantPrompt(todayDate);

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
            const toolParts = [];
            for (const call of functionCalls) {
                let toolResult: { message: string; success?: boolean } = { message: "İşlem başarısız." };

                if (call.name === 'add_study_session') {
                    const args = call.args;
                    toolResult = await executeAddSession(user.id, args, supabase);
                } else if (call.name === 'delete_study_session') {
                    const args = call.args;
                    toolResult = await executeDeleteSession(user.id, args, supabase);
                } else if (call.name === 'move_study_session') {
                    const args = call.args;
                    toolResult = await executeMoveSession(user.id, args, supabase);
                }

                toolParts.push({
                    functionResponse: {
                        name: call.name,
                        response: {
                            content: toolResult.message,
                            success: toolResult.success
                        }
                    }
                });
            }

            // Send tool results back to model for final rephrasing
            const finalResult = await chat.sendMessage(toolParts);
            aiText = finalResult.response.text();
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
        console.error('Error in program assistant chat:', error);
        return NextResponse.json({ error: error.message || 'Bir hata oluştu.' }, { status: 500 });
    }
}
