import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  interval
} from 'rxjs';

import {
  FormsModule
} from '@angular/forms';

import {
  DatePipe
} from '@angular/common';

import {
  MeasurementService
} from '../../../../core/services/measurement';

import {
  Measurement
} from '../../../../core/models/measurement.model';

@Component({
  selector: 'app-measurement-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    DatePipe
  ],

  templateUrl:
    './measurement-list.component.html',

  styleUrl:
    './measurement-list.component.css'
})
export class MeasurementListComponent
  implements OnInit {

  private measurementService =
    inject(MeasurementService);

  measurements:
    Measurement[] = [];

  searchTerm = '';

  private cdr =
    inject(ChangeDetectorRef);

  loading = true;

  loadMeasurements(): void {

    this.loading = true;

    this.measurementService
      .getMeasurements()
      .subscribe({

        next: response => {

          this.measurements = response;

          this.loading = false;

          this.cdr.detectChanges();

          console.log(
            'Measurements:',
            this.measurements
          );
        },

        error: error => {

          console.error(error);

          this.loading = false;

          this.cdr.detectChanges();
        }
      });
  }

  ngOnInit(): void {

    this.loadMeasurements();

    interval(15000)
      .subscribe(() => {

        this.loadMeasurements();

      });
  }

  get filteredMeasurements() {

    if (!this.searchTerm.trim()) {
      return this.measurements;
    }

    const term =
      this.searchTerm.toLowerCase();

    return this.measurements.filter(

      measurement =>

        measurement.sensor
          .toString()
          .includes(term)

    );
  }

  getAirQuality(
    measurement: Measurement
  ): string {

    if (
      measurement.co2 > 1000 ||
      measurement.pm25 > 35
    ) {
      return 'BAJO';
    }

    if (
      measurement.co2 > 700 ||
      measurement.pm25 > 20
    ) {
      return 'MODERADO';
    }

    return 'BUENO';
  }

  get averageCo2() {

    if (!this.measurements.length)
      return 0;

    return Math.round(

      this.measurements.reduce(

        (sum, measurement) =>
          sum + measurement.co2,

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

        (sum, measurement) =>
          sum + measurement.pm25,

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

        (sum, measurement) =>
          sum + measurement.temperature,

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

        (sum, measurement) =>
          sum + measurement.humidity,

        0

      ) /

      this.measurements.length

    );
  }
}