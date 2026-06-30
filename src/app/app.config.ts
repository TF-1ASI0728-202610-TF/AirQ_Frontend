import { ApplicationConfig }
  from '@angular/core';

import {
  provideHttpClient,
  withInterceptors
}
  from '@angular/common/http';

import {
  provideRouter
}
  from '@angular/router';

import { provideServiceWorker }
  from '@angular/service-worker';

import { routes }
  from './app.routes';

import {
  jwtInterceptor
}
  from './core/interceptors/jwt-interceptor';

import { environment }
  from '../environments/environment';

export const appConfig: ApplicationConfig = {

  providers: [

    provideRouter(routes),

    provideHttpClient(

      withInterceptors([
        jwtInterceptor
      ])

    ),

    provideServiceWorker(
      'ngsw-worker.js',
      {
        enabled: environment.production,
        registrationStrategy: 'registerWhenStable:30000'
      }
    )

  ]
};