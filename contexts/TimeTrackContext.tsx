import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { todayStr } from '../utils/timeMath';
import { loadTimeTrackData, saveTimeTrackData } from '../utils/timeStorage';

interface TimeTrackContextType {
    habits: any[];
    entries: Record<string, any>;
    setHabits: (h: any[]) => void;
    setEntries: (e: Record<string, any>) => void;
    persist: (h: any[], e: Record<string, any>) => Promise<void>;
    ready: boolean;
    toast: string | null;
    toast2: (msg: string) => void;

    // Entry modal
    modalHabit: any;
    setModalHabit: (h: any) => void;
    selDay: string;
    setSelDay: (d: string) => void;
    modalSave: (habit: any, startTime: string, endTime: string, notes: string) => void;
    modalDelete: (habit: any) => void;

    // Habit modal
    habitModalOpen: boolean;
    setHabitModalOpen: (v: boolean) => void;
    habitModalTarget: any;
    setHabitModalTarget: (h: any) => void;
    handleHabitSave: (form: { name: string; emoji: string; color: string; startTime: string; endTime: string; weekDays: number[] }) => void;

    // Confirm delete
    confirmDeleteHabit: any;
    setConfirmDeleteHabit: (h: any) => void;
    rmHabit: (id: string) => void;

    // Settings
    settingsModalOpen: boolean;
    setSettingsModalOpen: (v: boolean) => void;
}

const TimeTrackContext = createContext<TimeTrackContextType | null>(null);

export function TimeTrackProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const userId = user?.id ?? '';

    const [habits, setHabits] = useState<any[]>([]);
    const [entries, setEntries] = useState<any>({});
    const [selDay, setSelDay] = useState(todayStr());
    const [modalHabit, setModalHabit] = useState<any>(null);
    const [habitModalOpen, setHabitModalOpen] = useState(false);
    const [habitModalTarget, setHabitModalTarget] = useState<any>(null);
    const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<any>(null);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    const toast2 = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

    const persist = async (h: any[], e: any) => {
        try {
            await saveTimeTrackData({ habits: h, entries: e }, userId);
        } catch {
            // DB-only
        }
    };

    useEffect(() => {
        if (!userId) return;
        let isActive = true;
        (async () => {
            try {
                const d = await loadTimeTrackData(userId);
                if (!isActive) return;
                setHabits(d.habits || []);
                setEntries(d.entries || {});
            } catch {
                if (isActive) toast2("error cargando datos");
            } finally {
                if (isActive) setReady(true);
            }
        })();
        return () => { isActive = false; };
    }, [userId]);

    const modalSave = (habit: any, startTime: string, endTime: string, notes: string) => {
        const key = `${selDay}::${habit.id}`;
        const ne = { ...entries, [key]: { startTime, endTime, notes } };
        setEntries(ne);
        setModalHabit(null);
        toast2(t('app.registered'));
        void persist(habits, ne);
    };

    const modalDelete = (habit: any) => {
        const key = `${selDay}::${habit.id}`;
        const ne = { ...entries }; delete ne[key];
        setEntries(ne);
        setModalHabit(null);
        toast2(t('app.deleted'));
        void persist(habits, ne);
    };

    const handleHabitSave = (form: { name: string; emoji: string; color: string; startTime: string; endTime: string; weekDays: number[] }) => {
        let nh;
        if (habitModalTarget) {
            nh = habits.map(h => h.id === habitModalTarget.id ? { ...h, ...form } : h);
        } else {
            nh = [...habits, { ...form, id: `h${Date.now()}`, createdAt: todayStr() }];
        }
        setHabits(nh);
        setHabitModalOpen(false);
        setHabitModalTarget(null);
        toast2(habitModalTarget ? t('app.habitEdited') : t('app.habitCreated'));
        void persist(nh, entries);
    };

    const rmHabit = (id: string) => {
        const nh = habits.filter((h) => h.id !== id);
        const ne = Object.fromEntries(
            Object.entries(entries).filter(([key]) => !key.endsWith(`::${id}`))
        );
        setHabits(nh);
        setEntries(ne);
        setConfirmDeleteHabit(null);
        toast2(t('app.habitDeleted'));
        void persist(nh, ne);
    };

    return (
        <TimeTrackContext.Provider value={{
            habits, entries, setHabits, setEntries, persist, ready, toast, toast2,
            modalHabit, setModalHabit, selDay, setSelDay, modalSave, modalDelete,
            habitModalOpen, setHabitModalOpen, habitModalTarget, setHabitModalTarget, handleHabitSave,
            confirmDeleteHabit, setConfirmDeleteHabit, rmHabit,
            settingsModalOpen, setSettingsModalOpen,
        }}>
            {children}
        </TimeTrackContext.Provider>
    );
}

export function useTimeTrack() {
    const ctx = useContext(TimeTrackContext);
    if (!ctx) throw new Error('useTimeTrack must be used within TimeTrackProvider');
    return ctx;
}
