# Tham chiếu Leon Vasari → Gửi Một Chút

Nguồn: prompt chi tiết do chủ dự án cung cấp trong hội thoại; hai URL tham chiếu:
- https://motionsites.ai/?prompt=vasari-vhs-hero
- https://motionsites.ai/?prompt=folio-books-hero

Công cụ đọc web chỉ nhận trang danh mục chung, chưa xem được motion demo. Tài liệu này là bản tóm lược triển khai, không phải bản lưu nguyên văn toàn bộ prompt.

## Cốt lõi prompt gốc được giữ làm tham chiếu

- Nền giấy ấm; các hộp đứng gáy ra trước. Hộp active xoay thật trong không gian 3D, kéo ra phía người xem và nghiêng -4.5 độ.
- Tỷ lệ hình học theo chiều cao H: gáy 142/840 H, bìa 474/900 H; hai mặt vuông góc. Bìa là cạnh phải của khối, không phải hình phẳng thay thế gáy bằng fade.
- Mặt gáy translateZ(d/2), mặt bìa rotateY(90deg) translateZ(ws/2). Hộp active rotateY(-90deg), translateZ(.2H), translateY(-.025H).
- Khoảng cách x: r(ws+gap)+(d-ws+1.6gap)B(r); B(r)=(r+sin(pi*r)/pi)/2 trong đoạn [-1,1], ngoài đoạn là sign(r)/2.
- Prompt gốc có 12 phim lặp ba lần, spring s hướng về T, hover lift, cursor ring, wheel navigation và một loop rAF. Caption đi qua mask 650ms. Dialog mở bằng tờ giấy từ rect bìa; poster lộ qua bảy đốm mực SVG.
- Màu tham chiếu: paper #EDEBE6, sheet #F4F2ED, ink #141414, cobalt #1F3FB0; serif Newsreader và sans Inter Tight. Các asset VHS, nhãn hiệu và thông tin phim không được tái sử dụng trong dự án.

## Cá nhân hóa và khác biệt có chủ đích

- Giữ đúng 5 mẫu Việt Nam; dịch vụ độc bản là một section riêng, không phải mẫu thứ sáu.
- Giữ Lora / Be Vietnam Pro và bảng giấy kem / đỏ rượu / hồng bụi / xanh xám của thương hiệu theo MASTER_PROMPT.
- Artwork SVG gốc: vé hẹn, quà sinh nhật, album hoa, hồ sơ và phong bì. Không tải ảnh Higgsfield trong prompt phim.
- Dùng CSS transition cho khối sách và Web Animations API hữu hạn cho caption/dialog; không có loop chạy khi đứng yên.
- Không cursor tùy biến, không wheel hijack, không khóa cuộn trang ngoài lúc mở dialog. Phím trái/phải chỉ xử lý trong kệ.
- Native dialog khóa tương tác nền, hỗ trợ Escape và trả focus. Video thật hoặc trạng thái chưa có video, không giả game.

## Chăm chút UI — 2026-11-04

- Kệ đứng đầu nội dung, không có headline marketing cỡ lớn phía trước; không ghim kệ theo viewport hoặc chặn cuộn trang.
- Kệ chạy liên tục qua hai đầu: điều hướng quấn vòng giữa mẫu đầu/cuối, hiển thị các chu kỳ lân cận từ cùng 5 record; bản sao hình được ẩn khỏi accessibility tree.
- Mỗi template có hai asset độc lập: `spineSrc` (mặt gáy hẹp) và `coverSrc` (mặt bìa trước). Cả hai có thể để null để dùng artwork minh họa; đây không phải cùng một ảnh bị crop thành hai mặt.
- Giữ nguyên transform, tỷ lệ khối và motion; thêm lớp chất liệu vải, ánh sáng gáy/bìa và bóng nền bằng token trong theme.css.
- Landing rút gọn: kệ → cách đặt → độc bản → FAQ; giá và điều kiện chiến dịch ở trang bảng giá riêng.
- Lora / Be Vietnam Pro được phục vụ local kèm giấy phép OFL, đủ ba weight đang dùng. VI/EN dịch trang chủ và dialog; bảng giá vẫn tiếng Việt với nhãn liên kết rõ ràng.
- Bốn brief gốc vẫn chưa có. Các chỉnh sửa dựa trên tóm lược này và yêu cầu hiện tại, không phải xác nhận đối chiếu toàn bộ prompt gốc.

## Giới hạn motion còn lại

Chưa có kệ vô hạn/scrub spring qua từng mẫu trung gian, caption cũ trượt ra đồng thời caption mới trượt vào, hay poster ink-blot. Dialog đang dùng transform theo rect bìa, chưa có clip-path blank-sheet và text stagger như bản gốc. Không tuyên bố sao chép motion chính xác.

## Dịch vụ custom

`src/config/bespoke.ts` là nguồn nội dung và Instagram của section Thiết kế độc bản 100%. `instagramUrl: null` là trạng thái chờ link thật. Chỉ nhận HTTPS instagram.com/www.instagram.com, mở tab mới với noopener noreferrer. Thiết kế riêng từ ý tưởng; không ngầm hứa chuyển nhượng quyền sở hữu trí tuệ hoặc áp dụng giá ưu đãi theo mẫu.