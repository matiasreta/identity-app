import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
    value: number | null;
    color: string;
    size?: number;
}

export function ScoreArc({ value, color, size = 52 }: Props) {
    const r = size * 0.36;
    const c = 2 * Math.PI * r;
    const pct = value === null ? 0 : value / 100;

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e4e9" strokeWidth="2.5" />
                <Circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={value === null ? "#c8cbd0" : color} strokeWidth="2.5"
                    strokeDasharray={c} strokeDashoffset={c - pct * c}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <Text style={[styles.text, { color: value === null ? '#9da3ae' : color }]}>
                {value === null ? "—" : `${value}%`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        fontFamily: 'CormorantGaramond_500Medium',
    }
});
