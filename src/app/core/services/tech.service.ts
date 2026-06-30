import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TechService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/users/tech`;

  getTechnicians(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createTechnician(techData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, techData);
  }

  deleteTechnician(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
