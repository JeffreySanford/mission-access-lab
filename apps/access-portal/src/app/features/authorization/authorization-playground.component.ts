// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Angular DI needs the real value import for constructor injection.
import { HttpClient } from '@angular/common/http';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ChangeDetectorRef is injected via the constructor; Angular DI needs the real value import.
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, type OnInit } from '@angular/core';

interface CheckResponse { allowed: boolean; decisionId: string; latencyMs: number; explanation: string; }
interface Diagnostics { live: boolean; openfgaBaseUrl: string; storeId: string | null; modelId: string | null; }
interface SeededRelationship { user: string; relation: string; object: string; }
interface SamplePreset { label: string; user: string; relation: string; object: string; expect: 'ALLOW' | 'DENY'; }
interface ComparisonRow { aspect: string; rbac: string; rebac: string; }

const SEEDED_RELATIONSHIPS: SeededRelationship[] = [
  { user: 'user:alice', relation: 'owner', object: 'project:orion' },
  { user: 'user:bob', relation: 'viewer', object: 'project:orion' },
  { user: 'project:orion', relation: 'parent', object: 'document:launch-plan' },
  { user: 'organization:mission', relation: 'organization', object: 'project:orion' },
  { user: 'user:carol', relation: 'administrator', object: 'organization:mission' },
];

const RBAC_COMPARISON: ComparisonRow[] = [
  { aspect: 'What a permission check asks', rbac: '"Does this user have a role that grants this permission?" — global or coarsely scoped.', rebac: '"Is there a path in the relationship graph from this user to this specific object?" — always resource-scoped.' },
  { aspect: 'Per-resource access', rbac: 'Needs a role per resource ("project-orion-editor", "project-mars-editor", …) or ad-hoc resource-ID checks in app code.', rebac: 'Native — a tuple always names a specific object, e.g. (user:bob, viewer, project:orion).' },
  { aspect: 'Inherited / hierarchical access', rbac: '"Org admins can edit every project" is business logic you write, test, and keep in sync by hand.', rebac: 'Declared once in the model (tupleToUserset) and evaluated by graph traversal — no code, no drift.' },
  { aspect: "Carol's edit access to project:orion", rbac: 'Needs an explicit "editor" role tuple on project:orion. She has none — a naive RBAC check would deny her, or an admin must remember to assign it.', rebac: 'Falls out for free: she is organization:mission\'s administrator, and the model says org admins inherit can_edit on member projects. Zero direct tuple on the project.' },
];

const SAMPLE_USERS = ['user:alice', 'user:bob', 'user:carol', 'user:dave (unseeded)'];
const SAMPLE_OBJECTS = ['project:orion', 'document:launch-plan', 'organization:mission'];

const PRESETS: SamplePreset[] = [
  { label: 'alice owns orion', user: 'user:alice', relation: 'can_view', object: 'project:orion', expect: 'ALLOW' },
  { label: 'bob cannot edit orion', user: 'user:bob', relation: 'can_edit', object: 'project:orion', expect: 'DENY' },
  { label: 'carol inherits admin edit rights', user: 'user:carol', relation: 'can_edit', object: 'project:orion', expect: 'ALLOW' },
  { label: 'bob inherits view via parent project', user: 'user:bob', relation: 'can_view', object: 'document:launch-plan', expect: 'ALLOW' },
  { label: 'dave is a stranger', user: 'user:dave', relation: 'can_view', object: 'document:launch-plan', expect: 'DENY' },
];

@Component({ selector: 'mal-authorization-playground', templateUrl: './authorization-playground.component.html', styleUrl: './authorization-playground.component.scss', changeDetection: ChangeDetectionStrategy.OnPush, standalone: false })
export class AuthorizationPlaygroundComponent implements OnInit {
  user = 'user:alice'; relation = 'can_edit'; object = 'document:launch-plan';
  result?: CheckResponse; loading = false; error = '';
  diagnostics?: Diagnostics; diagnosticsError = '';
  readonly sampleUsers = SAMPLE_USERS;
  readonly sampleObjects = SAMPLE_OBJECTS;
  readonly presets = PRESETS;
  readonly seededRelationships = SEEDED_RELATIONSHIPS;
  readonly rbacComparison = RBAC_COMPARISON;
  readonly carolPreset = PRESETS[2];

  constructor(private readonly http: HttpClient, private readonly changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadDiagnostics(); }

  loadDiagnostics(): void {
    this.diagnosticsError = '';
    this.http.get<Diagnostics>('/api/access/diagnostics').subscribe({
      next: diagnostics => { this.diagnostics = diagnostics; this.changeDetector.markForCheck(); },
      error: () => { this.diagnosticsError = 'Diagnostics unavailable — the wrapper service may not be running.'; this.changeDetector.markForCheck(); },
    });
  }

  applyPreset(preset: SamplePreset): void {
    this.user = preset.user; this.relation = preset.relation; this.object = preset.object;
    this.runCheck();
  }

  runCheck(): void {
    this.loading = true; this.error = '';
    this.http.post<CheckResponse>('/api/access/check', { user: this.user, relation: this.relation, object: this.object }).subscribe({
      next: result => { this.result = result; this.loading = false; this.changeDetector.markForCheck(); },
      error: () => { this.error = 'The wrapper service is unavailable. Start infrastructure and the Spring Boot app, then retry.'; this.loading = false; this.changeDetector.markForCheck(); },
    });
  }
}
