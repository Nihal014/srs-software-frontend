import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from 'app/core/services/auth.service';
import { USER_ROLE_LABEL } from 'app/shared/models/user.model';
import { ConfirmService } from 'app/shared/services/confirm.service';

interface NavItem {
  label: string;
  path: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  readonly auth = inject(AuthService);
  readonly roleLabel = USER_ROLE_LABEL;

  private readonly allNavItems: NavItem[] = [
    { label: 'Purchase Orders', path: '/procurement' },
    { label: 'Goods Receipt (GRN)', path: '/grn' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Bundle Recipes', path: '/bundle-recipes' },
    { label: 'Bundling', path: '/bundling' },
    { label: 'Staff', path: '/staff', adminOnly: true },
    { label: 'Payroll', path: '/payroll', adminOnly: true },
    { label: 'Accounts', path: '/accounts', adminOnly: true },
    { label: 'Master Data', path: '/masters' },
    { label: 'Users', path: '/users', adminOnly: true },
  ];

  readonly navItems = computed(() => this.allNavItems.filter((item) => !item.adminOnly || this.auth.isAdmin()));

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
  );

  readonly activeTabLabel = computed(() => {
    this.navigationEnd();
    const url = this.router.url;
    return this.navItems().find((item) => url.startsWith(item.path))?.label ?? 'RSR Bakes ERP';
  });

  confirmLogout() {
    this.confirm
      .ask({ title: 'Log out', message: 'Are you sure you want to log out?', confirmLabel: 'Log out' })
      .subscribe((confirmed) => {
        if (confirmed) this.auth.logout();
      });
  }
}
