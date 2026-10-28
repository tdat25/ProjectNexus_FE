import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct, deleteProduct, getCategories } from "@shared/api/catalog";
import { useAuth } from "@app/providers/AuthContext";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  Plus, Trash2, Package, Tag, BarChart2, Percent,
  Copy, CheckCircle, Clock, AlertCircle, X, Ticket,
  Users, TrendingUp, Eye, Star,
} from "lucide-react";

const fmtDate = (s: string) => new Date(s).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" });

// ── Mock voucher store (in real app: API) ─────────────────────────────────
interface Voucher {
  id: string; code: string; type: "percent" | "flat";
  discount: number; minOrder: number;
  maxUses: number; usedCount: number;
  startDate: string; endDate: string;
  active: boolean; desc: string;
}

const INIT_VOUCHERS: Voucher[] = [
  { id:"v1", code:"MYSHOP10", type:"percent", discount:10, minOrder:0,         maxUses:100, usedCount:47, startDate:"2024-10-01", endDate:"2024-12-31", active:true,  desc:"Giảm 10% không giới hạn đơn" },
  { id:"v2", code:"SALE20K",  type:"flat",    discount:20_000, minOrder:150_000, maxUses:50,  usedCount:50, startDate:"2024-10-01", endDate:"2024-10-31", active:false, desc:"Giảm 20.000đ đơn từ 150k" },
  { id:"v3", code:"VIP30",    type:"percent", discount:30, minOrder:500_000,   maxUses:20,  usedCount:8,  startDate:"2024-11-01", endDate:"2024-11-30", active:true,  desc:"VIP giảm 30% đơn từ 500k" },
];

// ── Voucher status ─────────────────────────────────────────────────────────
function VoucherStatus({ v }: { v: Voucher }) {
  const now = Date.now();
  const end = new Date(v.endDate).getTime();
  const full = v.usedCount >= v.maxUses;
  const expired = end < now;
  if (!v.active || expired || full) return <span className="text-[10px] bg-red-100 text-red-500 font-bold px-2 py-0.5 rounded-full">{full ? "Hết lượt" : expired ? "Hết hạn" : "Tắt"}</span>;
  const daysLeft = Math.ceil((end - now) / 86_400_000);
  if (daysLeft <= 7) return <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={9}/> Còn {daysLeft}d</span>;
  return <span className="text-[10px] bg-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={9}/> Đang chạy</span>;
}

// ── Voucher Manager ────────────────────────────────────────────────────────
function VoucherManager({ externalOpen, onClose }: { externalOpen?: boolean; onClose?: () => void }) {
  const [vouchers, setVouchers] = useState<Voucher[]>(INIT_VOUCHERS);
  const [showForm, setShowForm] = useState(false);

  // Mở form khi parent button "Tạo voucher" được bấm
  useEffect(() => {
    if (externalOpen) {
      setShowForm(true);
      onClose?.();
    }
  }, [externalOpen]);
  const [copied, setCopied] = useState("");
  const [form, setForm] = useState({ code:"", type:"percent" as "percent"|"flat", discount:"", minOrder:"", maxUses:"", endDate:"", desc:"" });
  const [formErr, setFormErr] = useState("");

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(()=>{});
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
    toast.success(`Đã copy mã ${code}`);
  };

  const toggleActive = (id: string) => {
    setVouchers(vs => vs.map(v => v.id === id ? {...v, active: !v.active} : v));
  };

  const deleteVoucher = (id: string) => {
    setVouchers(vs => vs.filter(v => v.id !== id));
    toast.success("Đã xóa voucher");
  };

  const handleCreate = () => {
    setFormErr("");
    if (!form.code.trim()) { setFormErr("Vui lòng nhập mã voucher"); return; }
    if (!form.discount || Number(form.discount) <= 0) { setFormErr("Vui lòng nhập mức giảm hợp lệ"); return; }
    if (form.type === "percent" && Number(form.discount) > 90) { setFormErr("Giảm giá tối đa 90%"); return; }
    if (!form.endDate) { setFormErr("Vui lòng chọn ngày kết thúc"); return; }
    if (vouchers.some(v => v.code === form.code.toUpperCase())) { setFormErr("Mã này đã tồn tại"); return; }

    const newV: Voucher = {
      id: `v${Date.now()}`,
      code: form.code.trim().toUpperCase(),
      type: form.type,
      discount: Number(form.discount),
      minOrder: Number(form.minOrder) || 0,
      maxUses: Number(form.maxUses) || 999,
      usedCount: 0,
      startDate: new Date().toISOString().slice(0,10),
      endDate: form.endDate,
      active: true,
      desc: form.desc || `Giảm ${form.type==="percent" ? form.discount+"%" : new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(Number(form.discount))}`,
    };
    setVouchers(vs => [newV, ...vs]);
    setForm({ code:"", type:"percent", discount:"", minOrder:"", maxUses:"", endDate:"", desc:"" });
    setShowForm(false);
    toast.success(`Tạo voucher ${newV.code} thành công!`);
  };

  const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(n);
  const totalActive = vouchers.filter(v => v.active && new Date(v.endDate)>=new Date() && v.usedCount<v.maxUses).length;
  const totalUsed = vouchers.reduce((s,v) => s+v.usedCount, 0);

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon:<Ticket size={18} className="text-nexus-500"/>, label:"Voucher đang chạy", val:totalActive, bg:"bg-indigo-50" },
          { icon:<Users size={18} className="text-emerald-500"/>, label:"Tổng lượt dùng", val:totalUsed, bg:"bg-emerald-50" },
          { icon:<TrendingUp size={18} className="text-amber-500"/>, label:"Tổng voucher", val:vouchers.length, bg:"bg-amber-50" },
        ].map(s=>(
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-2xl font-extrabold text-gray-800">{s.val}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-nexus-100 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={15} className="text-nexus-500"/>Tạo voucher mới</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mã voucher *</label>
              <input value={form.code} onChange={e => setForm(f=>({...f, code:e.target.value.toUpperCase()}))}
                placeholder="VD: SALE20" maxLength={20}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400 uppercase font-mono tracking-wider"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Loại giảm giá *</label>
              <div className="flex gap-2">
                {[{val:"percent",label:"Theo %"},{val:"flat",label:"Số tiền cố định"}].map(t=>(
                  <label key={t.val} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-colors ${form.type===t.val ? "border-nexus-400 bg-nexus-50 text-nexus-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    <input type="radio" name="vtype" value={t.val} checked={form.type===t.val} onChange={() => setForm(f=>({...f, type:t.val as any}))} className="hidden"/>
                    {t.val==="percent" ? <Percent size={13}/> : <span className="text-xs font-bold">đ</span>}
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mức giảm * {form.type==="percent" ? "(%)":"(VNĐ)"}</label>
              <input value={form.discount} onChange={e => setForm(f=>({...f, discount:e.target.value}))} type="number"
                placeholder={form.type==="percent" ? "Ví dụ: 20 (giảm 20%)" : "Ví dụ: 50000"} min="1" max={form.type==="percent"?"90":""}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Đơn tối thiểu (VNĐ)</label>
              <input value={form.minOrder} onChange={e => setForm(f=>({...f, minOrder:e.target.value}))} type="number"
                placeholder="0 = không giới hạn" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Số lượt dùng tối đa</label>
              <input value={form.maxUses} onChange={e => setForm(f=>({...f, maxUses:e.target.value}))} type="number"
                placeholder="Bỏ trống = không giới hạn" min="1"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Ngày kết thúc *</label>
              <input value={form.endDate} onChange={e => setForm(f=>({...f, endDate:e.target.value}))} type="date"
                min={new Date().toISOString().slice(0,10)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"/>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mô tả (hiển thị cho khách)</label>
              <input value={form.desc} onChange={e => setForm(f=>({...f, desc:e.target.value}))} maxLength={80}
                placeholder="VD: Giảm 20% cho đơn từ 200k"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"/>
            </div>
          </div>
          {formErr && <p className="text-xs text-red-500 mt-3 flex items-center gap-1"><AlertCircle size={11}/>{formErr}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl text-sm font-bold transition-colors">Tạo voucher</button>
            <button onClick={() => { setShowForm(false); setFormErr(""); }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">Hủy</button>
          </div>
        </div>
      )}

      {/* Voucher list */}
      {vouchers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Ticket size={40} className="mx-auto mb-2 opacity-20"/>
          <p className="text-sm">Bạn chưa có voucher nào. Tạo ngay!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {vouchers.map(v => (
            <div key={v.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-4 transition-all ${!v.active ? "opacity-60" : "border-gray-100 hover:border-nexus-200 hover:shadow-sm"}`}>
              {/* Discount badge */}
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 ${v.type==="percent" ? "bg-nexus-50 border border-nexus-100" : "bg-amber-50 border border-amber-100"}`}>
                <span className={`text-lg font-extrabold ${v.type==="percent" ? "text-nexus-600":"text-amber-600"}`}>
                  {v.type==="percent" ? `-${v.discount}%` : `-${Math.round(v.discount/1000)}k`}
                </span>
                {v.type==="flat" && <span className="text-[9px] text-amber-500">VNĐ</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-extrabold text-gray-800 tracking-wider">{v.code}</span>
                  <VoucherStatus v={v}/>
                </div>
                <p className="text-xs text-gray-500 mb-1">{v.desc}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
                  {v.minOrder > 0 && <span>Tối thiểu: {fmtVND(v.minOrder)}</span>}
                  <span className="flex items-center gap-0.5"><Users size={9}/> {v.usedCount}/{v.maxUses} lượt</span>
                  <span className="flex items-center gap-0.5"><Clock size={9}/> {fmtDate(v.startDate)} – {fmtDate(v.endDate)}</span>
                </div>
                {/* Usage bar */}
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden w-32">
                  <div className="h-full bg-nexus-400 rounded-full transition-all" style={{width:`${Math.min(100, (v.usedCount/v.maxUses)*100)}%`}}/>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => copyCode(v.code)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${copied===v.code ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "border-gray-200 text-gray-500 hover:border-nexus-300 hover:text-nexus-600"}`}>
                  {copied===v.code ? <><CheckCircle size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
                </button>
                <button onClick={() => toggleActive(v.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${v.active ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-gray-200 text-gray-500 hover:border-nexus-300 hover:text-nexus-600"}`}>
                  {v.active ? "Tắt" : "Bật"}
                </button>
                <button onClick={() => deleteVoucher(v.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200 transition-colors">
                  <X size={11}/>Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// Status badge cho sản phẩm
function ProductStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    Pending:  { label: "Chờ duyệt",  cls: "bg-amber-100 text-amber-700" },
    Approved: { label: "Đang bán",   cls: "bg-emerald-100 text-emerald-700" },
    Hidden:   { label: "Bị ẩn",      cls: "bg-gray-100 text-gray-600" },
    Rejected: { label: "Bị từ chối", cls: "bg-red-100 text-red-600" },
  };
  const badge = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
      {badge.label}
    </span>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"products"|"vouchers"|"stats">("products");
  const [openVoucherForm, setOpenVoucherForm] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price: "", stockQuantity: "1", categoryId: "", imageUrl: "",
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "seller", user?.userId],
    queryFn: () => getProducts({ pageSize: 100 }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: () => createProduct({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      categoryId: form.categoryId,
      imageUrl: form.imageUrl || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Thêm sản phẩm thành công!");
      setShowAdd(false);
      setForm({ name: "", description: "", price: "", stockQuantity: "1", categoryId: "", imageUrl: "" });
    },
    onError: () => toast.error("Thêm sản phẩm thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Đã xóa sản phẩm");
    },
    onError: () => toast.error("Không thể xóa sản phẩm"),
  });

  if (isLoading) return <LoadingSpinner />;

  // Chỉ hiển thị sản phẩm của seller này (lọc theo sellerId)
  const myProducts = (products?.items ?? []).filter(p => p.sellerId === user?.userId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart2 size={26} className="text-nexus-500"/> Kênh Người Bán
        </h1>
        {activeTab === "products" && (
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-nexus-600 text-white rounded-xl hover:bg-nexus-700 transition text-sm font-medium">
            <Plus size={16} /> Thêm sản phẩm
          </button>
        )}
        {activeTab === "vouchers" && (
          <button onClick={() => setOpenVoucherForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-nexus-600 text-white rounded-xl hover:bg-nexus-700 transition text-sm font-medium">
            <Plus size={16} /> Tạo voucher
          </button>
        )}
      </div>

      {/* ── Tab nav ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6">
        {[
          { key:"products", label:"Sản phẩm", icon:<Package size={14}/> },
          { key:"vouchers", label:"Voucher & Mã giảm giá", icon:<Ticket size={14}/> },
          { key:"stats",    label:"Thống kê", icon:<BarChart2 size={14}/> },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab===t.key ? "bg-white text-nexus-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Voucher tab ──────────────────────────────────────────────────── */}
      {activeTab === "vouchers" && (
        <VoucherManager
          externalOpen={openVoucherForm}
          onClose={() => setOpenVoucherForm(false)}
        />
      )}

      {/* ── Stats tab ────────────────────────────────────────────────────── */}
      {activeTab === "stats" && (
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { icon:<Package size={22} className="text-nexus-500"/>, label:"Sản phẩm đang bán", val: myProducts.length, color:"bg-indigo-50 border-indigo-100" },
            { icon:<Eye size={22} className="text-blue-500"/>, label:"Lượt xem tháng này", val:"1.234", color:"bg-blue-50 border-blue-100" },
            { icon:<Star size={22} className="text-amber-500"/>, label:"Điểm uy tín trung bình", val:"4.7 ★", color:"bg-amber-50 border-amber-100" },
            { icon:<TrendingUp size={22} className="text-emerald-500"/>, label:"Đơn hàng tháng này", val:"58", color:"bg-emerald-50 border-emerald-100" },
          ].map(s=>(
            <div key={s.label} className={`${s.color} border rounded-2xl p-6 flex items-center gap-4`}>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">{s.icon}</div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{s.val}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
          <div className="sm:col-span-2 bg-white border border-gray-100 rounded-2xl p-6">
            <p className="font-bold text-gray-700 mb-1 flex items-center gap-2"><BarChart2 size={16} className="text-nexus-500"/> Biểu đồ doanh thu</p>
            <p className="text-sm text-gray-400">Tính năng biểu đồ chi tiết sẽ ra mắt trong phiên bản tiếp theo.</p>
          </div>
        </div>
      )}

      {/* ── Products tab ─────────────────────────────────────────────────── */}
      {activeTab === "products" && <>

      {/* Add product form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Sản phẩm mới</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Tên sản phẩm *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
            />
            <input
              type="number"
              placeholder="Giá (VNĐ) *"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
            />
            <textarea
              placeholder="Mô tả sản phẩm"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="sm:col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400 resize-none"
            />
            <input
              type="number"
              placeholder="Số lượng"
              value={form.stockQuantity}
              onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
            />
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400 bg-white"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories?.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="URL ảnh sản phẩm (tùy chọn)"
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              className="sm:col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-400"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.name || !form.price}
              className="px-5 py-2 bg-nexus-600 text-white rounded-xl text-sm font-medium hover:bg-nexus-700 disabled:opacity-50 transition"
            >
              {createMutation.isPending ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-5 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      {myProducts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Bạn chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myProducts.map((p) => (
            <div key={p.productId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.name} className="w-full h-36 object-cover rounded-xl" />
              )}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 flex-1">{p.name}</h3>
                <ProductStatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Tag size={12} /> {p.categoryName ?? "Chưa phân loại"}
              </div>
              <p className="font-bold text-nexus-600">{fmtVND(p.price)}</p>
              <button
                onClick={() => {
                  if (confirm("Xóa sản phẩm này?")) deleteMutation.mutate(p.productId);
                }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition mt-auto"
              >
                <Trash2 size={12} /> Xóa
              </button>
            </div>
          ))}
        </div>
      )}
      </>}
    </div>
  );
}
