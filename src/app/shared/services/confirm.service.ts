import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, type Observable } from 'rxjs';
import { ConfirmDialog, type ConfirmDialogData } from 'app/shared/components/confirm-dialog/confirm-dialog';

/** One-line "are you sure?" for any action: `this.confirm.ask({ title, message }).subscribe((ok) => { if (ok) ... })`. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialog = inject(MatDialog);

  ask(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        panelClass: ['rb-dialog-container', 'w-[420px]', 'max-w-[95vw]'],
        autoFocus: false,
        data,
      })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}
