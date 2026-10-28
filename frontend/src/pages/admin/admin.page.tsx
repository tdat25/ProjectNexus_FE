import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminProducts, getCategories,
  createProduct, updateProduct, deleteProduct,
  approveProduct, hideProduct, rejectProduct,
  createCategory, updateCategory, deleteCategory,
} from "@shared/api/catalog";
import type { ProductStatus } from "@shared/api/catalog";
import {
  getAuctions, getBids, updateAuction, cancelAuction,
} from "@shared/api/auction";
import type { Auction } from "@shared/api/auction";
import {
  getUsers, getRoles, changeUserRole, toggleLockUser, deleteUser, DEFAULT_ROLES,
  getPendingSellers, verifySeller,
} from "@shared/api/auth";
import type { RoleOption, SellerProfile } from "@shared/api/auth";
import { useAuth } from "@app/providers/AuthContext";
import LoadingSpinner from "@shared/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  Trash2, Plus, Settings, Users, CheckCircle, XCircle,
  Shield, Check, RotateCcw, Lock, Unlock, Edit2, X,
  Gavel, Eye, EyeOff, Clock, AlertTriangle, ChevronDown, ChevronUp, Store,
} from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtDateInput = (iso: string) => iso ? iso.slice(0, 16) : "";

// ── Status badges ─────────────────────────────────────────────────────────────
function ProductStatusBadge({ status }: { status?: ProductStatus }) {
  const map: Record<string, { label: string; cls: string }> = {
    Pending:  { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    Approved: { label: "Đã duyệt",  cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    Hidden:   { label: "Đã ẩn",     cls: "bg-gray-100 text-gray-600 border-gray-300" },
    Rejected: { label: "Từ chối",   cls: "bg-red-100 text-red-600 border-red-200" },
  };
  const s = map[status ?? "Approved"] ?? map["Approved"];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function AuctionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Scheduled: "bg-blue-100 text-blue-700",
    Active:    "bg-emerald-100 text-emerald-700",
    Ended:     "bg-gray-100 text-gray-500",
    Failed:    "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ── Auction Edit Modal ────────────────────────────────────────────────────────
function AuctionEditModal({
  auction, onClose, onSave,
}: {
  auction: Auction;
  onClose: () => void;
  onSave: (data: { startTime?: string; endTime?: string; bidIncrement?: number; startingPrice?: number }) => void;
}) {
  const [form, setForm] = useState({
    startTime: fmtDateInput(auction.startTime),
    endTime: fmtDateInput(auction.endTime),
    bidIncrement: String(auction.bidIncrement),
    startingPrice: String(auction.startingPrice),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Gavel size={18} className="text-nexus-600" /> Chỉnh sửa đấu giá
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {auction.status === "Scheduled" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Giá khởi điểm (VND)</label>
              <input
                type="number" value={form.startingPrice}
                onChange={e => setForm(f => ({ ...f, startingPrice: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Mức tăng tối thiểu (VND)</label>
            <input
              type="number" value={form.bidIncrement}
              onChange={e => setForm(f => ({ ...f, bidIncrement: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500"
            />
          </div>
          {auction.status === "Scheduled" && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Thời gian bắt đầu</label>
              <input
                type="datetime-local" value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Thời gian kết thúc {auction.status === "Active" && <span className="text-amber-600">(gia hạn/rút ngắn)</span>}
            </label>
            <input
              type="datetime-local" value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => onSave({
              startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
              endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
              bidIncrement: Number(form.bidIncrement) || undefined,
              startingPrice: form.startingPrice && auction.status === "Scheduled" ? Number(form.startingPrice) : undefined,
            })}
            className="flex-1 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Auction Bids Panel ────────────────────────────────────────────────────────
function AuctionBidsPanel({ auctionId }: { auctionId: string }) {
  const { data: bids, isLoading } = useQuery({
    queryKey: ["admin-bids", auctionId],
    queryFn: () => getBids(auctionId),
  });

  if (isLoading) return <div className="text-xs text-gray-400 py-2">Đang tải...</div>;
  if (!bids?.length) return <div className="text-xs text-gray-400 py-2">Chưa có lượt đặt giá nào.</div>;

  return (
    <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left px-3 py-2">Người đặt</th>
            <th className="text-right px-3 py-2">Giá</th>
            <th className="text-right px-3 py-2">Thời gian</th>
            <th className="text-center px-3 py-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {bids.map(b => (
            <tr key={b.id} className={b.isWinning ? "bg-emerald-50" : ""}>
              <td className="px-3 py-2 text-gray-700">{b.bidderEmail}</td>
              <td className="px-3 py-2 text-right font-semibold text-nexus-700">{fmtVND(b.amount)}</td>
              <td className="px-3 py-2 text-right text-gray-400">{fmtDate(b.createdAt)}</td>
              <td className="px-3 py-2 text-center">
                {b.isWinning
                  ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Đang dẫn</span>
                  : <span className="text-[10px] text-gray-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"products" | "auctions" | "categories" | "users" | "sellers">("products");

  // ── Products state ──────────────────────────────────────────────────────────
  const [productStatusFilter, setProductStatusFilter] = useState<ProductStatus | "all">("all");
  const [productSearch, setProductSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductData, setEditingProductData] = useState<{
    name: string; price: string; stockQuantity: string; description: string;
  }>({ name: "", price: "", stockQuantity: "", description: "" });
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: "", stockQuantity: "", categoryId: "",
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products", productStatusFilter, productSearch],
    queryFn: () => getAdminProducts({ status: productStatusFilter, search: productSearch || undefined, pageSize: 100 }),
    enabled: tab === "products",
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const createProductMutation = useMutation({
    mutationFn: () => createProduct({
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      stockQuantity: parseInt(newProduct.stockQuantity),
      categoryId: newProduct.categoryId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setNewProduct({ name: "", description: "", price: "", stockQuantity: "", categoryId: "" });
      toast.success("Đã tạo sản phẩm!");
    },
    onError: () => toast.error("Tạo sản phẩm thất bại"),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditingProductId(null);
      toast.success("Đã cập nhật sản phẩm!");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Đã xóa sản phẩm");
    },
    onError: () => toast.error("Không thể xóa sản phẩm này"),
  });

  const approveProductMutation = useMutation({
    mutationFn: approveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Đã duyệt sản phẩm!");
    },
    onError: () => toast.error("Duyệt thất bại"),
  });

  const hideProductMutation = useMutation({
    mutationFn: hideProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Đã ẩn sản phẩm");
    },
    onError: () => toast.error("Ẩn thất bại"),
  });

  const rejectProductMutation = useMutation({
    mutationFn: rejectProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Đã từ chối sản phẩm");
    },
    onError: () => toast.error("Từ chối thất bại"),
  });

  // ── Auctions state ──────────────────────────────────────────────────────────
  const [auctionStatusFilter, setAuctionStatusFilter] = useState<string>("all");
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [expandedBids, setExpandedBids] = useState<string | null>(null);

  const { data: auctionsData, isLoading: loadingAuctions } = useQuery({
    queryKey: ["admin-auctions", auctionStatusFilter],
    queryFn: () => getAuctions({
      pageSize: 50,
      status: auctionStatusFilter !== "all" ? auctionStatusFilter : undefined,
    }),
    enabled: tab === "auctions",
  });

  const updateAuctionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAuction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      setEditingAuction(null);
      toast.success("Đã cập nhật phiên đấu giá!");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const cancelAuctionMutation = useMutation({
    mutationFn: cancelAuction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      toast.success("Đã hủy phiên đấu giá");
    },
    onError: () => toast.error("Hủy thất bại"),
  });

  // ── Categories state ─────────────────────────────────────────────────────────
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  const createCatMutation = useMutation({
    mutationFn: () => createCategory({ name: newCatName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCatName("");
      toast.success("Đã tạo danh mục!");
    },
    onError: () => toast.error("Tạo danh mục thất bại"),
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCatId(null);
      toast.success("Đã cập nhật danh mục!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Cập nhật thất bại"),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã xóa danh mục!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Không thể xóa"),
  });

  // ── Users state ───────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [changingUserId, setChangingUserId] = useState<string | null>(null);
  const [lockingUserId, setLockingUserId] = useState<string | null>(null);

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users", userSearch],
    queryFn: () => getUsers({ search: userSearch || undefined, pageSize: 50 }),
    enabled: tab === "users",
  });

  const { data: roles = DEFAULT_ROLES } = useQuery<RoleOption[]>({
    queryKey: ["roles"],
    queryFn: getRoles,
    enabled: tab === "users",
    initialData: DEFAULT_ROLES,
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => {
      setChangingUserId(userId);
      return changeUserRole(userId, roleId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setPendingRoles(prev => { const n = { ...prev }; delete n[vars.userId]; return n; });
      toast.success("Đã cập nhật quyền!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Đổi quyền thất bại"),
    onSettled: () => setChangingUserId(null),
  });

  const toggleLockMutation = useMutation({
    mutationFn: (userId: string) => { setLockingUserId(userId); return toggleLockUser(userId); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(data.message || "Đã thay đổi trạng thái");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Thao tác thất bại"),
    onSettled: () => setLockingUserId(null),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Đã xóa tài khoản");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Không thể xóa"),
  });

  // ── Pending Sellers state ──────────────────────────────────────────────────
  const { data: pendingSellers = [], isLoading: loadingSellers } = useQuery<SellerProfile[]>({
    queryKey: ["pending-sellers"],
    queryFn: getPendingSellers,
    enabled: tab === "sellers",
  });

  const verifySellerMutation = useMutation({
    mutationFn: (sellerId: string) => verifySeller(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-sellers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Đã phê duyệt người bán thành công! Tài khoản đã được nâng cấp lên SELLER.");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Không thể phê duyệt người bán"),
  });

  // ── Tabs config ───────────────────────────────────────────────────────────────
  const TABS = [
    { id: "products",   label: "Sản phẩm",   icon: "📦" },
    { id: "auctions",   label: "Đấu giá",    icon: "🔨" },
    { id: "categories", label: "Danh mục",   icon: "🗂️" },
    { id: "users",      label: "Người dùng", icon: "👥" },
    { id: "sellers",    label: "Duyệt Người Bán", icon: "🏪" },
  ] as const;

  const PRODUCT_STATUS_TABS: { key: ProductStatus | "all"; label: string }[] = [
    { key: "all",      label: "Tất cả" },
    { key: "Pending",  label: "Chờ duyệt" },
    { key: "Approved", label: "Đã duyệt" },
    { key: "Hidden",   label: "Đã ẩn" },
    { key: "Rejected", label: "Từ chối" },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings size={26} className="text-nexus-600" />
          Quản trị hệ thống
        </h1>
        <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
          <Shield size={13} /> ADMIN — Toàn quyền
        </span>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.id
                ? "bg-white text-nexus-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: SẢN PHẨM ══════════════════════════════════════════════════════ */}
      {tab === "products" && (
        <div className="space-y-5">
          {/* Filter + Search bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {PRODUCT_STATUS_TABS.map(s => (
                <button key={s.key} onClick={() => setProductStatusFilter(s.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    productStatusFilter === s.key
                      ? "bg-white text-nexus-600 shadow-sm font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s.label}
                  {s.key === "Pending" && (
                    <span className="ml-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {products?.items.filter(p => p.status === "Pending").length ?? ""}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <input
              placeholder="Tìm sản phẩm..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500"
            />
          </div>

          {/* Add product form */}
          <details className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer font-semibold text-gray-700 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors list-none">
              <Plus size={16} className="text-nexus-600" /> Thêm sản phẩm mới
            </summary>
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Tên sản phẩm *" value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500" />
                <select value={newProduct.categoryId}
                  onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500 bg-white">
                  <option value="">Chọn danh mục</option>
                  {categories?.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                </select>
                <input placeholder="Giá (VND) *" type="number" value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500" />
                <input placeholder="Số lượng tồn kho *" type="number" value={newProduct.stockQuantity}
                  onChange={e => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500" />
                <textarea placeholder="Mô tả" value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  rows={2}
                  className="sm:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500 resize-none" />
              </div>
              <button onClick={() => createProductMutation.mutate()}
                disabled={createProductMutation.isPending || !newProduct.name || !newProduct.price}
                className="mt-3 bg-nexus-600 hover:bg-nexus-700 disabled:bg-gray-200 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {createProductMutation.isPending ? "Đang tạo..." : "Tạo sản phẩm"}
              </button>
            </div>
          </details>

          {/* Product list */}
          {loadingProducts ? <LoadingSpinner /> : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3">Sản phẩm</th>
                      <th className="text-left px-4 py-3">Người bán</th>
                      <th className="text-right px-4 py-3">Giá</th>
                      <th className="text-right px-4 py-3">Kho</th>
                      <th className="text-center px-4 py-3">Trạng thái</th>
                      <th className="text-right px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products?.items.map(p => (
                      <>
                        <tr key={p.productId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            {editingProductId === p.productId ? (
                              <div className="flex flex-col gap-1.5">
                                <input value={editingProductData.name}
                                  onChange={e => setEditingProductData(d => ({ ...d, name: e.target.value }))}
                                  className="border border-nexus-400 rounded px-2 py-1 text-xs ring-2 ring-nexus-100 outline-none w-full" />
                                <textarea value={editingProductData.description}
                                  onChange={e => setEditingProductData(d => ({ ...d, description: e.target.value }))}
                                  rows={2}
                                  className="border border-gray-200 rounded px-2 py-1 text-xs outline-none resize-none w-full" />
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium text-gray-800">{p.name}</p>
                                {p.description && <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {p.sellerName ?? p.sellerId.slice(0, 8) + "..."}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingProductId === p.productId ? (
                              <input type="number" value={editingProductData.price}
                                onChange={e => setEditingProductData(d => ({ ...d, price: e.target.value }))}
                                className="border border-gray-200 rounded px-2 py-1 text-xs text-right w-24 outline-none" />
                            ) : (
                              <span className="text-nexus-700 font-semibold">{fmtVND(p.price)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingProductId === p.productId ? (
                              <input type="number" value={editingProductData.stockQuantity}
                                onChange={e => setEditingProductData(d => ({ ...d, stockQuantity: e.target.value }))}
                                className="border border-gray-200 rounded px-2 py-1 text-xs text-right w-20 outline-none" />
                            ) : (
                              <span className="text-gray-500">{p.stockQuantity}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ProductStatusBadge status={p.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {editingProductId === p.productId ? (
                                <>
                                  <button onClick={() => updateProductMutation.mutate({
                                    id: p.productId,
                                    data: {
                                      name: editingProductData.name,
                                      description: editingProductData.description,
                                      price: parseFloat(editingProductData.price),
                                      stockQuantity: parseInt(editingProductData.stockQuantity),
                                    }
                                  })}
                                    disabled={updateProductMutation.isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors">
                                    <Check size={12} /> Lưu
                                  </button>
                                  <button onClick={() => setEditingProductId(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Duyệt: chỉ khi Pending hoặc Hidden */}
                                  {(p.status === "Pending" || p.status === "Hidden") && (
                                    <button onClick={() => approveProductMutation.mutate(p.productId)}
                                      disabled={approveProductMutation.isPending}
                                      title="Duyệt sản phẩm"
                                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors">
                                      <CheckCircle size={15} />
                                    </button>
                                  )}
                                  {/* Ẩn: chỉ khi Approved */}
                                  {p.status === "Approved" && (
                                    <button onClick={() => hideProductMutation.mutate(p.productId)}
                                      disabled={hideProductMutation.isPending}
                                      title="Ẩn sản phẩm khỏi sàn"
                                      className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                                      <EyeOff size={15} />
                                    </button>
                                  )}
                                  {/* Từ chối: chỉ khi Pending */}
                                  {p.status === "Pending" && (
                                    <button onClick={() => rejectProductMutation.mutate(p.productId)}
                                      disabled={rejectProductMutation.isPending}
                                      title="Từ chối sản phẩm"
                                      className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-1.5 rounded-lg transition-colors">
                                      <XCircle size={15} />
                                    </button>
                                  )}
                                  {/* Sửa */}
                                  <button onClick={() => {
                                    setEditingProductId(p.productId);
                                    setEditingProductData({
                                      name: p.name, description: p.description,
                                      price: String(p.price), stockQuantity: String(p.stockQuantity),
                                    });
                                  }}
                                    title="Sửa thông tin"
                                    className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                    <Edit2 size={15} />
                                  </button>
                                  {/* Xóa */}
                                  <button onClick={() => {
                                    if (confirm(`Xóa sản phẩm "${p.name}"?`)) deleteProductMutation.mutate(p.productId);
                                  }}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              {products && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                  Hiển thị <b>{products.items.length}</b> / <b>{products.totalCount}</b> sản phẩm
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: ĐẤU GIÁ ═══════════════════════════════════════════════════════ */}
      {tab === "auctions" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {["all", "Scheduled", "Active", "Ended"].map(s => (
              <button key={s} onClick={() => setAuctionStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  auctionStatusFilter === s
                    ? "bg-white text-nexus-600 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                {s === "all" ? "Tất cả" : s}
              </button>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <span>
              <b>Quy tắc:</b> Admin chỉ quản lý phiên đấu giá (chỉnh sửa thời gian, mức tăng giá, hủy) —
              không được tham gia đặt giá để đảm bảo công bằng.
            </span>
          </div>

          {loadingAuctions ? <LoadingSpinner /> : (
            <div className="space-y-3">
              {auctionsData?.items.map(a => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AuctionStatusBadge status={a.status} />
                        <span className="text-xs text-gray-400 font-mono">{a.id.slice(0, 12)}...</span>
                      </div>
                      <p className="font-semibold text-gray-800">Sản phẩm: {a.productId.slice(0, 8)}...</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs text-gray-600">
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide">Giá hiện tại</p>
                          <p className="font-bold text-nexus-700 text-sm">{fmtVND(a.currentPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide">Khởi điểm</p>
                          <p className="font-semibold">{fmtVND(a.startingPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide">Mức tăng tối thiểu</p>
                          <p className="font-semibold">{fmtVND(a.bidIncrement)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide">Tổng lượt đặt</p>
                          <p className="font-semibold">{a.totalBids}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide">Bắt đầu</p>
                          <p>{fmtDate(a.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium uppercase tracking-wide">Kết thúc</p>
                          <p className={a.status === "Active" ? "text-red-600 font-semibold" : ""}>{fmtDate(a.endTime)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {(a.status === "Scheduled" || a.status === "Active") && (
                        <>
                          <button onClick={() => setEditingAuction(a)}
                            className="flex items-center gap-1.5 bg-nexus-600 hover:bg-nexus-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            <Edit2 size={13} /> Chỉnh sửa
                          </button>
                          <button onClick={() => {
                            if (confirm("Hủy phiên đấu giá này?")) cancelAuctionMutation.mutate(a.id);
                          }}
                            disabled={cancelAuctionMutation.isPending}
                            className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                            <X size={13} /> Hủy phiên
                          </button>
                        </>
                      )}
                      <button onClick={() => setExpandedBids(expandedBids === a.id ? null : a.id)}
                        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                        <Eye size={13} />
                        {expandedBids === a.id ? "Ẩn bid" : `Xem ${a.totalBids} bid`}
                        {expandedBids === a.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Bid history - read only */}
                  {expandedBids === a.id && (
                    <AuctionBidsPanel auctionId={a.id} />
                  )}
                </div>
              ))}
              {!auctionsData?.items.length && (
                <div className="text-center py-12 text-gray-400">
                  <Gavel size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Không có phiên đấu giá nào</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: DANH MỤC ══════════════════════════════════════════════════════ */}
      {tab === "categories" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex gap-3">
            <input placeholder="Tên danh mục mới" value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newCatName.trim()) createCatMutation.mutate(); }}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500" />
            <button onClick={() => createCatMutation.mutate()}
              disabled={createCatMutation.isPending || !newCatName.trim()}
              className="bg-nexus-600 hover:bg-nexus-700 disabled:bg-gray-200 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5">
              {createCatMutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Plus size={16} /> Thêm</>}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 font-medium mb-3">Danh sách danh mục ({categories?.length ?? 0})</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {categories?.map(c => {
                const isEditing = editingCatId === c.categoryId;
                return (
                  <div key={c.categoryId}
                    className="flex items-center justify-between bg-gray-50 hover:bg-gray-100/70 border border-gray-200/60 rounded-lg px-3.5 py-2.5">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-1">
                        <input type="text" value={editingCatName}
                          onChange={e => setEditingCatName(e.target.value)}
                          className="flex-1 bg-white border border-nexus-400 rounded-md px-2.5 py-1 text-sm outline-none ring-2 ring-nexus-100" autoFocus
                          onKeyDown={e => {
                            if (e.key === "Enter" && editingCatName.trim()) updateCatMutation.mutate({ id: c.categoryId, name: editingCatName.trim() });
                            else if (e.key === "Escape") setEditingCatId(null);
                          }} />
                        <button onClick={() => { if (editingCatName.trim()) updateCatMutation.mutate({ id: c.categoryId, name: editingCatName.trim() }); }}
                          disabled={updateCatMutation.isPending || !editingCatName.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-md transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingCatId(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                          <span className="text-[10px] bg-white border border-gray-200 text-gray-400 font-mono px-1.5 py-0.5 rounded shrink-0">
                            {c.categoryId.slice(0, 6)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditingCatId(c.categoryId); setEditingCatName(c.name); }}
                            className="text-gray-400 hover:text-nexus-600 hover:bg-nexus-50 p-1.5 rounded-lg transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { if (confirm(`Xóa danh mục "${c.name}"?`)) deleteCatMutation.mutate(c.categoryId); }}
                            disabled={deleteCatMutation.isPending}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: NGƯỜI DÙNG ════════════════════════════════════════════════════ */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <input placeholder="Tìm theo tên hoặc email..."
              value={userSearch} onChange={e => setUserSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nexus-500" />
          </div>

          {loadingUsers ? <LoadingSpinner /> : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3">Người dùng</th>
                      <th className="text-center px-4 py-3">Xác thực</th>
                      <th className="text-center px-4 py-3">Trạng thái</th>
                      <th className="text-left px-4 py-3">Quyền hạn</th>
                      <th className="text-right px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {usersData?.items.map(u => {
                      const isCurrentUser = u.id === user?.userId;
                      const currentSelectedRoleId = pendingRoles[u.id] ?? u.roleId;
                      const hasChanged = currentSelectedRoleId !== u.roleId;
                      const isPendingThisUser = changeRoleMutation.isPending && changingUserId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
                                {u.avatarUrl
                                  ? <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                                  : <span>{u.fullName?.charAt(0)?.toUpperCase() || "U"}</span>}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                                  {u.fullName}
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-nexus-100 text-nexus-700 px-1.5 py-0.5 rounded font-medium">Bạn</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.isEmailVerified
                              ? <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={14} /> Đã xác thực</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle size={14} /> Chưa xác thực</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.isLocked
                              ? <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200"><Lock size={12} /> Bị khóa</span>
                              : <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200"><CheckCircle size={12} /> Hoạt động</span>}
                          </td>
                          <td className="px-4 py-3">
                            {isCurrentUser ? (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                                ADMIN (Tài khoản hiện tại)
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select value={currentSelectedRoleId}
                                  onChange={e => setPendingRoles(prev => ({ ...prev, [u.id]: e.target.value }))}
                                  disabled={isPendingThisUser}
                                  className={`border rounded-lg px-2.5 py-1 text-xs outline-none bg-white transition-all ${
                                    hasChanged ? "border-amber-400 ring-2 ring-amber-100 font-semibold text-amber-800" : "border-gray-200 text-gray-700"
                                  }`}>
                                  {roles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                                </select>
                                {hasChanged && (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => changeRoleMutation.mutate({ userId: u.id, roleId: currentSelectedRoleId })}
                                      disabled={isPendingThisUser}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors">
                                      {isPendingThisUser
                                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <><Check size={12} /> Đổi</>}
                                    </button>
                                    <button onClick={() => setPendingRoles(prev => { const n = { ...prev }; delete n[u.id]; return n; })}
                                      className="text-gray-400 hover:text-gray-600 p-1 rounded">
                                      <RotateCcw size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!isCurrentUser ? (
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => toggleLockMutation.mutate(u.id)}
                                  disabled={toggleLockMutation.isPending && lockingUserId === u.id}
                                  className={`p-1.5 rounded-lg transition-colors ${u.isLocked ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"}`}
                                  title={u.isLocked ? "Mở khóa" : "Khóa tài khoản"}>
                                  {toggleLockMutation.isPending && lockingUserId === u.id
                                    ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    : u.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                                </button>
                                <button onClick={() => { if (confirm(`Xóa tài khoản "${u.fullName}"?`)) deleteUserMutation.mutate(u.id); }}
                                  className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Đang sử dụng</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {usersData && (
                <div className="px-4 py-3 text-xs text-gray-500 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span>Tổng cộng: <b>{usersData.total}</b> tài khoản</span>
                  <span className="text-[11px] text-gray-400">* Chỉ ADMIN mới có thể phân quyền và xóa người dùng</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: DUYỆT NGƯỜI BÁN ══════════════════════════════════════════════ */}
      {tab === "sellers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Store size={20} className="text-nexus-600" />
              Yêu cầu đăng ký Shop chờ duyệt
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
              Chờ duyệt: <b>{pendingSellers.length}</b> shop
            </span>
          </div>

          {loadingSellers ? (
            <LoadingSpinner />
          ) : pendingSellers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
              <p className="font-semibold text-gray-600">Không có hồ sơ nào đang chờ duyệt</p>
              <p className="text-xs text-gray-400 mt-1">Tất cả yêu cầu mở Shop đã được xem xét và xử lý.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3">Tên Shop</th>
                      <th className="px-5 py-3">Mô tả</th>
                      <th className="px-5 py-3">Mã Tài Khoản</th>
                      <th className="px-5 py-3 text-center">Trạng thái</th>
                      <th className="px-5 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingSellers.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {s.shopName}
                          <div className="text-[11px] text-gray-400 font-mono font-normal">/{s.shopSlug}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 max-w-xs truncate">
                          {s.description || "Chưa có mô tả"}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-gray-500">
                          {s.userId}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                            <Clock size={11} /> Chờ duyệt
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Phê duyệt shop "${s.shopName}" và cấp quyền SELLER cho người dùng này?`)) {
                                verifySellerMutation.mutate(s.userId);
                              }
                            }}
                            disabled={verifySellerMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Check size={14} /> Phê duyệt Shop
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auction Edit Modal */}
      {editingAuction && (
        <AuctionEditModal
          auction={editingAuction}
          onClose={() => setEditingAuction(null)}
          onSave={data => updateAuctionMutation.mutate({ id: editingAuction.id, data })}
        />
      )}
    </div>
  );
}
