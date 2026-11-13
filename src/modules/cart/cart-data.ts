import { pricing } from '../../config/pricing';
import { templates } from '../../data/templates';

export const cartStorageKey = 'trao:cart:v1';
export const cartPackages = [pricing.standard, pricing.personal];
export type CartPackageId = typeof cartPackages[number]['id'];
export interface CartItem { templateId: string; packageId: CartPackageId }

/** Store selections only. Prices and product details always come from the catalog. */
export function parseCart(value: string | null): CartItem[] {
  try {
    const data: unknown = JSON.parse(value ?? '[]');
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data.flatMap((item: unknown): CartItem[] => {
      if (!item || typeof item !== 'object' || !('templateId' in item) || !('packageId' in item)) return [];
      const template = templates.find(template => template.enabled && template.id === item.templateId);
      const selectedPackage = cartPackages.find(selectedPackage => selectedPackage.id === item.packageId);
      if (!template || !selectedPackage || seen.has(template.id)) return [];
      seen.add(template.id);
      return [{ templateId: template.id, packageId: selectedPackage.id }];
    });
  } catch { return []; }
}

export const formatCartPrice = (value: number) => `${value.toLocaleString('vi-VN')}đ`;