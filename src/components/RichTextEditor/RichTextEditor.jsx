import { useMemo, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import api from "../../services/Api";
import "./RichTextEditor.css";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // khớp giới hạn 10MB của UploadController
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

// Nội dung trình soạn thảo rỗng vẫn trả về "<p><br></p>" — hàm này cho biết có nội dung THẬT hay không
// (chữ, ảnh hoặc bảng). Dùng khi lưu: rỗng thật thì gửi chuỗi rỗng lên Backend.
export const isRichTextEmpty = (html) => {
  const s = String(html || "");
  if (/<(img|table|iframe)\b/i.test(s)) return false;
  return s.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length === 0;
};

// Tải 1 ảnh lên Backend (POST /api/Upload) và trả về URL tuyệt đối của ảnh.
const uploadImage = async (file) => {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Chỉ chèn được ảnh jpg, png, webp hoặc gif.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Ảnh vượt quá 10MB, vui lòng chọn ảnh nhẹ hơn.");
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post("/Upload", fd);
  return res.data.url;
};

// Tải lần lượt các ảnh lên rồi chèn vào vị trí con trỏ. KHÔNG nhúng ảnh dạng base64 vào nội dung
// (làm nội dung phình rất to) — luôn là URL ảnh đã lưu trên server.
const insertImages = async (quill, files, startIndex) => {
  let at = startIndex;
  for (const file of files) {
    try {
      const url = await uploadImage(file);
      quill.insertEmbed(at, "image", url, "user");
      at += 1;
      quill.setSelection(at, 0, "user");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Tải ảnh lên thất bại.");
    }
  }
};

// Nút "ảnh" trên thanh công cụ: chọn 1 hoặc nhiều ảnh từ máy
function toolbarImageHandler() {
  const quill = this.quill;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.onchange = () => {
    const files = Array.from(input.files || []);
    if (files.length === 0) return;
    const range = quill.getSelection(true);
    insertImages(quill, files, range ? range.index : quill.getLength());
  };
  input.click();
}

// Kéo-thả hoặc dán ảnh vào vùng soạn thảo cũng được tải lên server (thay vì nhúng base64)
function uploaderHandler(range, files) {
  insertImages(this.quill, files, range.index);
}

// onMouseDown + preventDefault: bấm nút không làm mất vị trí con trỏ đang đứng trong bảng
const TableBtn = ({ label, onClick, danger = false }) => (
  <button
    type="button"
    className={`rte-table-btn ${danger ? "rte-table-btn--danger" : ""}`}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
  >
    {label}
  </button>
);

// Trình soạn thảo nội dung có định dạng: chữ đậm/nghiêng/gạch, tiêu đề, màu chữ, danh sách, căn lề,
// trích dẫn, LINK, ẢNH (tải lên từ máy) và BẢNG. Dùng ở form sản phẩm mục "Thông tin chi tiết".
//   value / onChange: chuỗi HTML.
const RichTextEditor = ({ value, onChange, placeholder, invalid = false }) => {
  const editorRef = useRef(null);

  // modules PHẢI được nhớ (useMemo) — tạo mới mỗi lần render sẽ làm Quill khởi tạo lại và mất con trỏ.
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, 4, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["blockquote", "link", "image"],
          ["clean"],
        ],
        handlers: { image: toolbarImageHandler },
      },
      table: true,
      uploader: { mimetypes: IMAGE_TYPES, handler: uploaderHandler },
    }),
    []
  );

  // Chạy 1 thao tác trên module bảng của Quill (giữ nguyên vị trí con trỏ trong bảng)
  const runTable = (action) => {
    const quill = editorRef.current?.getEditor?.();
    if (!quill) return;
    quill.getSelection(true); // đưa focus về vùng soạn thảo
    action(quill.getModule("table"));
  };

  const handleInsertTable = () => {
    const answer = window.prompt("Nhập số hàng x số cột cho bảng (ví dụ: 4x2)", "3x3");
    if (answer === null) return;
    const m = answer.trim().match(/^(\d{1,2})\s*[xX×*]\s*(\d{1,2})$/);
    const rows = m ? Number(m[1]) : 0;
    const cols = m ? Number(m[2]) : 0;
    if (rows < 1 || rows > 20 || cols < 1 || cols > 8) {
      alert("Vui lòng nhập đúng dạng hàng x cột, tối đa 20 hàng và 8 cột (ví dụ: 4x2).");
      return;
    }
    runTable((t) => t.insertTable(rows, cols));
  };

  return (
    <div>
      <div className={`rte-wrap ${invalid ? "is-invalid" : ""}`}>
        <div className="rte-table-tools">
          <span className="rte-table-tools__label">Bảng:</span>
          <TableBtn label="＋ Chèn bảng" onClick={handleInsertTable} />
          <TableBtn label="＋ Hàng" onClick={() => runTable((t) => t.insertRowBelow())} />
          <TableBtn label="＋ Cột" onClick={() => runTable((t) => t.insertColumnRight())} />
          <TableBtn label="－ Hàng" onClick={() => runTable((t) => t.deleteRow())} danger />
          <TableBtn label="－ Cột" onClick={() => runTable((t) => t.deleteColumn())} danger />
          <TableBtn label="Xoá bảng" onClick={() => runTable((t) => t.deleteTable())} danger />
        </div>
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={value || ""}
          onChange={(html) => onChange(html)}
          modules={modules}
          placeholder={placeholder}
        />
      </div>
      <p className="rte-hint">
        Bấm vào một ô trong bảng rồi dùng các nút ở hàng "Bảng" để thêm/xoá hàng, cột. Ảnh chèn bằng nút ảnh trên
        thanh công cụ (hoặc kéo-thả/dán ảnh) sẽ được tải lên server, không nhúng thẳng vào nội dung.
      </p>
    </div>
  );
};

export default RichTextEditor;