import type { TemplateRecord } from './templates';
import type { Locale } from '../i18n/detect';

export type BookVisual = Pick<TemplateRecord, 'id' | 'title' | 'occasion' | 'description' | 'themeKey' | 'coverSrc' | 'spineSrc'> & { coverTitle?: string; spineTitle?: string };
export interface TopicRecord extends BookVisual { templateIds: string[] }

// Topics are navigation categories, not additional product/template records.
const definitions: { id: string; title: string; shortTitle: string; en: { title: string; shortTitle: string }; theme: TemplateRecord['themeKey']; templateIds: string[] }[] = [
  { id: 'birthday', title: 'Thiệp sinh nhật', shortTitle: 'Sinh nhật', en: { title: 'Birthday cards', shortTitle: 'Birthday' }, theme: 'birthday', templateIds: ['hom-nay-la-ngay-cua-cau'] },
  { id: 'boys-day', title: 'Thiệp Boy’s day', shortTitle: 'Boy’s day', en: { title: 'Boy’s Day cards', shortTitle: 'Boy’s Day' }, theme: 'boys-day', templateIds: [] },
  { id: 'wedding', title: 'Thiệp cưới', shortTitle: 'Cưới', en: { title: 'Wedding invitations', shortTitle: 'Wedding' }, theme: 'wedding', templateIds: [] },
  { id: 'date', title: 'Thiệp hẹn hò', shortTitle: 'Hẹn hò', en: { title: 'Date invitations', shortTitle: 'Date' }, theme: 'date', templateIds: ['hen-cau-mot-ngay'] },
  { id: 'party', title: 'Thiệp tiệc riêng', shortTitle: 'Tiệc riêng', en: { title: 'Private party invitations', shortTitle: 'Party' }, theme: 'party', templateIds: [] },
  { id: 'womens-day', title: 'Thiệp chúc mừng ngày Phụ nữ', shortTitle: 'Ngày Phụ nữ', en: { title: 'Women’s Day cards', shortTitle: 'Women’s Day' }, theme: 'womens-day', templateIds: [] },
  { id: 'christmas', title: 'Thiệp Giáng sinh', shortTitle: 'Giáng sinh', en: { title: 'Christmas cards', shortTitle: 'Christmas' }, theme: 'christmas', templateIds: [] },
  { id: 'custom', title: 'Thiệp thiết kế riêng', shortTitle: 'Thiết kế riêng', en: { title: 'Custom-designed cards', shortTitle: 'Custom' }, theme: 'custom', templateIds: [] },
  { id: 'love', title: 'Thư tỏ tình', shortTitle: 'Tỏ tình', en: { title: 'Love letters', shortTitle: 'Love letter' }, theme: 'love', templateIds: ['co-dieu-muon-noi'] },
  { id: 'new-year', title: 'Thiệp năm mới', shortTitle: 'Năm mới', en: { title: 'New Year cards', shortTitle: 'New Year' }, theme: 'new-year', templateIds: [] },
  { id: 'yearbook', title: 'Thiệp kỉ yếu', shortTitle: 'Kỉ yếu', en: { title: 'Yearbook cards', shortTitle: 'Yearbook' }, theme: 'yearbook', templateIds: [] },
];

export function getTopics(locale: Locale = 'vi'): TopicRecord[] {
  return definitions.map(topic => {
    const copy = locale === 'en' ? topic.en : topic;
    return { id: topic.id, title: copy.title, coverTitle: copy.shortTitle,
    spineTitle: copy.shortTitle,
    occasion: locale === 'en' ? 'COLLECTION' : 'BỘ SƯU TẬP', description: '', themeKey: topic.theme,
    coverSrc: null, spineSrc: null, templateIds: topic.templateIds };
  });
}

/** Both languages' titles, for search matching regardless of the current locale. */
export function getTopicTitles(id: string): string[] {
  const topic = definitions.find(item => item.id === id);
  return topic ? [topic.title, topic.shortTitle, topic.en.title, topic.en.shortTitle] : [];
}
