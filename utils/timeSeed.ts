import { daysAgo, toMins } from './timeMath';

export const SEED_HABITS = [
    { id: "h1", name: "Dormir", emoji: "◈", color: "#5c6ac4", startTime: "23:00", endTime: "07:00", createdAt: daysAgo(100) },
    { id: "h2", name: "Ejercicio", emoji: "◈", color: "#c46a2a", startTime: "07:00", endTime: "08:00", createdAt: daysAgo(100) },
    { id: "h3", name: "Trabajo", emoji: "◈", color: "#2a8a6a", startTime: "09:00", endTime: "13:00", createdAt: daysAgo(100) },
];

export function makeSeedEntries(habits: any) {
    const entries: any = {};
    const addM = (t: string, delta: number) => {
        const total = ((toMins(t) + delta) % 1440 + 1440) % 1440;
        return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
    };

    for (let i = 100; i >= 0; i--) {
        const day = daysAgo(i);

        // DORMIR
        {
            let os, oe, skip = false;
            if (i >= 70) {
                os = Math.round(35 + Math.random() * 55);
                oe = Math.round(30 + Math.random() * 55);
                if (Math.random() < 0.15) skip = true;
            } else if (i >= 30) {
                os = Math.round((Math.random() - 0.25) * 45);
                oe = Math.round((Math.random() - 0.25) * 45);
                if (Math.random() < 0.08) skip = true;
            } else {
                os = Math.round((Math.random() - 0.5) * 25);
                oe = Math.round((Math.random() - 0.5) * 25);
                if (Math.random() < 0.04) skip = true;
            }
            if (!skip) entries[`${day}::h1`] = { startTime: addM("23:00", os), endTime: addM("07:00", oe) };
        }

        // EJERCICIO
        {
            let os, oe, skip = false;
            if (i >= 60) {
                os = Math.round((Math.random() - 0.3) * 30);
                oe = Math.round((Math.random() - 0.3) * 30);
                if (Math.random() < 0.10) skip = true;
            } else if (i >= 30) {
                if (Math.random() < 0.75) skip = true;
                os = Math.round((Math.random() - 0.4) * 50);
                oe = Math.round((Math.random() - 0.4) * 50);
            } else {
                os = Math.round((Math.random() - 0.4) * 20);
                oe = Math.round((Math.random() - 0.4) * 20);
                if (Math.random() < 0.05) skip = true;
            }
            if (!skip) entries[`${day}::h2`] = { startTime: addM("07:00", os), endTime: addM("08:00", oe) };
        }

        // TRABAJO
        {
            const dow = new Date(day + "T12:00:00").getDay();
            if (dow === 0 || dow === 6) continue;
            if (Math.random() < 0.06) continue;
            const os = Math.round((Math.random() - 0.3) * 22);
            const oe = Math.round((Math.random() - 0.3) * 22);
            entries[`${day}::h3`] = { startTime: addM("09:00", os), endTime: addM("13:00", oe) };
        }
    }

    return entries;
}
