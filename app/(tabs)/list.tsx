import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteInstansi, getInstansis, getServiceData, saveInstansi, ServiceItem, updateInstansi } from '../../utils/storage';

const GlassBox = ({ children, style, radius = 16 }: any) => (
    <View style={[{ backgroundColor: '#FFFFFF', borderRadius: radius, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }, style]}>
        {children}
    </View>
);

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
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');

    const loadData = async () => {
        const storedInstansis = await getInstansis();
        const storedServices = await getServiceData();
        setInstansis(storedInstansis);
        setServices(storedServices);
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleSave = async () => {
        if (!inputValue.trim()) return;
        if (editingItem) {
            if (inputValue.trim() === editingItem) { setModalVisible(false); return; }
            const success = await updateInstansi(editingItem, inputValue.trim());
            if (success) { setModalVisible(false); loadData(); }
            else Alert.alert('Gagal', 'Gagal mengubah nama instansi.');
        } else {
            const success = await saveInstansi(inputValue.trim());
            if (success) { setModalVisible(false); setInputValue(''); loadData(); }
            else Alert.alert('Gagal', 'Instansi sudah ada.');
        }
    };

    const confirmDelete = (name: string) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Hapus instansi "${name}"?`);
            if (confirmed) {
                deleteInstansi(name).then(success => {
                    if (success) { setModalVisible(false); loadData(); }
                    else window.alert('Gagal menghapus instansi.');
                });
            }
        } else {
            Alert.alert('Konfirmasi Hapus', `Hapus instansi "${name}"?`, [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus', style: 'destructive',
                    onPress: async () => {
                        const success = await deleteInstansi(name);
                        if (success) { setModalVisible(false); loadData(); }
                        else Alert.alert('Error', 'Gagal menghapus instansi.');
                    },
                },
            ]);
        }
    };

    const openAddModal = () => { setEditingItem(null); setInputValue(''); setModalVisible(true); };
    const openEditModal = (name: string) => { setEditingItem(name); setInputValue(name); setModalVisible(true); };

    const statsData: InstansiStats[] = instansis.map(instansiName => {
        const instansiServices = services.filter(s => s.instansi === instansiName);
        return {
            name: instansiName,
            total: instansiServices.length,
            active: instansiServices.filter(s => !s.tanggalKeluar).length,
        };
    });

    const filteredStats = statsData.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Generate a consistent color per instansi name
    const getAvatarColor = (name: string) => {
        const colors = ['#007AFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
        const idx = name.charCodeAt(0) % colors.length;
        return colors[idx];
    };

    const renderItem = ({ item }: { item: InstansiStats }) => {
        const avatarColor = getAvatarColor(item.name);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/instansi/${item.name}` as any)}
                onLongPress={() => openEditModal(item.name)}
                activeOpacity={0.75}
            >
                <View style={[styles.avatar, { backgroundColor: avatarColor + '20' }]}>
                    <Text style={[styles.avatarText, { color: avatarColor }]}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.total} Total</Text>
                        </View>
                        {item.active > 0 && (
                            <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                                <Text style={[styles.badgeText, { color: '#007AFF' }]}>{item.active} Aktif</Text>
                            </View>
                        )}
                    </View>
                </View>
                <IconSymbol name="chevron.right" size={18} color="#C7C7CC" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSub}>Kelola Data</Text>
                    <Text style={styles.headerTitle}>Daftar Instansi</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <IconSymbol name="plus" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <GlassBox style={styles.searchContainer} radius={14}>
                <View style={styles.searchInner}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari instansi..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </GlassBox>

            {/* Count */}
            <Text style={styles.countText}>{filteredStats.length} Instansi</Text>

            {/* List */}
            {instansis.length === 0 ? (
                <GlassBox style={styles.emptyContainer} radius={20}>
                    <Text style={styles.emptyIcon}>🏢</Text>
                    <Text style={styles.emptyTitle}>Belum Ada Instansi</Text>
                    <Text style={styles.emptyText}>Tekan + untuk menambah instansi pertama</Text>
                </GlassBox>
            ) : (
                <FlatList
                    data={filteredStats}
                    keyExtractor={(item) => item.name}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Modal */}
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={[styles.modalSheet, { backgroundColor: 'rgba(255,255,255,0.97)' }]}>
                        <ModalContent editingItem={editingItem} inputValue={inputValue} setInputValue={setInputValue}
                            setModalVisible={setModalVisible} handleSave={handleSave} confirmDelete={confirmDelete} />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

function ModalContent({ editingItem, inputValue, setInputValue, setModalVisible, handleSave, confirmDelete }: any) {
    return (
        <>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Instansi' : 'Tambah Instansi'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Nama Klien / Instansi</Text>
            <TextInput
                style={styles.modalInput}
                placeholder="Contoh: SMK Negeri 1"
                value={inputValue}
                onChangeText={setInputValue}
                autoFocus
            />
            <View style={styles.modalActions}>
                {editingItem && (
                    <TouchableOpacity style={styles.btnDelete} onPress={() => confirmDelete(editingItem)}>
                        <IconSymbol name="trash.fill" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                    <Text style={styles.btnSaveText}>Simpan</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    headerSub: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 2 },
    headerTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    addButton: {
        backgroundColor: '#007AFF', width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    searchContainer: { marginHorizontal: 16, marginBottom: 12 },
    searchInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 48 },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
    countText: { fontSize: 13, color: '#6B7280', fontWeight: '600', paddingHorizontal: 20, marginBottom: 10 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18, padding: 14, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    avatarText: { fontSize: 20, fontWeight: '900' },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 5 },
    badgeRow: { flexDirection: 'row', gap: 6 },
    badge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    emptyContainer: { marginHorizontal: 20, marginTop: 40, padding: 40, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
    emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
    modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
    modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    closeBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    closeBtnText: { fontSize: 16, color: '#EF4444', fontWeight: '900' },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    modalInput: { backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0F172A', marginBottom: 24 },
    modalActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    btnSave: { flex: 1, backgroundColor: '#059669', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    btnSaveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    btnDelete: { backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
