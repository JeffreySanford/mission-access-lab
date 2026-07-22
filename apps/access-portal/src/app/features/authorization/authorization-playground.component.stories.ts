import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { delay, of, throwError } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { AuthorizationPlaygroundComponent } from './authorization-playground.component';

interface Diagnostics { live: boolean; openfgaBaseUrl: string; storeId: string | null; modelId: string | null; }
interface CheckResponse { allowed: boolean; decisionId: string; latencyMs: number; explanation: string; }

const LIVE_DIAGNOSTICS: Diagnostics = {
  live: true,
  openfgaBaseUrl: 'http://openfga:8080',
  storeId: '01KY3GTYPC9VWW27RRXKDKXNXH',
  modelId: '01KY3GTYPW7JF490EP2Y6VZ226',
};

function mockHttpClient(overrides: { get?: unknown; post?: unknown } = {}) {
  return {
    get: overrides.get ?? (() => of(LIVE_DIAGNOSTICS)),
    post: overrides.post ?? (() => of({ allowed: true, decisionId: 'demo', latencyMs: 5, explanation: 'demo' } satisfies CheckResponse)),
  };
}

const meta: Meta<AuthorizationPlaygroundComponent> = {
  title: 'Features/AuthorizationPlayground',
  component: AuthorizationPlaygroundComponent,
  decorators: [
    moduleMetadata({
      imports: [FormsModule],
      providers: [{ provide: HttpClient, useValue: mockHttpClient() }],
    }),
  ],
};

export default meta;
type Story = StoryObj<AuthorizationPlaygroundComponent>;

/** Default state: diagnostics load successfully, no check has been run yet. */
export const NoDecisionYet: Story = {};

/** The wrapper service is unreachable when the page loads. */
export const DiagnosticsUnavailable: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient({ get: () => throwError(() => new Error('network error')) }) },
      ],
    }),
  ],
};

/** Running a check that OpenFGA allows. */
export const AllowResult: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: HttpClient,
          useValue: mockHttpClient({
            post: () =>
              of({
                allowed: true,
                decisionId: 'decision-allow',
                latencyMs: 6,
                explanation: 'OpenFGA found a valid relationship path.',
              } satisfies CheckResponse),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /alice owns orion/i }));
    await expect(canvas.getByText('ALLOW')).toBeInTheDocument();
  },
};

/** Running a check that OpenFGA denies. */
export const DenyResult: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: HttpClient,
          useValue: mockHttpClient({
            post: () =>
              of({
                allowed: false,
                decisionId: 'decision-deny',
                latencyMs: 4,
                explanation: 'OpenFGA found no relationship path granting this relation.',
              } satisfies CheckResponse),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /bob cannot edit orion/i }));
    await expect(canvas.getByText('DENY')).toBeInTheDocument();
  },
};

/** The check request is still in flight — button shows the loading label. */
export const Loading: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: HttpClient,
          useValue: mockHttpClient({
            post: () =>
              of({ allowed: true, decisionId: 'demo', latencyMs: 1, explanation: 'demo' } satisfies CheckResponse).pipe(
                delay(60_000),
              ),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /alice owns orion/i }));
    await expect(canvas.getByRole('button', { name: /checking/i })).toBeInTheDocument();
  },
};

/** The wrapper service is unreachable when a check is submitted. */
export const CheckFailed: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient({ post: () => throwError(() => new Error('network error')) }) },
      ],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /alice owns orion/i }));
    await expect(canvas.getByText(/wrapper service is unavailable/i)).toBeInTheDocument();
  },
};
