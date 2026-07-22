import type { ChangeDetectorRef } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { AuthorizationPlaygroundComponent } from './authorization-playground.component';

describe('AuthorizationPlaygroundComponent', () => {
  let fixture: ComponentFixture<AuthorizationPlaygroundComponent>;
  let component: AuthorizationPlaygroundComponent;
  let httpMock: HttpTestingController;
  let markForCheckSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthorizationPlaygroundComponent],
      imports: [FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorizationPlaygroundComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    // `private` is compile-time only — grab the component's actual stored
    // ChangeDetectorRef reference and spy on that directly, rather than trying to
    // re-resolve "the same" instance through DI (which wasn't landing on the
    // instance the component actually calls .markForCheck() on).
    const componentInternals = component as unknown as { changeDetector: ChangeDetectorRef };
    markForCheckSpy = spyOn(componentInternals.changeDetector, 'markForCheck');
  });

  afterEach(() => httpMock.verify());

  describe('diagnostics', () => {
    it('loads diagnostics on init and marks the view for check (OnPush regression)', () => {
      fixture.detectChanges(); // triggers ngOnInit -> loadDiagnostics

      const request = httpMock.expectOne('/api/access/diagnostics');
      request.flush({ live: true, openfgaBaseUrl: 'http://openfga:8080', storeId: 's1', modelId: 'm1' });

      expect(component.diagnostics?.live).toBeTrue();
      expect(component.diagnosticsError).toBe('');
      // This is the exact bug that shipped: OnPush + async subscribe() without
      // markForCheck() silently fails to render in a real browser even though
      // the HTTP call succeeds. Asserting state alone is not enough.
      expect(markForCheckSpy).toHaveBeenCalled();
    });

    it('sets diagnosticsError and marks for check when the request fails', () => {
      fixture.detectChanges();

      const request = httpMock.expectOne('/api/access/diagnostics');
      request.error(new ProgressEvent('network error'));

      expect(component.diagnosticsError).toContain('unavailable');
      expect(component.diagnostics).toBeUndefined();
      expect(markForCheckSpy).toHaveBeenCalled();
    });

    it('loadDiagnostics can be called again to refresh (Refresh button)', () => {
      fixture.detectChanges();
      httpMock.expectOne('/api/access/diagnostics').flush({ live: false, openfgaBaseUrl: '', storeId: null, modelId: null });

      component.loadDiagnostics();
      const request = httpMock.expectOne('/api/access/diagnostics');
      request.flush({ live: true, openfgaBaseUrl: 'http://openfga:8080', storeId: 's1', modelId: 'm1' });

      expect(component.diagnostics?.live).toBeTrue();
    });
  });

  describe('runCheck', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/access/diagnostics').flush({ live: true, openfgaBaseUrl: '', storeId: 's1', modelId: 'm1' });
      markForCheckSpy.calls.reset();
    });

    it('sets loading while the request is in flight, then the result on success', () => {
      component.user = 'user:alice';
      component.relation = 'can_edit';
      component.object = 'project:orion';

      component.runCheck();
      expect(component.loading).toBeTrue();
      expect(component.error).toBe('');

      const request = httpMock.expectOne('/api/access/check');
      expect(request.request.body).toEqual({ user: 'user:alice', relation: 'can_edit', object: 'project:orion' });
      request.flush({ allowed: true, decisionId: 'd1', latencyMs: 5, explanation: 'owner' });

      expect(component.loading).toBeFalse();
      expect(component.result?.allowed).toBeTrue();
      expect(markForCheckSpy).toHaveBeenCalled();
    });

    it('sets error and clears loading when the request fails', () => {
      component.runCheck();
      const request = httpMock.expectOne('/api/access/check');
      request.error(new ProgressEvent('network error'));

      expect(component.loading).toBeFalse();
      expect(component.error).toContain('unavailable');
      expect(markForCheckSpy).toHaveBeenCalled();
    });

    it('applyPreset fills the form and runs the check with the preset values', () => {
      const preset = component.presets[1]; // "bob cannot edit orion"
      component.applyPreset(preset);

      expect(component.user).toBe(preset.user);
      expect(component.relation).toBe(preset.relation);
      expect(component.object).toBe(preset.object);

      const request = httpMock.expectOne('/api/access/check');
      expect(request.request.body).toEqual({
        user: preset.user,
        relation: preset.relation,
        object: preset.object,
      });
      request.flush({ allowed: false, decisionId: 'd2', latencyMs: 3, explanation: 'viewer only' });
    });
  });
});
