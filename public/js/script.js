document.addEventListener('DOMContentLoaded', () => {
    // Login functionality
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Dashboard functionality
    if (document.getElementById('main-content')) {
        setupDashboard();
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and redirect to dashboard
            localStorage.setItem('authToken', data.token);
            window.location.href = '/dashboard.html';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'خطأ في تسجيل الدخول',
                text: data.message || 'اسم المستخدم أو كلمة المرور غير صحيحة',
                confirmButtonColor: '#ffac33'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ أثناء الاتصال بالخادم',
            confirmButtonColor: '#ffac33'
        });
    }
}

function setupDashboard() {
    // Navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            showPage(page);
            
            // Load content when switching to specific pages
            if (page === 'students') {
                loadStudents();
            } else if (page === 'payments') {
                loadPayments();
                loadStudentsForPayment();
            }
        });
    });
    
    // Logout
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = '/';
    });
    
    // Student form toggle
    const addStudentBtn = document.getElementById('add-student-btn');
    const cancelStudentForm = document.getElementById('cancel-student-form');
    const studentFormContainer = document.getElementById('student-form-container');
    
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            studentFormContainer.style.display = 'block';
            document.getElementById('student-form').reset();
        });
    }
    
    if (cancelStudentForm) {
        cancelStudentForm.addEventListener('click', () => {
            studentFormContainer.style.display = 'none';
        });
    }
    
    // Student form submission
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', handleStudentFormSubmit);
    }
    
    // Payment form submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentFormSubmit);
    }
    
    // Load dashboard stats
    loadDashboardStats();
}

function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show requested page
    document.getElementById(`${page}-page`).classList.add('active');
}

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الإحصائيات');
        }
        
        const stats = await response.json();
        
        // Update stats on dashboard
        document.getElementById('total-students').textContent = stats.totalStudents;
        document.getElementById('full-payments').textContent = stats.fullPayments;
        document.getElementById('partial-payments').textContent = stats.partialPayments;
        document.getElementById('no-payments').textContent = stats.noPayments;
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'حدث خطأ أثناء تحميل الإحصائيات',
            confirmButtonColor: '#ffac33'
        });
    }
}

async function handleStudentFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('fullName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        region: document.getElementById('region').value,
        parentPhone: document.getElementById('parentPhone').value,
        lineName: document.getElementById('lineName').value,
        grade: document.getElementById('grade').value,
        lineOwnerNumber: document.getElementById('lineOwnerNumber').value
    };
    
    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'تمت العملية!',
                text: 'تم إضافة الطالب بنجاح',
                confirmButtonColor: '#ffac33'
            });
            
            // Hide form and reset
            document.getElementById('student-form-container').style.display = 'none';
            document.getElementById('student-form').reset();
            
            // Refresh student list
            loadStudents();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'فشل في إضافة الطالب');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'حدث خطأ أثناء إضافة الطالب',
            confirmButtonColor: '#ffac33'
        });
    }
}

async function loadStudents() {
    try {
        const response = await fetch('/api/students', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل قائمة الطلاب');
        }
        
        const students = await response.json();
        const tableBody = document.querySelector('#students-table tbody');
        tableBody.innerHTML = '';
        
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.fullName}</td>
                <td>${student.phoneNumber}</td>
                <td>${student.region}</td>
                <td>${student.grade}</td>
                <td>
                    <button class="edit-btn" data-id="${student._id}">تعديل</button>
                    <button class="delete-btn" data-id="${student._id}">حذف</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editStudent(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'حدث خطأ أثناء تحميل الطلاب',
            confirmButtonColor: '#ffac33'
        });
    }
}

async function loadStudentsForPayment() {
    try {
        const response = await fetch('/api/students', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل قائمة الطلاب');
        }
        
        const students = await response.json();
        const select = document.getElementById('student-select');
        select.innerHTML = '';
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.textContent = student.fullName;
            select.appendChild(option);
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'حدث خطأ أثناء تحميل الطلاب',
            confirmButtonColor: '#ffac33'
        });
    }
}

async function handlePaymentFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        student: document.getElementById('student-select').value,
        amount: document.getElementById('amount').value,
        receiptNumber: document.getElementById('receipt-number').value,
        date: document.getElementById('payment-date').value,
        notes: document.getElementById('payment-notes').value
    };
    
    try {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'تمت العملية!',
                text: 'تم تسجيل الدفعة بنجاح',
                confirmButtonColor: '#ffac33'
            });
            
            // Reset form
            document.getElementById('payment-form').reset();
            
            // Refresh payment list
            loadPayments();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'فشل في تسجيل الدفعة');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'حدث خطأ أثناء تسجيل الدفعة',
            confirmButtonColor: '#ffac33'
        });
    }
}

async function loadPayments() {
    try {
        const response = await fetch('/api/payments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل سجل الدفعات');
        }
        
        const payments = await response.json();
        const tableBody = document.querySelector('#payments-table tbody');
        tableBody.innerHTML = '';
        
        payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.student.fullName}</td>
                <td>${payment.amount}</td>
                <td>${payment.receiptNumber}</td>
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.notes || ''}</td>
                <td>
                    <button class="edit-payment-btn" data-id="${payment._id}">تعديل</button>
                    <button class="delete-payment-btn" data-id="${payment._id}">حذف</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-payment-btn').forEach(btn => {
            btn.addEventListener('click', () => editPayment(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-payment-btn').forEach(btn => {
            btn.addEventListener('click', () => deletePayment(btn.dataset.id));
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'حدث خطأ أثناء تحميل الدفعات',
            confirmButtonColor: '#ffac33'
        });
    }
}

async function editStudent(studentId) {
    // TODO: Implement edit functionality
    Swal.fire({
        icon: 'info',
        title: 'قيد التطوير',
        text: 'ميزة التعديل قيد التطوير حالياً',
        confirmButtonColor: '#ffac33'
    });
}

async function deleteStudent(studentId) {
    try {
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'لن تتمكن من استعادة هذا الطالب!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ffac33',
            cancelButtonColor: '#d33',
            confirmButtonText: 'نعم، احذفه!',
            cancelButtonText: 'إلغاء'
        });
        
        if (result.isConfirmed) {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحذف!',
                    text: 'تم حذف الطالب بنجاح',
                    confirmButtonColor: '#ffac33'
                });
                
                // Refresh student list
                loadStudents();
                // Refresh stats
                loadDashboardStats();
            } else {
                throw new Error('فشل في حذف الطالب');
            }
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'حدث خطأ أثناء حذف الطالب',
            confirmButtonColor: '#ffac33'
        });
    }
}