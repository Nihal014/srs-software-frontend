import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import type { DayTotal, DaySheet, MonthSheet, SaveDayLine, YearSheet } from '../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payroll`;

  getDay(date: string) {
    return this.http.get<DaySheet>(`${this.base}/day`, { params: { date } });
  }

  saveDay(date: string, lines: SaveDayLine[]) {
    return this.http.put<DaySheet>(`${this.base}/day`, { date, lines });
  }

  getDayTotal(date: string) {
    return this.http.get<DayTotal>(`${this.base}/day-total`, { params: { date } });
  }

  getMonth(month: string) {
    return this.http.get<MonthSheet>(`${this.base}/month`, { params: { month } });
  }

  getYear(year: number) {
    return this.http.get<YearSheet>(`${this.base}/year`, { params: { year } });
  }
}
