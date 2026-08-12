// Service layer for promo code generation.
// Replace MockPromoService with a real implementation (e.g. RealApiPromoService)
// without touching the Telegram bot code.

export interface PromoResult {
  promoCode: string;
  token: string;
  personalUrl: string;
}

export interface PromoService {
  generatePromo(playerId: string, telegramUserId: number): Promise<PromoResult>;
  getPromo(playerId: string): Promise<PromoResult | null>;
  getPersonalUrl(promoCode: string): string;
}

const BASE_URL = Deno.env.get("PROMO_BASE_URL") ??
  "https://id-preview--aec65081-7bab-43bb-85da-a75bb55fa973.lovable.app/#/promo";

function randomToken(length = 24): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, length);
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `SO2-${out.slice(0, 5)}-${out.slice(5, 10)}`;
}

/**
 * Mock implementation: generates unique codes locally.
 * Standoff 2 has no public promo API — swap this out when a real source exists.
 */
export class MockPromoService implements PromoService {
  // deno-lint-ignore require-await
  async generatePromo(_playerId: string, _telegramUserId: number): Promise<PromoResult> {
    const promoCode = randomCode();
    const token = randomToken();
    return { promoCode, token, personalUrl: `${BASE_URL}/${token}` };
  }

  // deno-lint-ignore require-await
  async getPromo(_playerId: string): Promise<PromoResult | null> {
    return null;
  }

  getPersonalUrl(promoCode: string): string {
    return `${BASE_URL}/${promoCode}`;
  }
}

export const promoService: PromoService = new MockPromoService();
