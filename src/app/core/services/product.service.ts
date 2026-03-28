import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProducts(uid: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/api/products`);
  }

  async add(uid: string, product: Partial<Product>): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<Product>(`${this.apiUrl}/api/products`, product),
    );
    return created.id;
  }

  async update(uid: string, productId: string, data: Partial<Product>): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/products/${productId}`, data),
    );
  }

  async delete(uid: string, productId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/api/products/${productId}`),
    );
  }
}
