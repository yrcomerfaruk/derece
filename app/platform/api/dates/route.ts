
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get distinct session dates for the user
        const { data, error } = await supabase
            .from('messages')
            .select('session_date')
            .eq('user_id', user.id)
            .order('session_date', { ascending: false });

        if (error) {
            throw error;
        }

        // Get unique dates
        const uniqueDates = [...new Set(data?.map(m => m.session_date) || [])];

        return NextResponse.json({ dates: uniqueDates });
    } catch (error) {
        console.error('Error fetching session dates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
