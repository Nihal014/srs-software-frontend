import { Validators, type FormBuilder } from '@angular/forms';

export interface PoLineValue {
  itemId: number | null;
  qtyOrdered: number | null;
  rate: number | null;
  taxPercent: number | null;
  discount: number | null;
}

/** One purchase-order line as a typed FormGroup; shared by the New PO dialog and the PO detail editor. */
export function createPoLineGroup(fb: FormBuilder, value: Partial<PoLineValue> = {}) {
  return fb.group({
    itemId: fb.control<number | null>(value.itemId ?? null, [Validators.required]),
    qtyOrdered: fb.control<number | null>(value.qtyOrdered ?? 0, [Validators.required, Validators.min(0.001)]),
    rate: fb.control<number | null>(value.rate ?? 0, [Validators.required, Validators.min(0)]),
    taxPercent: fb.control<number | null>(value.taxPercent ?? 0,),
    discount: fb.control<number | null>(value.discount ?? 0, ),
  });
}

export type PoLineGroup = ReturnType<typeof createPoLineGroup>;

export function poLineTotal(line: PoLineValue): number {
  const gross = (line.qtyOrdered || 0) * (line.rate || 0) - (line.discount || 0);
  return gross + (gross * (line.taxPercent || 0)) / 100;
}

export function poTotals(lines: PoLineValue[]) {
  const subtotal = lines.reduce((a, l) => a + (l.qtyOrdered || 0) * (l.rate || 0), 0);
  const totalDiscount = lines.reduce((a, l) => a + (l.discount || 0), 0);
  const grandTotal = lines.reduce((a, l) => a + poLineTotal(l), 0);
  return { subtotal, totalDiscount, totalTax: grandTotal - subtotal + totalDiscount, grandTotal };
}
