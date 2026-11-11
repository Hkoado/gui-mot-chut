# Trao — hướng dẫn dự án

Trao là website tiếng Việt giới thiệu thiệp mời và quà tặng tương tác. Ứng dụng dùng Next.js App Router, React, TypeScript và static export.

## Bộ tài liệu

Đọc `AGENTS.md` và bốn tài liệu trong `docs/` trước khi chỉnh sửa:

- `MASTER_PROMPT.md`: định hướng UI và hành vi.
- `DESIGN_SYSTEM.md`: bảng màu, typography, token và trạng thái.
- `PRODUCT.md`: danh mục, giá, chiến dịch và giới hạn sản phẩm.
- `IMPLEMENTATION.md`: cấu trúc, lệnh chạy và kiểm tra.

Đường dẫn code trong tài liệu tính từ gốc ứng dụng.

## Giao diện

Trang chủ có logo Trao xanh rêu ở giữa, navigation tối giản với một underline trượt theo route, icon tìm kiếm, kệ sách 3D ngang, tên chủ đề, CTA “Xem album”, chỉ số lựa chọn và hai mũi tên. Kệ có gáy, bìa, cạnh giấy, chất liệu nhẹ và mask hai mép. Cuốn active ở giữa xoay lộ bìa. Giữ bố cục editorial ấm, khoảng thở và tỷ lệ responsive; không dùng card phẳng làm kệ.

Màu tuân theo `docs/DESIGN_SYSTEM.md`. Thương hiệu lấy từ `src/config/site.ts`. Giao diện dùng tiếng Việt và con trỏ hệ thống.

Kệ có 11 chủ đề dẫn tới album (Boy’s day sau Sinh nhật); dữ liệu sản phẩm có 5 template. Bản sao sách phục vụ vòng lặp là bản sao thị giác, được ẩn khỏi assistive technology.

Các route gồm `/`, `/bang-gia/`, `/cach-dat/`, `/thiet-ke-rieng/`, `/hoi-dap/`. Bảng giá truy cập từ nav, không có link giá dưới kệ; nội dung hỗ trợ và bảng giá có trang riêng.

## Tương tác

- Click gáy chọn chủ đề; click bìa active mở album. Album chứa các template được gán cho chủ đề.
- Drag/vuốt ngang chọn sách; cuộn dọc tự nhiên. Click sau drag không mở nhầm dialog.
- Phím trái/phải xử lý trong kệ; Enter/Space mở sách active. Không chiếm phím toàn trang, không autoplay carousel hoặc nhạc.
- Mũi tên có icon xanh, glow tím hover/focus, target tối thiểu 44px và outline keyboard riêng.
- Dialog hỗ trợ nút đóng, Escape, focus vào/giữ/khôi phục và reduced motion.
- Preview mở video quay màn hình; Visit page mở demo độc lập. Chủ đề trống hoặc thiếu media/URL có thông báo chưa sẵn sàng.

## Phạm vi

Business data nằm trong `src/config/` và `src/data/`. Không bịa nhận xét, doanh số, suất còn lại, contact, video, URL, deadline hoặc bảo đảm hosting. Login, editor, upload, payment, database và admin không hoạt động trong phase 1.

Giữ thay đổi trong ứng dụng, bảo toàn phần chưa commit của người dùng. Báo riêng kiểm tra tự động, review ảnh và giới hạn chưa kiểm tra; build thành công không thay thế review UI.