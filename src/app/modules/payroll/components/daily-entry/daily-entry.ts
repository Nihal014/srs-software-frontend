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
import { AuthService } from 'app/core/services/auth.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { PayrollService } from 'app/shared/services/payroll.service';
import { toDateString } from 'app/shared/utils/date.util';
import { PAY_TYPE, type DayEntryRow, type DaySheet, type PayType } from 'app/shared/models/payroll.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Minutes between in and out; an out time at or before the in time means the shift ran past midnight. */
function workedMinutes(inTime: string, outTime: string): number {
  const diff = toMinutes(outTime) - toMinutes(inTime);
  return diff > 0 ? diff : diff + 24 * 60;
}

/** Hourly staff need both times (or hours from an older entry); day-rate staff need an amount when an admin is editing. */
function makeDayLineValidator(isAdmin: boolean) {
  return (group: AbstractControl): ValidationErrors | null => {
    const v = group.getRawValue();
    if (!v.present) return null;
    if (v.payType === PAY_TYPE.Hourly) {
      if (!!v.inTime !== !!v.outTime) return { lineError: 'Enter both the in time and the out time.' };
      if (v.inTime && v.inTime === v.outTime) return { lineError: 'In time and out time are the same.' };
      if (!(v.hours > 0)) return { lineError: 'Enter the in time and out time.' };
      return null;
    }
    if (isAdmin && (v.amount === null || v.amount === undefined || v.amount === '')) return { lineError: 'Enter the amount.' };
    return null;
  };
}

function createDayLine(fb: FormBuilder, row: DayEntryRow, isAdmin: boolean) {
  const worked = row.entry_id !== null;
  const hourly = row.pay_type === PAY_TYPE.Hourly;
  return fb.nonNullable.group(
    {
      staffId: row.staff_id,
      name: row.name,
      payType: fb.nonNullable.control<PayType>(row.pay_type),
      payRate: fb.control<number | null>(row.pay_rate),
      present: worked,
      inTime: fb.control<string | null>({ value: row.in_time, disabled: !worked || !hourly }),
      outTime: fb.control<string | null>({ value: row.out_time, disabled: !worked || !hourly }),
      // Worked out from the two times; never typed in.
      hours: fb.control<number | null>(row.hours),
      amount: fb.control<number | null>({ value: worked ? row.amount : null, disabled: !worked }, [Validators.min(0)]),
    },
    { validators: [makeDayLineValidator(isAdmin)] },
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
  private confirmService = inject(ConfirmService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly PAY_TYPE = PAY_TYPE;
  readonly isAdmin = this.auth.isAdmin();
  // Wages (rate, amount) are for admins only; the kitchen supervisor just records who worked and when.
  readonly columns = this.isAdmin
    ? ['slno', 'staff', 'rate', 'present', 'in', 'out', 'hours', 'amount']
    : ['slno', 'staff', 'present', 'in', 'out', 'hours'];
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
    if (!this.form.dirty) {
      this.load(date);
      return;
    }
    this.confirmService
      .ask({ title: 'Unsaved changes', message: 'Discard the unsaved changes for this day?', confirmLabel: 'Discard', destructive: true })
      .subscribe((confirmed) => {
        if (confirmed) this.load(date);
        else this.form.controls.date.setValue(this.loadedDate, { emitEvent: false });
      });
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
      const group = createDayLine(this.fb, row, this.isAdmin);
      this.wire(group);
      this.lines.push(group);
    }
    this.lineGroups.set([...this.lines.controls]);
    this.form.markAsPristine();
    this.loading.set(false);
  }

  private wire(line: DayLineGroup) {
    const { present, inTime, outTime, hours, amount, payType, payRate } = line.controls;
    const hourly = payType.value === PAY_TYPE.Hourly;

    present.valueChanges.subscribe((isPresent) => {
      if (isPresent) {
        if (hourly) {
          inTime.enable({ emitEvent: false });
          outTime.enable({ emitEvent: false });
        }
        amount.enable({ emitEvent: false });
        // Day-rate staff are paid the day rate straight away; hourly staff wait for the times.
        amount.setValue(!hourly ? payRate.value : null, { emitEvent: false });
      } else {
        inTime.reset(null, { emitEvent: false });
        outTime.reset(null, { emitEvent: false });
        hours.reset(null, { emitEvent: false });
        amount.reset(null, { emitEvent: false });
        inTime.disable({ emitEvent: false });
        outTime.disable({ emitEvent: false });
        amount.disable({ emitEvent: false });
      }
      line.updateValueAndValidity();
    });

    const recalc = () => {
      if (!hourly) return;
      const from = inTime.value;
      const to = outTime.value;
      if (from && to && from !== to) {
        const minutes = workedMinutes(from, to);
        hours.setValue(round2(minutes / 60), { emitEvent: false });
        amount.setValue(payRate.value === null ? null : round2((minutes / 60) * payRate.value), { emitEvent: false });
      } else {
        hours.setValue(null, { emitEvent: false });
        amount.setValue(null, { emitEvent: false });
      }
      line.updateValueAndValidity();
    };
    inTime.valueChanges.subscribe(recalc);
    outTime.valueChanges.subscribe(recalc);
  }

  /** True when the shift crosses midnight, so the supervisor can see the system read it that way. */
  pastMidnight(line: DayLineGroup): boolean {
    const from = line.controls.inTime.value;
    const to = line.controls.outTime.value;
    return !!from && !!to && toMinutes(to) < toMinutes(from);
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
    const lines = this.lines.getRawValue().map((l) => {
      const hourly = l.payType === PAY_TYPE.Hourly;
      const legacyHoursOnly = hourly && !l.inTime && !l.outTime && (l.hours ?? 0) > 0;
      return {
        staffId: l.staffId,
        present: l.present,
        inTime: l.present && hourly ? (l.inTime ?? undefined) : undefined,
        outTime: l.present && hourly ? (l.outTime ?? undefined) : undefined,
        hours: l.present && legacyHoursOnly ? (l.hours ?? undefined) : undefined,
        // Hourly pay is worked out by the server from the times; only an admin can set a day-rate amount.
        amount: l.present && !hourly && this.isAdmin ? (l.amount ?? undefined) : undefined,
      };
    });

    this.saving.set(true);
    this.payrollService.saveDay(date, lines).subscribe({
      next: (sheet) => {
        this.saving.set(false);
        this.applySheet(sheet);
        const summary = sheet.total === null ? `${sheet.staffCount} staff` : `${sheet.staffCount} staff, Rs ${sheet.total.toFixed(2)}`;
        this.snackBar.open(`Saved: ${summary}.`, 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this day.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
