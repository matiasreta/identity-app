import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { P } from './Theme';

interface Habit {
    id: string;
    name: string;
    emoji: string;
    color: string;
}

interface Props {
    visible: boolean;
    habit: Habit | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({ visible, habit, onConfirm, onCancel }: Props) {
    if (!habit) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
                <TouchableOpacity activeOpacity={1} style={styles.modal} onPress={() => {}}>
                    <View style={styles.header}>
                        <Text style={[styles.emoji, { color: habit.color }]}>{habit.emoji}</Text>
                        <Text style={styles.habitName}>{habit.name}</Text>
                    </View>

                    <Text style={styles.message}>¿eliminar este hábito?</Text>
                    <Text style={styles.sub}>se eliminará el hábito pero se conservarán los registros existentes.</Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelBtnText}>cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm}>
                            <Text style={styles.deleteBtnText}>eliminar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 20, 25, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modal: {
        backgroundColor: P.surface,
        borderRadius: 14,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: P.border,
    },
    emoji: {
        fontSize: 22,
    },
    habitName: {
        fontSize: 17,
        fontWeight: '500',
        color: P.ink,
    },
    message: {
        fontSize: 16,
        color: P.ink,
        marginBottom: 8,
    },
    sub: {
        fontSize: 12,
        color: P.mute,
        lineHeight: 18,
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    cancelBtn: {
        borderWidth: 1,
        borderColor: P.border,
        paddingVertical: 9,
        paddingHorizontal: 18,
        borderRadius: 7,
    },
    cancelBtnText: {
        fontSize: 11,
        color: P.sub,
    },
    deleteBtn: {
        backgroundColor: '#c44',
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 7,
    },
    deleteBtnText: {
        color: '#fff',
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: '600',
    },
});
