const STORAGE_PREFIX = 'sana:consultations';

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || 'guest'}`;
}

function normalizeConsultation(entry) {
  const dateValue = entry?.scheduledAt || entry?.date || new Date().toISOString();
  const scheduledAt = new Date(dateValue);

  return {
    id: entry?.id || `consultation-${Date.now()}`,
    participantId: entry?.participantId || '',
    participantName: entry?.participantName || 'Consulta',
    specialty: entry?.specialty || '',
    mode: entry?.mode || 'Videollamada',
    scheduledAt: Number.isNaN(scheduledAt.getTime()) ? new Date().toISOString() : scheduledAt.toISOString(),
    notes: entry?.notes || '',
  };
}

export function loadConsultations(userId) {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeConsultation);
  } catch (error) {
    return [];
  }
}

export function saveConsultations(userId, consultations) {
  if (typeof window === 'undefined') {
    return [];
  }

  const next = consultations
    .map(normalizeConsultation)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
  return next;
}

export function addConsultation(userId, consultation) {
  const current = loadConsultations(userId);
  const next = [
    ...current,
    normalizeConsultation({
      ...consultation,
      id: consultation?.id || `consultation-${Date.now()}`,
    }),
  ];

  return saveConsultations(userId, next);
}
