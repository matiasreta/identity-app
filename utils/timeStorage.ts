import AsyncStorage from '@react-native-async-storage/async-storage';

const LS = "timetrack_v5";

export async function loadTimeTrackData() {
    try {
        const data = await AsyncStorage.getItem(LS);
        return JSON.parse(data || "null");
    } catch {
        return null;
    }
}

export async function saveTimeTrackData(d: any) {
    try {
        await AsyncStorage.setItem(LS, JSON.stringify(d));
    } catch { }
}
