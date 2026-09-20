import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Same concept as the embase-finance reference: a document is printed by routing
 * the app's named `print` outlet to a print-only component, handing it the data
 * through this service. The component calls `onDataReady()` once it has rendered,
 * which opens the browser print dialog and then clears the outlet again.
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private router = inject(Router);
  private data: unknown = null;

  isPrinting = false;

  getData<T>(): T | null {
    return (this.data as T | null) ?? null;
  }

  /** `url` is the path under the print outlet, e.g. 'procurement/po'. */
  printDocumentWithData(url: string, data: unknown) {
    if (this.isPrinting) return;
    this.isPrinting = true;
    this.data = data;
    this.router.navigate(['/', { outlets: { print: ['print', ...url.split('/')] } }]);
  }

  /** Called by the print component after its view has rendered. */
  onDataReady() {
    setTimeout(() => {
      window.print();
      this.finish();
    });
  }

  /** Called by a print component that has nothing to print (e.g. opened directly by URL). */
  cancel() {
    this.finish();
  }

  private finish() {
    this.isPrinting = false;
    this.data = null;
    this.router.navigate([{ outlets: { print: null } }]);
  }
}
