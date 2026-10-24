// ============================================================
// CartContext - quản lý giỏ hàng cho cả guest lẫn logged-in
//
// Guest (chưa đăng nhập):  lưu vào localStorage
// Logged-in:               dùng backend API CommerceService
// Khi login:               tự động merge guest cart → backend
// ============================================================
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { addToCart } from "@shared/api/commerce";

// Cấu trúc 1 item trong guest cart
export interface GuestCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stockQuantity?: number;
}

interface CartContextType {
  guestCart: GuestCartItem[];
  guestCartCount: number;                                    // tổng số lượng sản phẩm
  addToGuestCart: (item: GuestCartItem) => void;             // thêm/cộng dồn vào guest cart
  updateGuestCartQuantity: (productId: string, quantity: number) => void; // cập nhật số lượng
  removeFromGuestCart: (productId: string) => void;          // xóa khỏi guest cart
  clearGuestCart: () => void;                                // xóa toàn bộ
  mergeGuestCartToBackend: () => Promise<void>;              // dùng sau khi login
}

const CartContext = createContext<CartContextType | null>(null);

// Đọc guest cart từ localStorage (có try/catch phòng private browsing)
function loadGuestCart(): GuestCartItem[] {
  try {
    const saved = localStorage.getItem("nexus_guest_cart");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Ghi guest cart vào localStorage
function saveGuestCart(items: GuestCartItem[]) {
  try {
    localStorage.setItem("nexus_guest_cart", JSON.stringify(items));
  } catch {
    // Ignore nếu localStorage bị block (private mode, quota đầy...)
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Khởi tạo từ localStorage khi load lần đầu
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>(loadGuestCart);

  // Thêm sản phẩm vào guest cart — nếu đã có thì cộng dồn số lượng (giới hạn theo stock)
  const addToGuestCart = useCallback((item: GuestCartItem) => {
    setGuestCart((prev) => {
      const maxStock = item.stockQuantity ?? 99;
      const existing = prev.find((i) => i.productId === item.productId);
      const next = existing
        ? prev.map((i) =>
            i.productId === item.productId
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + item.quantity, maxStock),
                  stockQuantity: item.stockQuantity ?? i.stockQuantity,
                  imageUrl: item.imageUrl || i.imageUrl,
                }
              : i
          )
        : [...prev, { ...item, quantity: Math.min(item.quantity, maxStock) }];
      saveGuestCart(next);
      return next;
    });
  }, []);

  // Cập nhật số lượng của 1 sản phẩm trong guest cart
  const updateGuestCartQuantity = useCallback((productId: string, quantity: number) => {
    setGuestCart((prev) => {
      if (quantity <= 0) {
        const next = prev.filter((i) => i.productId !== productId);
        saveGuestCart(next);
        return next;
      }
      const next = prev.map((i) => {
        if (i.productId === productId) {
          const maxStock = i.stockQuantity ?? 99;
          return { ...i, quantity: Math.min(quantity, maxStock) };
        }
        return i;
      });
      saveGuestCart(next);
      return next;
    });
  }, []);

  // Xóa 1 item khỏi guest cart
  const removeFromGuestCart = useCallback((productId: string) => {
    setGuestCart((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      saveGuestCart(next);
      return next;
    });
  }, []);

  // Xóa sạch guest cart (sau khi merge hoặc user muốn clear)
  const clearGuestCart = useCallback(() => {
    setGuestCart([]);
    try {
      localStorage.removeItem("nexus_guest_cart");
    } catch {}
  }, []);

  // Gọi hàm này ngay sau khi login thành công để đẩy guest cart lên backend
  // Promise.allSettled để không bị lỗi nếu 1 item thất bại (vd: sản phẩm đã xóa)
  const mergeGuestCartToBackend = useCallback(async () => {
    const items = loadGuestCart();
    if (!items.length) return;

    await Promise.allSettled(
      items.map((item) =>
        addToCart({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          stockQuantity: item.stockQuantity,
        })
      )
    );

    // Dù thành công hay thất bại, xóa guest cart để không merge lại lần sau
    clearGuestCart();
  }, [clearGuestCart]);

  // Tổng số lượng sản phẩm trong guest cart (dùng cho badge trên Navbar)
  const guestCartCount = guestCart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        guestCart,
        guestCartCount,
        addToGuestCart,
        updateGuestCartQuantity,
        removeFromGuestCart,
        clearGuestCart,
        mergeGuestCartToBackend,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook tiện dùng — throw nếu quên bọc CartProvider
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải dùng bên trong CartProvider");
  return ctx;
}
