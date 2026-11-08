import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmService } from 'app/shared/services/confirm.service';
import { CustomersService } from 'app/shared/services/customers.service';
import type { Customer, UpsertCustomerPayload } from 'app/shared/models/customer.model';

const PAYMENT_TERMS = ['Net 15 days', 'Net 30 days', 'Cash on delivery'];

@Component({
  selector: 'app-customers-master',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './customers-master.html',
})
export class CustomersMaster implements OnInit {
  private confirmService = inject(ConfirmService);
  private customersService = inject(CustomersService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly paymentTermsOptions = PAYMENT_TERMS;
  readonly columns = ['slno', 'name', 'contact_person', 'phone', 'gstin', 'payment_terms', 'credit_limit', 'outstanding', 'status', 'edit', 'delete'];
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<Customer | 'new' | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    contactPerson: '',
    phone: '',
    email: ['', [Validators.email]],
    gstin: '',
    address: '',
    paymentTerms: [PAYMENT_TERMS[0], [Validators.required]],
    creditLimit: this.fb.control<number | null>(null, [Validators.min(0)]),
    isActive: true,
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.customersService.listAll().subscribe((customers) => {
      this.customers.set(customers);
      this.loading.set(false);
    });
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({ name: '', contactPerson: '', phone: '', email: '', gstin: '', address: '', paymentTerms: PAYMENT_TERMS[0], creditLimit: null, isActive: true });
  }

  startEdit(customer: Customer) {
    this.editing.set(customer);
    this.form.reset({
      name: customer.name,
      contactPerson: customer.contact_person ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      gstin: customer.gstin ?? '',
      address: customer.address ?? '',
      paymentTerms: customer.payment_terms,
      creditLimit: customer.credit_limit,
      isActive: !!customer.is_active,
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
    const v = this.form.getRawValue();
    const payload: UpsertCustomerPayload = {
      name: v.name.trim(),
      contactPerson: v.contactPerson.trim() || undefined,
      phone: v.phone.trim() || undefined,
      email: v.email.trim() || undefined,
      gstin: v.gstin.trim() || undefined,
      address: v.address.trim() || undefined,
      paymentTerms: v.paymentTerms,
      creditLimit: v.creditLimit ?? undefined,
      isActive: v.isActive,
    };

    this.saving.set(true);
    const request = editing === 'new' ? this.customersService.create(payload) : this.customersService.update(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Customer saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this customer.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(customer: Customer) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete "${customer.name}"? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.customersService.remove(customer.id).subscribe({
          next: () => {
            this.snackBar.open('Customer deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => this.snackBar.open(err.error?.message ?? 'Could not delete this customer.', 'Dismiss', { duration: 5000 }),
        });
      });
  }
}
