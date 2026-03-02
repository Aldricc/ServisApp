import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getSheetsApiUrl, pullDataFromGoogleSheets } from '../utils/sheetsApi';
import { getServiceData, overwriteServiceData } from '../utils/storage';

const POLL_INTERVAL_MS = 10000; // 10 detik

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'no-url';

export function useSheetsAutoSync(onDataUpdated?: () => void) {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const appState = useRef(AppState.currentState);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const doSync = async () => {
        const url = await getSheetsApiUrl();
        if (!url) {
            setSyncStatus('no-url');
            return;
        }

        setSyncStatus('syncing');
        try {
            const result = await pullDataFromGoogleSheets();
            if (result.success && result.data) {
                // Bandingkan dengan data lokal — hanya overwrite jika berbeda
                const localData = await getServiceData();
                const localJson = JSON.stringify(
                    [...localData].sort((a, b) => a.id.localeCompare(b.id))
                );
                const remoteJson = JSON.stringify(
                    [...result.data].sort((a, b) => a.id.localeCompare(b.id))
                );

                if (localJson !== remoteJson) {
                    await overwriteServiceData(result.data);
                    onDataUpdated?.();
                }

                setSyncStatus('synced');
                setLastSynced(new Date());
            } else {
                setSyncStatus('error');
            }
        } catch {
            setSyncStatus('error');
        }
    };

    const startPolling = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(doSync, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        // Sync pertama kali saat mount
        doSync();
        startPolling();

        // Sync saat app kembali ke foreground
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                doSync();
            }
            appState.current = nextState;
        });

        return () => {
            stopPolling();
            subscription.remove();
        };
    }, []);

    return { syncStatus, lastSynced, syncNow: doSync };
}
