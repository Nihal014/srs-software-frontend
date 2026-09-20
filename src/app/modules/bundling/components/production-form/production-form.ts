import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BundleProductsService } from 'app/shared/services/bundle-products.service';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import { AuthService } from 'app/core/services/auth.service';
import { PayrollService } from 'app/shared/services/payroll.service';
import { DateField } from 'app/shared/components/date-field/date-field';
import { toDateString } from 'app/shared/utils/date.util';
import type { BundleProduct, RequirementLine } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DateField,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './production-form.html',
})
export class ProductionForm implements OnInit {
  private bundleProductsService = inject(BundleProductsService);
  private productionsService = inject(BundleProductionsService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private payrollService = inject(PayrollService);
  readonly auth = inject(AuthService);

  readonly bundles = signal<BundleProduct[]>([]);
  readonly requirement = signal<RequirementLine[]>([]);
  readonly checkingRequirement = signal(false);
  readonly saving = signal(false);
  readonly shortageError = signal<RequirementLine[] | null>(null);
  readonly payrollHint = signal('');

  readonly form = this.fb.group({
    bundleProductId: this.fb.control<number | null>(null, [Validators.required]),
    qtyProduced: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.001)]),
    producedDate: this.fb.nonNullable.control(toDateString(new Date()), [Validators.required]),
    laborCostPerUnit: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    overheadCostPerUnit: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    sellingPrice: this.fb.control<number | null>(null, [Validators.min(0)]),
    override: this.fb.nonNullable.control(false),
  });

  private requirementTimer: ReturnType<typeof setTimeout> | null = null;

  get hasShortage(): boolean {
    return this.requirement().some((r) => r.shortage > 0);
  }

  ngOnInit() {
    this.bundleProductsService.list().subscribe((bundles) => this.bundles.set(bundles));
    this.form.controls.bundleProductId.valueChanges.subscribe(() => this.onBundleChange());
    this.form.controls.qtyProduced.valueChanges.subscribe(() => this.onQtyChange());
  }

  /** Admin shortcut: that day's total wages spread over the units being produced. */
  useLaborFromPayroll() {
    const { producedDate, qtyProduced } = this.form.getRawValue();
    if (!qtyProduced || qtyProduced <= 0) {
      this.snackBar.open('Enter the quantity to produce first.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.payrollService.getDayTotal(producedDate).subscribe({
      next: (day) => {
        if (!day.staffCount) {
          this.payrollHint.set('No payroll entries for this date.');
          return;
        }
        this.form.controls.laborCostPerUnit.setValue(Math.round((day.total / qtyProduced) * 100) / 100);
        this.payrollHint.set(
          `Rs ${day.total.toFixed(2)} paid to ${day.staffCount} staff on this date, divided by ${qtyProduced} units. If several products were made that day, adjust it.`,
        );
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Could not read payroll.', 'Dismiss', { duration: 4000 }),
    });
  }

  private onBundleChange() {
    const bundle = this.bundles().find((b) => b.id === this.form.controls.bundleProductId.value);
    this.form.controls.sellingPrice.setValue(bundle?.selling_price ?? null);
    this.onQtyChange();
  }

  private onQtyChange() {
    this.form.controls.override.setValue(false);
    this.shortageError.set(null);
    this.scheduleRequirementCheck();
  }

  private scheduleRequirementCheck() {
    if (this.requirementTimer) clearTimeout(this.requirementTimer);
    const { bundleProductId, qtyProduced } = this.form.getRawValue();
    if (!bundleProductId || !qtyProduced || qtyProduced <= 0) {
      this.requirement.set([]);
      return;
    }
    this.requirementTimer = setTimeout(() => {
      this.checkingRequirement.set(true);
      this.productionsService.checkRequirement(bundleProductId, qtyProduced).subscribe({
        next: (lines) => {
          this.requirement.set(lines);
          this.checkingRequirement.set(false);
        },
        error: () => this.checkingRequirement.set(false),
      });
    }, 400);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.shortageError.set(null);
    this.productionsService
      .create({
        bundleProductId: value.bundleProductId!,
        qtyProduced: value.qtyProduced!,
        producedDate: value.producedDate,
        laborCostPerUnit: value.laborCostPerUnit,
        overheadCostPerUnit: value.overheadCostPerUnit,
        sellingPrice: value.sellingPrice ?? undefined,
        override: value.override,
      })
      .subscribe({
        next: (production) => {
          this.saving.set(false);
          this.snackBar.open(`${production.production_number} recorded.`, 'Dismiss', { duration: 2500 });
          this.router.navigate(['/bundling', production.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const body = err.error;
          if (body?.shortages) {
            this.shortageError.set(body.shortages);
          } else {
            this.snackBar.open(body?.message ?? 'Could not record this production run.', 'Dismiss', { duration: 5000 });
          }
        },
      });
  }
}
