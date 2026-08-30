import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  path: string;
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
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Purchase Orders', path: '/procurement' },
    { label: 'Goods Receipt (GRN)', path: '/grn' },
    { label: 'Masters', path: '/masters' },
  ];

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
  );

  readonly activeTabLabel = computed(() => {
    this.navigationEnd();
    const url = this.router.url;
    return this.navItems.find((item) => url.startsWith(item.path))?.label ?? 'RSR Bakes ERP';
  });
}
