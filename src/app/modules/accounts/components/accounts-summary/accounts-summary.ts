import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountsService } from 'app/shared/services/accounts.service';
import { ACCOUNT_TYPE, ACCOUNT_TYPE_LABEL, type AccountType, type AccountsSummary as SummaryData } from 'app/shared/models/accounts.model';

@Component({
  selector: 'app-accounts-summary',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, MatProgressSpinnerModule],
  templateUrl: './accounts-summary.html',
})
export class AccountsSummary implements OnInit {
  private api = inject(AccountsService);

  readonly summary = signal<SummaryData | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.summary().subscribe((s) => {
      this.summary.set(s);
      this.loading.set(false);
    });
  }

  typeText(type: AccountType): string {
    return ACCOUNT_TYPE_LABEL[type];
  }

  isPartner(type: AccountType): boolean {
    return type === ACCOUNT_TYPE.Partner;
  }
}
