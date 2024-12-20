document.addEventListener('DOMContentLoaded', function() {
    // Lấy tất cả các tab
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    
    // Thêm sự kiện click cho mỗi tab
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Xóa active class từ tất cả các tab
            tabs.forEach(t => {
                t.classList.remove('active');
                const pane = document.querySelector(t.getAttribute('href'));
                if (pane) {
                    pane.classList.remove('show', 'active');
                }
            });
            
            // Thêm active class cho tab được click
            this.classList.add('active');
            const targetPane = document.querySelector(this.getAttribute('href'));
            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }
        });
    });
}); 