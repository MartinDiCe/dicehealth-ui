const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const clean = (value?: string) => (value ?? '').trim();
const trimSlash = (value: string) => value.replace(/\/+$/, '');
const ensurePath = (value: string) => value.startsWith('/') ? value : `/${value}`;

export const config = {
  apiBaseUrl: trimSlash(clean(env.VITE_API_BASE_URL) || 'https://api.diceprojects.com/api'),
  backofficePublicBaseUrl: trimSlash(clean(env.VITE_BACKOFFICE_PUBLIC_BASE_URL) || 'https://backoffice.diceprojects.com'),
  campaignKey: clean(env.VITE_MARKETING_CAMPAIGN_KEY) || 'dicehealth-web',
  publicBotKey: clean(env.VITE_PUBLIC_BOT_KEY) || 'dicehealth-web',
  enableMarketing: clean(env.VITE_MARKETING_CAPTURE_ENABLED || 'true') !== 'false',
  enablePublicBot: clean(env.VITE_PUBLIC_BOT_ENABLED || 'true') !== 'false',
  tenantId: clean(env.VITE_DEMO_TENANT_ID) || '22222222-2222-4222-8222-222222222222',
  clinicalAgendaUrl: clean(env.VITE_DICEHEALTH_AGENDA_URL) || 'https://api.diceprojects.com/api/v1/appointments/defaults/veterinary-hospital-demo',
  medicationsUrl: clean(env.VITE_DICEHEALTH_MEDICATIONS_URL) || 'https://api.diceprojects.com/api/v1/health/defaults/veterinary-hospital-demo',
  studiesUrl: clean(env.VITE_DICEHEALTH_STUDIES_URL) || 'https://api.diceprojects.com/api/v1/health/defaults/veterinary-hospital-demo',
  confirmPath: clean(env.VITE_DICEHEALTH_CONFIRM_APPOINTMENT_PATH) || '/public/dicehealth/appointments/dicehealth-demo-confirmar-lola',
  studyPath: clean(env.VITE_DICEHEALTH_STUDY_CONFIRMATION_PATH) || '/public/dicehealth/studies/dicehealth-demo-ecografia-simba',
  followUpPath: clean(env.VITE_DICEHEALTH_FOLLOW_UP_PATH) || '/public/dicehealth/follow-up/dicehealth-demo-milo-cardio',
};

export function publicUrl(path: string) {
  return `${config.backofficePublicBaseUrl}${ensurePath(path)}`;
}

function visitorId() {
  const key = 'dicehealth.marketing.visitorId.v1';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = window.crypto?.randomUUID?.() ?? `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function sessionId() {
  const key = 'dicehealth.marketing.sessionId.v1';
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = window.crypto?.randomUUID?.() ?? `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

type TrackOptions = {
  actionCode: string;
  actionLabel?: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export function track(eventType: string, options: TrackOptions) {
  if (!config.enableMarketing || !config.apiBaseUrl || !config.campaignKey) return;
  const payload = {
    eventType,
    entityType: options.entityType,
    entityId: options.entityId,
    visitorId: visitorId(),
    actionCode: options.actionCode,
    actionLabel: options.actionLabel,
    category: options.category,
    channel: 'WEB',
    pageUrl: window.location.href,
    referrerUrl: document.referrer || undefined,
    metadata: JSON.stringify({ vertical: 'DiceHealth', sessionId: sessionId(), tenantId: config.tenantId, ...options.metadata }),
  };
  void fetch(`${config.apiBaseUrl}/v1/campaigns/capture/${encodeURIComponent(config.campaignKey)}/events`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

export async function askPublicBot(message: string): Promise<string | null> {
  if (!config.enablePublicBot || !config.apiBaseUrl || !config.publicBotKey) return null;
  try {
    const response = await fetch(`${config.apiBaseUrl}/v1/public-bots/${encodeURIComponent(config.publicBotKey)}/message`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        visitorId: visitorId(),
        sessionId: sessionId(),
        language: 'es',
        pageUrl: window.location.href,
        referrerUrl: document.referrer || undefined,
        allowAi: false,
      }),
    });
    if (!response.ok) return null;
    const json = await response.json();
    return typeof json?.answer === 'string' ? json.answer : null;
  } catch {
    return null;
  }
}
