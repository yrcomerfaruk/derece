
import { SchemaType } from '@google/generative-ai';

export const WEEK_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Tool Definitions
export const tools = [
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
                            description: "The day of the week (e.g., Pazartesi, Salı, Bugün, Yarın, Haftaya Çarşamba)."
                        },
                        startTime: {
                            type: SchemaType.STRING,
                            description: "Starting time in HH:MM format (e.g., '07:00'). Use 24-hour format."
                        },
                        endTime: {
                            type: SchemaType.STRING,
                            description: "Ending time in HH:MM format (e.g., '08:00'). Use 24-hour format."
                        },
                        subject: {
                            type: SchemaType.STRING,
                            description: "The main subject name (e.g., 'TYT Matematik', 'AYT Fizik', 'Geometri', 'Türkçe'). MUST be a valid YKS subject."
                        },
                        topicName: {
                            type: SchemaType.STRING,
                            description: "The specific topic name (e.g., 'Türev', 'Optik', 'Fiiller', 'Kurtuluş Savaşı')."
                        },
                        activityType: {
                            type: SchemaType.STRING,
                            description: "Type: 'study' (default), 'test' (soru çözümü), 'review' (tekrar)."
                        }
                    },
                    required: ["day", "startTime", "endTime", "subject", "topicName"]
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
                            description: "Optional time reference (e.g., 'sabah', '14:00')."
                        },
                        topicHint: {
                            type: SchemaType.STRING,
                            description: "Optional subject/topic name to identify session (e.g., 'Matematik', 'Fizik')."
                        }
                    },
                    required: ["day"]
                }
            }
        ]
    }
];

export async function executeAddSession(userId: string, args: any, supabase: any) {
    const { day, startTime, endTime, subject, topicName, activityType = 'study' } = args;

    const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes, totalMinutes: hours * 60 + minutes };
    };
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (end.totalMinutes <= start.totalMinutes) return { success: false, message: "Bitiş saati başlangıçtan sonra olmalı." };

    // Get Active Program
    const { data: program } = await supabase.from('user_programs').select('id, start_date').eq('user_id', userId).eq('status', 'active').single();
    if (!program) return { success: false, message: "Aktif bir programın yok. Lütfen önce program oluştur." };

    // Day Logic
    const getIstanbulDateStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const todayStr = getIstanbulDateStr();
    const today = new Date(todayStr); // Local midnight treated as UTC (safe for day math)

    let targetDayIndex = -1;
    let targetDate = new Date(today); // Clone
    const normalizedDay = day.toLowerCase();
    const currentDayIndex = (today.getDay() + 6) % 7; // Monday=0

    if (normalizedDay.includes('bugün')) {
        targetDayIndex = currentDayIndex; targetDate = new Date(today);
    } else if (normalizedDay.includes('yarın')) {
        targetDayIndex = (currentDayIndex + 1) % 7;
        targetDate.setDate(today.getDate() + 1);
    } else {
        const days = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
        const foundIndex = days.findIndex(d => normalizedDay.includes(d));
        if (foundIndex !== -1) {
            targetDayIndex = foundIndex;
            let diff = targetDayIndex - currentDayIndex;
            // Handle "Haftaya Pazartesi" etc. logic checking relative to TODAY (Istanbul)
            if (diff < 0 && !normalizedDay.includes('geçen')) diff += 7; // Coming day
            if (normalizedDay.includes('haftaya') || normalizedDay.includes('gelecek')) diff += 7;
            targetDate.setDate(today.getDate() + diff);
        }
    }

    if (targetDayIndex === -1) return { success: false, message: "Hangi gün olduğunu anlayamadım. Lütfen 'Bugün', 'Yarın' veya gün adı belirt." };

    const sessionDateStr = targetDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
    // Note: sessionDateStr is already YYYY-MM-DD based on our math on 'today'

    // Allow modification of today, but warn for past
    if (sessionDateStr < todayStr) return { success: false, message: "Geçmiş günlere ders ekleyemem." };

    // DYNAMIC TOPIC CREATION (Full AI)

    let topicId = null;

    // 1. Parse Category from Subject (e.g. "AYT Matematik" -> cat: AYT, sub: Matematik)
    let category = 'TYT'; // Default
    let cleanSubject = subject;

    const upperSubject = subject.toUpperCase();
    if (upperSubject.startsWith('AYT')) {
        category = 'AYT';
        cleanSubject = subject.replace(/AYT\s*/i, '').trim();
    } else if (upperSubject.startsWith('TYT')) {
        category = 'TYT';
        cleanSubject = subject.replace(/TYT\s*/i, '').trim();
    } else if (upperSubject.startsWith('YDT') || upperSubject.includes('İNGİLİZCE')) {
        category = 'YDT';
    }

    // 2. Search for existing topic
    // Schema note: 'topics' table uses 'title' column, not 'topic'.
    const { data: existingTopics } = await supabase
        .from('topics')
        .select('id')
        .ilike('subject', cleanSubject)
        .ilike('title', topicName)
        .limit(1);

    if (existingTopics && existingTopics.length > 0) {
        topicId = existingTopics[0].id;
    } else {
        // 3. Create new topic if missing
        const slug = `${category.toLowerCase()}_${cleanSubject.toLowerCase()}_${topicName.toLowerCase()}`
            .replace(/ /g, '_')
            .replace(/[^a-z0-9_]/g, '');

        const { data: newTopic, error: createError } = await supabase
            .from('topics')
            .insert({
                category: category,
                subject: cleanSubject,
                title: topicName, // Using 'title' as per new schema
                slug: slug,
                description: 'AI tarafından oluşturuldu.',
                study_hours: 0,
                test_hours: 0,
                review_hours: 0,
                order_index: 999
            })
            .select('id')
            .single();

        if (createError) {
            console.error("Topic creation error:", createError);
            return { success: false, message: `Konu eklenirken hata: ${createError.message}.` };
        }
        topicId = newTopic.id;
    }

    // CHECK FOR OVERLAPS
    const slotIndex = start.totalMinutes;
    const durationMinutes = end.totalMinutes - start.totalMinutes;
    const endSlotIndex = slotIndex + durationMinutes;

    const { data: existingItems } = await supabase
        .from('program_items')
        .select('slot_index, duration_minutes')
        .eq('program_id', program.id)
        .eq('day_index', targetDayIndex)
        .eq('session_date', sessionDateStr);

    if (existingItems && existingItems.length > 0) {
        const isOverlapping = existingItems.some((item: any) => {
            const itemStart = item.slot_index;
            const itemEnd = item.slot_index + item.duration_minutes;

            // Overlap condition: (StartA < EndB) and (EndA > StartB)
            return (slotIndex < itemEnd) && (endSlotIndex > itemStart);
        });

        if (isOverlapping) {
            return { success: false, message: `Bu saat aralığında (${startTime}-${endTime}) zaten bir dersin var. Lütfen başka bir saat seç.` };
        }
    }

    // Insert Program Item
    const { error } = await supabase.from('program_items').insert({
        program_id: program.id,
        day_index: targetDayIndex,
        slot_index: slotIndex,
        topic_id: topicId,
        session_date: sessionDateStr,
        activity_type: activityType,
        duration_minutes: durationMinutes
    });

    if (error) {
        console.error("Program item insert error:", error);
        return { success: false, message: "Ders programa eklenirken teknik bir hata oluştu." };
    }

    return {
        success: true,
        message: `${WEEK_DAYS[targetDayIndex]} (${new Date(sessionDateStr).toLocaleDateString('tr-TR')}) günü ${startTime}-${endTime} arasına "${subject} - ${topicName}" başarıyla eklendi.`
    };
}

export async function executeDeleteSession(userId: string, args: any, supabase: any) {
    const { day, topicHint } = args;

    const { data: program } = await supabase.from('user_programs').select('id').eq('user_id', userId).eq('status', 'active').single();
    if (!program) return { success: false, message: "Aktif program bulunamadı." };

    // Day Logic
    const getIstanbulDateStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const todayStr = getIstanbulDateStr();
    const today = new Date(todayStr);

    let targetDate = new Date(today);
    const normalizedDay = day.toLowerCase();
    const currentDayIndex = (today.getDay() + 6) % 7;

    if (normalizedDay.includes('bugün')) {
        targetDate = new Date(today);
    } else if (normalizedDay.includes('yarın')) {
        targetDate.setDate(today.getDate() + 1);
    } else {
        const days = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
        const foundIndex = days.findIndex(d => normalizedDay.includes(d));
        if (foundIndex !== -1) {
            let diff = foundIndex - currentDayIndex;
            if (diff < 0 && !normalizedDay.includes('geçen')) diff += 7;
            if (normalizedDay.includes('haftaya') || normalizedDay.includes('gelecek')) diff += 7;
            targetDate.setDate(today.getDate() + diff);
        } else {
            return { success: false, message: "Günü anlayamadım." };
        }
    }

    const sessionDateStr = targetDate.toLocaleDateString('en-CA');

    if (topicHint) {
        // Find items to delete
        const { data: candidates } = await supabase
            .from('program_items')
            .select(`id, topic:topics!inner(subject, title)`)
            .eq('program_id', program.id)
            .eq('session_date', sessionDateStr);

        if (!candidates || candidates.length === 0) return { success: false, message: `O gün için programında ders bulunmuyor.` };

        const lowerHint = topicHint.toLowerCase();
        const itemsToDelete = candidates.filter((item: any) => {
            const s = item.topic?.subject?.toLowerCase() || '';
            const t = item.topic?.title?.toLowerCase() || '';
            return s.includes(lowerHint) || t.includes(lowerHint);
        });

        if (itemsToDelete.length === 0) return { success: false, message: `"${topicHint}" ile eşleşen bir ders bulamadım.` };

        const ids = itemsToDelete.map((i: any) => i.id);
        await supabase.from('program_items').delete().in('id', ids);
        return { success: true, message: `${weekDayName(targetDate.getDay())} gününden ${itemsToDelete.length} adet "${topicHint}" dersi silindi.` };
    }

    // Deleting all for day? Usually risky, let's ask for topic.
    return { success: false, message: "Lütfen silinecek dersi veya konuyu belirt. (Örn: 'Matematik dersini sil')" };
}

function weekDayName(dayIndex: number) {
    // dayIndex 0=Sun, 1=Mon...
    const map = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return map[dayIndex];
}
