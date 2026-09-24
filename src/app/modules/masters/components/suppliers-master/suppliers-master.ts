import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuppliersService } from 'app/shared/services/suppliers.service';
import type { Supplier, UpsertSupplierPayload } from 'app/shared/models/supplier.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

const PAYMENT_TERMS = ['Net 15 days', 'Net 30 days', 'Cash on delivery'];

@Component({
  selector: 'app-suppliers-master',
  standalone: true,
  imports: [ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './suppliers-master.html',
})
export class SuppliersMaster implements OnInit {
  private confirmService = inject(ConfirmService);
  private suppliersService = inject(SuppliersService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly paymentTermsOptions = PAYMENT_TERMS;
  readonly columns = ['slno', 'name', 'contact_person', 'phone', 'gstin', 'payment_terms', 'status', 'edit', 'delete'];
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<Supplier | 'new' | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    contactPerson: '',
    phone: '',
    email: ['', [Validators.email]],
    gstin: '',
    paymentTerms: [PAYMENT_TERMS[0], [Validators.required]],
    isActive: true,
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.suppliersService.listAll().subscribe((suppliers) => {
      this.suppliers.set(suppliers);
      this.loading.set(false);
    });
  }

  startCreate() {
    this.editing.set('new');
    this.form.reset({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      gstin: '',
      paymentTerms: PAYMENT_TERMS[0],
      isActive: true,
    });
  }

  startEdit(supplier: Supplier) {
    this.editing.set(supplier);
    this.form.reset({
      name: supplier.name,
      contactPerson: supplier.contact_person ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      gstin: supplier.gstin ?? '',
      paymentTerms: supplier.payment_terms,
      isActive: !!supplier.is_active,
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
    const payload: UpsertSupplierPayload = {
      name: value.name.trim(),
      contactPerson: value.contactPerson.trim() || undefined,
      phone: value.phone.trim() || undefined,
      email: value.email.trim() || undefined,
      gstin: value.gstin.trim() || undefined,
      paymentTerms: value.paymentTerms,
      isActive: value.isActive,
    };

    this.saving.set(true);
    const request = editing === 'new' ? this.suppliersService.create(payload) : this.suppliersService.update(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Supplier saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this supplier.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(supplier: Supplier) {
    this.confirmService
      .ask({ title: 'Delete', message: `Delete "${supplier.name}"? This can't be undone.`, confirmLabel: 'Delete', destructive: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.suppliersService.remove(supplier.id).subscribe({
          next: () => {
            this.snackBar.open('Supplier deleted.', 'Dismiss', { duration: 2500 });
            this.load();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message ?? 'Could not delete this supplier.', 'Dismiss', { duration: 5000 });
          },
        });
      });
  }
}
