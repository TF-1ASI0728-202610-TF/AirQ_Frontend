import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Ticket {
  ticketId: string;
  ticketNumber: string;
  clientName: string;
  category: string;
  priority: string;
  deviceId?: string;
  technicianId?: string;
  issueDescription: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/tickets`;
  private clientApiUrl = `${environment.apiUrl}/client/tickets`;

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  getClientTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.clientApiUrl);
  }

  createTicket(ticketData: { category: string, issueDescription: string }): Observable<any> {
    return this.http.post(this.clientApiUrl, ticketData);
  }

  assignTechnician(ticketId: string, technicianId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${ticketId}/assign`, { technicianId });
  }

  resolveTicket(ticketId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${ticketId}/resolve`, {});
  }
}
