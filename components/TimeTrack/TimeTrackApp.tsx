import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
    calcIndex, calcIndexCurve,
    calcScore,
    dayLabel,
    fmtDur, fmtTime,
    lastNDays,
    todayStr
} from '../../utils/timeMath';
import { makeSeedEntries, SEED_HABITS } from '../../utils/timeSeed';
import { loadTimeTrackData, saveTimeTrackData } from '../../utils/timeStorage';
import { Bar } from './Bar';
import { Curve } from './Curve';
import { DayTimeline } from './DayTimeline';
import { EntryModal } from './EntryModal';
import { ScoreArc } from './ScoreArc';
import { P } from './Theme';

export function TimeTrackApp() {
    const [habits, setHabits] = useState<any[]>([]);
    const [entries, setEntries] = useState<any>({});
    const [view, setView] = useState("hoy");
    const [selDay, setSelDay] = useState(todayStr());
    const [histH, setHistH] = useState<any>(null);
    const [hForm, setHForm] = useState({ name: "", emoji: "◈", color: "#5c6ac4", startTime: "09:00", endTime: "10:00" });
    const [modalHabit, setModalHabit] = useState<any>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        (async () => {
            const d = await loadTimeTrackData();
            if (d?.habits?.length) {
                setHabits(d.habits);
                setEntries(d.entries || {});
            } else {
                const h = SEED_HABITS, e = makeSeedEntries(h);
                setHabits(h);
                setEntries(e);
                await saveTimeTrackData({ habits: h, entries: e });
            }
            setReady(true);
        })();
    }, []);

    const persist = (h: any, e: any) => saveTimeTrackData({ habits: h, entries: e });
    const toast2 = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

    const modalSave = (habit: any, startTime: string, endTime: string) => {
        const key = `${selDay}::${habit.id}`;
        const ne = { ...entries, [key]: { startTime, endTime } };
        setEntries(ne); persist(habits, ne); setModalHabit(null); toast2("registrado");
    };

    const modalDelete = (habit: any) => {
        const key = `${selDay}::${habit.id}`;
        const ne = { ...entries }; delete ne[key];
        setEntries(ne); persist(habits, ne); setModalHabit(null); toast2("eliminado");
    };

    const addHabit = () => {
        if (!hForm.name.trim()) return;
        const nh = [...habits, { ...hForm, id: `h${Date.now()}`, createdAt: todayStr() }];
        setHabits(nh); persist(nh, entries);
        setHForm({ name: "", emoji: "◈", color: "#5c6ac4", startTime: "09:00", endTime: "10:00" });
        toast2("hábito creado");
    };

    const rmHabit = (id: string) => {
        const nh = habits.filter(h => h.id !== id);
        setHabits(nh);
        persist(nh, entries);
    };

    const last7 = lastNDays(7);

    if (!ready) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'Courier', color: '#bbb', fontSize: 13 }}>—</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            {toast && (
                <View style={styles.toast}>
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerDate}>
                            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
                        </Text>
                        <Text style={styles.title}>timetrack</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.headerSubtitle}>registro · sin metas{'\n'}sin rachas</Text>
                    </View>
                </View>

                {/* Nav */}
                <View style={styles.navRow}>
                    {[["hoy", "HOY"], ["indice", "ÍNDICE 100D"], ["configurar", "HÁBITOS"]].map(([id, lbl]) => {
                        const isOn = view === id;
                        return (
                            <TouchableOpacity key={id} style={[styles.navTab, isOn && styles.navTabOn]}
                                onPress={() => { setView(id); setHistH(null); }}>
                                <Text style={[styles.navTabText, isOn && styles.navTabTextOn]}>{lbl}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {view === 'hoy' && (
                    <View>
                        {/* Day Selector */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={{ alignItems: 'center' }}>
                            {last7.map(day => {
                                const d = new Date(day + "T12:00:00");
                                const isT = day === todayStr(), isSel = day === selDay;
                                return (
                                    <TouchableOpacity key={day} style={[styles.dayPill, isSel && styles.dayPillOn]}
                                        onPress={() => { setSelDay(day); setModalHabit(null); }}>
                                        <Text style={[styles.dayPillSub, isSel && styles.dayPillTextOn]}>
                                            {isT ? "hoy" : ["do", "lu", "ma", "mi", "ju", "vi", "sa"][d.getDay()]}
                                        </Text>
                                        <Text style={[styles.dayPillVal, isSel && styles.dayPillTextOn]}>{d.getDate()}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Text style={styles.dayLabel}>{dayLabel(selDay)}</Text>

                        {habits.length ? (
                            <DayTimeline
                                habits={habits}
                                entries={entries}
                                selDay={selDay}
                                onPressBlock={(habit) => setModalHabit(habit)}
                            />
                        ) : (
                            <Text style={styles.emptyText}>creá un hábito en la pestaña hábitos</Text>
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
                        {!histH ? (
                            <View>
                                <Text style={styles.philosophyBlock}>
                                    El índice es un espejo. Refleja cómo sos con tus hábitos en los últimos 100 días reales — sin metas, sin presión.
                                </Text>

                                <View style={{ gap: 14 }}>
                                    {habits.map((habit, idx) => {
                                        const index = calcIndex(habit, entries);
                                        const curve = calcIndexCurve(habit, entries, 60);
                                        const recent = curve.filter(p => p.index !== null).slice(-14);
                                        const trend = recent.length >= 2 ? recent[recent.length - 1].index - recent[0].index : null;
                                        const daysData = lastNDays(100).filter(d => d >= habit.createdAt && d <= todayStr()).length;

                                        return (
                                            <TouchableOpacity key={habit.id} activeOpacity={0.8} style={[styles.indexCard, { borderLeftColor: habit.color, borderLeftWidth: 3 }]} onPress={() => setHistH(habit)}>
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                                            <Text style={{ color: habit.color, fontSize: 13 }}>{habit.emoji}</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '500', color: P.ink }}>{habit.name}</Text>
                                                            {trend !== null && (
                                                                <Text style={{ fontSize: 9, letterSpacing: 0.5, color: trend > 1 ? "#2a7a5a" : trend < -1 ? P.mute : P.faint, marginLeft: 'auto' }}>
                                                                    {trend > 1 ? "↗" : trend < -1 ? "↘" : "→"} {Math.abs(trend).toFixed(1)}% · 14d
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <Text style={{ fontSize: 10, color: P.sub }}>
                                                            {fmtTime(habit.startTime)} → {fmtTime(habit.endTime)} · {fmtDur(habit.startTime, habit.endTime)} · {daysData} días de datos
                                                        </Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={{ fontSize: 36, color: index === null ? P.faint : habit.color, fontWeight: '400' }}>
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
                                <TouchableOpacity onPress={() => setHistH(null)} style={{ marginBottom: 22 }}>
                                    <Text style={{ color: P.mute, fontSize: 11, letterSpacing: 1 }}>← volver</Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: P.border }}>
                                    <Text style={{ color: histH.color, fontSize: 22 }}>{histH.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 28, color: P.ink, marginBottom: 4 }}>{histH.name}</Text>
                                        <Text style={{ fontSize: 10, color: P.sub }}>
                                            objetivo · {fmtTime(histH.startTime)} → {fmtTime(histH.endTime)}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {(() => {
                                            const ix = calcIndex(histH, entries);
                                            return (
                                                <>
                                                    <Text style={{ fontSize: 44, color: ix === null ? P.faint : histH.color, fontWeight: '300' }}>
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
                        <View style={styles.configBox}>
                            <Text style={styles.configHeader}>NUEVO HÁBITO</Text>

                            <Text style={styles.lbl}>NOMBRE</Text>
                            <TextInput style={[styles.ti, { marginBottom: 12 }]} placeholder="ej: meditación"
                                value={hForm.name} onChangeText={t => setHForm(f => ({ ...f, name: t }))} />

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.lbl}>INICIO OBJETIVO</Text>
                                    <TextInput style={styles.ti} value={hForm.startTime}
                                        onChangeText={t => setHForm(f => ({ ...f, startTime: t }))} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.lbl}>FIN OBJETIVO</Text>
                                    <TextInput style={styles.ti} value={hForm.endTime}
                                        onChangeText={t => setHForm(f => ({ ...f, endTime: t }))} />
                                </View>
                                <View style={{ width: 48 }}>
                                    <Text style={styles.lbl}>COLOR</Text>
                                    <TextInput style={[styles.ti, { padding: 4 }]} value={hForm.color}
                                        onChangeText={t => setHForm(f => ({ ...f, color: t }))} />
                                </View>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                                <TouchableOpacity style={styles.bp} onPress={addHabit}>
                                    <Text style={styles.bpText}>+ crear hábito</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.configHeader}>HÁBITOS ACTIVOS</Text>
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
                                    <TouchableOpacity style={styles.delBtn} onPress={() => rmHabit(h.id)}>
                                        <Text style={styles.delBtnText}>eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: P.bg,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 36,
        paddingBottom: 80,
        maxWidth: 620,
        alignSelf: 'center',
        width: '100%'
    },
    toast: {
        position: 'absolute',
        top: 50,
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
    header: {
        borderBottomWidth: 2,
        borderBottomColor: P.ink,
        paddingBottom: 16,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    headerDate: {
        fontSize: 9,
        color: P.mute,
        letterSpacing: 2,
        marginBottom: 6
    },
    title: {
        fontSize: 38,
        color: P.ink,
        letterSpacing: 0.4
    },
    headerSubtitle: {
        fontSize: 9,
        color: P.mute,
        letterSpacing: 1.4,
        textAlign: 'right'
    },
    navRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: P.border,
        marginBottom: 28,
    },
    navTab: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    navTabOn: {
        borderBottomColor: P.ink
    },
    navTabText: {
        fontSize: 10,
        letterSpacing: 1.2,
        color: P.mute
    },
    navTabTextOn: {
        color: P.ink,
        fontWeight: '500'
    },
    dayScroll: {
        marginBottom: 22,
        paddingBottom: 2
    },
    dayPill: {
        borderWidth: 1,
        borderColor: P.border,
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 6,
        minWidth: 44,
        alignItems: 'center',
        marginRight: 6
    },
    dayPillOn: {
        backgroundColor: P.ink,
        borderColor: P.ink
    },
    dayPillSub: {
        fontSize: 8,
        marginBottom: 2,
        opacity: 0.7,
        color: P.sub
    },
    dayPillVal: {
        fontSize: 15,
        color: P.sub
    },
    dayPillTextOn: {
        color: P.bg
    },
    dayLabel: {
        fontSize: 17,
        fontStyle: 'italic',
        color: P.sub,
        marginBottom: 20
    },
    lbl: {
        fontSize: 9,
        color: P.sub,
        letterSpacing: 1.4,
        marginBottom: 5
    },
    ti: {
        backgroundColor: P.bg,
        borderWidth: 1,
        borderColor: P.border,
        color: P.ink,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        fontSize: 13,
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
        fontStyle: 'italic',
        fontSize: 16,
        color: P.sub,
        marginBottom: 24,
        lineHeight: 24
    },
    indexCard: {
        backgroundColor: P.surface,
        borderWidth: 1,
        borderColor: P.border,
        borderRadius: 10,
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
    configBox: {
        backgroundColor: P.surface,
        borderWidth: 1,
        borderColor: P.border,
        borderRadius: 10,
        padding: 22,
        marginBottom: 28
    },
    configHeader: {
        fontSize: 9,
        color: P.mute,
        letterSpacing: 1.5,
        marginBottom: 18
    }
});
