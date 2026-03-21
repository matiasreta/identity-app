import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTimeTrack } from '@/contexts/TimeTrackContext';
import { fmtDur, fmtTime } from '@/utils/timeMath';
import { P } from '@/components/TimeTrack/Theme';

export default function ConfigurarScreen() {
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const {
        habits, ready,
        setHabitModalOpen, setHabitModalTarget,
        setConfirmDeleteHabit,
        setSettingsModalOpen,
    } = useTimeTrack();

    if (!ready) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontFamily: 'CormorantGaramond_400Regular', color: P.faint, fontSize: 13 }}>—</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 106 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: P.ink }}>{t('config.title')}</Text>
                    <TouchableOpacity
                        style={{ padding: 8, backgroundColor: P.surface, borderRadius: 8, borderWidth: 1, borderColor: P.border, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        onPress={() => setSettingsModalOpen(true)}
                    >
                        <Text style={{ fontSize: 16 }}>⚙️</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: P.ink }}>{t('config.profile')}</Text>
                    </TouchableOpacity>
                </View>

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
                                <TouchableOpacity style={[styles.delBtn, { borderColor: P.secondary }]} onPress={() => { setHabitModalTarget(h); setHabitModalOpen(true); }}>
                                    <Text style={[styles.delBtnText, { color: P.secondary }]}>{t('config.edit')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.delBtn} onPress={() => setConfirmDeleteHabit(h)}>
                                    <Text style={styles.delBtnText}>{t('config.delete')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ alignItems: 'flex-end', marginTop: 14 }}>
                    <TouchableOpacity style={styles.bp} onPress={() => { setHabitModalTarget(null); setHabitModalOpen(true); }}>
                        <Text style={styles.bpText}>{t('config.newHabit')}</Text>
                    </TouchableOpacity>
                </View>
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
        maxWidth: 620,
        alignSelf: 'center',
        width: '100%',
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
    delBtn: {
        borderWidth: 1,
        borderColor: P.border,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    delBtnText: {
        fontSize: 10,
        color: P.mute,
    },
    bp: {
        backgroundColor: P.secondary,
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
