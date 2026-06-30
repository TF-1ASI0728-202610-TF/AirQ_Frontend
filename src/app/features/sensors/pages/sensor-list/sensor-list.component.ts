import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import {
  interval,
  Subscription
} from 'rxjs';

import {
  FormsModule,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  CommonModule,
  DatePipe
} from '@angular/common';

import Swal from 'sweetalert2';

import {
  ChangeDetectorRef
} from '@angular/core';

import {
  SensorService
} from '../../../../core/services/sensor';

import {
  MeasurementService
} from '../../../../core/services/measurement';

import {
  Sensor
} from '../../../../core/models/sensor.model';

import {
  Measurement
} from '../../../../core/models/measurement.model';

@Component({
  selector: 'app-sensor-list',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    FormsModule
  ],

  templateUrl:
    './sensor-list.component.html',

  styleUrl:
    './sensor-list.component.css'
})
export class SensorListComponent
  implements OnInit, OnDestroy {

  private sensorService =
    inject(SensorService);

  private measurementService =
    inject(MeasurementService);

  showDeleteModal = false;

  sensorToDelete: number | null = null;

  private cdr =
    inject(ChangeDetectorRef);

  private fb =
    inject(FormBuilder);

  private refreshSubscription?:
    Subscription;

  sensors: Sensor[] = [];

  measurementsMap:
    Record<number, Measurement[]> = {};

  loading = true;

  showModal = false;

  searchTerm = '';

  expandedSensorId:
    number | null = null;

  editingSensorId:
    number | null = null;

  sensorForm =
    this.fb.group({

      serialNumber: [
        '',
        Validators.required
      ],

      location: [
        '',
        Validators.required
      ]

    });

  ngOnInit(): void {

    this.loadSensors();

    this.refreshSubscription =
      interval(10000)
        .subscribe(() => {
          this.loadSensors(true);
        });
  }

  openDeleteModal(
    sensorId: number
  ): void {

    this.sensorToDelete =
      sensorId;

    this.showDeleteModal =
      true;

  }

  confirmDelete(): void {

    if (
      !this.sensorToDelete
    ) {
      return;
    }

    this.sensorService
      .deleteSensor(
        this.sensorToDelete
      )
      .subscribe({

        next: () => {

          delete this.measurementsMap[
            this.sensorToDelete!
          ];

          this.loadSensors();

          this.showDeleteModal =
            false;

        }

      });

  }

  closeDeleteModal(): void {

    this.showDeleteModal =
      false;

    this.sensorToDelete =
      null;

  }

  ngOnDestroy(): void {

    this.refreshSubscription
      ?.unsubscribe();

  }

  loadSensors(silent = false): void {
    if (!silent) {
      this.loading = true;
    }

    this.sensorService
      .getSensors()
      .subscribe({

        next: sensors => {

          this.sensors = sensors;

          console.log(
            'Sensores cargados:',
            sensors
          );

          sensors.forEach(sensor => {

            this.measurementService
              .getBySensor(sensor.id)
              .subscribe({

                next: measurements => {

                  console.log(
                    'Sensor:',
                    sensor.id,
                    'Measurements:',
                    measurements
                  );

                  this.measurementsMap[
                    sensor.id
                  ] = measurements;

                  this.cdr.detectChanges();

                },

                error: error => {

                  console.error(
                    'Error obteniendo mediciones',
                    error
                  );

                }

              });

          });

          this.loading = false;

        },

        error: error => {

          console.error(error);

          this.loading = false;

        }

      });

  }

  get filteredSensors():
    Sensor[] {

    if (
      !this.searchTerm.trim()
    ) {
      return this.sensors;
    }

    const term =
      this.searchTerm.toLowerCase();

    return this.sensors.filter(
      sensor =>

        sensor.serialNumber
          .toLowerCase()
          .includes(term)

        ||

        sensor.location
          .toLowerCase()
          .includes(term)

        ||

        sensor.id
          .toString()
          .includes(term)
    );

  }

  toggleSensor(sensorId: number): void {

    this.expandedSensorId =
      this.expandedSensorId === sensorId
        ? null
        : sensorId;

  }

  openModal(): void {

    this.editingSensorId = null;

    this.sensorForm.reset();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.editingSensorId = null;

    this.sensorForm.reset();

  }

  createSensor(): void {

    if (this.sensorForm.invalid) {
      return;
    }

    const payload =
      this.sensorForm.getRawValue();

    if (this.editingSensorId) {

      this.sensorService
        .updateSensor(
          this.editingSensorId,
          payload as any
        )
        .subscribe({

          next: () => {

            this.closeModal();

            this.loadSensors();

          },

          error: console.error

        });

      return;
    }

    this.sensorService
      .createSensor(payload as any)
      .subscribe({
        next: () => {

          this.closeModal();
          this.loadSensors();

        }
      });

  }

  editSensor(
    sensor: Sensor
  ): void {

    this.editingSensorId =
      sensor.id;

    this.sensorForm.patchValue({

      serialNumber:
        sensor.serialNumber,

      location:
        sensor.location

    });

    this.showModal = true;

  }

  deleteSensor(id: number): void {
    Swal.fire({
      title: '¿Eliminar sensor?',
      text: '¿Deseas eliminar este sensor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sensorService.deleteSensor(id).subscribe({
          next: () => {
            this.loadSensors();
          },
          error: (err) => console.error('Error al eliminar sensor:', err)
        });
      }
    });
  }

  getLatestMeasurement(
    sensorId: number
  ): Measurement | null {

    const measurements =
      this.measurementsMap[
      sensorId
      ];

    if (
      !measurements ||
      measurements.length === 0
    ) {
      return null;
    }

    return measurements[
      measurements.length - 1
    ];

  }

  getAirQuality(
    measurement:
      Measurement | null
  ): string {

    if (!measurement) {
      return 'SIN DATOS';
    }

    if (
      measurement.co2 > 1000 ||
      measurement.pm25 > 35
    ) {
      return 'CRÍTICO';
    }

    if (
      measurement.co2 > 700 ||
      measurement.pm25 > 20
    ) {
      return 'MODERADO';
    }

    return 'BUENO';

  }

  get activeSensors(): number {

    return this.sensors.filter(
      sensor => sensor.active
    ).length;

  }

  get inactiveSensors(): number {

    return this.sensors.filter(
      sensor => !sensor.active
    ).length;

  }

}