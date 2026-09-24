import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { AdjustBatchPayload, Batch, BatchAdjustment } from '../models/batch.model';
import type { Paged } from '../models/paged.model';

@Injectable({ providedIn: 'root' })
export class BatchesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/batches`;

  /** Every batch, unpaginated — Stock Summary needs the whole set to aggregate per item. */
  list() {
    return this.http.get<Batch[]>(this.base);
  }

  /** Paged batch list for the Batches & Expiry tab. */
  listPaged(page: number, pageSize: number) {
    return this.http.get<Paged<Batch>>(this.base, { params: { page: String(page), pageSize: String(pageSize) } });
  }

  adjustments(batchId: number) {
    return this.http.get<BatchAdjustment[]>(`${this.base}/${batchId}/adjustments`);
  }

  adjust(batchId: number, payload: AdjustBatchPayload) {
    return this.http.post<Batch>(`${this.base}/${batchId}/adjustments`, payload);
  }
}
