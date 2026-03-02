import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSheetsAutoSync } from '@/hooks/useSheetsAutoSync';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView, Platform, ScrollView, StatusBar,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearSheetsApiUrl, getSheetsApiUrl, saveSheetsApiUrl } from '../../utils/sheetsApi';

const GlassCard = ({ children, style }: any) => (
    <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }, style]}>
        {children}
    </View>
);

export default function SettingsScreen() {
    const [url, setUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { syncStatus, lastSynced, syncNow } = useSheetsAutoSync();

    useEffect(() => { loadUrl(); }, []);
    const loadUrl = async () => {
        const savedUrl = await getSheetsApiUrl();
        if (savedUrl) setUrl(savedUrl);
    };

    const handleSave = async () => {
        if (!url.trim()) { Alert.alert('Error', 'URL tidak boleh kosong.'); return; }
        setIsSaving(true);
        const success = await saveSheetsApiUrl(url);
        setIsSaving(false);
        if (success) {
            Alert.alert('Sukses', 'URL berhasil disimpan! Auto-sync aktif.');
            syncNow();
        } else {
            Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan URL.');
        }
    };

    const handleClear = async () => {
        Alert.alert('Putuskan Koneksi?', 'Auto-sync akan berhenti.', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Putuskan', style: 'destructive',
                onPress: async () => {
                    const success = await clearSheetsApiUrl();
                    if (success) { setUrl(''); }
                }
            }
        ]);
    };

    const getSyncLabel = () => {
        switch (syncStatus) {
            case 'syncing': return { text: '⟳  Menyinkronkan...', color: '#007AFF' };
            case 'synced': return {
                text: `✓  Tersinkron${lastSynced ? ' • ' + formatRelative(lastSynced) : ''}`,
                color: '#10B981'
            };
            case 'error': return { text: '✕  Gagal sync', color: '#EF4444' };
            case 'no-url': return { text: '—  URL belum diatur', color: '#9CA3AF' };
            default: return { text: '—  Menunggu...', color: '#9CA3AF' };
        }
    };

    const formatRelative = (date: Date) => {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return 'baru saja';
        if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
        return `${Math.floor(diff / 3600)} jam lalu`;
    };

    const syncLabel = getSyncLabel();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <View style={styles.header}>
                <Text style={styles.headerSub}>Konfigurasi</Text>
                <Text style={styles.headerTitle}>Pengaturan ⚙️</Text>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Sync Status Card */}
                    <GlassCard style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBox, { backgroundColor: '#007AFF' }]}>
                                <IconSymbol name="cloud.fill" size={20} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Google Sheets Auto-Sync</Text>
                                <Text style={[styles.syncStatusText, { color: syncLabel.color }]}>{syncLabel.text}</Text>
                            </View>
                            <TouchableOpacity style={styles.syncNowBtn} onPress={syncNow} disabled={syncStatus === 'syncing'}>
                                <Text style={styles.syncNowText}>Sync</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.description}>
                            Data otomatis tersinkronisasi setiap 10 detik dan saat app dibuka. Push ke Sheets terjadi setiap kali ada perubahan data.
                        </Text>

                        <Text style={styles.label}>Web App URL</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://script.google.com/macros/s/..."
                            placeholderTextColor="rgba(0,0,0,0.35)"
                            value={url}
                            onChangeText={setUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            multiline
                        />

                        <View style={styles.rowButtons}>
                            <TouchableOpacity
                                style={[styles.btnPrimary, isSaving && styles.btnDisabled]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                <Text style={styles.btnPrimaryText}>
                                    {isSaving ? 'Menyimpan...' : 'Simpan URL'}
                                </Text>
                            </TouchableOpacity>
                            {url !== '' && (
                                <TouchableOpacity style={styles.btnOutlineDanger} onPress={handleClear}>
                                    <Text style={styles.btnDangerText}>Putuskan</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </GlassCard>

                    {/* App Info Card */}
                    <GlassCard style={styles.card}>
                        <Text style={styles.cardTitle}>Tentang Aplikasi</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Versi</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nama App</Text>
                            <Text style={styles.infoValue}>FlashCom</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Developer</Text>
                            <Text style={styles.infoValue}>Aldricc/Junet</Text>
                        </View>
                    </GlassCard>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    headerSub: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 2 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    card: { padding: 18 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    cardIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
    syncStatusText: { fontSize: 12, fontWeight: '600' },
    syncNowBtn: { backgroundColor: 'rgba(0,122,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    syncNowText: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
    description: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: {
        backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E5E7EB',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 13, color: '#0F172A', minHeight: 72, textAlignVertical: 'top', marginBottom: 14,
    },
    rowButtons: { flexDirection: 'row', gap: 10 },
    btnPrimary: { flex: 1, backgroundColor: '#007AFF', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    btnOutlineDanger: { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#EF4444', alignItems: 'center' },
    btnDangerText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    infoLabel: { fontSize: 14, color: '#6B7280' },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
});
