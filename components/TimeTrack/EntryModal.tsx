import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { calcScore, fmtDur, fmtTime } from '../../utils/timeMath';
import { ScoreArc } from './ScoreArc';
import { P } from './Theme';

interface Habit {
    id: string;
    name: string;
    emoji: string;
    color: string;
    startTime: string;
    endTime: string;
}

interface Entry {
    startTime: string;
    endTime: string;
}

interface Props {
    visible: boolean;
    habit: Habit | null;
    entry: Entry | null;
    onClose: () => void;
    onSave: (habit: Habit, startTime: string, endTime: string) => void;
    onDelete: (habit: Habit) => void;
}

export function EntryModal({ visible, habit, entry, onClose, onSave, onDelete }: Props) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        if (habit) {
            if (entry) {
                setStartTime(entry.startTime);
                setEndTime(entry.endTime);
            } else {
                setStartTime(habit.startTime);
                setEndTime(habit.endTime);
            }
        }
    }, [habit, entry]);

    if (!habit) return null;

    const preview = calcScore(habit, { startTime, endTime });
    const msgs = ["sin overlap", "algo de overlap", "más de la mitad", "bastante bien", "muy cercano", "casi exacto"];
    const mi = Math.min(5, Math.floor(preview / 20));

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={styles.modal} onPress={() => {}}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.emoji, { color: habit.color }]}>{habit.emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.habitName}>{habit.name}</Text>
                            <Text style={styles.objective}>
                                objetivo · {fmtTime(habit.startTime)} → {fmtTime(habit.endTime)} · {fmtDur(habit.startTime, habit.endTime)}
                            </Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lbl}>INICIO REAL</Text>
                            <TextInput
                                style={styles.ti}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="HH:MM"
                                placeholderTextColor={P.faint}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lbl}>FIN REAL</Text>
                            <TextInput
                                style={styles.ti}
                                value={endTime}
                                onChangeText={setEndTime}
                                placeholder="HH:MM"
                                placeholderTextColor={P.faint}
                            />
                        </View>
                    </View>

                    {/* Preview */}
                    <View style={styles.previewBox}>
                        <ScoreArc value={preview} color={habit.color} size={52} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: P.sub }}>
                                <Text style={{ color: P.ink }}>{fmtDur(startTime, endTime)}</Text> registrado
                            </Text>
                            <Text style={{ fontSize: 12, color: P.sub }}>
                                <Text style={{ color: P.ink }}>{fmtDur(habit.startTime, habit.endTime)}</Text> objetivo
                            </Text>
                            <Text style={{ color: P.sub, fontStyle: 'italic', fontSize: 14 }}>{msgs[mi]}</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {entry && (
                            <TouchableOpacity style={styles.delBtn} onPress={() => onDelete(habit)}>
                                <Text style={styles.delBtnText}>eliminar</Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: habit.color }]}
                            onPress={() => onSave(habit, startTime, endTime)}
                        >
                            <Text style={styles.saveBtnText}>
                                {entry ? "actualizar" : "registrar"}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: P.border,
    },
    emoji: {
        fontSize: 24,
    },
    habitName: {
        fontSize: 18,
        fontWeight: '500',
        color: P.ink,
        marginBottom: 3,
    },
    objective: {
        fontSize: 10,
        color: P.mute,
        letterSpacing: 0.5,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
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
        fontSize: 15,
        textAlign: 'center',
    },
    previewBox: {
        backgroundColor: P.bg,
        borderWidth: 1,
        borderColor: P.border,
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    delBtn: {
        borderWidth: 1,
        borderColor: P.border,
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 7,
    },
    delBtnText: {
        fontSize: 11,
        color: P.mute,
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
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 7,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: '600',
    },
});
