export const pricing = {
  standard:{ id:'standard', name:'Theo mẫu', priceVnd:97000, maxPhotos:5, revisionRounds:1, features:['Chọn một mẫu có sẵn','Thay tên, nội dung và nhạc','Tối đa 5 ảnh','Giữ giao diện và tương tác có sẵn','1 lần chỉnh sửa nhỏ'] },
  personal:{ id:'personal', name:'Câu chuyện riêng', priceVnd:214000, maxPhotos:10, revisionRounds:2, features:['Thay nội dung theo mẫu','Tối đa 10 ảnh','Chọn màu và font trong bộ lựa chọn','Hỗ trợ biên tập lời dẫn','Chọn tối đa 2 chi tiết có sẵn, tùy khả năng hỗ trợ của mẫu','2 lần chỉnh sửa nhỏ'] },
  bespoke:{ id:'bespoke', name:'Ý tưởng của bạn', priceVnd:null as number | null, features:['Trao đổi về ý tưởng','Thống nhất thiết kế, tương tác, thời gian và phạm vi trước khi làm'] },
} as const;