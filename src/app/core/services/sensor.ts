import { Injectable, inject }
  from '@angular/core';

import {
  HttpClient
}
  from '@angular/common/http';

import { MeasurementService }
  from '../../core/services/measurement';

import { Measurement }
  from '../../core/models/measurement.model';

import {
  Observable
}
  from 'rxjs';

import {
  Sensor
}
  from '../models/sensor.model';

import {
  AverageMetrics
}
  from '../models/average-metrics.model';

import { SensorStatus } from '../models/sensor-status.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SensorService {

  private http =
    inject(HttpClient);

  private measurementService =
    inject(MeasurementService);

  expandedSensorId?: number;

  measurementsMap:
    Record<number, Measurement[]> = {};

  getSensors(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(
      `${environment.apiUrl}/admin/sensors`
    );
  }

  getSensorsByClientId(clientId: number): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${environment.apiUrl}/admin/sensors/clients/${clientId}`);
  }

  getMySensors(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${environment.apiUrl}/client/sensors`);
  }

  assignSensor(clientId: number, serialNumber: string, location: string, campus: string): Observable<Sensor> {
    const payload = {
      clientId,
      macAddress: serialNumber,
      location,
      campus
    };
    return this.http.post<Sensor>(`${environment.apiUrl}/tech/sensors/assign`, payload);
  }

  getSensorById(id: number): Observable<Sensor> {
    return this.http.get<Sensor>(`${environment.apiUrl}/admin/sensors/${id}`);
  }

  createSensor(
    sensor: Sensor
  ): Observable<Sensor> {

    return this.http.post<Sensor>(
      `${environment.apiUrl}/admin/sensors`,
      sensor
    );
  }

  updateSensor(
    id: number,
    sensor: Sensor
  ): Observable<Sensor> {

    return this.http.put<Sensor>(
      `${environment.apiUrl}/admin/sensors/${id}`,
      sensor
    );

  }

  deleteSensor(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${environment.apiUrl}/admin/sensors/${id}`
    );

  }

  getClientSensors(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${environment.apiUrl}/client/sensors`);
  }

  getAverageMetrics(campus?: string): Observable<AverageMetrics> {
    const params = campus ? `?campus=${encodeURIComponent(campus)}` : '';
    return this.http.get<AverageMetrics>(`${environment.apiUrl}/client/sensors/metrics/average${params}`);
  }

  getHistoricalMetrics(campus?: string): Observable<import('../models/hourly-metric.model').HourlyMetric[]> {
    const offset = new Date().getTimezoneOffset();
    let url = `${environment.apiUrl}/client/sensors/metrics/historical?offset=${offset}`;
    if (campus) {
      url += `&campus=${encodeURIComponent(campus)}`;
    }
    return this.http.get<import('../models/hourly-metric.model').HourlyMetric[]>(url);
  }

  getClientSensorStatus(): Observable<SensorStatus[]> {
    return this.http.get<SensorStatus[]>(`${environment.apiUrl}/client/sensors/status`);
  }
}