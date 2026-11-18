// Search-only keywords per shelf topic (Vietnamese, English, common phrasing).
// Diacritics, case and punctuation are normalized at match time, and small
// typos are tolerated, so misspellings do not need to be listed here.
// Template titles/occasions are added automatically from data/templates.
export const topicSearchTags: Record<string, string[]> = {
  birthday: ['sinh nhật', 'chúc mừng sinh nhật', 'mừng tuổi mới', 'tuổi mới', 'happy birthday', 'birthday', 'bday', 'thôi nôi', 'bánh kem', 'thổi nến', 'quà sinh nhật'],
  'boys-day': ['boy’s day', 'boys day', 'ngày của con trai', 'con trai', 'nam giới', 'quốc tế nam giới', 'men’s day', 'mens day', '19/11', 'bạn trai'],
  wedding: ['đám cưới', 'cưới', 'cưới hỏi', 'thiệp mời cưới', 'hôn lễ', 'kết hôn', 'đính hôn', 'ăn hỏi', 'vu quy', 'tân hôn', 'wedding', 'save the date', 'marry'],
  date: ['hẹn hò', 'buổi hẹn', 'hẹn gặp', 'rủ đi chơi', 'đi chơi', 'lời mời', 'date', 'dating', 'crush'],
  party: ['tiệc', 'bữa tiệc', 'mời tiệc', 'liên hoan', 'họp lớp', 'tân gia', 'tất niên', 'họp mặt', 'party'],
  'womens-day': ['phụ nữ', 'quốc tế phụ nữ', 'phụ nữ việt nam', '8/3', '20/10', 'mùng 8 tháng 3', 'women’s day', 'womens day', 'tặng mẹ', 'tặng vợ', 'bạn gái'],
  christmas: ['giáng sinh', 'noel', 'ông già noel', 'cây thông', 'mùa đông', 'christmas', 'merry christmas', 'xmas', 'santa', '24/12', '25/12'],
  custom: ['thiết kế riêng', 'theo yêu cầu', 'đặt riêng', 'độc bản', 'cá nhân hóa', 'custom', 'bespoke'],
  love: ['tỏ tình', 'thư tình', 'tình yêu', 'người yêu', 'bày tỏ', 'thổ lộ', 'thả thính', 'crush', 'love', 'love letter', 'confession', 'valentine', '14/2'],
  'new-year': ['năm mới', 'tết', 'tết nguyên đán', 'tết dương lịch', 'chúc tết', 'giao thừa', 'mùa xuân', 'lì xì', 'new year', 'happy new year'],
  yearbook: ['kỷ yếu', 'kỉ yếu', 'tốt nghiệp', 'ra trường', 'bế giảng', 'cuối cấp', 'chia tay lớp', 'thanh xuân', 'yearbook', 'graduation'],
};
