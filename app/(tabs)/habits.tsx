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
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
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
                                                minWidth: isIndexGrid ? 280 : undefined,
                                            }]}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                style={{ flex: 1 }}
                                                onPress={() => setHistH(habit)}
                                            >
                                                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                                    {/* Top: Name, Emoji & Actions */}
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                                                            <Text style={{ fontSize: 14 }}>{habit.emoji}</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111', flexShrink: 1 }} numberOfLines={1}>{habit.name}</Text>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', gap: 10, flexShrink: 0 }}>
                                                            <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={() => { setHabitModalTarget(habit); setHabitModalOpen(true); }}>
                                                                <Text style={{ fontSize: 13, color: '#999' }}>✎</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={() => setConfirmDeleteHabit(habit)}>
                                                                <Text style={{ fontSize: 13, color: '#999' }}>✕</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>

                                                    {/* Middle: Index and Curve */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                                                        <View style={{ minWidth: 50 }}>
                                                            <Text style={{ fontSize: 24, fontWeight: '600', color: index === null ? '#999' : '#111' }}>
                                                                {index === null ? "—" : `${index}%`}
                                                            </Text>
                                                            {trend !== null && (
                                                                <Text style={{ fontSize: 10, color: trend > 0 ? '#111' : '#666', marginTop: 2, fontWeight: '500' }}>
                                                                    {trend > 0 ? "↑ " : trend < 0 ? "↓ " : ""}{Math.abs(trend).toFixed(1)}%
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <View style={{ flex: 1, height: 40, justifyContent: 'center' }}>
                                                            <Curve curve={curve} color={habit.color} height={40} />
                                                        </View>
                                                    </View>

                                                    {/* Bottom: Stats */}
                                                    <View>
                                                        <Text style={{ fontSize: 11, color: '#888' }}>
                                                            {(() => { const avg = calcAvgDuration(habit, entries); return avg !== null ? fmtDur('00:00', `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`) + ' prom' : ''; })()} · {daysData} {daysData === 1 ? t('index.dayRegistered') : t('index.daysRegistered')}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' }}>
                            <Text style={{ fontSize: 32 }}>{histH.emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 20, color: '#111', fontWeight: '600', marginBottom: 2 }}>{histH.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: histH.color }} />
                                    <Text style={{ fontSize: 12, color: '#666' }}>
                                        {t('index.target')} · {fmtTime(histH.startTime)} → {fmtTime(histH.endTime)}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                {(() => {
                                    const ix = calcIndex(histH, entries);
                                    return (
                                        <>
                                            <Text style={{ fontSize: 28, fontWeight: '600', color: ix === null ? '#ccc' : '#111' }}>
                                                {ix === null ? "—" : `${ix}%`}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: '#999', fontWeight: '500', textTransform: 'uppercase' }}>{t('index.current')}</Text>
                                        </>
                                    );
                                })()}
                            </View>
                        </View>

                        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                            <Text style={{ fontSize: 10, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 16 }}>
                                {t('index.evolutionLabel')}
                            </Text>
                            <Curve curve={calcIndexCurve(histH, entries, 100)} color={histH.color} height={80} />
                        </View>

                        {/* Promedios */}
                        {(() => {
                            const avgDur = calcAvgDuration(histH, entries);
                            const avgStart = calcAvgStartTime(histH, entries);
                            const avgEnd = calcAvgEndTime(histH, entries);
                            return (
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                                    <View style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 12, padding: 16 }}>
                                        <Text style={{ fontSize: 10, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 }}>
                                            {t('index.avgDuration')}
                                        </Text>
                                        <Text style={{ fontSize: 18, color: '#111', fontWeight: '600' }}>
                                            {avgDur !== null ? fmtDur('00:00', `${String(Math.floor(avgDur / 60)).padStart(2, '0')}:${String(avgDur % 60).padStart(2, '0')}`) : '—'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 12, padding: 16 }}>
                                        <Text style={{ fontSize: 10, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 }}>
                                            {t('index.avgTime')}
                                        </Text>
                                        <Text style={{ fontSize: 16, color: '#111', fontWeight: '600' }}>
                                            {avgStart && avgEnd ? `${fmtTime(avgStart)} → ${fmtTime(avgEnd)}` : '—'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}

                        <Text style={{ fontSize: 12, color: '#111', fontWeight: '600', marginBottom: 12 }}>
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
                                                <Text style={{ fontSize: 11, color: '#888', fontWeight: '500', marginBottom: 4 }}>
                                                    {dayLabel(day)}
                                                </Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                    <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>{fmtTime(entry.startTime)} → {fmtTime(entry.endTime)}</Text>
                                                </View>
                                                <Bar habit={histH} entry={entry} />
                                                {entry.notes ? <Text style={{ fontSize: 13, color: '#666', marginTop: 8, fontStyle: 'italic' }}>"{entry.notes}"</Text> : null}
                                            </View>
                                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111' }}>
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
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 20,
        alignSelf: 'center',
        width: '100%',
    },
    indexCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 12,
        padding: 16,
        height: 130,
        justifyContent: 'space-between',
        maxWidth: 360,
    },
    logItem: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderLeftWidth: 3,
        borderRadius: 10,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 48,
        color: '#999',
        fontSize: 14,
        fontStyle: 'italic',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
    },
    headerBack: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerBackText: {
        fontSize: 20,
        color: '#666',
        lineHeight: 24,
    },
    bp: {
        backgroundColor: '#111',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    bpText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
});
