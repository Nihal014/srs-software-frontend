import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  CreateProductAuditPayload,
  CreateProductWastagePayload,
  ProductAuditRow,
  ProductLotRow,
  ProductStockStatus,
  ProductWastageRow,
} from '../models/product-inventory.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class ProductInventoryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/product-inventory`;

  private paging(page: number, pageSize: number) {
    return { page: String(page), pageSize: String(pageSize) };
  }

  status() {
    return this.http.get<ProductStockStatus>(`${this.base}/status`);
  }

  lots(page: number, pageSize: number) {
    return this.http.get<Paged<ProductLotRow>>(`${this.base}/lots`, { params: this.paging(page, pageSize) });
  }

  audits(page: number, pageSize: number) {
    return this.http.get<Paged<ProductAuditRow>>(`${this.base}/audits`, { params: this.paging(page, pageSize) });
  }

  createAudit(payload: CreateProductAuditPayload) {
    return this.http.post<ProductAuditRow>(`${this.base}/audits`, payload);
  }

  wastage(page: number, pageSize: number) {
    return this.http.get<Paged<ProductWastageRow>>(`${this.base}/wastage`, { params: this.paging(page, pageSize) });
  }

  createWastage(payload: CreateProductWastagePayload) {
    return this.http.post<ProductWastageRow>(`${this.base}/wastage`, payload);
  }
}
