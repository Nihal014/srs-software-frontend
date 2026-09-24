import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StaffService } from 'app/shared/services/staff.service';
import { PAY_TYPE, PAY_TYPE_LABEL, type PayType, type Staff, type UpsertStaffPayload } from 'app/shared/models/payroll.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './staff-list.html',
})
export class StaffList implements OnInit {
  private confirmService = inject(ConfirmService);
  private staffService = inject(StaffService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly payTypes = [
    { value: PAY_TYPE.Hourly, label: 'Hourly (rate per hour)' },
    { value: PAY_TYPE.Daily, label: 'Daily (flat rate per day)' },
  ];
  readonly columns = ['slno', 'name', 'phone', 'pay_type', 'pay_rate', 'status', 'edit', 'delete'];
  readonly staff = signal<Staff[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<Staff | 'new' | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: '',
    payType: this.fb.nonNullable.control<PayType>(PAY_TYPE.Hourly, [Validators.required]),
    payRate: [0, [Validators.required, Validators.min(0)]],
    isActive: true,
  });

  payTypeText(type: PayType): string {
    return PAY_TYPE_LABEL[type];
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.staffService.listAll().subscribe((staff) => {
      this.staff.set(staff);
      this.loading.set(false);
    });
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({ name: '', phone: '', payType: PAY_TYPE.Hourly, payRate: 0, isActive: true });
  }

  startEdit(member: Staff) {
    this.editing.set(member);
    this.form.reset({
      name: member.name,
      phone: member.phone ?? '',
      payType: member.pay_type,
      payRate: member.pay_rate,
      isActive: !!member.is_active,
    });
  }

  cancel() {
    this.editing.set(null);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const editing = this.editing();
    const value = this.form.getRawValue();
    const payload: UpsertStaffPayload = {
      name: value.name.trim(),
      phone: value.phone.trim() || undefined,
      payType: value.payType,
      payRate: value.payRate,
      isActive: value.isActive,
    };

    this.saving.set(true);
    const request = editing === 'new' ? this.staffService.create(payload) : this.staffService.update(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Staff member saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this staff member.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(member: Staff) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete "${member.name}"? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.staffService.remove(member.id).subscribe({
          next: () => {
            this.snackBar.open('Staff member deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message ?? 'Could not delete this staff member.', 'Dismiss', { duration: 5000 });
          },
        });
      });
  }
}
