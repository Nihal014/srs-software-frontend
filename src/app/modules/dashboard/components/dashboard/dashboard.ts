import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DashboardService } from 'app/shared/services/dashboard.service';
import { AuthService } from 'app/core/services/auth.service';
import type { Dashboard } from 'app/shared/models/dashboard.model';
import { quoteForDate } from '../../quotes.const';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  private dashboardService = inject(DashboardService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);

  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly loadedAt = signal<Date | null>(null);

  readonly today = new Date();
  readonly quote = quoteForDate(this.today);

  /** "Good morning, Muhammed" — first name only, by the time of day. */
  readonly greeting = computed(() => {
    const hour = this.today.getHours();
    const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const first = this.auth.currentUser()?.name?.trim().split(/\s+/)[0];
    return first ? `${part}, ${first}` : part;
  });

  /** How many things are waiting across the three cards — 0 shows the "all clear" message. */
  readonly attentionTotal = computed(() => {
    const a = this.data()?.attention;
    return a ? a.pendingApproval.count + a.awaitingReceipt.count + a.lowStock.count : 0;
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.dashboardService.get().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loadedAt.set(new Date());
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Could not load the dashboard.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
