import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { Batch } from '../models/batch.model';

@Injectable({ providedIn: 'root' })
export class BatchesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/batches`;

  list() {
    return this.http.get<Batch[]>(this.base);
  }
}
