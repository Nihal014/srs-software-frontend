import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Worked example shown from the info icon on the Stock Value tab. Purely explanatory, no data. */
@Component({
  selector: 'app-stock-value-help-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './stock-value-help-dialog.html',
})
export class StockValueHelpDialog {
  private readonly ref = inject(MatDialogRef<StockValueHelpDialog>);

  close() {
    this.ref.close();
  }
}
