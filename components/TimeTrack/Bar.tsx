import React from 'react';
import { StyleSheet, View } from 'react-native';
import { toInterval, toMins } from '../../utils/timeMath';

interface Props {
    habit: any;
    entry?: any;
}

export function Bar({ habit, entry }: Props) {
    const p = (t: string) => (toMins(t) / 1440) * 100;
    const w = (s: string, e: string) => (toInterval(s, e).dur / 1440) * 100;

    return (
        <View style={styles.container}>
            {[6, 12, 18].map(h => (
                <View key={h} style={[styles.tick, { left: `${(h / 24) * 100}%` as any }]} />
            ))}
            <View style={[styles.habitBar, {
                left: `${p(habit.startTime)}%` as any,
                width: `${w(habit.startTime, habit.endTime)}%` as any,
                backgroundColor: habit.color + '28'
            }]} />
            {entry && (
                <View style={[styles.entryBar, {
                    left: `${p(entry.startTime)}%` as any,
                    width: `${w(entry.startTime, entry.endTime)}%` as any,
                    backgroundColor: habit.color,
                    opacity: 0.85
                }]} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        height: 5,
        backgroundColor: '#f0ece4',
        borderRadius: 3,
        marginTop: 8,
        marginBottom: 3,
        overflow: 'hidden'
    },
    tick: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#e4dfd6'
    },
    habitBar: {
        position: 'absolute',
        height: '100%',
        borderRadius: 3
    },
    entryBar: {
        position: 'absolute',
        height: '100%',
        borderRadius: 3
    }
});
