import type { TemplateRecord } from './templates';

export type BookVisual = Pick<TemplateRecord, 'id' | 'title' | 'occasion' | 'description' | 'themeKey' | 'coverSrc' | 'spineSrc'>;
export interface TopicRecord extends BookVisual { templateIds: string[] }

// Topics are navigation categories, not additional product/template records.
const definitions: { id: string; vi: string; en: string; theme: TemplateRecord['themeKey']; templateIds: string[] }[] = [
  { id: 'birthday', vi: 'Thiệp sinh nhật', en: 'Birthday cards', theme: 'yellow', templateIds: ['hom-nay-la-ngay-cua-cau'] },
  { id: 'wedding', vi: 'Thiệp cưới', en: 'Wedding invitations', theme: 'rose', templateIds: [] },
  { id: 'date', vi: 'Thiệp Date', en: 'Date invitations', theme: 'default', templateIds: ['hen-cau-mot-ngay'] },
  { id: 'party', vi: 'Thiệp private party', en: 'Private party invitations', theme: 'sage', templateIds: [] },
  { id: 'womens-day', vi: "Thiệp chúc mừng Women's Day", en: "Women's Day cards", theme: 'rose', templateIds: [] },
  { id: 'christmas', vi: 'Thiệp Giáng sinh', en: 'Christmas cards', theme: 'sage', templateIds: [] },
  { id: 'custom', vi: 'Thiệp Custom', en: 'Custom cards', theme: 'default', templateIds: [] },
  { id: 'love', vi: 'Thư tỏ tình', en: 'Love letters', theme: 'rose', templateIds: ['co-dieu-muon-noi'] },
  { id: 'new-year', vi: 'Thiệp năm mới', en: 'New Year cards', theme: 'yellow', templateIds: [] },
  { id: 'yearbook', vi: 'Thiệp kỉ yếu', en: 'Yearbook cards', theme: 'default', templateIds: [] },
];

export function getTopics(language: 'vi' | 'en'): TopicRecord[] {
  return definitions.map(topic => ({ id: topic.id, title: language === 'vi' ? topic.vi : topic.en,
    occasion: language === 'vi' ? 'BỘ SƯU TẬP' : 'COLLECTION', description: '', themeKey: topic.theme,
    coverSrc: null, spineSrc: null, templateIds: topic.templateIds }));
}