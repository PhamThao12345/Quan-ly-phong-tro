**1. Ngữ cảnh & Mục tiêu dự án**
Dự án được xây dựng nhằm mục đích số hóa quy trình quản lý các khu trọ, giúp Quản trị viên (Admin) và quản lý (Manager) kiểm soát được tình hình phòng trọ, khách thuê, hợp đồng và doanh thu một cách chính xác.

Hệ thống Phân quyền (RBAC):
Quản trị viên (Nguyễn Đình Việt): Quyền hạn cao nhất, quản lý toàn bộ hệ thống bao gồm cả việc tạo/xóa tài khoản Manager và Staff. Có quyền xóa lịch sử hoạt động.
Quản lý (Manager): Quản lý khách thuê, phòng, hóa đơn, xem báo cáo. Không được phép chỉnh sửa/xóa tài khoản của Quản trị viên.
Nhân viên (Staff): Thực hiện các tác vụ vận hành hàng ngày như cập nhật số điện, tạo hóa đơn. Bị giới hạn quyền truy cập vào các module nhạy cảm như Báo cáo và Quản lý Người dùng cấp cao.

**2. Cấu trúc Thư mục Dự án**
text
quan-ly-phong-tro/
├── backend/                # Server-side (Node.js & Express)
│   ├── prisma/             # Cấu hình Database (schema.prisma)
│   ├── src/
│   │   ├── controllers/    # Xử lý Logic nghiệp vụ (Request/Response)
│   │   ├── services/       # Thao tác trực tiếp với Database qua Prisma
│   │   ├── routes/         # Định tuyến API
│   │   ├── middlewares/    # Bảo mật, Auth & Kiểm tra Role
│   │   └── app.js          # Entry point của ứng dụng
│   └── .env                # Biến môi trường (DATABASE_URL, JWT_SECRET)
├── frontend/               # Client-side (React & Vite)
│   ├── src/
│   │   ├── features/       # Chia module chức năng (Auth, Dashboard, Services)
│   │   ├── layouts/        # Giao diện chung (Sidebar, Header, MainLayout)
│   │   ├── services/       # API Client (apiClient.js)
│   │   └── contexts/       # Quản lý trạng thái toàn cục (AuthContext)
│   └── tailwind.config.js  # Cấu hình giao diện (Hệ màu Emerald/Mint)
└── README.md               # Hướng dẫn khởi chạy dự án

**3. Cơ sở dữ liệu (Database Schema)**
Dự án sử dụng SQLite và Prisma ORM. Các bảng chính:
User: Lưu thông tin tài khoản, mật khẩu (mã hóa), vai trò (Role).
Hostel: Thông tin các khu trọ.
Room: Quản lý số phòng, tầng, giá tiền và trạng thái (Trống, Đang ở, Bảo trì).
Tenant: Thông tin khách thuê, trạng thái cư trú.
Contract: Liên kết Khách thuê với Phòng, lưu tiền cọc và thời hạn.
Invoice: Quản lý hóa đơn hàng tháng (Tiền phòng + Điện + Dịch vụ).
ActivityLog: Ghi lại mọi hành động Thêm/Sửa/Xóa của người dùng để truy vết.

**4. Danh sách Module & API**
Auth          	Đăng nhập, đổi mật khẩu	           /api/auth
Khu & Phòng	    Quản lý hạ tầng khu trọ	           /api/hostels, /api/rooms
Khách thuê	    Quản lý thông tin cư trú	         /api/tenants
Hợp đồng	      Quản lý pháp lý, tiền cọc	         /api/contracts
Dịch vụ	        Quản lý điện, nước, internet	     /api/services, /api/electricity
Hóa đơn	        Tính tiền hàng tháng	             /api/invoices
Người dùng	    Phân quyền tài khoản	             /api/users
Lịch sử	        Truy vết hoạt động	               /api/activities
Báo cáo	        Thống kê doanh thu, Excel	         /api/reports

**5. Cấu trúc Giao diện (UI)**
Giao diện được thiết kế theo phong cách Premium & Modern:

Hệ màu: Sử dụng Emerald Green (#006948) làm chủ đạo kết hợp với các Tone màu Mint mang lại cảm giác sạch sẽ, chuyên nghiệp.
Sidebar: Điều hướng thông minh, tự động ẩn các Module nếu người dùng không có quyền (ví dụ: Staff không thấy tab Báo cáo).
Dashboard/Report: Sử dụng biểu đồ cột tùy chỉnh (Custom CSS bars) và Gauge SVG để hiển thị tỉ lệ lấp đầy.
Popups: Sử dụng hệ thống Modal đồng nhất cho mọi thao tác xem chi tiết khách thuê, phòng và hóa đơn.

**6. Lịch sử Lỗi & Giải pháp xử lý (Troubleshooting)**
6.1. Lỗi Phân quyền sai (Staff nhận nhầm Role)
Nguyên nhân: Logic kiểm tra Token trong middleware chưa đồng bộ với dữ liệu trong DB sau khi Update Tier.
Cách sửa: Reset lại database bằng script seed.js và cập nhật chính xác cột role trong bảng User.
6.2. Server Crash [nodemon app crashed]
Nguyên nhân: Lỗi cú pháp import sai path trong activity.routes.js (gọi nhầm file middleware không tồn tại).
Cách sửa: Rà soát lại các dòng require(...), sửa lại đường dẫn chính xác đến auth.middleware.js.
6.3. Lỗi 401 khi gọi API Lịch sử hoạt động
Nguyên nhân: Phía Frontend sử dụng axios mặc định thay vì apiClient.js nên không đính kèm được Token JWT trong Header.
Cách sửa: Chuyển toàn bộ các hàm gọi API sang sử dụng apiClient để tự động đính kèm Authorization: Bearer <token>.
6.4. Lỗi Lịch sử không cập nhật
Nguyên nhân: Thiếu lệnh gọi activityService.logActivity trong các hàm xử lý tại Controller của Backend.
Cách sửa: Chèn thủ công logic ghi log vào cuối mỗi xử lý thành công (Create/Update/Delete) trong các Controller tương ứng.
7. Quy trình Xuất báo cáo (Excel)
Lọc dữ liệu: Frontend gửi request kèm year, month và filterType về Backend.
Tổng hợp: Backend sử dụng Prisma để tính totalAmount của tất cả hóa đơn và doanh thu 12 tháng.
Xử lý Excel: Sử dụng thư viện xlsx phía Frontend để tạo file 2 sheet ("TongQuan" và "DoanhThu12Thang") và cho người dùng tải về.

## Cài đặt và chạy

### Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tài khoản mặc định

| Vai trò       | Số điện thoại |Mật khẩu
|---------------|----------------|
| Quản trị viên (ad)  | 0901234567     |123456
| Quản lý | 0258963121     |f4yn9tNyHY
| Nhân viên     | 0888888888     |eFo12WawTx

# Lưu ý: Cần tạo file `.env` trong thư mục `backend/` trước khi chạy.
DATABASE_URL="file:./dev.db"
JWT_SECRET="mật khẩu"

EMAIL_USER="#điền mail làm tài khoản hệ thống"
EMAIL_PASS="#mật khẩu không cách App Password"


EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_FROM="T's House - Quản lý phòng trọ <#mail>"
