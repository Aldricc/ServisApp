import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceItem } from './storage';

const SHEETS_API_URL_KEY = 'SHEETS_API_URL';

// 1. Get the stored Web App URL
export const getSheetsApiUrl = async (): Promise<string | null> => {
    try {
        const url = await AsyncStorage.getItem(SHEETS_API_URL_KEY);
        return url;
    } catch (e) {
        console.error('Error getting Sheets API URL:', e);
        return null;
    }
};

// 2. Save the Web App URL
export const saveSheetsApiUrl = async (url: string): Promise<boolean> => {
    try {
        await AsyncStorage.setItem(SHEETS_API_URL_KEY, url.trim());
        return true;
    } catch (e) {
        console.error('Error saving Sheets API URL:', e);
        return false;
    }
};

// 3. Clear the URL (Disconnect)
export const clearSheetsApiUrl = async (): Promise<boolean> => {
    try {
        await AsyncStorage.removeItem(SHEETS_API_URL_KEY);
        return true;
    } catch (e) {
        console.error('Error clearing Sheets API URL:', e);
        return false;
    }
};

// 4. Send Data to Google Sheets directly
export const syncDataToGoogleSheets = async (services: ServiceItem[]): Promise<boolean> => {
    try {
        const apiUrl = await getSheetsApiUrl();
        if (!apiUrl) {
            // Not connected, silently ignore or handle later
            return false;
        }

        const payload = JSON.stringify({
            data: services
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                // Change to text/plain to bypass CORS preflight OPTIONS request
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: payload,
            // Mode no-cors is mainly for web bypass if needed, but in React Native it should be fine without it.
            // Google Apps Script requires redirects to be followed.
            redirect: 'follow'
        });

        // Some GAS scripts return strange HTTP codes, but typical JSON response is OK
        if (response.ok || response.type === 'opaque') {
            console.log('Successfully synced to Google Sheets.');
            return true;
        } else {
            console.error('Failed to sync to Google Sheets, status:', response.status);
            return false;
        }
    } catch (e) {
        console.error('Error syncing to Google Sheets:', e);
        return false;
    }
};

// 5. Pull Data from Google Sheets
export const pullDataFromGoogleSheets = async (): Promise<{ success: boolean; data?: ServiceItem[]; message?: string }> => {
    try {
        const apiUrl = await getSheetsApiUrl();
        if (!apiUrl) {
            return { success: false, message: 'URL Web App belum diatur.' };
        }

        const response = await fetch(apiUrl, {
            method: 'GET',
            redirect: 'follow'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success' && Array.isArray(result.data)) {
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.message || 'Respon API tidak valid.' };
            }
        } else {
            return { success: false, message: `Gagal mengunduh data, status HTTP: ${response.status}` };
        }
    } catch (e: any) {
        console.error('Error pulling from Google Sheets:', e);
        return { success: false, message: e.message || 'Terjadi kesalahan jaringan.' };
    }
};
