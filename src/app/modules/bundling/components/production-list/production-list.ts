import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { BundleProductionsService } from 'app/shared/services/bundle-productions.service';
import { AuthService } from 'app/core/services/auth.service';
import { DateField } from 'app/shared/components/date-field/date-field';
import { toDateString } from 'app/shared/utils/date.util';
import type { BundleProductionDay } from 'app/shared/models/bundle.model';

@Component({
  selector: 'app-production-list',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    DateField,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './production-list.html',
})
export class ProductionList implements OnInit {
  private productionsService = inject(BundleProductionsService);
  private router = inject(Router);
  readonly auth = inject(AuthService);

  /** Wages are Admin-only, so the column only exists for them. */
  get columns(): string[] {
    return this.auth.isAdmin() ? ['slno', 'date', 'runs', 'units', 'wages', 'action'] : ['slno', 'date', 'runs', 'units', 'action'];
  }

  readonly rows = signal<BundleProductionDay[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly total = signal(0);

  /** The date the "Open day" button takes you to — defaults to today. */
  readonly dayDate = new FormControl(toDateString(new Date()), { nonNullable: true, validators: [Validators.required] });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.productionsService.listDays(this.page(), this.pageSize()).subscribe((res) => {
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

  openDay() {
    if (this.dayDate.invalid) return;
    this.router.navigate(['/bundling/day', this.dayDate.value]);
  }
}
