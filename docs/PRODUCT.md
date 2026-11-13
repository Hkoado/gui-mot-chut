# Trao — sản phẩm

## Danh mục

- `src/data/templates.ts`: 5 template records.
- `src/data/topics.ts`: 11 chủ đề chứa templateIds. Boy’s day nằm sau Sinh nhật và chưa có mẫu. Chủ đề không đồng nghĩa mẫu hoàn thành; bản sao thị giác không được tính thêm.
- Sách active mở album chủ đề. Album cho chọn mẫu/video quay màn hình; Visit page mở demo thật, host độc lập.
- Chủ đề trống, video/URL/contact thiếu có unavailable state trung thực.
- Thương hiệu Trao lấy từ `src/config/site.ts`, giao diện tiếng Việt.
- Giá/chiến dịch ở `/bang-gia/`, truy cập qua nav; không có link giá dưới kệ trang chủ. Thông tin hỗ trợ ở `/cach-dat/`, `/thiet-ke-rieng/`, `/hoi-dap/`.

## Giá và quyền lợi

Nguồn là `src/config/pricing.ts`:

- **Theo mẫu — 97.000đ:** chọn mẫu, thay tên/nội dung/nhạc, tối đa 5 ảnh, giữ giao diện/tương tác sẵn có, 1 lần chỉnh sửa nhỏ.
- **Câu chuyện riêng — 214.000đ:** tối đa 10 ảnh, màu/font trong bộ lựa chọn, hỗ trợ lời dẫn, tối đa 2 chi tiết có sẵn tùy mẫu, 2 lần sửa nhỏ.
- **Ý tưởng của bạn — báo giá riêng:** thống nhất thiết kế, tương tác, thời gian, phạm vi trước khi làm. Nội dung và contact riêng ở `src/config/bespoke.ts`.

Chỉ giới thiệu quyền lợi mẫu thực sự hỗ trợ. CTA giữ templateId/packageId sang trang giá/liên hệ. Không hiển thị xác nhận đặt hàng vì chưa có backend nhận đơn.

## Chiến dịch đơn đầu

Nguồn là `src/config/campaign.ts`: 5 khách đầu đủ điều kiện miễn phí; các đơn đầu đủ điều kiện tiếp theo 43.000đ. Studio xác minh thủ công khách mới và thứ tự suất.

Phạm vi gói Theo mẫu, mỗi khách hợp lệ một đơn đầu là giả định cần chủ dự án xác nhận trước mở bán. Nâng cấp báo riêng. Không suy ra giá nâng cấp bằng cộng trừ, không dùng localStorage/login giả xác minh, không bịa suất còn lại hoặc ngày hết hạn.

## Nội dung cần xác nhận

- Video, poster và URL demo của mẫu.
- Contact chung và Instagram thiết kế riêng.
- SLA bàn giao, thời hạn link, gia hạn/xóa nội dung.
- Thanh toán/cọc/hoàn tiền, tiêu chí khách mới, cách tính nâng cấp.
- Quyền sử dụng ảnh, nhạc, artwork và font thương hiệu.

Giữ null khi chưa có dữ liệu thật. Không bịa đánh giá, doanh số, nhãn bán chạy, deadline hoặc bảo đảm hosting.

## Phase 1

`/gio-hang/` là giỏ lựa chọn cục bộ, không phải hệ thống nhận đơn. Giỏ bắt đầu trống, thêm/xóa các mẫu trong catalog và đổi giữa hai gói niêm yết; mỗi mẫu xuất hiện một lần. Chỉ templateId/packageId được lưu trong localStorage, giá đọc lại từ config; không lưu dữ liệu cá nhân. Không tự áp dụng chiến dịch, phí giao hàng, thuế hoặc phương thức thanh toán chưa xác nhận. Thanh toán disabled với trạng thái chưa khả dụng. Đây không phải xác nhận đặt hàng hay giỏ đồng bộ tài khoản.

Studio chỉnh nội dung. Không có login, editor, upload, payment, database/admin hoạt động. `src/modules/auth/README.md` và `src/modules/editor/README.md` xác định ranh giới mở rộng, không phải tính năng bán kèm.