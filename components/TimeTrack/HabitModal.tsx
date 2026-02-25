import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { P } from './Theme';

interface Habit {
    id: string;
    name: string;
    emoji: string;
    color: string;
    startTime: string;
    endTime: string;
}

interface Props {
    visible: boolean;
    habit: Habit | null;
    onSave: (form: { name: string; emoji: string; color: string; startTime: string; endTime: string }) => void;
    onClose: () => void;
}

const EMPTY_FORM = { name: '', emoji: '◈', color: '#5c6ac4', startTime: '09:00', endTime: '10:00' };

export function HabitModal({ visible, habit, onSave, onClose }: Props) {
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (visible) {
            if (habit) {
                setForm({ name: habit.name, emoji: habit.emoji || '◈', color: habit.color, startTime: habit.startTime, endTime: habit.endTime });
            } else {
                setForm(EMPTY_FORM);
            }
        }
    }, [visible, habit]);

    const isEditing = !!habit;
    const canSave = form.name.trim().length > 0;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={styles.modal} onPress={() => {}}>
                    <Text style={styles.title}>{isEditing ? 'EDITAR HÁBITO' : 'NUEVO HÁBITO'}</Text>

                    <Text style={styles.lbl}>NOMBRE</Text>
                    <TextInput
                        style={[styles.ti, { marginBottom: 14 }]}
                        placeholder="ej: meditación"
                        placeholderTextColor={P.faint}
                        value={form.name}
                        onChangeText={t => setForm(f => ({ ...f, name: t }))}
                        autoFocus={!isEditing}
                    />

                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lbl}>EMOJI</Text>
                            <TextInput
                                style={[styles.ti, { textAlign: 'center' }]}
                                value={form.emoji}
                                onChangeText={t => setForm(f => ({ ...f, emoji: t }))}
                            />
                        </View>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.lbl}>COLOR</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TextInput
                                    style={[styles.ti, { flex: 1 }]}
                                    value={form.color}
                                    onChangeText={t => setForm(f => ({ ...f, color: t }))}
                                />
                                <View style={[styles.colorPreview, { backgroundColor: form.color }]} />
                            </View>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lbl}>INICIO OBJETIVO</Text>
                            <TextInput
                                style={[styles.ti, { textAlign: 'center' }]}
                                value={form.startTime}
                                onChangeText={t => setForm(f => ({ ...f, startTime: t }))}
                                placeholder="HH:MM"
                                placeholderTextColor={P.faint}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lbl}>FIN OBJETIVO</Text>
                            <TextInput
                                style={[styles.ti, { textAlign: 'center' }]}
                                value={form.endTime}
                                onChangeText={t => setForm(f => ({ ...f, endTime: t }))}
                                placeholder="HH:MM"
                                placeholderTextColor={P.faint}
                            />
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, !canSave && { opacity: 0.4 }]}
                            onPress={() => canSave && onSave(form)}
                            disabled={!canSave}
                        >
                            <Text style={styles.saveBtnText}>
                                {isEditing ? 'guardar cambios' : 'crear hábito'}
                            </Text>
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
        backgroundColor: 'rgba(26, 20, 16, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modal: {
        backgroundColor: P.surface,
        borderRadius: 14,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
    },
    title: {
        fontSize: 9,
        color: P.mute,
        letterSpacing: 1.5,
        marginBottom: 20,
    },
    lbl: {
        fontSize: 9,
        color: P.sub,
        letterSpacing: 1.4,
        marginBottom: 5,
    },
    ti: {
        backgroundColor: P.bg,
        borderWidth: 1,
        borderColor: P.border,
        color: P.ink,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        fontSize: 14,
    },
    colorPreview: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: P.border,
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
    saveBtn: {
        backgroundColor: P.ink,
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 7,
    },
    saveBtnText: {
        color: P.bg,
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: '600',
    },
});
