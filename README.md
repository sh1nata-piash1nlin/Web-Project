Web-Project
@hoang142:

Lấy script sh1nata.txt trên drive về. (Có 1 số script tạo bảng t chưa up nên chạy sẽ lỗi á. có gì cứ thêm script vào).
Cái này là 1 ví dụ. image

Lấy script:
CREATE TABLE draft ( id INT(11) AUTO_INCREMENT PRIMARY KEY, -- Unique identifier for each record articles_id INT(11) NOT NULL, -- Foreign key or related article ID date DATETIME NOT NULL, -- Date and time of the draft reject_reason TEXT -- Reason for rejection (optional) ); ALTER TABLE draft ADD CONSTRAINT fk_articles FOREIGN KEY (articles_id) REFERENCES articles(id);

CREATE TABLE premium ( id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL, card_number VARCHAR(16) NOT NULL, cvv VARCHAR(3) NOT NULL, start_day TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT unique_user_id UNIQUE (user_id) );

Flow: Click vào Premium -> UI của subscriber-form.hbs (Custom trong này để có subscriber) -> Đăng kí xong -> ra UI thì mất nút premium !!!!!!!
Sau khi apply thành công subscriber thì làm thêm phần avatar của tk đăng kí premium đẹp lên kiểu sẽ có viền vàng và cái logo vương miện [THỰC RA T CÓ LÀM TRONG main.hbs rồi mà nó k hiện =))] ).
Xem router.get('/premium') và router.post('/'premium') trong guest.route.js for more details.
Trong quá trình apply thành công subscriber:
luu vao table users role: subscriber (SAU KHI APPLY XONG)
làm thêm phần avatar của tk đăng kí premium đẹp lên kiểu sẽ có viền vàng và cái logo vương miện [THỰC RA T CÓ LÀM TRONG main.hbs rồi mà nó k hiện =))]
