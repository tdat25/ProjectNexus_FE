// ─────────────────────────────────────────────────────────────────────────────
// Trang Chính Sách Nexus — Mua hàng, Đổi trả, Hoàn tiền, Khiếu nại
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  ShieldCheck, RefreshCw, CreditCard, MessageSquare, Star,
  ChevronDown, ChevronRight, Clock, Package, AlertCircle,
  CheckCircle, XCircle, Phone, Mail, Truck, Gavel, Info,
  ArrowRight, FileText, HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";

// ── Accordion item ────────────────────────────────────────────────────────────
function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl transition-colors ${open ? "border-nexus-200 bg-indigo-50/30" : "border-gray-100 bg-white"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className={`text-sm font-semibold ${open ? "text-nexus-700" : "text-gray-700"}`}>{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180 text-nexus-500" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-nexus-50 border border-nexus-100 flex items-center justify-center text-nexus-600 shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Step list ────────────────────────────────────────────────────────────────
function Steps({ steps }: { steps: { icon: React.ReactNode; title: string; desc: string }[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-nexus-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0">{i + 1}</div>
            {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-nexus-100 mt-1 mb-0" />}
          </div>
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-nexus-500">{s.icon}</span>
              <span className="font-semibold text-gray-800 text-sm">{s.title}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Policy tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "purchase",   label: "Chính sách mua hàng", icon: <ShieldCheck size={16}/> },
  { key: "return",     label: "Đổi trả hàng",        icon: <RefreshCw size={16}/> },
  { key: "refund",     label: "Hoàn tiền",            icon: <CreditCard size={16}/> },
  { key: "complaint",  label: "Khiếu nại",            icon: <MessageSquare size={16}/> },
  { key: "review",     label: "Đánh giá & Sao",       icon: <Star size={16}/> },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function PolicyPage() {
  const [tab, setTab] = useState("purchase");

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-nexus-700 via-nexus-600 to-violet-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={28} className="text-indigo-200"/>
            <h1 className="text-3xl font-extrabold">Chính Sách Nexus</h1>
          </div>
          <p className="text-white/75 max-w-xl text-sm">Tất cả các quy định về mua hàng, đổi trả, hoàn tiền và khiếu nại — minh bạch, rõ ràng và bảo vệ quyền lợi người dùng.</p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/80">
            {[
              { icon:<Clock size={14}/>, label:"Cập nhật: 01/10/2024" },
              { icon:<CheckCircle size={14}/>, label:"Áp dụng toàn quốc" },
              { icon:<ShieldCheck size={14}/>, label:"Đảm bảo quyền lợi người mua" },
            ].map(s=>(
              <span key={s.label} className="flex items-center gap-1.5"><span className="text-amber-300">{s.icon}</span>{s.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[240px_1fr] gap-6">

          {/* ── Sidebar nav ──────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mục lục</p>
              </div>
              <nav className="p-2 flex flex-col gap-0.5">
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                      tab === t.key ? "bg-nexus-50 text-nexus-700 border border-nexus-100" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    <span className={tab === t.key ? "text-nexus-500" : "text-gray-400"}>{t.icon}</span>
                    {t.label}
                    {tab === t.key && <ChevronRight size={13} className="ml-auto text-nexus-400"/>}
                  </button>
                ))}
              </nav>

              {/* Quick contact */}
              <div className="border-t border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500 mb-3">Cần hỗ trợ?</p>
                <a href="tel:0946000838" className="flex items-center gap-2 text-sm text-nexus-600 hover:text-nexus-700 font-semibold mb-2">
                  <Phone size={14}/> 0946 000 838
                </a>
                <a href="mailto:support@nexus.vn" className="flex items-center gap-2 text-sm text-gray-500 hover:text-nexus-600">
                  <Mail size={14}/> support@nexus.vn
                </a>
              </div>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <main className="flex flex-col gap-6">

            {/* ═══ MUA HÀNG ═══ */}
            {tab === "purchase" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <SectionHeader icon={<ShieldCheck size={22}/>} title="Chính Sách Mua Hàng" sub="Quy định chung khi mua sắm trên Nexus"/>

                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon:<ShieldCheck size={20} className="text-emerald-500"/>, title:"Hàng chính hãng 100%", desc:"Cam kết sản phẩm chính hãng, có nguồn gốc rõ ràng. Hoàn tiền 200% nếu phát hiện hàng giả.", color:"bg-emerald-50 border-emerald-100" },
                    { icon:<Truck size={20} className="text-blue-500"/>, title:"Giao nhanh toàn quốc", desc:"Giao hàng 3–7 ngày làm việc. Hỏa tốc trong ngày cho nội thành TP.HCM & HN.", color:"bg-blue-50 border-blue-100" },
                    { icon:<RefreshCw size={20} className="text-amber-500"/>, title:"Đổi trả 15 ngày", desc:"Đổi trả miễn phí trong vòng 15 ngày nếu sản phẩm lỗi hoặc không đúng mô tả.", color:"bg-amber-50 border-amber-100" },
                  ].map(s=>(
                    <div key={s.title} className={`${s.color} border rounded-2xl p-4`}>
                      <div className="mb-2">{s.icon}</div>
                      <p className="font-bold text-gray-800 text-sm mb-1">{s.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <h3 className="font-bold text-gray-800 mb-4">Quy trình đặt hàng</h3>
                <Steps steps={[
                  { icon:<Package size={14}/>, title:"Chọn sản phẩm & thêm vào giỏ", desc:"Tìm kiếm sản phẩm, chọn đúng phân loại (size, màu, số lượng), kiểm tra đánh giá từ người mua trước, rồi nhấn Thêm vào giỏ hoặc Mua ngay." },
                  { icon:<MapPin size={14}/>, title:"Nhập địa chỉ & chọn vận chuyển", desc:"Điền đầy đủ họ tên, SĐT, địa chỉ nhận hàng (tỉnh/huyện/phường). Chọn Giao hàng tiêu chuẩn, Hỏa tốc hoặc Đặt trước tùy nhu cầu." },
                  { icon:<CreditCard size={14}/>, title:"Chọn phương thức thanh toán", desc:"COD (trả tiền khi nhận hàng) hoặc chuyển khoản/QR VNPay. Có thể nhập mã voucher giảm giá của người bán tại bước này." },
                  { icon:<CheckCircle size={14}/>, title:"Xác nhận & theo dõi đơn", desc:"Sau khi đặt hàng thành công, bạn nhận email xác nhận. Theo dõi tiến trình giao hàng real-time trong mục Đơn hàng của tôi." },
                ]}/>

                <div className="mt-8">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><HelpCircle size={16} className="text-nexus-500"/> Câu hỏi thường gặp</h3>
                  <div className="flex flex-col gap-2">
                    <FAQ q="Tôi có thể thay đổi địa chỉ giao hàng sau khi đặt không?">
                      Bạn có thể thay đổi địa chỉ nếu đơn hàng vẫn ở trạng thái <strong>Chờ xác nhận</strong> hoặc <strong>Đã xác nhận</strong>. Sau khi đơn chuyển sang Đang xử lý, không thể thay đổi địa chỉ — vui lòng hủy đơn và đặt lại.
                    </FAQ>
                    <FAQ q="Nexus có bán hàng quốc tế không?">
                      Có. Chọn phương thức vận chuyển <strong>Hàng đặt trước / nhập khẩu</strong> khi checkout. Thời gian giao hàng từ 7–21 ngày, không có phí vận chuyển cố định — liên hệ người bán để xác nhận chi phí.
                    </FAQ>
                    <FAQ q="Tôi có thể mua nhiều sản phẩm từ nhiều người bán trong 1 đơn không?">
                      Hiện tại mỗi lần checkout là 1 đơn hàng từ tất cả sản phẩm trong giỏ. Nếu sản phẩm từ nhiều người bán, hệ thống sẽ tách thành nhiều đơn hàng riêng để xử lý.
                    </FAQ>
                    <FAQ q="Giỏ hàng có hết hạn không?">
                      Không. Giỏ hàng được lưu vĩnh viễn khi bạn đăng nhập. Tuy nhiên, sản phẩm có thể hết hàng hoặc thay đổi giá sau khi bạn thêm vào — hệ thống sẽ thông báo trước khi thanh toán.
                    </FAQ>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ ĐỔI TRẢ ═══ */}
            {tab === "return" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <SectionHeader icon={<RefreshCw size={22}/>} title="Chính Sách Đổi Trả Hàng" sub="Áp dụng trong vòng 15 ngày kể từ ngày nhận hàng"/>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5"/>
                  <p className="text-sm text-amber-700"><strong>Lưu ý:</strong> Nexus chấp nhận đổi trả trong <strong>15 ngày kể từ ngày nhận hàng</strong>. Sản phẩm phải còn nguyên trạng, chưa qua sử dụng và có đầy đủ bao bì, phụ kiện kèm theo.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                  <div>
                    <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle size={15}/> Được phép đổi trả khi</h3>
                    <ul className="flex flex-col gap-2">
                      {[
                        "Sản phẩm bị lỗi từ nhà sản xuất (màn hình chết, pin phồng…)",
                        "Nhận được sản phẩm khác với mô tả (sai màu, sai size, sai model)",
                        "Sản phẩm bị hư hỏng trong quá trình vận chuyển",
                        "Thiếu phụ kiện so với mô tả trong listing",
                        "Hàng giả, hàng nhái không phải chính hãng",
                      ].map(s=>(
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5"/>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2"><XCircle size={15}/> Không được đổi trả khi</h3>
                    <ul className="flex flex-col gap-2">
                      {[
                        "Quá 15 ngày kể từ ngày nhận hàng",
                        "Sản phẩm đã qua sử dụng, trầy xước, biến dạng",
                        "Mất tem, nhãn mác hoặc hộp đựng ban đầu",
                        "Sản phẩm thuộc nhóm đặc biệt: đồ lót, mỹ phẩm đã khui",
                        "Hư hỏng do sử dụng sai cách hoặc tai nạn",
                        "Người mua đơn thuần 'đổi ý' sau khi đã nhận hàng bình thường",
                      ].map(s=>(
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                          <XCircle size={13} className="text-red-400 shrink-0 mt-0.5"/>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-4">Quy trình đổi trả</h3>
                <Steps steps={[
                  { icon:<AlertCircle size={14}/>, title:"Yêu cầu đổi trả (trong 15 ngày)", desc:"Vào Đơn hàng → Chọn đơn cần đổi trả → Nhấn 'Yêu cầu đổi trả/Hoàn tiền'. Chụp ảnh/quay video sản phẩm lỗi làm bằng chứng." },
                  { icon:<MessageSquare size={14}/>, title:"Nexus xét duyệt (1–2 ngày làm việc)", desc:"Bộ phận CSKH xem xét yêu cầu và bằng chứng. Bạn nhận email/thông báo kết quả phê duyệt." },
                  { icon:<Package size={14}/>, title:"Gửi hàng về (nếu được duyệt)", desc:"In nhãn gửi hàng miễn phí do Nexus cung cấp. Đóng gói cẩn thận và giao cho đơn vị vận chuyển trong 3 ngày." },
                  { icon:<RefreshCw size={14}/>, title:"Nhận hàng đổi hoặc hoàn tiền", desc:"Sau khi nhận và kiểm tra hàng trả về (3–5 ngày), Nexus gửi hàng đổi hoặc hoàn tiền vào tài khoản trong 3–5 ngày làm việc." },
                ]}/>

                <div className="mt-6 bg-nexus-50 border border-nexus-100 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-nexus-700 mb-1">Chi phí đổi trả</p>
                  <p className="text-sm text-gray-600">Nếu lỗi do <strong>người bán/vận chuyển</strong>: Nexus chịu 100% phí gửi hàng về.<br/>Nếu lỗi do <strong>người mua</strong> (đổi ý, chọn sai): người mua chịu phí gửi hàng về.</p>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><HelpCircle size={16} className="text-nexus-500"/> Câu hỏi thường gặp</h3>
                  <div className="flex flex-col gap-2">
                    <FAQ q="Tôi cần cung cấp gì để yêu cầu đổi trả?">
                      Cần cung cấp: (1) Video/ảnh sản phẩm lỗi chụp ngay khi mở hộp, (2) Mã đơn hàng, (3) Mô tả rõ vấn đề. Video mở hộp (unboxing) là bằng chứng mạnh nhất được chấp nhận.
                    </FAQ>
                    <FAQ q="Nếu sản phẩm đổi trả lại cũng bị lỗi thì sao?">
                      Trường hợp sản phẩm đổi lần 2 tiếp tục bị lỗi, Nexus sẽ hoàn tiền 100% hoặc cho phép chọn sản phẩm khác cùng giá trị. Liên hệ hotline 0946 000 838 để được ưu tiên hỗ trợ.
                    </FAQ>
                    <FAQ q="Sản phẩm điện tử mấy ngày mới phát hiện lỗi thì sao?">
                      Sản phẩm điện tử có bảo hành chính hãng: dùng bảo hành để sửa/đổi. Nếu lỗi xuất hiện trong 15 ngày đầu, Nexus hỗ trợ đổi mới 1:1.
                    </FAQ>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ HOÀN TIỀN ═══ */}
            {tab === "refund" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <SectionHeader icon={<CreditCard size={22}/>} title="Chính Sách Hoàn Tiền" sub="Thời gian & phương thức hoàn tiền"/>

                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { label:"Thanh toán COD",     time:"3–5 ngày làm việc", method:"Chuyển khoản ngân hàng", icon:"💵" },
                    { label:"Ví điện tử / QR",    time:"1–3 ngày làm việc", method:"Hoàn vào ví gốc",       icon:"📱" },
                    { label:"Thẻ tín dụng/ghi nợ", time:"5–10 ngày làm việc", method:"Hoàn về thẻ gốc",   icon:"💳" },
                  ].map(s=>(
                    <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                      <div className="text-3xl mb-2">{s.icon}</div>
                      <p className="font-bold text-gray-800 text-sm mb-1">{s.label}</p>
                      <p className="text-xs text-nexus-600 font-semibold">{s.time}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.method}</p>
                    </div>
                  ))}
                </div>

                <h3 className="font-bold text-gray-800 mb-4">Các trường hợp được hoàn tiền</h3>
                <div className="flex flex-col gap-3 mb-8">
                  {[
                    { title:"Đơn bị hủy thành công", desc:"Hủy đơn trong giai đoạn cho phép → hoàn tiền đầy đủ 100% kể cả phí vận chuyển đã thu (nếu có).", color:"text-emerald-600", bg:"bg-emerald-50 border-emerald-100" },
                    { title:"Sản phẩm không về hoặc về trễ quá 15 ngày", desc:"Nếu đã quá 15 ngày so với ngày dự kiến giao mà chưa nhận được hàng, liên hệ CSKH để xử lý hoàn tiền hoặc giao lại.", color:"text-amber-600", bg:"bg-amber-50 border-amber-100" },
                    { title:"Đổi trả thành công được duyệt", desc:"Sau khi Nexus nhận hàng trả về và kiểm tra OK → hoàn tiền 100% giá trị sản phẩm.", color:"text-blue-600", bg:"bg-blue-50 border-blue-100" },
                    { title:"Sản phẩm sai với mô tả nghiêm trọng", desc:"Khi sản phẩm khác hẳn mô tả (hàng giả, thiếu phụ kiện quan trọng...) mà không thể đổi → hoàn tiền 100%.", color:"text-nexus-600", bg:"bg-indigo-50 border-indigo-100" },
                  ].map(s=>(
                    <div key={s.title} className={`${s.bg} border rounded-2xl p-4`}>
                      <p className={`font-bold text-sm ${s.color} mb-1`}>{s.title}</p>
                      <p className="text-sm text-gray-600">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <h3 className="font-bold text-gray-800 mb-4">Quy trình hoàn tiền</h3>
                <Steps steps={[
                  { icon:<AlertCircle size={14}/>, title:"Yêu cầu hoàn tiền", desc:"Vào Chi tiết đơn hàng → nhấn 'Yêu cầu hoàn tiền'. Điền lý do và tải bằng chứng (ảnh/video). Đơn hàng phải ở trạng thái Đã giao hoặc Hoàn thành." },
                  { icon:<MessageSquare size={14}/>, title:"Xét duyệt (1–3 ngày làm việc)", desc:"CSKH Nexus xem xét hồ sơ. Nếu cần, sẽ liên hệ bổ sung thông tin qua SĐT hoặc email đăng ký." },
                  { icon:<CheckCircle size={14}/>, title:"Phê duyệt → kích hoạt hoàn tiền", desc:"Khi được duyệt, hệ thống tự động gửi tiền về phương thức thanh toán ban đầu. Email/thông báo xác nhận gửi ngay lập tức." },
                  { icon:<CreditCard size={14}/>, title:"Nhận tiền vào tài khoản", desc:"Tùy phương thức: COD 3–5 ngày, ví 1–3 ngày, thẻ 5–10 ngày. Liên hệ ngân hàng nếu quá thời hạn vẫn chưa nhận." },
                ]}/>

                <div className="mt-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><HelpCircle size={16} className="text-nexus-500"/> Câu hỏi thường gặp</h3>
                  <div className="flex flex-col gap-2">
                    <FAQ q="Nexus có hoàn phí vận chuyển không?">
                      Nếu lỗi do người bán hoặc vận chuyển: hoàn 100% kể cả phí ship.<br/>Nếu người mua hủy đơn sau khi đã giao đi: chỉ hoàn tiền hàng, không hoàn phí vận chuyển.
                    </FAQ>
                    <FAQ q="Tôi trả COD nhưng muốn nhận tiền qua ví điện tử được không?">
                      Được. Khi yêu cầu hoàn tiền, bạn có thể cung cấp số tài khoản ngân hàng hoặc SĐT ví điện tử (MoMo, ZaloPay) để nhận tiền hoàn. Thời gian xử lý 3–5 ngày làm việc.
                    </FAQ>
                    <FAQ q="Đơn thanh toán bằng voucher có được hoàn tiền không?">
                      Phần tiền mặt bạn đã trả sẽ được hoàn lại. Phần voucher/mã giảm giá sẽ được hoàn về dạng điểm thưởng Nexus hoặc voucher mới tương đương.
                    </FAQ>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ KHIẾU NẠI ═══ */}
            {tab === "complaint" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <SectionHeader icon={<MessageSquare size={22}/>} title="Chính Sách Khiếu Nại" sub="Bảo vệ quyền lợi người mua & người bán"/>

                <div className="bg-nexus-50 border border-nexus-200 rounded-2xl p-5 mb-6">
                  <p className="font-bold text-nexus-700 mb-2">Cam kết của Nexus</p>
                  <p className="text-sm text-gray-600 leading-relaxed">Mọi khiếu nại được xử lý <strong>công bằng, minh bạch</strong> trong vòng <strong>5–7 ngày làm việc</strong>. Người mua và người bán đều có quyền cung cấp bằng chứng và giải trình trước khi có phán quyết cuối cùng.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">Các loại khiếu nại được chấp nhận</h3>
                    <ul className="flex flex-col gap-2.5">
                      {[
                        "Hàng giả, hàng nhái, không đúng thương hiệu",
                        "Người bán từ chối đổi trả khi thuộc điều kiện",
                        "Người bán không giao hàng sau khi đã nhận tiền",
                        "Thông tin sản phẩm gian lận, mô tả sai sự thật",
                        "Người bán có hành vi không chuyên nghiệp, quấy rối",
                        "Lỗi thanh toán dẫn đến tính tiền sai",
                        "Vi phạm chính sách của Nexus",
                      ].map(s=>(
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={13} className="text-nexus-500 shrink-0 mt-0.5"/>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">Bằng chứng cần cung cấp</h3>
                    <ul className="flex flex-col gap-2.5">
                      {[
                        "Ảnh chụp rõ sản phẩm và lỗi cụ thể",
                        "Video mở hộp (unboxing) được quay liên tục",
                        "Screenshot cuộc trò chuyện với người bán",
                        "Ảnh tem niêm phong còn nguyên (nếu có)",
                        "Hóa đơn, bill mua hàng kèm theo",
                        "Kết quả kiểm định từ đơn vị ủy quyền (nếu có)",
                      ].map(s=>(
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                          <ArrowRight size={13} className="text-gray-400 shrink-0 mt-0.5"/>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-4">Quy trình xử lý khiếu nại</h3>
                <Steps steps={[
                  { icon:<MessageSquare size={14}/>, title:"Gửi khiếu nại", desc:"Vào Chi tiết đơn hàng → nhấn 'Khiếu nại'. Hoặc liên hệ trực tiếp hotline 0946 000 838. Mô tả rõ vấn đề và đính kèm bằng chứng." },
                  { icon:<AlertCircle size={14}/>, title:"Tiếp nhận & phân loại (trong 24h)", desc:"Bộ phận Khiếu nại ghi nhận, xác nhận đủ thông tin và phân công xử lý viên. Bạn nhận email/SMS xác nhận đã tiếp nhận." },
                  { icon:<MessageSquare size={14}/>, title:"Điều tra & đối chất (2–5 ngày)", desc:"Nexus yêu cầu người bán cung cấp giải trình và bằng chứng đối lập. Cả hai bên có quyền bổ sung bằng chứng." },
                  { icon:<Gavel size={14}/>, title:"Phán quyết cuối (1–2 ngày)", desc:"Dựa trên toàn bộ bằng chứng, Nexus đưa ra quyết định: hoàn tiền người mua / giải quyết cho người bán / xử phạt vi phạm." },
                  { icon:<CheckCircle size={14}/>, title:"Thực thi quyết định", desc:"Hoàn tiền (nếu thuận lợi cho người mua) trong 3–5 ngày. Đình chỉ/khóa tài khoản người bán vi phạm nếu cần." },
                ]}/>

                <div className="mt-6 bg-gray-50 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-3">Kênh liên hệ khiếu nại</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { icon:<Phone size={18} className="text-emerald-500"/>, title:"Hotline", val:"0946 000 838", sub:"Thứ 2–7, 8:00–22:00", href:"tel:0946000838" },
                      { icon:<Mail size={18} className="text-blue-500"/>, title:"Email", val:"khieunai@nexus.vn", sub:"Phản hồi trong 4h làm việc", href:"mailto:khieunai@nexus.vn" },
                      { icon:<MessageSquare size={18} className="text-nexus-500"/>, title:"Chat trực tuyến", val:"Nexus Support", sub:"24/7 trên app & website", href:"#" },
                    ].map(s=>(
                      <a key={s.title} href={s.href} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-nexus-200 hover:shadow-sm transition-all">
                        <div className="mb-2">{s.icon}</div>
                        <p className="font-bold text-gray-700 text-sm">{s.title}</p>
                        <p className="text-xs text-nexus-600 font-medium mt-0.5">{s.val}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><HelpCircle size={16} className="text-nexus-500"/> Câu hỏi thường gặp</h3>
                  <div className="flex flex-col gap-2">
                    <FAQ q="Tôi không đồng ý với phán quyết của Nexus thì sao?">
                      Bạn có quyền phúc thẩm trong vòng 7 ngày sau khi nhận phán quyết. Gửi yêu cầu phúc thẩm kèm bằng chứng bổ sung về email <strong>phucTham@nexus.vn</strong>. Phán quyết phúc thẩm là cuối cùng.
                    </FAQ>
                    <FAQ q="Người bán bị xử lý như thế nào nếu thua khiếu nại?">
                      Tùy mức độ: Cảnh cáo → Đình chỉ 7–30 ngày → Khoá tài khoản vĩnh viễn. Các vi phạm nghiêm trọng như bán hàng giả sẽ bị khoá ngay và báo cáo cơ quan chức năng.
                    </FAQ>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ ĐÁNH GIÁ SAO ═══ */}
            {tab === "review" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <SectionHeader icon={<Star size={22}/>} title="Chính Sách Đánh Giá & Sao" sub="Hệ thống xếp hạng minh bạch cho cả người mua lẫn người bán"/>

                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-4">Hệ thống sao đánh giá</h3>
                    <div className="flex flex-col gap-3">
                      {[
                        { stars:5, label:"Xuất sắc",    desc:"Hàng đúng mô tả, giao nhanh, đóng gói tốt", color:"text-amber-500" },
                        { stars:4, label:"Tốt",         desc:"Tốt, có một vài điểm nhỏ cần cải thiện",   color:"text-amber-400" },
                        { stars:3, label:"Trung bình",  desc:"Chấp nhận được nhưng chưa đúng kỳ vọng",   color:"text-gray-400" },
                        { stars:2, label:"Kém",         desc:"Có vấn đề đáng kể với sản phẩm/dịch vụ",   color:"text-orange-400" },
                        { stars:1, label:"Rất kém",     desc:"Sản phẩm lỗi nặng hoặc không nhận được",   color:"text-red-500" },
                      ].map(s=>(
                        <div key={s.stars} className="flex items-center gap-3">
                          <div className="flex shrink-0">
                            {Array.from({length:5}).map((_,i)=><Star key={i} size={13} className={i<s.stars ? `fill-current ${s.color}` : "text-gray-200 fill-gray-200"}/>)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-gray-700">{s.label}</span>
                            <span className="text-xs text-gray-400 ml-2">{s.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-4">Điều kiện được đánh giá</h3>
                    <ul className="flex flex-col gap-2.5">
                      {[
                        "Chỉ người mua đã hoàn tất đơn hàng mới được đánh giá",
                        "Mỗi đơn hàng chỉ được đánh giá 1 lần",
                        "Thời gian để lại đánh giá: trong vòng 30 ngày sau khi nhận hàng",
                        "Được chỉnh sửa đánh giá trong vòng 48h sau khi đăng",
                        "Có thể kèm ảnh thực tế (tối đa 5 ảnh) hoặc video ngắn",
                        "Đánh giá phải liên quan đến sản phẩm, không phải cá nhân người bán",
                      ].map(s=>(
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={13} className="text-nexus-500 shrink-0 mt-0.5"/>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle size={14}/> Đánh giá được chấp nhận</h3>
                    <ul className="flex flex-col gap-1.5 text-sm text-gray-600">
                      {[
                        "Nhận xét trung thực về chất lượng sản phẩm",
                        "So sánh sản phẩm thực tế với mô tả",
                        "Đánh giá về đóng gói, thời gian giao hàng",
                        "Chia sẻ kinh nghiệm sử dụng thực tế",
                        "Đề xuất cải tiến cụ thể cho người bán",
                      ].map(s=><li key={s} className="flex items-start gap-1.5"><ArrowRight size={11} className="text-emerald-400 shrink-0 mt-0.5"/>{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2"><XCircle size={14}/> Đánh giá bị xóa nếu</h3>
                    <ul className="flex flex-col gap-1.5 text-sm text-gray-600">
                      {[
                        "Chứa ngôn ngữ xúc phạm, kỳ thị, thù ghét",
                        "Bao gồm thông tin cá nhân của người bán",
                        "Không liên quan đến sản phẩm được mua",
                        "Đánh giá giả mạo hoặc được cài cắm",
                        "Nội dung mang tính PR/quảng cáo sản phẩm khác",
                        "Vi phạm pháp luật Việt Nam",
                      ].map(s=><li key={s} className="flex items-start gap-1.5"><XCircle size={11} className="text-red-400 shrink-0 mt-0.5"/>{s}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">Ảnh hưởng của đánh giá</h3>
                  <div className="grid sm:grid-cols-3 gap-4 text-center text-sm">
                    {[
                      { icon:"⭐", title:"Điểm uy tín người bán", desc:"Trung bình sao từ tất cả đơn hàng, hiển thị trên trang shop." },
                      { icon:"🏆", title:"Huy hiệu Top Seller", desc:"Người bán ≥ 4.5★ và ≥ 100 đơn nhận badge ưu tiên hiển thị." },
                      { icon:"🔍", title:"Xếp hạng tìm kiếm", desc:"Sản phẩm có nhiều đánh giá tốt được ưu tiên lên top tìm kiếm." },
                    ].map(s=>(
                      <div key={s.title} className="bg-white border border-gray-100 rounded-xl p-3">
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <p className="font-bold text-gray-700 text-xs mb-1">{s.title}</p>
                        <p className="text-xs text-gray-400">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><HelpCircle size={16} className="text-nexus-500"/> Câu hỏi thường gặp</h3>
                  <div className="flex flex-col gap-2">
                    <FAQ q="Người bán có thể xóa đánh giá của tôi không?">
                      Không. Chỉ Nexus mới có quyền xóa đánh giá, và chỉ khi vi phạm chính sách. Người bán có thể phản hồi đánh giá (reply) nhưng không thể chỉnh sửa hay xóa.
                    </FAQ>
                    <FAQ q="Nếu tôi bị mua hàng để lại đánh giá xấu oan thì sao?">
                      Người bán có thể báo cáo đánh giá nghi ngờ gian lận. Nexus xem xét lịch sử đơn hàng và IP người đánh giá. Đánh giá giả mạo sẽ bị xóa và người mua bị xử phạt.
                    </FAQ>
                    <FAQ q="Tôi có nhận thưởng khi để lại đánh giá không?">
                      Có. Đánh giá kèm ảnh thực tế: +5 điểm Nexus Coin. Đánh giá chi tiết trên 50 chữ: +2 điểm. Điểm được tích lũy và dùng để đổi voucher mua hàng.
                    </FAQ>
                  </div>
                </div>
              </div>
            )}

            {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-nexus-600 to-violet-500 rounded-2xl p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-extrabold text-lg">Cần hỗ trợ thêm?</p>
                  <p className="text-white/75 text-sm mt-1">Đội ngũ CSKH Nexus sẵn sàng hỗ trợ 24/7</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <a href="tel:0946000838" className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Phone size={15}/> 0946 000 838
                  </a>
                  <Link to="/orders" className="bg-white text-nexus-600 hover:bg-nexus-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <Package size={15}/> Đơn của tôi
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Missing import fix
function MapPin({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}
