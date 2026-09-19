import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { DateField } from 'app/shared/components/date-field/date-field';
import { toDateString } from 'app/shared/utils/date.util';
import type { BundleProduct, RequirementLine } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [
    FormsModule,
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
  readonly auth = inject(AuthService);

  readonly bundles = signal<BundleProduct[]>([]);
  readonly requirement = signal<RequirementLine[]>([]);
  readonly checkingRequirement = signal(false);
  readonly saving = signal(false);
  readonly shortageError = signal<RequirementLine[] | null>(null);

  bundleProductId: number | null = null;
  qtyProduced: number | null = null;
  producedDate = toDateString(new Date());
  laborCostPerUnit = 0;
  overheadCostPerUnit = 0;
  sellingPrice: number | null = null;
  override = false;

  private requirementTimer: ReturnType<typeof setTimeout> | null = null;

  get hasShortage(): boolean {
    return this.requirement().some((r) => r.shortage > 0);
  }

  ngOnInit() {
    this.bundleProductsService.list().subscribe((bundles) => this.bundles.set(bundles));
  }

  onBundleChange() {
    const bundle = this.bundles().find((b) => b.id === this.bundleProductId);
    this.sellingPrice = bundle?.selling_price ?? null;
    this.override = false;
    this.shortageError.set(null);
    this.scheduleRequirementCheck();
  }

  onQtyChange() {
    this.override = false;
    this.shortageError.set(null);
    this.scheduleRequirementCheck();
  }

  private scheduleRequirementCheck() {
    if (this.requirementTimer) clearTimeout(this.requirementTimer);
    if (!this.bundleProductId || !this.qtyProduced || this.qtyProduced <= 0) {
      this.requirement.set([]);
      return;
    }
    this.requirementTimer = setTimeout(() => {
      this.checkingRequirement.set(true);
      this.productionsService.checkRequirement(this.bundleProductId!, this.qtyProduced!).subscribe({
        next: (lines) => {
          this.requirement.set(lines);
          this.checkingRequirement.set(false);
        },
        error: () => this.checkingRequirement.set(false),
      });
    }, 400);
  }

  submit() {
    if (!this.bundleProductId || !this.qtyProduced || this.qtyProduced <= 0) {
      this.snackBar.open('Choose a product and a quantity to produce.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.shortageError.set(null);
    this.productionsService
      .create({
        bundleProductId: this.bundleProductId,
        qtyProduced: this.qtyProduced,
        producedDate: this.producedDate,
        laborCostPerUnit: this.laborCostPerUnit,
        overheadCostPerUnit: this.overheadCostPerUnit,
        sellingPrice: this.sellingPrice ?? undefined,
        override: this.override,
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
