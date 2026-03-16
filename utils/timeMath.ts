export function toMins(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function toInterval(start: string, end: string) {
    let s = toMins(start), e = toMins(end);
    if (e <= s) e += 1440;
    return { s, e, dur: e - s };
}

export function todayStr() {
    return localDateStr(new Date());
}

export function lastNDays(n: number) {
    const now = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (n - 1 - i));
        return localDateStr(d);
    });
}

export function centeredNDays(n: number, pastOffset?: number) {
    const now = new Date();
    const offset = pastOffset ?? Math.floor(n / 2);
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() + (i - offset));
        return localDateStr(d);
    });
}

export function getHabitStartDate(habit: any, entries: any): string {
    if (habit.createdAt) return habit.createdAt;
    let earliest = "9999-99-99";
    for (const key in entries) {
        if (key.endsWith(`::${habit.id}`)) {
            const day = key.split("::")[0];
            if (day < earliest) earliest = day;
        }
    }
    return earliest === "9999-99-99" ? todayStr() : earliest;
}

function dayOfWeek(dateStr: string): number {
    return new Date(dateStr + "T12:00:00").getDay();
}

function isHabitDay(habit: any, dateStr: string): boolean {
    const wd: number[] | undefined = habit.weekDays;
    if (!wd || wd.length === 0 || wd.length === 7) return true;
    return wd.includes(dayOfWeek(dateStr));
}

export function calcIndex(habit: any, entries: any, windowDays = 100) {
    const days = lastNDays(windowDays);
    const today = todayStr();
    const startDate = getHabitStartDate(habit, entries);
    let sum = 0, count = 0;
    for (const day of days) {
        if (day > today) continue;
        if (day < startDate) continue;
        if (!isHabitDay(habit, day)) continue;
        const entry = entries[`${day}::${habit.id}`];
        sum += entry ? 100 : 0;
        count++;
    }
    if (count === 0) return null;
    return Math.round((sum / count) * 10) / 10;
}

export function calcIndexCurve(habit: any, entries: any, points = 60) {
    const result = [];
    const now = new Date();
    const startDate = getHabitStartDate(habit, entries);
    for (let i = points - 1; i >= 0; i--) {
        const anchor = new Date(now);
        anchor.setDate(now.getDate() - i);
        const anchorStr = localDateStr(anchor);
        let sum = 0, count = 0;
        for (let j = 99; j >= 0; j--) {
            const d = new Date(anchor);
            d.setDate(d.getDate() - j);
            const day = localDateStr(d);
            if (day < startDate) continue;
            if (!isHabitDay(habit, day)) continue;
            const entry = entries[`${day}::${habit.id}`];
            sum += entry ? 100 : 0;
            count++;
        }
        result.push({ day: anchorStr, index: count > 0 ? Math.round((sum / count) * 10) / 10 : null });
    }
    return result;
}

export function fmtDur(start: string, end: string) {
    const { dur } = toInterval(start, end);
    const h = Math.floor(dur / 60), m = dur % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function fmtTime(t: string) {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
}

export function dayLabel(dateStr: string) {
    return new Date(dateStr + "T12:00:00")
        .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

export function daysAgo(n: number) {
    const d = new Date(); d.setDate(d.getDate() - n);
    return localDateStr(d);
}

export function calcAvgDuration(habit: any, entries: any, windowDays = 100): number | null {
    const days = lastNDays(windowDays);
    let sum = 0, count = 0;
    for (const day of days) {
        const entry = entries[`${day}::${habit.id}`];
        if (!entry) continue;
        sum += entry.duration ?? toInterval(entry.startTime, entry.endTime).dur;
        count++;
    }
    return count === 0 ? null : Math.round(sum / count);
}

export function calcAvgStartTime(habit: any, entries: any, windowDays = 100): string | null {
    const days = lastNDays(windowDays);
    let sum = 0, count = 0;
    for (const day of days) {
        const entry = entries[`${day}::${habit.id}`];
        if (!entry) continue;
        sum += toMins(entry.startTime);
        count++;
    }
    if (count === 0) return null;
    const avg = Math.round(sum / count);
    return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
}

export function calcAvgEndTime(habit: any, entries: any, windowDays = 100): string | null {
    const days = lastNDays(windowDays);
    let sum = 0, count = 0;
    for (const day of days) {
        const entry = entries[`${day}::${habit.id}`];
        if (!entry) continue;
        sum += toMins(entry.endTime);
        count++;
    }
    if (count === 0) return null;
    const avg = Math.round(sum / count);
    return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
}
