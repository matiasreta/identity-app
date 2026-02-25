export function toMins(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

export function toInterval(start: string, end: string) {
    let s = toMins(start), e = toMins(end);
    if (e <= s) e += 1440;
    return { s, e, dur: e - s };
}

export function iOverlap(a: any, b: any) {
    return Math.max(0, Math.min(a.e, b.e) - Math.max(a.s, b.s));
}

export function calcScore(habit: any, entry: any) {
    const obj = toInterval(habit.startTime, habit.endTime);
    const rec = toInterval(entry.startTime, entry.endTime);
    if (obj.dur === 0) return 0;
    const best = Math.max(
        iOverlap(obj, rec),
        iOverlap(obj, { s: rec.s + 1440, e: rec.e + 1440 }),
        iOverlap(obj, { s: rec.s - 1440, e: rec.e - 1440 }),
    );
    return Math.min(100, Math.round((best / obj.dur) * 100));
}

export function todayStr() {
    return new Date().toISOString().split("T")[0];
}

export function lastNDays(n: number) {
    return Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (n - 1 - i));
        return d.toISOString().split("T")[0];
    });
}

export function calcIndex(habit: any, entries: any, windowDays = 100) {
    const days = lastNDays(windowDays);
    const today = todayStr();
    let sum = 0, count = 0;
    for (const day of days) {
        if (day < habit.createdAt) continue;
        if (day > today) continue;
        const entry = entries[`${day}::${habit.id}`];
        sum += entry ? calcScore(habit, entry) : 0;
        count++;
    }
    if (count === 0) return null;
    return Math.round((sum / count) * 10) / 10;
}

export function calcIndexCurve(habit: any, entries: any, points = 60) {
    const result = [];
    for (let i = points - 1; i >= 0; i--) {
        const anchor = new Date();
        anchor.setDate(anchor.getDate() - i);
        const anchorStr = anchor.toISOString().split("T")[0];
        let sum = 0, count = 0;
        for (let j = 99; j >= 0; j--) {
            const d = new Date(anchor);
            d.setDate(d.getDate() - j);
            const day = d.toISOString().split("T")[0];
            if (day < habit.createdAt || day > anchorStr) continue;
            const entry = entries[`${day}::${habit.id}`];
            sum += entry ? calcScore(habit, entry) : 0;
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
    return d.toISOString().split("T")[0];
}
