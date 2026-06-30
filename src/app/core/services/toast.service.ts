import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  toastState$: Observable<ToastMessage | null> = this.toastSubject.asObservable();

  showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  showError(message: string): void {
    this.showToast(message, 'error');
  }

  showInfo(message: string): void {
    this.showToast(message, 'info');
  }

  showWarning(message: string): void {
    this.showToast(message, 'warning');
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastSubject.next({ message, type });
    // Auto hide after 4 seconds
    setTimeout(() => {
      this.clear();
    }, 4000);
  }

  clear(): void {
    this.toastSubject.next(null);
  }
}
