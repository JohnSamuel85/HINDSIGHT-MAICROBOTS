import { AnalysisResult, AnalysisStep, HealthStatus, IssueOption } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const DEMO_ISSUES: IssueOption[] = [
  {
    id: 'api-timeout',
    scenario: 'API Timeout',
    entity: 'Payment Gateway Service',
    badge: 'Critical Incident',
    title: 'Payment Gateway API returning 504 Gateway Timeout during peak traffic',
    description: 'Core checkout endpoints failing with 504 timeouts under sustained 8x traffic spike on /v1/charges.',
    context: 'Flash sales surge causing reverse proxy connection drops and thread saturation.',
    symptoms: [
      '504 Gateway Timeout on /v1/charges',
      'p99 latency degraded from 210ms to >15,000ms',
      'Connection pool reporting 0 idle workers'
    ]
  },
  {
    id: 'customer-escalation',
    scenario: 'Customer Escalation',
    entity: 'Acme Global Enterprise',
    badge: 'SLA Escalation',
    title: 'Enterprise customer experiencing unexpected 429 rate-limit spikes on API v2',
    description: 'Tier-1 client ERP synchronization triggering bursts of 429 Too Many Requests despite daily quota headroom.',
    context: 'Customer deployed multi-region distributed nodes executing scheduled synchronization.',
    symptoms: [
      '429 Too Many Requests on /api/v2/orders',
      'Sudden microbursts from 8 distributed client workers',
      'Executive customer CTO opened severity-1 escalation'
    ]
  },
  {
    id: 'repeated-payment-failure',
    scenario: 'Repeated Payment Failure',
    entity: 'Stripe Webhook Pipeline',
    badge: 'Revenue Risk',
    title: 'Stripe webhook failures causing recurring subscription renewal problems',
    description: 'Inbound invoice.payment_succeeded webhooks timing out after 10s, triggering false customer churn.',
    context: 'Batch renewal run for 45,000 active SaaS accounts with downstream CRM processing.',
    symptoms: [
      'Stripe delivery logs report HTTP 500 / timeouts',
      'Paying customer accounts incorrectly suspended',
      'Duplicate invoice retries causing customer confusion'
    ]
  }
];

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Health check returned status ${res.status}`);
  }
  return res.json();
}

export async function analyzeIssueDirect(issue: IssueOption): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario: issue.scenario,
      problem_title: issue.title,
      problem_description: issue.description,
      context: issue.context,
      symptoms: issue.symptoms
    })
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Analysis request failed with status ${res.status}`);
  }

  return res.json();
}

export async function streamIssueAnalysis(
  issue: IssueOption,
  onStep: (step: AnalysisStep) => void,
  onComplete: (result: AnalysisResult) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        scenario: issue.scenario,
        problem_title: issue.title,
        problem_description: issue.description,
        context: issue.context,
        symptoms: issue.symptoms
      })
    });

    if (!response.ok || !response.body) {
      // Fallback to direct analyze
      const direct = await analyzeIssueDirect(issue);
      onComplete(direct);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const payload = JSON.parse(jsonStr);
          if (payload.type === 'step') {
            onStep(payload.step);
          } else if (payload.type === 'complete') {
            onComplete(payload.data);
          } else if (payload.type === 'error') {
            onError(payload.message || 'Stream processing error');
          }
        } catch (parseErr) {
          console.error('Error parsing SSE event:', parseErr, jsonStr);
        }
      }
    }
  } catch (err: any) {
    console.warn('Streaming error, falling back to direct endpoint:', err);
    try {
      const direct = await analyzeIssueDirect(issue);
      onComplete(direct);
    } catch (directErr: any) {
      onError(directErr.message || 'Workflow failed');
    }
  }
}
