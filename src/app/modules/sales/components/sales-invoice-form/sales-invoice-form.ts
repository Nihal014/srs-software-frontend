import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateField } from 'app/shared/components/date-field/date-field';
import { SalesLinesEditor, createSalesLine, salesLinePayloads, salesLinesTotal, type SalesLineGroup } from 'app/shared/components/sales-lines-editor/sales-lines-editor';
import { BundleProductsService } from 'app/shared/services/bundle-products.service';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { CustomersService } from 'app/shared/services/customers.service';
import { SalesDocsService } from 'app/shared/services/sales-docs.service';
import { parseDateString, toDateString } from 'app/shared/utils/date.util';
import type { BundleProduct } from 'app/shared/models/bundle.model';
import type { Customer } from 'app/shared/models/customer.model';
import type { InvoiceContext, SalesLocation } from 'app/shared/models/sales-docs.model';

@Component({
  selector: 'app-sales-invoice-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, DateField, SalesLinesEditor, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './sales-invoice-form.html',
})
export class SalesInvoiceForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private salesDocs = inject(SalesDocsService);
  private customersService = inject(CustomersService);
  private productsService = inject(BundleProductsService);
  private confirmService = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  private readonly editor = viewChild(SalesLinesEditor);

  readonly customers = signal<Customer[]>([]);
  readonly locations = signal<SalesLocation[]>([]);
  readonly products = signal<BundleProduct[]>([]);
  readonly context = signal<InvoiceContext | null>(null);
  readonly saving = signal(false);

  // Once the due date is edited by hand it stops following the invoice date and the customer's terms.
  private dueEdited = false;
  private termsDays = 0;

  readonly form = this.fb.group({
    customerId: this.fb.control<number | null>(null, Validators.required),
    salesLocationId: this.fb.control<number | null>(null),
    invoiceDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    dueDate: this.fb.nonNullable.control(toDateString(new Date()), Validators.required),
    remarks: this.fb.nonNullable.control(''),
    lines: this.fb.array<SalesLineGroup>([createSalesLine(this.fb)]),
  });

  ngOnInit() {
    this.productsService.list().subscribe((p) => this.products.set(p));
    this.salesDocs.locations().subscribe((l) => this.locations.set(l));
    this.customersService.list().subscribe((c) => {
      this.customers.set(c);
      this.loadFromDeliveryNote();
    });

    this.form.controls.customerId.valueChanges.subscribe((id) => {
      if (this.context()) return;
      this.termsDays = this.termsFor(this.customers().find((c) => c.id === id)?.payment_terms);
      this.followTerms();
    });
    this.form.controls.invoiceDate.valueChanges.subscribe(() => this.followTerms());
    this.form.controls.dueDate.valueChanges.subscribe((due) => {
      if (due !== this.suggestedDue()) this.dueEdited = true;
    });
  }

  private termsFor(terms: string | null | undefined) {
    const match = /(\d+)/.exec(terms ?? '');
    return match ? Number(match[1]) : 0;
  }

  private suggestedDue(): string {
    const invoice = parseDateString(this.form.controls.invoiceDate.value);
    if (!invoice) return this.form.controls.dueDate.value;
    invoice.setDate(invoice.getDate() + this.termsDays);
    return toDateString(invoice);
  }

  private followTerms() {
    if (this.dueEdited) return;
    this.form.controls.dueDate.setValue(this.suggestedDue(), { emitEvent: false });
  }

  /** Arriving from a delivery note: the customer and lines come from what was delivered. */
  private loadFromDeliveryNote() {
    const noteId = Number(this.route.snapshot.queryParamMap.get('deliveryNoteId'));
    if (!noteId) return;
    this.salesDocs.invoiceContext(noteId).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        this.termsDays = ctx.termsDays;
        this.form.controls.customerId.setValue(ctx.note.customer_id, { emitEvent: false });
        this.form.controls.customerId.disable({ emitEvent: false });
        this.form.controls.salesLocationId.setValue(ctx.note.sales_location_id);
        this.form.controls.lines.clear();
        ctx.lines.forEach((l) =>
          this.form.controls.lines.push(createSalesLine(this.fb, { productId: l.product_id, qty: l.qty, rate: l.rate, taxPercent: l.tax_percent, discount: l.discount })),
        );
        this.editor()?.refresh();
        this.followTerms();
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Could not load this delivery note.', 'Dismiss', { duration: 5000 }),
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted fields before saving.', 'Dismiss', { duration: 3000 });
      return;
    }
    const v = this.form.getRawValue();
    const ctx = this.context();
    const customer = this.customers().find((c) => c.id === v.customerId)?.name ?? ctx?.note.customer_name ?? '';
    this.confirmService
      .ask({
        title: 'Create sales invoice',
        message: `Create an invoice for ${customer} worth Rs ${salesLinesTotal(this.form.controls.lines).toFixed(2)}? It is also entered in the Sales Register.`,
        confirmLabel: 'Create invoice',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.saving.set(true);
        this.salesDocs
          .createInvoice({
            customerId: v.customerId!,
            deliveryNoteId: ctx?.note.id ?? null,
            salesLocationId: v.salesLocationId,
            invoiceDate: v.invoiceDate,
            dueDate: v.dueDate,
            remarks: v.remarks.trim() || undefined,
            lines: salesLinePayloads(this.form.controls.lines),
          })
          .subscribe({
            next: (created) => {
              this.saving.set(false);
              this.snackBar.open(`${created.invoice_number} created.`, 'Dismiss', { duration: 3000 });
              this.router.navigate(['/sales/invoices', created.id]);
            },
            error: (err) => {
              this.saving.set(false);
              this.snackBar.open(err.error?.message ?? 'Could not create this invoice.', 'Dismiss', { duration: 5000 });
            },
          });
      });
  }
}
