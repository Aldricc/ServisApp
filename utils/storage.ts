import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncDataToGoogleSheets } from './sheetsApi';

export interface ServiceItem {
    id: string;
    instansi: string;
    namaBarang: string;
    tanggalMasuk: string;
    tanggalKeluar: string;
    deskripsi: string;
    keteranganPerbaikan?: string;
    ruangan: string;
    createdAt: number;
}

const STORAGE_KEY = '@service_data';

export const saveServiceData = async (data: Omit<ServiceItem, 'id' | 'createdAt'>) => {
    try {
        const existingData = await getServiceData();
        const newItem: ServiceItem = {
            ...data,
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            createdAt: Date.now(),
        };
        const newData = [newItem, ...existingData];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        // Fire & forget sync
        syncDataToGoogleSheets(newData).catch(console.error);
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
};

export const getServiceData = async (): Promise<ServiceItem[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
};

export const overwriteServiceData = async (data: ServiceItem[]) => {
    try {
        // We do not trigger syncToGoogleSheets here to prevent infinite upload-download loops
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // As a bonus, we should also extract and overwrite the Instansi list to ensure it's up to date
        // with whatever unique Instansi are in the newly downloaded data.
        const uniqueInstansis = Array.from(new Set(data.map(item => item.instansi).filter(Boolean)));
        if (uniqueInstansis.length > 0) {
            await AsyncStorage.setItem('@instansi_data', JSON.stringify(uniqueInstansis));
        }

        return true;
    } catch (error) {
        console.error('Error overwriting data:', error);
        return false;
    }
};

export const updateServiceItem = async (id: string, updates: Partial<ServiceItem>) => {
    try {
        const existingData = await getServiceData();
        let hasChanges = false;
        const newData = existingData.map(item => {
            if (item.id === id) {
                hasChanges = true;
                return { ...item, ...updates };
            }
            return item;
        });

        if (hasChanges) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            // Fire & forget sync
            syncDataToGoogleSheets(newData).catch(console.error);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating service data:', error);
        return false;
    }
};

export const deleteServiceItem = async (id: string) => {
    try {
        const existingData = await getServiceData();
        const newData = existingData.filter(item => item.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        // Fire & forget sync
        syncDataToGoogleSheets(newData).catch(console.error);
        return true;
    } catch (error) {
        console.error('Error deleting data', error);
        return false;
    }
};

// --- INSTANSI CRUD ---
const INSTANSI_KEY = '@instansi_data';

export const saveInstansi = async (name: string) => {
    try {
        const existingData = await getInstansis();
        if (existingData.includes(name)) return false;
        const newData = [...existingData, name];
        await AsyncStorage.setItem(INSTANSI_KEY, JSON.stringify(newData));
        return true;
    } catch (error) {
        console.error('Error saving instansi:', error);
        return false;
    }
};

export const getInstansis = async (): Promise<string[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(INSTANSI_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error reading instansi:', error);
        return [];
    }
};

export const updateInstansi = async (oldName: string, newName: string) => {
    try {
        if (!newName.trim() || oldName === newName) return false;

        // 1. Update the Instansi List
        const existingInstansis = await getInstansis();
        if (existingInstansis.includes(newName)) return false; // Prevent renaming to an existing one

        const updatedInstansis = existingInstansis.map(item => item === oldName ? newName : item);
        await AsyncStorage.setItem(INSTANSI_KEY, JSON.stringify(updatedInstansis));

        // 2. Cascade update to all ServiceItems
        const existingServices = await getServiceData();
        let hasChanges = false;
        const updatedServices = existingServices.map(service => {
            if (service.instansi === oldName) {
                hasChanges = true;
                return { ...service, instansi: newName };
            }
            return service;
        });

        if (hasChanges) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedServices));
        }

        return true;
    } catch (error) {
        console.error('Error updating instansi:', error);
        return false;
    }
};

export const deleteInstansi = async (name: string) => {
    try {
        const existingData = await getInstansis();
        const newData = existingData.filter(item => item !== name);
        await AsyncStorage.setItem(INSTANSI_KEY, JSON.stringify(newData));
        return true;
    } catch (error) {
        console.error('Error deleting instansi', error);
        return false;
    }
};
