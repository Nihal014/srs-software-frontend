import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryLocationsService } from 'app/shared/services/delivery-locations.service';
import type { DeliveryLocation, UpsertDeliveryLocationPayload } from 'app/shared/models/delivery-location.model';

@Component({
  selector: 'app-delivery-locations-master',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './delivery-locations-master.html',
})
export class DeliveryLocationsMaster implements OnInit {
  private deliveryLocationsService = inject(DeliveryLocationsService);
  private snackBar = inject(MatSnackBar);

  readonly columns = ['name', 'status', 'edit', 'delete'];
  readonly locations = signal<DeliveryLocation[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<DeliveryLocation | 'new' | null>(null);
  readonly saving = signal(false);

  name = '';
  isActive = true;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.deliveryLocationsService.listAll().subscribe((locations) => {
      this.locations.set(locations);
      this.loading.set(false);
    });
  }

  startCreate() {
    this.editing.set('new');
    this.name = '';
    this.isActive = true;
  }

  startEdit(location: DeliveryLocation) {
    this.editing.set(location);
    this.name = location.name;
    this.isActive = location.is_active;
  }

  cancel() {
    this.editing.set(null);
  }

  save() {
    if (!this.name.trim()) {
      this.snackBar.open('Location name is required.', 'Dismiss', { duration: 3000 });
      return;
    }
    const editing = this.editing();
    const payload: UpsertDeliveryLocationPayload = { name: this.name.trim(), isActive: this.isActive };

    this.saving.set(true);
    const request = editing === 'new'
      ? this.deliveryLocationsService.create(payload)
      : this.deliveryLocationsService.update(editing!.id, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Delivery location saved.', 'Dismiss', { duration: 2500 });
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not save this location.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  remove(location: DeliveryLocation) {
    if (!confirm(`Delete "${location.name}"? This can't be undone.`)) return;
    this.deliveryLocationsService.remove(location.id).subscribe({
      next: () => {
        this.snackBar.open('Delivery location deleted.', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Could not delete this location.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
