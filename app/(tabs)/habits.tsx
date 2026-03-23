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
    const { habits, entries, ready, setHabitModalOpen, setHabitModalTarget } = useTimeTrack();
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
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {habits.map((habit) => {
                                    const index = calcIndex(habit, entries);
                                    const curve = calcIndexCurve(habit, entries, 100);
                                    const recent = curve
                                        .filter((p): p is { day: string; index: number } => typeof p.index === 'number')
                                        .slice(-100);
                                    const trend = recent.length >= 2 ? recent[recent.length - 1].index - recent[recent.length - 2].index : null;
                                    const daysData = lastNDays(100).filter(d => !!entries[`${d}::${habit.id}`]).length;
                                    const avgDur = calcAvgDuration(habit, entries);
                                    const avgDurStr = avgDur !== null
                                        ? fmtDur('00:00', `${String(Math.floor(avgDur / 60)).padStart(2, '0')}:${String(avgDur % 60).padStart(2, '0')}`)
                                        : null;

                                    return (
                                        <View
                                            key={habit.id}
                                            style={[styles.indexCard, {
                                                flexBasis: isIndexGrid ? `${(100 / indexColumns) - 2}%` : '100%',
                                                flexGrow: 1,
                                                minWidth: isIndexGrid ? 280 : undefined,
                                            }]}
                                        >
                                            {/* Zona tappable: abre detalle */}
                                            <TouchableOpacity
                                                activeOpacity={0.75}
                                                onPress={() => setHistH(habit)}
                                                style={{ flex: 1 }}
                                            >
                                                {/* 2 columnas: curva+nombre | datos */}
                                                <View style={styles.cardBody}>
                                                    {/* Columna izquierda: nombre + curva */}
                                                    <View style={styles.cardLeft}>
                                                        <Text style={styles.cardName} numberOfLines={1}>{habit.name}</Text>
                                                        <Curve curve={curve} color={habit.color} height={52} />
                                                    </View>
                                                    {/* Columna derecha: índice + trend + días */}
                                                    <View style={styles.cardRight}>
                                                        <Text style={[styles.cardIndex, { color: index === null ? P.faint : P.text }]}>
                                                            {index === null ? '—' : `${index}%`}
                                                        </Text>
                                                        {trend !== null && (
                                                            <Text style={[styles.cardTrend, { color: trend > 0 ? '#2a7d4f' : trend < 0 ? '#b04040' : P.faint }]}>
                                                                {trend > 0 ? '↑' : trend < 0 ? '↓' : ''} {Math.abs(trend).toFixed(1)}%
                                                            </Text>
                                                        )}
                                                        <Text style={styles.cardDays}>{daysData} días</Text>
                                                        {avgDurStr && (
                                                            <Text style={styles.cardDays}>{avgDurStr}</Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Separador */}
                                            <View style={styles.cardDivider} />

                                            {/* Footer: stats + botón editar */}
                                            <View style={styles.cardFooter}>
                                                <Text style={styles.cardStats} numberOfLines={1}>
                                                    {avgDurStr ? `${avgDurStr} prom · ` : ''}{daysData} {daysData === 1 ? t('index.dayRegistered') : t('index.daysRegistered')}
                                                </Text>
                                                <TouchableOpacity
                                                    style={styles.editBtn}
                                                    onPress={() => { setHabitModalTarget(habit); setHabitModalOpen(true); }}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Text style={styles.editBtnText}>Editar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
                            <TouchableOpacity style={styles.bp} onPress={() => { setHabitModalTarget(null); setHabitModalOpen(true); }}>
                                <Text style={styles.bpText}>{t('config.newHabit')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View>
                        {/* Cabecera detalle */}
                        <View style={styles.detailHeader}>
                            <View style={[styles.detailAccent, { backgroundColor: histH.color }]} />
                            <Text style={styles.detailEmoji}>{histH.emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailName}>{histH.name}</Text>
                                <Text style={styles.detailTarget}>
                                    {t('index.target')} · {fmtTime(histH.startTime)} → {fmtTime(histH.endTime)}
                                </Text>
                            </View>
                            <View style={styles.detailIndexBlock}>
                                {(() => {
                                    const ix = calcIndex(histH, entries);
                                    return (
                                        <>
                                            <Text style={[styles.detailIndex, { color: ix === null ? P.faint : P.text }]}>
                                                {ix === null ? '—' : `${ix}%`}
                                            </Text>
                                            <Text style={styles.detailIndexLabel}>{t('index.current')}</Text>
                                        </>
                                    );
                                })()}
                            </View>
                        </View>

                        {/* Gráfico evolución */}
                        <View style={styles.detailCard}>
                            <Text style={styles.detailSectionLabel}>{t('index.evolutionLabel')}</Text>
                            <Curve curve={calcIndexCurve(histH, entries, 100)} color={histH.color} height={80} />
                        </View>

                        {/* Promedios */}
                        {(() => {
                            const avgDur = calcAvgDuration(histH, entries);
                            const avgStart = calcAvgStartTime(histH, entries);
                            const avgEnd = calcAvgEndTime(histH, entries);
                            return (
                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                                    <View style={[styles.detailCard, { flex: 1, marginBottom: 0 }]}>
                                        <Text style={styles.detailSectionLabel}>{t('index.avgDuration')}</Text>
                                        <Text style={styles.detailStatValue}>
                                            {avgDur !== null ? fmtDur('00:00', `${String(Math.floor(avgDur / 60)).padStart(2, '0')}:${String(avgDur % 60).padStart(2, '0')}`) : '—'}
                                        </Text>
                                    </View>
                                    <View style={[styles.detailCard, { flex: 1, marginBottom: 0 }]}>
                                        <Text style={styles.detailSectionLabel}>{t('index.avgTime')}</Text>
                                        <Text style={[styles.detailStatValue, { fontSize: 15 }]}>
                                            {avgStart && avgEnd ? `${fmtTime(avgStart)} → ${fmtTime(avgEnd)}` : '—'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}

                        <Text style={styles.detailSectionTitle}>{t('index.recordsLabel')}</Text>
                        <View style={{ gap: 8 }}>
                            {(() => {
                                const days = lastNDays(100).filter(d => entries[`${d}::${histH.id}`]).reverse();
                                if (!days.length) return <Text style={styles.emptyText}>{t('index.noRecords')}</Text>;
                                return days.map(day => {
                                    const entry = entries[`${day}::${histH.id}`];
                                    return (
                                        <View key={day} style={[styles.logItem, { borderLeftColor: histH.color }]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.logDay}>{dayLabel(day)}</Text>
                                                <Text style={styles.logTime}>{fmtTime(entry.startTime)} → {fmtTime(entry.endTime)}</Text>
                                                <Bar habit={histH} entry={entry} />
                                                {entry.notes ? <Text style={styles.logNotes}>"{entry.notes}"</Text> : null}
                                            </View>
                                            <Text style={styles.logDur}>{fmtDur(entry.startTime, entry.endTime)}</Text>
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
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        paddingHorizontal: 16,
        alignSelf: 'center',
        width: '100%',
    },
    // ── Cards ──────────────────────────────────────────────
    indexCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        paddingTop: 14,
        paddingHorizontal: 14,
        paddingBottom: 0,
        maxWidth: 400,
        overflow: 'hidden',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'stretch',
        flex: 1,
        minHeight: 90,
        marginBottom: 10,
    },
    cardLeft: {
        flex: 7,
        justifyContent: 'space-between',
        paddingRight: 14,
        gap: 8,
    },
    cardRight: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        flexShrink: 1,
    },
    cardEmoji: {
        fontSize: 16,
    },
    cardName: {
        fontSize: 15,
        fontWeight: '600',
        color: P.text,
        flexShrink: 1,
    },
    cardIndexBlock: {
        alignItems: 'flex-end',
        flexShrink: 0,
        marginLeft: 12,
    },
    cardIndex: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
    },
    cardTrend: {
        fontSize: 18,
        fontWeight: '500',
        marginTop: 1,
    },
    cardDays: {
        fontSize: 18,
        color: P.mute,
        marginTop: 1,
    },
    cardCurve: {
        marginBottom: 10,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: -14,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    cardStats: {
        fontSize: 11,
        color: P.faint,
        flex: 1,
        flexShrink: 1,
    },
    editBtn: {
        backgroundColor: '#F2F2F2',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginLeft: 10,
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: P.sub,
    },
    // ── Detalle ────────────────────────────────────────────
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
    },
    detailAccent: {
        width: 4,
        height: 40,
        borderRadius: 2,
    },
    detailEmoji: {
        fontSize: 32,
    },
    detailName: {
        fontSize: 28,
        color: P.ink,
        fontFamily: 'Gabarito_700Bold',
        marginBottom: 2,
    },
    detailTarget: {
        fontSize: 12,
        color: P.mute,
    },
    detailIndexBlock: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    detailIndex: {
        fontSize: 28,
        fontWeight: '600',
    },
    detailIndexLabel: {
        fontSize: 10,
        color: P.faint,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    detailCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    detailSectionLabel: {
        fontSize: 10,
        color: P.faint,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    detailSectionTitle: {
        fontSize: 12,
        color: P.text,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 4,
    },
    detailStatValue: {
        fontSize: 18,
        color: P.text,
        fontWeight: '600',
    },
    // ── Log items ──────────────────────────────────────────
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
    logDay: {
        fontSize: 11,
        color: P.faint,
        fontWeight: '500',
        marginBottom: 3,
    },
    logTime: {
        fontSize: 14,
        color: P.sub,
        fontWeight: '500',
        marginBottom: 8,
    },
    logNotes: {
        fontSize: 13,
        color: P.mute,
        marginTop: 8,
        fontStyle: 'italic',
    },
    logDur: {
        fontSize: 18,
        fontWeight: '600',
        color: P.text,
    },
    // ── Misc ───────────────────────────────────────────────
    emptyText: {
        textAlign: 'center',
        paddingVertical: 48,
        color: P.faint,
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
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Gabarito_700Bold',
        color: P.ink,
    },
    headerBack: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerBackText: {
        fontSize: 20,
        color: P.mute,
        lineHeight: 24,
    },
    bp: {
        backgroundColor: P.primary,
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
