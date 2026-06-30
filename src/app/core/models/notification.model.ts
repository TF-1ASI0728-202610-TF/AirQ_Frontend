export interface NotificationItem {
  title: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM';
  sensorId: number;
  sensorSerialNumber: string;
  location: string;
  date: string;
  isRead: boolean;
}

export interface ClientNotificationItem {
  id: number;
  type: 'AI_ACTION' | 'HARDWARE_FAILURE';
  location: string;
  diagnosis: string;
  executedAction: string;
  isRead: boolean;
  createdAt: string;
}