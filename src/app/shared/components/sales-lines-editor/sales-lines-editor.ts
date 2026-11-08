import { Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { BundleProduct } from 'app/shared/models/bundle.model';
import type { DocLinePayload } from 'app/shared/models/sales-docs.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function createSalesLine(
  fb: FormBuilder,
  preset: { productId?: number | null; qty?: number; rate?: number; taxPercent?: number; discount?: number } = {},
) {
  return fb.nonNullable.group({
    productId: fb.control<number | null>(preset.productId ?? null, Validators.required),
    qty: [preset.qty ?? 1, [Validators.required, Validators.min(0.001)]],
    rate: [preset.rate ?? 0, [Validators.required, Validators.min(0)]],
    taxPercent: [preset.taxPercent ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
    discount: [preset.discount ?? 0, [Validators.required, Validators.min(0)]],
  });
}

export type SalesLineGroup = ReturnType<typeof createSalesLine>;

/** (qty x rate - discount) plus tax, the same rule the server uses. */
export function salesLineAmount(line: { qty: number; rate: number; taxPercent: number; discount: number }) {
  const gross = (line.qty || 0) * (line.rate || 0) - (line.discount || 0);
  return round2(gross + (gross * (line.taxPercent || 0)) / 100);
}

export function salesLinesTotal(lines: FormArray<SalesLineGroup>) {
  return round2(lines.getRawValue().reduce((a, l) => a + salesLineAmount(l), 0));
}

export function salesLinePayloads(lines: FormArray<SalesLineGroup>): DocLinePayload[] {
  return lines.getRawValue().map((l) => ({ productId: l.productId!, qty: l.qty, rate: l.rate, taxPercent: l.taxPercent, discount: l.discount }));
}

/** The product lines table shared by quotations, sales orders and invoices. */
@Component({
  selector: 'app-sales-lines-editor',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './sales-lines-editor.html',
  styleUrl: './sales-lines-editor.scss',
})
export class SalesLinesEditor {
  private fb = inject(FormBuilder);

  readonly lines = input.required<FormArray<SalesLineGroup>>();
  readonly products = input.required<BundleProduct[]>();

  readonly columns = ['slno', 'product', 'unit', 'qty', 'rate', 'tax', 'discount', 'amount', 'remove'];
  private readonly version = signal(0);
  readonly rows = computed(() => {
    this.version();
    return [...this.lines().controls];
  });

  unitOf(line: SalesLineGroup) {
    return this.products().find((p) => p.id === line.controls.productId.value)?.output_unit ?? '';
  }

  amountOf(line: SalesLineGroup) {
    return salesLineAmount(line.getRawValue());
  }

  total() {
    return salesLinesTotal(this.lines());
  }

  onProduct(line: SalesLineGroup) {
    const product = this.products().find((p) => p.id === line.controls.productId.value);
    if (product) line.controls.rate.setValue(product.selling_price);
  }

  add() {
    this.lines().push(createSalesLine(this.fb));
    this.version.update((v) => v + 1);
  }

  remove(index: number) {
    this.lines().removeAt(index);
    this.version.update((v) => v + 1);
  }

  /** Call after the parent replaced the lines (e.g. prefilled from a delivery note). */
  refresh() {
    this.version.update((v) => v + 1);
  }
}
