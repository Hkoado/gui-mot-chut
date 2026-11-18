import type { Locale } from '../i18n/detect';

export const pricing = {
  standard:{ id:'standard', name:'Theo mẫu', priceVnd:97000, maxPhotos:5, revisionRounds:1, features:['Chọn một mẫu có sẵn','Thay tên, nội dung và nhạc','Tối đa 5 ảnh','Giữ giao diện và tương tác có sẵn','1 lần chỉnh sửa nhỏ'],
    en:{ name:'From a template', features:['Choose an existing template','Change names, content and music','Up to 5 photos','Keep the existing design and interactions','1 round of minor edits'] } },
  personal:{ id:'personal', name:'Câu chuyện riêng', priceVnd:214000, maxPhotos:10, revisionRounds:2, features:['Thay nội dung theo mẫu','Tối đa 10 ảnh','Chọn màu và font trong bộ lựa chọn','Hỗ trợ biên tập lời dẫn','Chọn tối đa 2 chi tiết có sẵn, tùy khả năng hỗ trợ của mẫu','2 lần chỉnh sửa nhỏ'],
    en:{ name:'Your own story', features:['Change content within the template','Up to 10 photos','Choose colors and fonts from the curated set','Help editing the narration','Choose up to 2 existing details, depending on template support','2 rounds of minor edits'] } },
  bespoke:{ id:'bespoke', name:'Ý tưởng của bạn', priceVnd:null as number | null, features:['Trao đổi về ý tưởng','Thống nhất thiết kế, tương tác, thời gian và phạm vi trước khi làm'],
    en:{ name:'Your idea', features:['Talk through your idea','Agree on design, interactions, timing and scope before work starts'] } },
} as const;

/** Package display copy (name, features) for the locale; prices stay in VND. */
export function packageCopy(item: { name: string; features: readonly string[]; en: { name: string; features: readonly string[] } }, locale: Locale) {
  return locale === 'en' ? item.en : { name: item.name, features: item.features };
}
