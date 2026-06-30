import { Injectable, inject }
  from '@angular/core';

import { HttpClient }
  from '@angular/common/http';

import { Observable }
  from 'rxjs';

import { Measurement }
  from '../models/measurement.model';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MeasurementService {

  private http =
    inject(HttpClient);

  getMeasurements(): Observable<Measurement[]> {
    return this.http.get<Measurement[]>(
      `${environment.apiUrl}/measurements`
    );
  }

  getBySensor(
    sensorId: number
  ): Observable<Measurement[]> {

    return this.http.get<Measurement[]>(
      `${environment.apiUrl}/measurements/sensor/${sensorId}`
    );
  }

  createMeasurement(
    measurement: {
      sensorId: number;
      co2: number;
      pm25: number;
      temperature: number;
      humidity: number;
    }
  ): Observable<Measurement> {

    return this.http.post<Measurement>(
      `${environment.apiUrl}/measurements`,
      measurement
    );
  }
}