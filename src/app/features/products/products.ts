import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { ProductFormDialogComponent } from './product-form-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog';

@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Products</h1>
        <button mat-flat-button (click)="openForm()">
          <mat-icon>add</mat-icon> Add Product
        </button>
      </div>

      <div class="card-grid">
        @for (product of products(); track product.id) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>inventory_2</mat-icon>
              <mat-card-title>{{ product.name }}</mat-card-title>
              <mat-card-subtitle>{{ product.activeIngredient }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-chip-set>
                <mat-chip>{{ product.type }}</mat-chip>
              </mat-chip-set>
              @if (product.applicationRatePerKSqFt) {
                <p class="detail">Rate: {{ product.applicationRatePerKSqFt }} {{ product.applicationRateUnit ?? 'oz' }} / 1,000 sq ft</p>
              }
              @if (product.gddWindowMin || product.gddWindowMax) {
                <p class="detail">GDD Window: {{ product.gddWindowMin ?? '—' }} – {{ product.gddWindowMax ?? '—' }}</p>
              }
              @if (product.notes) {
                <p class="detail notes">{{ product.notes }}</p>
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="openForm(product)">
                <mat-icon>edit</mat-icon> Edit
              </button>
              <button mat-button color="warn" (click)="deleteProduct(product)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            </mat-card-actions>
          </mat-card>
        } @empty {
          <mat-card>
            <mat-card-content>
              <div class="empty-state">
                <mat-icon class="empty-icon">inventory_2</mat-icon>
                <p>No products added yet.</p>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .detail {
      font-size: 14px;
      margin: 4px 0;
    }
    .notes {
      opacity: 0.8;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      opacity: 0.7;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `,
})
export class ProductsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);

  protected readonly products = signal<Product[]>([]);

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.productService.getProducts(this.uid).subscribe((p) => this.products.set(p));
  }

  protected openForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      width: '500px',
      data: { product },
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<Product> | undefined) => {
      if (!result) return;
      if (product) {
        await this.productService.update(this.uid, product.id, result);
      } else {
        await this.productService.add(this.uid, result);
      }
      this.productService.getProducts(this.uid).subscribe((p) => this.products.set(p));
    });
  }

  protected deleteProduct(product: Product): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Product',
        message: `Delete "${product.name}"?`,
        confirmText: 'Delete',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.productService.delete(this.uid, product.id);
        this.productService.getProducts(this.uid).subscribe((p) => this.products.set(p));
      }
    });
  }
}
