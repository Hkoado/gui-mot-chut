import { getTopics } from '../../data/topics';

export interface SearchEntry { label: string; href: string; aliases: string[] }
export interface SearchFolder { id: string; label: string; href?: string; aliases: string[]; children: SearchEntry[] }

export const searchFolders: SearchFolder[] = [
  { id: 'albums', label: 'Album', href: '/#xem-mau', aliases: ['album', 'albums', 'bộ sưu tập', 'chủ đề', 'thiệp'], children: getTopics().map(topic => ({
    label: topic.title, href: `/#album/${topic.id}`, aliases: [topic.coverTitle ?? '', topic.id, ...(topic.id === 'yearbook' ? ['kỷ yếu'] : [])],
  })) },
  { id: 'navigation', label: 'Điều hướng', aliases: ['điều hướng', 'navigation', 'module', 'trang'], children: [
    { label: 'Cách đặt', href: '/cach-dat/', aliases: ['đặt thiệp', 'đặt hàng', 'hướng dẫn'] },
    { label: 'Thiết kế riêng', href: '/thiet-ke-rieng/', aliases: ['thiết kế', 'custom', 'bespoke'] },
    { label: 'Hỏi đáp', href: '/hoi-dap/', aliases: ['faq', 'câu hỏi'] },
    { label: 'Bảng giá', href: '/bang-gia/', aliases: ['giá', 'gói', 'pricing'] },
  ] },
];

export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
const terms = (entry: { label: string; aliases: string[] }) => [entry.label, ...entry.aliases].map(normalizeSearch);
export function findFolders(query: string): SearchFolder[] {
  const text = normalizeSearch(query);
  if (!text) return searchFolders;
  const words = text.split(' ');
  return searchFolders.flatMap(folder => {
    if (terms(folder).some(term => term.includes(text))) return [folder];
    const children = folder.children.filter(child => terms(child).some(term => words.every(word => term.includes(word))));
    return children.length ? [{ ...folder, children }] : [];
  });
}
export function resolveSearch(query: string): string | null {
  const text = normalizeSearch(query);
  if (!text) return null;
  const folder = searchFolders.find(item => item.href && terms(item).includes(text));
  if (folder?.href) return folder.href;
  const exact = searchFolders.flatMap(item => item.children).filter(item => terms(item).includes(text));
  if (exact.length === 1) return exact[0].href;
  const matches = findFolders(query).flatMap(item => item.children);
  return matches.length === 1 ? matches[0].href : null;
}