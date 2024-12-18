document.addEventListener('DOMContentLoaded', function() {
    var triggerTabList = [].slice.call(document.querySelectorAll('#categoryTabs a'))
    triggerTabList.forEach(function(triggerEl) {
        var tabTrigger = new bootstrap.Tab(triggerEl)

        triggerEl.addEventListener('click', function(event) {
            event.preventDefault()
            tabTrigger.show()
        })
    })

    // Hiển thị tab đầu tiên khi load trang
    document.querySelector('#categoryTabs a[data-bs-toggle="tab"]').click()
}) 