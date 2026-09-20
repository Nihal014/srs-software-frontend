import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import type {
  Account,
  AccountsSummary,
  CashBook,
  Expense,
  ExpenseCategory,
  ExpensePayload,
  ListFilters,
  Paged,
  ProfitLoss,
  ReadyProducts,
  Receipt,
  ReceiptPayload,
  Sale,
  SalePayload,
} from '../models/accounts.model';

function toParams(filters: ListFilters): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
  }
  return params;
}

/** One client for the whole Accounts module: masters, the three registers and the reports. */
@Injectable({ providedIn: 'root' })
export class AccountsService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // masters
  categories() {
    return this.http.get<ExpenseCategory[]>(`${this.api}/expense-categories`, { params: { all: 'true' } });
  }
  saveCategory(id: number | null, payload: { name: string; plGroup: number; isActive?: boolean }) {
    return id === null
      ? this.http.post<ExpenseCategory>(`${this.api}/expense-categories`, payload)
      : this.http.patch<ExpenseCategory>(`${this.api}/expense-categories/${id}`, payload);
  }
  removeCategory(id: number) {
    return this.http.delete<void>(`${this.api}/expense-categories/${id}`);
  }

  accounts() {
    return this.http.get<Account[]>(`${this.api}/accounts`, { params: { all: 'true' } });
  }
  saveAccount(id: number | null, payload: { name: string; accountType: number; openingBalance: number; isActive?: boolean }) {
    return id === null
      ? this.http.post<Account>(`${this.api}/accounts`, payload)
      : this.http.patch<Account>(`${this.api}/accounts/${id}`, payload);
  }
  removeAccount(id: number) {
    return this.http.delete<void>(`${this.api}/accounts/${id}`);
  }

  readyProducts() {
    return this.http.get<ReadyProducts[]>(`${this.api}/ready-products`);
  }
  addReadyProducts(payload: { asOfDate: string; amount: number; remarks?: string }) {
    return this.http.post<ReadyProducts[]>(`${this.api}/ready-products`, payload);
  }
  removeReadyProducts(id: number) {
    return this.http.delete<ReadyProducts[]>(`${this.api}/ready-products/${id}`);
  }

  // registers
  expenses(filters: ListFilters) {
    return this.http.get<Paged<Expense>>(`${this.api}/expenses`, { params: toParams(filters) });
  }
  saveExpense(id: number | null, payload: ExpensePayload) {
    return id === null ? this.http.post<Expense>(`${this.api}/expenses`, payload) : this.http.patch<Expense>(`${this.api}/expenses/${id}`, payload);
  }
  removeExpense(id: number) {
    return this.http.delete<void>(`${this.api}/expenses/${id}`);
  }

  receipts(filters: ListFilters) {
    return this.http.get<Paged<Receipt>>(`${this.api}/receipts`, { params: toParams(filters) });
  }
  saveReceipt(id: number | null, payload: ReceiptPayload) {
    return id === null ? this.http.post<Receipt>(`${this.api}/receipts`, payload) : this.http.patch<Receipt>(`${this.api}/receipts/${id}`, payload);
  }
  removeReceipt(id: number) {
    return this.http.delete<void>(`${this.api}/receipts/${id}`);
  }

  sales(filters: ListFilters) {
    return this.http.get<Paged<Sale>>(`${this.api}/sales`, { params: toParams(filters) });
  }
  saveSale(id: number | null, payload: SalePayload) {
    return id === null ? this.http.post<Sale>(`${this.api}/sales`, payload) : this.http.patch<Sale>(`${this.api}/sales/${id}`, payload);
  }
  removeSale(id: number) {
    return this.http.delete<void>(`${this.api}/sales/${id}`);
  }

  // reports
  summary() {
    return this.http.get<AccountsSummary>(`${this.api}/accounts-report/summary`);
  }
  profitLoss(from?: string, to?: string) {
    return this.http.get<ProfitLoss>(`${this.api}/accounts-report/pnl`, { params: toParams({ from, to }) });
  }
  cashBook(accountId: number | null, from?: string, to?: string) {
    return this.http.get<CashBook>(`${this.api}/accounts-report/cashbook`, { params: toParams({ accountId, from, to }) });
  }
}
