import { IconSymbol } from '@/components/ui/icon-symbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExportFormat, exportToPdf, exportToXlsx } from '../../utils/export';
import { formatShortDate } from '../../utils/formatDate';
import { deleteServiceItem, getServiceData, ServiceItem, updateServiceItem } from '../../utils/storage';

const GlassBox = ({ children, style }: any) => (
    <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }, style]}>
        {children}
    </View>
);

// Export Modal Styles (must be before component for TS to resolve)
const emStyles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    },
    handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
    subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 4 },
    formatRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    formatBtn: { flex: 1, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB', padding: 14, alignItems: 'center', backgroundColor: '#FAFAFA' },
    formatBtnActive: { borderColor: '#007AFF', backgroundColor: '#EBF4FF' },
    formatIcon: { fontSize: 28, marginBottom: 6 },
    formatText: { fontSize: 18, fontWeight: '800', color: '#374151' },
    formatTextActive: { color: '#007AFF' },
    formatDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    dateLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
    dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 4 },
    dateBtnText: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
    dateBtnArrow: { fontSize: 11, color: '#9CA3AF' },
    previewBox: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 20 },
    previewText: { fontSize: 14, fontWeight: '600', color: '#065F46' },
    btnExport: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    btnExportText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    closeBtnText: { fontSize: 16, color: '#EF4444', fontWeight: '900' },
});

// Filter Modal Styles (must be before component for TS to resolve)
const fStyles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
    handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
    modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
    modeBtnActive: { backgroundColor: '#007AFF' },
    modeBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    modeBtnTextActive: { color: '#FFFFFF' },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14 },
    dateBtnText: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
    arrow: { fontSize: 12, color: '#9CA3AF' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
    btnReset: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
    btnResetText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
    btnApply: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
    btnApplyText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    closeBtnText: { fontSize: 16, color: '#EF4444', fontWeight: '900' },
});

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
            const now = new Date();
            const today = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
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

    // ── Export Modal State ──
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
    const [exportFrom, setExportFrom] = useState<Date>(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; });
    const [exportTo, setExportTo] = useState<Date>(new Date());
    const [activePicker, setActivePicker] = useState<'from' | 'to' | 'filterDate' | 'filterFrom' | 'filterTo' | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // ── Filter State ──
    type FilterMode = 'all' | 'date' | 'range';
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [filterDate, setFilterDate] = useState<Date>(new Date());
    const [filterFrom, setFilterFrom] = useState<Date>(new Date());
    const [filterTo, setFilterTo] = useState<Date>(new Date());
    const [tempFilterMode, setTempFilterMode] = useState<FilterMode>('all');
    const [tempFilterDate, setTempFilterDate] = useState<Date>(new Date());
    const [tempFilterFrom, setTempFilterFrom] = useState<Date>(new Date());
    const [tempFilterTo, setTempFilterTo] = useState<Date>(new Date());

    const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    const applyFilter = () => {
        setFilterMode(tempFilterMode);
        setFilterDate(tempFilterDate);
        setFilterFrom(tempFilterFrom);
        setFilterTo(tempFilterTo);
        setFilterModalVisible(false);
        setActivePicker(null);
    };

    const resetFilter = () => {
        setTempFilterMode('all');
        setFilterMode('all');
        setFilterModalVisible(false);
        setActivePicker(null);
    };

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const getFilterLabel = () => {
        if (filterMode === 'date') return fmtDate(filterDate);
        if (filterMode === 'range') return `${fmtDate(filterFrom)} – ${fmtDate(filterTo)}`;
        return 'Filter';
    };

    const isFilterActive = filterMode !== 'all';

    const getExportData = () => {
        const from = new Date(exportFrom); from.setHours(0, 0, 0, 0);
        const to = new Date(exportTo); to.setHours(23, 59, 59, 999);
        return services.filter(s => {
            try {
                const d = new Date(s.tanggalMasuk);
                return !isNaN(d.getTime()) && d >= from && d <= to;
            } catch { return false; }
        });
    };

    const handleExport = async () => {
        setIsExporting(true);
        const data = getExportData();
        const safeName = instansiName.replace(/\s+/g, '_');
        const dateStr = `${exportFrom.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}_sd_${exportTo.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}`;
        const filename = `Laporan_${safeName}_${dateStr}`;
        const result = exportFormat === 'xlsx'
            ? await exportToXlsx(data, filename)
            : await exportToPdf(data, filename, instansiName);
        setIsExporting(false);
        if (!result.success) Alert.alert('Gagal Export', result.message || 'Terjadi kesalahan.');
        else setExportModalVisible(false);
    };

    // derived stats
    const activeCount = services.filter(s => !s.tanggalKeluar).length;
    const doneCount = services.filter(s => s.tanggalKeluar).length;
    const pendingCount = services.filter(s => !s.tanggalKeluar && (Date.now() - s.createdAt) > 3 * 24 * 60 * 60 * 1000).length;

    const filteredServices = services.filter(s => {
        const matchSearch = s.namaBarang.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchSearch) return false;
        if (filterMode === 'all') return true;
        try {
            // Parse DD/MM/YYYY stored format
            const parts = s.tanggalMasuk.split('/');
            const d = parts.length === 3
                ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
                : new Date(s.tanggalMasuk);
            if (isNaN(d.getTime())) return false;
            if (filterMode === 'date') return isSameDay(d, filterDate);
            if (filterMode === 'range') {
                const from = new Date(filterFrom); from.setHours(0, 0, 0, 0);
                const to = new Date(filterTo); to.setHours(23, 59, 59, 999);
                return d >= from && d <= to;
            }
        } catch { return false; }
        return true;
    });

    const getStatusInfo = (item: ServiceItem) => {
        if (item.tanggalKeluar) {
            return { label: 'Selesai', color: '#10B981', bgColor: 'rgba(16,185,129,0.15)' };
        }
        return { label: 'Aktif', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.15)' };
    };

    const renderServiceCard = ({ item }: { item: ServiceItem }) => {
        const statusInfo = getStatusInfo(item);
        return (
            <TouchableOpacity
                style={styles.serviceCard}
                onPress={() => openEditModal(item)}
                activeOpacity={0.75}
            >
                <View style={[styles.cardAccentBar, { backgroundColor: statusInfo.color }]} />
                <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                        <Text style={styles.cardBarang} numberOfLines={1}>{item.namaBarang}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                        </View>
                    </View>
                    <View style={styles.cardFooterRow}>
                        <Text style={styles.cardDate}>📅 {formatShortDate(item.tanggalMasuk)}{item.tanggalKeluar ? ` → ${formatShortDate(item.tanggalKeluar)}` : ''}</Text>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={styles.iconBtn}>
                            <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back() } else { router.push('/') } }}
                    style={styles.backBtn}>
                    <IconSymbol name="chevron.left" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{instansiName}</Text>

                <TouchableOpacity onPress={() => setExportModalVisible(true)} style={styles.exportBtn}>
                    <IconSymbol name="square.and.arrow.up" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <GlassBox style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <View style={[styles.summaryIconBox, { backgroundColor: '#60A5FA' }]}>
                            <IconSymbol name="wrench.and.screwdriver.fill" size={12} color="#FFFFFF" />
                        </View>
                        <Text style={styles.summaryLabel}>Aktif</Text>
                    </View>
                    <Text style={styles.summaryCount}>{activeCount}</Text>
                </GlassBox>

                <GlassBox style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <View style={[styles.summaryIconBox, { backgroundColor: '#34D399' }]}>
                            <IconSymbol name="checkmark.circle.fill" size={12} color="#FFFFFF" />
                        </View>
                        <Text style={styles.summaryLabel}>Selesai</Text>
                    </View>
                    <Text style={styles.summaryCount}>{doneCount}</Text>
                </GlassBox>

                <GlassBox style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <View style={[styles.summaryIconBox, { backgroundColor: '#FBBF24' }]}>
                            <IconSymbol name="clock.fill" size={12} color="#FFFFFF" />
                        </View>
                        <Text style={styles.summaryLabel}>Tertunda</Text>
                    </View>
                    <Text style={styles.summaryCount}>{pendingCount}</Text>
                </GlassBox>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchFilterContainer}>
                <GlassBox style={[styles.searchBar, { flex: 1 }]}>
                    <Text style={{ color: '#6B7280', paddingHorizontal: 4, fontSize: 16 }}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search barang..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={{ color: '#9CA3AF', fontSize: 14, paddingRight: 8 }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </GlassBox>
                <TouchableOpacity
                    style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
                    onPress={() => {
                        setTempFilterMode(filterMode);
                        setTempFilterDate(filterDate);
                        setTempFilterFrom(filterFrom);
                        setTempFilterTo(filterTo);
                        setFilterModalVisible(true);
                    }}
                >
                    <Text style={[styles.filterText, isFilterActive && styles.filterTextActive]}>
                        {isFilterActive ? getFilterLabel() : '⊟ Filter'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Filter active chip */}
            {isFilterActive && (
                <View style={styles.filterChip}>
                    <View style={styles.filterChipLeft}>
                        <Text style={styles.filterChipIcon}>📅</Text>
                        <Text style={styles.filterChipText}>{getFilterLabel()}</Text>
                    </View>
                    <TouchableOpacity onPress={resetFilter} style={styles.filterChipClose}>
                        <Text style={styles.filterChipCloseText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

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
            {/* ─── FILTER MODAL ─── */}
            <Modal animationType="slide" transparent visible={filterModalVisible} onRequestClose={() => setFilterModalVisible(false)}>
                <TouchableOpacity style={fStyles.overlay} activeOpacity={1} onPress={() => { setFilterModalVisible(false); setActivePicker(null); }}>
                    <TouchableOpacity style={fStyles.sheet} activeOpacity={1}>
                        <View style={fStyles.handle} />
                        <View style={fStyles.headerRow}>
                            <Text style={fStyles.title}>Filter Tanggal Masuk</Text>
                            <TouchableOpacity
                                style={fStyles.closeBtn}
                                onPress={() => { setFilterModalVisible(false); setActivePicker(null); }}
                            >
                                <Text style={fStyles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={fStyles.modeRow}>
                            {(['all', 'date', 'range'] as FilterMode[]).map(mode => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[fStyles.modeBtn, tempFilterMode === mode && fStyles.modeBtnActive]}
                                    onPress={() => { setTempFilterMode(mode); setActivePicker(null); }}
                                >
                                    <Text style={[fStyles.modeBtnText, tempFilterMode === mode && fStyles.modeBtnTextActive]}>
                                        {mode === 'all' ? 'Semua' : mode === 'date' ? 'Pilih Hari' : 'Rentang'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {tempFilterMode === 'date' && (
                            <>
                                <Text style={fStyles.label}>Tanggal</Text>
                                <TouchableOpacity style={fStyles.dateBtn} onPress={() => setActivePicker(activePicker === 'filterDate' ? null : 'filterDate')}>
                                    <Text style={fStyles.dateBtnText}>{fmtDate(tempFilterDate)}</Text>
                                    <Text style={fStyles.arrow}>▼</Text>
                                </TouchableOpacity>
                                {activePicker === 'filterDate' && (
                                    <DateTimePicker value={tempFilterDate} mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, d) => { if (d) { setTempFilterDate(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                                        maximumDate={new Date()} />
                                )}
                            </>
                        )}

                        {tempFilterMode === 'range' && (
                            <>
                                <Text style={fStyles.label}>Dari</Text>
                                <TouchableOpacity style={fStyles.dateBtn} onPress={() => setActivePicker(activePicker === 'filterFrom' ? null : 'filterFrom')}>
                                    <Text style={fStyles.dateBtnText}>{fmtDate(tempFilterFrom)}</Text>
                                    <Text style={fStyles.arrow}>▼</Text>
                                </TouchableOpacity>
                                {activePicker === 'filterFrom' && (
                                    <DateTimePicker value={tempFilterFrom} mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, d) => { if (d) { setTempFilterFrom(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                                        maximumDate={new Date()} />
                                )}
                                <Text style={[fStyles.label, { marginTop: 10 }]}>Sampai</Text>
                                <TouchableOpacity style={fStyles.dateBtn} onPress={() => setActivePicker(activePicker === 'filterTo' ? null : 'filterTo')}>
                                    <Text style={fStyles.dateBtnText}>{fmtDate(tempFilterTo)}</Text>
                                    <Text style={fStyles.arrow}>▼</Text>
                                </TouchableOpacity>
                                {activePicker === 'filterTo' && (
                                    <DateTimePicker value={tempFilterTo} mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, d) => { if (d) { setTempFilterTo(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                                        minimumDate={tempFilterFrom} maximumDate={new Date()} />
                                )}
                            </>
                        )}

                        <View style={fStyles.actions}>
                            <TouchableOpacity style={fStyles.btnReset} onPress={resetFilter}>
                                <Text style={fStyles.btnResetText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={fStyles.btnApply} onPress={applyFilter}>
                                <Text style={fStyles.btnApplyText}>Terapkan</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalSheet}>
                        {selectedService && (
                            <>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalTopRow}>
                                    <Text style={styles.modalTitle}>Detail & Update Servis</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                        <Text style={styles.closeBtnText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.infoGrid}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Instansi</Text>
                                        <Text style={styles.infoValue}>{selectedService.instansi}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Barang</Text>
                                        <Text style={styles.infoValue}>{selectedService.namaBarang}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Tgl Masuk</Text>
                                        <Text style={styles.infoValue}>{formatShortDate(selectedService.tanggalMasuk)}</Text>
                                    </View>
                                    {selectedService.tanggalKeluar && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Tgl Selesai</Text>
                                            <Text style={styles.infoValue}>{formatShortDate(selectedService.tanggalKeluar)}</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.textAreaLabel}>Keterangan Perbaikan:</Text>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Tuliskan detail perbaikan atau catatan di sini..."
                                    placeholderTextColor="#9CA3AF"
                                    value={keterangan}
                                    onChangeText={setKeterangan}
                                />

                                <View style={styles.btnRow}>
                                    <TouchableOpacity style={styles.btnSave} onPress={handleSaveKeterangan}>
                                        <Text style={styles.btnText}>💾 Simpan</Text>
                                    </TouchableOpacity>
                                    {!selectedService.tanggalKeluar && (
                                        <TouchableOpacity style={styles.btnDone} onPress={handleSelesai}>
                                            <Text style={styles.btnText}>✓ Selesai</Text>
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

            {/* ─── EXPORT MODAL ─── */}
            <Modal animationType="slide" transparent visible={exportModalVisible} onRequestClose={() => setExportModalVisible(false)}>
                <TouchableOpacity style={emStyles.overlay} activeOpacity={1} onPress={() => { setExportModalVisible(false); setActivePicker(null); }}>
                    <TouchableOpacity style={emStyles.sheet} activeOpacity={1}>
                        <View style={emStyles.handle} />
                        <View style={emStyles.headerRow}>
                            <Text style={emStyles.title}>Export Laporan</Text>
                            <TouchableOpacity
                                style={emStyles.closeBtn}
                                onPress={() => { setExportModalVisible(false); setActivePicker(null); }}
                            >
                                <Text style={emStyles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={emStyles.subtitle}>{instansiName}</Text>

                        {/* Format */}
                        <Text style={emStyles.label}>Format File</Text>
                        <View style={emStyles.formatRow}>
                            {(['xlsx', 'pdf'] as ExportFormat[]).map(fmt => (
                                <TouchableOpacity
                                    key={fmt}
                                    style={[emStyles.formatBtn, exportFormat === fmt && emStyles.formatBtnActive]}
                                    onPress={() => setExportFormat(fmt)}
                                >
                                    <Text style={emStyles.formatIcon}>{fmt === 'xlsx' ? '📊' : '📄'}</Text>
                                    <Text style={[emStyles.formatText, exportFormat === fmt && emStyles.formatTextActive]}>
                                        {fmt.toUpperCase()}
                                    </Text>
                                    <Text style={[emStyles.formatDesc, exportFormat === fmt && { color: '#007AFF' }]}>
                                        {fmt === 'xlsx' ? 'Excel Spreadsheet' : 'PDF Document'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Rentang Tanggal */}
                        <Text style={emStyles.label}>Rentang Tanggal Masuk</Text>

                        <Text style={emStyles.dateLabel}>Dari</Text>
                        <TouchableOpacity style={emStyles.dateBtn} onPress={() => setActivePicker(activePicker === 'from' ? null : 'from')}>
                            <Text style={emStyles.dateBtnText}>{`${String(exportFrom.getDate()).padStart(2, '0')}/${String(exportFrom.getMonth() + 1).padStart(2, '0')}/${exportFrom.getFullYear()}`}</Text>
                            <Text style={emStyles.dateBtnArrow}>▼</Text>
                        </TouchableOpacity>
                        {activePicker === 'from' && (
                            <DateTimePicker value={exportFrom} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(_, d) => { if (d) { setExportFrom(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                                maximumDate={new Date()} />
                        )}

                        <Text style={[emStyles.dateLabel, { marginTop: 10 }]}>Sampai</Text>
                        <TouchableOpacity style={emStyles.dateBtn} onPress={() => setActivePicker(activePicker === 'to' ? null : 'to')}>
                            <Text style={emStyles.dateBtnText}>{`${String(exportTo.getDate()).padStart(2, '0')}/${String(exportTo.getMonth() + 1).padStart(2, '0')}/${exportTo.getFullYear()}`}</Text>
                            <Text style={emStyles.dateBtnArrow}>▼</Text>
                        </TouchableOpacity>
                        {activePicker === 'to' && (
                            <DateTimePicker value={exportTo} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(_, d) => { if (d) { setExportTo(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                                minimumDate={exportFrom} maximumDate={new Date()} />
                        )}

                        {/* Preview count */}
                        <View style={emStyles.previewBox}>
                            <Text style={emStyles.previewText}>📋 {getExportData().length} data akan diekspor</Text>
                        </View>

                        {/* Tombol Export */}
                        <TouchableOpacity
                            style={[emStyles.btnExport, isExporting && { opacity: 0.6 }]}
                            onPress={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting
                                ? <ActivityIndicator color="#FFFFFF" />
                                : <Text style={emStyles.btnExportText}>⬇ Export {exportFormat.toUpperCase()}</Text>
                            }
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    headerTitle: {
        fontSize: 18, fontWeight: '800', color: '#0F172A',
        flex: 1, textAlign: 'center',
    },
    exportBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },

    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 14,
    },
    summaryCard: { flex: 1, padding: 14 },
    summaryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    summaryIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    summaryLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
    summaryCount: { fontSize: 24, fontWeight: '900', color: '#0F172A' },

    searchFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 46,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500' },
    filterButton: {
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 14, backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    filterButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    filterText: { fontSize: 13, color: '#374151', fontWeight: '600' },
    filterTextActive: { color: '#FFFFFF' },

    filterChip: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#EFF6FF',
        borderRadius: 30, paddingHorizontal: 14, paddingVertical: 8,
        marginHorizontal: 16, marginBottom: 10,
        borderWidth: 1, borderColor: '#BFDBFE',
    },
    filterChipLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    filterChipIcon: { fontSize: 14 },
    filterChipText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
    filterChipClose: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center',
    },
    filterChipCloseText: { fontSize: 11, fontWeight: '800', color: '#1E40AF' },

    listContent: { paddingHorizontal: 16, paddingBottom: 24 },

    serviceCard: {
        marginBottom: 12, borderRadius: 16, overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardAccentBar: { height: 4 },
    cardBody: { padding: 14 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardBarang: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    cardMeta: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    cardNotes: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },
    cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    cardDate: { fontSize: 12, color: '#94A3B8' },
    cardActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F8FAFF',
    },

    emptyContainer: { marginHorizontal: 16, marginTop: 40 },
    emptyInner: { padding: 40, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
    emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    },
    modalHandle: {
        width: 40, height: 4, backgroundColor: '#E2E8F0',
        borderRadius: 2, alignSelf: 'center', marginBottom: 20,
    },
    modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    closeBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    closeBtnText: { fontSize: 16, color: '#EF4444', fontWeight: '900' },

    infoGrid: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 16, gap: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    infoValue: { fontSize: 13, color: '#0F172A', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
    textAreaLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    textArea: {
        backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 12, padding: 12, fontSize: 14, color: '#0F172A',
        textAlignVertical: 'top', minHeight: 90, marginBottom: 16,
    },
    btnRow: { flexDirection: 'row', gap: 10 },
    btnSave: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center' },
    btnDone: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center' },
    btnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

    fab: {
        position: 'absolute', bottom: 28, right: 20,
        width: 58, height: 58, borderRadius: 18,
        backgroundColor: '#007AFF',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
});
