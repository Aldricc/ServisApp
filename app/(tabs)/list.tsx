import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { getInstansis, saveInstansi, deleteInstansi, updateInstansi, getServiceData, ServiceItem } from '../../utils/storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

type InstansiStats = {
    name: string;
    total: number;
    active: number;
};

export default function InstansiScreen() {
    const router = useRouter();
    const [instansis, setInstansis] = useState<string[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states for Add/Edit
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');

    const loadData = async () => {
        const storedInstansis = await getInstansis();
        const storedServices = await getServiceData();
        setInstansis(storedInstansis);
        setServices(storedServices);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleSave = async () => {
        if (!inputValue.trim()) return;

        if (editingItem) {
            if (inputValue.trim() === editingItem) {
                setModalVisible(false);
                return;
            }
            const success = await updateInstansi(editingItem, inputValue.trim());
            if (success) {
                setModalVisible(false);
                loadData();
            } else {
                Alert.alert('Gagal', 'Gagal mengubah nama instansi. Mungkin nama sudah dipakai.');
            }
        } else {
            const success = await saveInstansi(inputValue.trim());
            if (success) {
                setModalVisible(false);
                setInputValue('');
                loadData();
            } else {
                Alert.alert('Gagal', 'Instansi sudah ada atau terjadi kesalahan.');
            }
        }
    };

    const confirmDelete = (name: string) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Hapus instansi "${name}"?`);
            if (confirmed) {
                deleteInstansi(name).then(success => {
                    if (success) {
                        setModalVisible(false);
                        loadData();
                    } else {
                        window.alert('Gagal menghapus instansi.');
                    }
                });
            }
        } else {
            Alert.alert('Konfirmasi Hapus', `Hapus instansi "${name}"?`, [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteInstansi(name);
                        if (success) {
                            setModalVisible(false);
                            loadData();
                        } else {
                            Alert.alert('Error', 'Gagal menghapus instansi.');
                        }
                    },
                },
            ]);
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setInputValue('');
        setModalVisible(true);
    };

    const openEditModal = (name: string) => {
        setEditingItem(name);
        setInputValue(name);
        setModalVisible(true);
    };

    // Calculate stats
    const statsData: InstansiStats[] = instansis.map(instansiName => {
        const instansiServices = services.filter(s => s.instansi === instansiName);
        const total = instansiServices.length;
        const active = instansiServices.filter(s => !s.tanggalKeluar).length;
        return { name: instansiName, total, active };
    });

    // Filter
    const filteredStats = statsData.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: InstansiStats }) => {
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/instansi/${item.name}` as any)}
                onLongPress={() => openEditModal(item.name)}
                activeOpacity={0.7}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>
                        {item.total} Total Servis • {item.active} Aktif
                    </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Daftar Servis</Text>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchFilterContainer}>
                <View style={styles.searchBar}>
                    <Text style={{ color: '#9CA3AF', paddingHorizontal: 4 }}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterText}>Filter =</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {instansis.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <IconSymbol name="building.columns" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>Belum Ada Data</Text>
                    <Text style={styles.emptyText}>Silakan tambah data pertama Anda.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredStats}
                    keyExtractor={(item) => item.name}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB for Adding Instansi */}
            <TouchableOpacity
                style={styles.fab}
                onPress={openAddModal}
            >
                <IconSymbol name="plus" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Modal Add/Edit */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalBackground}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit Data' : 'Tambah Data'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <IconSymbol name="xmark" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Nama Klien/Instansi"
                            value={inputValue}
                            onChangeText={setInputValue}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            {editingItem && (
                                <TouchableOpacity
                                    style={styles.btnDelete}
                                    onPress={() => confirmDelete(editingItem)}
                                >
                                    <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                                <Text style={styles.btnSaveText}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Lighter background
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    searchFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        marginTop: 8,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        height: 48,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#111827',
        ...(Platform.OS === 'web' && {
            outlineStyle: 'none',
        }),
    } as any,
    filterButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Make room for FAB
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 6,
    },
    cardSubtitle: {
        fontSize: 15,
        color: '#4B5563',
    },
    fab: {
        position: 'absolute',
        bottom: 24, // adjust if bottom tab bar overlaps
        right: 24,
        backgroundColor: '#059669', // Emerald Green for Instansi
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 10,
    },
    // Modal Styles
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        marginBottom: 24,
        ...(Platform.OS === 'web' && {
            outlineStyle: 'none',
        }),
    } as any,
    modalActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnSave: {
        flex: 1,
        backgroundColor: '#059669',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnSaveText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnDelete: {
        backgroundColor: '#EF4444',
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
