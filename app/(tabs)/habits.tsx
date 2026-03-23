import { Bar } from '@/components/TimeTrack/Bar';
import { Curve } from '@/components/TimeTrack/Curve';
import { P } from '@/components/TimeTrack/Theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTimeTrack } from '@/contexts/TimeTrackContext';
import { calcIndex, calcIndexCurve, calcAvgDuration, calcAvgStartTime, calcAvgEndTime, dayLabel, fmtDur, fmtTime, lastNDays } from '@/utils/timeMath';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IndiceScreen() {
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const { habits, entries, ready, setHabitModalOpen, setHabitModalTarget, setConfirmDeleteHabit } = useTimeTrack();
    const [histH, setHistH] = useState<any>(null);

    const { width: winWidth } = useWindowDimensions();
    const indexColumns = winWidth >= 900 ? 3 : winWidth >= 580 ? 2 : 1;
    const isIndexGrid = indexColumns > 1;

    if (!ready) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'CormorantGaramond_400Regular', color: P.faint, fontSize: 13 }}>—</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header fijo */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                {histH ? (
                    <TouchableOpacity onPress={() => setHistH(null)} style={styles.headerBack}>
                        <Text style={styles.headerBackText}>←</Text>
                        <Text style={styles.headerTitle}>{histH.emoji} {histH.name}</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.headerTitle}>{t('index.title')}</Text>
                )}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 16, paddingBottom: 24, maxWidth: isIndexGrid ? 1200 : 620 }]}>
                {!histH ? (
                    <View>
                        {habits.length === 0 ? (
                            <Text style={styles.emptyText}>{t('index.emptyHabits')}</Text>
                        ) : (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                                {habits.map((habit) => {
                                    const index = calcIndex(habit, entries);
                                    const curve = calcIndexCurve(habit, entries, 100);
                                    const recent = curve
                                        .filter((p): p is { day: string; index: number } => typeof p.index === 'number')
                                        .slice(-100);
                                    const trend = recent.length >= 2 ? recent[recent.length - 1].index - recent[recent.length - 2].index : null;
                                    const daysData = lastNDays(100).filter(d => !!entries[`${d}::${habit.id}`]).length;

                                    return (
                                        <View
                                            key={habit.id}
                                            style={[styles.indexCard, {
                                                flexBasis: isIndexGrid ? `${(100 / indexColumns) - 2}%` : '100%',
                                                flexGrow: 1,
                                                minWidth: isIndexGrid ? 260 : undefined,
                                            }]}
                                        >
                                            {/* Zona tocable: abre detalle */}
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                style={{ flex: 1 }}
                                                onPress={() => setHistH(habit)}
                                            >
                                                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                                    {/* Top: Index and Curve side by side */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1, marginVertical: 8 }}>
                                                        <Text style={{ fontSize: 26, color: index === null ? P.faint : habit.color, lineHeight: 32, fontWeight: 'bold' }}>
                                                            {index === null ? "—" : `${index}%`}
                                                        </Text>
                                                        <View style={{ flex: 1, alignSelf: 'stretch' }}>
                                                            <Curve curve={curve} color={habit.color} height={120} />
                                                        </View>
                                                    </View>

                                                    {/* Bottom: Trend and Stats */}
                                                    <View>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                            {trend !== null && (
                                                                <Text style={{
                                                                    fontSize: 10,
                                                                    fontWeight: '600',
                                                                    color: '#fff',
                                                                    backgroundColor: trend > 0 ? "#2a7a5a" : trend < 0 ? "#a63d2f" : P.faint,
                                                                    paddingHorizontal: 6,
                                                                    paddingVertical: 2,
                                                                    borderRadius: 4,
                                                                    overflow: 'hidden',
                                                                    marginLeft: 'auto',
                                                                }}>
                                                                    {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
                                                                </Text>
                                                            )}
                                                        </View>

                                                        <Text style={{ fontSize: 10, color: P.mute, marginBottom: 12, fontWeight: '500' }}>
                                                            {(() => { const avg = calcAvgDuration(habit, entries); return avg !== null ? fmtDur('00:00', `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`) + ' prom' : ''; })()} · {daysData} {daysData === 1 ? t('index.dayRegistered') : t('index.daysRegistered')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Footer con botones de acción */}
                                            <View style={[styles.indexCardFooter, { backgroundColor: habit.color, marginHorizontal: -20, marginBottom: -18 }]}>
                                                <Text style={styles.indexCardFooterText} numberOfLines={1}>
                                                    {habit.emoji} {habit.name}
                                                </Text>
                                                <TouchableOpacity
                                                    style={styles.footerBtn}
                                                    onPress={() => { setHabitModalTarget(habit); setHabitModalOpen(true); }}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                                                >
                                                    <Text style={styles.footerBtnText}>✎</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.footerBtn, styles.footerBtnDanger]}
                                                    onPress={() => setConfirmDeleteHabit(habit)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                                                >
                                                    <Text style={styles.footerBtnText}>✕</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <View style={{ alignItems: 'flex-end', marginTop: 14 }}>
                            <TouchableOpacity style={styles.bp} onPress={() => { setHabitModalTarget(null); setHabitModalOpen(true); }}>
                                <Text style={styles.bpText}>{t('config.newHabit')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: P.border }}>
                            <Text style={{ color: histH.color, fontSize: 22 }}>{histH.emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 28, color: P.ink, marginBottom: 4, fontFamily: 'CormorantGaramond_400Regular' }}>{histH.name}</Text>
                                <Text style={{ fontSize: 10, color: P.sub }}>
                                    {t('index.target')} · {fmtTime(histH.startTime)} → {fmtTime(histH.endTime)}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                {(() => {
                                    const ix = calcIndex(histH, entries);
                                    return (
                                        <>
                                            <Text style={{ fontSize: 44, color: ix === null ? P.faint : histH.color }}>
                                                {ix === null ? "—" : `${ix}%`}
                                            </Text>
                                            <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1 }}>{t('index.current')}</Text>
                                        </>
                                    );
                                })()}
                            </View>
                        </View>

                        <View style={{ backgroundColor: P.bg, borderWidth: 1, borderColor: P.border, borderRadius: 8, padding: 18, marginBottom: 24 }}>
                            <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1.4, marginBottom: 14 }}>
                                {t('index.evolutionLabel')}
                            </Text>
                            <Curve curve={calcIndexCurve(histH, entries, 100)} color={histH.color} height={100} />
                        </View>

                        {/* Promedios */}
                        {(() => {
                            const avgDur = calcAvgDuration(histH, entries);
                            const avgStart = calcAvgStartTime(histH, entries);
                            const avgEnd = calcAvgEndTime(histH, entries);
                            return (
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                                    <View style={{ flex: 1, backgroundColor: P.surface, borderWidth: 1, borderColor: P.border, borderRadius: 8, padding: 14 }}>
                                        <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1.2, marginBottom: 6 }}>
                                            {t('index.avgDuration')}
                                        </Text>
                                        <Text style={{ fontSize: 18, color: histH.color, fontWeight: '600' }}>
                                            {avgDur !== null ? fmtDur('00:00', `${String(Math.floor(avgDur / 60)).padStart(2, '0')}:${String(avgDur % 60).padStart(2, '0')}`) : '—'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: P.surface, borderWidth: 1, borderColor: P.border, borderRadius: 8, padding: 14 }}>
                                        <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1.2, marginBottom: 6 }}>
                                            {t('index.avgTime')}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: histH.color, fontWeight: '600' }}>
                                            {avgStart && avgEnd ? `${fmtTime(avgStart)} → ${fmtTime(avgEnd)}` : '—'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}

                        <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1.4, marginBottom: 14 }}>
                            {t('index.recordsLabel')}
                        </Text>
                        <View style={{ gap: 8 }}>
                            {(() => {
                                const days = lastNDays(100).filter(d => entries[`${d}::${histH.id}`]).reverse();
                                if (!days.length) return <Text style={styles.emptyText}>{t('index.noRecords')}</Text>;
                                return days.map(day => {
                                    const entry = entries[`${day}::${histH.id}`];
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
                                                {entry.notes ? <Text style={{ fontSize: 12, color: P.sub, fontStyle: 'italic', marginTop: 4 }}>{entry.notes}</Text> : null}
                                            </View>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: histH.color }}>
                                                {fmtDur(entry.startTime, entry.endTime)}
                                            </Text>
                                        </View>
                                    );
                                });
                            })()}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: P.bg,
    },
    scrollContent: {
        paddingHorizontal: 20,
        alignSelf: 'center',
        width: '100%',
    },
    indexCard: {
        backgroundColor: P.surface,
        borderWidth: 1,
        borderColor: P.border,
        borderRadius: 4,
        paddingVertical: 18,
        paddingHorizontal: 20,
        aspectRatio: 16 / 9,
        justifyContent: 'space-between',
        maxWidth: 360,
    },
    indexCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: -20,
        marginBottom: -18,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        gap: 8,
    },
    indexCardFooterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        marginRight: 4,
    },
    footerBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.18)',
    },
    footerBtnDanger: {
        backgroundColor: 'rgba(0,0,0,0.28)',
    },
    footerBtnText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.92)',
        fontWeight: '600',
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
        gap: 12,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 48,
        color: P.faint,
        fontSize: 13,
        fontStyle: 'italic',
    },
    header: {
        backgroundColor: P.bg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: P.border,
        paddingHorizontal: 20,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: P.ink,
        letterSpacing: -0.5,
    },
    headerBack: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerBackText: {
        fontSize: 22,
        color: P.mute,
        lineHeight: 28,
    },
    bp: {
        backgroundColor: P.primary,
        paddingVertical: 9,
        paddingHorizontal: 22,
        borderRadius: 6,
    },
    bpText: {
        color: P.bg,
        fontSize: 10,
        letterSpacing: 1,
        fontWeight: '500',
    },
});
