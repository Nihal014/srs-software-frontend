import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateField } from 'app/shared/components/date-field/date-field';
import { AccountsService } from 'app/shared/services/accounts.service';
import type { Account, CashBook as CashBookData } from 'app/shared/models/accounts.model';

@Component({
  selector: 'app-cash-book',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, DecimalPipe, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, DateField],
  templateUrl: './cash-book.html',
})
export class CashBook implements OnInit {
  private api = inject(AccountsService);
  private fb = inject(FormBuilder);

  readonly accounts = signal<Account[]>([]);
  readonly book = signal<CashBookData | null>(null);
  readonly loading = signal(true);

  readonly filter = this.fb.nonNullable.group({
    accountId: this.fb.control<number | null>(null),
    from: '',
    to: '',
  });

  ngOnInit() {
    this.api.accounts().subscribe((a) => this.accounts.set(a));
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.filter.getRawValue();
    this.api.cashBook(f.accountId, f.from || undefined, f.to || undefined).subscribe((book) => {
      this.book.set(book);
      this.loading.set(false);
    });
  }

  clear() {
    this.filter.reset();
    this.load();
  }
}
