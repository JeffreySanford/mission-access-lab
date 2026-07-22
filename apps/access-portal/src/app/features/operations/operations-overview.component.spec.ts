import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { OperationsApiService } from '../../core/operations-api.service';
import type { OperationsSnapshot } from '../../core/operations.models';
import { OperationsOverviewComponent } from './operations-overview.component';

function snapshot(overrides: Partial<OperationsSnapshot> = {}): OperationsSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    requestsPerMinute: 1,
    availabilityPercent: 100,
    p95LatencyMs: 5,
    authorizationModelId: 'model-1',
    totalChecks: 10,
    allowedChecks: 9,
    deniedChecks: 1,
    requestSeries: [{ timestamp: new Date().toISOString(), value: 1 }],
    latencyByOperation: [],
    services: [],
    links: [],
    auditEvents: [],
    ...overrides,
  };
}

describe('OperationsOverviewComponent', () => {
  let fixture: ComponentFixture<OperationsOverviewComponent>;
  let component: OperationsOverviewComponent;

  function configure(snapshotValue: OperationsSnapshot) {
    return TestBed.configureTestingModule({
      declarations: [OperationsOverviewComponent],
      imports: [CommonModule, RouterTestingModule],
      providers: [
        { provide: OperationsApiService, useValue: { watchSnapshot: () => of(snapshotValue) } },
      ],
    }).compileComponents();
  }

  beforeEach(async () => {
    await configure(snapshot());
    fixture = TestBed.createComponent(OperationsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the platform operations title', () =>
    expect(fixture.nativeElement.textContent).toContain('Mission operations'));

  it('constructs viewModel$ from operationsApi without a field-initializer-order error', (done) => {
    // Regression case: viewModel$ used to be a field initializer that read
    // this.operationsApi before the constructor's parameter property assigned it
    // (TS2729). Moving the assignment into the constructor body fixed this, but a
    // future refactor could reintroduce it — this test proves the pipeline actually
    // runs and produces derived values, not just that it compiles.
    component.viewModel$.subscribe((viewModel) => {
      expect(viewModel.allowedChecks).toBe(9);
      expect(viewModel.deniedChecks).toBe(1);
      expect(viewModel.allowPercent).toBeCloseTo(90, 5);
      expect(viewModel.denyPercent).toBeCloseTo(10, 5);
      expect(viewModel.trafficPath).toContain('M');
      done();
    });
  });

  it('nodeById finds a node by id', () => {
    const nodes = [
      { id: 'a', label: 'A', kind: 'UI', state: 'healthy' as const, latencyMs: 1, x: 0, y: 0 },
      { id: 'b', label: 'B', kind: 'API', state: 'healthy' as const, latencyMs: 2, x: 1, y: 1 },
    ];
    expect(component.nodeById(nodes, 'b')?.label).toBe('B');
  });

  it('nodeById returns undefined for an unknown id', () => {
    expect(component.nodeById([], 'missing')).toBeUndefined();
  });

  it('maxLatency returns at least 1 for an empty array', () => {
    expect(component.maxLatency([])).toBe(1);
  });

  it('maxLatency returns the highest p95Ms across entries', () => {
    expect(component.maxLatency([{ p95Ms: 12 }, { p95Ms: 87 }, { p95Ms: 34 }])).toBe(87);
  });
});

describe('OperationsOverviewComponent with an empty request series', () => {
  it('produces empty traffic paths rather than throwing', (done) => {
    TestBed.configureTestingModule({
      declarations: [OperationsOverviewComponent],
      imports: [CommonModule, RouterTestingModule],
      providers: [
        {
          provide: OperationsApiService,
          useValue: { watchSnapshot: () => of(snapshot({ requestSeries: [] })) },
        },
      ],
    })
      .compileComponents()
      .then(() => {
        const fixture = TestBed.createComponent(OperationsOverviewComponent);
        fixture.detectChanges();
        fixture.componentInstance.viewModel$.subscribe((viewModel) => {
          expect(viewModel.trafficPath).toBe('');
          expect(viewModel.trafficAreaPath).toBe('');
          done();
        });
      });
  });
});
