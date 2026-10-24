# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Người mua (Buyers):** Người tiêu dùng tại Việt Nam tìm kiếm thiết bị công nghệ, điện tử, linh kiện chính hãng với mức giá ưu đãi; tham gia các phiên đấu giá trực tiếp để săn deal giá hời; theo dõi lộ trình đơn hàng minh bạch từ giỏ hàng tới thanh toán.
- **Người bán (Sellers):** Doanh nghiệp và cá nhân kinh doanh các mặt hàng công nghệ, đăng ký mở shop qua quy trình xác minh 3 bước nghiêm ngặt (CCCD 12 số, tài khoản ngân hàng, kho hàng), quản lý sản phẩm, đơn hàng và tham gia tổ chức các phiên đấu giá.
- **Quản trị viên (Admin):** Quản lý hệ thống danh mục, kiểm soát tính hợp lệ của người bán và giám sát các giao dịch marketplace.

## Product Purpose

ProjectNexus là nền tảng thương mại điện tử thế hệ mới kết hợp mô hình bán lẻ truyền thống và sàn đấu giá trực tiếp (E-commerce + Live Auction). Nền tảng giúp kết nối người bán uy tín với người mua công nghệ, mang lại trải nghiệm mua sắm hấp dẫn qua Flash Sale, bước giá đấu thầu thời gian thực và luồng thanh toán liền mạch.

## Positioning

Khác với các sàn thương mại điện tử thông thường chỉ bán giá cố định hoặc các trang đấu giá thuần túy thiếu tiện ích mua lẻ, ProjectNexus tích hợp liền khối cả hai hình thức:
- Mua ngay với giỏ hàng thông minh, quản lý tồn kho real-time, áp dụng mã miễn phí vận chuyển.
- Sàn đấu giá trực tiếp với cơ chế bước giá (Bid Increment), bộ đếm ngược thời gian và bảng theo dõi người thắng cuộc minh bạch.

## Operating Context

- **Môi trường hoạt động:** Ứng dụng web responsive đa nền tảng (Desktop, Tablet, Mobile) hỗ trợ người dùng mua sắm mọi lúc mọi nơi.
- **Hạ tầng kết nối:** Hoạt động dựa trên kiến trúc Microservices (UserService :5001, CatalogService :5002, CommerceService :5003, AuctionService :5004, NotificationService :5005) qua API Gateway (:5000) cùng cơ chế LocalStorage Fallback giúp ứng dụng vận hành liên tục ngay cả khi mạng hoặc gateway offline.
- **Quy trình chuẩn hóa:** Tuân thủ hệ thống địa chỉ hành chính Việt Nam (Tỉnh/Thành, Quận/Huyện, Phường/Xã) và chuẩn định dạng số điện thoại viễn thông 10 chữ số.

## Capabilities and Constraints

- **Khách vãng lai (Guest):** Hỗ trợ tìm kiếm, lọc theo khoảng giá, xem chi tiết sản phẩm, lưu giỏ hàng trong LocalStorage và tự động đồng bộ (merge) vào tài khoản ngay sau khi đăng nhập.
- **Giỏ hàng & Thanh toán:** Tích chọn sản phẩm thanh toán theo checkbox, kiểm tra giới hạn tồn kho khả dụng (`stockQuantity`), tính toán tổng tiền động và hỗ trợ sổ địa chỉ giao hàng 1-click.
- **Bảo mật & Định danh:** Đổi mật khẩu kèm thanh đo độ mạnh (Password Strength Meter), xác thực quyền người bán qua mã định danh CCCD và tài khoản ngân hàng liên kết.
- **Ràng buộc công nghệ:** React 19, TypeScript, Tailwind CSS, Vite, TanStack Query, Axios.

## Brand Commitments

- **Tên thương hiệu:** Nexus / ProjectNexus
- **Tông giọng & Phong cách:** Hiện đại, tin cậy, sắc sảo và đậm chất công nghệ cao (High-tech Modern UI).
- **Gam màu nhận diện:** Gam màu xanh công nghệ chủ đạo (Nexus Blue Palette), kết hợp cùng các điểm nhấn màu cam Flash Sale và xanh ngọc Freeship.

## Evidence on Hand

- Toàn bộ mã nguồn giao diện hoàn chỉnh tại `frontend/src/`.
- Dữ liệu mẫu thực tế và phong phú tại `frontend/src/shared/mock/mockData.ts`.
- Danh mục sản phẩm công nghệ (PlayStation 5, Keychron Q1 Pro, Sony WH-1000XM5, iPad Pro M4, MacBook Pro, Logitech MX Master).
- Hệ thống phiên đấu giá hoạt động (Leica M11, RTX 4090 OC, Rolex Submariner).

## Product Principles

1. **Trải nghiệm mua sắm không gián đoạn:** Giỏ hàng và luồng chuẩn bị thanh toán phải luôn thông suốt từ trang chủ, chi tiết sản phẩm tới đơn hàng cuối cùng; không bao giờ để người dùng gặp màn hình trắng hay lỗi mạng khi service ngoại vi bảo trì.
2. **Minh bạch & Đáng tin cậy:** Mọi thông tin tồn kho, chi phí vận chuyển, cam kết hàng chính hãng 100% và lịch sử bước giá đấu thầu phải rõ ràng, nhất quán và có thể kiểm chứng.
3. **Thao tác nhanh gọn, giảm thiểu ma sát:** Tối ưu số lần nhấp chuột bằng việc tự động điền địa chỉ mặc định, lưu giỏ hàng khách vãng lai và cho phép "Mua ngay" thẳng vào bước thanh toán.
4. **Chuẩn mực công nghệ cao:** Giao diện trực quan, responsive mượt mà trên mọi kích thước màn hình, tốc độ phản hồi tính toán thành tiền tức thì.

## Accessibility & Inclusion

- Tương thích tốt với các kích thước màn hình từ 360px (mobile) tới 4K (desktop).
- Sử dụng độ tương phản màu sắc đạt chuẩn WCAG AA cho chữ và nền.
- Hỗ trợ đầy đủ tooltip và nhãn hỗ trợ người dùng khi chạm mốc giới hạn tồn kho hoặc nhập sai định dạng số điện thoại.
