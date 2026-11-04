import type { TemplateRecord } from './templates';
const english: Record<string, { title: string; occasion: string; description: string; features: string[] }> = {
  'hen-cau-mot-ngay': { title: 'A day with you', occasion: 'A date', description: 'A little invitation to a date planned with a whole lot of anticipation.', features: ['Names, invitation and copy tailored to your story', 'An illustrated date-ticket design'] },
  'hom-nay-la-ngay-cua-cau': { title: 'Today is yours', occasion: 'Birthday', description: 'Unwrap little surprises and a birthday wish made just for you.', features: ['Names, wishes and copy tailored to your story', 'An illustrated candle and gift cover'] },
  'tu-minh-den-hom-nay': { title: 'Us, through today', occasion: 'Anniversary', description: 'The photos, the milestones, and all the things still left to say.', features: ['Names and copy tailored to your story', 'An illustrated floral album cover'] },
  'ho-so-hoi-ban': { title: 'The friendship files', occasion: 'Friendship', description: 'A little game filled with stories only your friends would understand.', features: ['Names, notes and copy tailored to your story', 'An illustrated paper-folder cover'] },
  'co-dieu-muon-noi': { title: 'Something to tell you', occasion: 'A message', description: 'Sometimes a little link helps us say the things that are hard to put into words.', features: ['Names and copy tailored to your story', 'An illustrated envelope cover'] },
};
export function translateTemplate(book: TemplateRecord, language: 'vi' | 'en'): TemplateRecord {
  return language === 'en' && english[book.id] ? { ...book, ...english[book.id] } : book;
}