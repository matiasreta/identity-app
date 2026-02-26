const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '') || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
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
    start_time: string;
    end_time: string;
}

function isSupabaseConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
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

function habitsToRows(habits: Habit[]): RemoteHabitRow[] {
    return habits.map((h) => ({
        id: h.id,
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

async function supabaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado.');
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...init,
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    });
    if (!res.ok) {
        let details = '';
        try {
            details = await res.text();
        } catch {
            details = '';
        }
        throw new Error(`Supabase ${res.status}: ${details || 'request failed'}`);
    }
    if (res.status === 204) {
        return undefined as T;
    }
    return res.json() as T;
}

async function fetchRemoteData(): Promise<TimeTrackData> {
    const [habits, entries] = await Promise.all([
        supabaseRequest<RemoteHabitRow[]>(
            `${HABITS_TABLE}?select=id,name,emoji,color,start_time,end_time,created_at&order=created_at.asc`
        ),
        supabaseRequest<RemoteEntryRow[]>(
            `${ENTRIES_TABLE}?select=day,habit_id,start_time,end_time&order=day.asc`
        ),
    ]);
    return fromRemoteRows(habits, entries);
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
    await supabaseRequest(
        `${HABITS_TABLE}?on_conflict=id`,
        {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(rows),
        }
    );
}

async function upsertEntries(rows: RemoteEntryRow[]) {
    if (!rows.length) return;
    await supabaseRequest(
        `${ENTRIES_TABLE}?on_conflict=day,habit_id`,
        {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(rows),
        }
    );
}

async function deleteHabit(id: string) {
    await supabaseRequest(
        `${HABITS_TABLE}?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
    );
}

async function deleteEntry(day: string, habitId: string) {
    await supabaseRequest(
        `${ENTRIES_TABLE}?day=eq.${encodeURIComponent(day)}&habit_id=eq.${encodeURIComponent(habitId)}`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
    );
}

async function syncDelta(prev: TimeTrackData | null, next: TimeTrackData) {
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

    await upsertHabits(habitsToRows(habitsToUpsert));
    await Promise.all(habitsToDelete.map((id) => deleteHabit(id)));
    await upsertEntries(entriesToUpsert);
    await Promise.all(entriesToDelete.map((x) => deleteEntry(x.day, x.habitId)));
}

export async function loadTimeTrackData() {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado.');
    }
    return fetchRemoteData();
}

export async function saveTimeTrackData(d: unknown) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado.');
    }
    const next = normalizeData(d);
    if (!next) {
        throw new Error('Datos inválidos de timetrack.');
    }
    const prev = await fetchRemoteData();
    await syncDelta(prev, next);
}
