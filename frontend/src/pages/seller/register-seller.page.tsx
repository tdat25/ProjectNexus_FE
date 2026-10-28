import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { registerSeller } from "@shared/api/auth";
import { useAuth } from "@app/providers/AuthContext";
import toast from "react-hot-toast";
import { Store, FileText, CheckCircle, ArrowRight } from "lucide-react";

export default function RegisterSellerPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: () => registerSeller({ shopName: form.shopName.trim(), description: form.description.trim() }),
    onSuccess: (data) => {
      toast.success(data.message || "Đăng ký shop thành công! Hồ sơ đang chờ Admin phê duyệt.");
      setDone(true);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại.");
    },
  });

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-5">
            <Clock size={44} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Đăng ký Shop đang chờ duyệt!
          </h2>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Hồ sơ mở Shop <strong>"{form.shopName}"</strong> của bạn đã được ghi nhận và đang chờ Ban Quản Trị phê duyệt.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 mb-6 text-left leading-relaxed">
            Sau khi được Ban Quản Trị phê duyệt, tài khoản của bạn sẽ tự động chuyển thành Người Bán (SELLER) và mở khóa toàn bộ tính năng đăng bán sản phẩm.
          </div>
          <Link to="/" replace
            className="inline-flex items-center justify-center gap-2 bg-nexus-600 hover:bg-nexus-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full shadow-md">
            Quay về Trang chủ <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // Đã là seller/admin → không cần đăng ký nữa
  if (user?.role === "SELLER" || user?.role === "ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-5">
            <CheckCircle size={44} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Bạn đã là người bán!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Tài khoản của bạn đã có quyền bán hàng trên Nexus.
          </p>
          <Link to="/seller/dashboard" replace
            className="inline-flex items-center gap-2 bg-nexus-600 hover:bg-nexus-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Vào Kênh Người Bán <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = form.shopName.trim().length >= 3 && form.description.trim().length >= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-nexus-50 to-white py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-nexus-600 rounded-2xl shadow-lg mb-4">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng ký mở Shop</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bắt đầu bán hàng trên Nexus ngay hôm nay!
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "🛒", label: "Đăng bán sản phẩm" },
            { icon: "📊", label: "Quản lý đơn hàng" },
            { icon: "🔨", label: "Tạo phiên đấu giá" },
          ].map((b) => (
            <div key={b.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{b.icon}</div>
              <p className="text-xs text-gray-600 font-medium">{b.label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-5">
          {/* Shop name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Tên cửa hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
              placeholder="VD: Shop Thời Trang Việt"
              maxLength={100}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition"
              autoFocus
            />
            <p className="text-xs text-gray-400">Tối thiểu 3 ký tự. Tên shop phải là duy nhất trên hệ thống.</p>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400" />
              Giới thiệu về cửa hàng <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn về cửa hàng, sản phẩm chính, chính sách bán hàng..."
              rows={4}
              maxLength={500}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{form.description.length}/500 ký tự (tối thiểu 10)</p>
          </div>

          {/* Terms note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <a href="/policy" className="underline font-medium">Chính sách bán hàng</a>{" "}
              của Nexus. Tài khoản sẽ được nâng cấp lên quyền <strong>Người Bán</strong> ngay sau khi hoàn tất.
            </p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="bg-nexus-600 hover:bg-nexus-700 disabled:bg-nexus-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Store size={18} />
                Đăng ký mở Shop ngay
              </>
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors text-center"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
