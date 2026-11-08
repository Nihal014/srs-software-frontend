import { DeliveryLocationsService } from 'app/shared/services/delivery-locations.service';
import type { DeliveryLocation } from 'app/shared/models/delivery-location.model';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BundleProductsService } from 'app/shared/services/bundle-products.service';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import { AuthService } from 'app/core/services/auth.service';
import type { BundleProduct, BundleProductionDayDetail, RequirementLine } from 'app/shared/models/bundle.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
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
  private locationsService = inject(DeliveryLocationsService);
  readonly locations = signal<DeliveryLocation[]>([]);
  private snackBar = inject(MatSnackBar);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  /** The production day this run belongs to (from /bundling/day/:date/new). */
  readonly date = this.route.snapshot.paramMap.get('date') ?? '';

  readonly bundles = signal<BundleProduct[]>([]);
  readonly requirement = signal<RequirementLine[]>([]);
  readonly checkingRequirement = signal(false);
  readonly saving = signal(false);
  readonly shortageError = signal<RequirementLine[] | null>(null);
  /** Quantities typed over the recipe's target, by item id (total for the run). */
  readonly used = signal<Record<number, number>>({});
  /** That day's payroll picture (Admin only) — drives the shared-labour preview. */
  readonly day = signal<BundleProductionDayDetail | null>(null);

  readonly form = this.fb.group({
    bundleProductId: this.fb.control<number | null>(null, [Validators.required]),
    qtyProduced: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.001)]),
    laborFromPayroll: this.fb.nonNullable.control(false),
    laborCostPerUnit: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    locationId: this.fb.control<number | null>(null, Validators.required),
    otherCosts: this.fb.array<ReturnType<ProductionForm['newCost']>>([]),
    sellingPrice: this.fb.control<number | null>(null, [Validators.min(0)]),
    override: this.fb.nonNullable.control(false),
  });

  private requirementTimer: ReturnType<typeof setTimeout> | null = null;

  newCost(name = '', amountPerUnit: number | null = null) {
    return this.fb.group({
      name: this.fb.nonNullable.control(name, [Validators.required, Validators.minLength(2)]),
      amountPerUnit: this.fb.control<number | null>(amountPerUnit, [Validators.required, Validators.min(0)]),
    });
  }

  get otherCosts() {
    return this.form.controls.otherCosts;
  }

  addCost() {
    this.otherCosts.push(this.newCost());
  }

  removeCost(index: number) {
    this.otherCosts.removeAt(index);
  }

  /** The other costs per unit added up: becomes this run's overhead per unit. */
  get otherCostsTotal(): number {
    return Math.round(this.otherCosts.controls.reduce((a, c) => a + (c.value.amountPerUnit ?? 0), 0) * 100) / 100;
  }

  /** A run starts from the other costs of the previous run of the same product (they rarely change). */
  private loadLastCosts(bundleId: number | null) {
    this.otherCosts.clear();
    if (!bundleId) return;
    this.productionsService.lastCosts(bundleId).subscribe((rows) => {
      if (this.form.controls.bundleProductId.value !== bundleId) return;
      this.otherCosts.clear();
      rows.forEach((r) => this.otherCosts.push(this.newCost(r.name, r.amount_per_unit)));
      this.cdr.markForCheck();
    });
  }

  get selectedBundle(): BundleProduct | undefined {
    return this.bundles().find((b) => b.id === this.form.controls.bundleProductId.value);
  }

  /** What this run will take of an ingredient: the typed amount, else the recipe's quantity. */
  usedFor(line: RequirementLine): number {
    return this.used()[line.itemId] ?? line.required;
  }

  setUsed(line: RequirementLine, value: string) {
    const qty = value === '' ? NaN : Number(value);
    this.used.update((u) => {
      const next = { ...u };
      if (Number.isNaN(qty) || qty < 0 || qty === line.required) delete next[line.itemId];
      else next[line.itemId] = qty;
      return next;
    });
  }

  /** How much of what will be used is missing from usable stock. */
  shortageFor(line: RequirementLine): number {
    return Math.max(0, Math.round((this.usedFor(line) - line.available) * 1000) / 1000);
  }

  get hasShortage(): boolean {
    return this.requirement().some((r) => this.shortageFor(r) > 0);
  }

  get changedUsage(): boolean {
    return Object.keys(this.used()).length > 0;
  }

  ngOnInit() {
    if (!DATE_PATTERN.test(this.date)) {
      this.router.navigate(['/bundling']);
      return;
    }
    this.bundleProductsService.list().subscribe((bundles) => this.bundles.set(bundles));
    this.locationsService.listAll().subscribe((locations) => {
      const active = locations.filter((l) => !!l.is_active);
      this.locations.set(active);
      // Default to the production location (else the first one).
      const preferred = active.find((l) => !!l.is_production) ?? active[0];
      if (preferred && !this.form.controls.locationId.value) this.form.controls.locationId.setValue(preferred.id);
    });
    this.form.controls.bundleProductId.valueChanges.subscribe(() => this.onBundleChange());
    this.form.controls.qtyProduced.valueChanges.subscribe(() => {
      this.onQtyChange();
      this.syncLaborPreview();
    });
    this.form.controls.laborFromPayroll.valueChanges.subscribe(() => this.syncLaborPreview());

    // Admin: load the day so labour can be shared from payroll (wages / units of all payroll-based runs).
    if (this.auth.isAdmin()) {
      this.productionsService.getDay(this.date).subscribe((day) => {
        this.day.set(day);
        if ((day.wages ?? 0) > 0) this.form.controls.laborFromPayroll.setValue(true);
        else this.form.controls.laborFromPayroll.disable({ emitEvent: false });
        this.syncLaborPreview();
      });
    }
  }

  /** Labour per unit if this run joins the day's payroll-based runs (null when it doesn't apply). */
  get sharedLaborPreview(): { wages: number; units: number; perUnit: number } | null {
    const day = this.day();
    const qty = this.form.controls.qtyProduced.value ?? 0;
    if (!day || !day.wages || !this.form.controls.laborFromPayroll.value || qty <= 0) return null;
    const units = day.payrollUnits + qty;
    return { wages: day.wages, units, perUnit: Math.round((day.wages / units) * 100) / 100 };
  }

  /** In payroll mode the labour box is display-only and shows the live shared amount. */
  private syncLaborPreview() {
    const labor = this.form.controls.laborCostPerUnit;
    if (this.form.controls.laborFromPayroll.value) {
      labor.disable({ emitEvent: false });
      labor.setValue(this.sharedLaborPreview?.perUnit ?? 0, { emitEvent: false });
    } else if (labor.disabled) {
      labor.enable({ emitEvent: false });
    }
  }

  private onBundleChange() {
    const bundle = this.selectedBundle;
    this.form.controls.sellingPrice.setValue(bundle?.selling_price ?? null);
    this.loadLastCosts(bundle?.id ?? null);
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
          this.used.set({});
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
    const override = this.form.controls.override.value;
    const sharedLabor = this.form.controls.laborFromPayroll.value;
    this.confirmService
      .ask({
        title: 'Record production',
        message:
          `Record this production run? The ingredients are taken from stock, soonest expiry first, and it can't be undone.` +
          (sharedLabor ? `\n\nLabour is shared from this day's payroll, so the day's other payroll-based runs are updated too.` : '') +
          (override ? '\n\nStock override is on: short ingredients will be over-drawn.' : ''),
        confirmLabel: 'Record production',
      })
      .subscribe((confirmed) => {
        if (confirmed) this.createRun();
      });
  }

  private createRun() {
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.shortageError.set(null);
    this.productionsService
      .create({
        bundleProductId: value.bundleProductId!,
        qtyProduced: value.qtyProduced!,
        producedDate: this.date,
        ...(value.laborFromPayroll ? { laborFromPayroll: true } : { laborCostPerUnit: value.laborCostPerUnit }),
        locationId: value.locationId ?? undefined,
        otherCosts: value.otherCosts.filter((c) => c.name.trim() && c.amountPerUnit !== null).map((c) => ({ name: c.name.trim(), amountPerUnit: c.amountPerUnit! })),
        sellingPrice: value.sellingPrice ?? undefined,
        override: value.override,
        usedQuantities: this.requirement()
          .filter((l) => this.usedFor(l) !== l.required)
          .map((l) => ({ itemId: l.itemId, qty: this.usedFor(l) })),
      })
      .subscribe({
        next: (production) => {
          this.saving.set(false);
          this.snackBar.open(`${production.production_number} recorded.`, 'Dismiss', { duration: 2500 });
          this.router.navigate(['/bundling/day', this.date]);
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
