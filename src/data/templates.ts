import type { Locale } from '../i18n/detect';

export type BookTheme = 'default' | 'rose' | 'sage' | 'yellow'
  | 'birthday' | 'boys-day' | 'wedding' | 'date' | 'party' | 'womens-day'
  | 'christmas' | 'custom' | 'love' | 'new-year' | 'yearbook';
export interface TemplateRecord {
  id: string; title: string; occasion: string; description: string; themeKey: BookTheme;
  /** Optional portrait artwork for the physical front-cover face; public asset path. */
  coverSrc: string | null;
  /** Optional tall artwork for the narrow spine face; configured independently of coverSrc. */
  spineSrc: string | null;
  previewPoster: string | null; previewVideoUrl: string | null; demoUrl: string | null;
  enabled: boolean; features: string[];
  /** English copy shown to visitors outside Vietnam. */
  en: { title: string; occasion: string; description: string; features: string[] };
}
export const templates: TemplateRecord[] = [
  { id:'hen-cau-mot-ngay', title:'Hẹn cậu một ngày', occasion:'Hẹn hò', description:'Một lời mời nhỏ cho buổi hẹn đã được chuẩn bị bằng cả sự háo hức.', themeKey:'default', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên, lời mời và nội dung theo câu chuyện của bạn','Thiết kế vé hẹn minh họa riêng'], en:{ title:"A Day With You", occasion:"Date", description:"A small invitation for a date, prepared with all the excitement.", features:["Change the names, invitation and content to fit your story", "Custom illustrated date ticket design"] } },
  { id:'hom-nay-la-ngay-cua-cau', title:'Hôm nay là ngày của cậu', occasion:'Sinh nhật', description:'Mở từng bất ngờ, rồi nhận lời chúc dành riêng cho mình.', themeKey:'yellow', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên, lời chúc và nội dung theo câu chuyện của bạn','Bìa nến và hộp quà minh họa'], en:{ title:"Today Is Your Day", occasion:"Birthday", description:"Open one surprise after another, then receive a wish made just for you.", features:["Change the names, wishes and content to fit your story", "Illustrated candle cover and gift box"] } },
  { id:'tu-minh-den-hom-nay', title:'Tụi mình, đến hôm nay', occasion:'Kỷ niệm', description:'Những tấm ảnh, những cột mốc và những điều vẫn muốn nói.', themeKey:'rose', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên và nội dung theo câu chuyện của bạn','Bìa album hoa minh họa'], en:{ title:"Us, Until Today", occasion:"Anniversary", description:"Photos, milestones and the things we still want to say.", features:["Change the names and content to fit your story", "Illustrated floral album cover"] } },
  { id:'ho-so-hoi-ban', title:'Hồ sơ hội bạn', occasion:'Bạn thân', description:'Một trò chơi nhỏ chứa những chuyện chỉ hội mình mới hiểu.', themeKey:'sage', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên, ghi chú và nội dung theo câu chuyện của bạn','Bìa hồ sơ giấy minh họa'], en:{ title:"The Friend Files", occasion:"Best friends", description:"A little game full of stories only your crew understands.", features:["Change the names, notes and content to fit your story", "Illustrated paper dossier cover"] } },
  { id:'co-dieu-muon-noi', title:'Có điều muốn nói', occasion:'Lời nhắn', description:'Đôi khi một đường link giúp mình bắt đầu điều khó nói.', themeKey:'sage', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên và nội dung theo câu chuyện của bạn','Bìa phong thư minh họa'], en:{ title:"Something I Want to Say", occasion:"Message", description:"Sometimes a link helps you start saying the hard things.", features:["Change the names and content to fit your story", "Illustrated envelope cover"] } },
];

/** A template with its display copy resolved for the locale. */
export function localizeTemplate(template: TemplateRecord, locale: Locale): TemplateRecord {
  return locale === 'en' ? { ...template, ...template.en } : template;
}
export function getTemplates(locale: Locale): TemplateRecord[] {
  return templates.map(template => localizeTemplate(template, locale));
}
