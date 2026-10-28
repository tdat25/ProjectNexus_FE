// ============================================================
// API calls cho CatalogService - sản phẩm, danh mục
// ============================================================
import { catalogClient } from "./client";

export type ProductStatus = "Pending" | "Approved" | "Hidden" | "Rejected";

export interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  categoryName?: string;
  sellerId: string;
  sellerName?: string;
  imageUrl?: string;
  createdAt: string;
  status?: ProductStatus;
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

// Lấy danh sách sản phẩm, có thể lọc theo category hoặc tìm kiếm
export const getProducts = (params?: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  status?: ProductStatus | "all";
}) =>
  catalogClient
    .get<ProductListResponse>("/api/v1/products", { params: {
      page: params?.page,
      pageSize: params?.pageSize,
      categoryId: params?.categoryId,
      keyword: params?.search,
      status: params?.status,
    }})
    .then((r) => r.data);

// Admin: lấy tất cả sản phẩm (kể cả Pending/Hidden)
export const getAdminProducts = (params?: {
  page?: number;
  pageSize?: number;
  status?: ProductStatus | "all";
  search?: string;
}) =>
  catalogClient
    .get<ProductListResponse>("/api/v1/admin/products", { params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 50,
      status: params?.status !== "all" ? params?.status : undefined,
      keyword: params?.search,
    }})
    .then((r) => r.data)
    .catch(() =>
      // fallback: dùng endpoint thường nếu admin endpoint chưa có
      catalogClient
        .get<ProductListResponse>("/api/v1/products", { params: {
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 50,
        }})
        .then((r) => r.data)
    );

// Admin: duyệt sản phẩm (Pending → Approved)
export const approveProduct = (id: string) =>
  catalogClient.patch(`/api/v1/products/${id}/approve`).then((r) => r.data);

// Admin: ẩn sản phẩm (Approved → Hidden)
export const hideProduct = (id: string) =>
  catalogClient.patch(`/api/v1/products/${id}/hide`).then((r) => r.data);

// Admin: từ chối sản phẩm (Pending → Rejected)
export const rejectProduct = (id: string) =>
  catalogClient.patch(`/api/v1/products/${id}/reject`).then((r) => r.data);

// Xem chi tiết một sản phẩm
export const getProduct = (id: string) =>
  catalogClient.get<Product>(`/api/v1/products/${id}`).then((r) => r.data);

// Tạo sản phẩm mới (chỉ SELLER/ADMIN)
export const createProduct = (data: {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl?: string;
}) => catalogClient.post<Product>("/api/v1/products", data).then((r) => r.data);

// Sửa sản phẩm
export const updateProduct = (id: string, data: Partial<Product>) =>
  catalogClient.put<Product>(`/api/v1/products/${id}`, data).then((r) => r.data);

// Xóa sản phẩm
export const deleteProduct = (id: string) =>
  catalogClient.delete(`/api/v1/products/${id}`);

// Lấy tất cả danh mục
export const getCategories = () =>
  catalogClient.get<Category[]>("/api/v1/categories").then((r) => r.data);

// Tạo danh mục mới (ADMIN / SELLER)
export const createCategory = (data: { name: string; parentCategoryId?: string }) =>
  catalogClient.post<Category>("/api/v1/categories", data).then((r) => r.data);

// Cập nhật / đổi tên danh mục
export const updateCategory = (id: string, name: string) =>
  catalogClient.put(`/api/v1/categories/${id}`, { name });

// Xóa danh mục
export const deleteCategory = (id: string) =>
  catalogClient.delete(`/api/v1/categories/${id}`);

