import { Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTimeTrack } from '@/contexts/TimeTrackContext';
import { ConfirmModal } from '@/components/TimeTrack/ConfirmModal';
import { HabitModal } from '@/components/TimeTrack/HabitModal';
import { SettingsModal } from '@/components/TimeTrack/SettingsModal';
import { P } from '@/components/TimeTrack/Theme';

function BottomIsland({ state, descriptors, navigation }: any) {
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();

    const labels: Record<string, string> = {
        hoy: t('app.tab.today'),
        indice: t('app.tab.index'),
        configurar: t('app.tab.new'),
    };

    return (
        <View pointerEvents="box-none" style={[styles.bottomIslandWrap, { bottom: insets.bottom + 10 }]}>
            <View style={styles.bottomIsland}>
                {state.routes.map((route: any, index: number) => {
                    const isOn = state.index === index;
                    return (
                        <TouchableOpacity
                            key={route.key}
                            activeOpacity={0.85}
                            style={[styles.bottomIslandTab, isOn && styles.bottomIslandTabOn]}
                            onPress={() => navigation.navigate(route.name)}
                        >
                            <Text style={[styles.bottomIslandText, isOn && styles.bottomIslandTextOn]}>
                                {labels[route.name] || route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default function TabsLayout() {
    const {
        habitModalOpen, habitModalTarget, handleHabitSave,
        setHabitModalOpen, setHabitModalTarget,
        confirmDeleteHabit, setConfirmDeleteHabit, rmHabit,
        settingsModalOpen, setSettingsModalOpen,
        toast,
    } = useTimeTrack();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: P.bg }}>
            {toast && (
                <View style={[styles.toast, { top: insets.top + 50 }]}>
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            )}

            <Tabs
                tabBar={(props) => <BottomIsland {...props} />}
                screenOptions={{ headerShown: false }}
            >
                <Tabs.Screen name="hoy" />
                <Tabs.Screen name="indice" />
                <Tabs.Screen name="configurar" />
            </Tabs>

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

            <SettingsModal
                visible={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
        letterSpacing: 1,
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
});
