import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    calcIndex, calcIndexCurve,
    calcScore,
    dayLabel,
    fmtDur, fmtTime,
    lastNDays,
    centeredNDays,
    todayStr
} from '../../utils/timeMath';
import { loadTimeTrackData, saveTimeTrackData } from '../../utils/timeStorage';
import { Bar } from './Bar';
import { ConfirmModal } from './ConfirmModal';
import { Curve } from './Curve';
import { DayTimeline } from './DayTimeline';
import { EntryModal } from './EntryModal';
import { HabitModal } from './HabitModal';
import { ScoreArc } from './ScoreArc';
import { P } from './Theme';

export function TimeTrackApp() {
    const insets = useSafeAreaInsets();
    const [habits, setHabits] = useState<any[]>([]);
    const [entries, setEntries] = useState<any>({});
    const [view, setView] = useState("hoy");
    const [selDay, setSelDay] = useState(todayStr());
    const [histH, setHistH] = useState<any>(null);
    const [modalHabit, setModalHabit] = useState<any>(null);
    const [habitModalOpen, setHabitModalOpen] = useState(false);
    const [habitModalTarget, setHabitModalTarget] = useState<any>(null);
    const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<any>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    const toast2 = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

    const persist = async (h: any, e: any) => {
        try {
            await saveTimeTrackData({ habits: h, entries: e });
        } catch {
            // App is DB-only now; we keep UI feedback focused on user actions.
        }
    };

    useEffect(() => {
        let isActive = true;
        (async () => {
            try {
                const d = await loadTimeTrackData();
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
    }, []);

    const modalSave = (habit: any, startTime: string, endTime: string) => {
        const key = `${selDay}::${habit.id}`;
        const ne = { ...entries, [key]: { startTime, endTime } };
        setEntries(ne);
        setModalHabit(null);
        toast2("registrado");
        void persist(habits, ne);
    };

    const modalDelete = (habit: any) => {
        const key = `${selDay}::${habit.id}`;
        const ne = { ...entries }; delete ne[key];
        setEntries(ne);
        setModalHabit(null);
        toast2("eliminado");
        void persist(habits, ne);
    };

    const handleHabitSave = (form: { name: string; emoji: string; color: string; startTime: string; endTime: string }) => {
        let nh;
        if (habitModalTarget) {
            nh = habits.map(h => h.id === habitModalTarget.id ? { ...h, ...form } : h);
        } else {
            nh = [...habits, { ...form, id: `h${Date.now()}`, createdAt: todayStr() }];
        }
        setHabits(nh);
        setHabitModalOpen(false);
        setHabitModalTarget(null);
        toast2(habitModalTarget ? "hábito editado" : "hábito creado");
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
        toast2("hábito eliminado");
        void persist(nh, ne);
    };

    const weekDays = centeredNDays(7);
    const navTabs: { id: 'hoy' | 'indice' | 'configurar'; label: string }[] = [
        { id: 'hoy', label: 'Hoy' },
        { id: 'indice', label: '100D' },
        { id: 'configurar', label: 'Nuevo' },
    ];

    if (!ready) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'CormorantGaramond_400Regular', color: P.faint, fontSize: 13 }}>—</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            {toast && (
                <View style={[styles.toast, { top: insets.top + 50 }]}>
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            )}

            {view === 'hoy' && (
                <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20, maxWidth: 620, alignSelf: 'center', width: '100%', backgroundColor: P.bg, zIndex: 10 }}>
                    <View style={[styles.dayScroll, { marginBottom: 10 }]}>
                        {weekDays.map(day => {
                            const d = new Date(day + "T12:00:00");
                            const isSel = day === selDay;
                            return (
                                <TouchableOpacity key={day} style={[styles.dayPill, isSel && styles.dayPillOn]}
                                    onPress={() => { setSelDay(day); setModalHabit(null); }}>
                                    <Text style={[styles.dayPillSub, isSel && styles.dayPillTextOn]}>
                                        {["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][d.getDay()]}
                                    </Text>
                                    <Text style={[styles.dayPillVal, isSel && styles.dayPillValOn]}>{d.getDate()}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: view === 'hoy' ? 10 : insets.top + 14, paddingBottom: insets.bottom + 106 }]}>


                {view === 'hoy' && (
                    <View>
                        {habits.length ? (
                            <DayTimeline
                                habits={habits}
                                entries={entries}
                                selDay={selDay}
                                onPressBlock={(habit) => {
                                    if (selDay === todayStr()) {
                                        setModalHabit(habit);
                                    }
                                }}
                            />
                        ) : (
                            <Text style={styles.emptyText}>creá un hábito en la pestaña Nuevo</Text>
                        )}
                    </View>
                )}

                <EntryModal
                    visible={!!modalHabit}
                    habit={modalHabit}
                    entry={modalHabit ? entries[`${selDay}::${modalHabit.id}`] || null : null}
                    onClose={() => setModalHabit(null)}
                    onSave={modalSave}
                    onDelete={modalDelete}
                />

                {view === 'indice' && (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: P.ink, marginBottom: 20 }}>Índice 100D</Text>
                        {!histH ? (
                            <View>
                                <Text style={styles.philosophyBlock}>
                                    El índice es un espejo. Refleja cómo sos con tus hábitos en los últimos 100 días reales — sin metas, sin presión.
                                </Text>

                                <View style={{ gap: 14 }}>
                                    {habits.map((habit, idx) => {
                                        const index = calcIndex(habit, entries);
                                        const curve = calcIndexCurve(habit, entries, 100);
                                        const recent = curve
                                            .filter((p): p is { day: string; index: number } => typeof p.index === 'number')
                                            .slice(-100);
                                        const trend = recent.length >= 2 ? recent[recent.length - 1].index - recent[recent.length - 2].index : null;
                                        const daysData = lastNDays(100).filter(d => !!entries[`${d}::${habit.id}`]).length;

                                        return (
                                            <TouchableOpacity key={habit.id} activeOpacity={0.8} style={[styles.indexCard, { borderLeftColor: habit.color, borderLeftWidth: 3 }]} onPress={() => setHistH(habit)}>
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                                            <Text style={{ color: habit.color, fontSize: 13 }}>{habit.emoji}</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '500', color: P.ink }}>{habit.name}</Text>
                                                            {trend !== null && (
                                                                <Text style={{
                                                                    fontSize: 10,
                                                                    fontWeight: '600',
                                                                    color: trend > 0 ? "#2a7a5a" : trend < 0 ? "#a63d2f" : P.faint,
                                                                    marginLeft: 'auto',
                                                                    backgroundColor: trend > 0 ? "#2a7a5a15" : trend < 0 ? "#a63d2f15" : P.faint + "15",
                                                                    paddingHorizontal: 6,
                                                                    paddingVertical: 2,
                                                                    borderRadius: 4,
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    {trend > 0 ? "+" : trend < 0 ? "" : ""}{trend.toFixed(1)}%
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <Text style={{ fontSize: 10, color: P.sub }}>
                                                            {fmtTime(habit.startTime)} → {fmtTime(habit.endTime)} · {fmtDur(habit.startTime, habit.endTime)} · {daysData} día{daysData === 1 ? '' : 's'} registrados (100d)
                                                        </Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={{ fontSize: 36, color: index === null ? P.faint : habit.color, fontFamily: 'CormorantGaramond_500Medium' }}>
                                                            {index === null ? "—" : `${index}%`}
                                                        </Text>
                                                        <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1 }}>
                                                            {index === null ? "sin datos" : "índice actual"}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Curve curve={curve} color={habit.color} height={52} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : (
                            <View>
                                <TouchableOpacity onPress={() => setHistH(null)} style={{ marginBottom: 22, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'flex-start', backgroundColor: P.surface, borderRadius: 10, borderWidth: 1, borderColor: P.border }}>
                                    <Text style={{ color: P.ink, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 }}>← volver</Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: P.border }}>
                                    <Text style={{ color: histH.color, fontSize: 22 }}>{histH.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 28, color: P.ink, marginBottom: 4, fontFamily: 'CormorantGaramond_400Regular' }}>{histH.name}</Text>
                                        <Text style={{ fontSize: 10, color: P.sub }}>
                                            objetivo · {fmtTime(histH.startTime)} → {fmtTime(histH.endTime)}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {(() => {
                                            const ix = calcIndex(histH, entries);
                                            return (
                                                <>
                                                    <Text style={{ fontSize: 44, color: ix === null ? P.faint : histH.color, fontFamily: 'CormorantGaramond_500Medium' }}>
                                                        {ix === null ? "—" : `${ix}%`}
                                                    </Text>
                                                    <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1 }}>índice actual</Text>
                                                </>
                                            )
                                        })()}
                                    </View>
                                </View>

                                {/* Curve History Box */}
                                <View style={{ backgroundColor: P.bg, borderWidth: 1, borderColor: P.border, borderRadius: 8, padding: 18, marginBottom: 24 }}>
                                    <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1.4, marginBottom: 14 }}>
                                        EVOLUCIÓN DEL ÍNDICE · ÚLTIMOS 100 DÍAS
                                    </Text>
                                    <Curve curve={calcIndexCurve(histH, entries, 100)} color={histH.color} height={100} />
                                </View>

                                <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1.4, marginBottom: 14 }}>
                                    REGISTROS · ÚLTIMOS 100 DÍAS
                                </Text>
                                <View style={{ gap: 8 }}>
                                    {(() => {
                                        const days = lastNDays(100).filter(d => entries[`${d}::${histH.id}`]).reverse();
                                        if (!days.length) return <Text style={styles.emptyText}>sin registros en los últimos 100 días</Text>;
                                        return days.map(day => {
                                            const entry = entries[`${day}::${histH.id}`];
                                            const score = calcScore(histH, entry);
                                            return (
                                                <View key={day} style={[styles.logItem, { borderLeftColor: histH.color }]}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ fontSize: 13, color: P.mute, fontStyle: 'italic', marginBottom: 3 }}>
                                                            {dayLabel(day)}
                                                        </Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Text style={{ fontSize: 13, color: P.sub }}>{fmtTime(entry.startTime)} → {fmtTime(entry.endTime)}</Text>
                                                            <Text style={{ color: P.mute, marginLeft: 8, fontSize: 11 }}>{fmtDur(entry.startTime, entry.endTime)}</Text>
                                                        </View>
                                                        <Bar habit={histH} entry={entry} />
                                                    </View>
                                                    <ScoreArc value={score} color={histH.color} size={44} />
                                                </View>
                                            );
                                        });
                                    })()}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {view === 'configurar' && (
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: P.ink, marginBottom: 12 }}>Hábitos activos</Text>
                        <View style={{ gap: 8 }}>
                            {habits.map(h => (
                                <View key={h.id} style={[styles.logItem, { borderLeftColor: h.color }]}>
                                    <Text style={{ color: h.color, fontSize: 16 }}>{h.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, color: P.ink, fontWeight: '500', marginBottom: 3 }}>{h.name}</Text>
                                        <Text style={{ fontSize: 10, color: P.sub }}>
                                            {fmtTime(h.startTime)} → {fmtTime(h.endTime)} · {fmtDur(h.startTime, h.endTime)}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity style={[styles.delBtn, { borderColor: P.ink }]} onPress={() => { setHabitModalTarget(h); setHabitModalOpen(true); }}>
                                            <Text style={[styles.delBtnText, { color: P.ink }]}>editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.delBtn} onPress={() => setConfirmDeleteHabit(h)}>
                                            <Text style={styles.delBtnText}>eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                        <View style={{ alignItems: 'flex-end', marginTop: 14 }}>
                            <TouchableOpacity style={styles.bp} onPress={() => { setHabitModalTarget(null); setHabitModalOpen(true); }}>
                                <Text style={styles.bpText}>+ nuevo hábito</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <HabitModal
                    visible={habitModalOpen}
                    habit={habitModalTarget}
                    onSave={handleHabitSave}
                    onClose={() => { setHabitModalOpen(false); setHabitModalTarget(null); }}
                />

                <ConfirmModal
                    visible={!!confirmDeleteHabit}
                    habit={confirmDeleteHabit}
                    onConfirm={() => confirmDeleteHabit && rmHabit(confirmDeleteHabit.id)}
                    onCancel={() => setConfirmDeleteHabit(null)}
                />
            </ScrollView>

            <View pointerEvents="box-none" style={[styles.bottomIslandWrap, { bottom: insets.bottom + 10 }]}>
                <View style={styles.bottomIsland}>
                    {navTabs.map((tab) => {
                        const isOn = view === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                activeOpacity={0.85}
                                style={[styles.bottomIslandTab, isOn && styles.bottomIslandTabOn]}
                                onPress={() => { setView(tab.id); setHistH(null); }}
                            >
                                <Text style={[styles.bottomIslandText, isOn && styles.bottomIslandTextOn]}>{tab.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: P.bg,
    },
    scrollContent: {
        paddingHorizontal: 20,
        maxWidth: 620,
        alignSelf: 'center',
        width: '100%'
    },
    toast: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: P.ink,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        zIndex: 1000,
    },
    toastText: {
        color: P.bg,
        fontSize: 11,
        letterSpacing: 1
    },
    bottomIslandWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    bottomIsland: {
        width: '100%',
        maxWidth: 620,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 6,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: P.border,
        backgroundColor: P.surface,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    bottomIslandTab: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 24,
    },
    bottomIslandTabOn: {
        backgroundColor: P.ink,
    },
    bottomIslandText: {
        fontSize: 12,
        color: P.mute,
        letterSpacing: 0.4,
        fontWeight: '500',
    },
    bottomIslandTextOn: {
        color: P.bg,
    },
    dayScroll: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingBottom: 2
    },
    dayPill: {
        paddingVertical: 10,
        paddingHorizontal: 0,
        borderRadius: 16,
        width: 44,
        alignItems: 'center',
        backgroundColor: "transparent",
    },
    dayPillOn: {
        backgroundColor: P.ink,
    },
    dayPillSub: {
        fontSize: 10,
        marginBottom: 4,
        fontWeight: '500',
        color: P.sub
    },
    dayPillVal: {
        fontSize: 16,
        fontWeight: '600',
        color: P.ink
    },
    dayPillValOn: {
        color: P.bg
    },
    dayPillTextOn: {
        color: P.bg
    },
    dayLabel: {
        fontSize: 17,
        fontFamily: 'CormorantGaramond_400Regular_Italic',
        color: P.sub,
        marginBottom: 20
    },
    delBtn: {
        borderWidth: 1,
        borderColor: P.border,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6
    },
    delBtnText: {
        fontSize: 10,
        color: P.mute
    },
    bp: {
        backgroundColor: P.ink,
        paddingVertical: 9,
        paddingHorizontal: 22,
        borderRadius: 6,
    },
    bpText: {
        color: P.bg,
        fontSize: 10,
        letterSpacing: 1,
        fontWeight: '500'
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 48,
        color: P.faint,
        fontSize: 13,
        fontStyle: 'italic'
    },
    philosophyBlock: {
        fontSize: 16,
        color: P.sub,
        marginBottom: 24,
        lineHeight: 24
    },
    indexCard: {
        backgroundColor: P.surface,
        borderWidth: 1,
        borderColor: P.border,
        paddingVertical: 20,
        paddingHorizontal: 22,
    },
    logItem: {
        backgroundColor: P.surface,
        borderWidth: 1,
        borderColor: P.border,
        borderLeftWidth: 3,
        borderRadius: 7,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    configHeader: {
        fontSize: 9,
        color: P.mute,
        letterSpacing: 1.5,
        marginBottom: 18
    }
});
