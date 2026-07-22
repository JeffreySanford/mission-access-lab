import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import type { Subscription } from 'rxjs';
import type { OperationsSnapshot } from './operations.models';
import { OperationsApiService } from './operations-api.service';

const REAL_SNAPSHOT: OperationsSnapshot = {
  capturedAt: '2026-01-01T00:00:00.000Z',
  requestsPerMinute: 42,
  availabilityPercent: 99.9,
  p95LatencyMs: 10,
  authorizationModelId: 'model-real',
  totalChecks: 100,
  allowedChecks: 90,
  deniedChecks: 10,
  requestSeries: [],
  latencyByOperation: [],
  services: [],
  links: [],
  auditEvents: [],
};

describe('OperationsApiService', () => {
  let service: OperationsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OperationsApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OperationsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // watchSnapshot() polls forever via interval(3000). Unsubscribing has to happen
  // inside the fakeAsync zone itself (not a plain afterEach) so the virtual clock's
  // pending-timer bookkeeping is torn down consistently before httpMock.verify().

  it('emits the real snapshot from the API on the first tick', fakeAsync(() => {
    let received: OperationsSnapshot | undefined;
    const subscription: Subscription = service
      .watchSnapshot()
      .subscribe((snapshot) => (received = snapshot));

    const request = httpMock.expectOne('/api/operations/snapshot');
    request.flush(REAL_SNAPSHOT);
    tick();

    expect(received).toEqual(REAL_SNAPSHOT);
    subscription.unsubscribe();
    httpMock.verify();
  }));

  it('falls back to a demo snapshot when the API request errors', fakeAsync(() => {
    let received: OperationsSnapshot | undefined;
    const subscription: Subscription = service
      .watchSnapshot()
      .subscribe((snapshot) => (received = snapshot));

    const request = httpMock.expectOne('/api/operations/snapshot');
    request.error(new ProgressEvent('network error'));
    tick();

    expect(received).toBeDefined();
    expect(received?.authorizationModelId).toBe('01J-MISSION-DEMO-03');
    expect(received?.services.length).toBeGreaterThan(0);
    subscription.unsubscribe();
    httpMock.verify();
  }));

  it('polls again after the 3 second interval', fakeAsync(() => {
    let emissionCount = 0;
    const subscription: Subscription = service.watchSnapshot().subscribe(() => emissionCount++);

    httpMock.expectOne('/api/operations/snapshot').flush(REAL_SNAPSHOT);
    tick();
    expect(emissionCount).toBe(1);

    tick(3000);
    httpMock.expectOne('/api/operations/snapshot').flush(REAL_SNAPSHOT);
    tick();
    expect(emissionCount).toBe(2);

    subscription.unsubscribe();
    httpMock.verify();
  }));
});
