import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment }
  from '../../../environments/environment';

import { DashboardResponse }
  from '../models/dashboard-response.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private http = inject(HttpClient);

  private api =
    `${environment.apiUrl}/analytics`;

  getDashboard(): Observable<DashboardResponse> {

    return this.http.get<DashboardResponse>(
      `${this.api}/dashboard`
    );
  }
}