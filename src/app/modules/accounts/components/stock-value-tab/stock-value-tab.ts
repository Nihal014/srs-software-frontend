import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateField } from 'app/shared/components/date-field/date-field';
import { AccountsService } from 'app/shared/services/accounts.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { displayDate, toDateString } from 'app/shared/utils/date.util';
import type { ReadyProducts } from 'app/shared/models/accounts.model';
import { StockValueHelpDialog } from '../stock-value-help-dialog/stock-value-help-dialog';

/** Value of finished stock on hand, typed in per date. The latest entry feeds Profit & Loss and the Summary. */
@Component({
  selector: 'app-stock-value-tab',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatTooltipModule, DateField],
  templateUrl: './stock-value-tab.html',
})
export class StockValueTab implements OnInit {
  private api = inject(AccountsService);
  private snackBar = inject(MatSnackBar);
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  readonly columns = ['slno', 'date', 'amount', 'remarks', 'delete'];
  readonly rows = signal<ReadyProducts[]>([]);
  readonly loading = signal(true);
  readonly adding = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    asOfDate: [toDateString(new Date()), Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    remarks: '',
  });

  ngOnInit() {
    this.api.readyProducts().subscribe((rows) => {
      this.rows.set(rows);
      this.loading.set(false);
    });
  }

  showHelp() {
    this.dialog.open(StockValueHelpDialog, { panelClass: ['rb-dialog-container', 'w-[560px]', 'max-w-[95vw]'], autoFocus: false });
  }

  start() {
    this.adding.set(true);
    this.form.reset({ asOfDate: toDateString(new Date()), amount: 0, remarks: '' });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.addReadyProducts({ asOfDate: v.asOfDate, amount: v.amount, remarks: v.remarks.trim() || undefined }).subscribe({
      next: (rows) => {
        this.saving.set(false);
        this.snackBar.open('Stock value recorded.', 'Dismiss', { duration: 2500 });
        this.adding.set(false);
        this.rows.set(rows);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this value.', 'Dismiss', { duration: 5000 });
      },
    });
  }

  remove(row: ReadyProducts) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete the stock value entered for ${displayDate(row.as_of_date)}?`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.api.removeReadyProducts(row.id).subscribe({
          next: (rows) => this.rows.set(rows),
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete this entry.', 'Dismiss', { duration: 5000 }),
        });
      });
  }
}
