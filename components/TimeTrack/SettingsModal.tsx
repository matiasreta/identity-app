import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { P } from './Theme';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
    const { user } = useAuth();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>Perfil</Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{user?.email || 'Sin email'}</Text>
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
                            <Text style={styles.logoutText}>cerrar sesión</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>volver</Text>
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
    }
});
