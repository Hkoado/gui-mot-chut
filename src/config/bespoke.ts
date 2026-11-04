/** Separate commission, not a sixth template or the 214k personalization package. */
export const bespoke = {
  title: 'Thiết kế độc bản 100%',
  description: 'Không bắt đầu từ một mẫu có sẵn. Mình cùng bạn xây dựng một chiếc web riêng từ câu chuyện, phong cách và những điều chỉ người ấy mới hiểu.',
  details: ['Ý tưởng và thiết kế riêng theo cá nhân', 'Thống nhất nội dung, giao diện và tương tác trước khi làm', 'Báo giá và thời gian theo phạm vi đã trao đổi'],
  note: 'Không thuộc gói 214.000đ hoặc ưu đãi gói Theo mẫu. Điều kiện bàn giao và quyền sử dụng được xác nhận trước khi đặt.',
  // Paste your verified HTTPS Instagram profile URL here, then rebuild.
  instagramUrl: null as string | null,
};
export function getInstagramUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(url.hostname)
      && !url.username && !url.password && url.pathname !== '/' ? url.href : null;
  } catch { return null; }
}