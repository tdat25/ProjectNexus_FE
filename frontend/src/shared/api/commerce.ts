import { commerceClient } from "./client";

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
  stockQuantity?: number;
}
export interface Cart {
  cartId: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
}
export interface Order {
  orderId: string;
  userId?: string;
  status: string;
  deliveryType?: string;
  totalAmount: number;
  shippingFee?: number;
  items: CartItem[];
  createdAt: string;
  shippingAddress?: string;
  paymentRef?: string;
  auctionId?: string;
  cancellationReason?: string;
  estimatedDelivery?: string; // ISO string
}

export type DeliveryType = "Standard" | "Express" | "PreOrder";

export interface CheckoutPayload {
  recipientName: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  toDistrictId: number;
  toWardCode: string;
  shippingFee: number;
  paymentMethod: "COD" | "VNPAY" | "MOMO";
  deliveryType?: DeliveryType;
  serviceTypeId?: number;   // GHN: 1=express, 2=standard
  isInternational?: boolean;
  selectedItems?: CartItem[];
}

export interface CheckoutResult {
  orderId: string;
  paymentUrl?: string;
  totalAmount: number;
  estimatedDelivery?: string;
  deliveryTypeLabel?: string;
}

// ── Mock Cart & Orders Storage Fallback (Hoạt động mượt mà khi BE offline) ───

const MOCK_STORAGE_KEY_CART = "nexus_backend_cart_mock";
const MOCK_STORAGE_KEY_ORDERS = "nexus_user_orders";

const DEFAULT_MOCK_ITEMS: CartItem[] = [
  {
    productId: "prod-001",
    productName: "Sony PlayStation 5 Slim 1TB Chính Hãng",
    unitPrice: 12490000,
    quantity: 1,
    subtotal: 12490000,
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
    stockQuantity: 15,
  },
  {
    productId: "prod-002",
    productName: "Bàn phím cơ không dây Keychron Q1 Pro QMK/VIA",
    unitPrice: 3890000,
    quantity: 1,
    subtotal: 3890000,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    stockQuantity: 8,
  },
];

function getLocalBackendCart(): Cart {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY_CART);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initialCart: Cart = {
    cartId: "cart-mock-001",
    userId: "user-001",
    items: DEFAULT_MOCK_ITEMS,
    totalAmount: DEFAULT_MOCK_ITEMS.reduce((s, i) => s + i.subtotal, 0),
  };
  saveLocalBackendCart(initialCart);
  return initialCart;
}

function saveLocalBackendCart(cart: Cart) {
  try {
    cart.totalAmount = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    localStorage.setItem(MOCK_STORAGE_KEY_CART, JSON.stringify(cart));
  } catch {}
}

const DEFAULT_MOCK_ORDERS: Order[] = [
  {
    orderId: "ORD-984210",
    userId: "user-001",
    status: "Delivered",
    deliveryType: "Standard",
    totalAmount: 12520000,
    shippingFee: 30000,
    items: [
      {
        productId: "prod-001",
        productName: "Sony PlayStation 5 Slim 1TB Chính Hãng",
        unitPrice: 12490000,
        quantity: 1,
        subtotal: 12490000,
        imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
        stockQuantity: 15,
      },
    ],
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    shippingAddress: "50 Lê Văn Việt, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh",
    paymentRef: "COD-984210",
  },
  {
    orderId: "ORD-871402",
    userId: "user-001",
    status: "Shipped",
    deliveryType: "Express",
    totalAmount: 4350000,
    shippingFee: 60000,
    items: [
      {
        productId: "prod-003",
        productName: "Tai nghe Sony WH-1000XM5 Chống Ồn Cao Cấp",
        unitPrice: 4290000,
        quantity: 1,
        subtotal: 4290000,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        stockQuantity: 20,
      },
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    shippingAddress: "50 Lê Văn Việt, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh",
    paymentRef: "COD-871402",
  },
];

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY_ORDERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    localStorage.setItem(MOCK_STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_MOCK_ORDERS));
  } catch {}
  return DEFAULT_MOCK_ORDERS;
}

function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY_ORDERS, JSON.stringify(orders));
  } catch {}
}

// ── Giỏ hàng ─────────────────────────────────────────────────────────────────

export const getCart = async (): Promise<Cart> => {
  try {
    const res = await commerceClient.get<Cart>("/api/v1/cart");
    return res.data;
  } catch {
    return getLocalBackendCart();
  }
};

export const addToCart = async (data: {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  stockQuantity?: number;
}): Promise<{ cartId: string; itemCount: number; subtotal: number }> => {
  try {
    const res = await commerceClient.post<{ cartId: string; itemCount: number; subtotal: number }>(
      "/api/v1/cart/items",
      data
    );
    return res.data;
  } catch {
    const cart = getLocalBackendCart();
    const existing = cart.items.find((i) => i.productId === data.productId);
    const maxStock = data.stockQuantity ?? 99;
    if (existing) {
      existing.quantity = Math.min(existing.quantity + data.quantity, maxStock);
      existing.subtotal = existing.quantity * existing.unitPrice;
      if (data.imageUrl) existing.imageUrl = data.imageUrl;
      if (data.stockQuantity) existing.stockQuantity = data.stockQuantity;
    } else {
      cart.items.push({
        productId: data.productId,
        productName: data.productName,
        unitPrice: data.unitPrice,
        quantity: Math.min(data.quantity, maxStock),
        subtotal: data.unitPrice * Math.min(data.quantity, maxStock),
        imageUrl: data.imageUrl,
        stockQuantity: data.stockQuantity,
      });
    }
    saveLocalBackendCart(cart);
    return {
      cartId: cart.cartId,
      itemCount: cart.items.length,
      subtotal: cart.totalAmount,
    };
  }
};

export const updateCartItemQuantity = async (productId: string, quantity: number): Promise<void> => {
  try {
    await commerceClient.put(`/api/v1/cart/items/${productId}`, { quantity });
  } catch {
    const cart = getLocalBackendCart();
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      const item = cart.items.find((i) => i.productId === productId);
      if (item) {
        const maxStock = item.stockQuantity ?? 99;
        item.quantity = Math.min(quantity, maxStock);
        item.subtotal = item.quantity * item.unitPrice;
      }
    }
    saveLocalBackendCart(cart);
  }
};

export const removeFromCart = async (productId: string): Promise<void> => {
  try {
    await commerceClient.delete(`/api/v1/cart/items/${productId}`);
  } catch {
    const cart = getLocalBackendCart();
    cart.items = cart.items.filter((i) => i.productId !== productId);
    saveLocalBackendCart(cart);
  }
};

export const clearCart = async (productIds?: string[]): Promise<void> => {
  try {
    if (productIds && productIds.length > 0) {
      await Promise.allSettled(productIds.map((id) => commerceClient.delete(`/api/v1/cart/items/${id}`)));
    } else {
      await commerceClient.delete("/api/v1/cart");
    }
  } catch {
    const cart = getLocalBackendCart();
    if (productIds && productIds.length > 0) {
      cart.items = cart.items.filter((i) => !productIds.includes(i.productId));
    } else {
      cart.items = [];
    }
    saveLocalBackendCart(cart);
  }
};

// ── Đặt hàng ─────────────────────────────────────────────────────────────────

export const checkout = async (data: CheckoutPayload): Promise<CheckoutResult> => {
  try {
    const res = await commerceClient.post<CheckoutResult>("/api/v1/cart/checkout", data);
    return res.data;
  } catch {
    // Mock checkout fallback
    const cart = getLocalBackendCart();
    const itemsToBuy = data.selectedItems && data.selectedItems.length > 0 ? data.selectedItems : cart.items;
    const itemsSubtotal = itemsToBuy.reduce((s, i) => s + i.subtotal, 0);
    const totalAmount = itemsSubtotal + data.shippingFee;
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      orderId,
      userId: "user-001",
      status: "Confirmed",
      deliveryType: data.deliveryType ?? "Standard",
      totalAmount,
      shippingFee: data.shippingFee,
      items: itemsToBuy,
      createdAt: new Date().toISOString(),
      shippingAddress: `${data.address}, ${data.ward}, ${data.district}, ${data.province}`,
      paymentRef: `${data.paymentMethod}-${orderId}`,
    };

    const currentOrders = getLocalOrders();
    saveLocalOrders([newOrder, ...currentOrders]);

    // Xóa những sản phẩm đã đặt khỏi giỏ
    const boughtIds = itemsToBuy.map((i) => i.productId);
    await clearCart(boughtIds);

    return {
      orderId,
      paymentUrl: data.paymentMethod === "VNPAY" ? `/payment?orderId=${orderId}` : undefined,
      totalAmount,
      deliveryTypeLabel:
        data.deliveryType === "Express"
          ? "Hỏa tốc (trong ngày)"
          : data.deliveryType === "PreOrder"
          ? "Hàng đặt trước / nhập khẩu"
          : "Giao hàng tiêu chuẩn",
    };
  }
};

// ── Đơn hàng ─────────────────────────────────────────────────────────────────

export const getOrders = async (params?: { page?: number; pageSize?: number }): Promise<{ items: Order[]; totalCount: number }> => {
  try {
    const res = await commerceClient.get<{ items: Order[]; totalCount: number }>("/api/v1/orders", { params });
    return res.data;
  } catch {
    const orders = getLocalOrders();
    return {
      items: orders,
      totalCount: orders.length,
    };
  }
};

export const getOrder = async (orderId: string): Promise<Order> => {
  try {
    const res = await commerceClient.get<Order>(`/api/v1/orders/${orderId}`);
    return res.data;
  } catch {
    const orders = getLocalOrders();
    const found = orders.find((o) => o.orderId === orderId);
    if (!found) throw new Error("Order not found");
    return found;
  }
};

export const cancelOrder = async (orderId: string, reason: string): Promise<void> => {
  try {
    await commerceClient.delete(`/api/v1/orders/${orderId}`, { data: { reason } });
  } catch {
    const orders = getLocalOrders();
    const next = orders.map((o) => (o.orderId === orderId ? { ...o, status: "Cancelled", cancellationReason: reason } : o));
    saveLocalOrders(next);
  }
};

export const confirmPayment = async (orderId: string, paymentRef?: string): Promise<{ success: boolean }> => {
  try {
    const res = await commerceClient.post<{ success: boolean }>("/api/v1/payment/callback", {
      orderId,
      paymentRef: paymentRef ?? `PAY-${orderId}`,
    });
    return res.data;
  } catch {
    const orders = getLocalOrders();
    const next = orders.map((o) => (o.orderId === orderId ? { ...o, status: "Paid" } : o));
    saveLocalOrders(next);
    return { success: true };
  }
};

export const getCancellationReasons = async (): Promise<string[]> => {
  try {
    const res = await commerceClient.get<string[]>("/api/v1/orders/cancellation-reasons");
    return res.data;
  } catch {
    return [
      "Tôi muốn thay đổi địa chỉ nhận hàng",
      "Tôi muốn đổi hình thức thanh toán",
      "Tôi muốn thay đổi sản phẩm trong đơn",
      "Thời gian giao hàng quá lâu",
      "Tôi tìm thấy giá tốt hơn ở nơi khác",
      "Lý do khác",
    ];
  }
};

export interface OrderHistoryEntry {
  status: string;
  note?: string;
  actor?: string;
  createdAt: string;
}

export const getOrderHistory = async (orderId: string): Promise<OrderHistoryEntry[]> => {
  try {
    const res = await commerceClient.get<OrderHistoryEntry[]>(`/api/v1/orders/${orderId}/history`);
    return res.data;
  } catch {
    return [
      { status: "Confirmed", note: "Đơn hàng đã được xác nhận tự động", actor: "System", createdAt: new Date(Date.now() - 3600000).toISOString() },
      { status: "Processing", note: "Người bán đang đóng gói sản phẩm", actor: "Seller", createdAt: new Date(Date.now() - 1800000).toISOString() },
      { status: "ReadyToShip", note: "Bàn giao cho đơn vị vận chuyển", actor: "Warehouse", createdAt: new Date().toISOString() },
    ];
  }
};
