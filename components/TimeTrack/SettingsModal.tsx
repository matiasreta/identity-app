import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../utils/supabase';
import { P } from './Theme';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
    const { user, profile, refreshProfile } = useAuth();
    const { t, locale, setLocale } = useLanguage();
    const [displayName, setDisplayName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setDisplayName(profile?.display_name || '');
        }
    }, [visible, profile]);

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
        onClose();
    };

    const handleLanguageToggle = () => {
        setLocale(locale === 'en' ? 'es' : 'en');
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>{t('settings.title')}</Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.label}>{t('settings.name')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TextInput
                                style={[styles.value, styles.nameInput]}
                                value={displayName}
                                onChangeText={setDisplayName}
                                onBlur={handleSaveName}
                                placeholder="—"
                                placeholderTextColor={P.mute}
                            />
                            {saving && <Text style={{ fontSize: 10, color: P.mute }}>...</Text>}
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.label}>{t('settings.email')}</Text>
                        <Text style={styles.value}>{user?.email || t('settings.noEmail')}</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.label}>{t('settings.language')}</Text>
                        <TouchableOpacity onPress={handleLanguageToggle} style={styles.langToggle}>
                            <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>EN</Text>
                            <Text style={styles.langDivider}>|</Text>
                            <Text style={[styles.langText, locale === 'es' && styles.langTextActive]}>ES</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
                            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>{t('settings.back')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20
    },
    card: {
        backgroundColor: P.bg,
        borderRadius: 16,
        padding: 24,
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: P.ink,
        marginBottom: 20
    },
    infoBox: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: P.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: P.border
    },
    label: {
        fontSize: 11,
        color: P.mute,
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    value: {
        fontSize: 15,
        color: P.ink,
        fontWeight: '500'
    },
    nameInput: {
        flex: 1,
        padding: 0,
        margin: 0,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: P.border
    },
    cancelText: {
        fontSize: 13,
        fontWeight: '600',
        color: P.ink
    },
    logoutBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#a63d2f'
    },
    logoutText: {
        fontSize: 13,
        fontWeight: '600',
        color: P.bg
    },
    langToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    langText: {
        fontSize: 15,
        color: P.mute,
        fontWeight: '500'
    },
    langTextActive: {
        color: P.primary,
        fontWeight: '700'
    },
    langDivider: {
        fontSize: 15,
        color: P.border,
        marginHorizontal: 8,
    }
});
