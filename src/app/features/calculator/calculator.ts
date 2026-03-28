import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    DecimalPipe,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Lawn Calculator</h1>

      <div class="card-grid">
        <!-- Product Application Calculator -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>calculate</mat-icon>
            <mat-card-title>Product Application</mat-card-title>
            <mat-card-subtitle>Calculate how much product to use</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="calc-form">
              <mat-form-field appearance="outline">
                <mat-label>Zone Area (sq ft)</mat-label>
                <input
                  matInput
                  type="number"
                  [ngModel]="zoneArea()"
                  (ngModelChange)="zoneArea.set($event)"
                />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Rate (oz per 1,000 sq ft)</mat-label>
                <input
                  matInput
                  type="number"
                  [ngModel]="ratePer1000()"
                  (ngModelChange)="ratePer1000.set($event)"
                />
              </mat-form-field>

              <mat-divider></mat-divider>

              <div class="result">
                <span class="result-label">Product Needed:</span>
                <span class="result-value">{{ productNeeded() | number:'1.1-1' }} oz</span>
              </div>
              <div class="result">
                <span class="result-label">In gallons (128 oz/gal):</span>
                <span class="result-value">{{ productGallons() | number:'1.2-2' }} gal</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Area Calculator -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>square_foot</mat-icon>
            <mat-card-title>Area Calculator</mat-card-title>
            <mat-card-subtitle>Calculate zone area from dimensions</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="calc-form">
              <mat-form-field appearance="outline">
                <mat-label>Shape</mat-label>
                <mat-select
                  [ngModel]="shape()"
                  (ngModelChange)="shape.set($event)"
                >
                  <mat-option value="rectangle">Rectangle</mat-option>
                  <mat-option value="circle">Circle</mat-option>
                  <mat-option value="triangle">Triangle</mat-option>
                </mat-select>
              </mat-form-field>

              @switch (shape()) {
                @case ('rectangle') {
                  <mat-form-field appearance="outline">
                    <mat-label>Length (ft)</mat-label>
                    <input matInput type="number" [ngModel]="dim1()" (ngModelChange)="dim1.set($event)" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Width (ft)</mat-label>
                    <input matInput type="number" [ngModel]="dim2()" (ngModelChange)="dim2.set($event)" />
                  </mat-form-field>
                }
                @case ('circle') {
                  <mat-form-field appearance="outline">
                    <mat-label>Radius (ft)</mat-label>
                    <input matInput type="number" [ngModel]="dim1()" (ngModelChange)="dim1.set($event)" />
                  </mat-form-field>
                }
                @case ('triangle') {
                  <mat-form-field appearance="outline">
                    <mat-label>Base (ft)</mat-label>
                    <input matInput type="number" [ngModel]="dim1()" (ngModelChange)="dim1.set($event)" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Height (ft)</mat-label>
                    <input matInput type="number" [ngModel]="dim2()" (ngModelChange)="dim2.set($event)" />
                  </mat-form-field>
                }
              }

              <mat-divider></mat-divider>

              <div class="result">
                <span class="result-label">Area:</span>
                <span class="result-value">{{ computedArea() | number:'1.0-0' }} sq ft</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Seed Calculator -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>grass</mat-icon>
            <mat-card-title>Seed Calculator</mat-card-title>
            <mat-card-subtitle>Overseeding or new lawn</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="calc-form">
              <mat-form-field appearance="outline">
                <mat-label>Area (sq ft)</mat-label>
                <input matInput type="number" [ngModel]="seedArea()" (ngModelChange)="seedArea.set($event)" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Application</mat-label>
                <mat-select [ngModel]="seedApp()" (ngModelChange)="seedApp.set($event)">
                  <mat-option value="new">New Lawn (6-8 lbs / 1,000 sq ft)</mat-option>
                  <mat-option value="overseed">Overseed (3-4 lbs / 1,000 sq ft)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-divider></mat-divider>

              <div class="result">
                <span class="result-label">Seed Needed:</span>
                <span class="result-value">{{ seedNeeded() | number:'1.1-1' }} lbs</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .calc-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .result {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 16px;
    }
    .result-value {
      font-weight: 500;
      color: var(--primary-color);
    }
  `,
})
export class CalculatorComponent {
  // Product Application
  protected readonly zoneArea = signal(5000);
  protected readonly ratePer1000 = signal(3);
  protected readonly productNeeded = computed(() => (this.zoneArea() / 1000) * this.ratePer1000());
  protected readonly productGallons = computed(() => this.productNeeded() / 128);

  // Area Calculator
  protected readonly shape = signal<'rectangle' | 'circle' | 'triangle'>('rectangle');
  protected readonly dim1 = signal(50);
  protected readonly dim2 = signal(30);
  protected readonly computedArea = computed(() => {
    switch (this.shape()) {
      case 'rectangle':
        return this.dim1() * this.dim2();
      case 'circle':
        return Math.PI * this.dim1() * this.dim1();
      case 'triangle':
        return (this.dim1() * this.dim2()) / 2;
    }
  });

  // Seed Calculator
  protected readonly seedArea = signal(5000);
  protected readonly seedApp = signal<'new' | 'overseed'>('overseed');
  protected readonly seedNeeded = computed(() => {
    const rate = this.seedApp() === 'new' ? 7 : 3.5; // lbs per 1000 sq ft
    return (this.seedArea() / 1000) * rate;
  });
}
