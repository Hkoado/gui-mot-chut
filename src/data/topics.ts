import type { TemplateRecord } from './templates';

export type BookVisual = Pick<TemplateRecord, 'id' | 'title' | 'occasion' | 'description' | 'themeKey' | 'coverSrc' | 'spineSrc'> & { coverTitle?: string; spineTitle?: string };
export interface TopicRecord extends BookVisual { templateIds: string[] }

// Topics are navigation categories, not additional product/template records.
const definitions: { id: string; title: string; shortTitle: string; theme: TemplateRecord['themeKey']; templateIds: string[] }[] = [
  { id: 'birthday', title: 'Thiệp sinh nhật', shortTitle: 'Sinh nhật', theme: 'birthday', templateIds: ['hom-nay-la-ngay-cua-cau'] },
  { id: 'boys-day', title: 'Thiệp Boy’s day', shortTitle: 'Boy’s day', theme: 'boys-day', templateIds: [] },
  { id: 'wedding', title: 'Thiệp cưới', shortTitle: 'Cưới', theme: 'wedding', templateIds: [] },
  { id: 'date', title: 'Thiệp hẹn hò', shortTitle: 'Hẹn hò', theme: 'date', templateIds: ['hen-cau-mot-ngay'] },
  { id: 'party', title: 'Thiệp tiệc riêng', shortTitle: 'Tiệc riêng', theme: 'party', templateIds: [] },
  { id: 'womens-day', title: 'Thiệp chúc mừng ngày Phụ nữ', shortTitle: 'Ngày Phụ nữ', theme: 'womens-day', templateIds: [] },
  { id: 'christmas', title: 'Thiệp Giáng sinh', shortTitle: 'Giáng sinh', theme: 'christmas', templateIds: [] },
  { id: 'custom', title: 'Thiệp thiết kế riêng', shortTitle: 'Thiết kế riêng', theme: 'custom', templateIds: [] },
  { id: 'love', title: 'Thư tỏ tình', shortTitle: 'Tỏ tình', theme: 'love', templateIds: ['co-dieu-muon-noi'] },
  { id: 'new-year', title: 'Thiệp năm mới', shortTitle: 'Năm mới', theme: 'new-year', templateIds: [] },
  { id: 'yearbook', title: 'Thiệp kỉ yếu', shortTitle: 'Kỉ yếu', theme: 'yearbook', templateIds: [] },
];

export function getTopics(): TopicRecord[] {
  return definitions.map(topic => ({ id: topic.id, title: topic.title, coverTitle: topic.shortTitle,
    spineTitle: topic.shortTitle,
    occasion: 'BỘ SƯU TẬP', description: '', themeKey: topic.theme,
    coverSrc: null, spineSrc: null, templateIds: topic.templateIds }));
}