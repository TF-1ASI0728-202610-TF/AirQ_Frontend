import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClientNotificationItem } from '../../../../core/models/notification.model';
import { TicketService } from '../../../../core/services/ticket.service';

@Component({
  selector: 'app-alert-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-center.component.html',
  styleUrl: './alert-center.component.css'
})
export class AlertCenterComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private ticketService = inject(TicketService);
  private router = inject(Router);

  notifications: ClientNotificationItem[] = [];
  filteredNotifications: ClientNotificationItem[] = [];
  
  activeFilter: 'ALL' | 'AI_ACTION' | 'HARDWARE_FAILURE' | 'UNREAD' = 'ALL';
  isLoading = true;
  private pollingInterval: any;
  
  // Track ticket submission state per notification
  submittedTickets: { [id: number]: 'submitting' | 'sent' } = {};

  ngOnInit(): void {
    this.loadNotifications();
    // Iniciar polling silencioso cada 5 segundos
    this.pollingInterval = setInterval(() => {
      this.fetchNotificationsSilently();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.fetchNotificationsSilently();
  }

  private fetchNotificationsSilently(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching notifications', err);
        this.isLoading = false;
      }
    });
  }

  applyFilter(filter: 'ALL' | 'AI_ACTION' | 'HARDWARE_FAILURE' | 'UNREAD'): void {
    this.activeFilter = filter;
    
    switch (filter) {
      case 'AI_ACTION':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'AI_ACTION');
        break;
      case 'HARDWARE_FAILURE':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'HARDWARE_FAILURE');
        break;
      case 'UNREAD':
        this.filteredNotifications = this.notifications.filter(n => !n.isRead);
        break;
      default:
        this.filteredNotifications = [...this.notifications];
        break;
    }
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
          notification.isRead = true;
        }
        this.applyFilter(this.activeFilter);
      },
      error: console.error
    });
  }

  requestTechSupport(notification: ClientNotificationItem): void {
    if (this.submittedTickets[notification.id]) return; // Avoid double clicking
    
    this.submittedTickets[notification.id] = 'submitting';
    
    // El backend espera category, issueDescription, campus, classroom
    const payload = {
      category: 'Falla de Hardware',
      issueDescription: `Reporte Automático desde Notificación: ${notification.diagnosis}\nAcción solicitada: ${notification.executedAction}`,
      campus: notification.location, // En este caso location ya viene del sensor que puede ser la sede o el aula. El backend procesará.
      classroom: '' 
    };

    this.ticketService.createTicket(payload).subscribe({
      next: (res) => {
        this.submittedTickets[notification.id] = 'sent';
      },
      error: (err) => {
        console.error('Error creating ticket from alert:', err);
        delete this.submittedTickets[notification.id];
      }
    });
  }
}
