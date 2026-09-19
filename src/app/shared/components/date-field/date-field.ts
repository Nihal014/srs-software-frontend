import { Component, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { parseDateString, toDateString } from 'app/shared/utils/date.util';

// Wraps mat-datepicker but reads/writes 'YYYY-MM-DD' strings, so every existing
// form model (and the API payloads) stays string-based with no timezone drift.
@Component({
  selector: 'app-date-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateField), multi: true }],
  host: { class: 'block' },
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <input
        matInput
        [matDatepicker]="picker"
        [value]="date()"
        [disabled]="disabled()"
        placeholder="dd/mm/yyyy"
        (dateChange)="onDateChange($event.value)"
        (blur)="onTouched()"
      />
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-datepicker #picker />
    </mat-form-field>
  `,
})
export class DateField implements ControlValueAccessor {
  readonly label = input('');
  readonly date = signal<Date | null>(null);
  readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.date.set(parseDateString(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onDateChange(value: Date | null) {
    this.date.set(value);
    this.onChange(value ? toDateString(value) : '');
  }
}
