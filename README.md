# Hệ thống Quản lý Phòng Trọ - T's House

Hệ thống quản lý phòng trọ toàn diện với phân quyền theo 3 tầng: Chủ trọ (Admin), Quản trị viên (Manager) và Nhân viên (Staff).

## Cấu trúc dự án

```
quan-ly-phong-tro/
├── backend/          # Node.js + Express + Prisma ORM + SQLite
└── frontend/         # React + Vite + TailwindCSS
```

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

| Vai trò       | Số điện thoại |
|---------------|----------------|
| Chủ trọ       | 0901234567     |
| Quản trị viên | 0258963121     |
| Nhân viên     | 0888888888     |

> Lưu ý: Cần tạo file `.env` trong thư mục `backend/` trước khi chạy.
