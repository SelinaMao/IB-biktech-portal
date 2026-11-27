import type { PaymentTemplate } from "./payment.types";

export const PAYMENT_STORAGE_KEY_TEMPLATES = "ib_portal_payment_saved_templates";
export const PAYMENT_TEMPLATES_UPDATED_EVENT = "ib_portal_payment_templates_updated";

export const DEFAULT_PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: "tpl-default-bill-1",
    name: "EDC Electricity",
    type: "Bill payment",
    providerName: "Electricity Authority",
    providerId: "electricity-authority",
    providerInitials: "EA",
    correspondentId: "EDC-100001",
    createdAt: "2026-04-10T08:30:00.000Z",
  },
  {
    id: "tpl-default-mobile-1",
    name: "Sales team top-up",
    type: "Mobile top-up",
    providerName: "Smart",
    providerInitials: "SM",
    correspondentId: "011 222 2222",
    createdAt: "2026-04-12T10:15:00.000Z",
  },
  {
    id: "tpl-default-bill-2",
    name: "Office Water Supply",
    type: "Bill payment",
    providerName: "City Water Supply",
    providerId: "city-water-supply",
    providerInitials: "PW",
    correspondentId: "WTR-200001",
    createdAt: "2026-04-15T09:00:00.000Z",
  },
];

export function loadSavedPaymentTemplates(): PaymentTemplate[] {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_TEMPLATES;
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY_TEMPLATES);
    if (!raw) {
      localStorage.setItem(PAYMENT_STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_PAYMENT_TEMPLATES));
      return DEFAULT_PAYMENT_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(PAYMENT_STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_PAYMENT_TEMPLATES));
    return DEFAULT_PAYMENT_TEMPLATES;
  } catch {
    return DEFAULT_PAYMENT_TEMPLATES;
  }
}

export function savePaymentTemplate(
  item: Omit<PaymentTemplate, "id" | "createdAt"> & { id?: string; createdAt?: string },
): PaymentTemplate {
  if (typeof window === "undefined") {
    return {
      ...item,
      id: item.id || `local-tpl-${Date.now()}`,
      createdAt: item.createdAt || new Date().toISOString(),
    };
  }

  const current = loadSavedPaymentTemplates();
  const cleanName = item.name.trim().toLowerCase();
  const cleanType = item.type.trim().toLowerCase();

  // Match existing template by ID, or if same type AND same template name
  const existingIndex = current.findIndex(
    (t) =>
      (item.id && t.id === item.id) ||
      (cleanName && t.name.trim().toLowerCase() === cleanName && t.type.trim().toLowerCase() === cleanType),
  );

  let updatedTemplate: PaymentTemplate;

  if (existingIndex >= 0) {
    updatedTemplate = {
      ...current[existingIndex],
      ...item,
      id: current[existingIndex].id,
      name: item.name.trim() || current[existingIndex].name,
    };
    current[existingIndex] = updatedTemplate;
  } else {
    updatedTemplate = {
      ...item,
      id: item.id || `local-tpl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    current.unshift(updatedTemplate);
  }

  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY_TEMPLATES, JSON.stringify(current));
    window.dispatchEvent(new Event(PAYMENT_TEMPLATES_UPDATED_EVENT));
  } catch {
    // Ignore storage quota errors
  }

  return updatedTemplate;
}

export function updateSavedPaymentTemplate(updated: PaymentTemplate): void {
  if (typeof window === "undefined") return;
  const current = loadSavedPaymentTemplates();
  const index = current.findIndex((t) => t.id === updated.id);
  if (index >= 0) {
    current[index] = updated;
  } else {
    current.unshift(updated);
  }
  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY_TEMPLATES, JSON.stringify(current));
    window.dispatchEvent(new Event(PAYMENT_TEMPLATES_UPDATED_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function deleteSavedPaymentTemplate(id: string): void {
  if (typeof window === "undefined") return;
  const current = loadSavedPaymentTemplates();
  const next = current.filter((t) => t.id !== id);
  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY_TEMPLATES, JSON.stringify(next));
    window.dispatchEvent(new Event(PAYMENT_TEMPLATES_UPDATED_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}
