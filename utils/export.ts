import * as Sharing from 'expo-sharing';
const FileSystem = require('expo-file-system/legacy');
import { ServiceItem } from './storage';
import { Platform } from 'react-native';

export const exportInstansiToCsv = async (instansiName: string, services: ServiceItem[]) => {
    try {
        // Filter services by instansiName
        const instansiServices = services.filter(s => s.instansi === instansiName);

        if (instansiServices.length === 0) {
            return { success: false, message: 'Tidak ada data servis untuk diekspor.' };
        }

        // Setup CSV content
        // Baris 1: [NAMA INSTANSI]
        // Baris 2: No | Nama Barang | Masuk | Keluar | Deskripsi kerusakan | Ganti/ Servis | Ruangan
        let csvContent = `"${instansiName}"\n`;
        csvContent += `"No","Nama Barang","Masuk","Keluar","Deskripsi kerusakan","Ganti/ Servis","Ruangan"\n`;

        instansiServices.forEach((item, index) => {
            // Escape quotes inside fields by doubling them
            const escapeCsv = (str: string | undefined) => {
                if (!str) return '';
                return str.replace(/"/g, '""');
            };

            const no = index + 1;
            const namaBarang = `"${escapeCsv(item.namaBarang)}"`;
            const masuk = `"${escapeCsv(item.tanggalMasuk)}"`;
            const keluar = `"${escapeCsv(item.tanggalKeluar)}"`;
            const deskripsi = `"${escapeCsv(item.deskripsi)}"`;
            const gantiServis = `"${escapeCsv(item.keteranganPerbaikan)}"`;
            const ruangan = `""`; // Kosongkan karena tidak ada data ruangan

            csvContent += `${no},${namaBarang},${masuk},${keluar},${deskripsi},${gantiServis},${ruangan}\n`;
        });

        if (Platform.OS === 'web') {
            // Web implementation for downloading CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Laporan_Servis_${instansiName.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return { success: true };
        } else {
            // Mobile (iOS/Android) implementation using expo-file-system and expo-sharing
            const filename = `Laporan_Servis_${instansiName.replace(/\s+/g, '_')}.csv`;
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, csvContent, {
                encoding: 'utf8',
            });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Bagikan Laporan Servis',
                    UTI: 'public.comma-separated-values-text'
                } as any);
                return { success: true };
            } else {
                return { success: false, message: 'Fitur berbagi tidak tersedia di perangkat ini.' };
            }
        }
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        return { success: false, message: 'Terjadi kesalahan saat mengekspor data.' };
    }
};
