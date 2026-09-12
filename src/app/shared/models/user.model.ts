// Mirrors USER_ROLE in the backend's user.interface.ts — keep both in sync.
export const USER_ROLE = {
  Admin: 1,
  Staff: 2,
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  [USER_ROLE.Admin]: 'Admin',
  [USER_ROLE.Staff]: 'Staff',
};

// Mirrors USER_STATUS in the backend's user.interface.ts — keep both in sync.
export const USER_STATUS = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  [USER_STATUS.Pending]: 'Pending Approval',
  [USER_STATUS.Approved]: 'Approved',
  [USER_STATUS.Rejected]: 'Rejected',
};

export interface CurrentUser {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: { id: number; email: string; name: string; role: UserRole };
}

export interface ManagedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
}
