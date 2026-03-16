import { Bar } from '@/components/TimeTrack/Bar';
import { Curve } from '@/components/TimeTrack/Curve';
import { ScoreArc } from '@/components/TimeTrack/ScoreArc';
import { P } from '@/components/TimeTrack/Theme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTimeTrack } from '@/contexts/TimeTrackContext';
import { calcIndex, calcIndexCurve, calcScore, dayLabel, fmtDur, fmtTime, lastNDays } from '@/utils/timeMath';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IndiceScreen() {
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const { habits, entries, ready } = useTimeTrack();
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
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 106, maxWidth: isIndexGrid ? 1200 : 620 }]}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: P.ink, marginBottom: 20 }}>{t('index.title')}</Text>

                {!histH ? (
                    <View>
                        <Text style={styles.philosophyBlock}>{t('index.philosophy')}</Text>

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
                                    <TouchableOpacity
                                        key={habit.id}
                                        activeOpacity={0.8}
                                        style={[styles.indexCard, {
                                            flexBasis: isIndexGrid ? `${(100 / indexColumns) - 2}%` : '100%',
                                            flexGrow: 1,
                                            minWidth: isIndexGrid ? 260 : undefined,
                                            overflow: 'hidden', // Ensure curve doesn't bleed out of rounded corners
                                        }]}
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
                                                    {fmtDur(habit.startTime, habit.endTime)} · {daysData} {daysData === 1 ? t('index.dayRegistered') : t('index.daysRegistered')}
                                                </Text>
                                            </View>

                                            {/* Footer */}
                                            <View style={[styles.indexCardFooter, { backgroundColor: habit.color, marginHorizontal: -20, marginBottom: -18 }]}>
                                                <Text style={styles.indexCardFooterText} numberOfLines={1}>
                                                    {habit.emoji} {habit.name}
                                                </Text>
                                                <Text style={styles.indexCardFooterTime}>
                                                    {fmtTime(habit.startTime)} → {fmtTime(habit.endTime)}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : (
                    <View>
                        <TouchableOpacity onPress={() => setHistH(null)} style={{ marginBottom: 22, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'flex-start', backgroundColor: P.surface, borderRadius: 10, borderWidth: 1, borderColor: P.border }}>
                            <Text style={{ color: P.ink, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 }}>{t('index.back')}</Text>
                        </TouchableOpacity>

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

                        <Text style={{ fontSize: 9, color: P.mute, letterSpacing: 1.4, marginBottom: 14 }}>
                            {t('index.recordsLabel')}
                        </Text>
                        <View style={{ gap: 8 }}>
                            {(() => {
                                const days = lastNDays(100).filter(d => entries[`${d}::${histH.id}`]).reverse();
                                if (!days.length) return <Text style={styles.emptyText}>{t('index.noRecords')}</Text>;
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
                                                {entry.notes ? <Text style={{ fontSize: 12, color: P.sub, fontStyle: 'italic', marginTop: 4 }}>{entry.notes}</Text> : null}
                                            </View>
                                            <ScoreArc value={score} color={histH.color} size={44} />
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
    philosophyBlock: {
        fontSize: 16,
        color: P.sub,
        marginBottom: 24,
        lineHeight: 24,
    },
    indexCard: {
        backgroundColor: P.surface,
        borderWidth: 1,
        borderColor: P.border,
        borderRadius: 12,
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
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    indexCardFooterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        marginRight: 8,
    },
    indexCardFooterTime: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
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
});
