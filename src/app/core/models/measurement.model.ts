import { Sensor } from './sensor.model';

export interface Measurement {

    id: number;

    co2: number;

    pm25: number;

    temperature: number;

    humidity: number;

    recordedAt: string;

    sensor: Sensor;

}