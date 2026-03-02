import { IconSymbol } from '@/components/ui/icon-symbol';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform, StatusBar,
    StyleSheet, Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatShortDate } from '../../utils/formatDate';
import { deleteServiceItem, getServiceData, ServiceItem, updateServiceItem } from '../../utils/storage';

type FilterMode = 'all' | 'date' | 'range';

const Card = ({ children, style }: any) => (
    <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }, style]}>
        {children}
    </View>
);
const GlassBox = Card; // alias kept for compatibility

export default function HomeScreen() {
    const router = useRouter();
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [filterDate, setFilterDate] = useState<Date>(new Date());
    const [filterFrom, setFilterFrom] = useState<Date>(new Date());
    const [filterTo, setFilterTo] = useState<Date>(new Date());
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [tempMode, setTempMode] = useState<FilterMode>('all');
    const [tempDate, setTempDate] = useState<Date>(new Date());
    const [tempFrom, setTempFrom] = useState<Date>(new Date());
    const [tempTo, setTempTo] = useState<Date>(new Date());
    const [activePicker, setActivePicker] = useState<'date' | 'from' | 'to' | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    const [keterangan, setKeterangan] = useState('');

    const loadData = async () => {
        const data = await getServiceData();
        setServices(data.reverse());
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleDelete = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Hapus data service ini?')) deleteServiceItem(id).then(s => { if (s) loadData(); });
        } else {
            Alert.alert('Konfirmasi Hapus', 'Hapus data service ini?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Hapus', style: 'destructive', onPress: async () => { if (await deleteServiceItem(id)) loadData(); } },
            ]);
        }
    };

    const openEditModal = (item: ServiceItem) => {
        setSelectedService(item); setKeterangan(item.keteranganPerbaikan || ''); setModalVisible(true);
    };

    const handleSaveKeterangan = async () => {
        if (selectedService) {
            if (await updateServiceItem(selectedService.id, { keteranganPerbaikan: keterangan })) { setModalVisible(false); loadData(); }
        }
    };

    const handleSelesai = async () => {
        if (selectedService) {
            const now = new Date();
            const today = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            if (await updateServiceItem(selectedService.id, { tanggalKeluar: today, keteranganPerbaikan: keterangan })) { setModalVisible(false); loadData(); }
        }
    };

    const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const applyFilter = () => { setFilterMode(tempMode); setFilterDate(tempDate); setFilterFrom(tempFrom); setFilterTo(tempTo); setFilterModalVisible(false); setActivePicker(null); };
    const resetFilter = () => { setTempMode('all'); setFilterMode('all'); setFilterModalVisible(false); setActivePicker(null); };
    const isFilterActive = filterMode !== 'all';

    const getFilterLabel = () => {
        if (filterMode === 'date') return fmtDate(filterDate);
        if (filterMode === 'range') return `${fmtDate(filterFrom)} – ${fmtDate(filterTo)}`;
        return 'Filter';
    };

    const activeCount = services.filter(s => !s.tanggalKeluar).length;
    const doneCount = services.filter(s => s.tanggalKeluar).length;
    const pendingCount = services.filter(s => !s.tanggalKeluar && (Date.now() - s.createdAt) > 3 * 24 * 60 * 60 * 1000).length;

    const filteredServices = services.filter(s => {
        const matchSearch = s.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.instansi.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchSearch) return false;
        if (filterMode === 'all') return true;
        try {
            const parts = s.tanggalMasuk.split('/');
            const d = parts.length === 3 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : new Date(s.tanggalMasuk);
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

    const getStatusInfo = (item: ServiceItem) => item.tanggalKeluar
        ? { label: 'Selesai', color: '#10B981', bg: 'rgba(16,185,129,0.15)' }
        : { label: 'Aktif', color: '#007AFF', bg: 'rgba(0,122,255,0.15)' };

    const renderCard = ({ item }: { item: ServiceItem }) => {
        const st = getStatusInfo(item);
        return (
            <TouchableOpacity onPress={() => openEditModal(item)} activeOpacity={0.8} style={styles.cardWrapper}>
                <GlassBox style={styles.card}>
                    <View style={[styles.cardAccentBar, { backgroundColor: st.color }]} />
                    <View style={styles.cardContent}>
                        <View style={styles.cardTopRow}>
                            <Text style={styles.cardBarang} numberOfLines={1}>{item.namaBarang}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                                <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                            </View>
                        </View>
                        <Text style={styles.cardInstansi}>{item.instansi}</Text>
                        <View style={styles.cardFooterRow}>
                            <Text style={styles.cardDate}>📅 {formatShortDate(item.tanggalMasuk)}</Text>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <IconSymbol name="trash.fill" size={15} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </GlassBox>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerGreeting}>Selamat Datang 👋</Text>
                        <Text style={styles.headerTitle}>FlashCom</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add')}>
                        <IconSymbol name="plus" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Summary cards */}
                <View style={styles.summaryRow}>
                    {[
                        { label: 'Aktif', count: activeCount, color: '#60A5FA' },
                        { label: 'Selesai', count: doneCount, color: '#34D399' },
                        { label: 'Tertunda', count: pendingCount, color: '#FBBF24' },
                    ].map(item => (
                        <GlassBox key={item.label} style={styles.summaryCard}>
                            <Text style={[styles.summaryCount, { color: item.color }]}>{item.count}</Text>
                            <Text style={styles.summaryLabel}>{item.label}</Text>
                        </GlassBox>
                    ))}
                </View>

                {/* Search + Filter */}
                <View style={styles.searchRow}>
                    <GlassBox style={styles.searchBox}>
                        <View style={styles.searchInner}>
                            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari barang atau instansi..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Text style={{ color: '#9CA3AF', fontSize: 16 }}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </GlassBox>
                    <TouchableOpacity
                        style={[styles.filterBtn, isFilterActive && styles.filterBtnActive]}
                        onPress={() => { setTempMode(filterMode); setTempDate(filterDate); setTempFrom(filterFrom); setTempTo(filterTo); setFilterModalVisible(true); }}
                    >
                        <IconSymbol
                            name={isFilterActive ? 'checkmark' : 'line.3.horizontal.decrease'}
                            size={20}
                            color={isFilterActive ? '#FFFFFF' : '#374151'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Filter chip */}
                {isFilterActive && (
                    <View style={styles.chipWrapper}>
                        <GlassBox style={styles.chip}>
                            <View style={styles.chipInner}>
                                <Text style={styles.chipIcon}>📅</Text>
                                <Text style={styles.chipText}>{getFilterLabel()}</Text>
                                <TouchableOpacity onPress={resetFilter} style={styles.chipClose}>
                                    <Text style={styles.chipCloseText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </GlassBox>
                    </View>
                )}

                {/* List */}
                <FlatList
                    data={filteredServices}
                    keyExtractor={item => item.id}
                    renderItem={renderCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <GlassBox style={styles.emptyBox}>
                            <Text style={styles.emptyIcon}>{isFilterActive ? '🔍' : '📋'}</Text>
                            <Text style={styles.emptyTitle}>{isFilterActive ? 'Tidak ada data' : 'Belum ada servis'}</Text>
                            <Text style={styles.emptyText}>{isFilterActive ? 'Coba ubah filter tanggal' : 'Tekan + untuk tambah servis'}</Text>
                        </GlassBox>
                    }
                />

                {/* ── FILTER MODAL ── */}
                <Modal animationType="slide" transparent visible={filterModalVisible} onRequestClose={() => setFilterModalVisible(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setFilterModalVisible(false); setActivePicker(null); }}>
                        <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                            <View style={[styles.bottomSheet, { backgroundColor: 'rgba(255,255,255,0.97)' }]}>
                                <FilterSheetContent
                                    tempMode={tempMode} setTempMode={setTempMode}
                                    tempDate={tempDate} setTempDate={setTempDate}
                                    tempFrom={tempFrom} setTempFrom={setTempFrom}
                                    tempTo={tempTo} setTempTo={setTempTo}
                                    activePicker={activePicker} setActivePicker={setActivePicker}
                                    fmtDate={fmtDate} applyFilter={applyFilter} resetFilter={resetFilter}
                                />
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* ── EDIT MODAL ── */}
                <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={[styles.bottomSheet, { backgroundColor: 'rgba(255,255,255,0.97)' }]}>
                            <EditSheetContent
                                selectedService={selectedService} keterangan={keterangan}
                                setKeterangan={setKeterangan} setModalVisible={setModalVisible}
                                handleSaveKeterangan={handleSaveKeterangan} handleSelesai={handleSelesai}
                            />
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function FilterSheetContent({ tempMode, setTempMode, tempDate, setTempDate, tempFrom, setTempFrom, tempTo, setTempTo, activePicker, setActivePicker, fmtDate, applyFilter, resetFilter }: any) {
    return (
        <>
            <View style={sheet.handle} />
            <Text style={sheet.title}>Filter Tanggal Masuk</Text>
            <View style={sheet.modeRow}>
                {(['all', 'date', 'range'] as FilterMode[]).map(mode => (
                    <TouchableOpacity key={mode} style={[sheet.modeBtn, tempMode === mode && sheet.modeBtnActive]}
                        onPress={() => { setTempMode(mode); setActivePicker(null); }}>
                        <Text style={[sheet.modeBtnText, tempMode === mode && sheet.modeBtnTextActive]}>
                            {mode === 'all' ? 'Semua' : mode === 'date' ? 'Pilih Hari' : 'Rentang'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {tempMode === 'date' && (
                <>
                    <Text style={sheet.label}>Tanggal</Text>
                    <TouchableOpacity style={sheet.dateBtn} onPress={() => setActivePicker(activePicker === 'date' ? null : 'date')}>
                        <Text style={sheet.dateBtnText}>{fmtDate(tempDate)}</Text><Text style={sheet.arrow}>▼</Text>
                    </TouchableOpacity>
                    {activePicker === 'date' && (
                        <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(_, d) => { if (d) { setTempDate(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                            maximumDate={new Date()} />
                    )}
                </>
            )}
            {tempMode === 'range' && (
                <>
                    <Text style={sheet.label}>Dari</Text>
                    <TouchableOpacity style={sheet.dateBtn} onPress={() => setActivePicker(activePicker === 'from' ? null : 'from')}>
                        <Text style={sheet.dateBtnText}>{fmtDate(tempFrom)}</Text><Text style={sheet.arrow}>▼</Text>
                    </TouchableOpacity>
                    {activePicker === 'from' && (
                        <DateTimePicker value={tempFrom} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(_, d) => { if (d) { setTempFrom(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                            maximumDate={new Date()} />
                    )}
                    <Text style={[sheet.label, { marginTop: 12 }]}>Sampai</Text>
                    <TouchableOpacity style={sheet.dateBtn} onPress={() => setActivePicker(activePicker === 'to' ? null : 'to')}>
                        <Text style={sheet.dateBtnText}>{fmtDate(tempTo)}</Text><Text style={sheet.arrow}>▼</Text>
                    </TouchableOpacity>
                    {activePicker === 'to' && (
                        <DateTimePicker value={tempTo} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(_, d) => { if (d) { setTempTo(d); if (Platform.OS === 'android') setActivePicker(null); } }}
                            minimumDate={tempFrom} maximumDate={new Date()} />
                    )}
                </>
            )}
            <View style={sheet.actions}>
                <TouchableOpacity style={sheet.btnReset} onPress={resetFilter}><Text style={sheet.btnResetText}>Reset</Text></TouchableOpacity>
                <TouchableOpacity style={sheet.btnApply} onPress={applyFilter}><Text style={sheet.btnApplyText}>Terapkan</Text></TouchableOpacity>
            </View>
        </>
    );
}

function EditSheetContent({ selectedService, keterangan, setKeterangan, setModalVisible, handleSaveKeterangan, handleSelesai }: any) {
    if (!selectedService) return null;
    return (
        <>
            <View style={sheet.handle} />
            <View style={sheet.editHeader}>
                <Text style={sheet.title}>Detail Servis</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={sheet.closeBtn}>
                    <Text style={sheet.closeBtnText}>✕</Text>
                </TouchableOpacity>
            </View>
            <View style={sheet.infoGrid}>
                <InfoRow label="Instansi" value={selectedService.instansi} />
                <InfoRow label="Barang" value={selectedService.namaBarang} />
                <InfoRow label="Tgl Masuk" value={formatShortDate(selectedService.tanggalMasuk)} />
                {selectedService.tanggalKeluar && <InfoRow label="Tgl Selesai" value={formatShortDate(selectedService.tanggalKeluar)} color="#10B981" />}
            </View>
            <Text style={sheet.label}>Catatan Perbaikan</Text>
            <TextInput style={sheet.textArea} multiline numberOfLines={4}
                placeholder="Tuliskan detail perbaikan..." placeholderTextColor="rgba(0,0,0,0.35)"
                value={keterangan} onChangeText={setKeterangan} />
            <View style={sheet.actions}>
                <TouchableOpacity style={sheet.btnSave} onPress={handleSaveKeterangan}>
                    <Text style={sheet.btnApplyText}>Simpan</Text>
                </TouchableOpacity>
                {!selectedService.tanggalKeluar && (
                    <TouchableOpacity style={sheet.btnDone} onPress={handleSelesai}>
                        <Text style={sheet.btnApplyText}>✓ Selesai</Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <View style={sheet.infoRow}>
            <Text style={sheet.infoLabel}>{label}</Text>
            <Text style={[sheet.infoValue, color ? { color } : {}]}>{value}</Text>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    headerGreeting: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 2 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    addBtn: {
        backgroundColor: '#007AFF', width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, padding: 14, alignItems: 'center' },
    summaryCount: { fontSize: 26, fontWeight: '900', marginBottom: 2 },
    summaryLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

    searchRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 10 },
    searchBox: { flex: 1 },
    searchInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 },
    searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500' },
    filterBtn: {
        width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    filterBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    filterBtnText: { fontSize: 18, color: '#374151' },

    chipWrapper: { paddingHorizontal: 16, marginBottom: 10 },
    chip: {},
    chipInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
    chipIcon: { fontSize: 14 },
    chipText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
    chipClose: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' },
    chipCloseText: { fontSize: 11, fontWeight: '800', color: '#1E40AF' },

    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    cardWrapper: { marginBottom: 12 },
    card: { flexDirection: 'row', overflow: 'hidden', borderRadius: 16 },
    cardAccentBar: { width: 4 },
    cardContent: { flex: 1, padding: 14 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardBarang: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '600' },
    cardInstansi: { fontSize: 13, color: '#475569', marginBottom: 10 },
    cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardDate: { fontSize: 12, color: '#64748B' },
    emptyBox: { marginHorizontal: 20, marginTop: 40, padding: 36, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
    emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
});


const sheet = StyleSheet.create({
    handle: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
    editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    closeBtnText: { fontSize: 16, color: '#EF4444', fontWeight: '900' },
    modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
    modeBtnActive: { backgroundColor: '#007AFF' },
    modeBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    modeBtnTextActive: { color: '#FFFFFF' },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, marginBottom: 4 },
    dateBtnText: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
    arrow: { fontSize: 12, color: '#94A3B8' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    btnReset: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
    btnResetText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
    btnApply: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
    btnApplyText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    btnSave: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center' },
    btnDone: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center' },
    infoGrid: { backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 16, gap: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    infoValue: { fontSize: 13, color: '#0F172A', fontWeight: '600', textAlign: 'right' },
    textArea: { backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 90, marginBottom: 16 },
});
