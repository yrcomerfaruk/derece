import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('Creating empty program for user:', user.id);

        // 1. Archive old active programs
        await supabase
            .from('user_programs')
            .update({ status: 'archived' })
            .eq('user_id', user.id)
            .eq('status', 'active');

        // 2. Create New Empty Program
        const today = new Date();
        const startDate = new Date(today);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 6); // 7 days total

        const { data: program, error: progError } = await supabase
            .from('user_programs')
            .insert({
                user_id: user.id,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active'
            })
            .select()
            .single();

        if (progError) throw new Error('Program oluşturulamadı: ' + progError.message);

        return NextResponse.json({ success: true, programId: program.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
