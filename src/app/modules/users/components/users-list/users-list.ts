import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from 'app/shared/services/users.service';
import {
  USER_ROLE,
  USER_ROLE_LABEL,
  USER_STATUS,
  USER_STATUS_LABEL,
  type ManagedUser,
  type UserRole,
  type UserStatus,
} from 'app/shared/models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatButtonModule, MatSelectModule],
  templateUrl: './users-list.html',
})
export class UsersList implements OnInit {
  private usersService = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  readonly USER_STATUS = USER_STATUS;
  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: USER_ROLE.Admin, label: USER_ROLE_LABEL[USER_ROLE.Admin] },
    { value: USER_ROLE.Staff, label: USER_ROLE_LABEL[USER_ROLE.Staff] },
  ];

  readonly columns = ['name', 'email', 'role', 'status', 'active'];
  readonly users = signal<ManagedUser[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);

  readonly pending = computed(() => this.users().filter((u) => u.status === USER_STATUS.Pending));
  readonly others = computed(() => this.users().filter((u) => u.status !== USER_STATUS.Pending));

  statusLabel(status: UserStatus): string {
    return USER_STATUS_LABEL[status];
  }

  statusSlug(status: UserStatus): string {
    switch (status) {
      case USER_STATUS.Pending:
        return 'pending';
      case USER_STATUS.Rejected:
        return 'rejected';
      default:
        return 'approved';
    }
  }

  pendingRoles = new Map<number, UserRole>();

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.usersService.list().subscribe((users) => {
      this.users.set(users);
      for (const u of users) {
        if (u.status === USER_STATUS.Pending && !this.pendingRoles.has(u.id)) {
          this.pendingRoles.set(u.id, u.role);
        }
      }
      this.loading.set(false);
    });
  }

  approve(user: ManagedUser) {
    this.busyId.set(user.id);
    const role = this.pendingRoles.get(user.id) ?? user.role;
    this.usersService.approve(user.id, role).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(`${user.name} approved.`, 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.snackBar.open(err.error?.message ?? 'Could not approve this user.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  reject(user: ManagedUser) {
    if (!confirm(`Reject ${user.name}'s signup request?`)) return;
    this.busyId.set(user.id);
    this.usersService.reject(user.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(`${user.name} rejected.`, 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.snackBar.open(err.error?.message ?? 'Could not reject this user.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  changeRole(user: ManagedUser, role: UserRole) {
    this.busyId.set(user.id);
    this.usersService.updateRole(user.id, role).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(`${user.name}'s role updated.`, 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.snackBar.open(err.error?.message ?? 'Could not update role.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  toggleActive(user: ManagedUser) {
    this.busyId.set(user.id);
    this.usersService.setActive(user.id, !user.is_active).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.snackBar.open(err.error?.message ?? 'Could not update this user.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
