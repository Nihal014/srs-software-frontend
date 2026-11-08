import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
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
  /** Label shown to non-admin users when it differs. */
  staffLabel?: string;
}

interface NavSection {
  label: string;
  icon: string;
  items: NavItem[];
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

  readonly dashboard: NavItem = { label: 'Dashboard', path: '/dashboard' };

  // The client menu outline. Only screens that exist are listed.
  private readonly allSections: NavSection[] = [
    {
      label: 'Purchase', icon: 'shopping_cart',
      items: [
        { label: 'Vendors Creation', path: '/purchase/vendors' },
        { label: 'Item Code Creation', path: '/purchase/item-codes' },
        { label: 'Purchase Order', path: '/procurement' },
        { label: 'GRN', path: '/grn' },
        { label: 'Purchase Return', path: '/purchase-returns' },
        { label: 'Stock Location Creation', path: '/purchase/stock-locations' },
        { label: 'LTO & LTI', path: '/stock-transfers' },
        { label: 'Ingredient Inventory', path: '/inventory' },
        { label: 'Purchase Invoices & Payment', path: '/purchase-invoices', adminOnly: true },
      ],
    },
    {
      label: 'Sales',
      icon: 'point_of_sale',
      items: [
        { label: 'Customers Creation', path: '/sales/customers', adminOnly: true },
        { label: 'Sales Location', path: '/sales/locations', adminOnly: true },
        { label: 'Quotation', path: '/sales/quotations', adminOnly: true },
        { label: 'Sales Order', path: '/sales/orders', adminOnly: true },
        { label: 'Sales Return', path: '/sales/returns', adminOnly: true },
        { label: 'Sales Invoices & Payment', path: '/sales/invoices', adminOnly: true },
        { label: 'Delivery Note', path: '/sales/delivery-notes', adminOnly: true },
      ],
    },
    {
      label: 'Production', icon: 'factory',
      items: [
        { label: 'Recipes', path: '/bundle-recipes' },
        { label: 'Recipe Daily Bundling & Costing', path: '/bundling' },
        { label: 'LTO & LTI', path: '/product-transfers' },
        { label: 'Recipe Inventory', path: '/product-inventory' },
      ],
    },
    {
      label: 'Staff & Payroll', icon: 'groups',
      items: [
        { label: 'Staff', path: '/staff', adminOnly: true },
        { label: 'Payroll', path: '/payroll', staffLabel: 'Attendance' },
      ],
    },
    { label: 'Accounts', icon: 'account_balance', items: [{ label: 'Accounts', path: '/accounts', adminOnly: true }] },
    { label: 'Analytics', icon: 'insights', items: [{ label: 'Reports', path: '/analytics/reports', adminOnly: true }, { label: 'GST Reports', path: '/analytics/gst', adminOnly: true }] },
    { label: 'Users', icon: 'manage_accounts', items: [{ label: 'Users', path: '/users', adminOnly: true }] },
  ];

  readonly sections = computed(() => {
    const isAdmin = this.auth.isAdmin();
    return this.allSections
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (item.staffLabel && !isAdmin ? { ...item, label: item.staffLabel } : item)),
      }))
      .filter((section) => section.items.length > 0);
  });

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
  );

  private readonly currentItem = computed(() => {
    this.navigationEnd();
    const url = this.router.url;
    const items = [this.dashboard, ...this.sections().flatMap((section) => section.items)];
    return items.find((item) => url === item.path || url.startsWith(item.path + '/') || url.startsWith(item.path + '?'));
  });

  readonly activeTabLabel = computed(() => this.currentItem()?.label ?? 'RSR Bakes ERP');

  readonly activeSection = computed(() => {
    const current = this.currentItem();
    return this.sections().find((s) => s.items.some((i) => i.path === current?.path))?.label ?? null;
  });

  // A section opens by itself when you land inside it; any section can still be opened or closed by hand.
  private readonly openSections = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(() => {
      const label = this.activeSection();
      if (label) this.openSections.update((open) => new Set(open).add(label));
    });
  }

  isOpen(label: string) {
    return this.openSections().has(label);
  }

  toggle(label: string) {
    this.openSections.update((open) => {
      const next = new Set(open);
      if (!next.delete(label)) next.add(label);
      return next;
    });
  }

  confirmLogout() {
    this.confirm
      .ask({ title: 'Log out', message: 'Are you sure you want to log out?', confirmLabel: 'Log out' })
      .subscribe((confirmed) => {
        if (confirmed) this.auth.logout();
      });
  }
}
