import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LeaveTypeDto, LeaveTypesService } from 'api-contract-leave-management';

@Component({
  selector: 'app-leave-types',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './leave-types.component.html',
  styleUrl: './leave-types.component.css'
})
export class LeaveTypesComponent implements OnInit {
  private readonly leaveTypesService = inject(LeaveTypesService);

  leaveTypes = signal<LeaveTypeDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Form model: id is set when editing, undefined when creating.
  form: LeaveTypeDto = { name: '', defaultDays: 1 };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.leaveTypesService.apiLeaveTypesGet().subscribe({
      next: types => {
        this.leaveTypes.set(types);
        this.loading.set(false);
      },
      error: err => this.handleError(err)
    });
  }

  save(): void {
    const { id, name, defaultDays } = this.form;
    const request$ = id
      ? this.leaveTypesService.apiLeaveTypesPut({ id, name, defaultDays })
      : this.leaveTypesService.apiLeaveTypesPost({ name, defaultDays });

    request$.subscribe({
      next: () => {
        this.resetForm();
        this.load();
      },
      error: err => this.handleError(err)
    });
  }

  edit(leaveType: LeaveTypeDto): void {
    this.form = { ...leaveType };
  }

  remove(leaveType: LeaveTypeDto): void {
    if (!leaveType.id || !confirm(`Delete "${leaveType.name}"?`)) {
      return;
    }
    this.leaveTypesService.apiLeaveTypesIdDelete(leaveType.id).subscribe({
      next: () => this.load(),
      error: err => this.handleError(err)
    });
  }

  resetForm(): void {
    this.form = { name: '', defaultDays: 1 };
  }

  private handleError(err: HttpErrorResponse): void {
    this.loading.set(false);
    // The API returns ProblemDetails for validation/404 errors.
    this.error.set(err.error?.title ?? err.message);
  }
}
