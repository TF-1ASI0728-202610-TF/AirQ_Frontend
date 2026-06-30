import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, Ticket } from '../../../../core/services/ticket.service';
import { TechService } from '../../../../core/services/tech.service';

@Component({
  selector: 'app-ticket-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-management.component.html',
  styleUrls: ['./ticket-management.component.css']
})
export class TicketManagementComponent implements OnInit, OnDestroy {
  private ticketService = inject(TicketService);
  private techService = inject(TechService);
  private cdr = inject(ChangeDetectorRef);

  tickets: Ticket[] = [];
  technicians: any[] = [];
  isLoading = true;
  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.loadData();
    this.refreshSubscription = interval(10000).subscribe(() => {
      this.loadData(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadData(silent = false) {
    if (!silent) {
      this.isLoading = true;
    }
    this.techService.getTechnicians().subscribe({
      next: (techs) => {
        this.technicians = techs;
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error fetching technicians', err);
        this.loadTickets(); // Load tickets anyway
      }
    });
  }

  loadTickets() {
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get openTickets() { return this.tickets.filter(t => t.status === 'OPEN'); }
  get inProgressTickets() { return this.tickets.filter(t => t.status === 'IN_PROGRESS'); }
  get resolvedTickets() { return this.tickets.filter(t => t.status === 'RESOLVED'); }

  assignTechnician(ticket: Ticket, techId: string) {
    if (!techId) return;
    // Update locally immediately for UX
    ticket.technicianId = techId;
    ticket.status = 'IN_PROGRESS';
    this.cdr.detectChanges();
    
    // In a real scenario we use real UUIDs. The mock data has '1', '2' which might fail in backend.
    if (ticket.ticketId.length > 10) {
      this.ticketService.assignTechnician(ticket.ticketId, techId).subscribe({
        next: () => console.log('Técnico asignado exitosamente'),
        error: (err) => console.error('Error al asignar técnico', err)
      });
    }
  }

  resolveTicket(ticket: Ticket) {
    // Update locally immediately for UX
    ticket.status = 'RESOLVED';
    ticket.resolvedAt = new Date().toISOString();
    this.cdr.detectChanges();

    if (ticket.ticketId.length > 10) {
      this.ticketService.resolveTicket(ticket.ticketId).subscribe({
        next: () => console.log('Ticket resuelto exitosamente'),
        error: (err) => console.error('Error al resolver ticket', err)
      });
    }
  }

  getPriorityColor(priority: string): string {
    switch(priority?.toLowerCase()) {
      case 'alto': return '#dc3545';
      case 'medio': return '#ffc107';
      case 'bajo': return '#28a745';
      default: return '#6c757d';
    }
  }
}
