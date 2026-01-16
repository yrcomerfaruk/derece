import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getReportPrompt } from '@/app/platform/api/utils/prompts';

// Initialize Gemini
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: activeProgram } = await supabase
            .from('user_programs')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!activeProgram) {
            return NextResponse.json({
                total: 0,
                completed: 0,
                progress: 0,
                activeSubjects: 0,
                remaining: 0,
                analysis: "Henüz bir çalışma programın bulunmuyor. Bir program oluşturarak başarı yolculuğuna başlayabilirsin."
            });
        }

        let query = supabase
            .from('program_items')
            .select(`
                id, is_completed, activity_type, session_date,
                topic:topics (subject, title)
            `)
            .eq('program_id', activeProgram.id);

        let weekRangeText = "Genel";

        if (dateParam) {
            // Calculate Week Range (Monday to Sunday)
            const d = new Date(dateParam);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
            const monday = new Date(d.setDate(diff));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const mondayStr = monday.toLocaleDateString('en-CA');
            const sundayStr = sunday.toLocaleDateString('en-CA');

            // 1. CHECK EXISTING REPORT
            const { data: existingReport } = await supabase
                .from('reports')
                .select('*')
                .eq('user_id', user.id)
                .eq('program_id', activeProgram.id)
                .eq('week_start_date', mondayStr)
                .maybeSingle();

            if (existingReport) {
                return NextResponse.json({
                    total: existingReport.total_items,
                    completed: existingReport.completed_items,
                    progress: existingReport.progress_percentage,
                    activeSubjects: existingReport.active_subjects,
                    remaining: existingReport.remaining_items,
                    analysis: existingReport.analysis
                });
            }

            query = query.gte('session_date', mondayStr).lte('session_date', sundayStr);
            weekRangeText = `${monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${sunday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`;
        }

        const { data: items, error } = await query;

        if (error) throw error;

        const total = items.length;
        const completed = items.filter(i => i.is_completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const remaining = total - completed;

        // Count active subjects (distinct)
        const subjects = new Set();
        items.forEach((item: any) => {
            if (item.topic?.subject) {
                subjects.add(item.topic.subject);
            }
        });
        const activeSubjects = subjects.size;



        // Generate AI Analysis
        let analysis = "";
        try {
            const prompt = getReportPrompt(weekRangeText, total, completed, progress, activeSubjects, remaining);

            const result = await model.generateContent(prompt);
            analysis = result.response.text();
        } catch (aiError) {
            console.error('AI Generation Failed:', aiError);
            analysis = progress < 20
                ? "Bu hafta biraz durgun geçmiş gibi görünüyor. Önümüzdeki hafta daha sıkı bir tempoyla telafi edebiliriz."
                : "Haftalık performansın gayet iyi. Bu istikrarı koruyarak devam edelim.";
        }

        // SAVE REPORT TO DB if viewing a specific week
        if (dateParam) {
            const d = new Date(dateParam);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const mondayStr = monday.toLocaleDateString('en-CA');

            await supabase.from('reports').insert({
                user_id: user.id,
                program_id: activeProgram.id,
                week_start_date: mondayStr,
                total_items: total,
                completed_items: completed,
                progress_percentage: progress,
                active_subjects: activeSubjects,
                remaining_items: remaining,
                analysis: analysis
            });
        }

        return NextResponse.json({
            total,
            completed,
            progress,
            activeSubjects,
            remaining,
            analysis
        });

    } catch (error: any) {
        console.error('Error fetching report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
