import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";
import { useCart } from "@app/providers/CartContext";
import {
  ShoppingCart, LogOut, Package, Gavel, Settings,
  Search, Home, ChevronDown, Store, Bell
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "@shared/api/commerce";
import { getCategories } from "@shared/api/catalog";
import NotificationBell from "@widgets/notification-bell";

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const { guestCartCount } = useCart();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: backendCart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isLoggedIn && user?.role === "BUYER",
    staleTime: 30_000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  const backendCartCount = backendCart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const totalCartCount = isLoggedIn ? backendCartCount : guestCartCount;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/?search=${encodeURIComponent(searchText.trim())}`);
    }
  };
  const handleLogout = () => { logout(); navigate("/"); };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Hot search suggestions (static, Shopee-like)
  const HOT_SEARCHES = ["Áo thun", "Laptop gaming", "Tai nghe", "Son môi", "Giày thể thao"];

  return (
    <nav className="sticky top-0 z-50 shadow-md">
      {/* ── Top mini bar (like Shopee) ─────────────────────────────────── */}
      <div className="bg-nexus-600 text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isLoggedIn && (user?.role === "SELLER" || user?.role === "ADMIN") && (
              <Link to="/seller/dashboard" className="hover:text-nexus-200 flex items-center gap-1 transition-colors">
                <Store size={11} /> Kênh Người Bán
              </Link>
            )}
            {isLoggedIn && user?.role === "BUYER" && (
              <Link to="/seller/register" className="hover:text-nexus-200 flex items-center gap-1 transition-colors">
                <Store size={11} /> Đăng ký bán hàng
              </Link>
            )}
            {isLoggedIn && <span className="text-nexus-400">|</span>}
            <Link to="/auctions" className="hover:text-nexus-200 flex items-center gap-1 transition-colors">
              <Gavel size={11} /> Đấu Giá
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {!isLoggedIn && (
              <>
                <Link to="/register" className="hover:text-nexus-200 transition-colors">Đăng Ký</Link>
                <span className="text-nexus-400">|</span>
                <Link to="/login" className="hover:text-nexus-200 transition-colors">Đăng Nhập</Link>
              </>
            )}
            {isLoggedIn && (
              <span className="text-nexus-200">Xin chào, {user?.displayName?.split(" ").pop()}!</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main nav ───────────────────────────────────────────────────── */}
      <div className="bg-nexus-500 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-white rounded-lg p-1.5 shadow-sm">
              <Package size={22} className="text-nexus-500" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight hidden sm:block">
              Nexus
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-auto">
            <form onSubmit={handleSearch}>
              <div className="flex rounded-sm overflow-hidden shadow-sm bg-white">
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                  className="flex-1 px-4 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 min-w-0"
                />
                <button
                  type="submit"
                  className="bg-nexus-400 hover:bg-nexus-600 text-white px-6 flex items-center gap-1.5 font-medium text-sm shrink-0 transition-colors"
                >
                  <Search size={16} />
                  <span className="hidden sm:block">Tìm</span>
                </button>
              </div>
            </form>

            {/* Hot searches */}
            <div className="flex items-center gap-1 mt-1 overflow-hidden">
              {HOT_SEARCHES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setSearchText(s); navigate(`/?search=${encodeURIComponent(s)}`); }}
                  className="text-[10px] text-white/75 hover:text-white whitespace-nowrap transition-colors px-1"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-white shrink-0">
            {/* Cart — ẩn với SELLER và ADMIN */}
            {(!isLoggedIn || (user?.role !== "SELLER" && user?.role !== "ADMIN")) && (
              <Link
                to="/cart"
                className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity relative"
              >
                <div className="relative">
                  <ShoppingCart size={24} />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-white text-nexus-500 text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border border-nexus-500 px-0.5">
                      {totalCartCount > 99 ? "99+" : totalCartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] hidden sm:block">Giỏ hàng</span>
              </Link>
            )}

            {/* Notification bell */}
            {isLoggedIn && <NotificationBell />}

            {/* User menu */}
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-nexus-600 border-2 border-white/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.displayName?.charAt(0)?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-1">
                    <p className="text-xs font-semibold truncate max-w-[90px]">{user?.displayName}</p>
                    <ChevronDown size={12} className={`transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm">{user?.displayName}</p>
                      <p className="text-xs text-gray-400">{user?.role}</p>
                    </div>
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nexus-50 hover:text-nexus-600 transition-colors">
                      <Package size={15} /> Tài khoản của tôi
                    </Link>
                    {user?.role === "BUYER" && (
                      <Link to="/orders" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nexus-50 hover:text-nexus-600 transition-colors">
                        <Package size={15} /> Đơn mua
                      </Link>
                    )}
                    {user?.role === "BUYER" && (
                      <Link to="/seller/register" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nexus-50 hover:text-nexus-600 transition-colors">
                        <Store size={15} /> Đăng ký bán hàng
                      </Link>
                    )}
                    {(user?.role === "SELLER" || user?.role === "ADMIN") && (
                      <Link to="/seller/dashboard" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nexus-50 hover:text-nexus-600 transition-colors">
                        <Settings size={15} /> Kênh bán hàng
                      </Link>
                    )}
                    {user?.role === "ADMIN" && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nexus-50 hover:text-nexus-600 transition-colors">
                        <Settings size={15} /> Quản trị hệ thống
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-sm transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register"
                  className="text-sm font-semibold text-nexus-500 bg-white hover:bg-nexus-50 px-4 py-1.5 rounded-sm transition-colors">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Category nav bar ───────────────────────────────────────────── */}
      <div className="bg-nexus-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
            <Link to="/"
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-nexus-700 transition-colors whitespace-nowrap shrink-0">
              <Home size={13} /> Trang chủ
            </Link>
            <Link to="/auctions"
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-nexus-700 transition-colors whitespace-nowrap shrink-0">
              <Gavel size={13} /> Đấu giá
            </Link>
            {isLoggedIn && user?.role === "BUYER" && (
              <Link to="/orders"
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-nexus-700 transition-colors whitespace-nowrap shrink-0">
                <Package size={13} /> Đơn hàng
              </Link>
            )}
            <span className="mx-1 text-nexus-400 text-xs shrink-0">|</span>
            {categories?.slice(0, 8).map(c => (
              <button
                key={c.categoryId}
                onClick={() => navigate(`/?cat=${c.categoryId}`)}
                className="px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-nexus-700 transition-colors whitespace-nowrap shrink-0"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
