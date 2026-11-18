# Trao — triển khai và kiểm tra

## Stack và cấu trúc

Next.js App Router, React, TypeScript, CSS thuần và CSS 3D. Dependency/version lấy từ `package.json` và lockfile. Static export tại `next.config.ts`, output `out/`.

| Đường dẫn | Trách nhiệm |
| --- | --- |
| `src/app/` | Trang chủ, giá, cách đặt, thiết kế riêng, hỏi đáp và layout tiếng Việt. |
| `src/components/bookshelf/` | Book, Bookshelf, AlbumDialog, TemplateDialog, hình học kệ. |
| `src/components/static/` | Header, footer, thành phần nội dung hỗ trợ. |
| `src/styles/theme.css` | Token dùng chung; global/site/component CSS tiêu thụ token. |
| `src/data/` | 5 template và 11 chủ đề. |
| `src/config/` | Site, pricing, campaign, bespoke và trường nullable. |
| `public/fonts/` | Font local và giấy phép được cung cấp. |
| `src/modules/auth/`, `src/modules/editor/` | Tài liệu hợp đồng mở rộng. |
| `src/modules/search/` | Search độc lập: native dialog, CSS scoped, catalog local từ 11 topic (không còn nhóm điều hướng), nút “Thiết kế riêng” cố định ở đầu chuyển thẳng tới `/thiet-ke-rieng/` bằng client navigation, normalize tiếng Việt và phân nhóm folder. Không cần backend. |

## Lệnh Windows

Node theo engines trong `package.json`. Chạy từ gốc ứng dụng:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run check
```

Build tạo `out/`. Helper `node album-test-server.mjs` phục vụ static output tại 127.0.0.1:3016. `next start` không phục vụ static export. Production dùng output và cấu hình static host phù hợp; không đặt secrets frontend.

## Kệ và dialog

Bookshelf dùng các chu kỳ bản sao có key ổn định, offset vòng lặp và lớp tilt riêng. Chủ đề đang chọn lưu bằng ID trong `sessionStorage` theo phiên tab, được khôi phục khi mount lại; storage lỗi/không khả dụng không chặn kệ. ResizeObserver/geometry helper tính chiều cao theo viewport. Motion đọc token; reduced motion giảm thời lượng và nội suy.

Click capture kiểm tra rect chiếu của bìa active để nhận chuột/chạm trên toàn bìa 3D. Drag suppression phân biệt kéo/click; keyboard không kế thừa click suppression. Wheel/drag chỉ xử lý trong kệ, không chiếm cuộn dọc hoặc Ctrl-wheel.

Native dialog quản lý modal/focus; sheet và ink artwork có animation hữu hạn. Video thiếu có empty state; đóng dialog dừng/unmount media. Artwork minh họa không chứng minh demo sẵn sàng.

Album đóng bằng clip trong tọa độ viewport, không xoay thêm bounding rect đã gồm phối cảnh của bìa. Sheet giảm opacity để lộ bìa 3D thật, giữ frame cuối trong suốt qua một lần paint rồi mới teardown modal/focus; cleanup ẩn sheet trước khi hủy fill effects để tránh flash toàn màn hình. Đóng giữa animation mở giữ transform origin và pose hiện tại. Regression tại `perf-artifacts/album-close-diagnosis.mjs` kiểm tra 360/390/768/1440px, nút Đóng/Escape/đóng sớm/reduced motion, frame cuối trong suốt, focus và scroll; cấu hình bằng `BROWSER_PORT` và `TEST_URL`, kết quả ghi `perf-artifacts/album-close-fixed.json`.

## Ngôn ngữ

`src/i18n/`: `detect.ts` tra quốc gia theo IP phía trình duyệt qua `https://api.country.is/` (IP khách được gửi cho bên thứ ba này), một lần mỗi tab (`sessionStorage` `trao:locale`). `VN` → tiếng Việt, quốc gia khác → tiếng Anh; nếu tra cứu lỗi thì đoán theo múi giờ (`Asia/Ho_Chi_Minh` → tiếng Việt). Static export render tiếng Việt; boot script trong `<head>` ẩn trang (tối đa ~3,5 giây) khi khả năng cao là tiếng Anh để tránh nháy chữ Việt. `LocaleProvider` cấp `useLocale()`/`useMessages()`; chuỗi UI ở `messages.ts`, dữ liệu nghiệp vụ dịch tại `src/data/` và `src/config/`. Title tab tiếng Anh được gán phía client; metadata tĩnh và route slug giữ tiếng Việt.

## Kiểm tra

Đọc script trước chạy. Helper browser dùng Node WebSocket và Chromium CDP, cần static server và browser remote debugging port tương ứng:

```powershell
$env:TEST_PORT='3016'
$env:BROWSER_PORT='9223'
node ui-browser-test.mjs
node album-pointer-test.mjs
node shelf-geometry-test.mjs
node shelf-pose-browser-test.mjs
node navigation-browser-test.mjs
```

Script geometry kiểm tra hình học. Không dùng screenshot cũ làm bằng chứng cho code đang kiểm tra.

Script shelf-pose kiểm tra bên trái yaw 9deg/bên phải 0deg, đổi góc CSS trực tiếp, hình chiếu đối xứng tại offset 1/2/3 khi tắt góc riêng, cập nhật trực tiếp khi sửa token, wrap hai chiều, chỉ một bìa có bóng, khoảng thoát bóng và overflow tại 360/390/768/1440px, cả normal/reduced motion; ghi ảnh mới `shelf-after-*.png` để review.

Script navigation kiểm tra underline dùng chung và nội suy liên tục, route/history/reload, resize 360/390/768/1440px, search fullscreen/focus/Enter/Escape/Đóng, focus không thoát ra nền, reduced motion, button radius và asset lỗi. Search local chỉ tìm chủ đề, không tìm route hay nội dung demo/video; nút “Thiết kế riêng” ở đầu dialog dùng `next/link`, không tải lại trang. `RouteTransition` chạy entrance chung khi đổi route, và chạy lại khi bấm bất kỳ link nội bộ trỏ tới đúng route đang mở (tab header, shortcut search, link sau này; trừ link có hash). `Album` Enter về `/#xem-mau`; `Thiệp cưới` hoặc `thiep cuoi` Enter mở `/#album/wedding` qua hashchange trong Bookshelf, hỗ trợ tải trực tiếp/reload. Đóng album deeplink thay hash về kệ; nhiều kết quả yêu cầu chọn, không khớp có empty state. Click khoảng trống trong module không đóng modal.

### Checklist bàn giao

Search dùng `details/summary`: gợi ý thu gọn khi chưa gõ; khi có từ khóa, các nhóm kết quả tự mở. Từ khóa mỗi chủ đề ở `src/modules/search/tags.ts` (Việt/Anh); so khớp bỏ dấu, tiền tố cho từ đang gõ và chịu lỗi gõ nhẹ cho từ từ 5 ký tự. Test navigation bao gồm mở/đóng Album bằng bàn phím, mặc định thu gọn khi mở lại, clear SVG đồng bộ nút đóng và focus sau khi xóa. Ảnh `ui-search-collapsed-360.png` / `ui-search-collapsed-1440.png` ghi trạng thái thu gọn; ảnh `ui-navigation-search-*.png` ghi trạng thái mở nhóm.

- Build, TypeScript, whitespace diff.
- 360/390/768/1440px: không cắt chữ/tràn trang, target ít nhất 44px.
- Hai mũi tên, hover fine pointer, touch, keyboard focus, không sticky hover.
- Click gáy/bìa, drag-vs-click, wrap hai chiều, đúng số chủ đề accessible.
- Dialog mở/đóng, Escape, focus vào/giữ/khôi phục, scroll và reduced motion.
- Asset thiếu có fallback đúng tỷ lệ; chủ đề/media/URL/contact thiếu có trạng thái đúng.
- Tải trực tiếp `/bang-gia/`, giữ templateId và kiểm tra route hỗ trợ.
- Màu theo `docs/DESIGN_SYSTEM.md`, giá/campaign theo config, không claim/control giả.
- Báo kiểm tra đã chạy, ảnh đã review, lỗi nền và giới hạn thiết bị thật.

Giữ thay đổi trong ứng dụng, bảo toàn phần chưa commit của người dùng. Backend/auth/editor/payment cần phạm vi riêng.