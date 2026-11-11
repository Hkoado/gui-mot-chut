# Trao — design system

## Nguồn cấu hình

`src/styles/theme.css` là nguồn runtime duy nhất cho màu, font, type scale, spacing, radius, shadow, control size, z-index và motion. Tài liệu này mô tả vai trò token, không phải cấu hình độc lập.

Component dùng semantic tokens hoặc aliases kế thừa. Hình học 3D có thể nằm trong component. Breakpoint media query dùng literal nhất quán. Ngoại lệ scope bằng component/data attribute có tên rõ; không dùng `!important` làm chiến lược theme.

## Bộ màu UI

| Màu | Token nguồn | Giá trị | Vai trò |
| --- | --- | --- | --- |
| Paper cream | `--palette-paper` | `#f8f6f0` | Nền, giấy, khoảng thở, chữ trên nút xanh. |
| Forest green | `--palette-forest` | `#0b3c1b` | Chữ chính, tiêu đề, navigation, CTA và cấu trúc. |
| Brand forest | `--palette-brand-forest` | `#0f3d1f` | Logo xanh rêu, không glow. |
| Electric purple | `--palette-electric-purple` | `#7800ff` | Focus và glow điểm nhấn, không tô logo. |

Hướng cân bằng thị giác là kem 60%, xanh 30%, tím 10%, không phải kết quả đo từng pixel. Tím trong suốt/glow vẫn thuộc phần nhấn tím. Media giữ màu nguyên bản, không phủ màu để ép tỷ lệ.

Các sắc hỗ trợ `--palette-sheet`, `--palette-muted`, `--palette-line`, `--palette-rose`, `--palette-sage`, `--palette-yellow` dành cho giấy, chữ phụ, viền và vật liệu sách, không phải màu nhấn cạnh tranh. Tím không có nghĩa nghiệp vụ lỗi/thành công/cảnh báo.

## Semantic roles và trạng thái

| Thành phần | Quy tắc |
| --- | --- |
| Nền/chữ | `--surface-page`, `--surface-raised`, `--text-primary`, `--text-secondary`: nền kem, chữ chính xanh, chữ phụ muted. |
| CTA | `--accent`, `--accent-hover`, `--button-bg`, `--button-text`: nền xanh, chữ kem. `--palette-matcha` là alias forest green, không phải màu riêng. |
| Navigation | Nhóm `--nav-*`: chữ xanh trên nền trong suốt, một underline chung đo theo nhãn active; hover đổi sắc chữ nhẹ, không thêm underline. Mobile cuộn ngang trong vùng riêng. |
| Controls / Search | `--radius-control` thống nhất button vuông bo nhẹ; không thay hình học sách hoặc icon tròn. Search là overlay scope trong header, dùng icon SVG nét mảnh như hệ icon inline hiện có; không thay layout khi mở. Chưa có backend: Enter chỉ báo unavailable, không tạo kết quả. |
| Logo | `--brand-color` kế thừa `--palette-brand-forest`; `--brand-glow: none`. |
| Nền trang | `--page-glow`: một radial gradient tím mềm từ trên giữa, đối xứng hai bên, đứng yên, scope tại `body[data-ui='album-gallery']::before`, không nhận pointer hoặc ảnh hưởng cuộn. |
| Mũi tên | Nhóm `--shelf-arrow-*`: nền trong suốt, icon xanh, radial glow tím khi hover fine pointer/focus-visible. Pseudo-element không nhận pointer, không tăng hit area. Touch không có hover bị kẹt. |
| Focus | `--focus-color` tím. Control có outline; sách có feedback trên mặt sách. Không chỉ dựa glow hoặc màu đơn lẻ. |
| Dialog | Nền giấy, chữ/CTA xanh, kế thừa theme và book preset. |

Dẫn xuất tím lấy từ `--highlight`: `--highlight-soft` trộn 20% và `--highlight-faint` trộn 5% với transparent. Không tô tím đoạn văn dài, toàn bộ tiêu đề hoặc mọi icon.

## Typography và vật liệu

- Wordmark: Ribel Noise qua `.brand-wordmark` và `--brand-*`.
- Heading: Lora qua `--font-heading`; body: Be Vietnam Pro qua `--font-body`.
- Font local tại `public/fonts/`. Quyền web embedding/thương mại của Ribel Noise cần được xác minh, không suy đoán giấy phép.
- `[data-book-theme]` dùng `--book-paper`, `--book-ink`, `--book-accent`. Preset một sách độc lập sách khác. Theme ứng dụng không tự đồng bộ sang demo độc lập.
- Album dùng preset theo chủ đề, tách khỏi bốn preset template cũ. Màu nền/chữ theo ảnh tham chiếu: Sinh nhật `#FFF1B8 / #D6246E`, Boy’s day `#2F5DA8 / #FFB347`, Cưới `#F5EBDD / #8A5A0B`, Hẹn hò `#F7B6B0 / #8B1A33`, Tiệc riêng `#1C1C1E / #E8C872`, Ngày Phụ nữ `#F2A7C3 / #5E1259`, Giáng sinh `#124A2C / #FF7A6B`, Thiết kế riêng `#FFFFFF / #1F2A5C`, Tỏ tình `#D6404B / #FFF1EE`, Năm mới `#B8232B / #FFD772`, Kỉ yếu `#3E4A5C / #F5CC6E`. Boy’s day nằm sau Sinh nhật, chưa có mẫu. Các preset chỉ scope trên `[data-book-theme]` của sách và poster album, không thay nền trang, logo hoặc CTA. Texture, lighting, inset and 3D geometry retain their exact pre-recolor values; only album paper/ink color presets change.
- Gáy sách dùng một nhãn chữ ngang xoay -90° trong mặt 2D; `data-pose` ẩn mặt chữ vuông góc khi đã xoay xong. Hai phía dùng chung `--shelf-perspective` với điểm tụ giữa kệ. Riêng sách bên trái thêm góc nhẹ `--book-left-yaw: 9deg`, giảm dần về 0 khi vào giữa; bên phải không thêm yaw. Chỉ sách vào giữa xoay lộ bìa. Giảm perspective để tăng độ xiên cả hai phía, tăng để nhìn phẳng hơn. Không flatten hoặc filter parent 3D. Chỉ bìa active nhận `--shadow-book-active` responsive để nổi khỏi kệ; không dùng dải bóng nền ngang. Stage chừa khoảng để bóng tan trước tên album.

## Kiểm tra

Review các route/dialog desktop/mobile: kem chủ đạo, xanh tạo cấu trúc, tím nhấn có chủ đích. Kiểm tra tương phản, focus, selected có tín hiệu ngoài màu, target ít nhất 44px, touch, reduced motion và overflow. Token runtime luôn nằm trong `src/styles/theme.css`.