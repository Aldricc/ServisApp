import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getServiceData, deleteServiceItem, updateServiceItem, ServiceItem } from '../../utils/storage';
import { exportInstansiToCsv } from '../../utils/export';
import { formatShortDate } from '../../utils/formatDate';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function InstansiDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // This represents the instansi name
    const instansiName = Array.isArray(id) ? id[0] : id;

    const [services, setServices] = useState<ServiceItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    const [keterangan, setKeterangan] = useState('');

    const loadData = async () => {
        const storedData = await getServiceData();
        // Filter specific to this instansi
        const instansiServices = storedData.filter(s => s.instansi === instansiName);
        setServices(instansiServices.reverse());
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [instansiName])
    );

    const handleDelete = (serviceId: string) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Apakah Anda yakin ingin menghapus data service ini?');
            if (confirmed) {
                deleteServiceItem(serviceId).then(success => {
                    if (success) {
                        loadData();
                    } else {
                        window.alert('Gagal menghapus data.');
                    }
                });
            }
        } else {
            Alert.alert('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus data service ini?', [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteServiceItem(serviceId);
                        if (success) {
                            loadData();
                        } else {
                            Alert.alert('Error', 'Gagal menghapus data.');
                        }
                    },
                },
            ]);
        }
    };

    const openEditModal = (item: ServiceItem) => {
        setSelectedService(item);
        setKeterangan(item.keteranganPerbaikan || '');
        setModalVisible(true);
    };

    const handleSaveKeterangan = async () => {
        if (selectedService) {
            const success = await updateServiceItem(selectedService.id, {
                keteranganPerbaikan: keterangan
            });
            if (success) {
                setModalVisible(false);
                loadData();
            } else {
                Alert.alert('Error', 'Gagal menyimpan keterangan.');
            }
        }
    };

    const handleSelesai = async () => {
        if (selectedService) {
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const success = await updateServiceItem(selectedService.id, {
                tanggalKeluar: today,
                keteranganPerbaikan: keterangan
            });
            if (success) {
                setModalVisible(false);
                loadData();
            } else {
                Alert.alert('Error', 'Gagal update status.');
            }
        }
    };

    const handleExport = async () => {
        const result = await exportInstansiToCsv(instansiName, services);
        if (!result.success && result.message) {
            Alert.alert('Informasi Ekspor', result.message);
        }
    };

    // derived stats
    const activeCount = services.filter(s => !s.tanggalKeluar).length;
    const doneCount = services.filter(s => s.tanggalKeluar).length;
    const pendingCount = services.filter(s => !s.tanggalKeluar && (Date.now() - s.createdAt) > 3 * 24 * 60 * 60 * 1000).length;

    const filteredServices = services.filter(s =>
        s.namaBarang.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusInfo = (item: ServiceItem) => {
        if (item.tanggalKeluar) {
            return { label: 'Selesai', color: '#10B981', bgColor: '#D1FAE5' }; // Green
        }
        return { label: 'Masuk', color: '#007AFF', bgColor: '#E6F4FE' }; // Blue
    };

    const renderServiceCard = ({ item }: { item: ServiceItem }) => {
        const statusInfo = getStatusInfo(item);
        return (
            <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardInstansi}>ID Servis: {item.id.substring(0, 8)}...</Text>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={styles.deleteBtn}>
                        <IconSymbol name="trash.fill" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.cardBarang} numberOfLines={1}>Nama Barang: {item.namaBarang}</Text>
                <View style={styles.cardFooter}>
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabelText}>Status: </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                            <Text style={styles.statusBadgeText}>{statusInfo.label}</Text>
                        </View>
                    </View>
                    <Text style={styles.cardDate}>
                        Masuk: {formatShortDate(item.tanggalMasuk)}
                        {item.tanggalKeluar ? `\nSelesai: ${formatShortDate(item.tanggalKeluar)}` : ''}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header Baru */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back() } else { router.push('/') } }}>
                    <IconSymbol name="chevron.left" size={24} color="#8E8E93" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{instansiName}</Text>

                <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                    <IconSymbol name="square.and.arrow.up" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                {/* Card: Aktif */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <View style={[styles.summaryIconBox, { backgroundColor: '#007AFF' }]}>
                            <IconSymbol name="wrench.and.screwdriver.fill" size={14} color="#FFFFFF" />
                        </View>
                        <Text style={styles.summaryLabel}>Servis Aktif</Text>
                    </View>
                    <Text style={styles.summaryCount}>{activeCount}</Text>
                </View>

                {/* Card: Selesai */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <View style={[styles.summaryIconBox, { backgroundColor: '#10B981' }]}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#FFFFFF" />
                        </View>
                        <Text style={styles.summaryLabel}>Selesai</Text>
                    </View>
                    <Text style={styles.summaryCount}>{doneCount}</Text>
                </View>

                {/* Card: Tertunda */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <View style={[styles.summaryIconBox, { backgroundColor: '#F59E0B' }]}>
                            <IconSymbol name="clock.fill" size={14} color="#FFFFFF" />
                        </View>
                        <Text style={styles.summaryLabel}>Tertunda</Text>
                    </View>
                    <Text style={styles.summaryCount}>{pendingCount}</Text>
                </View>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchFilterContainer}>
                <View style={styles.searchBar}>
                    <Text style={{ color: '#9CA3AF', paddingHorizontal: 4 }}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search barang..."
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
            <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id}
                renderItem={renderServiceCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Tidak ada data servis untuk instansi ini.</Text>
                    </View>
                }
            />

            {/* Modal Detail & Update Keterangan */}
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
                        {selectedService && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Detail & Update Servis</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Text style={styles.closeModalText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalContent}>
                                    <Text style={styles.modalLabel}>Instansi: {selectedService.instansi}</Text>
                                    <Text style={styles.modalLabel}>Barang: {selectedService.namaBarang}</Text>
                                    <Text style={styles.modalLabel}>Tanggal Masuk: {formatShortDate(selectedService.tanggalMasuk)}</Text>
                                    {selectedService.tanggalKeluar && (
                                        <Text style={styles.modalLabel}>Tanggal Selesai: {formatShortDate(selectedService.tanggalKeluar)}</Text>
                                    )}
                                    <Text style={[styles.modalLabel, { marginTop: 12 }]}>Keterangan Perbaikan:</Text>
                                    <TextInput
                                        style={styles.textArea}
                                        multiline
                                        numberOfLines={4}
                                        placeholder="Tuliskan detail perbaikan atau catatan di sini..."
                                        placeholderTextColor="#9CA3AF"
                                        value={keterangan}
                                        onChangeText={setKeterangan}
                                    />
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSaveKeterangan}>
                                        <Text style={styles.actionButtonText}>Simpan Keterangan</Text>
                                    </TouchableOpacity>

                                    {!selectedService.tanggalKeluar && (
                                        <TouchableOpacity style={[styles.actionButton, styles.doneButton]} onPress={handleSelesai}>
                                            <Text style={styles.actionButtonText}>Tandai Selesai</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* FAB to add specifically for this instansi */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push(`/add?instansi=${encodeURIComponent(instansiName as string)}`)}
            >
                <IconSymbol name="plus" size={32} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Lighter UI background
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
        flex: 1,
        textAlign: 'center',
    },
    exportBtn: {
        padding: 4,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    summaryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryIconBox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    summaryIconNumber: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    summaryCount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
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
    },
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
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    cardInstansi: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        flex: 1,
    },
    deleteBtn: {
        padding: 4,
    },
    cardBarang: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusLabelText: {
        fontSize: 14,
        color: '#4B5563',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 4,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    cardDate: {
        fontSize: 13,
        color: '#6B7280',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
    },
    fab: {
        position: 'absolute',
        bottom: 24, // adjust if bottom tab bar overlaps
        right: 24,
        backgroundColor: '#007AFF', // Match Add button
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 10,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeModalText: {
        fontSize: 20,
        color: '#9CA3AF',
        padding: 4,
    },
    modalContent: {
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
        fontWeight: '500',
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#111827',
        marginTop: 8,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    modalActions: {
        flexDirection: 'column',
        gap: 12,
    },
    actionButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#F59E0B', // Yellow/Orange for just updating notes
    },
    doneButton: {
        backgroundColor: '#10B981', // Green for marking as Done
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    }
});
