import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/utils/supabase';
import { P } from '@/components/TimeTrack/Theme';

export default function AjustesScreen() {
    const insets = useSafeAreaInsets();
    const { t, locale, setLocale } = useLanguage();
    const { user, profile, refreshProfile } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDisplayName(profile?.display_name || '');
    }, [profile]);

    const handleSaveName = async () => {
        if (!user) return;
        const trimmed = displayName.trim();
        if (trimmed === (profile?.display_name || '')) return;
        setSaving(true);
        await supabase
            .from('profiles')
            .update({ display_name: trimmed })
            .eq('id', user.id);
        await refreshProfile();
        setSaving(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const avatarLabel = (displayName || user?.email || '?')[0].toUpperCase();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>{t('app.tab.settings')}</Text>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 106 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero de perfil */}
                <View style={styles.profileHero}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarLabel}>{avatarLabel}</Text>
                    </View>
                    <TextInput
                        style={styles.heroName}
                        value={displayName}
                        onChangeText={setDisplayName}
                        onBlur={handleSaveName}
                        placeholder={t('settings.name')}
                        placeholderTextColor={P.faint}
                        textAlign="center"
                    />
                    <Text style={styles.heroEmail}>{user?.email || t('settings.noEmail')}</Text>
                    {saving && <Text style={styles.savingDot}>guardando…</Text>}
                </View>

                {/* Sección: Preferencias */}
                <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>{t('settings.language')}</Text>
                        <View style={styles.segmented}>
                            <TouchableOpacity
                                style={[styles.segBtn, locale === 'en' && styles.segBtnActive]}
                                onPress={() => setLocale('en')}
                            >
                                <Text style={[styles.segBtnText, locale === 'en' && styles.segBtnTextActive]}>EN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segBtn, locale === 'es' && styles.segBtnActive]}
                                onPress={() => setLocale('es')}
                            >
                                <Text style={[styles.segBtnText, locale === 'es' && styles.segBtnTextActive]}>ES</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Sección: Cuenta */}
                <Text style={styles.sectionLabel}>{t('settings.email')}</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>{t('settings.email')}</Text>
                        <Text style={styles.rowValue} numberOfLines={1}>{user?.email || '—'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut} activeOpacity={0.7}>
                        <Text style={styles.dangerText}>{t('settings.logout')}</Text>
                        <Text style={styles.dangerChevron}>→</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f7',
    },
    header: {
        backgroundColor: '#f5f5f7',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: P.border,
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Gabarito_700Bold',
        color: P.ink,
        letterSpacing: -0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        maxWidth: 620,
        alignSelf: 'center',
        width: '100%',
        paddingTop: 32,
    },

    /* Hero */
    profileHero: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: P.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    avatarLabel: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 38,
    },
    heroName: {
        fontSize: 28,
        fontFamily: 'Gabarito_700Bold',
        color: P.ink,
        letterSpacing: -0.3,
        marginBottom: 4,
        minWidth: 120,
        textAlign: 'center',
    },
    heroEmail: {
        fontSize: 13,
        color: P.faint,
        letterSpacing: 0.1,
    },
    savingDot: {
        marginTop: 6,
        fontSize: 10,
        color: P.faint,
        letterSpacing: 0.5,
    },

    /* Sections */
    sectionLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: P.faint,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginBottom: 6,
        marginLeft: 4,
    },
    section: {
        backgroundColor: P.bg,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: P.border,
        marginBottom: 28,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    rowLabel: {
        fontSize: 15,
        color: P.ink,
        fontWeight: '500',
    },
    rowValue: {
        fontSize: 14,
        color: P.faint,
        maxWidth: '55%',
        textAlign: 'right',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: P.border,
        marginLeft: 16,
    },

    /* Segmented control */
    segmented: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f2',
        borderRadius: 8,
        padding: 2,
        gap: 2,
    },
    segBtn: {
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 6,
    },
    segBtnActive: {
        backgroundColor: P.bg,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    segBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: P.faint,
    },
    segBtnTextActive: {
        color: P.ink,
    },

    /* Danger row */
    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    dangerText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#c0392b',
    },
    dangerChevron: {
        fontSize: 14,
        color: '#c0392b',
        opacity: 0.6,
    },
});
