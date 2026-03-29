import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/shell').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'weather',
        loadComponent: () =>
          import('./features/weather/weather').then(
            (m) => m.WeatherComponent
          ),
      },
      {
        path: 'yard',
        loadComponent: () =>
          import('./features/yard/my-yard').then((m) => m.MyYardComponent),
      },
      {
        path: 'seasonal',
        loadComponent: () =>
          import('./features/seasonal/seasonal-plan').then(
            (m) => m.SeasonalPlanComponent
          ),
      },
      {
        path: 'treatments',
        loadComponent: () =>
          import('./features/treatments/treatment-log').then(
            (m) => m.TreatmentLogComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products').then(
            (m) => m.ProductsComponent
          ),
      },
      {
        path: 'gdd',
        loadComponent: () =>
          import('./features/gdd/gdd-tracker').then(
            (m) => m.GddTrackerComponent
          ),
      },
      {
        path: 'equipment',
        loadComponent: () =>
          import('./features/equipment/equipment').then(
            (m) => m.EquipmentComponent
          ),
      },
      {
        path: 'calculator',
        loadComponent: () =>
          import('./features/calculator/calculator').then(
            (m) => m.CalculatorComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings').then(
            (m) => m.SettingsComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
