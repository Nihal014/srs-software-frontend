import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuppliersService } from 'app/shared/services/suppliers.service';
import type { Supplier, UpsertSupplierPayload } from 'app/shared/models/supplier.model';

const PAYMENT_TERMS = ['Net 15 days', 'Net 30 days', 'Cash on delivery'];

@Component({
  selector: 'app-suppliers-master',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './suppliers-master.html',
})
export class SuppliersMaster implements OnInit {
  private suppliersService = inject(SuppliersService);
  private snackBar = inject(MatSnackBar);

  readonly paymentTermsOptions = PAYMENT_TERMS;
  readonly columns = ['name', 'contact_person', 'phone', 'gstin', 'payment_terms', 'status', 'edit', 'delete'];
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<Supplier | 'new' | null>(null);
  readonly saving = signal(false);

  name = '';
  contactPerson = '';
  phone = '';
  email = '';
  gstin = '';
  paymentTerms = PAYMENT_TERMS[0];
  isActive = true;

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
    this.name = '';
    this.contactPerson = '';
    this.phone = '';
    this.email = '';
    this.gstin = '';
    this.paymentTerms = PAYMENT_TERMS[0];
    this.isActive = true;
  }

  startEdit(supplier: Supplier) {
    this.editing.set(supplier);
    this.name = supplier.name;
    this.contactPerson = supplier.contact_person ?? '';
    this.phone = supplier.phone ?? '';
    this.email = supplier.email ?? '';
    this.gstin = supplier.gstin ?? '';
    this.paymentTerms = supplier.payment_terms;
    this.isActive = supplier.is_active;
  }

  cancel() {
    this.editing.set(null);
  }

  save() {
    if (!this.name.trim()) {
      this.snackBar.open('Supplier name is required.', 'Dismiss', { duration: 3000 });
      return;
    }
    const editing = this.editing();
    const payload: UpsertSupplierPayload = {
      name: this.name.trim(),
      contactPerson: this.contactPerson.trim() || undefined,
      phone: this.phone.trim() || undefined,
      email: this.email.trim() || undefined,
      gstin: this.gstin.trim() || undefined,
      paymentTerms: this.paymentTerms,
      isActive: this.isActive,
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
    if (!confirm(`Delete "${supplier.name}"? This can't be undone.`)) return;
    this.suppliersService.remove(supplier.id).subscribe({
      next: () => {
        this.snackBar.open('Supplier deleted.', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Could not delete this supplier.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
