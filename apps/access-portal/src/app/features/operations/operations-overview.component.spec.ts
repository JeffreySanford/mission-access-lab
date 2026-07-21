import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { OperationsApiService } from '../../core/operations-api.service';
import { OperationsOverviewComponent } from './operations-overview.component';

describe('OperationsOverviewComponent', () => {
  let fixture: ComponentFixture<OperationsOverviewComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperationsOverviewComponent], imports: [CommonModule, RouterTestingModule],
      providers: [{ provide: OperationsApiService, useValue: { watchSnapshot: () => of({ capturedAt: new Date().toISOString(), requestsPerMinute: 1, availabilityPercent: 100, p95LatencyMs: 5, authorizationModelId: 'model-1', totalChecks: 10, allowedChecks: 9, deniedChecks: 1, requestSeries: [{ timestamp: new Date().toISOString(), value: 1 }], latencyByOperation: [], services: [], links: [], auditEvents: [] }) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(OperationsOverviewComponent); fixture.detectChanges();
  });
  it('renders the platform operations title', () => expect(fixture.nativeElement.textContent).toContain('Mission operations'));
});
