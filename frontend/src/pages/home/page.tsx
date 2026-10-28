import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { getProducts, getCategories } from "@shared/api/catalog";
import { addToCart } from "@shared/api/commerce";
import { useAuth } from "@app/providers/AuthContext";
import { useCart } from "@app/providers/CartContext";
import ProductCard from "@shared/ui/ProductCard";
import toast from "react-hot-toast";
import {
  Flame, ChevronRight, ChevronLeft, ShoppingCart,
  Zap, ShieldCheck, RotateCcw, Headphones, Tag,
  Star, X, TrendingUp, Gift, Award, Clock
} from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
const pad = (n: number) => String(n).padStart(2, "0");

// ── Hero banners ──────────────────────────────────────────────────────────────
const HERO_BANNERS = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=420&fit=crop&auto=format&q=85",
    title: "Siêu Sale Cuối Năm 2025",
    sub: "Giảm đến 70% — Hàng nghìn sản phẩm chính hãng mỗi ngày",
    cta: "Mua ngay",
    grad: "from-indigo-900/85 via-indigo-700/60 to-transparent",
    link: "/?search=sale",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=420&fit=crop&auto=format&q=85",
    title: "Công Nghệ Chính Hãng",
    sub: "Laptop · Điện thoại · Tai nghe — Bảo hành 12–24 tháng toàn quốc",
    cta: "Xem ngay",
    grad: "from-blue-900/85 via-blue-700/60 to-transparent",
    link: "/?search=laptop",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=420&fit=crop&auto=format&q=85",
    title: "Thời Trang Mùa Mới",
    sub: "Xu hướng 2025 — Cập nhật hàng ngày từ các thương hiệu lớn",
    cta: "Khám phá",
    grad: "from-violet-900/85 via-purple-700/60 to-transparent",
    link: "/?search=thời trang",
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=420&fit=crop&auto=format&q=85",
    title: "Nhà Đẹp Giá Tốt",
    sub: "Nội thất & Gia dụng — Giao hàng miễn phí đơn từ 199k",
    cta: "Mua sắm",
    grad: "from-teal-900/85 via-teal-700/60 to-transparent",
    link: "/?search=nội thất",
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=420&fit=crop&auto=format&q=85",
    title: "Thể Thao & Sức Khỏe",
    sub: "Dụng cụ thể thao — Hàng chính hãng, giá tốt mỗi ngày",
    cta: "Xem sản phẩm",
    grad: "from-emerald-900/85 via-green-700/60 to-transparent",
    link: "/?search=thể thao",
  },
];

// ── Side panel ────────────────────────────────────────────────────────────────
const SIDE_BANNERS = [
  { img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=300&h=200&fit=crop&auto=format&q=80", label: "Hàng Quốc Tế", grad: "from-blue-700/80" },
  { img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop&auto=format&q=80", label: "Siêu Sale",     grad: "from-indigo-700/80" },
];

// ── Danh mục (20 loại với ảnh thật) ──────────────────────────────────────────
const STATIC_CATEGORIES = [
  { name: "Điện thoại",   emoji: "📱", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&h=120&fit=crop" },
  { name: "Laptop",       emoji: "💻", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=120&h=120&fit=crop" },
  { name: "Thời trang",   emoji: "👗", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&h=120&fit=crop" },
  { name: "Giày dép",     emoji: "👟", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop" },
  { name: "Mỹ phẩm",     emoji: "💄", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&h=120&fit=crop" },
  { name: "Gia dụng",     emoji: "🏠", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=120&fit=crop" },
  { name: "Nội thất",     emoji: "🛋️", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&h=120&fit=crop" },
  { name: "Thể thao",     emoji: "⚽", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&h=120&fit=crop" },
  { name: "Túi xách",     emoji: "👜", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&h=120&fit=crop" },
  { name: "Đồng hồ",     emoji: "⌚", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop" },
  { name: "Thực phẩm",   emoji: "🥗", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop" },
  { name: "Sách",         emoji: "📚", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop" },
  { name: "Điện tử",     emoji: "🔌", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop" },
  { name: "Đồ chơi",     emoji: "🧸", img: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=120&h=120&fit=crop" },
  { name: "Xe cộ",       emoji: "🚗", img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=120&h=120&fit=crop" },
  { name: "Sức khỏe",   emoji: "💊", img: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=120&h=120&fit=crop" },
  { name: "Văn phòng",   emoji: "🗂️", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&h=120&fit=crop" },
  { name: "Thú cưng",   emoji: "🐾", img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=120&h=120&fit=crop" },
  { name: "Trẻ em",     emoji: "👶", img: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=120&h=120&fit=crop" },
  { name: "Du lịch",     emoji: "✈️", img: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=120&h=120&fit=crop" },
];

// ── Quick search tags ─────────────────────────────────────────────────────────
const QUICK_TAGS = ["iPhone 15 Pro", "MacBook Air M3", "Áo thun nam", "Son dưỡng Laneige", "Nike Air Max", "Nồi chiên Philips", "Samsung Galaxy S24", "Đồng hồ Casio", "Giày Adidas", "Máy ảnh Sony"];

// ── Promo banners ─────────────────────────────────────────────────────────────
const PROMO_BANNERS = [
  { img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=220&fit=crop&q=80", label: "Hàng Quốc Tế", badge: "MIỄN PHÍ VẬN CHUYỂN", grad: "from-blue-800" },
  { img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=220&fit=crop&q=80", label: "Siêu Sale 12.12", badge: "GIẢM ĐẾN 80%",          grad: "from-indigo-800" },
  { img: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=220&fit=crop&q=80", label: "Tech Hub",      badge: "BẢO HÀNH 24 THÁNG",     grad: "from-violet-800" },
  { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=220&fit=crop&q=80", label: "Thời Trang",    badge: "XU HƯỚNG 2025",          grad: "from-purple-800" },
];

// ── Brands ────────────────────────────────────────────────────────────────────
const BRANDS = [
  { name: "Apple",   img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=140&h=90&fit=crop" },
  { name: "Samsung", img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=140&h=90&fit=crop" },
  { name: "Nike",    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=140&h=90&fit=crop" },
  { name: "Adidas",  img: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=140&h=90&fit=crop" },
  { name: "Sony",    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=140&h=90&fit=crop" },
  { name: "L'Oréal", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=140&h=90&fit=crop" },
  { name: "Xiaomi",  img: "https://images.unsplash.com/photo-1600080701537-0c7df45e07e4?w=140&h=90&fit=crop" },
  { name: "IKEA",    img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=140&h=90&fit=crop" },
];

// ── Product type ──────────────────────────────────────────────────────────────
interface Prod { id: string; name: string; price: number; orig: number; disc: number; img: string; cat: string; sold?: number; rating?: number; isNew?: boolean; }

// ── All 60 mock products — ảnh thật cụ thể từng sản phẩm ─────────────────────
const ALL_PRODUCTS: Prod[] = [
  // Điện thoại
  { id:"p01", cat:"Điện thoại",  name:"iPhone 15 Pro Max 256GB Titan Tự Nhiên",           price:29_990_000, orig:34_900_000, disc:14, rating:4.9, sold:1243, img:"https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop" },
  { id:"p02", cat:"Điện thoại",  name:"Samsung Galaxy S24 Ultra 12GB/256GB Đen",           price:26_990_000, orig:31_990_000, disc:16, rating:4.8, sold:987,  img:"https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop" },
  { id:"p03", cat:"Điện thoại",  name:"Xiaomi 14 Ultra 16GB/512GB Trắng",                  price:22_990_000, orig:26_990_000, disc:15, rating:4.7, sold:543,  img:"https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop" },
  { id:"p04", cat:"Điện thoại",  name:"Samsung Galaxy Tab S9 FE WiFi 128GB",               price:10_490_000, orig:12_990_000, disc:19, rating:4.7, sold:743,  img:"https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop" },
  // Laptop
  { id:"p05", cat:"Laptop",      name:"MacBook Air M3 15 inch 8GB/256GB Bạc",              price:28_990_000, orig:32_990_000, disc:12, rating:4.9, sold:876,  img:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop" },
  { id:"p06", cat:"Laptop",      name:"Dell XPS 15 9530 i9-13900H RTX 4070 32GB",          price:42_990_000, orig:52_000_000, disc:17, rating:4.8, sold:231,  img:"https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&h=400&fit=crop" },
  { id:"p07", cat:"Laptop",      name:"Asus ROG Strix G16 i9 RTX4080 16GB Gaming",         price:39_990_000, orig:48_000_000, disc:17, rating:4.7, sold:312,  img:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop" },
  { id:"p08", cat:"Laptop",      name:"Lenovo ThinkPad X1 Carbon Gen 12 i7 16GB",          price:34_990_000, orig:41_000_000, disc:15, rating:4.8, sold:178,  img:"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop" },
  // Tai nghe / Âm thanh
  { id:"p09", cat:"Điện tử",    name:"Sony WH-1000XM5 Chống ồn ANC Đen",                  price:6_990_000,  orig:8_490_000,  disc:18, rating:4.9, sold:654,  img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop" },
  { id:"p10", cat:"Điện tử",    name:"AirPods Pro 2nd Gen USB-C 2024 Trắng",               price:6_290_000,  orig:6_990_000,  disc:10, rating:4.8, sold:1432, img:"https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop" },
  { id:"p11", cat:"Điện tử",    name:"JBL Charge 5 Loa Bluetooth 40W Chống Nước",          price:3_290_000,  orig:4_490_000,  disc:27, rating:4.7, sold:876,  img:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop" },
  { id:"p12", cat:"Điện tử",    name:"Chuột Gaming Logitech G Pro X Superlight 2",         price:2_890_000,  orig:3_500_000,  disc:17, rating:4.8, sold:543,  img:"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop" },
  { id:"p13", cat:"Điện tử",    name:"Bàn Phím Cơ Keychron Q1 Pro QMK Wireless",           price:3_490_000,  orig:4_000_000,  disc:13, rating:4.7, sold:321,  img:"https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop" },
  { id:"p14", cat:"Điện tử",    name:"iPad Air M2 11 inch WiFi 128GB Xanh Bầu Trời",       price:16_990_000, orig:19_990_000, disc:15, rating:4.8, sold:432,  img:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop" },
  // Giày dép
  { id:"p15", cat:"Giày dép",   name:"Nike Air Max 270 React Trắng/Đen Nam Size 42",        price:2_490_000,  orig:3_200_000,  disc:22, rating:4.8, sold:3421, img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop" },
  { id:"p16", cat:"Giày dép",   name:"Adidas Ultraboost 22 Nam Xanh Navy Size 43",          price:2_890_000,  orig:3_600_000,  disc:20, rating:4.7, sold:1876, img:"https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=400&fit=crop" },
  { id:"p17", cat:"Giày dép",   name:"Converse Chuck Taylor All Star 70s Hi Đen",           price:1_390_000,  orig:1_890_000,  disc:26, rating:4.6, sold:2341, img:"https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=400&h=400&fit=crop" },
  { id:"p18", cat:"Giày dép",   name:"Giày Cao Gót Zara Classic Pump Nude Size 37",         price:890_000,    orig:2_100_000,  disc:58, rating:4.5, sold:543,  img:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop" },
  // Thời trang
  { id:"p19", cat:"Thời trang", name:"Áo Polo Nam Uniqlo DRY-EX Kẻ Sọc Size M",            price:349_000,    orig:499_000,    disc:30, rating:4.6, sold:2187, img:"https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop" },
  { id:"p20", cat:"Thời trang", name:"Váy Maxi Hoa Nhỏ Tay Bồng Nữ Size S",               price:459_000,    orig:699_000,    disc:34, rating:4.5, sold:1234, img:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=400&fit=crop" },
  { id:"p21", cat:"Thời trang", name:"Áo Khoác The North Face Nuptse 700 Đen XL",           price:4_990_000,  orig:6_500_000,  disc:23, rating:4.8, sold:654,  img:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop" },
  { id:"p22", cat:"Thời trang", name:"Quần Jean Nam Slimfit Levi's 511 Xanh W32",           price:890_000,    orig:1_290_000,  disc:31, rating:4.6, sold:1543, img:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop" },
  { id:"p23", cat:"Thời trang", name:"Áo Len Turtleneck Zara Beige Oversize M",             price:699_000,    orig:990_000,    disc:29, rating:4.6, sold:876,  img:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop" },
  { id:"p24", cat:"Thời trang", name:"Kính Mắt Rayban Wayfarer RB2132 Polarized Nâu",      price:3_290_000,  orig:4_200_000,  disc:22, rating:4.8, sold:543,  img:"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop" },
  // Mỹ phẩm
  { id:"p25", cat:"Mỹ phẩm",   name:"Son Dưỡng Laneige Lip Sleeping Mask Berry 20g",       price:395_000,    orig:450_000,    disc:12, rating:4.9, sold:8932, img:"https://images.unsplash.com/photo-1586495777744-4e6232bf2263?w=400&h=400&fit=crop" },
  { id:"p26", cat:"Mỹ phẩm",   name:"Kem Chống Nắng Anessa Perfect UV SPF50+ 60ml",        price:385_000,    orig:450_000,    disc:14, rating:4.9, sold:12432,img:"https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop" },
  { id:"p27", cat:"Mỹ phẩm",   name:"Son Môi MAC Matte Lipstick Chili 3g",                 price:590_000,    orig:1_290_000,  disc:54, rating:4.7, sold:4321, img:"https://images.unsplash.com/photo-1590156206657-aec3b1a9b8eb?w=400&h=400&fit=crop" },
  { id:"p28", cat:"Mỹ phẩm",   name:"Sữa Rửa Mặt CeraVe Hydrating Cleanser 473ml",        price:285_000,    orig:360_000,    disc:21, rating:4.8, sold:6543, img:"https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop" },
  { id:"p29", cat:"Mỹ phẩm",   name:"Nước Hoa Chanel Chance Eau Tendre EDP 100ml",         price:3_890_000,  orig:4_500_000,  disc:14, rating:4.8, sold:876,  img:"https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop" },
  { id:"p30", cat:"Mỹ phẩm",   name:"Máy Rửa Mặt Foreo Luna 4 Mini Hồng Phấn",            price:2_490_000,  orig:3_200_000,  disc:22, rating:4.7, sold:1234, img:"https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop" },
  // Gia dụng
  { id:"p31", cat:"Gia dụng",   name:"Nồi Cơm Điện Tử Cuckoo CR-0632F 1.08L Trắng",       price:1_890_000,  orig:2_500_000,  disc:24, rating:4.8, sold:991,  img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop" },
  { id:"p32", cat:"Gia dụng",   name:"Máy Pha Cà Phê Delonghi EC155M Espresso 1450W",      price:2_590_000,  orig:3_200_000,  disc:19, rating:4.7, sold:432,  img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
  { id:"p33", cat:"Gia dụng",   name:"Nồi Chiên Không Dầu Philips HD9255 4.1L",            price:2_390_000,  orig:3_190_000,  disc:25, rating:4.8, sold:2134, img:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop" },
  { id:"p34", cat:"Gia dụng",   name:"Máy Xay Sinh Tố Blendjet 2 Portable 800ml",          price:990_000,    orig:1_490_000,  disc:34, rating:4.6, sold:1543, img:"https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop" },
  { id:"p35", cat:"Gia dụng",   name:"Robot Hút Bụi Xiaomi Robot Vacuum X10+",             price:8_990_000,  orig:11_990_000, disc:25, rating:4.7, sold:213,  img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { id:"p36", cat:"Gia dụng",   name:"Bếp Từ Đôi Electrolux ETD40KD 3000W Đen",           price:4_890_000,  orig:6_500_000,  disc:25, rating:4.6, sold:321,  img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop" },
  // Nội thất
  { id:"p37", cat:"Nội thất",   name:"Ghế Gaming DXRacer Formula F08 Đen Đỏ",             price:5_290_000,  orig:7_500_000,  disc:29, rating:4.6, sold:321,  img:"https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&h=400&fit=crop" },
  { id:"p38", cat:"Nội thất",   name:"Kệ Sách Gỗ Tự Nhiên 5 Tầng 80cm Màu Walnut",        price:1_290_000,  orig:1_890_000,  disc:32, rating:4.6, sold:654,  img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
  { id:"p39", cat:"Nội thất",   name:"Bộ Chăn Ga Gối Cotton Tencel Xanh Hải Quân 180x200",price:1_290_000,  orig:1_890_000,  disc:32, rating:4.7, sold:876,  img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop" },
  { id:"p40", cat:"Nội thất",   name:"Đèn Bàn LED Philip Hue White Ambiance E27",          price:890_000,    orig:1_290_000,  disc:31, rating:4.7, sold:1234, img:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop" },
  // Đồng hồ
  { id:"p41", cat:"Đồng hồ",   name:"Đồng Hồ Casio G-Shock GA-2100-1A1DR Đen Full",       price:2_150_000,  orig:2_690_000,  disc:20, rating:4.8, sold:1534, img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop" },
  { id:"p42", cat:"Đồng hồ",   name:"Samsung Galaxy Watch 6 Classic 47mm Đen",             price:8_490_000,  orig:10_990_000, disc:23, rating:4.7, sold:432,  img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop" },
  // Túi xách
  { id:"p43", cat:"Túi xách",   name:"Túi Xách Michael Kors Jet Set Da Thật Kem S",         price:3_290_000,  orig:5_200_000,  disc:37, rating:4.6, sold:432,  img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop" },
  { id:"p44", cat:"Túi xách",   name:"Balo Laptop Samsonite Cityscape 16 inch Đen",         price:1_890_000,  orig:2_490_000,  disc:24, rating:4.7, sold:876,  img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop" },
  // Thể thao
  { id:"p45", cat:"Thể thao",   name:"Tạ Tay Dumbell Cao Su 10kg/Đôi Màu Đen",             price:450_000,    orig:650_000,    disc:31, rating:4.6, sold:2341, img:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop" },
  { id:"p46", cat:"Thể thao",   name:"Xe Đạp Địa Hình Fornix BM212 26 inch Trắng Đỏ",     price:2_990_000,  orig:3_890_000,  disc:23, rating:4.5, sold:312,  img:"https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=400&fit=crop" },
  { id:"p47", cat:"Thể thao",   name:"Bộ Dụng Cụ Yoga Premium Manduka PRO 6mm Tím",        price:1_590_000,  orig:2_200_000,  disc:28, rating:4.7, sold:876,  img:"https://images.unsplash.com/photo-1601925228689-42e44dbff4c0?w=400&h=400&fit=crop" },
  // Sách
  { id:"p48", cat:"Sách",       name:"Sách Nhà Giả Kim Paulo Coelho Bìa Mềm Tái Bản 2024", price:52_000,     orig:68_000,     disc:24, rating:4.9, sold:8765, img:"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop" },
  { id:"p49", cat:"Sách",       name:"Đắc Nhân Tâm Dale Carnegie Bìa Cứng Mạ Vàng",        price:89_000,     orig:120_000,    disc:26, rating:4.8, sold:12543,img:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop" },
  // Thực phẩm
  { id:"p50", cat:"Thực phẩm", name:"Cà Phê Rang Xay Trung Nguyên Legend Robusta 500g",    price:195_000,    orig:250_000,    disc:22, rating:4.8, sold:5432, img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
  { id:"p51", cat:"Thực phẩm", name:"Trà Sữa Matcha Kit Kat Nhật Bản Hộp 12 thanh",        price:185_000,    orig:250_000,    disc:26, rating:4.7, sold:7654, img:"https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop" },
  // Sức khỏe
  { id:"p52", cat:"Sức khỏe",  name:"Máy Đo Huyết Áp Omron HEM-7156T Bluetooth",           price:1_290_000,  orig:1_690_000,  disc:24, rating:4.8, sold:876,  img:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop" },
  { id:"p53", cat:"Sức khỏe",  name:"Thực Phẩm Bổ Sung Vitamin C Blackmores 500mg x60",    price:285_000,    orig:350_000,    disc:19, rating:4.7, sold:3456, img:"https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=400&h=400&fit=crop" },
  // Đồ chơi / Trẻ em
  { id:"p54", cat:"Đồ chơi",   name:"LEGO Technic Bugatti Chiron 42083 3599 Miếng",        price:8_990_000,  orig:12_000_000, disc:25, rating:4.9, sold:321,  img:"https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop" },
  { id:"p55", cat:"Đồ chơi",   name:"Búp Bê Barbie Fashionistas 2024 Bộ 3 Cái",            price:390_000,    orig:540_000,    disc:28, rating:4.6, sold:1234, img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  // Văn phòng phẩm
  { id:"p56", cat:"Văn phòng", name:"Bút Ký Parker Jotter Stainless Steel Bạc",             price:490_000,    orig:650_000,    disc:25, rating:4.7, sold:876,  img:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop" },
  { id:"p57", cat:"Văn phòng", name:"Máy In Laser HP LaserJet M111w WiFi Trắng",            price:3_990_000,  orig:5_490_000,  disc:27, rating:4.6, sold:321,  img:"https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&h=400&fit=crop" },
  // Du lịch
  { id:"p58", cat:"Du lịch",   name:"Vali Kéo Samsonite Cosmolite 75cm 4 Bánh Đen",        price:8_990_000,  orig:13_000_000, disc:31, rating:4.8, sold:543,  img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop" },
  { id:"p59", cat:"Du lịch",   name:"Túi Du Lịch Thể Thao Nike Duffel 60L Đen",            price:990_000,    orig:1_490_000,  disc:34, rating:4.6, sold:876,  img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop" },
  // Thú cưng
  { id:"p60", cat:"Thú cưng",  name:"Thức Ăn Chó Royal Canin Medium Adult 15kg",           price:890_000,    orig:1_100_000,  disc:19, rating:4.8, sold:1234, img:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop" },
  // Xe cộ
  { id:"p61", cat:"Xe cộ",    name:"Mũ Bảo Hiểm Fullface AGV K6 S Matte Black",            price:4_490_000,  orig:5_800_000,  disc:23, rating:4.8, sold:543,  img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { id:"p62", cat:"Xe cộ",    name:"Camera Hành Trình Xiaomi 70mai Pro Plus A500S 4K",      price:1_490_000,  orig:1_990_000,  disc:25, rating:4.7, sold:876,  img:"https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop" },
];

// ── Flash sale — sản phẩm tech phổ biến, bán nhanh ──────────────────────────
const FLASH_IDS = ["p01","p02","p05","p09","p10","p15","p25","p26","p31","p33","p41","p48"];
const FLASH_PRODUCTS = ALL_PRODUCTS
  .filter(p => FLASH_IDS.includes(p.id))
  .slice(0, 8)
  .map((p, i) => ({ ...p, sold: Math.min(45 + i * 6, 99), disc: Math.max(p.disc, 10) }));

// ── Hàng mới về (isNew) ───────────────────────────────────────────────────────
const NEW_ARRIVALS = ALL_PRODUCTS.slice(8, 14).map(p => ({ ...p, isNew: true }));

// ── Sale-off lớn (>= 25%) ────────────────────────────────────────────────────
const SALEOFF = ALL_PRODUCTS.filter(p => p.disc >= 25).slice(0, 8);

// ── Mock auctions ─────────────────────────────────────────────────────────────
const MOCK_AUCTIONS = [
  { id:"a1", name:"Đồng Hồ Rolex Submariner 116610LN Fullbox 2023",  cur:245_000_000, ends:"02:14:38", bids:34, img:"https://images.unsplash.com/photo-1614164186166-7f6ac9a6059c?w=400&h=400&fit=crop" },
  { id:"a2", name:"Túi Hermès Birkin 30 Da Togo Caramel Fullset",     cur:320_000_000, ends:"05:42:11", bids:18, img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop" },
  { id:"a3", name:"iPhone 15 Pro Max 1TB Titan Đen Fullbox Seal",     cur:32_500_000,  ends:"01:07:22", bids:67, img:"https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop" },
  { id:"a4", name:"MacBook Pro M3 Max 16inch 36GB/1TB Space Black",   cur:98_000_000,  ends:"00:34:15", bids:89, img:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop" },
  { id:"a5", name:"AirPods Max USB-C Midnight 2024 Fullbox Seal",     cur:14_500_000,  ends:"03:21:44", bids:43, img:"https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop" },
  { id:"a6", name:"Sony Alpha A7R V Body Mirrorless Full-Frame 61MP", cur:82_000_000,  ends:"08:55:00", bids:12, img:"https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop" },
];

// ── Category sections ─────────────────────────────────────────────────────────
const CAT_SECTIONS = [
  { title: "Điện Tử & Công Nghệ", emoji: "💻", color: "text-blue-600",    border: "border-blue-100",   bg: "bg-blue-50",    cats: ["Điện thoại","Laptop","Điện tử"] },
  { title: "Thời Trang & Phụ Kiện",emoji: "👗", color: "text-violet-600", border: "border-violet-100", bg: "bg-violet-50",  cats: ["Thời trang","Giày dép","Túi xách","Đồng hồ"] },
  { title: "Nhà Cửa & Gia Dụng",  emoji: "🏠", color: "text-teal-600",   border: "border-teal-100",   bg: "bg-teal-50",    cats: ["Gia dụng","Nội thất"] },
  { title: "Sắc Đẹp & Mỹ Phẩm",  emoji: "💄", color: "text-pink-600",   border: "border-pink-100",   bg: "bg-pink-50",    cats: ["Mỹ phẩm"] },
  { title: "Thể Thao & Sức Khỏe", emoji: "⚽", color: "text-emerald-600",border: "border-emerald-100",bg: "bg-emerald-50", cats: ["Thể thao","Sức khỏe"] },
  { title: "Sách & Văn Phòng",    emoji: "📚", color: "text-amber-600",  border: "border-amber-100",  bg: "bg-amber-50",   cats: ["Sách","Văn phòng"] },
];

// ── Flash Sale countdown ──────────────────────────────────────────────────────
function useFlashSaleCountdown() {
  const getTarget = () => {
    const now = new Date();
    const t = new Date(now);
    t.setHours(Math.ceil(now.getHours() / 2) * 2, 0, 0, 0);
    if (t <= now) t.setHours(t.getHours() + 2);
    return t;
  };
  const [target] = useState(getTarget);
  const [left, setLeft] = useState({ h:0, m:0, s:0 });
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, target.getTime() - Date.now());
      setLeft({ h:Math.floor(d/3600000), m:Math.floor((d%3600000)/60000), s:Math.floor((d%60000)/1000) });
    };
    tick(); const id = setInterval(tick, 1000); return ()=>clearInterval(id);
  }, [target]);
  return left;
}

// ── Login Required Modal ──────────────────────────────────────────────────────
function LoginModal({ onClose }: { onClose: ()=>void }) {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><X size={20}/></button>
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <ShoppingCart size={30} className="text-nexus-500"/>
        </div>
        <h3 className="font-extrabold text-gray-900 text-xl mb-2">Đăng nhập để mua sắm!</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">Thêm vào giỏ hàng, theo dõi đơn và nhận ưu đãi riêng khi đăng nhập.</p>
        <div className="flex flex-col gap-3">
          <button onClick={()=>{navigate("/login"); onClose();}}
            className="w-full bg-nexus-500 hover:bg-nexus-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100">
            Đăng nhập ngay
          </button>
          <button onClick={()=>{navigate("/register"); onClose();}}
            className="w-full border-2 border-nexus-400 text-nexus-500 hover:bg-indigo-50 font-semibold py-3 rounded-xl transition-colors">
            Tạo tài khoản mới — Miễn phí
          </button>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 pt-1">Tiếp tục xem sản phẩm</button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function PCard({ p, onBuy }: { p: Prod; onBuy: ()=>void }) {
  const fallback = `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop`;
  return (
    <div className="group rounded-xl overflow-hidden border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {p.disc >= 30 && <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Flame size={8}/> HOT</span>}
        {p.isNew  && <span className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">MỚI</span>}
        {p.disc > 0 && <span className="absolute top-2 left-2 z-10 bg-nexus-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{p.disc}%</span>}
        <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e=>{(e.target as HTMLImageElement).src=fallback;}}/>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{p.cat}</p>
        <p className="text-xs text-gray-800 line-clamp-2 leading-snug font-medium mb-2 flex-1">{p.name}</p>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-sm font-extrabold text-nexus-500">{fmtVND(p.price)}</p>
            <p className="text-[10px] text-gray-400 line-through">{fmtVND(p.orig)}</p>
          </div>
          {p.rating && (
            <div className="flex items-center gap-0.5">
              <Star size={10} className="fill-amber-400 text-amber-400"/>
              <span className="text-[10px] text-gray-600 font-semibold">{p.rating}</span>
            </div>
          )}
        </div>
        <button onClick={e=>{e.preventDefault();e.stopPropagation();onBuy();}}
          className="w-full text-[11px] font-bold bg-nexus-50 text-nexus-600 border border-nexus-200 hover:bg-nexus-500 hover:text-white hover:border-nexus-500 rounded-lg py-1.5 transition-all mt-auto">
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}

// ── Mini card (horizontal scroll) ────────────────────────────────────────────
function MCard({ p, onBuy, showBar }: { p: Prod; onBuy: ()=>void; showBar?: boolean }) {
  const fallback = `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop`;
  return (
    <div className="w-44 shrink-0 group rounded-xl overflow-hidden border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer flex flex-col">
      <div className="relative h-44 bg-gray-50 overflow-hidden">
        <span className="absolute top-0 left-0 z-10 bg-nexus-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-br-xl">-{p.disc}%</span>
        <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e=>{(e.target as HTMLImageElement).src=fallback;}}/>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-700 line-clamp-2 leading-snug mb-1.5 h-8">{p.name}</p>
        <p className="text-sm font-extrabold text-nexus-500">{fmtVND(p.price)}</p>
        <p className="text-[10px] text-gray-400 line-through mb-1">{fmtVND(p.orig)}</p>
        {showBar && p.sold != null && (
          <>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-nexus-500 rounded-full" style={{width:`${p.sold}%`}}/>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Đã bán {p.sold}%</p>
          </>
        )}
        <button onClick={e=>{e.preventDefault();e.stopPropagation();onBuy();}}
          className="mt-2 w-full text-[11px] font-semibold text-nexus-500 border border-nexus-300 hover:bg-nexus-500 hover:text-white rounded-lg py-1 transition-colors">
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}

// ── Sale-off card ─────────────────────────────────────────────────────────────
function SaleCard({ p, onBuy }: { p: Prod; onBuy: ()=>void }) {
  const fallback = `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop`;
  return (
    <div className="w-44 shrink-0 group rounded-xl overflow-hidden border-2 border-red-100 bg-white hover:border-red-300 hover:shadow-lg transition-all flex flex-col">
      <div className="relative h-44 bg-gray-50 overflow-hidden">
        <div className="absolute top-0 left-0 z-10 bg-red-500 text-white px-2.5 py-1 rounded-br-xl">
          <p className="text-[9px] leading-none opacity-80">Tiết kiệm</p>
          <p className="text-sm font-extrabold leading-none">-{p.disc}%</p>
        </div>
        <span className="absolute top-1.5 right-1.5 z-10 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">HOT</span>
        <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e=>{(e.target as HTMLImageElement).src=fallback;}}/>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-700 line-clamp-2 leading-snug mb-1.5 h-8">{p.name}</p>
        <p className="text-base font-extrabold text-red-500">{fmtVND(p.price)}</p>
        <p className="text-[10px] text-gray-400 line-through">{fmtVND(p.orig)}</p>
        <p className="text-[10px] font-bold text-emerald-600 mb-2">Tiết kiệm {fmtVND(p.orig-p.price)}</p>
        <button onClick={e=>{e.preventDefault();e.stopPropagation();onBuy();}}
          className="mt-auto w-full text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg py-1.5 transition-colors">
          Mua ngay
        </button>
      </div>
    </div>
  );
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isLoggedIn, user } = useAuth();
  const canBuy = !isLoggedIn || user?.role === "BUYER";
  const { addToGuestCart } = useCart();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const catRef = useRef<HTMLDivElement>(null);

  const urlSearch = searchParams.get("search") ?? "";
  const urlCat   = searchParams.get("cat")    ?? "";
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const isFiltered = !!urlSearch || !!urlCat;

  const [hero, setHero] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const flashTime = useFlashSaleCountdown();

  useEffect(()=>{ setPage(1); }, [urlSearch, urlCat]);

  useEffect(()=>{
    if (isFiltered) return;
    timerRef.current = setInterval(()=>setHero(c=>(c+1)%HERO_BANNERS.length), 5000);
    return ()=>{ if (timerRef.current) clearInterval(timerRef.current); };
  }, [isFiltered]);

  const heroGo = useCallback((dir: 1|-1)=>{
    if (timerRef.current) clearInterval(timerRef.current);
    setHero(c=>(c+dir+HERO_BANNERS.length)%HERO_BANNERS.length);
    timerRef.current = setInterval(()=>setHero(c=>(c+1)%HERO_BANNERS.length), 5000);
  }, []);

  const { data: apiData, isLoading, isError } = useQuery({
    queryKey: ["products", page, urlSearch, urlCat],
    queryFn: ()=>getProducts({ page, pageSize:PAGE_SIZE, search:urlSearch||undefined, categoryId:urlCat||undefined }),
    placeholderData: prev=>prev,
  });
  const { data: categories } = useQuery({ queryKey:["categories"], queryFn:getCategories, staleTime:5*60_000 });
  const activeCatName = categories?.find(c=>c.categoryId===urlCat)?.name ?? "";
  const useApi = !isError && !!apiData?.items?.length;

  const displayCats = STATIC_CATEGORIES.map(sc=>{
    const api = categories?.find(c=>c.name.toLowerCase().includes(sc.name.toLowerCase()));
    return { ...sc, catId: api?.categoryId ?? sc.name };
  });

  const handleApiCart = async (productId: string) => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (!canBuy) {
      toast.error(user?.role === "ADMIN" ? "Quản trị viên không thực hiện mua hàng." : "Tài khoản người bán không thể mua hàng.");
      return;
    }
    const p = apiData?.items?.find(x=>x.productId===productId);
    try {
      await addToCart({ productId, productName:p?.name??"", unitPrice:p?.price??0, quantity:1, imageUrl:p?.imageUrl });
      queryClient.invalidateQueries({ queryKey:["cart"] });
      toast.success("Đã thêm vào giỏ hàng!", { icon:"🛒" });
    } catch { toast.error("Không thể thêm vào giỏ, hãy thử lại"); }
  };

  const handleMockCart = ()=>{
    if (!isLoggedIn){ setShowLogin(true); return; }
    if (!canBuy) {
      toast.error(user?.role === "ADMIN" ? "Quản trị viên không thực hiện mua hàng." : "Tài khoản người bán không thể mua hàng.");
      return;
    }
    toast.success("Đã thêm vào giỏ hàng!", {icon:"🛒"});
  };
  const totalPages = Math.ceil((apiData?.totalCount??0)/PAGE_SIZE);
  const B = HERO_BANNERS[hero];

  return (
    <div className="bg-[#f4f6fb] min-h-screen">
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)}/>}

      {/* ══════════════════════════ HOME ONLY ══════════════════════════════ */}
      {!isFiltered && (<>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-3">
            <div className="relative rounded-2xl overflow-hidden h-[280px] md:h-[350px] shadow-xl">
              {HERO_BANNERS.map((b,i)=>(
                <div key={b.id} className={`absolute inset-0 transition-opacity duration-700 ${i===hero?"opacity-100 z-10":"opacity-0 z-0"}`}>
                  <img src={b.img} alt={b.title} className="w-full h-full object-cover" loading={i===0?"eager":"lazy"}
                    onError={e=>{(e.target as HTMLImageElement).src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=420&fit=crop";}}/>
                  <div className={`absolute inset-0 bg-gradient-to-r ${b.grad}`}/>
                  <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-14">
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-white/60 inline-block"/> ƯU ĐÃI ĐẶC BIỆT
                    </p>
                    <h2 className="text-white font-extrabold text-2xl md:text-4xl drop-shadow-lg mb-2 leading-tight max-w-lg">{b.title}</h2>
                    <p className="text-white/85 text-sm md:text-base mb-6 max-w-md">{b.sub}</p>
                    <Link to={b.link} className="inline-flex items-center gap-2 bg-white text-nexus-600 font-bold px-6 py-2.5 rounded-full text-sm hover:bg-indigo-50 transition-colors w-fit shadow-lg">
                      {b.cta} <ChevronRight size={15}/>
                    </Link>
                  </div>
                </div>
              ))}
              <button onClick={()=>heroGo(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-sm transition-colors"><ChevronLeft size={18}/></button>
              <button onClick={()=>heroGo(1)}  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-sm transition-colors"><ChevronRight size={18}/></button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {HERO_BANNERS.map((_,i)=>(
                  <button key={i} onClick={()=>setHero(i)} className={`h-1.5 rounded-full transition-all ${i===hero?"w-6 bg-white":"w-1.5 bg-white/50"}`}/>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-3">
              {SIDE_BANNERS.map((b,i)=>(
                <div key={i} className="relative rounded-xl overflow-hidden flex-1 shadow cursor-pointer group">
                  <img src={b.img} alt={b.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e=>{(e.target as HTMLImageElement).src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop";}}/>
                  <div className={`absolute inset-0 bg-gradient-to-t ${b.grad} to-transparent flex items-end p-3`}>
                    <span className="text-white font-extrabold text-sm drop-shadow">{b.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRUST BADGES ─────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="bg-white rounded-2xl px-6 py-3.5 flex flex-wrap items-center justify-around gap-3 shadow-sm">
            {[
              { icon:<Zap size={15} className="text-amber-500"/>,    label:"Giao siêu tốc",    sub:"2h nội thành",      bg:"bg-amber-50"   },
              { icon:<ShieldCheck size={15} className="text-green-600"/>, label:"Hàng chính hãng", sub:"100% authentic",    bg:"bg-green-50"   },
              { icon:<RotateCcw size={15} className="text-blue-500"/>, label:"Đổi trả 7 ngày", sub:"Miễn phí hoàn",    bg:"bg-blue-50"    },
              { icon:<Headphones size={15} className="text-violet-500"/>,label:"Hỗ trợ 24/7",   sub:"Giải quyết nhanh", bg:"bg-violet-50"  },
              { icon:<Tag size={15} className="text-nexus-500"/>,     label:"Giá tốt nhất",   sub:"Cam kết giá rẻ",   bg:"bg-indigo-50"  },
            ].map(b=>(
              <div key={b.label} className="flex items-center gap-2.5">
                <div className={`w-8 h-8 ${b.bg} rounded-lg flex items-center justify-center shrink-0`}>{b.icon}</div>
                <div><p className="text-xs font-bold text-gray-800">{b.label}</p><p className="text-[10px] text-gray-400">{b.sub}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DANH MỤC cuộn ngang ──────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-50">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-nexus-500 rounded-full"/>DANH MỤC SẢN PHẨM
              </h2>
              <div className="flex gap-1.5 relative z-10">
                <button onClick={e=>{e.stopPropagation();catRef.current?.scrollBy({left:-300,behavior:"smooth"});}} className="w-8 h-8 bg-gray-100 hover:bg-indigo-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"><ChevronLeft size={16}/></button>
                <button onClick={e=>{e.stopPropagation();catRef.current?.scrollBy({left:300,behavior:"smooth"});}}  className="w-8 h-8 bg-gray-100 hover:bg-indigo-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"><ChevronRight size={16}/></button>
              </div>
            </div>
            <div ref={catRef} className="flex overflow-x-auto scrollbar-none border-b border-gray-50">
              {displayCats.map((c,i)=>(
                <button key={c.name} onClick={()=>navigate(`/?cat=${c.catId}`)}
                  className={`flex flex-col items-center gap-2 py-4 px-4 min-w-[90px] hover:bg-indigo-50 transition-colors group shrink-0 ${i>0?"border-l border-gray-50":""}`}>
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-nexus-300 transition-all shadow-sm">
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover"
                      onError={e=>{(e.target as HTMLImageElement).outerHTML=`<div class="w-full h-full flex items-center justify-center text-2xl bg-indigo-50">${c.emoji}</div>`;}}/>
                  </div>
                  <span className="text-[11px] text-gray-700 text-center leading-tight font-medium w-16 truncate group-hover:text-nexus-600">{c.name}</span>
                </button>
              ))}
            </div>
            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 px-5 py-3">
              {QUICK_TAGS.map(t=>(
                <button key={t} onClick={()=>navigate(`/?search=${encodeURIComponent(t)}`)}
                  className="text-[11px] px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-nexus-600 text-gray-600 rounded-full border border-gray-200 hover:border-indigo-200 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── FLASH SALE ───────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 px-5 py-3.5 flex items-center gap-4">
              <Flame size={22} className="text-amber-300 animate-pulse shrink-0"/>
              <span className="text-white font-extrabold text-xl">FLASH SALE</span>
              <div className="flex items-center gap-1">
                {[pad(flashTime.h),pad(flashTime.m),pad(flashTime.s)].map((v,i)=>(
                  <span key={i} className="flex items-center gap-1">
                    <span className="bg-gray-900 text-white font-mono font-bold text-sm px-2 py-1 rounded-md shadow">{v}</span>
                    {i<2&&<span className="text-amber-300 font-bold">:</span>}
                  </span>
                ))}
              </div>
              <span className="text-white/60 text-xs hidden sm:block">Kết thúc sau</span>
              <Link to="/" className="ml-auto flex items-center gap-1 text-white text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors">
                Xem tất cả <ChevronRight size={13}/>
              </Link>
            </div>
            <div className="p-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                {FLASH_PRODUCTS.map(p=><MCard key={p.id} p={p} onBuy={handleMockCart} showBar/>)}
              </div>
            </div>
          </div>
        </div>

        {/* ── PROMO BANNERS ────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROMO_BANNERS.map((b,i)=>(
              <div key={i} className="relative rounded-xl overflow-hidden shadow-sm h-28 cursor-pointer group">
                <img src={b.img} alt={b.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e=>{(e.target as HTMLImageElement).src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=220&fit=crop";}}/>
                <div className={`absolute inset-0 bg-gradient-to-r ${b.grad} to-transparent`}/>
                <div className="absolute inset-0 flex flex-col justify-center px-4">
                  <span className="text-white/75 text-[10px] font-bold tracking-widest">{b.badge}</span>
                  <span className="text-white font-extrabold text-base drop-shadow">{b.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── HÀNG MỚI VỀ ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/>HÀNG MỚI VỀ</h2>
              <button className="text-xs text-nexus-500 hover:underline flex items-center gap-0.5 font-medium">Xem thêm <ChevronRight size={13}/></button>
            </div>
            <div className="p-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                {NEW_ARRIVALS.map(p=><MCard key={p.id} p={p} onBuy={handleMockCart}/>)}
              </div>
            </div>
          </div>
        </div>

        {/* ── SALE-OFF THANH LÝ ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 px-5 py-4">
              <div className="absolute right-0 inset-y-0 w-32 opacity-10" style={{backgroundImage:"repeating-linear-gradient(-45deg,white,white 2px,transparent 2px,transparent 10px)"}}/>
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                    <p className="text-white font-black text-xl leading-none">SALE</p>
                    <p className="text-white/80 text-[10px]">Đến</p>
                    <p className="text-white font-extrabold text-2xl leading-none">70%</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-extrabold text-lg">Thanh Lý Cuối Mùa</p>
                    <p className="text-white/80 text-xs">Hàng trăm sản phẩm xả kho — số lượng có hạn!</p>
                  </div>
                </div>
                <Link to="/?search=sale" className="bg-white text-red-600 font-extrabold px-4 py-2 rounded-xl text-sm hover:bg-red-50 shadow-lg transition-colors">
                  Mua ngay <ChevronRight size={13} className="inline"/>
                </Link>
              </div>
            </div>
            <div className="p-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                {SALEOFF.map(p=><SaleCard key={p.id} p={p} onBuy={handleMockCart}/>)}
              </div>
            </div>
          </div>
        </div>

        {/* ── ĐẤU GIÁ ĐANG DIỄN RA ────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔨</span>
                <span className="text-white font-extrabold text-lg">ĐẤU GIÁ ĐANG DIỄN RA</span>
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-0.5"><Clock size={9}/> LIVE</span>
              </div>
              <Link to="/auctions" className="bg-white text-violet-600 font-bold px-4 py-1.5 rounded-full text-xs hover:bg-violet-50 shadow transition-colors">
                Vào đấu giá <ChevronRight size={13} className="inline"/>
              </Link>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOCK_AUCTIONS.map(a=>(
                <Link key={a.id} to="/auctions"
                  className="group flex gap-3 border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-xl p-3 transition-all bg-gradient-to-br from-white to-violet-50/40">
                  <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img src={a.img} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e=>{(e.target as HTMLImageElement).src="https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop";}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-1.5">{a.name}</p>
                    <p className="text-[10px] text-gray-400">Giá hiện tại:</p>
                    <p className="text-sm font-extrabold text-violet-600">{fmtVND(a.cur)}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span className="bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-bold">{a.bids} lượt</span>
                      <span className="text-red-500 font-bold flex items-center gap-0.5"><Clock size={9}/> {a.ends}</span>
                    </div>
                    <button className="mt-2 w-full text-[11px] font-bold bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg py-1.5 transition-all">Đặt giá ngay</button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── THƯƠNG HIỆU YÊU THÍCH ────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
              <Award size={18} className="text-amber-500"/><h2 className="font-extrabold text-gray-900">THƯƠNG HIỆU YÊU THÍCH</h2>
            </div>
            <div className="p-4 grid grid-cols-4 md:grid-cols-8 gap-3">
              {BRANDS.map(b=>(
                <div key={b.name} className="group cursor-pointer text-center">
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                    <img src={b.img} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e=>{(e.target as HTMLImageElement).src="https://images.unsplash.com/photo-1560343090-f0409e92791a?w=140&h=90&fit=crop";}}/>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 font-semibold">{b.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>)}

      {/* ══════════════════════════ PRODUCT GRID ══════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-nexus-500 rounded-full"/>
              {isFiltered
                ? urlSearch ? <>Kết quả: "<span className="text-nexus-500">{urlSearch}</span>"</>
                            : <>Danh mục: <span className="text-nexus-500">{activeCatName}</span></>
                : <><Star size={16} className="text-amber-400 fill-amber-400"/> GỢI Ý HÔM NAY</>}
            </h2>
            <div className="flex items-center gap-3">
              {isFiltered && (
                <button onClick={()=>setSearchParams({})} className="text-xs text-gray-400 hover:text-nexus-500 flex items-center gap-1 transition-colors">
                  <X size={12}/> Xóa lọc
                </button>
              )}
              <span className="text-xs text-gray-400 hidden sm:block">{useApi?apiData?.totalCount:ALL_PRODUCTS.length} sản phẩm</span>
            </div>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({length:10}).map((_,i)=><div key={i} className="bg-gray-100 animate-pulse rounded-xl h-72"/>)}
              </div>
            ) : useApi ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {apiData!.items.map(p=><ProductCard key={p.productId} product={p} onAddToCart={canBuy ? handleApiCart : undefined}/>)}
                </div>
                {totalPages>1&&(
                  <div className="flex justify-center gap-2 mt-8">
                    <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-indigo-50">‹ Trước</button>
                    {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                      const pg=Math.max(1,Math.min(totalPages-6,page-3))+i;
                      return pg<=totalPages?<button key={pg} onClick={()=>setPage(pg)}
                        className={`px-3 py-2 rounded-xl text-sm ${pg===page?"bg-nexus-500 text-white font-bold":"border hover:bg-indigo-50"}`}>{pg}</button>:null;
                    })}
                    <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-indigo-50">Tiếp ›</button>
                  </div>
                )}
              </>
            ) : (
              <>
                {isError&&<div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-amber-700">⚠️ CatalogService chưa kết nối — đang hiển thị sản phẩm mẫu.</div>}
                {(() => {
                  const kw = urlSearch.toLowerCase().trim();
                  const catKw = urlCat.toLowerCase().trim();
                  const filtered = ALL_PRODUCTS.filter(p => {
                    if (kw && !p.name.toLowerCase().includes(kw) && !p.cat.toLowerCase().includes(kw)) return false;
                    if (catKw && !p.cat.toLowerCase().includes(catKw) && catKw !== p.id) return false;
                    return true;
                  });
                  const shown = filtered.length ? filtered : ALL_PRODUCTS;
                  return (
                    <>
                      {isFiltered && <p className="text-xs text-gray-400 mb-3">Tìm thấy {shown.length} sản phẩm{kw ? ` cho "${urlSearch}"` : ""}</p>}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {shown.map(p=><PCard key={p.id} p={p} onBuy={handleMockCart}/>)}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* ── CATEGORY SECTIONS ─────────────────────────────────────────── */}
        {!isFiltered && (
          <div className="mt-4 space-y-4">
            {CAT_SECTIONS.map(s=>{
              const prods = ALL_PRODUCTS.filter(p=>s.cats.includes(p.cat));
              if (!prods.length) return null;
              return (
                <div key={s.title} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${s.border}`}>
                  <div className={`flex items-center justify-between px-5 py-3.5 ${s.bg} border-b ${s.border}`}>
                    <h2 className={`font-extrabold ${s.color} flex items-center gap-2 text-sm`}>{s.emoji} {s.title}</h2>
                    <button className={`text-xs ${s.color} hover:underline flex items-center gap-0.5 font-medium`}>Xem thêm <ChevronRight size={13}/></button>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {prods.map(p=><PCard key={p.id} p={p} onBuy={handleMockCart}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── GUEST CTA ────────────────────────────────────────────────── */}
        {!isLoggedIn&&(
          <div className="mt-4 relative overflow-hidden bg-gradient-to-r from-nexus-600 via-nexus-500 to-violet-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%,white 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
            <div className="text-white text-center sm:text-left relative">
              <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                <Gift size={16} className="text-amber-300"/>
                <span className="text-amber-300 text-xs font-bold">TẶNG NGAY VOUCHER 50.000Đ</span>
              </div>
              <p className="font-extrabold text-xl">Mua sắm tốt hơn khi đăng nhập!</p>
              <p className="text-white/80 text-sm mt-1">Theo dõi đơn hàng, tích điểm thưởng và nhận ưu đãi cá nhân hóa</p>
            </div>
            <div className="flex gap-3 shrink-0 relative">
              <Link to="/register" className="bg-white text-nexus-600 font-bold px-6 py-3 rounded-xl text-sm hover:bg-indigo-50 shadow-lg transition-colors">Đăng ký miễn phí</Link>
              <Link to="/login" className="border-2 border-white/60 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/15 transition-colors">Đăng nhập</Link>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════ FOOTER ════════════════════════════════ */}
      <footer className="bg-white border-t border-gray-200 mt-2">
        {/* Hotline bar */}
        <div className="bg-indigo-50 border-b border-indigo-100">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 font-semibold text-gray-700">
                <Headphones size={15} className="text-nexus-500"/>Hotline CSKH:
                <a href="tel:0946000838" className="text-nexus-600 font-extrabold hover:underline">0946 000 838</a>
                <span className="text-gray-400 text-xs">(8:00–22:00)</span>
              </span>
              <span className="flex items-center gap-2 text-gray-500">
                📧 <a href="mailto:support@nexusmarket.vn" className="hover:text-nexus-500">support@nexusmarket.vn</a>
              </span>
            </div>
            <span className="text-xs text-gray-400">📍 123 Lê Lợi, Q.1, TP.HCM · Nexus Commerce Inc.</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-nexus-500 rounded-lg p-1.5 text-white font-extrabold text-xs w-7 h-7 flex items-center justify-center">N</div>
              <span className="font-extrabold text-gray-900 text-base">Nexus</span>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">Nền tảng mua sắm online hàng đầu Việt Nam. Hàng chính hãng, giao hàng nhanh, giá tốt nhất.</p>
            <h4 className="font-bold text-gray-800 text-sm mb-3">Chăm sóc khách hàng</h4>
            <ul className="space-y-2 text-xs text-gray-500">
              {["Trung tâm trợ giúp","Hướng dẫn mua hàng","Hướng dẫn bán hàng","Thanh toán","Vận chuyển","Trả hàng & Hoàn tiền"].map(t=>(
                <li key={t}><a href="#" className="hover:text-nexus-500 transition-colors">{t}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-nexus-500 rounded-full"/>Về Nexus</h4>
            <ul className="space-y-2 text-xs text-gray-500">
              {["Giới thiệu về Nexus","Tuyển dụng","Điều khoản sử dụng","Chính sách bảo mật","Quy chế hoạt động","Báo chí & Truyền thông"].map(t=>(
                <li key={t}><a href="#" className="hover:text-nexus-500 transition-colors">{t}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-nexus-500 rounded-full"/>Theo dõi chúng tôi</h4>
            <ul className="space-y-2.5 text-xs text-gray-500">
              {[["📘 Facebook","#"],["📸 Instagram","#"],["🎵 TikTok","#"],["▶️ YouTube","#"],["🐦 X (Twitter)","#"]].map(([t,h])=>(
                <li key={t}><a href={h} className="hover:text-nexus-500 transition-colors">{t}</a></li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-700 mb-2">Chứng nhận bảo mật</p>
              <div className="flex gap-2 flex-wrap">
                {["✅ ĐKKD","🔒 SSL","💳 PCI-DSS"].map(b=>(
                  <span key={b} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">{b}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="w-1 h-4 bg-nexus-500 rounded-full"/>Tải ứng dụng Nexus</h4>
            <div className="flex flex-col gap-2.5">
              {[["📱","Tải về trên","App Store"],["🤖","Tải về trên","Google Play"]].map(([icon,sub,nm])=>(
                <div key={nm} className="bg-gray-50 border border-gray-200 hover:border-nexus-300 rounded-xl p-3 flex items-center gap-3 cursor-pointer group transition-colors">
                  <span className="text-2xl">{icon}</span>
                  <div><p className="text-[10px] text-gray-400 group-hover:text-nexus-400">{sub}</p><p className="text-sm font-bold text-gray-800 group-hover:text-nexus-600">{nm}</p></div>
                </div>
              ))}
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-600 mb-2">Phương thức thanh toán</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["💳 Visa","💳 Mastercard","🏦 ATM","💵 COD","📱 MoMo","💰 VNPay","🔵 ZaloPay"].map(m=>(
                    <span key={m} className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg text-[10px] font-medium text-gray-600">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50 py-4 text-center">
          <p className="text-xs text-gray-500">© 2025 <strong className="text-nexus-600">Nexus Marketplace</strong> — Nền tảng thương mại điện tử hàng đầu Việt Nam</p>
          <p className="text-[10px] text-gray-400 mt-1">Hotline: <a href="tel:0946000838" className="text-nexus-500 font-semibold">0946 000 838</a> | 📍 123 Lê Lợi, Q.1, TP.HCM | support@nexusmarket.vn</p>
        </div>
      </footer>
    </div>
  );
}
