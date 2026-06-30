import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, UserProfile, UpdateProfileRequest } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-client-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-settings.component.html',
  styleUrl: './client-settings.component.css'
})
export class ClientSettingsComponent implements OnInit {
  profile: UserProfile | null = null;
  
  // Form fields
  username = '';
  email = '';
  password = '';
  campuses: string[] = [];
  newCampus = '';

  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.username = data.username;
        this.email = data.email;
        this.campuses = data.campuses ? [...data.campuses] : [];
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.errorMessage = 'Error al cargar el perfil.';
      }
    });
  }

  addCampus(): void {
    if (this.newCampus.trim()) {
      const campus = this.newCampus.trim();
      if (!this.campuses.includes(campus)) {
        this.campuses.push(campus);
      }
      this.newCampus = '';
    }
  }

  removeCampus(index: number): void {
    this.campuses.splice(index, 1);
  }

  saveChanges(): void {
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const request: UpdateProfileRequest = {
      username: this.username,
      email: this.email,
      password: this.password ? this.password : undefined,
      campuses: this.campuses
    };

    this.profileService.updateProfile(request).subscribe({
      next: (data) => {
        this.isSaving = false;
        this.successMessage = 'Perfil y sedes actualizados exitosamente.';
        this.password = ''; // Clear password field
        this.profile = data;
        this.campuses = data.campuses ? [...data.campuses] : [];
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error updating profile', err);
        this.errorMessage = err.error?.message || 'Error al actualizar el perfil. Revisa los datos o intenta más tarde.';
      }
    });
  }
}
