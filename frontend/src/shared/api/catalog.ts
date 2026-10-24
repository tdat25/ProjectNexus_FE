// ============================================================
// API calls cho CatalogService - sản phẩm, danh mục
// ============================================================
import { catalogClient } from "./client";

export interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  categoryName?: string;
  sellerId: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Category {
  categoryId: string;
  name: string;
  parentCategoryId?: string;
}

export interface ProductListResponse {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
}

import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@shared/mock/mockData";

const STORAGE_KEY_PRODUCTS = "nexus_custom_products";

function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_PRODUCTS;
}

function saveStoredProducts(products: Product[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch {}
}

// Lấy danh sách sản phẩm, có thể lọc theo category hoặc tìm kiếm
export const getProducts = (params?: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
}) =>
  catalogClient
    .get<ProductListResponse>("/api/v1/products", { params: {
      page: params?.page,
      pageSize: params?.pageSize,
      categoryId: params?.categoryId,
      keyword: params?.search,  // backend dùng "keyword" thay vì "search"
    }})
    .then((r) => r.data)
    .catch(() => {
      // Fallback sang mock data khi backend Gateway chưa chạy
      let items = getStoredProducts();
      if (params?.categoryId) {
        items = items.filter(p => p.categoryId === params.categoryId);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        items = items.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
      }
      return {
        items,
        totalCount: items.length,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      };
    });

// Xem chi tiết một sản phẩm
export const getProduct = (id: string) =>
  catalogClient
    .get<Product>(`/api/v1/products/${id}`)
    .then((r) => r.data)
    .catch(() => {
      const items = getStoredProducts();
      const found = items.find(p => p.productId === id);
      return found ?? items[0];
    });

// Tạo sản phẩm mới (chỉ SELLER/ADMIN)
export const createProduct = (data: {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl?: string;
}) =>
  catalogClient
    .post<Product>("/api/v1/products", data)
    .then((r) => r.data)
    .catch(() => {
      const items = getStoredProducts();
      const newProd: Product = {
        productId: `prod-${Date.now().toString().slice(-4)}`,
        name: data.name,
        description: data.description,
        price: data.price,
        stockQuantity: data.stockQuantity,
        categoryId: data.categoryId,
        sellerId: "user-001",
        imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
      };
      saveStoredProducts([newProd, ...items]);
      return newProd;
    });

// Sửa sản phẩm
export const updateProduct = (id: string, data: Partial<Product>) =>
  catalogClient
    .put<Product>(`/api/v1/products/${id}`, data)
    .then((r) => r.data)
    .catch(() => {
      const items = getStoredProducts();
      const next = items.map((p) => (p.productId === id ? { ...p, ...data } : p));
      saveStoredProducts(next);
      return next.find((p) => p.productId === id) || (data as Product);
    });

// Xóa sản phẩm
export const deleteProduct = (id: string) =>
  catalogClient
    .delete(`/api/v1/products/${id}`)
    .catch(() => {
      const items = getStoredProducts();
      const next = items.filter((p) => p.productId !== id);
      saveStoredProducts(next);
    });

// Lấy tất cả danh mục
export const getCategories = () =>
  catalogClient
    .get<Category[]>("/api/v1/categories")
    .then((r) => r.data)
    .catch(() => MOCK_CATEGORIES);

// Tạo danh mục mới (ADMIN)
export const createCategory = (data: { name: string; parentCategoryId?: string }) =>
  catalogClient.post<Category>("/api/v1/categories", data).then((r) => r.data);
