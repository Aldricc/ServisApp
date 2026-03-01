import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSheetsApiUrl, saveSheetsApiUrl, clearSheetsApiUrl, syncDataToGoogleSheets, pullDataFromGoogleSheets } from '../../utils/sheetsApi';
import { getServiceData, overwriteServiceData } from '../../utils/storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
    const [url, setUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

    useEffect(() => {
        loadUrl();
    }, []);

    const loadUrl = async () => {
        const savedUrl = await getSheetsApiUrl();
        if (savedUrl) setUrl(savedUrl);
    };

    const handleSave = async () => {
        if (!url.trim()) {
            Alert.alert('Error', 'URL tidak boleh kosong.');
            return;
        }

        setIsSaving(true);
        const success = await saveSheetsApiUrl(url);
        setIsSaving(false);

        if (success) {
            Alert.alert('Sukses', 'URL Google Apps Script berhasil disimpan!');
        } else {
            Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan URL.');
        }
    };

    const handleClear = async () => {
        const success = await clearSheetsApiUrl();
        if (success) {
            setUrl('');
            Alert.alert('Sukses', 'Integrasi Google Sheets telah diputus.');
        }
    };

    const handleSyncAll = async () => {
        if (!url.trim()) {
            Alert.alert('Perhatian', 'Harap simpan URL Web App terlebih dahulu sebelum menyinkronkan data.');
            return;
        }

        setIsSyncing(true);
        try {
            const allData = await getServiceData();
            if (allData.length === 0) {
                Alert.alert('Info', 'Tidak ada data servis untuk disinkronkan.');
                setIsSyncing(false);
                return;
            }

            const success = await syncDataToGoogleSheets(allData);
            if (success) {
                Alert.alert('Sukses', `Berhasil menyinkronkan ${allData.length} data ke Google Sheets!`);
            } else {
                Alert.alert('Gagal', 'Terjadi kesalahan saat menyinkronkan data.');
            }
        } catch (error) {
            console.error('Manual sync error:', error);
            Alert.alert('Terjadi Kesalahan', 'Gagal memproses sinkronisasi.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePullAll = async () => {
        if (!url.trim()) {
            Alert.alert('Perhatian', 'Harap simpan URL Web App terlebih dahulu sebelum mengunduh data.');
            return;
        }

        Alert.alert(
            'Konfirmasi Unduh',
            'Sistem akan mengambil data terbaru dari Google Sheets dan menimpa SEMUA data yang ada di HP Anda saat ini dengan versi Spreadsheet. Lanjutkan?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Lanjutkan',
                    style: 'destructive',
                    onPress: async () => {
                        setIsPulling(true);
                        try {
                            const result = await pullDataFromGoogleSheets();
                            if (result.success && result.data) {
                                const overwriteSuccess = await overwriteServiceData(result.data);
                                if (overwriteSuccess) {
                                    Alert.alert('Sukses', `Berhasil mengunduh dan menimpa ${result.data.length} data ke HP Anda!`);
                                } else {
                                    Alert.alert('Gagal', 'Terjadi kesalahan saat memproses penyimpanan data di HP.');
                                }
                            } else {
                                Alert.alert('Gagal Mengunduh', result.message || 'Tidak mendapat respon yang valid dari server.');
                            }
                        } catch (e) {
                            console.error('Manual pull error:', e);
                            Alert.alert('Terjadi Kesalahan', 'Gagal memproses pengunduhan.');
                        } finally {
                            setIsPulling(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pengaturan</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <IconSymbol name="cloud.fill" size={24} color="#34C759" style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>Integrasi Google Sheets</Text>
                        </View>

                        <Text style={styles.description}>
                            Tempelkan URL Web App dari Google Apps Script untuk mengaktifkan sinkronisasi data secara langsung ke akun Google Sheets / Excel Online Anda.
                        </Text>

                        <Text style={styles.label}>Web App URL</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://script.google.com/macros/s/..."
                            placeholderTextColor="#9CA3AF"
                            value={url}
                            onChangeText={setUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton, isSaving && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={isSaving || isSyncing || isPulling}
                            >
                                <Text style={styles.buttonText}>{isSaving ? 'Menyimpan...' : 'Simpan URL'}</Text>
                            </TouchableOpacity>

                            {url !== '' && (
                                <TouchableOpacity
                                    style={[styles.button, styles.clearButton]}
                                    onPress={handleClear}
                                    disabled={isSaving || isSyncing || isPulling}
                                >
                                    <Text style={[styles.buttonText, { color: '#EF4444' }]}>Putuskan</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {url !== '' && (
                            <View style={styles.syncContainer}>
                                <Text style={styles.syncDescription}>
                                    Data baru akan otomatis diunggah (Push). Tetapi Anda dapat menekan tombol di bawah untuk mendorong ulang semua data ke internet, atau menarik (Pull) data gubahan dari Spreadsheet untuk menimpa file di HP.
                                </Text>
                                <View style={{ gap: 10 }}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.syncButton, (isSaving || isSyncing || isPulling) && { opacity: 0.7 }]}
                                        onPress={handleSyncAll}
                                        disabled={isSaving || isSyncing || isPulling}
                                    >
                                        <IconSymbol name="arrow.up.circle.fill" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>{isSyncing ? 'Mengunggah...' : 'Unggah Semua Data'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.button, styles.pullButton, (isSaving || isSyncing || isPulling) && { opacity: 0.7 }]}
                                        onPress={handlePullAll}
                                        disabled={isSaving || isSyncing || isPulling}
                                    >
                                        <IconSymbol name="arrow.down.circle.fill" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>{isPulling ? 'Mengunduh...' : 'Unduh Data (Replace)'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        minHeight: 80, // Allow for long URLs
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    clearButton: {
        backgroundColor: '#FEE2E2',
    },
    syncContainer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    syncDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 12,
    },
    syncButton: {
        backgroundColor: '#34C759', // Green color
        flexDirection: 'row',
    },
    pullButton: {
        backgroundColor: '#FF9500', // Orange color
        flexDirection: 'row',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});
