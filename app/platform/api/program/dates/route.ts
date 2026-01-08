
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Calculate Monday of the week
    const day = targetDate.getDay(); // 0=Sun, 1=Mon
    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(targetDate);
    monday.setDate(diff);

    const weekDates = [];
    const weekDayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);

        weekDates.push({
            day: weekDayNames[i],
            date: d.toISOString().slice(0, 10), // YYYY-MM-DD
            fullDate: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        });
    }

    return NextResponse.json({ dates: weekDates });
}
