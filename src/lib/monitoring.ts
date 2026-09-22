let initialized = false;

const REDACTED_KEYS = new Set(['authorization', 'password', 'token', 'access_token', 'refresh_token', 'code', 'otp', 'mfa']);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, REDACTED_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(item)]));
}

export function initializeMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || initialized) return;
  initialized = true;
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request) event.request.data = redact(event.request.data) as typeof event.request.data;
        event.extra = redact(event.extra) as typeof event.extra;
        event.tags = redact(event.tags) as typeof event.tags;
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        breadcrumb.data = redact(breadcrumb.data) as typeof breadcrumb.data;
        return breadcrumb;
      },
    });
  }).catch(() => { initialized = false; });
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  void import('@sentry/react').then((Sentry) => Sentry.captureException(error, { extra: redact(context) as Record<string, unknown> })).catch(() => undefined);
}
