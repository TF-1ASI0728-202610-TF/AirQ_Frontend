export interface SensorStatus {
    id: number;
    serialNumber: string;
    campus: string;
    location: string;
    isOnline: boolean;
    latestCo2: number | null;
    latestPm25: number | null;
    lastSeen: string | null;
}
