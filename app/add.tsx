import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveServiceData, getInstansis } from '../utils/storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ServiceFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as any;
  const initialInstansi = params.instansi;
  const [instansi, setInstansi] = useState(initialInstansi ? String(initialInstansi) : '');
  const [availableInstansis, setAvailableInstansis] = useState<string[]>([]);
  const [namaBarang, setNamaBarang] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const fetchInstansis = async () => {
        const data = await getInstansis();
        setAvailableInstansis(data);
      };
      fetchInstansis();
    }, [])
  );

  // Date Picker States
  const [tanggalMasuk, setTanggalMasuk] = useState<Date>(new Date());
  const [showPickerMasuk, setShowPickerMasuk] = useState(false);

  const [tanggalKeluar, setTanggalKeluar] = useState<Date | null>(null);
  const [showPickerKeluar, setShowPickerKeluar] = useState(false);

  const [deskripsi, setDeskripsi] = useState('');
  const [ruangan, setRuangan] = useState('');

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleMasukChange = (event: any, selectedDate?: Date) => {
    setShowPickerMasuk(Platform.OS === 'ios');
    if (selectedDate) setTanggalMasuk(selectedDate);
  };

  const handleKeluarChange = (event: any, selectedDate?: Date) => {
    setShowPickerKeluar(Platform.OS === 'ios');
    if (selectedDate) setTanggalKeluar(selectedDate);
  };

  const handleSubmit = async () => {
    if (!instansi || !namaBarang || !tanggalMasuk || !deskripsi || !ruangan) {
      Alert.alert('Incomplete Form', 'Harap isi semua kolom.');
      return;
    }

    const success = await saveServiceData({
      instansi,
      namaBarang,
      tanggalMasuk: formatDate(tanggalMasuk),
      tanggalKeluar: formatDate(tanggalKeluar),
      deskripsi,
      ruangan
    });

    if (success) {
      Alert.alert('Berhasil!', 'Data service berhasil disimpan.', [
        {
          text: 'Tutup',
          onPress: () => {
            setInstansi('');
            setNamaBarang('');
            setTanggalMasuk(new Date());
            setTanggalKeluar(null);
            setDeskripsi('');
            setRuangan('');
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'Gagal menyimpan data.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Baru Sesuai Mockup */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => { if (router.canGoBack()) { router.back() } else { router.push('/') } }}>
          <IconSymbol name="chevron.left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Input Data Servis</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Field: Instansi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Instansi / Pelanggan</Text>
              <View style={[styles.inputWrapper, { paddingVertical: Platform.OS === 'ios' ? 0 : 4, paddingRight: 0 }]}>
                <View style={styles.iconLeft}>
                  <IconSymbol name="building.columns" size={20} color="#6B7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Picker
                    selectedValue={instansi}
                    onValueChange={(itemValue) => setInstansi(itemValue)}
                    style={styles.picker as any}
                    itemStyle={{ color: '#111827' }}
                  >
                    <Picker.Item label="Pilih Instansi..." value="" color="#A1A1AA" />
                    {availableInstansis.map((item, index) => (
                      <Picker.Item key={index} label={item} value={item} color="#111827" />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Field: Nama Barang */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Barang</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconLeft}>
                  <IconSymbol name="laptopcomputer" size={20} color="#6B7280" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Laptop Dell XPS 15 (i7, 16GB)"
                  placeholderTextColor="#9ca3af"
                  value={namaBarang}
                  onChangeText={setNamaBarang}
                />
              </View>
            </View>

            {/* Field: Tanggal Masuk */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Masuk</Text>
              <View style={styles.inputWrapper}>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={tanggalMasuk.toISOString().split('T')[0]}
                    onChange={(e: any) => setTanggalMasuk(new Date(e.target.value))}
                    style={styles.webInputDate as any}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.datePickerTouchable}
                      onPress={() => setShowPickerMasuk(true)}
                    >
                      <Text style={styles.dateText}>{formatDate(tanggalMasuk)}</Text>
                      <IconSymbol name="calendar" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    {showPickerMasuk && (
                      <DateTimePicker
                        value={tanggalMasuk}
                        mode="date"
                        display="default"
                        onChange={handleMasukChange}
                      />
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Field: Tanggal Keluar */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Keluar</Text>
              <View style={styles.inputWrapper}>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={tanggalKeluar ? tanggalKeluar.toISOString().split('T')[0] : ''}
                    onChange={(e: any) => setTanggalKeluar(e.target.value ? new Date(e.target.value) : null)}
                    style={styles.webInputDate as any}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.datePickerTouchable}
                      onPress={() => setShowPickerKeluar(true)}
                    >
                      <Text style={tanggalKeluar ? styles.dateText : styles.datePlaceholder}>
                        {tanggalKeluar ? formatDate(tanggalKeluar) : 'Pilih Tanggal...'}
                      </Text>
                      <IconSymbol name="calendar" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    {showPickerKeluar && (
                      <DateTimePicker
                        value={tanggalKeluar || new Date()}
                        mode="date"
                        display="default"
                        onChange={handleKeluarChange}
                      />
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Field: Deskripsi Masalah */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi Masalah</Text>
              <View style={styles.inputWrapperNoIcon}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Layar mati total, tidak bisa dinyalakan. Ada bunyi bip saat tombol power ditekan."
                  placeholderTextColor="#9ca3af"
                  value={deskripsi}
                  onChangeText={setDeskripsi}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Field: Ruangan */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ruangan</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconLeft}>
                  <IconSymbol name="mappin.and.ellipse" size={20} color="#6B7280" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ruang IT - Lt. 2"
                  placeholderTextColor="#9ca3af"
                  value={ruangan}
                  onChangeText={setRuangan}
                />
                <View style={styles.iconRight}>
                  <IconSymbol name="chevron.down" size={20} color="#6B7280" />
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Simpan Data</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Subtle gray background like modern apps
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  inputWrapperNoIcon: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  iconLeft: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  iconRight: {
    paddingLeft: 8,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#111827',
    paddingRight: 12, // for spacing on the right if no icon
  },
  picker: {
    width: '100%',
    color: '#111827',
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 10,
      height: 50,
      fontSize: 16,
      borderWidth: 0,
      outlineStyle: 'none',
      backgroundColor: 'transparent',
    }),
  } as any,
  datePickerTouchable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  webInputDate: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#111827',
    fontFamily: 'inherit',
  } as any,
  textArea: {
    height: 100,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#007AFF', // iOS blue
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
