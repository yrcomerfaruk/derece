
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
                        },
                        teacher: {
                            type: SchemaType.STRING,
                            description: "Optional: Teacher/Channel name (e.g. 'Mert Hoca', 'Eyüp B', 'VIP Fizik')."
                        },
                        resource: {
                            type: SchemaType.STRING,
                            description: "Optional: Book/Resource name (e.g. '345', 'Orijinal', 'Apotemi', 'MEB Kitabı')."
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
                            description: "Optional time reference (e.g., 'sabah', '14:00', '9')."
                        },
                        topicHint: {
                            type: SchemaType.STRING,
                            description: "Optional subject/topic name to identify session (e.g., 'Matematik', 'Fizik')."
                        },
                        startRange: {
                            type: SchemaType.STRING,
                            description: "Optional: Start time for range deletion (e.g. '08:00')."
                        },
                        endRange: {
                            type: SchemaType.STRING,
                            description: "Optional: End time for range deletion (e.g. '11:20')."
                        }
                    },
                    required: ["day"]
                }
            },
            {
                name: "move_study_session",
                description: "Moves (reschedules) an existing study session to a new day and time.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        fromDay: {
                            type: SchemaType.STRING,
                            description: "The current day of the session (e.g., 'Pazartesi')."
                        },
                        topicHint: {
                            type: SchemaType.STRING,
                            description: "Optional: The subject or topic name (e.g. 'Matematik') to identify the session."
                        },
                        fromTime: {
                            type: SchemaType.STRING,
                            description: "The approximate start time of the current session (e.g., '14:00', 'öğleden sonra')."
                        },
                        toDay: {
                            type: SchemaType.STRING,
                            description: "The new day to move the session to."
                        },
                        toStartTime: {
                            type: SchemaType.STRING,
                            description: "The new starting time (HH:MM) for the session."
                        },
                        toEndTime: {
                            type: SchemaType.STRING,
                            description: "The new ending time (HH:MM) for the session."
                        }
                    },
                    required: ["fromDay", "toDay", "toStartTime", "toEndTime"]
                }
            }
        ]
    }
];

export async function executeAddSession(userId: string, args: any, supabase: any) {
    const { day, startTime, endTime, subject, topicName, activityType = 'study', teacher, resource } = args;

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

    // TEACHER & RESOURCE LOGIC
    let teacherId = null;
    let resourceId = null;

    if (teacher) {
        const { data: existingTeachers } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', teacher)
            .limit(1);

        if (existingTeachers && existingTeachers.length > 0) {
            teacherId = existingTeachers[0].id;
        } else {
            const { data: newTeacher } = await supabase
                .from('teachers')
                .insert({ user_id: userId, name: teacher, subject: cleanSubject })
                .select('id')
                .single();
            if (newTeacher) teacherId = newTeacher.id;
        }
    }

    if (resource) {
        const { data: existingResources } = await supabase
            .from('resources')
            .select('id')
            .eq('user_id', userId)
            .ilike('title', resource)
            .limit(1);

        if (existingResources && existingResources.length > 0) {
            resourceId = existingResources[0].id;
        } else {
            const { data: newResource } = await supabase
                .from('resources')
                .insert({ user_id: userId, title: resource, type: 'book', subject: cleanSubject })
                .select('id')
                .single();
            if (newResource) resourceId = newResource.id;
        }
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
        duration_minutes: durationMinutes,
        teacher_id: teacherId,
        resource_id: resourceId
    });

    if (error) {
        console.error("Program item insert error:", error);
        return { success: false, message: "Ders programa eklenirken teknik bir hata oluştu." };
    }

    const extraInfo = [];
    if (teacherId) extraInfo.push(`${teacher} ile`);
    if (resourceId) extraInfo.push(`${resource} kaynağından`);
    const extraStr = extraInfo.length > 0 ? ` (${extraInfo.join(', ')})` : '';

    return {
        success: true,
        message: `${WEEK_DAYS[targetDayIndex]} (${new Date(sessionDateStr).toLocaleDateString('tr-TR')}) günü ${startTime}-${endTime} arasına "${subject} - ${topicName}"${extraStr} başarıyla eklendi.`
    };
}

export async function executeDeleteSession(userId: string, args: any, supabase: any) {
    const { day, topicHint, timeHint, startRange, endRange } = args;

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

    // Parsing helper
    const parseTime = (t: string) => {
        if (!t) return null;
        let [h, m] = t.split(':').map(Number);
        if (isNaN(m)) m = 0;
        return h * 60 + m;
    };

    // Range Deletion Logic
    if (startRange && endRange) {
        const s = parseTime(startRange);
        const e = parseTime(endRange);

        if (s !== null && e !== null) {
            const { data: items } = await supabase
                .from('program_items')
                .select('id, slot_index, duration_minutes')
                .eq('program_id', program.id)
                .eq('session_date', sessionDateStr);

            if (!items || items.length === 0) return { success: false, message: "O gün zaten boş." };

            const toDelete = items.filter((item: any) => {
                const itemStart = item.slot_index;
                const itemEnd = item.slot_index + item.duration_minutes;
                // Delete if overlap
                return (s < itemEnd) && (e > itemStart);
            });

            if (toDelete.length === 0) return { success: false, message: "Belirttiğin aralıkta ders bulamadım." };

            const ids = toDelete.map((i: any) => i.id);
            await supabase.from('program_items').delete().in('id', ids);
            return { success: true, message: `${weekDayName(targetDate.getDay())} gününden ${toDelete.length} adet ders silindi.` };
        }
    }

    // Specific Deletion (Time OR Topic)
    if (topicHint || timeHint) {
        const { data: candidates } = await supabase
            .from('program_items')
            .select(`id, slot_index, topic:topics!inner(subject, title)`)
            .eq('program_id', program.id)
            .eq('session_date', sessionDateStr);

        if (!candidates || candidates.length === 0) return { success: false, message: `O gün için programında ders bulunmuyor.` };

        let itemsToDelete = candidates;

        if (topicHint) {
            const lowerHint = topicHint.toLowerCase();
            itemsToDelete = itemsToDelete.filter((item: any) => {
                const s = item.topic?.subject?.toLowerCase() || '';
                const t = item.topic?.title?.toLowerCase() || '';
                return s.includes(lowerHint) || t.includes(lowerHint);
            });
        }

        if (timeHint) {
            // Flexible time parsing
            const timeNum = parseTime(timeHint);
            if (timeNum !== null) {
                // Determine tolerance. If user said "9", maybe they mean 09:00 - 09:59?
                // Let's match if the start time is within +/- 30 mins OR if it falls within the lesson block.
                itemsToDelete = itemsToDelete.filter((item: any) => {
                    const diff = Math.abs(item.slot_index - timeNum);
                    return diff < 60; // 60 min tolerance for simple time hint
                });
            }
        }

        if (itemsToDelete.length === 0) return { success: false, message: `Eşleşen bir ders bulamadım.` };

        const ids = itemsToDelete.map((i: any) => i.id);
        await supabase.from('program_items').delete().in('id', ids);
        return { success: true, message: `${weekDayName(targetDate.getDay())} gününden ${itemsToDelete.length} adet ders silindi.` };
    }

    return { success: false, message: "Lütfen neyi sileceğimi tam söyle (Konu adı veya saat ver)." };
}

export async function executeMoveSession(userId: string, args: any, supabase: any) {
    const { fromDay, fromTime, topicHint, toDay, toStartTime, toEndTime } = args;

    // 1. Resolve Dates
    const getIstanbulDateStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const todayStr = getIstanbulDateStr();
    const today = new Date(todayStr);
    const days = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
    const currentDayIndex = (today.getDay() + 6) % 7;

    const resolveDate = (dayName: string) => {
        let tDate = new Date(today);
        let nDay = dayName.toLowerCase();

        if (nDay.includes('bugün')) {
            // Check
        } else if (nDay.includes('yarın')) {
            tDate.setDate(today.getDate() + 1);
        } else {
            const foundIndex = days.findIndex(d => nDay.includes(d));
            if (foundIndex !== -1) {
                let diff = foundIndex - currentDayIndex;
                if (diff < 0 && !nDay.includes('geçen')) diff += 7;
                if (nDay.includes('haftaya') || nDay.includes('gelecek')) diff += 7;
                tDate.setDate(today.getDate() + diff);
            } else {
                return null;
            }
        }
        return tDate;
    };

    const sourceDate = resolveDate(fromDay);
    const targetDate = resolveDate(toDay);

    if (!sourceDate || !targetDate) return { success: false, message: "Günleri anlayamadım." };

    const sourceDateStr = sourceDate.toLocaleDateString('en-CA');
    const targetDateStr = targetDate.toLocaleDateString('en-CA');

    // Warn past target
    if (targetDateStr < todayStr) return { success: false, message: "Geçmişe ders taşıyamam." };

    // 2. Find Session to Move
    const { data: program } = await supabase.from('user_programs').select('id').eq('user_id', userId).eq('status', 'active').single();
    if (!program) return { success: false, message: "Program bulunamadı." };

    let query = supabase
        .from('program_items')
        .select(`id, slot_index, duration_minutes, topic:topics!inner(subject, title)`)
        .eq('program_id', program.id)
        .eq('session_date', sourceDateStr);

    const { data: sourceItems } = await query;
    if (!sourceItems || sourceItems.length === 0) return { success: false, message: `${weekDayName(sourceDate.getDay())} günü dersim yok ki?` };

    let itemToMove: any = null;

    // Logic: If topicHint exists, match by name. Else if time exists, match by time.
    if (topicHint) {
        const lowerHint = topicHint.toLowerCase();
        itemToMove = sourceItems.find((candidate: any) => {
            const s = candidate.topic?.subject?.toLowerCase() || '';
            const t = candidate.topic?.title?.toLowerCase() || '';
            return s.includes(lowerHint) || t.includes(lowerHint);
        });
    }

    if (!itemToMove && fromTime) {
        // Flexible time matching
        let searchSlot = -1;
        if (fromTime.includes(':')) {
            const [h, m] = fromTime.split(':').map(Number);
            searchSlot = h * 60 + m;
        } else {
            // Just "8" -> 08:00
            searchSlot = parseInt(fromTime) * 60;
        }

        if (searchSlot !== -1) {
            // Find closest match within 60 mins
            itemToMove = sourceItems.find((i: any) => Math.abs(i.slot_index - searchSlot) < 60);
        }
    }

    if (!itemToMove) {
        // If still nothing, and there is only 1 item total, assume they mean that one?
        // Risky if ambiguous.
        if (sourceItems.length === 1 && !topicHint && !fromTime) {
            itemToMove = sourceItems[0];
        } else {
            return { success: false, message: "Hangi dersi taşıyacağımı bulamadım. Lütfen 'Matematiği' veya 'saat 9'daki dersi' diye belirt." };
        }
    }

    // 3. Check Target Conflict
    const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes, totalMinutes: hours * 60 + minutes };
    };
    const start = parseTime(toStartTime);
    const end = parseTime(toEndTime);

    if (end.totalMinutes <= start.totalMinutes) return { success: false, message: "Yeni saat aralığı geçersiz (Bitiş < Başlangıç)." };

    const newDuration = end.totalMinutes - start.totalMinutes;
    const newSlot = start.totalMinutes;
    const newEndSlot = newSlot + newDuration;

    // Check conflict
    const targetDayIndex = (targetDate.getDay() + 6) % 7;

    const { data: existingItems } = await supabase
        .from('program_items')
        .select('id, slot_index, duration_minutes')
        .eq('program_id', program.id)
        .eq('session_date', targetDateStr);

    if (existingItems) {
        const overlap = existingItems.find((i: any) => {
            if (i.id === itemToMove.id) return false; // Ignore self if moving within same day
            const iEnd = i.slot_index + i.duration_minutes;
            return (newSlot < iEnd) && (newEndSlot > i.slot_index);
        });
        if (overlap) return { success: false, message: `Hedef saatte zaten başka bir ders var.` };
    }

    // 4. Update
    const { error: updateError } = await supabase
        .from('program_items')
        .update({
            session_date: targetDateStr,
            day_index: targetDayIndex,
            slot_index: newSlot,
            duration_minutes: newDuration
        })
        .eq('id', itemToMove.id);

    if (updateError) {
        console.error("Move error:", updateError);
        return { success: false, message: "Ders taşınırken hata oluştu." };
    }

    return {
        success: true,
        message: `"${itemToMove.topic?.subject} - ${itemToMove.topic?.title}" dersi ${weekDayName(targetDate.getDay())} ${toStartTime}-${toEndTime} arasına taşındı.`
    };
}

function weekDayName(dayIndex: number) {
    // dayIndex 0=Sun, 1=Mon...
    const map = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return map[dayIndex];
}
