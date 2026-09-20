import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { PayrollService } from 'app/shared/services/payroll.service';
import { toDateString } from 'app/shared/utils/date.util';
import { PAY_TYPE, type DayEntryRow, type DaySheet, type PayType } from 'app/shared/models/payroll.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** A worked hourly day needs hours; every worked day needs an amount. */
function dayLineValidator(group: AbstractControl): ValidationErrors | null {
  const v = group.value;
  if (!v.present) return null;
  if (v.payType === PAY_TYPE.Hourly && !(v.hours > 0)) return { lineError: 'Enter the hours worked.' };
  if (v.amount === null || v.amount === undefined || v.amount === '') return { lineError: 'Enter the amount.' };
  return null;
}

function createDayLine(fb: FormBuilder, row: DayEntryRow) {
  const worked = row.entry_id !== null;
  return fb.nonNullable.group(
    {
      staffId: row.staff_id,
      name: row.name,
      payType: fb.nonNullable.control<PayType>(row.pay_type),
      payRate: row.pay_rate,
      present: worked,
      hours: fb.control<number | null>({ value: row.hours, disabled: !worked }, [Validators.min(0)]),
      amount: fb.control<number | null>({ value: worked ? row.amount : null, disabled: !worked }, [Validators.min(0)]),
    },
    { validators: [dayLineValidator] },
  );
}

type DayLineGroup = ReturnType<typeof createDayLine>;

@Component({
  selector: 'app-daily-entry',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, DateField, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './daily-entry.html',
})
export class DailyEntry implements OnInit {
  private payrollService = inject(PayrollService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly PAY_TYPE = PAY_TYPE;
  readonly columns = ['staff', 'rate', 'present', 'hours', 'amount'];
  readonly loading = signal(true);
  readonly saving = signal(false);
  // Mirrors the FormArray so mat-table re-renders when a different day is loaded.
  readonly lineGroups = signal<DayLineGroup[]>([]);

  readonly form = this.fb.group({
    date: this.fb.nonNullable.control(toDateString(new Date()), [Validators.required]),
    lines: this.fb.array<DayLineGroup>([]),
  });

  private loadedDate = this.form.controls.date.value;

  get lines() {
    return this.form.controls.lines;
  }

  get totals() {
    const worked = this.lines.getRawValue().filter((l) => l.present);
    return { staffCount: worked.length, total: round2(worked.reduce((a, l) => a + (l.amount ?? 0), 0)) };
  }

  ngOnInit() {
    this.form.controls.date.valueChanges.subscribe((date) => this.onDateChange(date));
    this.load(this.loadedDate);
  }

  private onDateChange(date: string) {
    if (!date || date === this.loadedDate) return;
    if (this.form.dirty && !confirm('Discard the unsaved changes for this day?')) {
      this.form.controls.date.setValue(this.loadedDate, { emitEvent: false });
      return;
    }
    this.load(date);
  }

  private load(date: string) {
    this.loading.set(true);
    this.payrollService.getDay(date).subscribe({
      next: (sheet) => this.applySheet(sheet),
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load this day.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  private applySheet(sheet: DaySheet) {
    this.loadedDate = sheet.date;
    this.lines.clear();
    for (const row of sheet.rows) {
      const group = createDayLine(this.fb, row);
      this.wire(group);
      this.lines.push(group);
    }
    this.lineGroups.set([...this.lines.controls]);
    this.form.markAsPristine();
    this.loading.set(false);
  }

  private wire(line: DayLineGroup) {
    const { present, hours, amount, payType, payRate } = line.controls;

    present.valueChanges.subscribe((isPresent) => {
      if (isPresent) {
        hours.enable({ emitEvent: false });
        amount.enable({ emitEvent: false });
        hours.setValue(null, { emitEvent: false });
        // Flat-rate staff are paid the day rate straight away; hourly staff wait for the hours.
        amount.setValue(payType.value === PAY_TYPE.Daily ? payRate.value : null, { emitEvent: false });
      } else {
        hours.reset(null, { emitEvent: false });
        amount.reset(null, { emitEvent: false });
        hours.disable({ emitEvent: false });
        amount.disable({ emitEvent: false });
      }
      line.updateValueAndValidity();
    });

    hours.valueChanges.subscribe((value) => {
      if (payType.value !== PAY_TYPE.Hourly) return;
      amount.setValue(value && value > 0 ? round2(value * payRate.value) : null, { emitEvent: false });
      line.updateValueAndValidity();
    });
  }

  lineError(line: DayLineGroup): string | null {
    return line.errors?.['lineError'] ?? null;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted rows before saving.', 'Dismiss', { duration: 3000 });
      return;
    }
    const date = this.form.controls.date.value;
    const lines = this.lines.getRawValue().map((l) => ({
      staffId: l.staffId,
      present: l.present,
      hours: l.present && l.payType === PAY_TYPE.Hourly ? (l.hours ?? undefined) : undefined,
      amount: l.present ? (l.amount ?? undefined) : undefined,
    }));

    this.saving.set(true);
    this.payrollService.saveDay(date, lines).subscribe({
      next: (sheet) => {
        this.saving.set(false);
        this.applySheet(sheet);
        this.snackBar.open(`Saved: ${sheet.staffCount} staff, Rs ${sheet.total.toFixed(2)}.`, 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this day.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
