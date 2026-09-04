import { useState, useEffect } from "react";
import api from "../../services/Api";
import "./SiteSettings.css";

// Chia thành 4 TAB thay vì 1 trang dài liên tục — mỗi tab gồm nhiều "nhóm" (group) field,
// giữ đúng cấu trúc field/key cũ để không phá vỡ dữ liệu đã lưu, chỉ tổ chức lại cách hiển thị.
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
        title: "Slide 1 — Banner trang chủ",
        fields: [
          { key: "hero.slide1.title",    label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "hero.slide1.subtitle", label: "Mô tả ngắn", type: "text" },
          { key: "hero.slide1.image",    label: "URL ảnh nền", type: "text" },
          {
            key: "hero.slide1.video",
            label: "URL video nền (không bắt buộc)",
            type: "text",
            hint: "Nếu nhập, video sẽ ưu tiên phát thay cho ảnh nền ở trên (ảnh vẫn dùng làm poster trong lúc video tải). Để trống thì dùng ảnh như bình thường. Video nên nhẹ, không tiếng (site tự tắt tiếng khi phát).",
          },
          { key: "hero.slide1.accent",   label: "Màu nhấn slide", type: "color" },
          { key: "hero.slide1.bg",       label: "Màu nền slide", type: "color" },
        ],
      },
      {
        title: "Slide 2 — Banner trang chủ",
        fields: [
          { key: "hero.slide2.title",    label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "hero.slide2.subtitle", label: "Mô tả ngắn", type: "text" },
          { key: "hero.slide2.image",    label: "URL ảnh nền", type: "text" },
          {
            key: "hero.slide2.video",
            label: "URL video nền (không bắt buộc)",
            type: "text",
            hint: "Nếu nhập, video sẽ ưu tiên phát thay cho ảnh nền ở trên. Để trống thì dùng ảnh như bình thường.",
          },
          { key: "hero.slide2.accent",   label: "Màu nhấn slide", type: "color" },
          { key: "hero.slide2.bg",       label: "Màu nền slide", type: "color" },
        ],
      },
      {
        title: "Slide 3 — Banner trang chủ",
        fields: [
          { key: "hero.slide3.title",    label: "Tiêu đề (xuống dòng bằng Enter)", type: "textarea" },
          { key: "hero.slide3.subtitle", label: "Mô tả ngắn", type: "text" },
          { key: "hero.slide3.image",    label: "URL ảnh nền", type: "text" },
          {
            key: "hero.slide3.video",
            label: "URL video nền (không bắt buộc)",
            type: "text",
            hint: "Nếu nhập, video sẽ ưu tiên phát thay cho ảnh nền ở trên. Để trống thì dùng ảnh như bình thường.",
          },
          { key: "hero.slide3.accent",   label: "Màu nhấn slide", type: "color" },
          { key: "hero.slide3.bg",       label: "Màu nền slide", type: "color" },
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
        // MỚI: ảnh minh hoạ cho mục "Vì sao chọn chúng tôi?" — nằm dưới đoạn mô tả
        // ở cột trái của section này trên trang About.
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
        // MỚI: 6 ô URL ảnh cho phần "Dự án tiêu biểu" ở About.jsx — trước đây các dự án
        // này chỉ hiện emoji cứng (🏡🏨🏢🍽️🚗🏙️), giờ Admin có thể dán URL ảnh thật.
        // Đặt tên field khớp với thứ tự mảng `projects` cứng trong About.jsx (project1..6),
        // không đổi tên/thứ tự 2 bên lệch nhau kẻo ảnh hiện sai dự án.
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
    ],
  },
];

const SiteSettings = () => {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);

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
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("/Settings", values);
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
      {saved && <div className="form-success">✓ Đã lưu thành công! Tải lại trang Client để xem thay đổi.</div>}

      {/* Tab ngang — bấm để chuyển nhóm, không cuộn qua toàn bộ 11 nhóm field như trước */}
      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? "settings-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentTab.groups.map(group => (
        <div className="settings-card" key={group.title}>
          <h3>{group.title}</h3>
          <div className="settings-grid">
            {group.fields.map(field => (
              <div
                key={field.key}
                className={`settings-field ${field.type === "textarea" ? "full" : ""} ${field.type === "color" ? "color-field" : ""}`}
              >
                <label>{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={2}
                    value={values[field.key] || ""}
                    onChange={e => set(field.key, e.target.value)}
                  />
                ) : field.type === "color" ? (
                  <div className="color-input-row">
                    <input
                      type="color"
                      value={values[field.key] || "#000000"}
                      onChange={e => set(field.key, e.target.value)}
                    />
                    <input
                      type="text"
                      value={values[field.key] || ""}
                      onChange={e => set(field.key, e.target.value)}
                    />
                  </div>
                ) : field.type === "select" ? (
                  <select
                    value={values[field.key] || field.options[0].value}
                    onChange={e => set(field.key, e.target.value)}
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={values[field.key] || ""}
                    onChange={e => set(field.key, e.target.value)}
                  />
                )}
                {field.hint && <span className="settings-field-hint">{field.hint}</span>}
                {field.type === "text" && field.key.includes("image") && values[field.key] && (
                  <div className="settings-preview">
                    <img src={values[field.key]} alt="preview" onError={e => e.target.style.display = "none"} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SiteSettings;