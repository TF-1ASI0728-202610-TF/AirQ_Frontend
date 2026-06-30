import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  Chart,
  registerables
} from 'chart.js';

Chart.register(
  ...registerables
);

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
  selector: 'app-prediction-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-dashboard.component.html',
  styleUrl: './prediction-dashboard.component.css'
})
export class PredictionDashboardComponent
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

        setTimeout(() => {

          this.createCo2Chart();

          this.createPm25Chart();

          this.createClimateChart();

          this.createRiskChart();

        });

      });

    this.sensorService
      .getSensors()
      .subscribe(data => {

        this.sensors = data;

      });

  }

  createPm25Chart(): void {

    const canvas =

      document.getElementById(
        'pm25Chart'
      ) as HTMLCanvasElement;

    if (!canvas) return;

    new Chart(canvas, {

      type: 'line',

      data: {

        labels:

          this.measurements.map(

            measurement =>

              new Date(
                measurement.recordedAt
              ).toLocaleDateString()

          ),

        datasets: [

          {

            label: 'PM2.5',

            data:

              this.measurements.map(

                measurement =>
                  measurement.pm25

              ),

            tension: 0.4

          }

        ]

      }

    });

  }

  createClimateChart(): void {

    const canvas =

      document.getElementById(
        'climateChart'
      ) as HTMLCanvasElement;

    if (!canvas) return;

    new Chart(canvas, {

      type: 'bar',

      data: {

        labels:

          this.measurements.map(

            measurement =>

              new Date(
                measurement.recordedAt
              ).toLocaleDateString()

          ),

        datasets: [

          {

            label: 'Temperatura',

            data:

              this.measurements.map(

                measurement =>
                  measurement.temperature

              )

          },

          {

            label: 'Humedad',

            data:

              this.measurements.map(

                measurement =>
                  measurement.humidity

              )

          }

        ]

      }

    });

  }

  get riskDistribution() {

    let good = 0;
    let moderate = 0;
    let critical = 0;

    this.measurements.forEach(

      measurement => {

        if (
          measurement.co2 > 1000 ||
          measurement.pm25 > 35
        ) {

          critical++;

        }

        else if (
          measurement.co2 > 700 ||
          measurement.pm25 > 20
        ) {

          moderate++;

        }

        else {

          good++;

        }

      }

    );

    return {

      good,
      moderate,
      critical

    };

  }

  createRiskChart(): void {

    const canvas =

      document.getElementById(
        'riskChart'
      ) as HTMLCanvasElement;

    if (!canvas) return;

    new Chart(canvas, {

      type: 'doughnut',

      data: {

        labels: [

          'Bueno',
          'Moderado',
          'Crítico'

        ],

        datasets: [

          {

            data: [

              this.riskDistribution.good,

              this.riskDistribution.moderate,

              this.riskDistribution.critical

            ]

          }

        ]

      }

    });

  }

  createCo2Chart(): void {

    const canvas =

      document.getElementById(
        'co2Chart'
      ) as HTMLCanvasElement;

    if (!canvas) return;

    const labels =

      this.measurements.map(

        measurement =>

          new Date(
            measurement.recordedAt
          ).toLocaleDateString()

      );

    const values =

      this.measurements.map(

        measurement =>

          measurement.co2

      );

    new Chart(canvas, {

      type: 'line',

      data: {

        labels,

        datasets: [

          {

            label:
              'CO₂ (ppm)',

            data:
              values,

            tension: 0.4,

            fill: true

          }

        ]

      },

      options: {

        responsive: true

      }

    });
  }

  get projectedRisk(): string {

    if (
      this.averageCo2 > 1000 ||
      this.averagePm25 > 35
    ) {
      return 'CRÍTICO';
    }

    if (
      this.averageCo2 > 700 ||
      this.averagePm25 > 20
    ) {
      return 'MODERADO';
    }

    return 'BAJO';
  }

  get averageCo2(): number {

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

  get averagePm25(): number {

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

  get co2Trend(): string {

    if (this.measurements.length < 2)
      return 'ESTABLE';

    const first =
      this.measurements[0].co2;

    const last =
      this.measurements[
        this.measurements.length - 1
      ].co2;

    if (last > first)
      return 'SUBIENDO';

    if (last < first)
      return 'BAJANDO';

    return 'ESTABLE';

  }

  get pm25Trend(): string {

    if (this.measurements.length < 2)
      return 'ESTABLE';

    const first =
      this.measurements[0].pm25;

    const last =
      this.measurements[
        this.measurements.length - 1
      ].pm25;

    if (last > first)
      return 'SUBIENDO';

    if (last < first)
      return 'BAJANDO';

    return 'ESTABLE';

  }

  get highestRiskSensor(): string {

    if (!this.measurements.length)
      return 'Sin datos';

    const worst =
      [...this.measurements]

        .sort((a, b) => {

          const scoreA =
            a.co2 + a.pm25 * 20;

          const scoreB =
            b.co2 + b.pm25 * 20;

          return scoreB - scoreA;

        })[0];

    return `Sensor #${worst.sensor}`;

  }

  get highestRiskLocation(): string {

    if (
      !this.measurements.length ||
      !this.sensors.length
    ) {
      return 'Sin datos';
    }

    const worst =
      [...this.measurements]

        .sort((a, b) => {

          const scoreA =
            a.co2 + a.pm25 * 20;

          const scoreB =
            b.co2 + b.pm25 * 20;

          return scoreB - scoreA;

        })[0];

    const sensor =
      this.sensors.find(

        sensor =>
          sensor.id ===
          worst.sensor.id

      );

    return sensor?.location ??
      'Sin ubicación';

  }

}