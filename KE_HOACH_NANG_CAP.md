# Kế hoạch cải thiện website công ty (NovaTech) theo tầm nhìn KIEN_TRUC_TRANG_WEBSITE.md

## Context (Bối cảnh & lý do)

**Hiện trạng:** Dự án là một **trang brochure tĩnh, single-page** viết bằng Vanilla JS + Vite (không framework):
- Router hash-based (`src/utils/router.js`), render component bằng template string (`src/main.js`, `src/components/*.js`).
- Dữ liệu lấy từ file JSON tĩnh qua lớp `src/services/api.js` — vốn đã được thiết kế sẵn để sau này thay bằng `fetch('/api/...')`.
- Form liên hệ chỉ `console.log` (`src/components/Contact.js`), không gửi thật.
- Thư mục `server/` **rỗng** — chưa có backend, auth, giỏ hàng, đơn hàng, thanh toán, CMS, CRM, dashboard, AI, đa ngôn ngữ, SEO infra (sitemap/robots/meta theo trang), analytics, hay trang pháp lý.

**Tầm nhìn (file .md):** Một "trụ sở số" đầy đủ — giới thiệu công ty, e-commerce + thanh toán (VNPay/MoMo/ZaloPay), CMS, CRM, dashboard quản trị, chatbot AI, SEO, bảo mật & tuân thủ pháp lý (NĐ 13/2023, 52/2024), trang chính sách — trải dài 3 giai đoạn.

**Quyết định đã chốt với người dùng:**
1. **Migrate sang Next.js** (đúng "phương án chuyên nghiệp" của doc).
2. **Hướng tới Giai đoạn 3** (đầy đủ: e-commerce → CMS/CRM/dashboard/AI).
3. **Chưa có backend** → kế hoạch này tự đề xuất stack.

**Kết quả mong muốn:** Một lộ trình phân kỳ, có thể thực thi từng bước, lấy migrate Next.js làm nền móng và kết thúc ở năng lực Giai đoạn 3, vẫn tái sử dụng tối đa nội dung/dữ liệu/thiết kế hiện có.

---

## Stack công nghệ đề xuất

| Lớp | Lựa chọn | Lý do |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React + TypeScript** | SSR/SSG cho SEO, routing chuẩn, API routes/Server Actions = backend luôn trong 1 repo |
| Styling | **Tailwind CSS + shadcn/ui** | Tốc độ phát triển; map từ design tokens hiện có ở `src/styles/variables.css`. (Có thể giữ CSS thuần nếu muốn ít rủi ro hơn) |
| Database | **PostgreSQL + Prisma ORM** | Quan hệ rõ ràng cho sản phẩm/đơn hàng/khách hàng; `pgvector` dùng cho AI search |
| Backend | **Next.js Route Handlers + Server Actions** | Không cần server tách riêng giai đoạn đầu; mở rộng được sau |
| CMS + Admin | **Payload CMS** (Next-native, self-host) | Cho CMS + admin UI + auth + REST/GraphQL trong cùng app — phục vụ "quản trị nội dung/sản phẩm/đơn hàng" của doc |
| Auth | **Auth.js (NextAuth)** + 2FA cho admin | Tài khoản khách hàng + phân quyền admin/sales/kế toán (mục 3B của doc) |
| Thanh toán | **VNPay, MoMo, ZaloPay** (server SDK) + Stripe (quốc tế) | Đúng thị trường VN; xử lý webhook cập nhật trạng thái đơn |
| Tìm kiếm | **Meilisearch** (self-host) | Tìm kiếm nhanh + bộ lọc; nền cho "tìm kiếm ngữ nghĩa" |
| AI Chatbot | **Claude API (`claude-opus-4-8` / `claude-haiku-4-5`)** + RAG trên pgvector | Tư vấn sản phẩm & trợ lý hỏi-đáp nội bộ theo tài liệu công ty (mục 6) |
| Email | **Resend** (hoặc Nodemailer + SMTP) | Email xác nhận đơn/lead/marketing |
| Storage | **S3-compatible (Cloudflare R2 / AWS S3)** | Ảnh, video, catalogue PDF, file upload form |
| Analytics | **GA4 + Google Tag Manager + Meta Pixel** | Mục 8 SEO/tracking; thêm Vercel Analytics |
| i18n | **next-intl** (vi/en) | Đa ngôn ngữ (mục 4A) |
| Hosting | **Vercel** (app) + **Neon/Supabase** (Postgres) hoặc VPS | Bắt đầu nhanh; chuyển VPS khi cần |

> Lưu ý khi build AI: dùng model Claude mới nhất; ưu tiên `claude-haiku-4-5` cho chatbot realtime (rẻ/nhanh), `claude-opus-4-8` cho tác vụ phức tạp.

---

## Lộ trình phân kỳ

### Giai đoạn 0 — Nền móng & Migrate (tái tạo trang hiện tại trên Next.js)
Mục tiêu: dựng lại đúng giao diện/nội dung hiện có trên Next.js, không thêm tính năng mới.
- Khởi tạo Next.js + TypeScript + Tailwind; cấu hình ESLint/Prettier.
- **Chuyển design tokens** từ `src/styles/variables.css` → Tailwind theme/CSS variables; port các style component (`src/styles/components/*`).
- Chuyển từng component template-string → React component:
  - `Navbar, Hero, About, Services, Products, Team, Stats, Clients, News, Contact, Footer, SearchOverlay` → `app/components/*`.
  - Trang chi tiết (`ServiceDetail/ProductDetail/NewsDetail`) → **route động** `app/services/[id]`, `app/products/[id]`, `app/news/[id]` (thay router hash thủ công).
- **Tái dùng dữ liệu:** import nguyên các file `src/data/*.json` làm nguồn ban đầu (sau này seed vào DB).
- Thay lớp `src/services/api.js` bằng data-access layer mới (đọc JSON ở G0, đọc Prisma/Payload ở G1+).
- Thay icon: dùng `lucide-react` (thay CDN `lucide`), font qua `next/font`.

**Verify:** `npm run dev` hiển thị trang giống bản cũ; điều hướng tới các trang chi tiết hoạt động; `npm run build` pass.

### Giai đoạn 1 — Hoàn thiện website nền tảng (Phase 1 của doc)
- **CMS (Payload):** đưa Company, Services, Products, News, Clients, Team, Stats thành collection; admin tự sửa nội dung. Seed từ `src/data/*.json`.
- **Form lead thật:** Contact + form Báo giá + Đăng ký đối tác + Tuyển dụng (mục 7) → Server Action lưu DB + gửi email (Resend), có reCAPTCHA chống spam (mục 4B), checkbox đồng ý chính sách.
- **Trang pháp lý/chính sách** (mục 5): Điều khoản, Bảo mật, Thanh toán, Vận chuyển, Đổi trả, Bảo hành, Khiếu nại + cơ chế consent NĐ 13/2023.
- **SEO kỹ thuật** (mục 8): metadata theo trang (`generateMetadata`), `sitemap.xml`, `robots.txt`, schema.org (JSON-LD), Open Graph, ảnh WebP qua `next/image`, URL thân thiện.
- **Đa ngôn ngữ** (next-intl vi/en), **accessibility** (WCAG 2.2), tối ưu Core Web Vitals.
- **Analytics:** GA4 + GTM + Meta Pixel.

**Verify:** Lighthouse SEO/Perf/A11y ≥ 90; form gửi → bản ghi trong DB + email về; admin sửa nội dung → hiển thị ngoài site; sitemap/robots truy cập được; chuyển vi/en hoạt động.

### Giai đoạn 2 — Bán hàng & Thanh toán (Phase 2 của doc)
- Mô hình dữ liệu Prisma: `Product, Category, Cart, Order, OrderItem, Customer, Payment, Address`.
- **Giỏ hàng + đặt hàng** (mục D), đặt hàng nhanh không cần đăng ký; **tài khoản khách hàng** (Auth.js) + lịch sử & **theo dõi đơn**.
- **Tìm kiếm + bộ lọc** sản phẩm (Meilisearch).
- **Thanh toán:** tích hợp VNPay/MoMo/ZaloPay (QR + redirect), webhook cập nhật trạng thái (chờ/đã thanh toán/lỗi/hoàn), xuất hóa đơn VAT, đối soát.
- **Email/SMS/Zalo xác nhận**; tuân thủ TMĐT (đăng ký Bộ Công Thương nếu thuộc diện), PCI: không lưu dữ liệu thẻ.

**Verify:** Test luồng chọn sản phẩm → giỏ → đặt → thanh toán sandbox cho cả 3 trạng thái thành công/thất bại/hủy; email xác nhận gửi cho khách + admin; webhook cập nhật đúng trạng thái.

### Giai đoạn 3 — CRM, Dashboard & AI (Phase 3 của doc)
- **CRM:** quản lý lead/khách, phân nhóm (mới/tiềm năng/VIP), lịch sử liên hệ & mua hàng; tự động phân loại.
- **Dashboard quản trị** (mục 9): truy cập, nguồn, tỉ lệ chuyển đổi, đơn/doanh thu, sản phẩm bán chạy, tồn kho, cảnh báo; phân quyền đa cấp + nhật ký hệ thống.
- **Chatbot AI tư vấn + trợ lý nội bộ:** RAG trên kho tri thức (catalogue/chính sách) bằng Claude API + embeddings/pgvector; **tìm kiếm ngữ nghĩa**.
- **Gợi ý sản phẩm** theo hành vi; **email marketing** tự động (nhắc thanh toán, chăm sóc sau mua).

**Verify:** Chatbot trả lời đúng theo tài liệu đã nạp; dashboard hiển thị số liệu thật từ DB; phân quyền chặn đúng vai trò; log ghi nhận thao tác.

---

## File/tài sản hiện có cần tái sử dụng
- **Nội dung & dữ liệu:** toàn bộ `src/data/*.json` (`company, services, products, team, stats, clients, news`) → seed CMS/DB.
- **Design system:** `src/styles/variables.css` (tokens màu/spacing/typography) → Tailwind theme; `src/styles/components/*.css` tham chiếu khi dựng lại UI.
- **Logic đã có:** thuật toán search trong `src/services/api.js` (`searchData`) làm chuẩn cho tìm kiếm; cấu trúc route trong `src/utils/router.js` ánh xạ sang App Router.
- **Animations:** `src/utils/animations.js` (scroll reveal) → thay bằng Framer Motion hoặc CSS tương đương.
- Assets `public/animations/*.json` (Lottie) giữ nguyên.

## Rủi ro & lưu ý
- Đây là **viết lại nền tảng**, không phải sửa nhỏ — nên làm trên nhánh riêng, hoàn tất G0 (đạt parity) trước khi thêm tính năng.
- Tuân thủ pháp lý (NĐ 13/2023 bảo vệ dữ liệu, 52/2024 thanh toán, đăng ký TMĐT) cần xử lý trước khi go-live G2.
- Bảo mật theo OWASP Top 10; HTTPS, 2FA admin, validate upload, rate-limit form.

## Đề xuất bước đi tiếp theo
Bắt đầu **Giai đoạn 0** (scaffold Next.js + port design tokens + tái tạo trang chủ và 1 trang chi tiết để xác lập pattern), rồi review trước khi port phần còn lại.
