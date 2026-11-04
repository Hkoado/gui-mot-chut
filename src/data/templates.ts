export type BookTheme = 'default' | 'rose' | 'sage' | 'yellow';
export interface TemplateRecord {
  id: string; title: string; occasion: string; description: string; themeKey: BookTheme;
  /** Optional portrait artwork for the physical front-cover face; public asset path. */
  coverSrc: string | null;
  /** Optional tall artwork for the narrow spine face; configured independently of coverSrc. */
  spineSrc: string | null;
  previewPoster: string | null; previewVideoUrl: string | null; demoUrl: string | null;
  enabled: boolean; features: string[];
}
export const templates: TemplateRecord[] = [
  { id:'hen-cau-mot-ngay', title:'Hẹn cậu một ngày', occasion:'Hẹn hò', description:'Một lời mời nhỏ cho buổi hẹn đã được chuẩn bị bằng cả sự háo hức.', themeKey:'default', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên, lời mời và nội dung theo câu chuyện của bạn','Thiết kế vé hẹn minh họa riêng'] },
  { id:'hom-nay-la-ngay-cua-cau', title:'Hôm nay là ngày của cậu', occasion:'Sinh nhật', description:'Mở từng bất ngờ, rồi nhận lời chúc dành riêng cho mình.', themeKey:'yellow', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên, lời chúc và nội dung theo câu chuyện của bạn','Bìa nến và hộp quà minh họa'] },
  { id:'tu-minh-den-hom-nay', title:'Tụi mình, đến hôm nay', occasion:'Kỷ niệm', description:'Những tấm ảnh, những cột mốc và những điều vẫn muốn nói.', themeKey:'rose', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên và nội dung theo câu chuyện của bạn','Bìa album hoa minh họa'] },
  { id:'ho-so-hoi-ban', title:'Hồ sơ hội bạn', occasion:'Bạn thân', description:'Một trò chơi nhỏ chứa những chuyện chỉ hội mình mới hiểu.', themeKey:'sage', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên, ghi chú và nội dung theo câu chuyện của bạn','Bìa hồ sơ giấy minh họa'] },
  { id:'co-dieu-muon-noi', title:'Có điều muốn nói', occasion:'Lời nhắn', description:'Đôi khi một đường link giúp mình bắt đầu điều khó nói.', themeKey:'sage', coverSrc:null, spineSrc:null, previewPoster:null, previewVideoUrl:null, demoUrl:null, enabled:true, features:['Thay tên và nội dung theo câu chuyện của bạn','Bìa phong thư minh họa'] },
];