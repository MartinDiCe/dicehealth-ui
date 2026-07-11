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
  appointmentSlotsUrl: clean(env.VITE_DICEHEALTH_APPOINTMENT_SLOTS_URL),
  appointmentBookingUrl: clean(env.VITE_DICEHEALTH_APPOINTMENT_BOOKING_URL),
  appointmentSellerId: clean(env.VITE_DICEHEALTH_SELLER_ID) || '22222222-2222-4222-8222-000000000201',
  appointmentBranchId: clean(env.VITE_DICEHEALTH_BRANCH_ID) || '22222222-2222-4222-8222-000000000101',
  appointmentServiceId: clean(env.VITE_DICEHEALTH_SERVICE_ID) || '22222222-2222-4222-8222-000000001001',
  appointmentResourceId: clean(env.VITE_DICEHEALTH_RESOURCE_ID) || '22222222-2222-4222-8222-000000002001',
  appointmentDurationMinutes: Number(clean(env.VITE_DICEHEALTH_APPOINTMENT_DURATION_MINUTES) || '30'),
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

export type DemoAppointmentSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  serviceId: string;
  resourceId: string;
  serviceName: string;
  resourceName: string;
  durationMinutes: number;
  source: 'api' | 'demo';
};

export type DemoAppointmentRequest = {
  slot: DemoAppointmentSlot;
  tutorName: string;
  tutorEmail: string;
  tutorPhone: string;
  animalName: string;
  animalSpecies: string;
  reason: string;
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

export async function fetchDemoAppointmentSlots(): Promise<DemoAppointmentSlot[]> {
  const from = new Date();
  from.setDate(from.getDate() + 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 14);
  to.setHours(23, 59, 59, 0);
  const endpoint = config.appointmentSlotsUrl || `${config.apiBaseUrl}/v1/appointments/public/slots`;
  const params = new URLSearchParams({
    tenantId: config.tenantId,
    sellerId: config.appointmentSellerId,
    branchId: config.appointmentBranchId,
    serviceId: config.appointmentServiceId,
    resourceId: config.appointmentResourceId,
    from: toLocalIso(from),
    to: toLocalIso(to),
    durationMinutes: String(config.appointmentDurationMinutes || 30),
    limit: '8',
  });

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, { credentials: 'omit' });
    if (!response.ok) throw new Error(`slots ${response.status}`);
    const json = await response.json();
    const rows: Record<string, unknown>[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.slots)
          ? json.slots
          : [];
    const future = rows
      .map(slotFromApi)
      .filter((slot): slot is DemoAppointmentSlot => slot !== null)
      .filter((slot) => new Date(slot.startsAt) > new Date());
    if (future.length) return future.slice(0, 8);
  } catch {
    // Public gateway may not be deployed yet; keep the landing useful with deterministic future demo slots.
  }
  return futureDemoSlots();
}

export async function requestDemoAppointment(request: DemoAppointmentRequest): Promise<{ ok: boolean; mode: 'api' | 'tracked'; message: string }> {
  const [firstName, ...lastNameParts] = request.tutorName.trim().split(/\s+/);
  const animalSummary = `${request.animalName} (${request.animalSpecies})`;
  const metadata = {
    vertical: 'veterinary',
    source: 'dicehealthpub-ui',
    appointmentSource: request.slot.source,
    tutorName: request.tutorName,
    tutorEmail: request.tutorEmail,
    tutorPhone: request.tutorPhone,
    animalName: request.animalName,
    animalSpecies: request.animalSpecies,
    reason: request.reason,
    slot: request.slot,
  };
  track('APPOINTMENT_REQUEST', {
    actionCode: 'dicehealth_public_appointment_request',
    actionLabel: `${animalSummary} · ${request.slot.serviceName}`,
    category: 'APPOINTMENT',
    entityType: 'APPOINTMENT',
    entityId: request.slot.id,
    metadata,
  });

  const endpoint = config.appointmentBookingUrl || `${config.apiBaseUrl}/v1/appointments/public`;
  const payload = {
    tenantId: config.tenantId,
    sellerId: config.appointmentSellerId,
    branchId: config.appointmentBranchId,
    serviceId: request.slot.serviceId || config.appointmentServiceId,
    resourceId: request.slot.resourceId || config.appointmentResourceId,
    startsAt: request.slot.startsAt,
    endsAt: request.slot.endsAt,
    timezone: request.slot.timezone || 'America/Argentina/Buenos_Aires',
    providerType: 'HEALTH_PROFESSIONAL',
    providerSnapshotJson: JSON.stringify({ name: request.slot.resourceName, service: request.slot.serviceName }),
    subjectType: 'PATIENT',
    createCustomer: false,
    customerFirstName: firstName || request.tutorName,
    customerLastName: lastNameParts.join(' '),
    customerEmail: request.tutorEmail,
    customerPhone: request.tutorPhone,
    preferredLanguage: 'es',
    requestedDurationMinutes: request.slot.durationMinutes || config.appointmentDurationMinutes || 30,
    overbooked: false,
    notes: `Solicitud DiceHealth Pub. Tutor: ${request.tutorName}. Paciente/animal: ${animalSummary}. Motivo: ${request.reason || 'Consulta veterinaria'}.`,
    metadataJson: JSON.stringify(metadata),
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return { ok: true, mode: 'api', message: 'Turno solicitado en la agenda pública.' };
    }
  } catch {
    // Marketing capture above preserves the proof even if appointment public API is not deployed yet.
  }
  return { ok: true, mode: 'tracked', message: 'Solicitud registrada como evento público de DiceHealth.' };
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

function slotFromApi(row: Record<string, unknown>): DemoAppointmentSlot | null {
  const startsAt = string(row.starts_at ?? row.startsAt);
  const endsAt = string(row.ends_at ?? row.endsAt);
  if (!startsAt || !endsAt) return null;
  const serviceId = string(row.service_id ?? row.serviceId) || config.appointmentServiceId;
  const resourceId = string(row.resource_id ?? row.resourceId) || config.appointmentResourceId;
  return {
    id: `${resourceId}-${startsAt}`,
    startsAt,
    endsAt,
    timezone: string(row.timezone) || 'America/Argentina/Buenos_Aires',
    serviceId,
    resourceId,
    serviceName: string(row.service_name ?? row.serviceName) || 'Consulta clínica veterinaria',
    resourceName: string(row.resource_name ?? row.resourceName) || 'Dra. Martina Aguirre',
    durationMinutes: Number(row.slot_duration_minutes ?? row.slotDurationMinutes ?? config.appointmentDurationMinutes ?? 30),
    source: 'api',
  };
}

function futureDemoSlots(): DemoAppointmentSlot[] {
  const templates = [
    ['Consulta clínica veterinaria', 'Dra. Martina Aguirre', 1, 9, 30],
    ['Vacunación y antiparasitario', 'Dra. Paula Castro', 2, 10, 0],
    ['Cardiología veterinaria', 'Dr. Nicolas Duarte', 3, 11, 30],
    ['Ecografía abdominal', 'Ecógrafo Doppler veterinario', 4, 15, 0],
    ['Dermatología veterinaria', 'Dra. Sofia Navarro', 5, 16, 30],
  ] as const;
  return templates.map(([serviceName, resourceName, dayOffset, hour, minute], index) => {
    const start = new Date();
    start.setDate(start.getDate() + dayOffset);
    start.setHours(hour, minute, 0, 0);
    if (start <= new Date()) start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (config.appointmentDurationMinutes || 30));
    return {
      id: `demo-vet-slot-${index + 1}-${start.toISOString()}`,
      startsAt: toLocalIso(start),
      endsAt: toLocalIso(end),
      timezone: 'America/Argentina/Buenos_Aires',
      serviceId: config.appointmentServiceId,
      resourceId: config.appointmentResourceId,
      serviceName,
      resourceName,
      durationMinutes: config.appointmentDurationMinutes || 30,
      source: 'demo',
    };
  });
}

function toLocalIso(value: Date) {
  const pad = (part: number) => part.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

function string(value: unknown) {
  return typeof value === 'string' ? value : '';
}
