# AirQ Frontend

## Description
This is the web application for the AirQ system, developed using Angular. It provides interactive dashboards for both End Clients (schools, corporations) and System Administrators.

## Key Features
- **Client Dashboard**: Allows clients to view real-time and historical air quality metrics (CO2, PM2.5, Temperature, Humidity) separated by campus and classroom.
- **Admin Dashboard**: Enables administrators to manage billing, subscription plans, onboarding of new clients, and oversee technician ticketing.
- **Role-Based Routing**: Secure routing and component rendering based on whether the logged-in user is an ADMIN or a CLIENT.
- **Data Visualization**: Uses charting libraries to display granular sensor data dynamically.
- **Onboarding Flow**: Dedicated interface for admins to approve new organizations and assign them subscription plans (e.g., Basic, Pro).

## Tech Stack
- Angular 17+
- TypeScript
- HTML5 & CSS3
- RxJS (Reactive programming)

## How to Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   ng serve
   ```
3. Navigate to `http://localhost:4200/` in your browser.

## Deployment
The application can be built for production using:
```bash
ng build --configuration production
```
The resulting static files in the `dist/` directory can be hosted on any standard web hosting provider or CDN.
