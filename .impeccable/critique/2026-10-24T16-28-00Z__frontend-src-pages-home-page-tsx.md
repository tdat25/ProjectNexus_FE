---
target: frontend/src/pages/home/page.tsx
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\FPTU\\k6\\ProjectNexus\\ProjectNexus_FE\\frontend\\src\\pages\\home\\page.tsx"
target_fingerprint: "sha256:62ff3a9f846b7722fcca1ad91962b42bcca09fb8ed5b19dc1832ba4fe3b3569c"
target_path: "D:\\FPTU\\k6\\ProjectNexus\\ProjectNexus_FE\\frontend\\src\\pages\\home\\page.tsx"
timestamp: 2026-10-24T16-28-00Z
slug: frontend-src-pages-home-page-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Real-time countdown timer & cart badge work well; needs skeleton grid instead of spinner on category switch |
| 2 | Match System / Real World | 3 | Familiar VN e-commerce metaphors (VND, Flash Sale, TP.HCM, Đã bán); icons are natural |
| 3 | User Control and Freedom | 3 | Clear filter resets and pagination; mobile filter backdrop could be clearer |
| 4 | Consistency and Standards | 3 | Cohesive Nexus Blue system; slight padding variance on call-to-actions |
| 5 | Error Prevention | 3 | Bounded price ranges and debounced search; prevents empty queries |
| 6 | Recognition Rather Than Recall | 3 | Category pills with emoji, floating cart button with live count |
| 7 | Flexibility and Efficiency | 3 | Floating cart button accelerates checkout; lacks `Ctrl+K` / `/` search shortcut |
| 8 | Aesthetic and Minimalist Design | 3 | Clean product cards; detector flagged gradient text and bouncing icon on Flash Sale |
| 9 | Error Recovery | 3 | Smart empty search state with 1-click popular keywords |
| 10 | Help and Documentation | 2 | Trust badges present; lacks inline bidding explainer on auction preview cards |
| **Total** | | **29/40** | **Good** |

#### Design Specificity Verdict

**LLM assessment**: Giao diện Trang chủ ProjectNexus được định hình rõ nét cho sàn thương mại điện tử công nghệ và đấu giá tại Việt Nam, kết hợp mượt mà giữa các khối Flash Sale có đồng hồ đếm ngược, danh mục emoji thân thiện, phiên đấu giá trực tiếp và thanh công cụ tìm kiếm trung tâm. Điểm cần khắc phục nằm ở một số chi tiết trang trí thừa (gradient text, bounce animation) làm giảm độ tinh tế của thương hiệu công nghệ cao.

**Deterministic scan**: Máy quét tự động phát hiện 2 vấn đề mã nguồn tại `frontend/src/pages/home/page.tsx`:
- Line 297: `gradient-text` (Warning) — `bg-clip-text + bg-gradient` trên tiêu đề FLASH SALE.
- Line 296: `bounce-easing` (Advisory) — `animate-bounce` trên icon ngọn lửa `Flame`.

**Visual overlays**: Đã kiểm tra trực tiếp trên trình duyệt `http://localhost:5173/`. Các thành phần nút giỏ hàng, thẻ sản phẩm, bộ lọc giá và đếm ngược hiển thị ổn định, responsive chính xác.

#### Overall Impression
Trang chủ sở hữu cấu trúc thông tin thương mại điện tử vững chắc, nhịp điệu thị giác rõ ràng và tốc độ tải nhanh. Cơ hội lớn nhất là loại bỏ các chi tiết "AI slop" trang trí thừa, bổ sung phím tắt `Ctrl+K` và chuyển đổi hiệu ứng tải sang dạng Skeleton Card để đạt đẳng cấp giao diện hàng đầu.

#### What's Working
1. **Khối Flash Sale & Đồng hồ đếm ngược:** Tạo cảm giác gấp gáp tự nhiên cho người mua, hiển thị số giờ, phút, giây rõ nét theo phong cách đồng hồ số tối giản.
2. **Nút xem giỏ hàng đa điểm chạm:** Cả trên Navbar ghim đầu trang lẫn nút nổi Floating Button góc dưới bên phải giúp người dùng truy cập giỏ hàng tức thì từ bất kỳ vị trí nào.
3. **Empty State thông minh:** Khi tìm kiếm không có kết quả, hệ thống không để ngõ cụt mà gợi ý ngay các từ khóa thịnh hành (Laptop, Tai nghe, Bàn phím) để tiếp tục mua sắm.

#### Priority Issues
- **[P1] Gradient Text & Bounce Animation trên tiêu đề Flash Sale**:
  - *Why it matters*: Gradient chữ cam-đỏ kết hợp `animate-bounce` liên tục tạo cảm giác lòe loẹt, thiếu tính chuyên nghiệp của sàn công nghệ cao.
  - *Fix*: Thay bằng màu đỏ thuần `#DC2626` (Red-600) với font chữ đậm, thay animation bounce bằng hiệu ứng nhịp đập nhẹ hoặc giữ tĩnh tinh tế.
  - *Suggested command*: `/impeccable quieter`
- **[P2] Thiếu phím tắt nhanh cho ô Tìm kiếm (Search Accelerator)**:
  - *Why it matters*: Khách hàng quen thao tác nhanh (Power users) thường muốn gõ `/` hoặc `Ctrl+K` để bắt đầu tìm kiếm mà không cần với chuột lên đầu trang.
  - *Fix*: Thêm phím tắt `Ctrl+K` / `/` focus ngay vào input tìm kiếm và hiển thị huy hiệu `⌘K` mờ trong ô search.
  - *Suggested command*: `/impeccable delight`
- **[P2] Thay thế Loading Spinner toàn trang bằng Skeleton Grid**:
  - *Why it matters*: Khi chuyển danh mục hoặc phân trang, spinner tròn làm gián đoạn nhịp đọc và gây giật khung hình (layout shift).
  - *Fix*: Hiển thị khung xương (Skeleton Card shimmer) 8-10 sản phẩm mô phỏng đúng kích thước thẻ thật trong lúc tải dữ liệu.
  - *Suggested command*: `/impeccable polish`
- **[P3] Chỉ báo thời gian còn lại trên thẻ Đấu giá nổi bật**:
  - *Why it matters*: Thẻ đấu giá trên trang chủ hiện hiển thị giá hiện tại và số lượt bid nhưng chưa làm nổi bật độ khẩn cấp khi phiên đấu giá sắp kết thúc (<1 giờ).
  - *Fix*: Đổi màu huy hiệu thời gian sang đỏ cam nhấp nháy nhẹ khi phiên đấu giá bước vào những phút cuối cùng.
  - *Suggested command*: `/impeccable clarify`

#### Persona Red Flags
- **Alex (Power User)**: Tìm kiếm sản phẩm phải dùng chuột click vào ô input; không có phím tắt `/` hoặc `Ctrl+K`. Muốn xem nhanh thông số kỹ thuật phải click vào từng trang con.
- **Jordan (First-Timer)**: Khối "Đấu giá hot" có bước giá và người dẫn đầu nhưng chưa có chú thích ngắn giải thích cơ chế đấu thầu cho người mới tham gia lần đầu.
- **Casey (Distracted Mobile User)**: Thanh điều khiển sắp xếp và khoảng giá chiếm nhiều diện tích cuộn dọc trên màn hình nhỏ điện thoại; cần gom gọn vào Drawer hoặc Filter Sheet.

#### Minor Observations
- Các thẻ tag danh mục (`cat-pills`) có thể thêm hiệu ứng hover mượt mà hơn khi rê chuột.
- Ảnh banner chính có thể bổ sung nút chuyển slide tự động mượt mà.

#### Questions to Consider
- Có nên đưa ô tìm kiếm thành tâm điểm tương tác với thanh gợi ý thông minh khi vừa nhấp chuột vào?
- Liệu khối đấu giá trực tiếp có nên có âm thanh hoặc hiệu ứng visual nhẹ khi có người đặt giá mới?
