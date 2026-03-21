import React, { useCallback, useRef } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { P } from './Theme';

const ITEM_H = 44;
const VISIBLE = 5; // odd number → selected in center
const DRUM_H = ITEM_H * VISIBLE;

function padZ(n: number) {
    return String(n).padStart(2, '0');
}

const HOURS = Array.from({ length: 24 }, (_, i) => padZ(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => padZ(i));

interface WheelProps {
    items: string[];
    selected: string;
    onSelect: (val: string) => void;
}

function Wheel({ items, selected, onSelect }: WheelProps) {
    const scrollRef = useRef<ScrollView>(null);
    const idx = items.indexOf(selected);
    const initialOffset = Math.max(0, idx) * ITEM_H;
    const mounted = useRef(false);

    const handleMomentumEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = e.nativeEvent.contentOffset.y;
            const snapped = Math.round(y / ITEM_H);
            const clamped = Math.max(0, Math.min(items.length - 1, snapped));
            onSelect(items[clamped]);
        },
        [items, onSelect]
    );

    return (
        <View style={wheel.container}>
            {/* selection highlight */}
            <View style={wheel.selectionBar} pointerEvents="none" />

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                contentOffset={{ x: 0, y: initialOffset }}
                onLayout={() => {
                    if (!mounted.current) {
                        mounted.current = true;
                        scrollRef.current?.scrollTo({ y: initialOffset, animated: false });
                    }
                }}
                onMomentumScrollEnd={handleMomentumEnd}
                onScrollEndDrag={handleMomentumEnd}
            >
                {items.map((val) => (
                    <View key={val} style={wheel.item}>
                        <Text style={[wheel.itemText, val === selected && wheel.itemTextSelected]}>
                            {val}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            {/* fade top */}
            <View style={[wheel.fade, wheel.fadeTop]} pointerEvents="none" />
            {/* fade bottom */}
            <View style={[wheel.fade, wheel.fadeBottom]} pointerEvents="none" />
        </View>
    );
}

const wheel = StyleSheet.create({
    container: {
        height: DRUM_H,
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    selectionBar: {
        position: 'absolute',
        top: ITEM_H * 2,
        left: 0,
        right: 0,
        height: ITEM_H,
        backgroundColor: 'rgba(38, 86, 147, 0.08)',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(38, 86, 147, 0.18)',
        borderRadius: 8,
        zIndex: 1,
    },
    item: {
        height: ITEM_H,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 22,
        color: P.mute,
        fontWeight: '300',
        letterSpacing: 1,
    },
    itemTextSelected: {
        color: P.ink,
        fontWeight: '600',
        fontSize: 26,
    },
    fade: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: ITEM_H * 2,
        zIndex: 2,
    },
    fadeTop: {
        top: 0,
        // gradient from bg to transparent
        backgroundColor: 'rgba(255,255,255,0)',
        // We fake the gradient with a View overlay approach:
        // Use borderless shadow-like gradient via multiple semi-transparent views
    },
    fadeBottom: {
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0)',
    },
});

/* ─────────────── Public component ─────────────── */

interface IOSTimePickerProps {
    /** Label shown above the picker (e.g. "INICIO" or "FIN") */
    label: string;
    /** Current value in "HH:MM" */
    value: string;
    onChange: (value: string) => void;
}

export function IOSTimePicker({ label, value, onChange }: IOSTimePickerProps) {
    const [hh, mm] = value.split(':').length === 2 ? value.split(':') : ['09', '00'];

    return (
        <View style={picker.wrapper}>
            <Text style={picker.label}>{label}</Text>
            <View style={picker.row}>
                <Wheel
                    items={HOURS}
                    selected={hh}
                    onSelect={(h) => onChange(`${h}:${mm}`)}
                />
                <Text style={picker.colon}>:</Text>
                <Wheel
                    items={MINUTES}
                    selected={mm}
                    onSelect={(m) => onChange(`${hh}:${m}`)}
                />
            </View>
        </View>
    );
}

const picker = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    label: {
        fontSize: 9,
        color: P.sub,
        letterSpacing: 1.4,
        marginBottom: 6,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: P.bg,
        borderWidth: 1,
        borderColor: P.border,
        borderRadius: 12,
        overflow: 'hidden',
        paddingHorizontal: 4,
    },
    colon: {
        fontSize: 24,
        color: P.ink,
        fontWeight: '300',
        paddingHorizontal: 4,
        marginTop: -4,
    },
});

/* ─────────────── Pair: start + end inside a modal sheet ─────────────── */

interface IOSTimeRangePickerModalProps {
    visible: boolean;
    startLabel?: string;
    endLabel?: string;
    startValue: string;
    endValue: string;
    onChangeStart: (v: string) => void;
    onChangeEnd: (v: string) => void;
    onClose: () => void;
}

export function IOSTimeRangePickerModal({
    visible,
    startLabel = 'INICIO',
    endLabel = 'FIN',
    startValue,
    endValue,
    onChangeStart,
    onChangeEnd,
    onClose,
}: IOSTimeRangePickerModalProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose} />
            <View style={sheet.container}>
                <View style={sheet.handle} />
                <View style={sheet.pickersRow}>
                    <IOSTimePicker label={startLabel} value={startValue} onChange={onChangeStart} />
                    <View style={sheet.separator} />
                    <IOSTimePicker label={endLabel} value={endValue} onChange={onChangeEnd} />
                </View>
                <TouchableOpacity style={sheet.doneBtn} onPress={onClose}>
                    <Text style={sheet.doneBtnText}>Listo</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const sheet = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    container: {
        backgroundColor: P.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 36,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: P.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    pickersRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    separator: {
        width: 1,
        backgroundColor: P.border,
        alignSelf: 'stretch',
        marginTop: 22,
    },
    doneBtn: {
        marginTop: 20,
        backgroundColor: P.secondary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
