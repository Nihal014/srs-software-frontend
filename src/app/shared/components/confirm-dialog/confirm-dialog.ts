import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for deletes and other actions that can't be undone. */
  destructive?: boolean;
}

/** Opened through ConfirmService; closes with `true` on confirm. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div mat-dialog-title class="relative border-b border-border bg-accent-800 px-5 pb-4 pt-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium text-white m-0">{{ data.title }}</h2>
        <mat-icon (click)="close(false)" class="cursor-pointer text-white">close</mat-icon>
      </div>
    </div>

    <div mat-dialog-content class="whitespace-pre-line px-5 pt-4 text-sm">{{ data.message }}</div>

    <div mat-dialog-actions class="flex justify-end gap-2 px-5 pb-4 pt-4">
      <button mat-stroked-button (click)="close(false)" class="bg-white text-black">{{ data.cancelLabel ?? 'Cancel' }}</button>
      <button mat-flat-button (click)="close(true)" class="shadow-xl" [class]="data.destructive ? 'bg-red-700' : 'bg-blue-800'">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  private readonly ref = inject(MatDialogRef<ConfirmDialog, boolean>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  close(confirmed: boolean) {
    this.ref.close(confirmed);
  }
}
