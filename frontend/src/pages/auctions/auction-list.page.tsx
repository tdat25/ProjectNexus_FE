// ──────────────────────────────────────────────────────────────────────────────
// Trang Đấu Giá Trực Tuyến
// Guest xem được; đăng nhập mới đặt giá
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";
import {
  Gavel, Clock, TrendingUp, ChevronRight, Eye, Users,
  Flame, CheckCircle, XCircle, Calendar, BarChart2,
  Filter, Search, X, ArrowUpRight, Shield, Zap,
  Trophy, Star, Bell, History, Timer, AlertCircle
} from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const pad = (n: number) => String(n).padStart(2, "0");

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(targetIso: string) {
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0, total: 0 });
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, new Date(targetIso).getTime() - Date.now());
      setLeft({ total: d, h: Math.floor(d / 3_600_000), m: Math.floor((d % 3_600_000) / 60_000), s: Math.floor((d % 60_000) / 1_000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return left;
}

// ── Tạo thời gian động ────────────────────────────────────────────────────────
const now = Date.now();
const hm = (ms: number) => new Date(now + ms).toISOString();
const hb = (ms: number) => new Date(now - ms).toISOString();

// ── Auction data type ─────────────────────────────────────────────────────────
interface BidRecord {
  id: string; user: string; avatar: string; amount: number; time: string; isWinner?: boolean;
}
interface AuctionItem {
  id: string; status: "Active" | "Scheduled" | "Ended" | "Failed";
  name: string; category: string; condition: string;
  img: string; startPrice: number; currentPrice: number; minStep: number;
  startTime: string; endTime: string; views: number; watchers: number;
  seller: string; sellerAvatar: string; sellerRating: number;
  desc: string; bids: BidRecord[]; tags: string[];
  featured?: boolean; hot?: boolean;
}

// ── Dữ liệu đấu giá ──────────────────────────────────────────────────────────
const AUCTIONS: AuctionItem[] = [
  // ── ĐANG DIỄN RA (Active) ─────────────────────────────────────────────────
  {
    id: "a01", status: "Active", featured: true, hot: true,
    name: "Đồng Hồ Rolex Submariner 116610LN Fullbox 2022",
    category: "Đồng hồ", condition: "Đã qua sử dụng — Tình trạng 98%",
    img: "https://images.unsplash.com/photo-1614164186166-7f6ac9a6059c?w=600&h=600&fit=crop",
    startPrice: 200_000_000, currentPrice: 268_500_000, minStep: 2_000_000,
    startTime: hb(4 * 3_600_000), endTime: hm(2 * 3_600_000 + 14 * 60_000 + 38_000),
    views: 4821, watchers: 312, seller: "LuxuryVN_Official", sellerAvatar: "https://i.pravatar.cc/40?img=11", sellerRating: 4.9,
    desc: "Rolex Submariner Date 116610LN fullbox, thẻ bảo hành, giấy tờ đầy đủ. Sản xuất năm 2022, tình trạng như mới 98%. Bộ máy automatic, chống nước 300m, vỏ thép 904L.",
    tags: ["Rolex", "Đồng hồ xa xỉ", "Fullbox", "Chính hãng"],
    bids: [
      { id:"b1", user:"Nguyễn Minh Tuấn", avatar:"https://i.pravatar.cc/32?img=1", amount:268_500_000, time:hb(8*60_000), isWinner:true },
      { id:"b2", user:"Trần Phú Lộc", avatar:"https://i.pravatar.cc/32?img=2", amount:266_000_000, time:hb(22*60_000) },
      { id:"b3", user:"Lê Hoàng Nam", avatar:"https://i.pravatar.cc/32?img=3", amount:262_000_000, time:hb(45*60_000) },
      { id:"b4", user:"Phạm Việt Anh", avatar:"https://i.pravatar.cc/32?img=4", amount:258_000_000, time:hb(70*60_000) },
      { id:"b5", user:"Nguyễn Minh Tuấn", avatar:"https://i.pravatar.cc/32?img=1", amount:254_000_000, time:hb(95*60_000) },
      { id:"b6", user:"Võ Thanh Bình", avatar:"https://i.pravatar.cc/32?img=5", amount:248_000_000, time:hb(120*60_000) },
      { id:"b7", user:"Trần Phú Lộc", avatar:"https://i.pravatar.cc/32?img=2", amount:240_000_000, time:hb(150*60_000) },
      { id:"b8", user:"Đặng Quốc Huy", avatar:"https://i.pravatar.cc/32?img=6", amount:230_000_000, time:hb(180*60_000) },
      { id:"b9", user:"Lý Minh Châu", avatar:"https://i.pravatar.cc/32?img=7", amount:220_000_000, time:hb(200*60_000) },
      { id:"b10", user:"Nguyễn Văn Sơn", avatar:"https://i.pravatar.cc/32?img=8", amount:210_000_000, time:hb(220*60_000) },
    ]
  },
  {
    id: "a02", status: "Active", hot: true,
    name: "Túi Hermès Birkin 30 Da Togo Caramel Fullset 2021",
    category: "Túi xách", condition: "Đã qua sử dụng — Tình trạng 95%",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop",
    startPrice: 280_000_000, currentPrice: 332_000_000, minStep: 3_000_000,
    startTime: hb(6 * 3_600_000), endTime: hm(5 * 3_600_000 + 42 * 60_000),
    views: 3241, watchers: 198, seller: "VIPBagViet", sellerAvatar: "https://i.pravatar.cc/40?img=12", sellerRating: 4.8,
    desc: "Hermès Birkin 30 da Togo màu Caramel, phần cứng vàng gold. Fullset: túi, khóa, chìa, bụi, hộp, biên lai mua hàng. Tình trạng 95%, da mịn không trầy xước.",
    tags: ["Hermès", "Birkin", "Luxury", "Fullset"],
    bids: [
      { id:"b1", user:"Hoàng Gia Linh", avatar:"https://i.pravatar.cc/32?img=9", amount:332_000_000, time:hb(15*60_000), isWinner:true },
      { id:"b2", user:"Trịnh Bảo Châu", avatar:"https://i.pravatar.cc/32?img=10", amount:328_000_000, time:hb(35*60_000) },
      { id:"b3", user:"Nguyễn Thị Lan", avatar:"https://i.pravatar.cc/32?img=20", amount:322_000_000, time:hb(60*60_000) },
      { id:"b4", user:"Hoàng Gia Linh", avatar:"https://i.pravatar.cc/32?img=9", amount:315_000_000, time:hb(90*60_000) },
      { id:"b5", user:"Đỗ Phương Thảo", avatar:"https://i.pravatar.cc/32?img=21", amount:305_000_000, time:hb(120*60_000) },
      { id:"b6", user:"Trịnh Bảo Châu", avatar:"https://i.pravatar.cc/32?img=10", amount:295_000_000, time:hb(160*60_000) },
      { id:"b7", user:"Lê Ngọc Trinh", avatar:"https://i.pravatar.cc/32?img=22", amount:285_000_000, time:hb(200*60_000) },
    ]
  },
  {
    id: "a03", status: "Active",
    name: "MacBook Pro M3 Max 16\" 36GB/1TB Space Black 2024",
    category: "Laptop", condition: "Mới 100% — Seal nguyên hộp",
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop",
    startPrice: 85_000_000, currentPrice: 98_000_000, minStep: 500_000,
    startTime: hb(2 * 3_600_000), endTime: hm(1 * 3_600_000 + 7 * 60_000 + 22_000),
    views: 2187, watchers: 421, seller: "TechDealsPro", sellerAvatar: "https://i.pravatar.cc/40?img=13", sellerRating: 4.7,
    desc: "MacBook Pro M3 Max 16 inch, chip M3 Max 16-core CPU 40-core GPU, RAM 36GB, SSD 1TB. Màu Space Black, fullbox seal chưa active, bảo hành Apple 1 năm.",
    tags: ["Apple", "MacBook", "M3 Max", "Seal"],
    bids: [
      { id:"b1", user:"Trần Đức Kiên", avatar:"https://i.pravatar.cc/32?img=14", amount:98_000_000, time:hb(5*60_000), isWinner:true },
      { id:"b2", user:"Nguyễn Hoàng Long", avatar:"https://i.pravatar.cc/32?img=15", amount:97_000_000, time:hb(18*60_000) },
      { id:"b3", user:"Phan Đình Khoa", avatar:"https://i.pravatar.cc/32?img=16", amount:96_000_000, time:hb(31*60_000) },
      { id:"b4", user:"Trần Đức Kiên", avatar:"https://i.pravatar.cc/32?img=14", amount:95_000_000, time:hb(44*60_000) },
      { id:"b5", user:"Lê Quang Vinh", avatar:"https://i.pravatar.cc/32?img=17", amount:94_000_000, time:hb(55*60_000) },
      { id:"b6", user:"Nguyễn Hoàng Long", avatar:"https://i.pravatar.cc/32?img=15", amount:92_000_000, time:hb(70*60_000) },
      { id:"b7", user:"Đào Văn Tú", avatar:"https://i.pravatar.cc/32?img=18", amount:90_000_000, time:hb(85*60_000) },
      { id:"b8", user:"Phan Đình Khoa", avatar:"https://i.pravatar.cc/32?img=16", amount:88_000_000, time:hb(100*60_000) },
      { id:"b9", user:"Bùi Thành Đạt", avatar:"https://i.pravatar.cc/32?img=19", amount:86_500_000, time:hb(110*60_000) },
    ]
  },
  {
    id: "a04", status: "Active",
    name: "Sony Alpha A7R V Body Mirrorless Full-Frame 61MP",
    category: "Máy ảnh", condition: "Mới 99% — Ít sử dụng",
    img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
    startPrice: 72_000_000, currentPrice: 82_000_000, minStep: 500_000,
    startTime: hb(8 * 3_600_000), endTime: hm(8 * 3_600_000 + 55 * 60_000),
    views: 1432, watchers: 89, seller: "CameraProShop", sellerAvatar: "https://i.pravatar.cc/40?img=23", sellerRating: 4.6,
    desc: "Sony Alpha A7R V body only, 61MP BSI CMOS, 4K 60fps, Eye AF thế hệ mới. Máy sử dụng ít, shutter count ~1200. Đầy đủ hộp, pin dự phòng x2, sạc, dây đeo.",
    tags: ["Sony", "Mirrorless", "Full-Frame", "61MP"],
    bids: [
      { id:"b1", user:"Vũ Đình Phong", avatar:"https://i.pravatar.cc/32?img=24", amount:82_000_000, time:hb(20*60_000), isWinner:true },
      { id:"b2", user:"Trương Hữu Đức", avatar:"https://i.pravatar.cc/32?img=25", amount:80_000_000, time:hb(50*60_000) },
      { id:"b3", user:"Lâm Quốc Bảo", avatar:"https://i.pravatar.cc/32?img=26", amount:78_000_000, time:hb(90*60_000) },
      { id:"b4", user:"Vũ Đình Phong", avatar:"https://i.pravatar.cc/32?img=24", amount:76_000_000, time:hb(130*60_000) },
      { id:"b5", user:"Đinh Văn Hải", avatar:"https://i.pravatar.cc/32?img=27", amount:74_000_000, time:hb(160*60_000) },
    ]
  },
  {
    id: "a05", status: "Active",
    name: "AirPods Max USB-C Midnight 2024 Fullbox Seal",
    category: "Âm thanh", condition: "Mới 100% — Seal nguyên hộp",
    img: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop",
    startPrice: 12_000_000, currentPrice: 14_500_000, minStep: 200_000,
    startTime: hb(1 * 3_600_000), endTime: hm(3 * 3_600_000 + 21 * 60_000),
    views: 987, watchers: 143, seller: "AppleGadget_VN", sellerAvatar: "https://i.pravatar.cc/40?img=28", sellerRating: 4.8,
    desc: "AirPods Max USB-C phiên bản 2024, màu Midnight, fullbox seal chưa bóc. Hỗ trợ Spatial Audio, ANC, chống ồn chủ động thế hệ mới.",
    tags: ["Apple", "AirPods", "ANC", "Seal"],
    bids: [
      { id:"b1", user:"Đinh Thị Hoa", avatar:"https://i.pravatar.cc/32?img=29", amount:14_500_000, time:hb(10*60_000), isWinner:true },
      { id:"b2", user:"Cao Xuân Nam", avatar:"https://i.pravatar.cc/32?img=30", amount:14_200_000, time:hb(25*60_000) },
      { id:"b3", user:"Lý Thị Hằng", avatar:"https://i.pravatar.cc/32?img=31", amount:13_800_000, time:hb(40*60_000) },
      { id:"b4", user:"Đinh Thị Hoa", avatar:"https://i.pravatar.cc/32?img=29", amount:13_500_000, time:hb(52*60_000) },
      { id:"b5", user:"Phùng Văn Khải", avatar:"https://i.pravatar.cc/32?img=32", amount:13_200_000, time:hb(60*60_000) },
      { id:"b6", user:"Cao Xuân Nam", avatar:"https://i.pravatar.cc/32?img=30", amount:12_800_000, time:hb(70*60_000) },
    ]
  },
  {
    id: "a06", status: "Active",
    name: "iPhone 15 Pro Max 1TB Titan Đen Fullbox Seal",
    category: "Điện thoại", condition: "Mới 100% — Seal nguyên hộp",
    img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop",
    startPrice: 30_000_000, currentPrice: 32_500_000, minStep: 300_000,
    startTime: hb(3 * 3_600_000), endTime: hm(1 * 3_600_000 + 45 * 60_000),
    views: 5632, watchers: 512, seller: "MobileKing_SG", sellerAvatar: "https://i.pravatar.cc/40?img=33", sellerRating: 4.9,
    desc: "iPhone 15 Pro Max 1TB màu Black Titanium, fullbox seal chưa bóc. Hỗ trợ A17 Pro, camera 48MP ProRaw, USB-C ProRes video 4K 60fps.",
    tags: ["Apple", "iPhone 15", "1TB", "Pro Max"],
    bids: [
      { id:"b1", user:"Bùi Việt Hưng", avatar:"https://i.pravatar.cc/32?img=34", amount:32_500_000, time:hb(7*60_000), isWinner:true },
      { id:"b2", user:"Dương Minh Trí", avatar:"https://i.pravatar.cc/32?img=35", amount:32_000_000, time:hb(18*60_000) },
      { id:"b3", user:"Ngô Thanh Hà", avatar:"https://i.pravatar.cc/32?img=36", amount:31_500_000, time:hb(30*60_000) },
      { id:"b4", user:"Bùi Việt Hưng", avatar:"https://i.pravatar.cc/32?img=34", amount:31_000_000, time:hb(45*60_000) },
      { id:"b5", user:"Lê Anh Dũng", avatar:"https://i.pravatar.cc/32?img=37", amount:30_700_000, time:hb(55*60_000) },
      { id:"b6", user:"Dương Minh Trí", avatar:"https://i.pravatar.cc/32?img=35", amount:30_400_000, time:hb(70*60_000) },
      { id:"b7", user:"Võ Thị Mỹ Linh", avatar:"https://i.pravatar.cc/32?img=38", amount:30_100_000, time:hb(85*60_000) },
    ]
  },

  // ── SẮP DIỄN RA (Scheduled) ────────────────────────────────────────────────
  {
    id: "s01", status: "Scheduled",
    name: "Xe Mô Tô Honda CB650R 2023 ABS — Odo 2500km",
    category: "Xe cộ", condition: "Đã qua sử dụng — Tình trạng 98%",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
    startPrice: 145_000_000, currentPrice: 145_000_000, minStep: 1_000_000,
    startTime: hm(2 * 3_600_000), endTime: hm(26 * 3_600_000),
    views: 2341, watchers: 187, seller: "BikeDealsHCM", sellerAvatar: "https://i.pravatar.cc/40?img=39", sellerRating: 4.7,
    desc: "Honda CB650R 2023 ABS, màu đỏ Italy, odometer 2500km. Xe đẹp như mới, full phụ kiện chính hãng. Đăng kiểm còn hạn đến 2026.",
    tags: ["Honda", "CB650R", "ABS", "Sportbike"],
    bids: []
  },
  {
    id: "s02", status: "Scheduled",
    name: "Tranh Sơn Dầu \"Bình Minh Hội An\" — Họa Sĩ Trần Thế Vĩnh",
    category: "Nghệ thuật", condition: "Nguyên bản — Có chứng nhận",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop",
    startPrice: 18_000_000, currentPrice: 18_000_000, minStep: 500_000,
    startTime: hm(5 * 3_600_000), endTime: hm(29 * 3_600_000),
    views: 543, watchers: 62, seller: "ArtGallery_VN", sellerAvatar: "https://i.pravatar.cc/40?img=40", sellerRating: 4.6,
    desc: "Tranh sơn dầu trên canvas 80x60cm, vẽ tay 100%, có chứng nhận tác giả. Họa sĩ Trần Thế Vĩnh (Hội Mỹ Thuật TP.HCM). Giao hàng toàn quốc, bọc kỹ.",
    tags: ["Tranh nghệ thuật", "Sơn dầu", "Hội An", "Original"],
    bids: []
  },
  {
    id: "s03", status: "Scheduled",
    name: "Đồng Hồ Patek Philippe Aquanaut 5168G Platinum",
    category: "Đồng hồ", condition: "Đã qua sử dụng — Tình trạng 97%",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    startPrice: 1_500_000_000, currentPrice: 1_500_000_000, minStep: 20_000_000,
    startTime: hm(12 * 3_600_000), endTime: hm(36 * 3_600_000),
    views: 876, watchers: 45, seller: "LuxuryVN_Official", sellerAvatar: "https://i.pravatar.cc/40?img=11", sellerRating: 4.9,
    desc: "Patek Philippe Aquanaut 5168G vỏ Platinum, mặt xanh gradient, dây cao su kẹp vàng. Fullbox, thẻ bảo hành còn hạn 2027.",
    tags: ["Patek Philippe", "Platinum", "Aquanaut", "Luxury"],
    bids: []
  },
  {
    id: "s04", status: "Scheduled",
    name: "Laptop Dell Alienware m18 R2 i9-14900HX RTX 4090",
    category: "Laptop", condition: "Mới 100% — Fullbox",
    img: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=600&fit=crop",
    startPrice: 95_000_000, currentPrice: 95_000_000, minStep: 1_000_000,
    startTime: hm(18 * 3_600_000), endTime: hm(42 * 3_600_000),
    views: 1243, watchers: 234, seller: "TechDealsPro", sellerAvatar: "https://i.pravatar.cc/40?img=13", sellerRating: 4.7,
    desc: "Dell Alienware m18 R2 gaming laptop i9-14900HX, RTX 4090 16GB, 64GB DDR5, 2TB NVMe. Màn 18\" QHD+ 165Hz. Fullbox bảo hành 2 năm.",
    tags: ["Dell", "Alienware", "RTX 4090", "Gaming"],
    bids: []
  },

  // ── ĐÃ KẾT THÚC (Ended) ──────────────────────────────────────────────────
  {
    id: "e01", status: "Ended",
    name: "Túi Louis Vuitton Neverfull MM Monogram Canvas",
    category: "Túi xách", condition: "Đã qua sử dụng — Tình trạng 93%",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop",
    startPrice: 18_000_000, currentPrice: 27_800_000, minStep: 300_000,
    startTime: hb(48 * 3_600_000), endTime: hb(24 * 3_600_000),
    views: 3124, watchers: 0, seller: "VIPBagViet", sellerAvatar: "https://i.pravatar.cc/40?img=12", sellerRating: 4.8,
    desc: "LV Neverfull MM canvas monogram, năm 2021. Tình trạng 93%, có nhẹ dấu sử dụng ở quai. Fullset hộp, bụi, receipt.",
    tags: ["Louis Vuitton", "Neverfull", "Monogram", "Luxury"],
    bids: [
      { id:"b1", user:"Trần Thị Mai", avatar:"https://i.pravatar.cc/32?img=41", amount:27_800_000, time:hb(24*3_600_000+10*60_000), isWinner:true },
      { id:"b2", user:"Lê Ngọc Trinh", avatar:"https://i.pravatar.cc/32?img=22", amount:27_200_000, time:hb(25*3_600_000) },
      { id:"b3", user:"Hoàng Gia Linh", avatar:"https://i.pravatar.cc/32?img=9", amount:26_500_000, time:hb(27*3_600_000) },
      { id:"b4", user:"Đỗ Phương Thảo", avatar:"https://i.pravatar.cc/32?img=21", amount:25_500_000, time:hb(30*3_600_000) },
      { id:"b5", user:"Trần Thị Mai", avatar:"https://i.pravatar.cc/32?img=41", amount:24_000_000, time:hb(34*3_600_000) },
      { id:"b6", user:"Lê Ngọc Trinh", avatar:"https://i.pravatar.cc/32?img=22", amount:22_000_000, time:hb(38*3_600_000) },
      { id:"b7", user:"Nguyễn Thị Lan", avatar:"https://i.pravatar.cc/32?img=20", amount:20_000_000, time:hb(42*3_600_000) },
      { id:"b8", user:"Hoàng Gia Linh", avatar:"https://i.pravatar.cc/32?img=9", amount:19_000_000, time:hb(45*3_600_000) },
    ]
  },
  {
    id: "e02", status: "Ended",
    name: "iPhone 14 Pro Max 256GB Deep Purple Fullbox",
    category: "Điện thoại", condition: "Đã qua sử dụng — Tình trạng 99%",
    img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop",
    startPrice: 16_000_000, currentPrice: 20_500_000, minStep: 200_000,
    startTime: hb(72 * 3_600_000), endTime: hb(48 * 3_600_000),
    views: 4231, watchers: 0, seller: "MobileKing_SG", sellerAvatar: "https://i.pravatar.cc/40?img=33", sellerRating: 4.9,
    desc: "iPhone 14 Pro Max 256GB Deep Purple, pin 100%, fullbox. Sử dụng 6 tháng, không trầy xước, màn đẹp.",
    tags: ["Apple", "iPhone 14", "Deep Purple", "Fullbox"],
    bids: [
      { id:"b1", user:"Bùi Thành Đạt", avatar:"https://i.pravatar.cc/32?img=19", amount:20_500_000, time:hb(48*3_600_000+5*60_000), isWinner:true },
      { id:"b2", user:"Lê Anh Dũng", avatar:"https://i.pravatar.cc/32?img=37", amount:20_200_000, time:hb(49*3_600_000) },
      { id:"b3", user:"Dương Minh Trí", avatar:"https://i.pravatar.cc/32?img=35", amount:19_800_000, time:hb(51*3_600_000) },
      { id:"b4", user:"Bùi Thành Đạt", avatar:"https://i.pravatar.cc/32?img=19", amount:19_400_000, time:hb(54*3_600_000) },
      { id:"b5", user:"Ngô Thanh Hà", avatar:"https://i.pravatar.cc/32?img=36", amount:18_800_000, time:hb(58*3_600_000) },
      { id:"b6", user:"Lê Anh Dũng", avatar:"https://i.pravatar.cc/32?img=37", amount:18_000_000, time:hb(63*3_600_000) },
      { id:"b7", user:"Vũ Đình Phong", avatar:"https://i.pravatar.cc/32?img=24", amount:17_200_000, time:hb(68*3_600_000) },
      { id:"b8", user:"Phùng Văn Khải", avatar:"https://i.pravatar.cc/32?img=32", amount:16_600_000, time:hb(71*3_600_000) },
    ]
  },
  {
    id: "e03", status: "Ended",
    name: "Samsung Galaxy S24 Ultra 12GB/512GB Titanium",
    category: "Điện thoại", condition: "Mới 100% — Seal",
    img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop",
    startPrice: 22_000_000, currentPrice: 26_300_000, minStep: 300_000,
    startTime: hb(96 * 3_600_000), endTime: hb(72 * 3_600_000),
    views: 2876, watchers: 0, seller: "MobileKing_SG", sellerAvatar: "https://i.pravatar.cc/40?img=33", sellerRating: 4.9,
    desc: "Samsung Galaxy S24 Ultra 512GB Titanium Gray, màn 6.8\" QHD+ 120Hz, S Pen, camera 200MP, pin 5000mAh. Fullbox seal.",
    tags: ["Samsung", "S24 Ultra", "S Pen", "Titanium"],
    bids: [
      { id:"b1", user:"Đào Văn Tú", avatar:"https://i.pravatar.cc/32?img=18", amount:26_300_000, time:hb(72*3_600_000+8*60_000), isWinner:true },
      { id:"b2", user:"Phan Đình Khoa", avatar:"https://i.pravatar.cc/32?img=16", amount:26_000_000, time:hb(73*3_600_000) },
      { id:"b3", user:"Lê Quang Vinh", avatar:"https://i.pravatar.cc/32?img=17", amount:25_500_000, time:hb(75*3_600_000) },
      { id:"b4", user:"Đào Văn Tú", avatar:"https://i.pravatar.cc/32?img=18", amount:25_000_000, time:hb(78*3_600_000) },
      { id:"b5", user:"Trần Đức Kiên", avatar:"https://i.pravatar.cc/32?img=14", amount:24_300_000, time:hb(82*3_600_000) },
      { id:"b6", user:"Phan Đình Khoa", avatar:"https://i.pravatar.cc/32?img=16", amount:23_600_000, time:hb(87*3_600_000) },
      { id:"b7", user:"Nguyễn Hoàng Long", avatar:"https://i.pravatar.cc/32?img=15", amount:23_000_000, time:hb(91*3_600_000) },
    ]
  },
  {
    id: "e04", status: "Ended",
    name: "Bộ LEGO Technic Bugatti Chiron 42083 — 3599 Miếng",
    category: "Đồ chơi", condition: "Mới 100% — Hộp nguyên seal",
    img: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=600&fit=crop",
    startPrice: 7_000_000, currentPrice: 9_200_000, minStep: 100_000,
    startTime: hb(120 * 3_600_000), endTime: hb(96 * 3_600_000),
    views: 1532, watchers: 0, seller: "ToyCollector_VN", sellerAvatar: "https://i.pravatar.cc/40?img=42", sellerRating: 4.5,
    desc: "LEGO Technic Bugatti Chiron 42083, 3599 miếng, hộp nguyên seal chưa bóc. Retired set, giá thị trường leo cao. Giao hàng toàn quốc.",
    tags: ["LEGO", "Technic", "Bugatti", "Retired"],
    bids: [
      { id:"b1", user:"Nguyễn Văn Sơn", avatar:"https://i.pravatar.cc/32?img=8", amount:9_200_000, time:hb(96*3_600_000+15*60_000), isWinner:true },
      { id:"b2", user:"Lý Minh Châu", avatar:"https://i.pravatar.cc/32?img=7", amount:9_000_000, time:hb(97*3_600_000) },
      { id:"b3", user:"Đặng Quốc Huy", avatar:"https://i.pravatar.cc/32?img=6", amount:8_700_000, time:hb(99*3_600_000) },
      { id:"b4", user:"Nguyễn Văn Sơn", avatar:"https://i.pravatar.cc/32?img=8", amount:8_400_000, time:hb(102*3_600_000) },
      { id:"b5", user:"Võ Thanh Bình", avatar:"https://i.pravatar.cc/32?img=5", amount:8_000_000, time:hb(107*3_600_000) },
      { id:"b6", user:"Lý Minh Châu", avatar:"https://i.pravatar.cc/32?img=7", amount:7_600_000, time:hb(112*3_600_000) },
    ]
  },

  // ── KHÔNG THÀNH CÔNG (Failed) ─────────────────────────────────────────────
  {
    id: "f01", status: "Failed",
    name: "Đồng Hồ Audemars Piguet Royal Oak 15500ST",
    category: "Đồng hồ", condition: "Đã qua sử dụng — Tình trạng 90%",
    img: "https://images.unsplash.com/photo-1614164186166-7f6ac9a6059c?w=600&h=600&fit=crop",
    startPrice: 800_000_000, currentPrice: 800_000_000, minStep: 10_000_000,
    startTime: hb(48 * 3_600_000), endTime: hb(24 * 3_600_000),
    views: 234, watchers: 0, seller: "LuxuryVN_Official", sellerAvatar: "https://i.pravatar.cc/40?img=11", sellerRating: 4.9,
    desc: "AP Royal Oak 15500ST Blue, fullbox với thẻ bảo hành. Tình trạng 90%, có một vài xước nhẹ ở khóa.",
    tags: ["AP", "Royal Oak", "Blue", "Luxury"],
    bids: []
  },
  {
    id: "f02", status: "Failed",
    name: "Bộ Sưu Tập Tem Bưu Chính Việt Nam 1945–1975 (450 Con)",
    category: "Đồ sưu tầm", condition: "Cổ vật — Giấy tờ đầy đủ",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
    startPrice: 25_000_000, currentPrice: 25_000_000, minStep: 500_000,
    startTime: hb(72 * 3_600_000), endTime: hb(48 * 3_600_000),
    views: 187, watchers: 0, seller: "PhilatelicVN", sellerAvatar: "https://i.pravatar.cc/40?img=43", sellerRating: 4.4,
    desc: "450 con tem bưu chính Việt Nam giai đoạn 1945–1975, bao gồm bộ tem kháng chiến quý hiếm. Có album bảo quản, chứng nhận xác thực.",
    tags: ["Tem bưu chính", "Sưu tầm", "Cổ vật", "Việt Nam"],
    bids: [
      { id:"b1", user:"Trương Hữu Đức", avatar:"https://i.pravatar.cc/32?img=25", amount:26_500_000, time:hb(50*3_600_000) },
    ]
  },
  {
    id: "f03", status: "Failed",
    name: "MacBook Pro 16\" M1 Max 64GB/2TB Space Gray 2021",
    category: "Laptop", condition: "Đã qua sử dụng — Tình trạng 88%",
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop",
    startPrice: 45_000_000, currentPrice: 42_000_000, minStep: 500_000,
    startTime: hb(96 * 3_600_000), endTime: hb(72 * 3_600_000),
    views: 432, watchers: 0, seller: "TechDealsPro", sellerAvatar: "https://i.pravatar.cc/40?img=13", sellerRating: 4.7,
    desc: "MacBook Pro 16 M1 Max 64GB/2TB, pin 82%, tình trạng 88% có vài trầy xước nhẹ trên nắp. Lý do không thành công: giá khởi điểm đặt quá cao.",
    tags: ["Apple", "MacBook", "M1 Max", "64GB"],
    bids: [
      { id:"b1", user:"Lâm Quốc Bảo", avatar:"https://i.pravatar.cc/32?img=26", amount:42_000_000, time:hb(75*3_600_000) },
      { id:"b2", user:"Đinh Văn Hải", avatar:"https://i.pravatar.cc/32?img=27", amount:40_000_000, time:hb(80*3_600_000) },
      { id:"b3", user:"Vũ Đình Phong", avatar:"https://i.pravatar.cc/32?img=24", amount:38_000_000, time:hb(85*3_600_000) },
    ]
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BidCountdown — chỉ dùng cho Active
// ─────────────────────────────────────────────────────────────────────────────
function BidCountdown({ endTime, size = "sm" }: { endTime: string; size?: "sm" | "lg" }) {
  const { h, m, s, total } = useCountdown(endTime);
  const urgent = total < 3_600_000;
  if (size === "lg") return (
    <div className={`flex items-center gap-1 font-mono font-extrabold text-2xl ${urgent ? "text-red-500 animate-pulse" : "text-nexus-600"}`}>
      <span className={`bg-gray-900 text-white px-3 py-1.5 rounded-xl`}>{pad(h)}</span>
      <span>:</span>
      <span className={`bg-gray-900 text-white px-3 py-1.5 rounded-xl`}>{pad(m)}</span>
      <span>:</span>
      <span className={`bg-gray-900 text-white px-3 py-1.5 rounded-xl`}>{pad(s)}</span>
    </div>
  );
  return (
    <span className={`font-mono text-xs font-bold ${urgent ? "text-red-500" : "text-gray-700"}`}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuctionCard
// ─────────────────────────────────────────────────────────────────────────────
function AuctionCard({ a, onSelect }: { a: AuctionItem; onSelect: (a: AuctionItem) => void }) {
  const winner = a.bids.find(b => b.isWinner);
  const isEnded = a.status === "Ended";
  const isFailed = a.status === "Failed";
  const isScheduled = a.status === "Scheduled";
  const fallback = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop";

  return (
    <div
      onClick={() => onSelect(a)}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {a.featured && <span className="absolute top-2 left-2 z-10 bg-amber-400 text-white text-[10px] font-extrabold px-2 py-1 rounded-full flex items-center gap-1"><Star size={9}/> NỔI BẬT</span>}
        {a.hot && !a.featured && <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full flex items-center gap-1"><Flame size={9}/> HOT</span>}
        <span className={`absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-1 rounded-full ${
          isEnded ? "bg-gray-200 text-gray-600" :
          isFailed ? "bg-red-100 text-red-500" :
          isScheduled ? "bg-amber-100 text-amber-600" :
          "bg-emerald-100 text-emerald-600"
        }`}>
          {isEnded ? "✓ Đã kết thúc" : isFailed ? "✗ Không thành" : isScheduled ? "⏳ Sắp mở" : "● Đang đấu giá"}
        </span>
        <img src={a.img} alt={a.name} loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isFailed || isEnded ? "grayscale-[30%]" : ""}`}
          onError={e => { (e.target as HTMLImageElement).src = fallback; }}
        />
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-nexus-500 font-semibold mb-1">{a.category}</p>
        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug mb-3 flex-1">{a.name}</p>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-[10px] text-gray-400">Khởi điểm</p>
            <p className="text-xs font-bold text-gray-600">{fmtVND(a.startPrice)}</p>
          </div>
          <div className={`rounded-xl p-2 text-center ${a.currentPrice > a.startPrice ? "bg-nexus-50" : "bg-gray-50"}`}>
            <p className="text-[10px] text-gray-400">{isEnded ? "Giá thắng" : isFailed ? "Bid cao nhất" : "Giá hiện tại"}</p>
            <p className={`text-xs font-extrabold ${a.currentPrice > a.startPrice ? "text-nexus-600" : "text-gray-600"}`}>{fmtVND(a.currentPrice)}</p>
          </div>
        </div>

        {/* Winner (Ended) */}
        {isEnded && winner && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3">
            <Trophy size={12} className="text-emerald-600 shrink-0"/>
            <div className="min-w-0">
              <p className="text-[10px] text-emerald-500">Người thắng</p>
              <p className="text-xs font-bold text-emerald-700 truncate">{winner.user}</p>
            </div>
          </div>
        )}

        {/* Failed reason */}
        {isFailed && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
            <AlertCircle size={12} className="text-red-400 shrink-0"/>
            <p className="text-[10px] text-red-400">Không đạt giá tối thiểu / hết giờ không có bid</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-50 pt-2.5 mt-auto">
          <span className="flex items-center gap-1"><Eye size={10}/> {a.views.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Gavel size={10}/> {a.bids.length} lượt</span>
          {a.status === "Active" && (
            <span className="flex items-center gap-1 text-red-500 font-semibold"><Timer size={10}/> <BidCountdown endTime={a.endTime}/></span>
          )}
          {a.status === "Scheduled" && (
            <span className="flex items-center gap-1 text-amber-500 font-semibold"><Clock size={10}/> {new Date(a.startTime).toLocaleString("vi-VN",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"})}</span>
          )}
          {(isEnded||isFailed) && (
            <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(a.endTime).toLocaleDateString("vi-VN")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BidHistoryTable
// ─────────────────────────────────────────────────────────────────────────────
function BidHistoryTable({ bids, startPrice }: { bids: BidRecord[]; startPrice: number }) {
  if (!bids.length) return (
    <div className="text-center py-8 text-gray-400 text-sm">
      <Gavel size={32} className="mx-auto mb-2 opacity-30"/>
      Chưa có lượt đặt giá nào.
    </div>
  );
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 w-8">#</th>
            <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500">Người đặt giá</th>
            <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500">Số tiền</th>
            <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500">+Chênh lệch</th>
            <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500">Thời gian</th>
            <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-500">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {bids.map((b, i) => {
            const prev = bids[i + 1]?.amount ?? startPrice;
            const diff = b.amount - prev;
            return (
              <tr key={b.id} className={`border-b border-gray-50 last:border-0 ${b.isWinner ? "bg-emerald-50" : i === 0 && !b.isWinner ? "bg-indigo-50/40" : ""}`}>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{bids.length - i}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src={b.avatar} alt="" className="w-7 h-7 rounded-full border border-gray-200 shrink-0"/>
                    <span className="text-xs font-semibold text-gray-700">{b.user}</span>
                    {b.isWinner && <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full"><Trophy size={8}/> Thắng</span>}
                    {i === 0 && !b.isWinner && <span className="bg-nexus-100 text-nexus-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Cao nhất</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-extrabold ${b.isWinner ? "text-emerald-600" : i === 0 ? "text-nexus-600" : "text-gray-700"}`}>{fmtVND(b.amount)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[10px] font-bold text-emerald-600">+{fmtVND(diff)}</span>
                </td>
                <td className="px-4 py-3 text-right text-[10px] text-gray-400 whitespace-nowrap">
                  {new Date(b.time).toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                </td>
                <td className="px-4 py-3 text-center">
                  {b.isWinner
                    ? <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold"><CheckCircle size={9}/> Thắng cuộc</span>
                    : i === 0 && !b.isWinner
                      ? <span className="inline-flex items-center gap-1 text-[9px] bg-nexus-100 text-nexus-600 px-2 py-0.5 rounded-full font-bold"><TrendingUp size={9}/> Đang dẫn</span>
                      : <span className="inline-flex items-center gap-1 text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"><XCircle size={9}/> Bị vượt</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auction Detail Modal (Panel bên phải)
// ─────────────────────────────────────────────────────────────────────────────
function AuctionDetailPanel({ a, onClose }: { a: AuctionItem; onClose: () => void }) {
  const { isLoggedIn, user } = useAuth();
  const canBid = !isLoggedIn || user?.role === "BUYER";
  const navigate = useNavigate();
  const { h, m, s } = useCountdown(a.endTime);
  const isActive = a.status === "Active";
  const winner = a.bids.find(b => b.isWinner);
  const fallback = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <Gavel size={20} className="text-nexus-500"/>
            <span className="font-extrabold text-gray-800">Chi tiết đấu giá</span>
            {isActive && <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"><X size={16}/></button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image + info */}
          <div className="grid md:grid-cols-2 gap-0">
            <div className="aspect-square bg-gray-50 overflow-hidden">
              <img src={a.img} alt={a.name} className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = fallback; }}/>
            </div>
            <div className="p-6 flex flex-col">
              <p className="text-xs font-semibold text-nexus-500 mb-1">{a.category} · {a.condition}</p>
              <h2 className="font-extrabold text-gray-900 text-lg leading-snug mb-4">{a.name}</h2>

              {/* Price box */}
              <div className={`rounded-2xl p-4 mb-4 ${isActive ? "bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100" : "bg-gray-50 border border-gray-100"}`}>
                <p className="text-xs text-gray-400 mb-1">Giá {isActive ? "hiện tại" : a.status === "Ended" ? "thắng cuộc" : "khởi điểm"}</p>
                <p className={`text-2xl font-extrabold ${isActive ? "text-nexus-600" : "text-gray-700"}`}>{fmtVND(a.currentPrice)}</p>
                <p className="text-xs text-gray-400 mt-1">Khởi điểm: {fmtVND(a.startPrice)} · Bước giá: {fmtVND(a.minStep)}</p>
              </div>

              {/* Countdown */}
              {isActive && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Timer size={11}/> Thời gian còn lại:</p>
                  <BidCountdown endTime={a.endTime} size="lg"/>
                </div>
              )}

              {/* Winner */}
              {a.status === "Ended" && winner && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <Trophy size={20} className="text-amber-500 shrink-0"/>
                  <div>
                    <p className="text-xs text-emerald-500 font-semibold">Người chiến thắng</p>
                    <p className="font-bold text-emerald-700">{winner.user}</p>
                    <p className="text-xs text-emerald-500">{fmtVND(winner.amount)}</p>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                {[
                  { icon: <Eye size={13}/>, label: "Lượt xem", val: a.views.toLocaleString() },
                  { icon: <Gavel size={13}/>, label: "Lượt bid", val: a.bids.length },
                  { icon: <Users size={13}/>, label: "Theo dõi", val: a.watchers },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-2">
                    <div className="flex items-center justify-center gap-1 text-nexus-500 mb-1">{s.icon}</div>
                    <p className="font-extrabold text-gray-800 text-sm">{s.val}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Seller */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                <img src={a.sellerAvatar} alt="" className="w-9 h-9 rounded-full border border-gray-200"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">{a.seller}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({length:5}).map((_,i)=><Star key={i} size={9} className={i < Math.floor(a.sellerRating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}/>)}
                    <span className="text-[10px] text-gray-400 ml-1">{a.sellerRating}</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-50 border rounded-full px-2 py-1 flex items-center gap-0.5"><Shield size={9}/> Xác minh</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 border-t border-gray-50">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><BarChart2 size={15} className="text-nexus-500"/> Mô tả sản phẩm</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{a.desc}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {a.tags.map(t => (
                <span key={t} className="text-[10px] bg-indigo-50 text-nexus-600 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>

          {/* Bid history */}
          <div className="px-6 py-4 border-t border-gray-50">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <History size={15} className="text-nexus-500"/>
              Lịch sử đặt giá
              <span className="ml-auto text-xs text-gray-400 font-normal">{a.bids.length} lượt</span>
            </h3>
            <BidHistoryTable bids={a.bids} startPrice={a.startPrice}/>
          </div>

          {/* Scheduled info */}
          {a.status === "Scheduled" && (
            <div className="px-6 py-4 border-t border-gray-50">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Calendar size={18} className="text-amber-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-amber-700 mb-1">Phiên đấu giá chưa bắt đầu</p>
                  <p className="text-sm text-amber-600">Khai mạc: <strong>{new Date(a.startTime).toLocaleString("vi-VN")}</strong></p>
                  <p className="text-sm text-amber-600">Kết thúc: <strong>{new Date(a.endTime).toLocaleString("vi-VN")}</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Footer */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
          {isActive ? (
            !isLoggedIn ? (
              <div className="space-y-2">
                <p className="text-xs text-center text-gray-500">Đăng nhập để tham gia đấu giá</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigate("/login")} className="bg-nexus-500 hover:bg-nexus-600 text-white font-bold py-3 rounded-xl transition-colors">Đăng nhập</button>
                  <button onClick={() => navigate("/register")} className="border-2 border-nexus-400 text-nexus-500 hover:bg-indigo-50 font-semibold py-3 rounded-xl transition-colors">Đăng ký</button>
                </div>
              </div>
            ) : canBid ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Bước giá tối thiểu: <strong className="text-nexus-600">{fmtVND(a.minStep)}</strong> · Hiện tại: <strong className="text-nexus-600">{fmtVND(a.currentPrice)}</strong></p>
                <button className="w-full bg-gradient-to-r from-nexus-600 to-violet-500 hover:from-nexus-700 hover:to-violet-600 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                  <Gavel size={18}/> Đặt giá — {fmtVND(a.currentPrice + a.minStep)}
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 text-center">
                {user?.role === "ADMIN"
                  ? "Quản trị viên không tham gia đấu giá để đảm bảo tính công bằng."
                  : "Tài khoản người bán không tham gia đấu giá."}
              </div>
            )
          ) : a.status === "Scheduled" ? (
            <button className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
              <Bell size={16}/> Nhắc tôi khi khai mạc
            </button>
          ) : (
            <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-colors">
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "Active",    label: "Đang diễn ra", icon: <Flame size={13}/>,       color: "text-emerald-600" },
  { key: "Scheduled", label: "Sắp diễn ra",  icon: <Calendar size={13}/>,    color: "text-amber-600"   },
  { key: "Ended",    label: "Đã kết thúc",   icon: <CheckCircle size={13}/>, color: "text-blue-600"    },
  { key: "Failed",   label: "Không thành",   icon: <XCircle size={13}/>,     color: "text-red-500"     },
] as const;

export default function AuctionListPage() {
  const [tab, setTab] = useState<"Active"|"Scheduled"|"Ended"|"Failed">("Active");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuctionItem | null>(null);
  const [sortBy, setSortBy] = useState<"newest"|"price_asc"|"price_desc"|"bids">("newest");
  const searchRef = useRef<HTMLInputElement>(null);

  const counts: Record<string, number> = {
    Active: AUCTIONS.filter(a => a.status === "Active").length,
    Scheduled: AUCTIONS.filter(a => a.status === "Scheduled").length,
    Ended: AUCTIONS.filter(a => a.status === "Ended").length,
    Failed: AUCTIONS.filter(a => a.status === "Failed").length,
  };

  let items = AUCTIONS.filter(a => a.status === tab);
  if (search.trim()) {
    const kw = search.toLowerCase();
    items = items.filter(a =>
      a.name.toLowerCase().includes(kw) ||
      a.category.toLowerCase().includes(kw) ||
      a.tags.some(t => t.toLowerCase().includes(kw))
    );
  }
  items = [...items].sort((a, b) => {
    if (sortBy === "price_asc")  return a.currentPrice - b.currentPrice;
    if (sortBy === "price_desc") return b.currentPrice - a.currentPrice;
    if (sortBy === "bids")       return b.bids.length - a.bids.length;
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  // Global bid history (toàn bộ, không phụ thuộc tab)
  const allBids = AUCTIONS.flatMap(a =>
    a.bids.map(b => ({ ...b, auctionName: a.name, auctionId: a.id, status: a.status }))
  ).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {selected && <AuctionDetailPanel a={selected} onClose={() => setSelected(null)}/>}

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-700 via-nexus-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gavel size={28} className="text-amber-300"/>
                <h1 className="text-3xl font-extrabold">Đấu Giá Trực Tuyến</h1>
                <span className="bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full animate-pulse ml-1">LIVE</span>
              </div>
              <p className="text-white/75 text-sm max-w-lg">Hàng nghìn sản phẩm xa xỉ, đồ sưu tầm và công nghệ. Đặt giá ngay — không cần phí tham gia.</p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                {[
                  { icon:<Flame size={14}/>, label:`${counts.Active} phiên đang mở` },
                  { icon:<Calendar size={14}/>, label:`${counts.Scheduled} sắp khai mạc` },
                  { icon:<Shield size={14}/>, label:"Bảo đảm an toàn" },
                  { icon:<Zap size={14}/>, label:"Thanh toán tức thì" },
                ].map(s=>(
                  <div key={s.label} className="flex items-center gap-1.5 text-white/80"><span className="text-amber-300">{s.icon}</span>{s.label}</div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                { label:"Đang diễn ra", val:counts.Active, color:"bg-white/15 border-white/20", icon:<Flame size={16} className="text-amber-300"/> },
                { label:"Sắp mở",      val:counts.Scheduled, color:"bg-amber-400/20 border-amber-300/20", icon:<Calendar size={16} className="text-amber-300"/> },
                { label:"Đã kết thúc", val:counts.Ended, color:"bg-white/10 border-white/15", icon:<CheckCircle size={16} className="text-emerald-300"/> },
                { label:"Tổng bid",    val:`${AUCTIONS.reduce((s,a)=>s+a.bids.length,0)}`, color:"bg-violet-400/20 border-violet-300/20", icon:<Gavel size={16} className="text-violet-300"/> },
              ].map(s=>(
                <div key={s.label} className={`${s.color} border rounded-2xl p-3 text-white text-center`}>
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="font-extrabold text-xl">{s.val}</p>
                  <p className="text-[10px] text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* ── Tabs + Search + Sort ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm">
          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-none border-b border-gray-100">
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.key ? "border-nexus-500 text-nexus-600 bg-indigo-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}>
                <span className={tab === t.key ? t.color : ""}>{t.icon}</span>
                {t.label}
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-nexus-100 text-nexus-600" : "bg-gray-100 text-gray-500"
                }`}>{counts[t.key]}</span>
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-nexus-300">
              <Search size={14} className="text-gray-400 shrink-0"/>
              <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Tìm kiếm phiên đấu giá..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"/>
              {search && <button onClick={()=>setSearch("")}><X size={13} className="text-gray-400 hover:text-gray-600"/></button>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={13} className="text-gray-400"/>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value as typeof sortBy)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none cursor-pointer hover:border-nexus-300">
                <option value="newest">Mới nhất</option>
                <option value="price_desc">Giá cao nhất</option>
                <option value="price_asc">Giá thấp nhất</option>
                <option value="bids">Nhiều lượt bid</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm text-center py-20 text-gray-400">
            <Gavel size={48} className="mx-auto mb-3 opacity-20"/>
            <p className="font-semibold">Không tìm thấy phiên đấu giá nào</p>
            {search && <button onClick={()=>setSearch("")} className="mt-2 text-nexus-500 text-sm hover:underline">Xóa tìm kiếm</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(a => <AuctionCard key={a.id} a={a} onSelect={setSelected}/>)}
          </div>
        )}

        {/* ── Lịch sử đấu giá toàn cầu ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-extrabold text-gray-800 flex items-center gap-2">
              <History size={18} className="text-nexus-500"/>
              Lịch Sử Đặt Giá Gần Đây
            </h2>
            <span className="text-xs text-gray-400">{allBids.length} giao dịch mới nhất</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500">Người đặt giá</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500">Phiên đấu giá</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">Số tiền</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-gray-500">Trạng thái phiên</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-500">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {allBids.map((b, i) => (
                  <tr key={`${b.auctionId}-${b.id}`}
                    className={`border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 cursor-pointer transition-colors ${b.isWinner ? "bg-emerald-50/30" : ""}`}
                    onClick={() => {
                      const auction = AUCTIONS.find(a => a.id === b.auctionId);
                      if (auction) setSelected(auction);
                    }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <img src={b.avatar} alt="" className="w-7 h-7 rounded-full border border-gray-200 shrink-0"/>
                        <span className="text-xs font-semibold text-gray-700">{b.user}</span>
                        {b.isWinner && <Trophy size={11} className="text-amber-400"/>}
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <p className="text-xs text-gray-600 line-clamp-1">{b.auctionName}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-extrabold ${b.isWinner ? "text-emerald-600" : i === 0 ? "text-nexus-600" : "text-gray-700"}`}>{fmtVND(b.amount)}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === "Active" ? "bg-emerald-100 text-emerald-600" :
                        b.status === "Ended" ? "bg-gray-100 text-gray-500" :
                        "bg-red-100 text-red-500"
                      }`}>
                        {b.status === "Active" ? "Đang diễn ra" : b.status === "Ended" ? "Đã kết thúc" : "Không thành"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(b.time).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Info Banner ──────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon:<Shield size={22} className="text-emerald-500"/>, title:"Giao dịch an toàn", desc:"Mọi sản phẩm được kiểm định. Thanh toán qua escrow — tiền chỉ chuyển khi bạn nhận hàng.", bg:"bg-emerald-50 border-emerald-100" },
            { icon:<Zap size={22} className="text-amber-500"/>,      title:"Kết quả tức thì",  desc:"Thắng đấu giá nhận thông báo ngay lập tức. Thời gian thanh toán 24h sau khi phiên kết thúc.", bg:"bg-amber-50 border-amber-100" },
            { icon:<ArrowUpRight size={22} className="text-nexus-500"/>, title:"Giá trị thực", desc:"Giá khởi điểm luôn thấp hơn thị trường 20–30%. Cơ hội sở hữu hàng hiệu giá tốt nhất.", bg:"bg-indigo-50 border-indigo-100" },
          ].map(s=>(
            <div key={s.title} className={`${s.bg} border rounded-2xl p-5`}>
              <div className="mb-3">{s.icon}</div>
              <p className="font-bold text-gray-800 mb-1.5">{s.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
