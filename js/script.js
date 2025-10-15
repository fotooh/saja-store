import { supabase } from "./supabase.js";

// قائمة بريد المديرين
const ADMIN_EMAILS = ['zeyadalanesy@yahoo.com'];

// بيانات التطبيق
let products = [];
let cart = [];
let currentUser = null;
let orders = [];

// عناصر DOM
let productsContainer, cartSidebar, cartOverlay, cartItems, cartTotalPrice, cartCount, cartIcon;
let closeCart, checkoutBtn, mobileMenu, nav, authModal, closeAuth, loginBtn, registerBtn;
let authTabs, loginForm, registerForm, dashboard, logoutBtn, tabBtns, tabContents;
let dashboardProducts, addProductForm, categoryFilter, sizeFilter, colorFilter, searchInput;
// عناصر DOM الجديدة
let productDetailModal, productDetailContainer, closeDetail;

// تهيئة الموقع
document.addEventListener('DOMContentLoaded', async function() {
    // تهيئة عناصر DOM
    initializeDOMElements();
    
    // تحميل المنتجات من Supabase
    await loadProducts();
    
    // التحقق من حالة المستخدم
    await checkAuthState();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
});

// تهيئة عناصر DOM
function initializeDOMElements() {
    
    // عناصر المنتجات والسلة
    productsContainer = document.getElementById('products-container');
    cartSidebar = document.getElementById('cart-sidebar');
    cartOverlay = document.getElementById('cart-overlay');
    cartItems = document.getElementById('cart-items');
    cartTotalPrice = document.getElementById('cart-total-price');
    cartCount = document.querySelector('.cart-count');
    cartIcon = document.querySelector('.cart-icon');
    closeCart = document.querySelector('.close-cart');
    checkoutBtn = document.querySelector('.checkout-btn');
     
    // ✅ إصلاح: البحث عن cart-icon في header-actions إذا لم يوجد
    if (!cartIcon) {
        cartIcon = document.querySelector('.header-actions .cart-icon');
    }
    
    // ✅ إصلاح: البحث عن cart-count في header-actions إذا لم يوجد
    if (!cartCount) {
        cartCount = document.querySelector('.header-actions .cart-count');
    }
    
   
    
    
    // عناصر التنقل
    mobileMenu = document.querySelector('.mobile-menu');
    nav = document.querySelector('nav');
    
    // عناصر المصادقة
    authModal = document.getElementById('auth-modal');
    closeAuth = document.querySelector('.close-auth');
    
    // البحث عن أزرار التسجيل في القائمة - بإضافة تحقق أفضل
    loginBtn = document.querySelector('.login-btn');
    registerBtn = document.querySelector('.register-btn');
    
    // عناصر لوحة التحكم
    authTabs = document.querySelectorAll('.auth-tab');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    dashboard = document.getElementById('dashboard');
    logoutBtn = document.getElementById('logout-btn');
    tabBtns = document.querySelectorAll('.tab-btn');
    tabContents = document.querySelectorAll('.tab-content');
    dashboardProducts = document.getElementById('dashboard-products');
    addProductForm = document.getElementById('add-product-form');
    
    // عناصر التصفية
    categoryFilter = document.getElementById('category-filter');
    sizeFilter = document.getElementById('size-filter');
    colorFilter = document.getElementById('color-filter');
    searchInput = document.querySelector('.search-box input');
    
   
    // عناصر صفحة التفاصيل الجديدة
    productDetailModal = document.getElementById('product-detail-modal');
    productDetailContainer = document.getElementById('product-detail-container');
    closeDetail = document.querySelector('.close-detail');
    
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
      // ✅ إصلاح: إعادة ربط حدث فتح السلة بعد كل تحديث للواجهة
    function bindCartEvents() {
        // إزالة المستمعين السابقين أولاً
        if (cartIcon) {
            cartIcon.removeEventListener('click', openCart);
            cartIcon.addEventListener('click', openCart);
        }
        
        if (closeCart) {
            closeCart.removeEventListener('click', closeCartSidebar);
            closeCart.addEventListener('click', closeCartSidebar);
        }
        
        if (cartOverlay) {
            cartOverlay.removeEventListener('click', closeCartSidebar);
            cartOverlay.addEventListener('click', closeCartSidebar);
        }
    }
    
    // ربط الأحداث مباشرة بعد التهيئة
    bindCartEvents();
    
    // ✅ إصلاح: إعادة ربط الأحداث بعد تحديث الواجهة
    const originalUpdateUI = updateUI;
    updateUI = function() {
        originalUpdateUI();
        setTimeout(bindCartEvents, 100); // إعادة الربط بعد تحديث الواجهة
    };
    
    // ✅ إصلاح: إضافة إلى السلة من المنتجات الرئيسية
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.getAttribute('data-id');
            if (productId) {
                addToCart(parseInt(productId));
                e.stopPropagation(); // منع فتح صفحة التفاصيل
            }
        }
    });
    
    // إظهار/إخفاء القائمة على الهواتف
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            if (nav) nav.classList.toggle('active');
        });
    }
    
    // ✅ إصلاح: فتح وإغلاق سلة المشتريات
    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    } else {
        console.log('❌ زر السلة غير موجود!');
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', closeCartSidebar);
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }
    
    // ✅ إصلاح: إعادة ربط أزرار إضافة إلى السلة بعد تصيير المنتجات
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.getAttribute('data-id');
            if (productId) {
                addToCart(parseInt(productId));
            }
        }
    });
    
    
    // فتح وإغلاق نافذة المصادقة
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            if (authModal) {
                authModal.classList.add('active');
                switchAuthTab('login');
            }
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            if (authModal) {
                authModal.classList.add('active');
                switchAuthTab('register');
            }
        });
    }
    
    if (closeAuth) {
        closeAuth.addEventListener('click', function() {
            if (authModal) authModal.classList.remove('active');
        });
    }
    
    // تبديل علامات التبويب في المصادقة
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const authType = this.getAttribute('data-auth');
            switchAuthTab(authType);
        });
    });
    
    // تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            await signIn(email, password);
        });
    }
    
    // تسجيل حساب جديد
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const phone = document.getElementById('register-phone').value;
            
            await signUp(email, password, name, phone);
        });
    }
    
    // تسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            await signOut();
        });
    }
    
    // تبديل علامات التبويب في لوحة التحكم
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            const activeTab = document.getElementById(tabId);
            if (activeTab) activeTab.classList.add('active');
            
            // تحميل البيانات عند التبديل بين التبويبات
            if (tabId === 'orders-tab') {
                loadOrders();
            } else if (tabId === 'users-tab') {
                loadUsers();
            }
        });
    });
    
    // إضافة منتج جديد
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await addProduct();
        });
    }
    
    // التصفية والبحث
    if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
    if (sizeFilter) sizeFilter.addEventListener('change', filterProducts);
    if (colorFilter) colorFilter.addEventListener('change', filterProducts);
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    
    // إتمام الشراء
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function() {
            await checkout();
        });
    }
     // ✅ إضافة: فتح صفحة تفاصيل المنتج
    document.addEventListener('click', function(e) {
        // النقر على بطاقة المنتج (الصورة أو العنوان)
        if (e.target.closest('.product-card') && !e.target.classList.contains('add-to-cart')) {
            const productCard = e.target.closest('.product-card');
            const productId = productCard.querySelector('.add-to-cart')?.getAttribute('data-id');
            if (productId) {
                openProductDetail(parseInt(productId));
            }
        }
    });
    
    // ✅ إضافة: إغلاق صفحة التفاصيل
    if (closeDetail) {
        closeDetail.addEventListener('click', closeProductDetail);
    }
    
    // ✅ إضافة: إغلاق بالنقر خارج المحتوى
    if (productDetailModal) {
        productDetailModal.addEventListener('click', function(e) {
            if (e.target === productDetailModal) {
                closeProductDetail();
            }
        });
    }
    
}

// وظائف Supabase

// تحميل المنتجات من قاعدة البيانات
async function loadProducts() {
    try {
        if (productsContainer) {
            productsContainer.innerHTML = '<div class="loading">جاري تحميل المنتجات...</div>';
        }
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        products = data || [];
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        if (productsContainer) {
            productsContainer.innerHTML = '<div class="message error">حدث خطأ في تحميل المنتجات</div>';
        }
    }
}

// تحميل الطلبات
async function loadOrders() {
    try {
        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        // إذا لم يكن المستخدم مديراً، عرض طلباته فقط
        if (currentUser && currentUser.role !== 'admin') {
            query = query.eq('user_id', currentUser.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        orders = data || [];
        renderOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('حدث خطأ في تحميل الطلبات', 'error');
    }
}

// تحميل المستخدمين (للمدير فقط)
async function loadUsers() {
    try {
        if (!currentUser || currentUser.role !== 'admin') {
            showMessage('ليس لديك صلاحية لعرض المستخدمين!', 'error');
            return;
        }
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderUsers(data || []);
    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('حدث خطأ في تحميل المستخدمين', 'error');
    }
}

// التحقق من حالة المصادقة
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    
    if (currentUser) {
        await checkUserRole();
    }
    
    updateUI();
}

// التحقق من دور المستخدم وتحديث currentUser
async function checkUserRole() {
    try {
        // جلب جلسة المستخدم الحالية
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();

        if (sessionError) throw sessionError;
        if (!user) {
            console.log('لا يوجد مستخدم مسجّل حالياً');
            currentUser = null;
            updateUI();
            return;
        }

        // جلب الدور من جدول profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, phone, role, email')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        // تحديث currentUser بالبيانات من profiles
        currentUser = {
            id: user.id,
            email: user.email,
            role: profile.role,
            full_name: profile.full_name,
            phone: profile.phone
        };

        updateUI();
    } catch (error) {
        console.error('خطأ عند التحقق من دور المستخدم:', error);
        currentUser = null;
        updateUI();
    }
}


// إنشاء ملف تعريف للمستخدم الجديد
async function createUserProfile(user, name, phone) {
    if (!user) {
        console.error('لا يوجد مستخدم لإنشاء ملف تعريف له');
        return;
    }

    try {
        // تحقق إذا كان الملف موجود مسبقاً
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!checkError && existingProfile) {
            console.log('ملف التعريف موجود مسبقاً');
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: user.email,
                    full_name: name || user.user_metadata?.full_name || '',
                    phone: phone || user.user_metadata?.phone || '',
                    role: 'customer'
                }
            ]);

        if (error) throw error;

        console.log('تم إنشاء profile للمستخدم الجديد:', data);
    } catch (error) {
        console.error('خطأ عند إنشاء profile:', error);
    }
}

// إنشاء حساب جديد
async function signUp(email, password, name, phone) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name, phone: phone }
            }
        });

        if (error) throw error;

        if (data.user) {
            // إنشاء ملف التعريف مباشرة بعد التسجيل
            await createUserProfile(data.user, name, phone);
            currentUser = data.user;
            await checkUserRole(); // تحديد الدور
        }

        showMessage('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.', 'success');
        if (authModal) authModal.classList.remove('active');
        updateUI();
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        showMessage('خطأ في إنشاء الحساب: ' + (error.message || JSON.stringify(error)), 'error');
    }
}

// تسجيل الدخول
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await checkUserRole();
        updateUI();
        
        if (authModal) authModal.classList.remove('active');
        showMessage('تم تسجيل الدخول بنجاح!', 'success');
    } catch (error) {
        console.error('Error signing in:', error);
        showMessage('خطأ في تسجيل الدخول: ' + error.message, 'error');
    }
}



// تسجيل الخروج
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        updateUI();
        showMessage('تم تسجيل الخروج بنجاح!', 'success');
    } catch (error) {
        console.error('Error signing out:', error);
        showMessage('خطأ في تسجيل الخروج: ' + error.message, 'error');
    }
}

async function addProduct() {
  try {
    // التحقق من الصلاحيات
    if (!currentUser || currentUser.role !== 'admin') {
      showMessage('ليس لديك صلاحية لإضافة منتجات!', 'error');
      return;
    }

    // قراءة القيم من الحقول (نفس الكود السابق)
    const name = document.getElementById('product-name')?.value.trim();
    const priceValue = document.getElementById('product-price')?.value.trim();
    const quantityValue = document.getElementById('product-quantity')?.value.trim();
    const category = document.getElementById('product-category')?.value.trim();
    const size = document.getElementById('product-size')?.value.trim();
    const color = document.getElementById('product-color')?.value.trim();
    const description = document.getElementById('product-description')?.value.trim();

    // التحقق من المدخلات
    if (!name) return showMessage('الرجاء إدخال اسم المنتج!', 'error');
    if (!priceValue || isNaN(parseInt(priceValue))) return showMessage('الرجاء إدخال سعر صحيح!', 'error');
    if (!quantityValue || isNaN(parseInt(quantityValue))) return showMessage('الرجاء إدخال كمية صحيحة!', 'error');

    const price = parseInt(priceValue);
    const quantity = parseInt(quantityValue);

    // رفع الصورة (نفس الكود السابق)
    let imageUrl = null;
    const fileInput = document.getElementById('product-image');
    
    if (fileInput && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const cleanFileName = file.name.replace(/\s+/g, '_');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(`products/${cleanFileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      imageUrl = supabase.storage.from('images').getPublicUrl(`products/${cleanFileName}`).data.publicUrl;
    }

    // تجهيز بيانات المنتج مع إضافة user_id
    const productData = {
      name,
      price,
      quantity,
      category: category || null,
      size: size || null,
      color: color || null,
      description: description || null,
      image: imageUrl || null,
      user_id: currentUser.id // ← الإضافة المهمة
    };

    // إضافة المنتج
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error) throw error;

    // تحديث القائمة
    products.unshift(data[0]);
    renderProducts();
    renderDashboardProducts();

    // إعادة تعيين النموذج
    if (addProductForm) addProductForm.reset();

    showMessage('تم إضافة المنتج بنجاح!', 'success');
  } catch (error) {
    console.error('Error adding product:', error);
    showMessage('خطأ في إضافة المنتج: ' + (error.message || JSON.stringify(error)), 'error');
  }
}



// تحديث المنتج
async function updateProduct(productId, updates) {
    try {
        if (!currentUser || currentUser.role !== 'admin') {
            showMessage('ليس لديك صلاحية لتعديل المنتجات!', 'error');
            return;
        }
        
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId);
        
        if (error) throw error;
        
        // تحديث القائمة المحلية
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
        }
        
        renderProducts();
        renderDashboardProducts();
        
        showMessage('تم تحديث المنتج بنجاح!', 'success');
    } catch (error) {
        console.error('Error updating product:', error);
        showMessage('خطأ في تحديث المنتج: ' + error.message, 'error');
    }
}

// حذف المنتج
async function deleteProduct(productId) {
    try {
        if (!currentUser || currentUser.role !== 'admin') {
            showMessage('ليس لديك صلاحية لحذف المنتجات!', 'error');
            return;
        }
        
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        // حذف من القائمة المحلية
        products = products.filter(p => p.id !== productId);
        renderProducts();
        renderDashboardProducts();
        
        showMessage('تم حذف المنتج بنجاح!', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('خطأ في حذف المنتج: ' + error.message, 'error');
    }
}

// ترقية مستخدم إلى مدير
async function promoteToAdmin(userId) {
    try {
        if (!currentUser || currentUser.role !== 'admin') {
            showMessage('ليس لديك صلاحية لترقية المستخدمين!', 'error');
            return false;
        }
        
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId);
        
        if (error) throw error;
        
        showMessage('تم ترقية المستخدم إلى مدير بنجاح!', 'success');
        return true;
    } catch (error) {
        console.error('Error promoting user to admin:', error);
        showMessage('خطأ في ترقية المستخدم: ' + error.message, 'error');
        return false;
    }
}

// إتمام عملية الشراء
async function checkout() {
    try {
        if (cart.length === 0) {
            showMessage('سلة المشتريات فارغة!', 'error');
            return;
        }
        
        if (!currentUser) {
            showMessage('يجب تسجيل الدخول لإتمام الشراء!', 'error');
            if (authModal) authModal.classList.add('active');
            return;
        }
        
        // إنشاء طلب جديد
        const orderData = {
            user_id: currentUser.id,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            items: cart
        };
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select();
        
        if (error) throw error;
        
        // تحديث كميات المنتجات
        for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            if (product) {
                await supabase
                    .from('products')
                    .update({ quantity: product.quantity - item.quantity })
                    .eq('id', item.id);
            }
        }
        
        // تفريغ السلة
        cart = [];
        updateCartCount();
        closeCartSidebar();
        
        // إعادة تحميل المنتجات لتعكس الكميات الجديدة
        await loadProducts();
        
        showMessage('تم إتمام الطلب بنجاح! رقم الطلب: ' + data[0].id, 'success');
    } catch (error) {
        console.error('Error during checkout:', error);
        showMessage('خطأ في إتمام الطلب: ' + error.message, 'error');
    }
}

// وظائف واجهة المستخدم

// عرض المنتجات
function renderProducts(filteredProducts = null) {
    const productsToRender = filteredProducts || products;
    if (!productsContainer) {
        console.log('❌ productsContainer غير موجود');
        return;
    }
    
    
    productsContainer.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = '<div class="message">لا توجد منتجات لعرضها</div>';
        return;
    }
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.cursor = 'pointer'; // جعل البطاقة قابلة للنقر
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image || 'images/placeholder.jpg'}" 
                     alt="${product.name}" 
                     class="product-image" 
                     onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">${product.price ? product.price.toLocaleString() : 0} ريال يمني</p>
                <p class="product-description">${product.description || 'لا يوجد وصف'}</p>
                <p class="product-stock">المتوفر: ${product.quantity || 0} قطعة</p>
                <button class="add-to-cart" data-id="${product.id}" ${(!product.quantity || product.quantity === 0) ? 'disabled' : ''}>
                    ${(!product.quantity || product.quantity === 0) ? 'غير متوفر' : 'إضافة إلى السلة'}
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
    });
    
}


// إضافة إلى السلة
function addToCart(productId) {
    console.log('🛒 محاولة إضافة المنتج:', productId);
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.log('❌ المنتج غير موجود');
        return;
    }
    
    if (product.quantity === 0) {
        showMessage('المنتج غير متوفر!', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.quantity) {
            existingItem.quantity++;
            console.log('✅ زيادة كمية المنتج الموجود');
        } else {
            showMessage('لا يوجد كمية كافية من هذا المنتج!', 'error');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
        console.log('✅ إضافة منتج جديد إلى السلة');
    }
    
    updateCartCount();
    
    // ✅ إصلاح: تحديث السلة إذا كانت مفتوحة
    if (cartSidebar && cartSidebar.classList.contains('active')) {
        renderCartItems();
    }
    
    console.log('🛒 السلة بعد الإضافة:', cart);
    showMessage('تمت إضافة المنتج إلى سلة المشتريات!', 'success');
}

// تحديث عدد العناصر في السلة
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
}

// فتح سلة المشتريات
function openCart() {
    
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        renderCartItems();
    } else {
        console.log('❌ خطأ: عناصر السلة غير موجودة');
        console.log('cartSidebar:', cartSidebar);
        console.log('cartOverlay:', cartOverlay);
    }
}

// إغلاق سلة المشتريات
function closeCartSidebar() {
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }
}

// عرض عناصر السلة
function renderCartItems() {
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center;">سلة المشتريات فارغة</p>';
        if (cartTotalPrice) cartTotalPrice.textContent = '0 ريال يمني';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">${item.price.toLocaleString()} ريال</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease-quantity" data-id="${item.id}">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="quantity-btn increase-quantity" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item" data-id="${item.id}">حذف</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    if (cartTotalPrice) cartTotalPrice.textContent = `${total.toLocaleString()} ريال يمني`;
    
    // إضافة مستمعي الأحداث للكمية والحذف
    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            updateCartItemQuantity(itemId, -1);
        });
    });
    
    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            updateCartItemQuantity(itemId, 1);
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            const newQuantity = parseInt(this.value);
            
            if (newQuantity < 1) {
                this.value = 1;
                return;
            }
            
            const product = products.find(p => p.id === itemId);
            if (newQuantity > product.quantity) {
                showMessage('لا يوجد كمية كافية من هذا المنتج!', 'error');
                this.value = product.quantity;
                return;
            }
            
            updateCartItemQuantity(itemId, newQuantity - cart.find(item => item.id === itemId).quantity);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            removeFromCart(itemId);
        });
    });
}

// تحديث كمية العنصر في السلة
function updateCartItemQuantity(itemId, change) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;
    
    const product = products.find(p => p.id === itemId);
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(itemId);
        return;
    }
    
    if (newQuantity > product.quantity) {
        showMessage('لا يوجد كمية كافية من هذا المنتج!', 'error');
        return;
    }
    
    item.quantity = newQuantity;
    updateCartCount();
    renderCartItems();
}

// إزالة العنصر من السلة
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartCount();
    renderCartItems();
    showMessage('تم حذف المنتج من السلة', 'success');
}

// تبديل علامات التبويب في المصادقة
function switchAuthTab(authType) {
    // إزالة النشاط من جميع علامات التبويب
    authTabs.forEach(tab => tab.classList.remove('active'));
    
    // إضافة النشاط لعلامة التبويب المحددة
    const activeTab = document.querySelector(`.auth-tab[data-auth="${authType}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // إخفاء جميع النماذج
    document.querySelectorAll('.auth-tab-content').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none';
    });
    
    // إظهار النموذج المحدد فقط
    const activeForm = document.getElementById(`${authType}-form`);
    if (activeForm) {
        activeForm.classList.add('active');
        activeForm.style.display = 'block';
    }
}

// تحديث واجهة المستخدم بناءً على حالة المصادقة
function updateUI() {
    const headerActions = document.querySelector('.header-actions');
    const navLoginBtn = document.querySelector('nav .login-btn');
    const navRegisterBtn = document.querySelector('nav .register-btn');
    const footerLoginBtn = document.querySelector('footer .login-btn');
    const footerRegisterBtn = document.querySelector('footer .register-btn');
    
    if (currentUser) {
        // إخفاء أزرار التسجيل...
        
        let adminButton = '';
        if (currentUser.role === 'admin') {
            adminButton = '<i class="fas fa-cog settings-icon" id="admin-btn"></i>';
            if (dashboard) {
                dashboard.classList.add('active');
                renderDashboardProducts();
                addUsersManagementTab();
            }
        } else {
            if (dashboard) dashboard.classList.remove('active');
        }
        
        // تحديث header-actions
        if (headerActions) {
            headerActions.innerHTML = `
                <li><a href="#home">الرئيسية</a></li>
                <li><a href="#products">المنتجات</a></li>
                <li><a href="contact.html">اتصل بنا</a></li>
                <li><a href="#" class="login-btn">تسجيل الدخول</a></li>
                <li><a href="#" class="register-btn">إنشاء حساب</a></li>
                <li class="cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="cart-count">${cart.reduce((total, item) => total + item.quantity, 0)}</span>
                </li>
                <li class="user-info"><i class="fas fa-sign-out-alt logout-icon" id="logout-btn-header"></i></li>
                <li class="user-info"><span>مرحباً، ${currentUser.full_name}</span>${adminButton}</li>
            `;
            
            // ✅ إصلاح: تحديث المرجع بعد تغيير الـ DOM
            cartIcon = headerActions.querySelector('.cart-icon');
            cartCount = headerActions.querySelector('.cart-count');
            
            // إعادة ربط الأحداث للأزرار الجديدة
            if (currentUser.role === 'admin') {
                const adminBtn = document.getElementById('admin-btn');
                if (adminBtn) {
                    adminBtn.addEventListener('click', function() {
                        if (dashboard) {
                            dashboard.scrollIntoView({behavior: 'smooth'});
                            renderDashboardProducts();
                        }
                    });
                }
            }
            
            const logoutBtnHeader = document.getElementById('logout-btn-header');
            if (logoutBtnHeader) {
                logoutBtnHeader.addEventListener('click', async function() {
                    await signOut();
                });
            }
        }
    } else {
        // إظهار أزرار التسجيل...
        
        if (dashboard) dashboard.classList.remove('active');
        
        // إعادة تعيين header-actions
        if (headerActions) {
            headerActions.innerHTML = `
                <div class="cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="cart-count">${cart.reduce((total, item) => total + item.quantity, 0)}</span>
                </div>
            `;
            
            // ✅ إصلاح: تحديث المرجع بعد تغيير الـ DOM
            cartIcon = headerActions.querySelector('.cart-icon');
            cartCount = headerActions.querySelector('.cart-count');
        }
    }
    
    // ✅ إصلاح: إعادة ربط أحداث السلة بعد تحديث الواجهة
    setTimeout(() => {
        if (cartIcon) {
            cartIcon.removeEventListener('click', openCart);
            cartIcon.addEventListener('click', openCart);
        }
    }, 100);
}

// إضافة تبويب إدارة المستخدمين في لوحة التحكم (للمدير فقط)
function addUsersManagementTab() {
    if (currentUser.role !== 'admin') return;
    
    // التحقق إذا كان التبويب موجود بالفعل
    if (document.getElementById('users-tab')) return;
    
    // إضافة تبويب جديد
    const dashboardTabs = document.querySelector('.dashboard-tabs');
    if (dashboardTabs) {
        const usersTab = document.createElement('button');
        usersTab.className = 'tab-btn';
        usersTab.setAttribute('data-tab', 'users-tab');
        usersTab.textContent = 'إدارة المستخدمين';
        dashboardTabs.appendChild(usersTab);
        
        // إضافة مستمع حدث للتبويب الجديد
        usersTab.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            const usersTabContent = document.getElementById('users-tab');
            if (usersTabContent) usersTabContent.classList.add('active');
            
            loadUsers();
        });
    }
    
    // إضافة محتوى التبويب
    const container = document.querySelector('.dashboard .container');
    if (container) {
        const usersTabContent = document.createElement('div');
        usersTabContent.className = 'tab-content';
        usersTabContent.id = 'users-tab';
        usersTabContent.innerHTML = `
            <h3>إدارة المستخدمين</h3>
            <div class="form-group">
                <label for="promote-email">ترقية مستخدم إلى مدير:</label>
                <input type="email" id="promote-email" placeholder="البريد الإلكتروني للمستخدم">
                <button id="promote-btn" class="submit-btn">ترقية إلى مدير</button>
            </div>
            <div id="users-list">
                <div class="loading">جاري تحميل المستخدمين...</div>
            </div>
        `;
        container.appendChild(usersTabContent);
        
        // إضافة مستمع حدث لزر الترقية
        const promoteBtn = document.getElementById('promote-btn');
        if (promoteBtn) {
            promoteBtn.addEventListener('click', promoteUserByEmail);
        }
    }
}

// ترقية مستخدم بالبريد الإلكتروني
async function promoteUserByEmail() {
    const emailInput = document.getElementById('promote-email');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    if (!email) {
        showMessage('يرجى إدخال البريد الإلكتروني', 'error');
        return;
    }
    
    try {
        // البحث عن المستخدم بالبريد الإلكتروني
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
        
        if (userError) {
            showMessage('لم يتم العثور على المستخدم!', 'error');
            return;
        }
        
        // ترقية المستخدم
        const success = await promoteToAdmin(userData.id);
        if (success) {
            emailInput.value = '';
            loadUsers(); // إعادة تحميل قائمة المستخدمين
        }
    } catch (error) {
        console.error('Error promoting user:', error);
        showMessage('خطأ في ترقية المستخدم', 'error');
    }
}

// عرض المستخدمين
function renderUsers(users) {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="message">لا توجد مستخدمين</div>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'dashboard-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الدور</th>
                <th>تاريخ التسجيل</th>
                <th>الإجراءات</th>
            </tr>
        </thead>
        <tbody>
            ${users.map(user => `
                <tr>
                    <td>${user.full_name || 'غير محدد'}</td>
                    <td>${user.email || 'غير محدد'}</td>
                    <td>${user.role}</td>
                    <td>${new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                        ${user.role !== 'admin' ? 
                            `<button class="action-btn edit-btn" onclick="promoteUser('${user.id}')">ترقية إلى مدير</button>` : 
                            '<span style="color: green;">مدير</span>'
                        }
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    usersList.appendChild(table);
}

// دالة مساعدة لترقية المستخدم (تعريف عام للاستخدام في الأحداث)
window.promoteUser = async function(userId) {
    const success = await promoteToAdmin(userId);
    if (success) {
        loadUsers(); // إعادة تحميل قائمة المستخدمين
    }
};

// عرض المنتجات في لوحة التحكم
function renderDashboardProducts() {
    if (!dashboardProducts) return;
    
    dashboardProducts.innerHTML = '';
    
    if (products.length === 0) {
        dashboardProducts.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد منتجات</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
            <td>${product.name}</td>
            <td>${product.price.toLocaleString()} ريال</td>
            <td>${product.quantity}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${product.id}">تعديل</button>
                <button class="action-btn delete-btn" data-id="${product.id}">حذف</button>
            </td>
        `;
        
        dashboardProducts.appendChild(row);
    });
    
    // إضافة مستمعي الأحداث لأزرار التعديل والحذف
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            deleteProduct(productId);
        });
    });
}

// عرض الطلبات
function renderOrders() {
    const ordersTableBody = document.getElementById('orders-table-body');
    if (!ordersTableBody) return;
    
    ordersTableBody.innerHTML = '';
    
    if (orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد طلبات</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.user_id}</td>
            <td>${new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
            <td>${order.total.toLocaleString()} ريال</td>
            <td>${order.status}</td>
        `;
        
        ordersTableBody.appendChild(row);
    });
}

// تعديل المنتج
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // في تطبيق حقيقي، سيتم فتح نموذج تعديل
    const newName = prompt('أدخل الاسم الجديد:', product.name);
    if (newName) {
        updateProduct(productId, { name: newName });
    }
}

// تصفية المنتجات
function filterProducts() {
    const category = categoryFilter ? categoryFilter.value : '';
    const size = sizeFilter ? sizeFilter.value : '';
    const color = colorFilter ? colorFilter.value : '';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = products;
    
    if (category) {
        filtered = filtered.filter(product => product.category === category);
    }
    
    if (size) {
        filtered = filtered.filter(product => product.size === size);
    }
    
    if (color) {
        filtered = filtered.filter(product => product.color === color);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts(filtered);
}

// عرض الرسائل
function showMessage(message, type) {
    // إزالة أي رسائل سابقة
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // إنشاء رسالة جديدة
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    // إضافة الرسالة في أعلى الصفحة
    document.body.insertBefore(messageEl, document.body.firstChild);
    
    // إزالة الرسالة بعد 5 ثواني
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

// تصدير الدوال للاستخدام في console (للت debugging)
window.sajaStore = {
    currentUser,
    products,
    cart,
    promoteToAdmin,
    loadUsers
};
 // تفعيل التبويبات
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                // إزالة النشاط من جميع الأزرار والمحتويات
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // إضافة النشاط للزر والمحتوى المحدد
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });



// فتح صفحة تفاصيل المنتج
function openProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    renderProductDetail(product);
    if (productDetailModal) {
        productDetailModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // منع التمرير
    }
}

// إغلاق صفحة تفاصيل المنتج
function closeProductDetail() {
    if (productDetailModal) {
        productDetailModal.classList.remove('active');
        document.body.style.overflow = ''; // إعادة التمرير
    }
}

// عرض تفاصيل المنتج
function renderProductDetail(product) {
    if (!productDetailContainer) return;
    
    const isAvailable = product.quantity > 0;
    
    productDetailContainer.innerHTML = `
        <div class="product-detail-image">
            <img src="${product.image || 'images/placeholder.jpg'}" 
                 alt="${product.name}" 
                 onerror="this.src='images/placeholder.jpg'">
        </div>
        <div class="product-detail-info">
            <div class="product-detail-category">${product.category || 'عام'}</div>
            <h1 class="product-detail-title">${product.name}</h1>
            <div class="product-detail-price">${product.price ? product.price.toLocaleString() : 0} ريال يمني</div>
            
            <div class="product-detail-description">
                ${product.description || 'لا يوجد وصف متاح لهذا المنتج.'}
            </div>
            
            <div class="product-detail-meta">
                <div class="meta-item">
                    <span class="meta-label">المقاس</span>
                    <span class="meta-value">${product.size || 'غير محدد'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">اللون</span>
                    <span class="meta-value">${product.color || 'غير محدد'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">الفئة</span>
                    <span class="meta-value">${product.category || 'عام'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">الحالة</span>
                    <span class="meta-value ${isAvailable ? 'stock-available' : 'stock-unavailable'}">
                        ${isAvailable ? 'متوفر' : 'غير متوفر'}
                    </span>
                </div>
            </div>
            
            <div class="product-detail-actions">
                <div class="quantity-selector">
                    <button class="quantity-btn decrease-detail">-</button>
                    <input type="number" class="quantity-input" value="1" min="1" max="${product.quantity}" id="detail-quantity">
                    <button class="quantity-btn increase-detail">+</button>
                </div>
                <button class="add-to-cart-large" 
                        data-id="${product.id}"
                        ${!isAvailable ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart"></i>
                    ${!isAvailable ? 'غير متوفر' : 'إضافة إلى السلة'}
                </button>
            </div>
            
            <div class="product-detail-stock">
                <span class="${isAvailable ? 'stock-available' : 'stock-unavailable'}">
                    ${isAvailable ? `✓ متوفر ${product.quantity} قطعة` : '✗ غير متوفر حالياً'}
                </span>
            </div>
        </div>
    `;
    
    // إضافة مستمعي الأحداث للكمية والإضافة
    setupDetailEventListeners(product);
}

// إعداد مستمعي الأحداث لصفحة التفاصيل
function setupDetailEventListeners(product) {
    const decreaseBtn = document.querySelector('.decrease-detail');
    const increaseBtn = document.querySelector('.increase-detail');
    const quantityInput = document.getElementById('detail-quantity');
    const addToCartBtn = document.querySelector('.add-to-cart-large');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue < product.quantity) {
                quantityInput.value = currentValue + 1;
            } else {
                showMessage('لا يوجد كمية كافية من هذا المنتج!', 'error');
            }
        });
    }
    
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            if (value < 1) {
                this.value = 1;
            } else if (value > product.quantity) {
                this.value = product.quantity;
                showMessage('لا يوجد كمية كافية من هذا المنتج!', 'error');
            }
        });
    }
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const quantity = parseInt(quantityInput.value);
            addToCartFromDetail(product.id, quantity);
        });
    }
}

// إضافة إلى السلة من صفحة التفاصيل
function addToCartFromDetail(productId, quantity) {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity === 0) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= product.quantity) {
            existingItem.quantity = newQuantity;
        } else {
            showMessage('لا يوجد كمية كافية من هذا المنتج!', 'error');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    updateCartCount();
    if (cartSidebar && cartSidebar.classList.contains('active')) {
        renderCartItems();
    }
    
    showMessage(`تمت إضافة ${quantity} من المنتج إلى سلة المشتريات!`, 'success');
    closeProductDetail();
}


