import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fmtTime, toMins } from '../../utils/timeMath';
import { P } from './Theme';

interface Habit {
    id: string;
    name: string;
    emoji: string;
    color: string;
    startTime: string;
    endTime: string;
}

interface Entry {
    startTime: string;
    endTime: string;
}

interface Props {
    habits: Habit[];
    entries: Record<string, Entry>;
    selDay: string;
    onPressBlock: (habit: Habit) => void;
}

const HOUR_HEIGHT = 64;

/**
 * Always shows the full 24-hour range so entries registered
 * outside a habit's objective time are never clipped.
 */
function getTimeRange(_habits: Habit[]): { startHour: number; endHour: number } {
    return { startHour: 0, endHour: 24 };
}

/**
 * Splits a time range into segments that don't cross midnight.
 * Returns 1 segment for normal times, 2 for cross-midnight.
 */
function splitAtMidnight(startTime: string, endTime: string): { start: number; end: number }[] {
    const s = toMins(startTime);
    const e = toMins(endTime);

    if (e > s) {
        return [{ start: s, end: e }];
    }
    // Cross-midnight: split into [s→1440] and [0→e]
    const segments: { start: number; end: number }[] = [];
    if (s < 1440) segments.push({ start: s, end: 1440 });
    if (e > 0) segments.push({ start: 0, end: e });
    return segments;
}

function segmentPosition(
    startMin: number,
    endMin: number,
    rangeStartHour: number,
): { top: number; height: number } {
    const rangeStartMin = rangeStartHour * 60;
    const top = ((startMin - rangeStartMin) / 60) * HOUR_HEIGHT;
    const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
    return { top, height: Math.max(height, HOUR_HEIGHT * 0.35) };
}

export function DayTimeline({ habits, entries, selDay, onPressBlock }: Props) {
    const { startHour, endHour } = getTimeRange(habits);
    const totalHours = endHour - startHour;
    const timelineHeight = totalHours * HOUR_HEIGHT;

    const hours: number[] = [];
    for (let h = startHour; h <= endHour; h++) {
        hours.push(h % 24);
    }

    // Current time indicator
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const rangeStartMin = startHour * 60;
    const rangeEndMin = endHour * 60;
    const showNow = nowMins >= rangeStartMin && nowMins <= rangeEndMin;
    const nowTop = ((nowMins - rangeStartMin) / 60) * HOUR_HEIGHT;

    return (
        <View style={styles.container}>
            <View style={[styles.timeline, { height: timelineHeight }]}>
                {/* Hour lines and labels */}
                {hours.map((hour, i) => (
                    <View key={i} style={[styles.hourRow, { top: i * HOUR_HEIGHT }]}>
                        <Text style={styles.hourLabel}>
                            {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                        </Text>
                        <View style={styles.hourLine} />
                    </View>
                ))}

                {/* Habit objective blocks (split at midnight) */}
                {habits.map((habit) => {
                    const key = `${selDay}::${habit.id}`;
                    const entry = entries[key];
                    const segments = splitAtMidnight(habit.startTime, habit.endTime);
                    const isCrossMidnight = segments.length > 1;

                    return segments.map((seg, si) => {
                        const { top, height } = segmentPosition(seg.start, seg.end, startHour);
                        const isFirst = si === 0;
                        const isLast = si === segments.length - 1;

                        return (
                            <TouchableOpacity
                                key={`obj-${habit.id}-${si}`}
                                activeOpacity={0.7}
                                style={[
                                    styles.block,
                                    styles.objectiveBlock,
                                    {
                                        top,
                                        height,
                                        borderColor: habit.color + '60',
                                        backgroundColor: habit.color + '0A',
                                        borderTopLeftRadius: isFirst ? 8 : 2,
                                        borderTopRightRadius: isFirst ? 8 : 2,
                                        borderBottomLeftRadius: isLast ? 8 : 2,
                                        borderBottomRightRadius: isLast ? 8 : 2,
                                    },
                                ]}
                                onPress={() => onPressBlock(habit)}
                            >
                                {!entry && (
                                    <>
                                        <View style={styles.blockHeader}>
                                            <Text style={[styles.blockEmoji, { opacity: 0.4 }]}>{habit.emoji}</Text>
                                            <Text style={[styles.blockName, { color: habit.color + '80' }]}>{habit.name}</Text>
                                            {isCrossMidnight && (
                                                <Text style={[styles.blockSplit, { color: habit.color + '50' }]}>
                                                    {isFirst ? '→ 12am' : '12am →'}
                                                </Text>
                                            )}
                                        </View>
                                        {height >= HOUR_HEIGHT * 0.8 && (
                                            <Text style={[styles.blockTime, { color: habit.color + '60' }]}>
                                                {isFirst
                                                    ? `${fmtTime(habit.startTime)} → ${isCrossMidnight ? '12:00am' : fmtTime(habit.endTime)}`
                                                    : `12:00am → ${fmtTime(habit.endTime)}`
                                                }
                                            </Text>
                                        )}
                                        {height >= HOUR_HEIGHT * 1.2 && isFirst && (
                                            <Text style={[styles.tapHint, { color: habit.color + '50' }]}>
                                                tocar para registrar
                                            </Text>
                                        )}
                                    </>
                                )}
                            </TouchableOpacity>
                        );
                    });
                })}

                {/* Entry (filled) blocks (split at midnight) */}
                {habits.map((habit) => {
                    const key = `${selDay}::${habit.id}`;
                    const entry = entries[key];
                    if (!entry) return null;

                    const segments = splitAtMidnight(entry.startTime, entry.endTime);
                    const isCrossMidnight = segments.length > 1;

                    return segments.map((seg, si) => {
                        const { top, height } = segmentPosition(seg.start, seg.end, startHour);
                        const isFirst = si === 0;
                        const isLast = si === segments.length - 1;

                        return (
                            <TouchableOpacity
                                key={`entry-${habit.id}-${si}`}
                                activeOpacity={0.8}
                                style={[
                                    styles.block,
                                    styles.entryBlock,
                                    {
                                        top,
                                        height,
                                        backgroundColor: habit.color + 'E8',
                                        borderTopLeftRadius: isFirst ? 8 : 2,
                                        borderTopRightRadius: isFirst ? 8 : 2,
                                        borderBottomLeftRadius: isLast ? 8 : 2,
                                        borderBottomRightRadius: isLast ? 8 : 2,
                                    },
                                ]}
                                onPress={() => onPressBlock(habit)}
                            >
                                <View style={styles.blockHeader}>
                                    <Text style={[styles.blockEmoji, { color: '#fff' }]}>{habit.emoji}</Text>
                                    <Text style={[styles.blockName, { color: '#fff' }]}>{habit.name}</Text>
                                </View>
                                {height >= HOUR_HEIGHT * 0.6 && (
                                    <Text style={[styles.blockTime, { color: 'rgba(255,255,255,0.8)' }]}>
                                        {isFirst
                                            ? `${fmtTime(entry.startTime)} → ${isCrossMidnight ? '12:00am' : fmtTime(entry.endTime)}`
                                            : `12:00am → ${fmtTime(entry.endTime)}`
                                        }
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    });
                })}

                {/* Current time indicator */}
                {showNow && (
                    <View style={[styles.nowLine, { top: nowTop }]}>
                        <View style={styles.nowDot} />
                        <View style={styles.nowLineBar} />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 4,
    },
    timeline: {
        position: 'relative',
        marginLeft: 48,
    },
    hourRow: {
        position: 'absolute',
        left: -48,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        height: 0,
    },
    hourLabel: {
        width: 42,
        fontSize: 10,
        color: P.faint,
        textAlign: 'right',
        paddingRight: 8,
        marginTop: -6,
    },
    hourLine: {
        flex: 1,
        height: 1,
        backgroundColor: P.border + '80',
    },
    block: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'center',
        borderRadius: 0,
    },
    objectiveBlock: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    entryBlock: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    blockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    blockEmoji: {
        fontSize: 13,
    },
    blockName: {
        fontSize: 13,
        fontWeight: '600',
    },
    blockSplit: {
        fontSize: 9,
        marginLeft: 'auto',
        fontStyle: 'italic',
    },
    blockTime: {
        fontSize: 11,
        marginTop: 2,
    },
    tapHint: {
        fontSize: 9,
        marginTop: 4,
        fontStyle: 'italic',
        letterSpacing: 0.3,
    },
    nowLine: {
        position: 'absolute',
        left: -48,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
    },
    nowDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e74c3c',
        marginLeft: 38,
    },
    nowLineBar: {
        flex: 1,
        height: 1.5,
        backgroundColor: '#e74c3c',
    },
});
