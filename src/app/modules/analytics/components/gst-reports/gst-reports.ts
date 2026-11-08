import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { GstReportsService } from 'app/shared/services/gst-reports.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { GstReport, GstRow, GstSide } from 'app/shared/models/gst-report.model';

const GSTIN = /^$|^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

/** Wraps a value for CSV: quotes anything containing a comma, quote or newline. */
function csvCell(v: string | number | null | undefined) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

@Component({
  selector: 'app-gst-reports',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    ReactiveFormsModule,
    DateField,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './gst-reports.html',
})
export class GstReports implements OnInit {
  private api = inject(GstReportsService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  readonly report = signal<GstReport | null>(null);
  readonly loading = signal(true);
  readonly savingCompany = signal(false);
  readonly editingCompany = signal(false);

  readonly filter = this.fb.nonNullable.group({ from: '', to: '' });
  readonly company = this.fb.nonNullable.group({
    legalName: ['', [Validators.required, Validators.minLength(2)]],
    gstin: ['', [Validators.pattern(GSTIN)]],
  });

  ngOnInit() {
    this.setMonth(0);
  }

  /** 0 = this month, 1 = last month. */
  setMonth(monthsBack: number) {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    const last = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0);
    this.filter.setValue({ from: toDateString(first), to: toDateString(last) });
    this.load();
  }

  clear() {
    this.filter.reset();
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.filter.getRawValue();
    this.api.report(f.from || undefined, f.to || undefined).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load the GST report.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  editCompany() {
    const c = this.report()?.company;
    this.company.setValue({ legalName: c?.legal_name ?? '', gstin: c?.gstin ?? '' });
    this.editingCompany.set(true);
  }

  saveCompany() {
    this.company.controls.gstin.setValue(this.company.controls.gstin.value.trim().toUpperCase());
    if (this.company.invalid) {
      this.company.markAllAsTouched();
      return;
    }
    this.savingCompany.set(true);
    const v = this.company.getRawValue();
    this.api.updateCompany({ legalName: v.legalName.trim(), gstin: v.gstin }).subscribe({
      next: () => {
        this.savingCompany.set(false);
        this.editingCompany.set(false);
        this.snackBar.open('Business details saved.', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.savingCompany.set(false);
        const msg = err.error?.message;
        this.snackBar.open(Array.isArray(msg) ? msg.join(' ') : (msg ?? 'Could not save.'), 'Dismiss', { duration: 4000 });
      },
    });
  }

  /** Downloads the document-wise rows as a CSV file (opens in Excel). */
  download(kind: 'sales' | 'purchases') {
    const r = this.report();
    if (!r) return;
    const side: GstSide = r[kind];
    const header = ['Date', 'Type', 'Document No', 'Party', 'GSTIN', 'Supply', 'GST rate %', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Total tax', 'Document value'];
    const lines = [header.map(csvCell).join(',')];
    for (const x of side.rows) {
      lines.push(
        [x.doc_date, x.doc_type, x.doc_number, x.party_name, x.gstin ?? 'Unregistered', x.supply, x.rate, x.taxable, x.cgst, x.sgst, x.igst, x.tax, x.total]
          .map(csvCell)
          .join(','),
      );
    }
    const t = side.totals;
    lines.push(['', '', '', 'Total', '', '', '', t.taxable, t.cgst, t.sgst, t.igst, t.tax, t.total].map(csvCell).join(','));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst-${kind === 'sales' ? 'sales' : 'purchases'}-${r.from ?? 'start'}-to-${r.to ?? 'today'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Purchase lines whose tax cannot be claimed (supplier has no valid GSTIN). */
  isUnclaimable(row: GstRow) {
    return !row.itc_eligible && row.tax !== 0;
  }
}
