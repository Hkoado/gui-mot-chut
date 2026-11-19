import type { TopicId } from './topics';

type Poem = { text: string; author: string };

// Sửa text và author theo chủ đề. Dùng \n trong text để ngắt dòng thơ.
export const poems: Record<TopicId, Poem> = {
  'birthday': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Sinh nhật
  'boys-day': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Boy’s day
  'wedding': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Cưới
  'date': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Hẹn hò
  'party': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Tiệc riêng
  'womens-day': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Ngày Phụ nữ
  'christmas': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Giáng sinh
  'custom': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Thiết kế riêng
  'love': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Tỏ tình
  'new-year': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Năm mới
  'yearbook': { text: 'Câu thơ điền vào đây', author: 'Tên tác giả' }, // Kỉ yếu
};