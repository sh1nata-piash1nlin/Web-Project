
# Sơ đồ ERD 
  ![ERD](https://github.com/user-attachments/assets/63674362-d69b-42f3-80e3-9375604ce6b0)
# Thiết kế Cơ Sở Dữ Liệu Mức Logic

## 1. Bảng `Users`
- **id** (integer, primary key): Số định danh người dùng.
- **username** (varchar, unique): Tên đăng nhập.
- **password** (varchar): Mật khẩu, được băm (sử dụng bcrypt).
- **email** (varchar, unique): Địa chỉ email của người dùng.
- **full_name** (varchar): Họ và tên đầy đủ.
- **pen_name** (varchar, nullable): Bút danh (nếu người dùng là phóng viên).
- **role** (varchar): Vai trò của người dùng (guest, subscriber, writer, editor, admin).
- **dob** (date, nullable): Ngày sinh của người dùng.
- **subscription_expiry** (timestamp, nullable): Thời điểm hết hạn đăng ký (nếu là subscriber).
- **created_at** (timestamp): Thời điểm tạo tài khoản.
- **updated_at** (timestamp): Thời điểm cập nhật tài khoản.

---

## 2. Bảng `Categories`
- **id** (integer, primary key): Số định danh chuyên mục.
- **name** (varchar): Tên chuyên mục.
- **parent_id** (integer, foreign key references `Categories.id`, nullable): Mã chuyên mục cha, dùng để tạo chuyên mục cấp 2.
- **created_at** (timestamp): Thời điểm tạo chuyên mục.
- **updated_at** (timestamp): Thời điểm cập nhật chuyên mục.

---

## 3. Bảng `Tags`
- **id** (integer, primary key): Số định danh nhãn tag.
- **name** (varchar): Tên tag.
- **created_at** (timestamp): Thời điểm tạo tag.
- **updated_at** (timestamp): Thời điểm cập nhật tag.

---

## 4. Bảng `Articles`
- **id** (integer, primary key): Số định danh bài viết.
- **title** (varchar): Tiêu đề bài viết.
- **abstract** (text): Tóm tắt nội dung bài viết.
- **content** (text): Nội dung đầy đủ của bài viết.
- **featured_image** (varchar, nullable): URL ảnh đại diện bài viết.
- **category_id** (integer, foreign key references `Categories.id`): Mã chuyên mục của bài viết.
- **author_id** (integer, foreign key references `Users.id`): Mã người dùng là tác giả (phóng viên).
- **status** (varchar): Trạng thái bài viết (draft, approved, rejected, published).
- **publish_date** (timestamp, nullable): Ngày giờ xuất bản bài viết.
- **is_premium** (boolean): Bài viết là premium (true/false).
- **created_at** (timestamp): Thời điểm tạo bài viết.
- **updated_at** (timestamp): Thời điểm cập nhật bài viết.

---

## 5. Bảng `Article_Tags`
- **article_id** (integer, foreign key references `Articles.id`): Mã bài viết.
- **tag_id** (integer, foreign key references `Tags.id`): Mã nhãn tag.

---

## 6. Bảng `Comments`
- **id** (integer, primary key): Số định danh bình luận.
- **article_id** (integer, foreign key references `Articles.id`): Mã bài viết mà bình luận thuộc về.
- **user_id** (integer, foreign key references `Users.id`): Mã người dùng đã tạo bình luận.
- **comment_text** (text): Nội dung bình luận.
- **comment_date** (timestamp): Thời điểm bình luận.
- **created_at** (timestamp): Thời điểm tạo bình luận.
- **updated_at** (timestamp): Thời điểm cập nhật bình luận.

---

## 7. Bảng `Subscriptions`
- **id** (integer, primary key): Số định danh gói đăng ký.
- **user_id** (integer, foreign key references `Users.id`): Mã người dùng đã đăng ký.
- **start_date** (timestamp): Ngày bắt đầu gói đăng ký.
- **expiry_date** (timestamp): Ngày hết hạn gói đăng ký.

---

## Mối Quan Hệ Giữa Các Bảng
1. **Users** có quan hệ một-nhiều với **Articles**: Một người dùng (phóng viên) có thể viết nhiều bài viết.
2. **Categories** có quan hệ một-nhiều với **Articles**: Một chuyên mục có thể có nhiều bài viết.
3. **Articles** có quan hệ nhiều-nhiều với **Tags** thông qua bảng nối **Article_Tags**.
4. **Articles** có quan hệ một-nhiều với **Comments**: Một bài viết có thể có nhiều bình luận.
5. **Users** có quan hệ một-nhiều với **Comments**: Một người dùng có thể tạo nhiều bình luận.
6. **Users** có quan hệ một-một với **Subscriptions**: Một người dùng có thể có một gói đăng ký.
