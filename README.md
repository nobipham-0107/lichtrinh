# Lịch trình (Scheduling UI)

Đây là một giao diện web tĩnh đơn giản để tạo, chỉnh sửa và xóa sự kiện theo tuần.

Tính năng:
- Xem lịch theo tuần (từ Thứ Hai).
- Thêm sự kiện (tiêu đề, ngày, bắt đầu, kết thúc).
- Chỉnh sửa / xóa sự kiện.
- Dữ liệu lưu cục bộ trên `localStorage`.

Cách chạy:
1. Mở `index.html` trực tiếp trong trình duyệt (không cần backend), hoặc
2. Khởi chạy một static server trong thư mục này (được khuyến nghị):

   ```powershell
   Set-Location -Path 'e:\Codelinhtinh\WebLuu'; python -m http.server 8000
   ```

   Sau đó mở http://localhost:8000

Gợi ý cải tiến:
- Đồng bộ với backend (API) để chia sẻ lịch.
- Thêm sự kiện lặp (recurring) và import/export.
- Hỗ trợ kéo-thả để thay đổi thời gian sự kiện.
