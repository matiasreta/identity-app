import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTimeTrack } from '@/contexts/TimeTrackContext';
import { centeredNDays, todayStr } from '@/utils/timeMath';
import { DayTimeline } from '@/components/TimeTrack/DayTimeline';
import { EntryModal } from '@/components/TimeTrack/EntryModal';
import { P } from '@/components/TimeTrack/Theme';

export default function HoyScreen() {
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const {
        habits, entries, ready,
        selDay, setSelDay,
        modalHabit, setModalHabit,
        modalSave, modalDelete,
    } = useTimeTrack();

    const selDayOfWeek = new Date(selDay + 'T12:00:00').getDay();
    const habitsForDay = habits.filter(h => !h.weekDays || h.weekDays.includes(selDayOfWeek));
    const weekDays = centeredNDays(7, 5);
    const today = todayStr();

    if (!ready) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'CormorantGaramond_400Regular', color: P.faint, fontSize: 13 }}>—</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20, maxWidth: 620, alignSelf: 'center', width: '100%', backgroundColor: P.bg, zIndex: 10 }}>
                <View style={[styles.dayScroll, { marginBottom: 10 }]}>
                    {weekDays.map(day => {
                        const d = new Date(day + "T12:00:00");
                        const isToday = day === today;
                        const isSel = day === selDay && !isToday;
                        return (
                            <TouchableOpacity key={day} style={[styles.dayPill, isToday && styles.dayPillOn, isSel && styles.dayPillSelected]}
                                onPress={() => { setSelDay(day); setModalHabit(null); }}>
                                <Text style={[styles.dayPillSub, isToday && styles.dayPillTextOn]}>
                                    {[t('day.sun'), t('day.mon'), t('day.tue'), t('day.wed'), t('day.thu'), t('day.fri'), t('day.sat')][d.getDay()]}
                                </Text>
                                <Text style={[styles.dayPillVal, isToday && styles.dayPillValOn]}>{d.getDate()}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 10, paddingBottom: 24 }]}>
                {habitsForDay.length ? (
                    <DayTimeline
                        habits={habitsForDay}
                        entries={entries}
                        selDay={selDay}
                        onPressBlock={(habit) => setModalHabit(habit)}
                    />
                ) : (
                    <Text style={styles.emptyText}>{t('app.emptyHabit')}</Text>
                )}
            </ScrollView>

            <EntryModal
                visible={!!modalHabit}
                habit={modalHabit}
                entry={modalHabit ? entries[`${selDay}::${modalHabit.id}`] || null : null}
                onClose={() => setModalHabit(null)}
                onSave={modalSave}
                onDelete={modalDelete}
            />
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
        maxWidth: 620,
        alignSelf: 'center',
        width: '100%',
    },
    dayScroll: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingBottom: 2,
    },
    dayPill: {
        paddingVertical: 10,
        paddingHorizontal: 0,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
        width: 44,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    dayPillOn: {
        backgroundColor: P.ink,
    },
    dayPillSelected: {
        borderColor: P.ink,
    },
    dayPillSub: {
        fontSize: 10,
        marginBottom: 4,
        fontWeight: '500',
        color: P.sub,
    },
    dayPillVal: {
        fontSize: 16,
        fontWeight: '600',
        color: P.ink,
    },
    dayPillValOn: {
        color: P.bg,
    },
    dayPillTextOn: {
        color: P.bg,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 48,
        color: P.faint,
        fontSize: 13,
        fontStyle: 'italic',
    },
});
