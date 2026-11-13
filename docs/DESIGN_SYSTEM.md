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
| Controls / Search | Module native dialog toàn màn hình tại `src/modules/search/`, nền kem, font kế thừa UI; ô nhập gạch chân dùng `--search-input-size`, nhãn con dùng `--search-suggestion-size` lớn hơn bản cũ, tiêu đề folder dùng `--search-folder-size` và lớn hơn nhãn con. Gợi ý và kết quả cùng dạng folder Album / Điều hướng, không ép uppercase. Icon × và kính lúp không khung/nền, target ≥44px; ngoại lệ icon-only có scope `.trao-search__icon`, dùng glow tím từ `--search-icon-glow` (kế thừa glow mũi tên) khi hover fine pointer/focus-visible, giữ outline riêng; không đổi kiểu CTA toàn site. Tìm kiếm local trên dữ liệu chủ đề và route thật, có dấu/không dấu; Enter mở mục khớp rõ ràng, nhiều kết quả giữ danh sách để chọn. Modal giữ/khôi phục focus và cuộn nền. |
| Logo | `--brand-color` kế thừa `--palette-brand-forest`; `--brand-glow: none`. |
| Nền trang | `--page-glow`: một radial gradient tím mềm từ trên giữa, đối xứng hai bên, đứng yên, scope tại `body[data-ui='album-gallery']::before`, không nhận pointer hoặc ảnh hưởng cuộn. |
| Mũi tên | Nhóm `--shelf-arrow-*`: nền trong suốt, icon xanh, radial glow tím khi hover fine pointer/focus-visible. Pseudo-element không nhận pointer, không tăng hit area. Touch không có hover bị kẹt. |
| Xem album | `.album-page .shelf-primary`: icon mắt SVG nét mảnh + nhãn “Xem”, nền/viền trong suốt, chữ xanh; `--shelf-cta-*` kế thừa glow tím của mũi tên khi hover fine pointer/focus-visible. Giữ outline, hit target ≥44px và aria-label chứa tên album. Ngoại lệ scoped, không đổi nút CTA ở trang khác. |
| Focus | `--focus-color` tím. Control có outline; sách có feedback trên mặt sách. Không chỉ dựa glow hoặc màu đơn lẻ. |
| Dialog | Nền giấy, chữ/CTA xanh, kế thừa theme và book preset. |

Dẫn xuất tím lấy từ `--highlight`: `--highlight-soft` trộn 20% và `--highlight-faint` trộn 5% với transparent. Không tô tím đoạn văn dài, toàn bộ tiêu đề hoặc mọi icon.

## Typography và vật liệu

- Copy UI tối giản theo `AGENTS.md`: không tự sinh hướng dẫn/phụ đề thừa. Search không có đoạn hướng dẫn thường trực; nhãn “Gợi ý khám phá” / “Kết quả tìm kiếm” dùng `--search-caption-size`, thông báo trạng thái (gồm không tìm thấy) dùng `--search-status-size`, cả hai kế thừa `--type-lead` để dễ đọc hơn. Giữ accessible labels và live status, không có `aria-describedby` trỏ tới hướng dẫn đã xóa.

- Search folder dùng native `details/summary`, mặc định thu gọn mỗi lần mở search. Click/Enter/Space trên Album hoặc Điều hướng chỉ mở/đóng các mục con, không điều hướng; Enter trong ô nhập vẫn giải quyết từ khóa như trước. Nút xóa nội dung dùng chung SVG × với nút đóng, không khung, glow tím, chỉ hiện khi có nội dung và trả focus về input sau khi xóa. Ẩn decoration cancel mặc định của WebKit trong scope search để tránh hai nút ×.

- Wordmark: Ribel Noise qua `.brand-wordmark` và `--brand-*`.
- Heading và body dùng Hina Mincho qua `--font-heading` / `--font-body`, theo cấu hình runtime trong `src/styles/theme.css`. Chỉ giữ hai font local đang dùng: Hina Mincho và Ribel Noise; các font cũ cùng khai báo CSS đã được loại bỏ. Component phải kế thừa token.
- Font local tại `public/fonts/`. Quyền web embedding/thương mại của Ribel Noise cần được xác minh, không suy đoán giấy phép.
- `[data-book-theme]` dùng `--book-paper`, `--book-ink`, `--book-accent`. Preset một sách độc lập sách khác. Theme ứng dụng không tự đồng bộ sang demo độc lập.
- Album dùng preset pastel theo chủ đề từ file “Bảng màu pastel – Kệ sách Trao.html”, tách khỏi bốn preset template cũ. Màu nền/chữ: Sinh nhật `#FFF1B8 / #D6246E`, Boy’s day `#CFE0F5 / #BF520C`, Cưới `#F5EBDD / #8A5A0B`, Hẹn hò `#F7B6B0 / #8B1A33`, Tiệc riêng `#DCDBDA / #8F6A12`, Ngày Phụ nữ `#F2CBDD / #B5155A`, Giáng sinh `#CDE5D3 / #B8282B`, Thiết kế riêng `#FFFFFF / #1F2A5C`, Tỏ tình `#FAD0BE / #C8203C`, Năm mới `#D4605F / #FFE9A6`, Kỉ yếu `#D5DBEA / #A5660A`. Boy’s day nằm sau Sinh nhật, chưa có mẫu. Bìa và gáy dùng chung màu nền/chữ qua `--spine-paper: var(--book-paper)` và `--spine-ink: var(--book-ink)`; không pha xanh rêu riêng cho chữ gáy. Các preset chỉ scope trên `[data-book-theme]` của sách và poster album, không thay nền trang, logo hoặc CTA. Giữ nguyên texture, ánh sáng, inset và hình học 3D; ánh sáng trên từng mặt có thể làm màu hiển thị khác nhẹ dù cùng màu gốc.
- Gáy sách dùng một nhãn chữ ngang xoay -90° trong mặt 2D; `data-pose` ẩn mặt chữ vuông góc khi đã xoay xong. Hai phía dùng chung `--shelf-perspective` với điểm tụ giữa kệ. Riêng sách bên trái thêm góc nhẹ `--book-left-yaw: 9deg`, giảm dần về 0 khi vào giữa; bên phải không thêm yaw. Chỉ sách vào giữa xoay lộ bìa. Giảm perspective để tăng độ xiên cả hai phía, tăng để nhìn phẳng hơn. Không flatten hoặc filter parent 3D. Chỉ bìa active nhận `--shadow-book-active` responsive để nổi khỏi kệ; không dùng dải bóng nền ngang. Stage chừa khoảng để bóng tan trước tên album.

## Kiểm tra

Liên hệ nằm trong menu ba gạch, mở rộng các mạng xã hội ngay trong panel. Icon giỏ hàng đứng riêng bên phải header; target ≥44px, logo giữa và desktop không đổi.

Trang chủ mobile giữ `min-height: var(--album-screen-height)` và căn giữa toàn cụm kệ/tên chủ đề/Xem trong vùng còn lại dưới header; padding hero đối xứng, không fixed height hay khóa cuộn khi màn hình thấp. Mũi tên mobile tăng cả hit target và cỡ chữ 20% qua `--shelf-arrow-mobile-*`, dịch quanh tâm cũ để không đẩy tên/chỉ số; desktop không đổi.

Footer dùng chung xuất hiện cả trang chủ kệ sách, nằm trong luồng trang sau main; cuộn xuống để xem, không fixed/sticky hay lấy bớt chiều cao căn giữa của kệ. Giữ nội dung và trạng thái liên hệ chưa cấu hình giống các route khác.

Các icon `.header-utility` (profile, giỏ hàng, mạng xã hội) dùng radial glow tím `--header-utility-glow` đồng bộ search khi hover fine pointer hoặc focus-visible; pseudo-element không nhận pointer và không đổi hit area/layout. Giữ outline bàn phím. Icon mạng xã hội thiếu URL vẫn có glow phản hồi nhưng giữ aria-disabled, con trỏ not-allowed và tooltip chưa cấu hình; không tạo link giả. Touch không kích hoạt hover glow.

Cập nhật giỏ hàng: icon Giỏ hàng hiện dẫn tới `/gio-hang/` (thay trạng thái chưa khả dụng cũ); chỉ thanh toán vẫn chưa khả dụng. Module `.cart-*` dùng token `--cart-*`, nền giấy/chữ xanh, cột sản phẩm trái và tóm tắt phải từ 768px. Mobile xếp sản phẩm, tóm tắt và catalog; artwork tái sử dụng CoverArt với style scoped, không nhập CSS hình học kệ.

Desktop giữ ba icon Facebook / Instagram / Threads bên trái và Tìm kiếm / Giỏ hàng / Trang cá nhân bên phải, đối xứng qua logo. Dưới 768px header chỉ có một hàng: ba gạch và tìm kiếm bên trái, logo căn giữa tuyệt đối nhờ hai cột ngoài bằng nhau, icon Giỏ hàng riêng bên phải. Navigation ngang và nhóm icon desktop được ẩn khỏi layout/focus mobile. Ba gạch mở danh sách route thật (gồm Bảng giá, không lặp Giỏ hàng) và mục Liên hệ; Liên hệ mở Facebook / Instagram / Threads với icon trước nhãn. Hai disclosure dùng `HeaderDisclosure.tsx`, đóng khi click ngoài, focus rời nhóm, Escape, chọn link, đổi route hoặc resize; Escape trả focus về trigger, không khóa cuộn hoặc trap focus. Panel có chiều cao giới hạn và cuộn riêng khi cần. Token `--header-mobile-*` và chiều cao header mobile nằm trong theme; target ≥44px. URL mạng xã hội nullable tại `src/config/site.ts`; chưa cấu hình giữ aria-disabled và thông báo khi focus/hover, không tạo link giả. Giỏ hàng dẫn tới `/gio-hang/`; tài khoản chưa khả dụng.

Trang cá nhân mở disclosure `.header-account` ngay dưới icon, canh phải, nền giấy/chữ xanh với token `--account-*`. Danh sách gồm Đăng nhập, Đăng ký, Thiệp đã lưu và Cài đặt tài khoản. Phase 1 chưa có session/auth: các mục disabled, kèm một trạng thái chưa khả dụng, không tạo route hoặc đăng nhập giả. Trigger dùng `aria-expanded`/`aria-controls`, Enter/Space bật tắt; click ngoài, Tab rời nhóm hoặc Escape đóng; Escape trả focus về icon. Panel không khóa cuộn trang hoặc giữ focus như modal, không dùng role menu vì đây là danh sách disclosure chưa có hành động khả dụng.

Review các route/dialog desktop/mobile: kem chủ đạo, xanh tạo cấu trúc, tím nhấn có chủ đích. Kiểm tra tương phản, focus, selected có tín hiệu ngoài màu, target ít nhất 44px, touch, reduced motion và overflow. Token runtime luôn nằm trong `src/styles/theme.css`.