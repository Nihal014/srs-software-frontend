import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'app/core/services/auth.service';
import { DateField } from 'app/shared/components/date-field/date-field';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { ProductInventoryService } from 'app/shared/services/product-inventory.service';
import { toDateString } from 'app/shared/utils/date.util';
import type { ProductAuditRow, ProductInventoryRow } from 'app/shared/models/product-inventory.model';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function createLine(fb: FormBuilder, r: ProductInventoryRow) {
  return fb.nonNullable.group({
    bundleProductId: r.bundle_product_id,
    productName: r.product_name,
    unit: r.output_unit,
    system: Number(r.qty_available),
    unitCost: Number(r.unit_cost),
    counted: fb.control<number | null>(null, [Validators.min(0)]),
  });
}
type AuditLineGroup = ReturnType<typeof createLine>;

@Component({
  selector: 'app-product-stock-audit',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './product-stock-audit.html',
})
export class ProductStockAudit implements OnInit {
  private fb = inject(FormBuilder);
  private inventory = inject(ProductInventoryService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  readonly columns = ['audit_number', 'audit_date', 'location_name', 'counted', 'net', 'value', 'created_by_name'];
  readonly rows = signal<ProductAuditRow[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly stock = signal<ProductInventoryRow[]>([]);
  readonly lineGroups = signal<AuditLineGroup[]>([]);
  /** Locations that hold finished stock: the only ones that can be counted. */
  readonly locations = computed(() => {
    const seen = new Map<number, string>();
    this.stock().forEach((r) => seen.set(r.location_id, r.location_name));
    return [...seen].map(([id, name]) => ({ id, name }));
  });

  readonly form = this.fb.group({
    locationId: this.fb.control<number | null>(null, Validators.required),
    auditDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<AuditLineGroup>([]),
  });

  get lines() {
    return this.form.controls.lines;
  }

  ngOnInit() {
    this.load();
    this.form.controls.locationId.valueChanges.subscribe((id) => this.loadLines(id));
  }

  load() {
    this.loading.set(true);
    this.inventory.audits(this.page(), this.pageSize()).subscribe((res) => {
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  startCreate() {
    this.inventory.status().subscribe((s) => {
      this.stock.set(s.rows);
      this.form.reset({ locationId: null, auditDate: toDateString(new Date()), remarks: '' });
      this.lines.clear();
      this.lineGroups.set([]);
      this.creating.set(true);
    });
  }

  cancel() {
    this.creating.set(false);
  }

  private loadLines(locationId: number | null) {
    this.lines.clear();
    if (locationId) this.stock().filter((r) => r.location_id === locationId).forEach((r) => this.lines.push(createLine(this.fb, r)));
    this.lineGroups.set([...this.lines.controls]);
  }

  /** Counted minus what the system expected; null while nothing has been typed for the product. */
  diffOf(line: AuditLineGroup): number | null {
    const counted = line.controls.counted.value;
    return counted === null || counted === undefined ? null : round3(counted - line.controls.system.value);
  }

  get countedLines() {
    return this.lines.getRawValue().filter((l) => l.counted !== null);
  }

  /** Net pieces over/short and its value at cost, for the lines counted so far. */
  get summary() {
    const counted = this.lines.controls.filter((l) => l.controls.counted.value !== null);
    const pieces = counted.reduce((a, l) => a + (this.diffOf(l) ?? 0), 0);
    const value = counted.reduce((a, l) => a + (this.diffOf(l) ?? 0) * l.controls.unitCost.value, 0);
    return { products: counted.length, pieces: round3(pieces), value: Math.round(value * 100) / 100 };
  }

  netOf(row: ProductAuditRow) {
    return round3(row.lines.reduce((a, l) => a + Number(l.difference), 0));
  }

  valueOf(row: ProductAuditRow) {
    return Math.round(row.lines.reduce((a, l) => a + Number(l.difference_value), 0) * 100) / 100;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Choose a location and fix the highlighted counts.', 'Dismiss', { duration: 3000 });
      return;
    }
    const counted = this.countedLines;
    if (!counted.length) {
      this.snackBar.open('Enter the counted quantity for at least one product.', 'Dismiss', { duration: 3000 });
      return;
    }
    const s = this.summary;
    const changes = counted.filter((l) => round3(l.counted! - l.system) !== 0).length;
    const note = changes
      ? `${changes} product${changes === 1 ? '' : 's'} differ${changes === 1 ? 's' : ''} (net ${s.pieces > 0 ? '+' : ''}${s.pieces}); stock will be corrected to the counted figures.`
      : 'Every count matches the system.';
    this.confirmService
      .ask({ title: 'Record stock audit', message: `${note} This can't be undone.`, confirmLabel: 'Record audit' })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const { locationId, auditDate, remarks } = this.form.getRawValue();
        this.saving.set(true);
        this.inventory
          .createAudit({
            locationId: locationId!,
            auditDate,
            remarks: remarks.trim() || undefined,
            lines: counted.map((l) => ({ bundleProductId: l.bundleProductId, countedQty: l.counted! })),
          })
          .subscribe({
            next: (audit) => {
              this.saving.set(false);
              this.creating.set(false);
              this.snackBar.open(`${audit.audit_number} recorded.`, 'Dismiss', { duration: 3000 });
              this.page.set(1);
              this.load();
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not record this audit.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
