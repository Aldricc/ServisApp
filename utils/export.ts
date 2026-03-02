import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { ServiceItem } from './storage';
const FileSystem = require('expo-file-system/legacy');

export type ExportFormat = 'xlsx' | 'pdf';

const escapeCsv = (str: string | undefined) => (str || '').replace(/"/g, '""');

/** Convert any stored date string to DD/MM/YYYY */
const normDate = (val: string | undefined): string => {
    if (!val) return '-';
    // Already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
    // Parse ISO or locale format
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// ─── XLSX (HTML-as-XLS for full styling support) ─────────────────────────────
export const exportToXlsx = async (
    services: ServiceItem[],
    filename: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        if (services.length === 0) return { success: false, message: 'Tidak ada data untuk diekspor.' };

        const escHtml = (s: string | undefined) =>
            (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        const TH = (text: string) =>
            `<th style="background:#007AFF;color:#FFFFFF;font-weight:700;font-size:10px;padding:9px 7px;text-align:left;border:1px solid #005FCC;font-family:Arial,sans-serif;">${text}</th>`;

        const TD = (text: string | number, isEven: boolean, extraStyle = '') =>
            `<td style="padding:7px;font-size:10px;font-family:Arial,sans-serif;color:#1a1a1a;background:${isEven ? '#F0F4FF' : '#FFFFFF'};border:1px solid #D1D5DB;vertical-align:top;${extraStyle}">${text}</td>`;

        const rows = services.map((item, i) => {
            const isEven = i % 2 === 1;
            const selesai = !!item.tanggalKeluar;
            const statusColor = selesai ? '#10B981' : '#007AFF';
            return `<tr>
                ${TD(i + 1, isEven)}
                ${TD(escHtml(item.namaBarang), isEven)}
                ${TD(escHtml(item.instansi), isEven)}
                ${TD(normDate(item.tanggalMasuk), isEven)}
                ${TD(normDate(item.tanggalKeluar), isEven)}
                ${TD(escHtml(item.deskripsi), isEven)}
                ${TD(escHtml(item.keteranganPerbaikan), isEven)}
                ${TD(selesai ? 'Selesai' : 'Aktif', isEven, `color:${statusColor};font-weight:700;`)}
            </tr>`;
        }).join('');

        const now = new Date();
        const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Laporan Servis</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body style="font-family:Arial,sans-serif;padding:20px;">
            <p style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:4px;">Laporan Servis</p>
            <p style="font-size:11px;color:#6B7280;margin-bottom:16px;">Diekspor pada ${todayStr} &bull; Total: ${services.length} data</p>
            <table border="1" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border-color:#D1D5DB;">
                <thead><tr>
                    ${TH('No')}${TH('Nama Barang')}${TH('Instansi')}
                    ${TH('Tgl Masuk')}${TH('Tgl Selesai')}
                    ${TH('Deskripsi')}${TH('Keterangan Perbaikan')}${TH('Status')}
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <p style="margin-top:16px;text-align:right;font-size:10px;color:#9CA3AF;">FlashCom &mdash; dibuat oleh Aldricc/Junet</p>
        </body></html>`;

        if (Platform.OS === 'web') {
            const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${filename}.xls`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            return { success: true };
        }

        const fileUri = `${FileSystem.documentDirectory}${filename}.xls`;
        await FileSystem.writeAsStringAsync(fileUri, html, { encoding: 'utf8' } as any);
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(fileUri, { mimeType: 'application/vnd.ms-excel', dialogTitle: 'Bagikan Laporan Excel' });
            return { success: true };
        }
        return { success: false, message: 'Fitur berbagi tidak tersedia di perangkat ini.' };
    } catch (e: any) {
        console.error('XLSX export error:', e);
        return { success: false, message: e.message || 'Gagal membuat file XLSX.' };
    }
};

// ─── PDF ─────────────────────────────────────────────────────────────────────
export const exportToPdf = async (
    services: ServiceItem[],
    filename: string,
    title: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        if (services.length === 0) return { success: false, message: 'Tidak ada data untuk diekspor.' };

        const rows = services.map((item, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${item.namaBarang || ''}</td>
                <td>${item.instansi || ''}</td>
                <td>${normDate(item.tanggalMasuk)}</td>
                <td>${normDate(item.tanggalKeluar)}</td>
                <td>${item.deskripsi || ''}</td>
                <td>${item.keteranganPerbaikan || ''}</td>
                <td style="color:${item.tanggalKeluar ? '#10B981' : '#007AFF'};font-weight:600">${item.tanggalKeluar ? 'Selesai' : 'Aktif'}</td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px; }
                h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #0F172A; }
                .subtitle { font-size: 11px; color: #6B7280; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #007AFF; color: #fff; padding: 8px 6px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; }
                td { padding: 7px 6px; border-bottom: 1px solid #F3F4F6; font-size: 10px; vertical-align: top; }
                tr:nth-child(even) td { background: #F8FAFF; }
                .footer { margin-top: 20px; text-align: right; font-size: 10px; color: #9CA3AF; }
            </style>
        </head>
        <body>
            <h1>Laporan Servis — ${title}</h1>
            <p class="subtitle">Diekspor pada ${(() => { const n = new Date(); return `${String(n.getDate()).padStart(2, '0')}/${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`; })()} • Total: ${services.length} data</p>
            <table>
                <thead>
                    <tr>
                        <th>No</th><th>Nama Barang</th><th>Instansi</th>
                        <th>Tgl Masuk</th><th>Tgl Selesai</th>
                        <th>Deskripsi</th><th>Keterangan</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <p class="footer">FlashCom — dibuat oleh Aldricc/Junet</p>
        </body>
        </html>`;

        if (Platform.OS === 'web') {
            const win = window.open('', '_blank');
            if (win) { win.document.write(html); win.document.close(); win.print(); }
            return { success: true };
        }

        const { uri } = await Print.printToFileAsync({ html, base64: false });
        const destUri = `${FileSystem.documentDirectory}${filename}.pdf`;
        await FileSystem.moveAsync({ from: uri, to: destUri });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan Laporan PDF' });
            return { success: true };
        }
        return { success: false, message: 'Fitur berbagi tidak tersedia.' };
    } catch (e: any) {
        console.error('PDF export error:', e);
        return { success: false, message: e.message || 'Gagal membuat file PDF.' };
    }
};

// ─── Legacy CSV (kept for backward compat) ───────────────────────────────────
export const exportInstansiToCsv = async (instansiName: string, services: ServiceItem[]) => {
    const filtered = services.filter(s => s.instansi === instansiName);
    if (filtered.length === 0) return { success: false, message: 'Tidak ada data untuk diekspor.' };
    let csv = `"${instansiName}"\n"No","Nama Barang","Masuk","Keluar","Deskripsi","Keterangan","Ruangan"\n`;
    filtered.forEach((item, i) => {
        csv += `${i + 1},"${escapeCsv(item.namaBarang)}","${escapeCsv(item.tanggalMasuk)}","${escapeCsv(item.tanggalKeluar)}","${escapeCsv(item.deskripsi)}","${escapeCsv(item.keteranganPerbaikan)}",""\n`;
    });
    if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `Laporan_${instansiName}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        return { success: true };
    }
    const fileUri = `${FileSystem.documentDirectory}Laporan_${instansiName.replace(/\s+/g, '_')}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) { await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Bagikan Laporan' } as any); return { success: true }; }
    return { success: false, message: 'Fitur berbagi tidak tersedia.' };
};
