import { supabase } from './supabase';

const HABITS_TABLE = 'timetrack_habits';
const ENTRIES_TABLE = 'timetrack_entries';

interface Habit {
    id: string;
    name: string;
    emoji: string;
    color: string;
    startTime: string;
    endTime: string;
    createdAt: string;
}

interface Entry {
    startTime: string;
    endTime: string;
}

interface TimeTrackData {
    habits: Habit[];
    entries: Record<string, Entry>;
}

interface RemoteHabitRow {
    id: string;
    user_id: string;
    name: string;
    emoji: string;
    color: string;
    start_time: string;
    end_time: string;
    created_at: string;
}

interface RemoteEntryRow {
    day: string;
    habit_id: string;
    user_id: string;
    start_time: string;
    end_time: string;
}

function isSupabaseConfigured() {
    return true; // Asumimos que supabase está configurado por variables de entorno
}

function normalizeData(raw: unknown): TimeTrackData | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as { habits?: unknown; entries?: unknown };
    const habits = Array.isArray(obj.habits) ? obj.habits.filter((h) => {
        if (!h || typeof h !== 'object') return false;
        const x = h as Habit;
        return typeof x.id === 'string' &&
            typeof x.name === 'string' &&
            typeof x.emoji === 'string' &&
            typeof x.color === 'string' &&
            typeof x.startTime === 'string' &&
            typeof x.endTime === 'string' &&
            typeof x.createdAt === 'string';
    }) as Habit[] : [];
    const entries: Record<string, Entry> = {};
    if (obj.entries && typeof obj.entries === 'object') {
        for (const [k, v] of Object.entries(obj.entries as Record<string, unknown>)) {
            if (!v || typeof v !== 'object') continue;
            const x = v as Entry;
            if (typeof x.startTime === 'string' && typeof x.endTime === 'string') {
                entries[k] = { startTime: x.startTime, endTime: x.endTime };
            }
        }
    }
    return { habits, entries };
}

function parseEntryKey(key: string): { day: string; habitId: string } | null {
    const idx = key.indexOf('::');
    if (idx <= 0 || idx === key.length - 2) return null;
    const day = key.slice(0, idx);
    const habitId = key.slice(idx + 2);
    if (!day || !habitId) return null;
    return { day, habitId };
}

function habitsToRows(habits: Habit[], userId: string): RemoteHabitRow[] {
    return habits.map((h) => ({
        id: h.id,
        user_id: userId,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        start_time: h.startTime,
        end_time: h.endTime,
        created_at: h.createdAt,
    }));
}

function fromRemoteRows(habits: RemoteHabitRow[], entries: RemoteEntryRow[]): TimeTrackData {
    const localHabits: Habit[] = habits.map((h) => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        startTime: h.start_time,
        endTime: h.end_time,
        createdAt: h.created_at,
    }));
    const localEntries: Record<string, Entry> = {};
    for (const e of entries) {
        localEntries[`${e.day}::${e.habit_id}`] = {
            startTime: e.start_time,
            endTime: e.end_time,
        };
    }
    return { habits: localHabits, entries: localEntries };
}

async function fetchRemoteData(): Promise<TimeTrackData> {
    const [{ data: habits, error: habitsError }, { data: entries, error: entriesError }] = await Promise.all([
        supabase.from(HABITS_TABLE).select('id,name,emoji,color,start_time,end_time,created_at').order('created_at', { ascending: true }),
        supabase.from(ENTRIES_TABLE).select('day,habit_id,start_time,end_time').order('day', { ascending: true }),
    ]);

    if (habitsError) throw new Error(`Error fetching habits: ${habitsError.message}`);
    if (entriesError) throw new Error(`Error fetching entries: ${entriesError.message}`);

    return fromRemoteRows((habits as RemoteHabitRow[]) || [], (entries as RemoteEntryRow[]) || []);
}

function habitEquals(a: Habit, b: Habit) {
    return a.name === b.name &&
        a.emoji === b.emoji &&
        a.color === b.color &&
        a.startTime === b.startTime &&
        a.endTime === b.endTime &&
        a.createdAt === b.createdAt;
}

function entryEquals(a: Entry, b: Entry) {
    return a.startTime === b.startTime && a.endTime === b.endTime;
}

async function upsertHabits(rows: RemoteHabitRow[]) {
    if (!rows.length) return;
    const { error } = await supabase.from(HABITS_TABLE).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Error upserting habits: ${error.message}`);
}

async function upsertEntries(rows: RemoteEntryRow[]) {
    if (!rows.length) return;
    const { error } = await supabase.from(ENTRIES_TABLE).upsert(rows, { onConflict: 'day,habit_id' });
    if (error) throw new Error(`Error upserting entries: ${error.message}`);
}

async function deleteHabit(id: string) {
    const { error } = await supabase.from(HABITS_TABLE).delete().eq('id', id);
    if (error) throw new Error(`Error deleting habit: ${error.message}`);
}

async function deleteEntry(day: string, habitId: string) {
    const { error } = await supabase.from(ENTRIES_TABLE).delete().eq('day', day).eq('habit_id', habitId);
    if (error) throw new Error(`Error deleting entry: ${error.message}`);
}

async function syncDelta(prev: TimeTrackData | null, next: TimeTrackData, userId: string) {
    if (!isSupabaseConfigured()) return;

    const prevHabits = new Map((prev?.habits || []).map((h) => [h.id, h]));
    const nextHabits = new Map(next.habits.map((h) => [h.id, h]));
    const habitsToUpsert = next.habits
        .filter((h) => {
            const p = prevHabits.get(h.id);
            return !p || !habitEquals(p, h);
        });
    const habitsToDelete = (prev?.habits || [])
        .filter((h) => !nextHabits.has(h.id))
        .map((h) => h.id);

    const prevEntries = prev?.entries || {};
    const nextEntries = next.entries || {};
    const entriesToUpsert: RemoteEntryRow[] = [];
    for (const [key, entry] of Object.entries(nextEntries)) {
        const prevEntry = prevEntries[key];
        if (!prevEntry || !entryEquals(prevEntry, entry)) {
            const parsed = parseEntryKey(key);
            if (!parsed) continue;
            if (!nextHabits.has(parsed.habitId)) continue;
            entriesToUpsert.push({
                day: parsed.day,
                habit_id: parsed.habitId,
                user_id: userId,
                start_time: entry.startTime,
                end_time: entry.endTime,
            });
        }
    }

    const entriesToDelete: Array<{ day: string; habitId: string }> = [];
    for (const key of Object.keys(prevEntries)) {
        const parsed = parseEntryKey(key);
        if (!parsed) continue;
        const stillPresentInNext = key in nextEntries;
        const habitStillExists = nextHabits.has(parsed.habitId);
        if (stillPresentInNext && habitStillExists) continue;
        entriesToDelete.push(parsed);
    }

    await upsertHabits(habitsToRows(habitsToUpsert, userId));
    await Promise.all(habitsToDelete.map((id) => deleteHabit(id)));
    await upsertEntries(entriesToUpsert);
    await Promise.all(entriesToDelete.map((x) => deleteEntry(x.day, x.habitId)));
}

export async function loadTimeTrackData(_userId: string) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado.');
    }
    // RLS filters by user_id automatically using auth.uid()
    return fetchRemoteData();
}

export async function saveTimeTrackData(d: unknown, userId: string) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado.');
    }
    const next = normalizeData(d);
    if (!next) {
        throw new Error('Datos inválidos de timetrack.');
    }
    const prev = await fetchRemoteData();
    await syncDelta(prev, next, userId);
}
