import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimeTrack } from '@/contexts/TimeTrackContext';
import { ConfirmModal } from '@/components/TimeTrack/ConfirmModal';
import { HabitModal } from '@/components/TimeTrack/HabitModal';
import { SettingsModal } from '@/components/TimeTrack/SettingsModal';
import { P } from '@/components/TimeTrack/Theme';
import { SymbolView } from 'expo-symbols';

// Mapa de íconos SF Symbols por ruta
const ICONS: Record<string, { filled: string; outline: string }> = {
    today:    { filled: 'calendar.circle.fill', outline: 'calendar.circle' },
    '100':    { filled: 'list.number',          outline: 'list.number' },
    settings: { filled: 'gearshape.fill',       outline: 'gearshape' },
};

function IPhoneTabBar({ state, descriptors, navigation }: any) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.tabBarOuter, { paddingBottom: insets.bottom }]}>
            <View style={styles.tabBarInner}>
                {state.routes.map((route: any, index: number) => {
                    const isOn = state.index === index;
                    const icons = ICONS[route.name] ?? { filled: 'circle.fill', outline: 'circle' };
                    const iconName = isOn ? icons.filled : icons.outline;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            activeOpacity={0.7}
                            style={styles.tabItem}
                            onPress={() => navigation.navigate(route.name)}
                        >
                            {Platform.OS === 'ios' ? (
                                <SymbolView
                                    name={iconName as any}
                                    style={styles.icon}
                                    type="hierarchical"
                                    tintColor={isOn ? P.ink : P.faint}
                                />
                            ) : (
                                <View style={[styles.androidIcon, { backgroundColor: isOn ? P.ink : P.faint }]} />
                            )}
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
                tabBar={(props) => <IPhoneTabBar {...props} />}
                screenOptions={{ headerShown: false }}
            >
                <Tabs.Screen name="today" />
                <Tabs.Screen name="100" />
                <Tabs.Screen name="settings" />
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
    // ─── Nueva tab bar estilo iPhone ─────────────────────────────────
    tabBarOuter: {
        backgroundColor: P.bg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: P.border,
    },
    tabBarInner: {
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingVertical: 2,
    },
    icon: {
        width: 26,
        height: 26,
    },
    androidIcon: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
