import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  MeasurementService
} from '../../../../core/services/measurement';

import {
  SensorService
} from '../../../../core/services/sensor';

import {
  Measurement
} from '../../../../core/models/measurement.model';

import {
  Sensor
} from '../../../../core/models/sensor.model';

@Component({
  selector: 'app-analytics-dashboard',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './analytics-dashboard.component.html',

  styleUrl:
    './analytics-dashboard.component.css'
})
export class AnalyticsDashboardComponent
  implements OnInit {

  private measurementService =
    inject(MeasurementService);

  private sensorService =
    inject(SensorService);

  measurements: Measurement[] = [];

  sensors: Sensor[] = [];

  ngOnInit(): void {

    this.measurementService
      .getMeasurements()
      .subscribe(data => {

        this.measurements = data;

      });

    this.sensorService
      .getSensors()
      .subscribe(data => {

        this.sensors = data;

      });

  }

  get averageCo2() {

    if (!this.measurements.length)
      return 0;

    return Math.round(

      this.measurements.reduce(
        (sum, m) => sum + m.co2,
        0
      ) /

      this.measurements.length

    );
  }

  get averagePm25() {

    if (!this.measurements.length)
      return 0;

    return Math.round(

      this.measurements.reduce(
        (sum, m) => sum + m.pm25,
        0
      ) /

      this.measurements.length

    );
  }

  get averageTemperature() {

    if (!this.measurements.length)
      return 0;

    return Math.round(

      this.measurements.reduce(
        (sum, m) => sum + m.temperature,
        0
      ) /

      this.measurements.length

    );
  }

  get averageHumidity() {

    if (!this.measurements.length)
      return 0;

    return Math.round(

      this.measurements.reduce(
        (sum, m) => sum + m.humidity,
        0
      ) /

      this.measurements.length

    );
  }

  get activeSensorsCount(): number {

    return this.sensors.filter(
      sensor => sensor.active
    ).length;

  }

  get sensorsAtRisk(): number {

    return this.measurements.filter(

      measurement =>

        measurement.co2 > 1000 ||
        measurement.pm25 > 35

    ).length;

  }

  get globalAirQuality(): string {

    if (
      this.averageCo2 > 1000 ||
      this.averagePm25 > 35
    ) {
      return 'BAJO';
    }

    if (
      this.averageCo2 > 700 ||
      this.averagePm25 > 20
    ) {
      return 'MODERADO';
    }

    return 'BUENO';

  }

  get criticalLocation(): string {

    if (
      !this.measurements.length ||
      !this.sensors.length
    ) {
      return 'Sin datos';
    }

    let worstMeasurement =
      this.measurements[0];

    this.measurements.forEach(measurement => {

      const currentScore =
        measurement.co2 +
        measurement.pm25 * 20;

      const worstScore =
        worstMeasurement.co2 +
        worstMeasurement.pm25 * 20;

      if (currentScore > worstScore) {

        worstMeasurement =
          measurement;

      }

    });

    return worstMeasurement.sensor.location;

  }

  get alerts(): string[] {

    const alerts: string[] = [];

    this.measurements.forEach(measurement => {

      if (
        measurement.co2 > 1000 ||
        measurement.pm25 > 35
      ) {

        alerts.push(
          `🔴 ${measurement.sensor.serialNumber}
(${measurement.sensor.location})
presenta contaminación crítica`
        );

      }

      else if (
        measurement.co2 > 700 ||
        measurement.pm25 > 20
      ) {

        alerts.push(
          `🟡 ${measurement.sensor.serialNumber}
(${measurement.sensor.location})
requiere monitoreo preventivo`
        );

      }

    });

    return alerts;

  }

  get topPollutedSensors() {

    return [...this.measurements]

      .sort((a, b) => {

        const scoreA =
          a.co2 + a.pm25 * 20;

        const scoreB =
          b.co2 + b.pm25 * 20;

        return scoreB - scoreA;

      })

      .slice(0, 5);

  }

}