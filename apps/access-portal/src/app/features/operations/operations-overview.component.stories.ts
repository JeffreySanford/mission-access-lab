import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';
import { OperationsApiService } from '../../core/operations-api.service';
import type { OperationsSnapshot } from '../../core/operations.models';
import { OperationsOverviewComponent } from './operations-overview.component';

function snapshot(overrides: Partial<OperationsSnapshot> = {}): OperationsSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    requestsPerMinute: 118,
    availabilityPercent: 99.96,
    p95LatencyMs: 43,
    authorizationModelId: '01J-MISSION-DEMO-03',
    totalChecks: 1261,
    allowedChecks: 1224,
    deniedChecks: 37,
    requestSeries: Array.from({ length: 24 }, (_, index) => ({
      timestamp: new Date(Date.now() - (23 - index) * 60_000).toISOString(),
      value: 40 + Math.round(Math.sin(index / 2.1) * 20 + index),
    })),
    latencyByOperation: [
      { operation: 'Check', p95Ms: 31, count: 916 },
      { operation: 'ListObjects', p95Ms: 68, count: 241 },
      { operation: 'WriteTuples', p95Ms: 46, count: 58 },
    ],
    services: [
      { id: 'portal', label: 'Angular Portal', kind: 'UI', state: 'healthy', latencyMs: 8, x: 9, y: 45 },
      { id: 'wrapper', label: 'Spring Wrapper', kind: 'API', state: 'healthy', latencyMs: 18, x: 34, y: 45 },
      { id: 'openfga', label: 'OpenFGA', kind: 'AUTHZ', state: 'healthy', latencyMs: 31, x: 64, y: 24 },
    ],
    links: [
      { source: 'portal', target: 'wrapper', label: 'REST / JWT', volume: 118 },
      { source: 'wrapper', target: 'openfga', label: 'Check', volume: 92 },
    ],
    auditEvents: [
      { id: '1', occurredAt: new Date().toISOString(), actor: 'user:alice', action: 'can_edit', resource: 'document:launch-plan', decision: 'ALLOW', detail: 'Inherited through project owner' },
      { id: '2', occurredAt: new Date().toISOString(), actor: 'user:mallory', action: 'can_manage', resource: 'project:orion', decision: 'DENY', detail: 'No qualifying relationship' },
    ],
    ...overrides,
  };
}

const meta: Meta<OperationsOverviewComponent> = {
  title: 'Features/OperationsOverview',
  component: OperationsOverviewComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
};

export default meta;
type Story = StoryObj<OperationsOverviewComponent>;

export const Healthy: Story = {
  decorators: [
    moduleMetadata({
      providers: [{ provide: OperationsApiService, useValue: { watchSnapshot: () => of(snapshot()) } }],
    }),
  ],
};

export const DegradedService: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: OperationsApiService,
          useValue: {
            watchSnapshot: () =>
              of(
                snapshot({
                  availabilityPercent: 97.2,
                  services: [
                    { id: 'portal', label: 'Angular Portal', kind: 'UI', state: 'healthy', latencyMs: 8, x: 9, y: 45 },
                    { id: 'wrapper', label: 'Spring Wrapper', kind: 'API', state: 'healthy', latencyMs: 18, x: 34, y: 45 },
                    { id: 'keycloak', label: 'Keycloak', kind: 'IDENTITY', state: 'degraded', latencyMs: 740, x: 90, y: 45 },
                  ],
                }),
              ),
          },
        },
      ],
    }),
  ],
};

export const Empty: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: OperationsApiService,
          useValue: {
            watchSnapshot: () =>
              of(
                snapshot({
                  requestsPerMinute: 0,
                  totalChecks: 0,
                  allowedChecks: 0,
                  deniedChecks: 0,
                  requestSeries: [],
                  latencyByOperation: [],
                  services: [],
                  links: [],
                  auditEvents: [],
                }),
              ),
          },
        },
      ],
    }),
  ],
};
