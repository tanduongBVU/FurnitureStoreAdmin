import { useState, useEffect } from "react";
import api from "../../services/Api";
import FieldError from "../../components/FieldError/FieldError";
import { required, email, phoneVN, maxLength, imagePath, url, custom } from "../../utils/validators";
import "./SiteSettings.css";

const TABS = [
  {
    id: "brand",
    label: "Thương hiệu & Màu sắc",
    groups: [
      {
        title: "Màu sắc thương hiệu",
        fields: [
          { key: "theme.walnut",   label: "Màu chủ đạo (nâu walnut)", type: "color" },
          { key: "theme.cream",    label: "Màu nền kem", type: "color" },
          { key: "theme.gold",     label: "Màu vàng nhấn", type: "color" },
          { key: "theme.goldDark", label: "Màu vàng đậm (nút, giá)", type: "color" },
        ],
      },
      {
        title: "Banner khuyến mãi (toàn site)",
        fields: [
          {
            key: "promo.banner.enabled",
            label: "Hiển thị banner",
            type: "select",
            options: [
              { value: "false", label: "Tắt" },
              { value: "true", label: "Bật" },
            ],
          },
          { key: "promo.banner.text",     label: "Nội dung banner", type: "text" },
          { key: "promo.banner.linkText", label: "Chữ nút bấm", type: "text" },
          { key: "promo.banner.linkUrl",  label: "Đường dẫn khi bấm vào (VD: /sale)", type: "text" },
          { key: "promo.banner.bg",        label: "Màu nền banner", type: "color" },
          { key: "promo.banner.textColor", label: "Màu chữ banner", type: "color" },
        ],
      },
    ],
  },
  {
    id: "home",
    label: "Trang chủ",
    groups: [
      {
        title: "Chế độ hiển thị Banner",
        fields: [
          {
            key: "hero.mode",
            label: "Kiểu banner trang chủ",
            type: "select",
            options: [
              { value: "slides", label: "Xoay vòng 3 ảnh (mặc định)" },
              { value: "video", label: "1 video nền duy nhất" },
            ],
            hint: "Chọn 'video' sẽ thay thế HOÀN TOÀN slider — chỉ còn 1 video nền, không còn dots/mũi tên chuyển slide.",
          },
        ],
      },
      {
        title: "Slide 1 — Banner trang chủ",
        showIf: v => (v["hero.mode"] || "slides") === "slides",
        fields: [
          { key: "hero.slide1.title",    label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "hero.slide1.subtitle", label: "Mô tả ngắn", type: "text" },
          { key: "hero.slide1.image",    label: "URL ảnh nền", type: "text" },
          { key: "hero.slide1.accent",   label: "Màu nhấn slide", type: "color" },
          { key: "hero.slide1.bg",       label: "Màu nền slide", type: "color" },
        ],
      },
      {
        title: "Slide 2 — Banner trang chủ",
        showIf: v => (v["hero.mode"] || "slides") === "slides",
        fields: [
          { key: "hero.slide2.title",    label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "hero.slide2.subtitle", label: "Mô tả ngắn", type: "text" },
          { key: "hero.slide2.image",    label: "URL ảnh nền", type: "text" },
          { key: "hero.slide2.accent",   label: "Màu nhấn slide", type: "color" },
          { key: "hero.slide2.bg",       label: "Màu nền slide", type: "color" },
        ],
      },
      {
        title: "Slide 3 — Banner trang chủ",
        showIf: v => (v["hero.mode"] || "slides") === "slides",
        fields: [
          { key: "hero.slide3.title",    label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "hero.slide3.subtitle", label: "Mô tả ngắn", type: "text" },
          { key: "hero.slide3.image",    label: "URL ảnh nền", type: "text" },
          { key: "hero.slide3.accent",   label: "Màu nhấn slide", type: "color" },
          { key: "hero.slide3.bg",       label: "Màu nền slide", type: "color" },
        ],
      },
      {
        title: "Video nền (khi chọn kiểu Video)",
        showIf: v => v["hero.mode"] === "video",
        fields: [
          { key: "hero.video.url",      label: "URL video nền", type: "text", hint: "Video nên nhẹ, không tiếng (site tự tắt tiếng khi phát)." },
          { key: "hero.video.poster",   label: "URL ảnh poster (hiện trong lúc video tải)", type: "text" },
          { key: "hero.video.title",    label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "hero.video.subtitle", label: "Mô tả ngắn", type: "text" },
          { key: "hero.video.accent",   label: "Màu nhấn", type: "color" },
          { key: "hero.video.bg",       label: "Màu nền (dự phòng khi video chưa tải)", type: "color" },
        ],
      },
      {
        title: "Mục Giới thiệu (trang chủ)",
        fields: [
          { key: "about.image",       label: "URL ảnh showroom", type: "text" },
          { key: "about.title",       label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "about.description", label: "Mô tả", type: "textarea" },
          { key: "about.stat1Number", label: "Số liệu 1 — số", type: "text" },
          { key: "about.stat1Label",  label: "Số liệu 1 — nhãn", type: "text" },
          { key: "about.stat2Number", label: "Số liệu 2 — số", type: "text" },
          { key: "about.stat2Label",  label: "Số liệu 2 — nhãn", type: "text" },
          { key: "about.stat3Number", label: "Số liệu 3 — số", type: "text" },
          { key: "about.stat3Label",  label: "Số liệu 3 — nhãn", type: "text" },
        ],
      },
      {
        title: "Danh mục phòng (trang chủ)",
        fields: [
          { key: "rooms.room1.image", label: "Phòng Khách — URL ảnh", type: "text" },
          { key: "rooms.room2.image", label: "Phòng Ngủ — URL ảnh", type: "text" },
          { key: "rooms.room3.image", label: "Phòng Ăn — URL ảnh", type: "text" },
          { key: "rooms.room4.image", label: "Phòng Làm Việc — URL ảnh", type: "text" },
          { key: "rooms.room5.image", label: "Phòng Tắm — URL ảnh", type: "text" },
          { key: "rooms.room6.image", label: "Ban Công — URL ảnh", type: "text" },
        ],
      },
      {
        title: "Banner NGANG — chèn giữa trang chủ",
        fields: [
          {
            key: "homeBanner.enabled",
            label: "Hiển thị banner ngang",
            type: "select",
            options: [
              { value: "false", label: "Tắt" },
              { value: "true", label: "Bật" },
            ],
            hint: "Banner ẢNH LỚN nằm giữa trang chủ, khác với banner chữ mỏng ở đầu mọi trang (tab Thương hiệu & Màu sắc) và HOÀN TOÀN ĐỘC LẬP với banner dọc 2 bên ở nhóm bên dưới. Chỉ hiện ảnh, không chèn thêm chữ/nút — phù hợp khi ảnh đã có sẵn chữ/nút thiết kế ngay trong hình.",
          },
          {
            key: "homeBanner.position",
            label: "Vị trí chèn trên trang chủ",
            type: "select",
            options: [
              { value: "after-hero", label: "Ngay sau Banner đầu trang (Hero)" },
              { value: "after-about", label: "Sau mục Giới thiệu" },
              { value: "after-products", label: "Sau mục Sản phẩm bán chạy" },
              { value: "after-rooms", label: "Sau mục Danh mục phòng" },
              { value: "before-footer", label: "Ngay trước Footer (cuối trang)" },
            ],
          },
          {
            key: "homeBanner.align",
            label: "Canh lề ảnh trong khung",
            type: "select",
            options: [
              { value: "center", label: "Giữa" },
              { value: "left", label: "Trái" },
              { value: "right", label: "Phải" },
            ],
            hint: "Chỉ thấy rõ khác biệt khi ảnh HẸP hơn khung nội dung (không đủ rộng để lấp đầy) — ảnh không bị kéo giãn méo, chỉ đổi vị trí nằm trong khung.",
          },
          { key: "homeBanner.image", label: "URL ảnh banner ngang", type: "text" },
          {
            key: "homeBanner.linkUrl",
            label: "Đường dẫn khi bấm vào ảnh (VD: /sale) — để trống nếu không cần bấm được",
            type: "text",
          },
        ],
      },
      {
        title: "Banner DỌC — 2 bên lề trái/phải trang chủ",
        fields: [
          {
            key: "homeBanner.showSides",
            label: "Hiển thị banner dọc 2 bên",
            type: "select",
            options: [
              { value: "false", label: "Tắt" },
              { value: "true", label: "Bật" },
            ],
            hint: "ĐỘC LẬP với banner ngang: bật/tắt riêng, vị trí riêng, ảnh riêng — không cần banner ngang phải bật. Chỉ hiện trên màn hình rộng từ 1600px (màn nhỏ hơn không đủ chỗ trống nên tự ẩn). Khi cuộn, banner dính theo màn hình khoảng 2 màn hình cuộn rồi mới trôi đi. Bên nào chưa điền ảnh thì bên đó tự ẩn.",
          },
          {
            key: "homeBanner.sidePosition",
            label: "Vị trí bắt đầu trên trang chủ",
            type: "select",
            options: [
              { value: "after-hero", label: "Ngay sau Banner đầu trang (Hero)" },
              { value: "after-about", label: "Sau mục Giới thiệu" },
              { value: "after-products", label: "Sau mục Sản phẩm bán chạy" },
            ],
            hint: "Chỉ có 3 vị trí đầu vì banner dọc kéo dài xuống phía dưới khoảng 2 màn hình — đặt ở cuối trang sẽ bị tràn ra ngoài Footer.",
          },
          { key: "homeBanner.sideLeft.image", label: "Ảnh bên TRÁI — URL ảnh", type: "text" },
          {
            key: "homeBanner.sideLeft.linkUrl",
            label: "Ảnh bên TRÁI — đường dẫn khi bấm (để trống nếu không cần)",
            type: "text",
          },
          { key: "homeBanner.sideRight.image", label: "Ảnh bên PHẢI — URL ảnh", type: "text" },
          {
            key: "homeBanner.sideRight.linkUrl",
            label: "Ảnh bên PHẢI — đường dẫn khi bấm (để trống nếu không cần)",
            type: "text",
          },
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Liên hệ & Footer",
    groups: [
      {
        title: "Footer / Thông tin liên hệ",
        fields: [
          { key: "footer.address", label: "Địa chỉ hiển thị (Footer, trang Liên hệ)", type: "text" },
          {
            key: "footer.mapAddress",
            label: "Địa chỉ dùng cho bản đồ (trang Liên hệ)",
            type: "text",
            hint: "Nhập địa chỉ CHÍNH XÁC theo định dạng Google Maps hiểu được (VD: '7 Trần Thị Điều, Phước Long, Hồ Chí Minh'). Có thể khác với địa chỉ hiển thị ở trên nếu cần ghi gọn/đẹp hơn cho khách đọc. Để trống sẽ dùng tạm địa chỉ hiển thị phía trên.",
          },
          { key: "footer.phone",   label: "Số điện thoại", type: "text" },
          { key: "footer.email",   label: "Email", type: "text" },
          { key: "footer.hours",   label: "Giờ làm việc", type: "text" },
        ],
      },
      {
        title: "Liên kết mạng xã hội (bong bóng nổi)",
        fields: [
          {
            key: "social.zaloPhone",
            label: "Số điện thoại Zalo",
            type: "text",
            hint: "Chỉ cần nhập số điện thoại (VD: 0909123456), có dấu cách/gạch ngang cũng được, hệ thống tự lọc. Bấm vào bong bóng Zalo sẽ mở khung chat Zalo với đúng số này.",
          },
          {
            key: "social.facebookUrl",
            label: "Link trang Facebook (URL đầy đủ)",
            type: "text",
            hint: "Dán nguyên link trang cá nhân hoặc fanpage Facebook, VD: https://facebook.com/luxwood.vn — bấm vào bong bóng Facebook sẽ mở thẳng trang này.",
          },
        ],
      },
      {
        title: "Thanh toán QR (chuyển khoản ngân hàng)",
        fields: [
          {
            key: "payment.bankBin",
            label: "Ngân hàng nhận tiền",
            type: "select",
            options: [
              { value: "", label: "— Chưa chọn (tắt thanh toán QR) —" },
              { value: "970436", label: "Vietcombank" },
              { value: "970415", label: "VietinBank" },
              { value: "970418", label: "BIDV" },
              { value: "970405", label: "Agribank" },
              { value: "970407", label: "Techcombank" },
              { value: "970422", label: "MB Bank" },
              { value: "970416", label: "ACB" },
              { value: "970432", label: "VPBank" },
              { value: "970403", label: "Sacombank" },
              { value: "970423", label: "TPBank" },
              { value: "970437", label: "HDBank" },
              { value: "970443", label: "SHB" },
              { value: "970441", label: "VIB" },
              { value: "970440", label: "SeABank" },
              { value: "970448", label: "OCB" },
              { value: "970426", label: "MSB" },
              { value: "970431", label: "Eximbank" },
              { value: "970429", label: "SCB" },
              { value: "970449", label: "LienVietPostBank" },
              { value: "970433", label: "Vietbank" },
            ],
            hint: "Khách sẽ chuyển khoản vào đúng ngân hàng này khi chọn thanh toán QR ở trang Thanh toán. Để trống (chọn dòng đầu) sẽ TẮT hẳn tuỳ chọn thanh toán QR bên Client, chỉ còn COD.",
          },
          { key: "payment.accountNo", label: "Số tài khoản", type: "text" },
          {
            key: "payment.accountName",
            label: "Tên chủ tài khoản (IN HOA, không dấu)",
            type: "text",
            hint: "Nhập đúng như trên thẻ ngân hàng, VD: NGUYEN VAN A — viết hoa, bỏ dấu, để mã QR hiển thị đúng chuẩn ngân hàng.",
          },
        ],
      },
    ],
  },
  {
    id: "about",
    label: "Trang Giới thiệu",
    groups: [
      {
        title: "Banner đầu trang",
        fields: [
          { key: "aboutpage.banner.image",       label: "URL ảnh banner", type: "text" },
          { key: "aboutpage.banner.title",       label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "aboutpage.banner.description", label: "Mô tả", type: "textarea" },
          { key: "aboutpage.banner.stat1Number", label: "Số liệu 1 — số", type: "text" },
          { key: "aboutpage.banner.stat1Label",  label: "Số liệu 1 — nhãn", type: "text" },
          { key: "aboutpage.banner.stat2Number", label: "Số liệu 2 — số", type: "text" },
          { key: "aboutpage.banner.stat2Label",  label: "Số liệu 2 — nhãn", type: "text" },
          { key: "aboutpage.banner.stat3Number", label: "Số liệu 3 — số", type: "text" },
          { key: "aboutpage.banner.stat3Label",  label: "Số liệu 3 — nhãn", type: "text" },
          { key: "aboutpage.banner.stat4Number", label: "Số liệu 4 — số", type: "text" },
          { key: "aboutpage.banner.stat4Label",  label: "Số liệu 4 — nhãn", type: "text" },
        ],
      },
      {
        title: "Câu chuyện công ty",
        fields: [
          { key: "aboutpage.company.image",      label: "URL ảnh xưởng sản xuất", type: "text" },
          { key: "aboutpage.company.year",       label: "Năm thành lập", type: "text" },
          { key: "aboutpage.company.title",      label: "Tiêu đề", type: "textarea" },
          { key: "aboutpage.company.paragraph1", label: "Đoạn 1", type: "textarea" },
          { key: "aboutpage.company.paragraph2", label: "Đoạn 2", type: "textarea" },
          { key: "aboutpage.company.paragraph3", label: "Đoạn 3", type: "textarea" },
        ],
      },
      {
        title: "Vì sao chọn chúng tôi",
        fields: [
          { key: "aboutpage.whyus.image", label: "URL ảnh minh hoạ", type: "text" },
        ],
      },
      {
        title: "Đội ngũ lãnh đạo",
        fields: [
          { key: "aboutpage.team.member1.image", label: "Người 1 — URL ảnh", type: "text" },
          { key: "aboutpage.team.member1.name",  label: "Người 1 — Tên", type: "text" },
          { key: "aboutpage.team.member1.role",  label: "Người 1 — Chức vụ", type: "text" },
          { key: "aboutpage.team.member1.exp",   label: "Người 1 — Kinh nghiệm", type: "text" },
          { key: "aboutpage.team.member2.image", label: "Người 2 — URL ảnh", type: "text" },
          { key: "aboutpage.team.member2.name",  label: "Người 2 — Tên", type: "text" },
          { key: "aboutpage.team.member2.role",  label: "Người 2 — Chức vụ", type: "text" },
          { key: "aboutpage.team.member2.exp",   label: "Người 2 — Kinh nghiệm", type: "text" },
          { key: "aboutpage.team.member3.image", label: "Người 3 — URL ảnh", type: "text" },
          { key: "aboutpage.team.member3.name",  label: "Người 3 — Tên", type: "text" },
          { key: "aboutpage.team.member3.role",  label: "Người 3 — Chức vụ", type: "text" },
          { key: "aboutpage.team.member3.exp",   label: "Người 3 — Kinh nghiệm", type: "text" },
          { key: "aboutpage.team.member4.image", label: "Người 4 — URL ảnh", type: "text" },
          { key: "aboutpage.team.member4.name",  label: "Người 4 — Tên", type: "text" },
          { key: "aboutpage.team.member4.role",  label: "Người 4 — Chức vụ", type: "text" },
          { key: "aboutpage.team.member4.exp",   label: "Người 4 — Kinh nghiệm", type: "text" },
        ],
      },
      {
        title: "Dự án tiêu biểu",
        fields: [
          { key: "aboutpage.project1.image", label: "Dự án 1 — Biệt thự Vinhomes Grand Park — URL ảnh", type: "text" },
          { key: "aboutpage.project2.image", label: "Dự án 2 — Khách sạn The Reverie Saigon — URL ảnh", type: "text" },
          { key: "aboutpage.project3.image", label: "Dự án 3 — Văn phòng FPT Software HCM — URL ảnh", type: "text" },
          { key: "aboutpage.project4.image", label: "Dự án 4 — Nhà hàng Cham Charm — URL ảnh", type: "text" },
          { key: "aboutpage.project5.image", label: "Dự án 5 — Showroom Mercedes-Benz Q7 — URL ảnh", type: "text" },
          { key: "aboutpage.project6.image", label: "Dự án 6 — Căn hộ Landmark 81 T42 — URL ảnh", type: "text" },
        ],
      },
      {
        title: "Đối tác & Chứng nhận (logo)",
        fields: [
          { key: "aboutpage.partner1.image", label: "Đối tác 1 — Hafele — URL logo", type: "text" },
          { key: "aboutpage.partner2.image", label: "Đối tác 2 — Blum — URL logo", type: "text" },
          { key: "aboutpage.partner3.image", label: "Đối tác 3 — Hettich — URL logo", type: "text" },
          { key: "aboutpage.partner4.image", label: "Chứng nhận 1 — FSC Certified — URL logo", type: "text" },
          { key: "aboutpage.partner5.image", label: "Chứng nhận 2 — PEFC — URL logo", type: "text" },
          { key: "aboutpage.partner6.image", label: "Chứng nhận 3 — ISO 9001 — URL logo", type: "text" },
        ],
      },
    ],
  },
];

// Field nào cần có nút "Tải ảnh lên" + xem trước: key chứa "image" (ảnh thường) hoặc
// "poster" (ảnh poster của video nền).
const isImageField = (key) => key.includes("image") || key.includes("poster");

// ══════════════════════════════════════════════════════════════
// KIỂM TRA DỮ LIỆU NHẬP — theo LOẠI Ô thay vì từng ô riêng lẻ (trang có hàng trăm ô khai báo sẵn)
// ══════════════════════════════════════════════════════════════

const FIELD_BY_KEY = {};
TABS.forEach((tab) => tab.groups.forEach((g) => g.fields.forEach((f) => { FIELD_BY_KEY[f.key] = f; })));

const isEmptyVal = (v) => v === undefined || v === null || String(v).trim() === "";

const LINK_MSG = "Đường dẫn không hợp lệ — bắt đầu bằng / (VD: /sale) hoặc http://, https://.";

// Mã màu dạng #RGB hoặc #RRGGBB
const hexColor = custom((v) =>
  isEmptyVal(v) || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v).trim())
    ? ""
    : "Mã màu không hợp lệ (dạng #RRGGBB, ví dụ #3b2a1a)."
);

// Số liên hệ của cửa hàng: di động/bàn Việt Nam (có thể có +84, dấu cách, chấm, gạch) hoặc tổng đài 1800/1900
const hotline = custom((v) => {
  if (isEmptyVal(v)) return "";
  const c = String(v).replace(/[\s.\-()]/g, "");
  return /^(\+?84|0)\d{8,10}$/.test(c) || /^1[89]00\d{4,6}$/.test(c)
    ? ""
    : "Số điện thoại không hợp lệ (VD: 0909 123 456 hoặc 1900 1234).";
});

const facebookUrl = custom((v) => {
  if (isEmptyVal(v)) return "";
  try {
    const h = new URL(String(v).trim()).hostname.toLowerCase();
    return /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(h)
      ? ""
      : "Đây không phải link Facebook (VD: https://facebook.com/luxwood.vn).";
  } catch {
    return "";
  }
});

const accountNoRule = custom((v) =>
  isEmptyVal(v) || /^\d{6,19}$/.test(String(v).trim()) ? "" : "Số tài khoản chỉ gồm 6–19 chữ số, không có dấu cách."
);

const accountNameRule = custom((v) =>
  isEmptyVal(v) || /^[A-Z ]{2,60}$/.test(String(v).trim())
    ? ""
    : "Tên chủ tài khoản phải IN HOA, không dấu (VD: NGUYEN VAN A)."
);

const yearRule = custom((v) => {
  if (isEmptyVal(v)) return "";
  const s = String(v).trim();
  const maxYear = new Date().getFullYear();
  return /^\d{4}$/.test(s) && Number(s) >= 1900 && Number(s) <= maxYear
    ? ""
    : `Năm thành lập phải gồm 4 chữ số, từ 1900 đến ${maxYear}.`;
});

// Các luật áp dụng cho 1 ô, có xét cả giá trị các ô khác (ví dụ: bật banner thì bắt buộc có nội dung)
const rulesFor = (field, values) => {
  const k = field.key;
  const val = (key) => values[key];
  const isOn = (key) => String(val(key) ?? "") === "true";
  const bankChosen = !isEmptyVal(val("payment.bankBin"));

  // Ô chọn màu: khối theme.* bắt buộc (nếu xoá trống sẽ làm hỏng giao diện Client), các màu khác cho phép trống
  if (field.type === "color") {
    return k.startsWith("theme.") ? [required("Vui lòng chọn hoặc nhập mã màu."), hexColor] : [hexColor];
  }

  // Ô chọn trong danh sách: luôn hợp lệ, trừ ngân hàng khi đã nhập số tài khoản mà chưa chọn ngân hàng
  if (field.type === "select") {
    if (k === "payment.bankBin") {
      return [custom((v) =>
        isEmptyVal(v) && !isEmptyVal(val("payment.accountNo"))
          ? "Đã nhập số tài khoản — hãy chọn ngân hàng nhận tiền."
          : ""
      )];
    }
    return [];
  }

  const rules = [];
  if (field.type === "textarea") rules.push(maxLength(2000, "Tối đa 2000 ký tự."));
  else if (isImageField(k)) rules.push(imagePath("Đường dẫn ảnh không hợp lệ (bắt đầu bằng http://, https:// hoặc /)."));
  else rules.push(maxLength(300, "Tối đa 300 ký tự."));

  switch (k) {
    case "promo.banner.text":
      if (isOn("promo.banner.enabled")) rules.push(required("Banner đang bật — hãy nhập nội dung banner."));
      break;
    case "promo.banner.linkText":
      if (!isEmptyVal(val("promo.banner.linkUrl"))) rules.push(required("Đã có đường dẫn — hãy nhập chữ cho nút bấm."));
      break;
    case "promo.banner.linkUrl":
    case "homeBanner.linkUrl":
    case "homeBanner.sideLeft.linkUrl":
    case "homeBanner.sideRight.linkUrl":
      rules.push(imagePath(LINK_MSG));
      break;
    case "homeBanner.image":
      if (isOn("homeBanner.enabled")) rules.push(required("Banner ngang đang bật — hãy nhập URL ảnh."));
      break;
    case "homeBanner.sideLeft.image":
    case "homeBanner.sideRight.image":
      if (
        isOn("homeBanner.showSides") &&
        isEmptyVal(val("homeBanner.sideLeft.image")) &&
        isEmptyVal(val("homeBanner.sideRight.image"))
      ) {
        rules.push(required("Banner dọc đang bật — hãy nhập ít nhất một ảnh (trái hoặc phải)."));
      }
      break;
    case "hero.video.url":
      rules.push(imagePath("Đường dẫn video không hợp lệ (bắt đầu bằng http://, https:// hoặc /)."));
      if ((val("hero.mode") || "slides") === "video") rules.push(required("Đã chọn kiểu Video — hãy nhập URL video nền."));
      break;
    case "hero.slide1.title":
    case "hero.slide2.title":
    case "hero.slide3.title":
      rules.push(required("Vui lòng nhập tiêu đề cho slide."));
      break;
    case "footer.address":
      rules.push(required("Vui lòng nhập địa chỉ."));
      break;
    case "footer.phone":
      rules.push(required("Vui lòng nhập số điện thoại."), hotline);
      break;
    case "footer.email":
      rules.push(required("Vui lòng nhập email."), email());
      break;
    case "social.zaloPhone":
      rules.push(phoneVN("Số Zalo không hợp lệ (số di động 10 số, VD: 0909123456)."));
      break;
    case "social.facebookUrl":
      rules.push(url("Link Facebook không hợp lệ (phải bắt đầu bằng http:// hoặc https://)."), facebookUrl);
      break;
    case "payment.accountNo":
      rules.push(accountNoRule);
      if (bankChosen) rules.push(required("Đã chọn ngân hàng — hãy nhập số tài khoản."));
      break;
    case "payment.accountName":
      rules.push(accountNameRule);
      if (bankChosen) rules.push(required("Đã chọn ngân hàng — hãy nhập tên chủ tài khoản."));
      break;
    case "aboutpage.company.year":
      rules.push(yearRule);
      break;
    default:
      if (k.endsWith("Number")) rules.push(maxLength(20, "Số liệu tối đa 20 ký tự."));
      else if (k.endsWith("Label")) rules.push(maxLength(60, "Nhãn tối đa 60 ký tự."));
  }
  return rules;
};

// Kiểm tra TOÀN BỘ các ô đang áp dụng (bỏ qua nhóm đang ẩn theo showIf) → { key: thông báo lỗi }
const computeErrors = (values) => {
  const errs = {};
  TABS.forEach((tab) =>
    tab.groups.forEach((group) => {
      if (group.showIf && !group.showIf(values)) return;
      group.fields.forEach((field) => {
        for (const rule of rulesFor(field, values)) {
          const msg = rule(values[field.key], values);
          if (msg) {
            errs[field.key] = msg;
            break;
          }
        }
      });
    })
  );
  return errs;
};

// Ô lỗi đầu tiên theo đúng thứ tự tab → nhóm → ô
const findFirstError = (errs) => {
  for (const tab of TABS)
    for (const group of tab.groups)
      for (const field of group.fields)
        if (errs[field.key]) return { key: field.key, tabId: tab.id };
  return null;
};

const SiteSettings = () => {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  // Tên field (key) đang tải ảnh lên — dùng để disable đúng 1 nút "Tải ảnh lên"
  // đang chạy, các field khác vẫn dùng được bình thường trong lúc chờ.
  const [uploadingKey, setUploadingKey] = useState(null);
  // Lỗi từng ô: { "footer.phone": "Số điện thoại không hợp lệ..." }
  const [errors, setErrors] = useState({});
  const [triedSave, setTriedSave] = useState(false); // đã từng bấm Lưu → mới hiện dòng tổng hợp lỗi

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/Settings");
      setValues(res.data);
    } catch {
      setError("Không thể tải cấu hình giao diện. Kiểm tra backend đang chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const set = (key, v) => {
    setValues(p => ({ ...p, [key]: v }));
    setSaved(false);
    // Gõ lại thì xoá lỗi của chính ô đó. Đổi ô chọn (công tắc bật/tắt, kiểu banner...) có thể đổi điều kiện
    // của nhiều ô khác nên xoá hết lỗi cũ — sẽ kiểm tra lại khi bấm Lưu.
    setErrors(prev => {
      if (FIELD_BY_KEY[key]?.type === "select") return {};
      if (!prev[key] && key !== "payment.accountNo") return prev;
      const next = { ...prev };
      delete next[key];
      if (key === "payment.accountNo") delete next["payment.bankBin"];
      return next;
    });
  };

  // Kiểm tra 1 ô khi người dùng rời khỏi ô đó
  const validateOne = (key) => {
    const field = FIELD_BY_KEY[key];
    if (!field) return;
    let msg = "";
    for (const rule of rulesFor(field, values)) {
      msg = rule(values[key], values);
      if (msg) break;
    }
    setErrors(prev => ({ ...prev, [key]: msg }));
  };

  // Upload ảnh thật từ máy — gọi endpoint mới /Upload ở Backend, nhận về URL rồi
  // gán thẳng vào field như thể Admin tự dán URL vào (tái dùng nguyên hàm `set`
  // ở trên, nên preview ảnh bên dưới ô cũng tự động cập nhật theo).
  const handleImageUpload = async (key, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn đúng file ảnh (jpg, png, webp...).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Ảnh vượt quá 10MB, vui lòng chọn ảnh nhẹ hơn.");
      return;
    }
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // KHÔNG tự set header Content-Type — nhưng axios instance `api` có sẵn
      // header mặc định "application/json" cho MỌI request (thường thấy khi
      // setup 1 instance dùng chung). Header đó đè lên, khiến trình duyệt
      // không tự sinh lại "multipart/form-data; boundary=..." như bình thường,
      // Backend nhận sai Content-Type nên từ chối với lỗi 415. Ép về `undefined`
      // CHỈ cho riêng request này để trình duyệt tự tính lại đúng boundary.
      const res = await api.post("/Upload", formData, {
        headers: { "Content-Type": undefined },
      });
      set(key, res.data.url);
    } catch (err) {
      alert(err.response?.data?.message || "Tải ảnh lên thất bại, vui lòng thử lại.");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async () => {
    setError("");
    setTriedSave(true);

    // Kiểm tra TOÀN BỘ các tab trước khi lưu; có lỗi thì nhảy sang tab/ô lỗi đầu tiên
    const errs = computeErrors(values);
    setErrors(errs);
    const first = findFirstError(errs);
    if (first) {
      setActiveTab(first.tabId);
      setTimeout(() => {
        const el = document.querySelector(`[name="${first.key}"]`);
        if (el) {
          if (el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" });
          if (el.focus) el.focus({ preventScroll: true });
        }
      }, 60);
      return;
    }

    // Lưu bản đã bỏ khoảng trắng thừa ở 2 đầu mỗi giá trị
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
    );

    setSaving(true);
    try {
      await api.put("/Settings", payload);
      setValues(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Lỗi khi lưu cấu hình! Kiểm tra lại backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Khôi phục toàn bộ giao diện về mặc định ban đầu? Mọi tuỳ chỉnh sẽ mất.")) return;
    setSaving(true);
    try {
      const res = await api.post("/Settings/reset");
      setValues(res.data);
      setErrors({});
      setTriedSave(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Lỗi khi khôi phục mặc định!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="settings-page">
      <div className="loading-box"><div className="spinner" /><p>Đang tải cấu hình...</p></div>
    </div>
  );

  const currentTab = TABS.find(t => t.id === activeTab) ?? TABS[0];

  // Số ô lỗi theo từng tab — hiện chấm đỏ trên nút tab để biết tab nào cần sửa
  const errorCountByTab = {};
  TABS.forEach(tab => {
    errorCountByTab[tab.id] = tab.groups.reduce(
      (n, g) => n + g.fields.filter(f => errors[f.key]).length, 0
    );
  });
  const errorTotal = Object.values(errorCountByTab).reduce((a, b) => a + b, 0);
  const errorTabsText = TABS.filter(t => errorCountByTab[t.id] > 0)
    .map(t => `${t.label}: ${errorCountByTab[t.id]}`)
    .join(" · ");

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h2>Giao diện Client</h2>
          <p>Chỉnh sửa hình ảnh, màu sắc, và nội dung hiển thị trên trang web khách hàng</p>
        </div>
        <div className="settings-header-actions">
          <button className="btn-reset" onClick={handleReset} disabled={saving}>Khôi phục mặc định</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : saved ? "✓ Đã lưu" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {error && <div className="form-error">⚠️ {error}</div>}
      {triedSave && errorTotal > 0 && (
        <div className="form-error">
          ⚠️ Có {errorTotal} ô chưa hợp lệ ({errorTabsText}) — vui lòng sửa các ô viền đỏ rồi lưu lại.
        </div>
      )}
      {saved && <div className="form-success">✓ Đã lưu thành công! Tải lại trang Client để xem thay đổi.</div>}

      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? "settings-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {errorCountByTab[tab.id] > 0 && (
              <span
                style={{
                  marginLeft: 6, minWidth: 18, height: 18, padding: "0 5px",
                  borderRadius: 9, background: "#dc2626", color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {errorCountByTab[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {currentTab.groups
        .filter(group => !group.showIf || group.showIf(values))
        .map(group => (
        <div className="settings-card" key={group.title}>
          <h3>{group.title}</h3>
          <div className="settings-grid">
            {group.fields.map(field => {
              const err = errors[field.key];
              const invalid = err ? "is-invalid" : "";
              return (
              <div
                key={field.key}
                className={`settings-field ${field.type === "textarea" ? "full" : ""} ${field.type === "color" ? "color-field" : ""}`}
              >
                <label>{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={2}
                    name={field.key}
                    className={invalid}
                    value={values[field.key] || ""}
                    onChange={e => set(field.key, e.target.value)}
                    onBlur={() => validateOne(field.key)}
                  />
                ) : field.type === "color" ? (
                  <div className="color-input-row">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(values[field.key] || "") ? values[field.key] : "#000000"}
                      onChange={e => set(field.key, e.target.value)}
                    />
                    <input
                      type="text"
                      name={field.key}
                      className={invalid}
                      value={values[field.key] || ""}
                      onChange={e => set(field.key, e.target.value)}
                      onBlur={() => validateOne(field.key)}
                    />
                  </div>
                ) : field.type === "select" ? (
                  <select
                    name={field.key}
                    className={invalid}
                    value={values[field.key] || field.options[0].value}
                    onChange={e => set(field.key, e.target.value)}
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === "text" && isImageField(field.key) ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      name={field.key}
                      className={invalid}
                      placeholder="Dán URL ảnh, hoặc tải lên từ máy →"
                      value={values[field.key] || ""}
                      onChange={e => set(field.key, e.target.value)}
                      onBlur={() => validateOne(field.key)}
                      style={{ flex: 1 }}
                    />
                    <label
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "0 14px", borderRadius: 8, border: "1.5px solid #d8cfc0",
                        background: uploadingKey === field.key ? "#f0ebe0" : "#fff",
                        fontSize: 13, whiteSpace: "nowrap",
                        cursor: uploadingKey === field.key ? "not-allowed" : "pointer",
                      }}
                    >
                      {uploadingKey === field.key ? "Đang tải..." : "📁 Tải ảnh lên"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={uploadingKey === field.key}
                        onChange={e => {
                          const file = e.target.files[0];
                          handleImageUpload(field.key, file);
                          e.target.value = ""; // reset để chọn lại cùng 1 file vẫn kích hoạt onChange
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    name={field.key}
                    className={invalid}
                    value={values[field.key] || ""}
                    onChange={e => set(field.key, e.target.value)}
                    onBlur={() => validateOne(field.key)}
                  />
                )}
                <FieldError message={err} />
                {field.hint && <span className="settings-field-hint">{field.hint}</span>}
                {field.type === "text" && isImageField(field.key) && values[field.key] && (
                  <div className="settings-preview">
                    <img src={values[field.key]} alt="preview" onError={e => e.target.style.display = "none"} />
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SiteSettings;