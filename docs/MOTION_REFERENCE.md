# Tham chiếu Leon Vasari → Gửi Một Chút

## Viền focus trên sách 3D

Viền `:focus-visible` toàn cục từng vẽ trên pivot `.book` phía sau các mặt sách,
tạo khung đỏ mận lệch khỏi gáy. Override chỉ trong `.bookshelf .book` bỏ outline
ở pivot và dùng `--book-focus-ring` trên mặt gáy/bìa khi focus bằng bàn phím.
Không bỏ dấu hiệu focus toàn trang. Cả sáu mặt nằm trong `.book-tilt` để nghiêng
cùng nhau. Browser regression kiểm tra focus-visible, blur và cấu trúc lớp này.

## Cập nhật kệ chủ đề — 2026-11-04

Yêu cầu mới thay kệ template bằng 10 chủ đề: sinh nhật, cưới, Date, private party,
Women's Day, Giáng sinh, Custom, tỏ tình, năm mới và kỉ yếu. Noel/Giáng sinh đã được
gộp theo xác nhận của người dùng. Những mô tả kệ 5 mẫu bên dưới là lịch sử triển khai.

- `src/data/topics.ts` lưu chủ đề và quan hệ `templateIds`; vẫn giữ nguyên 5 record
  sản phẩm hiện có. Sinh nhật, Date và tỏ tình liên kết tới mẫu phù hợp. Hai mẫu
  kỷ niệm/bạn thân chưa gán vào danh mục mới, không bị xóa hoặc tự đổi nội dung.
- Các chủ đề chưa có template có trạng thái đang chuẩn bị; không thêm demo giả.
- Kệ phủ chiều ngang vùng tài liệu, không dùng `100vw` gây tràn do scrollbar.
  ResizeObserver tính số chu kỳ dự phòng theo bề rộng; chỉ recycle ngoài viewport.
- Tên chủ đề nằm ngay dưới sách trung tâm, rồi đến điều khiển và danh sách mẫu.
- Bổ sung bìa sau, cạnh trên/dưới của khối sách; hover dùng lớp con thay vì ghi đè
  transform điều hướng. Bỏ shadow riêng trên mặt bìa/gáy để giảm đường nối giả.
- SVG chủ đề là minh họa danh mục, không phải ảnh chụp các template đã hoàn thiện.
- Lặp vô hạn ở đây là điều hướng liên tục hai chiều, không tự động chạy khi đứng yên.
- Còn cần kiểm tra motion trên thiết bị thật; ảnh tĩnh/test DOM không chứng minh
  không có dropped frame hoặc artefact GPU trên mọi trình duyệt.

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

### Sửa hồi quy hero — 2026-11-04

- Vùng render gồm ba chu kỳ chạy theo vị trí hiện tại, không cố định ở chu kỳ ban đầu. Các sách gần trung tâm giữ key theo vị trí tuyệt đối để không remount khi qua đầu/cuối.
- Tách `.book-tilt` khỏi transform điều hướng trên `.book`; thời gian đáp ứng con trỏ dùng `--duration-tilt` trong theme, không thay đích chuyển mẫu.
- Smoke test kiểm tra bốn vòng liên tiếp mỗi chiều, giữ sách active trong viewport, DOM liên tục và đúng năm mẫu truy cập được. Đây là kiểm tra hành vi, không thay thế đánh giá độ mượt bằng mắt trên thiết bị thật.

Kệ đã lặp vòng bằng CSS transition nhưng chưa có scrub spring liên tục qua từng mẫu trung gian, caption cũ trượt ra đồng thời caption mới trượt vào, hay poster ink-blot. Dialog đang dùng transform theo rect bìa, chưa có clip-path blank-sheet và text stagger như bản gốc. Không tuyên bố sao chép motion chính xác.

## Dịch vụ custom

`src/config/bespoke.ts` là nguồn nội dung và Instagram của section Thiết kế độc bản 100%. `instagramUrl: null` là trạng thái chờ link thật. Chỉ nhận HTTPS instagram.com/www.instagram.com, mở tab mới với noopener noreferrer. Thiết kế riêng từ ý tưởng; không ngầm hứa chuyển nhượng quyền sở hữu trí tuệ hoặc áp dụng giá ưu đãi theo mẫu.