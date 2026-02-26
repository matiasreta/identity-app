import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface Props {
    curve: any[];
    color: string;
    height?: number;
}

export function Curve({ curve, color, height = 64 }: Props) {
    const W = 400;

    const startIndex = curve.findIndex(p => p.index !== null);
    const activeCurve = startIndex >= 0 ? curve.slice(startIndex) : [];
    const valid = activeCurve.filter(p => p.index !== null);

    if (valid.length < 2) {
        return (
            <View style={{ height, justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, color: '#bbb', fontFamily: 'Courier', fontStyle: 'italic' }}>
                    acumulando datos…
                </Text>
            </View>
        );
    }

    const lo = Math.max(0, Math.min(...valid.map(p => p.index)) - 8);
    const hi = Math.min(100, Math.max(...valid.map(p => p.index)) + 8);
    const rng = hi - lo || 10;

    const pts = activeCurve.map((p, i) => ({
        x: activeCurve.length > 1 ? (i / (activeCurve.length - 1)) * W : W,
        y: p.index !== null ? height - ((p.index - lo) / rng) * (height - 12) - 2 : null,
        ...p
    }));

    let path = "", drawing = false;
    pts.forEach(p => {
        if (p.y === null) { drawing = false; return; }
        path += drawing ? `L${p.x} ${p.y} ` : `M${p.x} ${p.y} `;
        drawing = true;
    });

    const fv = pts.find(p => p.y !== null);
    const lv = [...pts].reverse().find(p => p.y !== null);
    const area = fv && lv ? `${path}L${lv.x} ${height} L${fv.x} ${height}Z` : "";

    const gradientId = `g${color.replace('#', '')}`;

    return (
        <View style={{ width: '100%', height }}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
                <Defs>
                    <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.12" />
                        <Stop offset="1" stopColor={color} stopOpacity="0" />
                    </LinearGradient>
                </Defs>
                {area ? <Path d={area} fill={`url(#${gradientId})`} /> : null}
                <Path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {lv && lv.y !== null ? <Circle cx={lv.x} cy={lv.y} r="3" fill={color} /> : null}
            </Svg>
        </View>
    );
}
