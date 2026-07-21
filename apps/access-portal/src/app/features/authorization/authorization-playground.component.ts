import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

interface CheckResponse {
  allowed: boolean;
  decisionId: string;
  latencyMs: number;
  explanation: string;
}

@Component({
  selector: 'mal-authorization-playground',
  templateUrl: './authorization-playground.component.html',
  styleUrl: './authorization-playground.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AuthorizationPlaygroundComponent {
  user = 'user:alice';
  relation = 'can_edit';
  object = 'document:launch-plan';
  result?: CheckResponse;
  loading = false;
  error = '';

  constructor(
    private readonly http: HttpClient,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  runCheck(): void {
    this.loading = true;
    this.error = '';

    this.http
      .post<CheckResponse>('/api/access/check', {
        user: this.user,
        relation: this.relation,
        object: this.object,
      })
      .subscribe({
        next: (result) => {
          this.result = result;
          this.loading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.error =
            'The wrapper service is unavailable. Start infrastructure and the Spring Boot app, then retry.';
          this.loading = false;
          this.changeDetector.markForCheck();
        },
      });
  }
}
