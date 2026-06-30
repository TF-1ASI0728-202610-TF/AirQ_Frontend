import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  MeasurementService
} from '../../../../core/services/measurement';

import {
  Measurement
} from '../../../../core/models/measurement.model';

import {
  NotificationItem
} from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notification-list',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './notification-list.component.html',

  styleUrl:
    './notification-list.component.css'
})
export class NotificationListComponent
  implements OnInit {

  private measurementService =
    inject(MeasurementService);

  measurements: Measurement[] = [];

  ngOnInit(): void {

    this.measurementService
      .getMeasurements()
      .subscribe(data => {

        this.measurements = data;

        this.markAllAsRead();

      });

  }

  isNotificationRead(
    sensorId: number,
    date: string
  ): boolean {

    const readNotifications = JSON.parse(

      localStorage.getItem(
        'readNotifications'
      ) ?? '[]'

    );

    return readNotifications.includes(
      `${sensorId}-${date}`
    );

  }

  markAllAsRead(): void {

    const readNotifications =

      this.measurements

        .filter(
          measurement =>
            measurement.co2 > 700 ||
            measurement.pm25 > 20
        )

        .map(
          measurement =>
            `${measurement.sensor.id}-${measurement.recordedAt}`
        );

    localStorage.setItem(
      'readNotifications',
      JSON.stringify(readNotifications)
    );

  }

  get notifications(): NotificationItem[] {

    return this.measurements

      .filter(

        measurement =>

          measurement.co2 > 700 ||

          measurement.pm25 > 20

      )

      .map(measurement => ({

        title:

          measurement.co2 > 1000 ||

            measurement.pm25 > 35

            ? 'Alerta Crítica'

            : 'Alerta Preventiva',

        message:

          measurement.co2 > 1000

            ? 'Nivel elevado de CO₂ detectado'

            : 'Partículas PM2.5 por encima del rango recomendado',

        severity:

          measurement.co2 > 1000 ||

            measurement.pm25 > 35

            ? 'HIGH'

            : 'MEDIUM',

        sensorId:
          measurement.sensor.id,

        sensorSerialNumber:
          measurement.sensor.serialNumber,

        location:
          measurement.sensor.location,

        date:

          measurement.recordedAt,

        isRead:

          this.isNotificationRead(

            measurement.sensor.id,

            measurement.recordedAt

          )

      }));

  }

  get criticalAlerts() {

    return this.notifications.filter(

      notification =>

        notification.severity === 'HIGH'

    ).length;

  }

  get mediumAlerts() {

    return this.notifications.filter(

      notification =>

        notification.severity === 'MEDIUM'

    ).length;

  }

}