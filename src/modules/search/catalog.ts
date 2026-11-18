import { templates } from '../../data/templates';
import { getTopics } from '../../data/topics';
import { topicSearchTags } from './tags';

export interface SearchEntry { label: string; href: string; aliases: string[] }
export interface SearchFolder { id: string; label: string; href?: string; aliases: string[]; children: SearchEntry[] }

const templateAliases = (ids: string[]) => templates.filter(item => ids.includes(item.id)).flatMap(item => [item.title, item.occasion]);

export const searchFolders: SearchFolder[] = [
  { id: 'albums', label: 'Album', href: '/#xem-mau', aliases: ['album', 'albums', 'bộ sưu tập', 'chủ đề', 'thiệp'], children: getTopics().map(topic => ({
    label: topic.title, href: `/#album/${topic.id}`,
    aliases: [topic.coverTitle ?? '', topic.id, ...(topicSearchTags[topic.id] ?? []), ...templateAliases(topic.templateIds)],
  })) },
  { id: 'navigation', label: 'Điều hướng', aliases: ['điều hướng', 'navigation', 'module', 'trang'], children: [
    { label: 'Cách đặt', href: '/cach-dat/', aliases: ['đặt thiệp', 'đặt hàng', 'hướng dẫn', 'quy trình', 'order', 'mua'] },
    { label: 'Thiết kế riêng', href: '/thiet-ke-rieng/', aliases: ['thiết kế', 'theo yêu cầu', 'độc bản', 'custom', 'bespoke'] },
    { label: 'Hỏi đáp', href: '/hoi-dap/', aliases: ['faq', 'câu hỏi', 'thắc mắc', 'hỗ trợ', 'help'] },
    { label: 'Bảng giá', href: '/bang-gia/', aliases: ['giá', 'gói', 'chi phí', 'bao nhiêu tiền', 'ưu đãi', 'pricing', 'price'] },
  ] },
];

export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Generic words that should not, on their own, decide whether a topic matches.
const fillers = new Set(['thiep', 'mau', 'cho', 'cua', 'va', 've', 'tang', 'gui', 'mot', 'the', 'card', 'web']);

interface Index { terms: string[]; tokens: string[] }
const indexes = new WeakMap<object, Index>();
function indexOf(entry: { label: string; aliases: string[] }): Index {
  let index = indexes.get(entry);
  if (!index) {
    const terms = [entry.label, ...entry.aliases].map(normalizeSearch).filter(Boolean);
    index = { terms, tokens: [...new Set(terms.flatMap(term => term.split(' ')))] };
    indexes.set(entry, index);
  }
  return index;
}

/** Optimal string alignment distance, stopping early once above `limit`. */
function distance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let before: number[] = [], previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, before[j - 2] + 1);
      current[j] = value;
      best = Math.min(best, value);
    }
    if (best > limit) return limit + 1;
    before = previous; previous = current;
  }
  return previous[b.length];
}

/**
 * Best score for one query word against an entry: 0 means no match.
 * Only the word still being typed (`partial`) may match a token prefix;
 * finished words must match a whole token.
 */
function scoreWord(word: string, { tokens }: Index, partial: boolean) {
  if (tokens.includes(word)) return 4;
  if (partial && tokens.some(token => token.startsWith(word))) return 3;
  // Typo tolerance only for longer words: short Vietnamese syllables differ by
  // one letter too often ("tinh"/"sinh") to treat that as a typo.
  if (word.length < 5) return 0;
  const limit = word.length >= 8 ? 2 : 1;
  // Whole-token typos ("chrismas") and typos while still typing ("chrism").
  return tokens.some(token => distance(word, token, limit) <= limit
    || (partial && token.length > word.length && distance(word, token.slice(0, word.length), 1) <= 1)) ? 1 : 0;
}

/** Relevance of an entry for the query, or 0 when it does not match. */
function scoreEntry(text: string, entry: { label: string; aliases: string[] }) {
  const index = indexOf(entry);
  if (index.terms.includes(text)) return 100;
  const words = text.split(' ');
  const last = words.length - 1;
  const required = words.some(word => !fillers.has(word));
  let total = 0;
  for (const [position, word] of words.entries()) {
    const score = scoreWord(word, index, position === last);
    if (required && fillers.has(word)) { total += score ? .5 : 0; continue; }
    if (!score) return 0;
    total += score;
  }
  return total;
}

export function findFolders(query: string): SearchFolder[] {
  const text = normalizeSearch(query);
  if (!text) return searchFolders;
  return searchFolders.flatMap(folder => {
    if (indexOf(folder).terms.some(term => term.includes(text))) return [folder];
    const children = folder.children
      .map((child, order) => ({ child, order, score: scoreEntry(text, child) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map(item => item.child);
    return children.length ? [{ ...folder, children }] : [];
  });
}

export function resolveSearch(query: string): string | null {
  const text = normalizeSearch(query);
  if (!text) return null;
  const folder = searchFolders.find(item => item.href && indexOf(item).terms.includes(text));
  if (folder?.href) return folder.href;
  const exact = searchFolders.flatMap(item => item.children).filter(item => indexOf(item).terms.includes(text));
  if (exact.length === 1) return exact[0].href;
  const matches = findFolders(query).flatMap(item => item.children);
  return matches.length === 1 ? matches[0].href : null;
}
