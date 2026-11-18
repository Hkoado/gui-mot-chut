import type { Locale } from '../i18n/detect';

/** Separate commission, not a sixth template or the 214k personalization package. */
export const bespoke = {
  title: 'Thiết kế độc bản 100%',
  description: 'Không bắt đầu từ một mẫu có sẵn. Mình cùng bạn xây dựng một chiếc web riêng từ câu chuyện, phong cách và những điều chỉ người ấy mới hiểu.',
  details: ['Ý tưởng và thiết kế riêng theo cá nhân', 'Thống nhất nội dung, giao diện và tương tác trước khi làm', 'Báo giá và thời gian theo phạm vi đã trao đổi'],
  note: 'Không thuộc gói 214.000đ hoặc ưu đãi gói Theo mẫu. Điều kiện bàn giao và quyền sử dụng được xác nhận trước khi đặt.',
  en: {
    title: '100% one-of-a-kind design',
    description: 'We don’t start from an existing template. Together we build a website of your own from your story, your style and the things only that person will understand.',
    details: ['An idea and design made just for one person', 'Content, design and interactions agreed before work starts', 'Quote and timing based on the agreed scope'],
    note: 'Not part of the 214,000 VND package or the From a template offer. Delivery terms and usage rights are confirmed before ordering.',
  },
  // Paste your verified HTTPS Instagram profile URL here, then rebuild.
  instagramUrl: null as string | null,
};
/** Bespoke display copy for the locale. */
export function bespokeCopy(locale: Locale) {
  return locale === 'en' ? bespoke.en : bespoke;
}
export function getInstagramUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(url.hostname)
      && !url.username && !url.password && url.pathname !== '/' ? url.href : null;
  } catch { return null; }
}