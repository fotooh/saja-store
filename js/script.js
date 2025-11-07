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
let productDetailModal, productDetailContainer, closeDetail;
let mobileOverlay;

// تهيئة الموقع
document.addEventListener('DOMContentLoaded', async function() {
    initializeDOMElements();
    await loadProducts();
    await checkAuthState();
    setupEventListeners();
    setupGlobalEventDelegation();
});

// تهيئة عناصر DOM
function initializeDOMElements() {
    console.log('🔄 Initializing DOM elements...');
    
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
    
    // ✅ إصلاح: البحث المتعدد للعناصر
    if (!cartIcon) cartIcon = document.querySelector('.header-actions .cart-icon');
    if (!cartCount) cartCount = document.querySelector('.header-actions .cart-count');
    
    // عناصر التنقل - البحث المباشر
    mobileMenu = document.querySelector('.mobile-menu');
    nav = document.querySelector('nav');
    
    console.log('✅ Navigation elements:', { 
        mobileMenu: !!mobileMenu, 
        nav: !!nav 
    });
    
    // عناصر المصادقة
    authModal = document.getElementById('auth-modal');
    closeAuth = document.querySelector('.close-auth');
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
    
    // عناصر صفحة التفاصيل
    productDetailModal = document.getElementById('product-detail-modal');
    productDetailContainer = document.getElementById('product-detail-container');
    closeDetail = document.querySelector('.close-detail');

    // ✅ إنشاء overlay للقائمة الجوال
    if (!document.getElementById('mobile-overlay')) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.id = 'mobile-overlay';
        mobileOverlay.className = 'mobile-overlay';
        document.body.appendChild(mobileOverlay);
        console.log('✅ Mobile overlay created');
    } else {
        mobileOverlay = document.getElementById('mobile-overlay');
    }
    
    console.log('🎯 DOM elements initialization completed');
}

// ✅ إضافة event delegation عالمي
function setupGlobalEventDelegation() {
    // التعامل مع أزرار إضافة إلى السلة
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
            const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
            const productId = button?.getAttribute('data-id');
            if (productId) {
                addToCart(parseInt(productId));
                e.stopPropagation();
            }
        }
        
        // التعامل مع بطاقات المنتج (لتفاصيل المنتج)
        if (e.target.closest('.product-card') && !e.target.classList.contains('add-to-cart')) {
            const productCard = e.target.closest('.product-card');
            const addToCartBtn = productCard.querySelector('.add-to-cart');
            const productId = addToCartBtn?.getAttribute('data-id');
            if (productId) {
                openProductDetail(parseInt(productId));
            }
        }
        
        // التعامل مع أزرار لوحة التحكم
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const button = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
            const productId = button?.getAttribute('data-id');
            if (productId) {
                editProduct(parseInt(productId));
            }
        }
        
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const button = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            const productId = button?.getAttribute('data-id');
            if (productId) {
                deleteProduct(parseInt(productId));
            }
        }

        // التعامل مع أزرار المستخدمين
        if (e.target.classList.contains('promote-btn') || e.target.closest('.promote-btn')) {
            const button = e.target.classList.contains('promote-btn') ? e.target : e.target.closest('.promote-btn');
            const userId = button?.getAttribute('data-id') || button?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (userId) {
                promoteUser(userId);
            }
        }
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {

    // إظهار/إخفاء القائمة على الهواتف
    
    function bindCartEvents() {
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
        if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            toggleMobileMenu();
        });
    }
    
        if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function() {
            closeMobileMenu();
        });
    }

    }
    
    // ✅ إصلاح: استخدام arrow functions في setTimeout
    const originalUpdateUI = updateUI;
    updateUI = function() {
        originalUpdateUI();
        setTimeout(() => {
            bindCartEvents();
        }, 100);
    };
    
    // إظهار/إخفاء القائمة على الهواتف
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            if (nav) nav.classList.toggle('active');
        });
    }
    
    // ✅ إصلاح: ربط الأحداث بشكل آمن
    if (cartIcon) cartIcon.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', closeCartSidebar);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartSidebar);
    
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
            
            if (tabId === 'orders-tab') {
                loadOrders();
            } else if (tabId === 'users-tab') {
                loadUsers();
            } else if (tabId === 'offers-tab') {
                // ✅ استخدام arrow function
                setTimeout(() => {
                    if (typeof initializeOfferManagement === 'function') {
                        initializeOfferManagement();
                    }
                }, 100);
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
    
    // ✅ إضافة: إغلاق صفحة التفاصيل
    if (closeDetail) {
        closeDetail.addEventListener('click', closeProductDetail);
    }
    
    if (productDetailModal) {
        productDetailModal.addEventListener('click', function(e) {
            if (e.target === productDetailModal) {
                closeProductDetail();
            }
        });
    }
    
    // ربط الأحداث الأولية
    bindCartEvents();

    setTimeout(() => {
        if (typeof initializeEnhancedSearch === 'function') {
            initializeEnhancedSearch();
        }
    }, 1000);
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
        showMessage('حدث خطأ في تحميل الطلبات', 'error');
    }
}

// تحميل المستخدمين
async function loadUsers() {
    try {
        // التحقق من الصلاحيات أولاً
        const hasPermission = await checkAdminPermissions();
        if (!hasPermission) {
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
        showMessage('حدث خطأ في تحميل المستخدمين: ' + error.message, 'error');
    }
}

// التحقق من صلاحيات المدير
async function checkAdminPermissions() {
    try {
        // إذا كان currentUser موجوداً ومدير، نعود مباشرة
        if (currentUser && currentUser.role === 'admin') {
            return true;
        }
        
        // إذا لم يكن موجوداً، نتحقق من الجلسة
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return false;
        }
        
        // التحقق من البريد الإلكتروني للمدير
        const isAdmin = ADMIN_EMAILS.includes(user.email);
        
        // تحديث currentUser إذا كان مديراً
        if (isAdmin && currentUser) {
            currentUser.role = 'admin';
        }
        
        return isAdmin;
    } catch (error) {
        return false;
    }
}

// التحقق من حالة المصادقة
async function checkAuthState() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            return;
        }
        
        currentUser = session?.user || null;
        
        if (currentUser) {
            await checkUserRole();
        } else {
            updateUI();
        }
    } catch (error) {
        currentUser = null;
        updateUI();
    }
}

// التحقق من دور المستخدم وتحديث currentUser
async function checkUserRole() {
    try {
        // جلب جلسة المستخدم الحالية
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();

        if (sessionError) {
            throw sessionError;
        }
        
        if (!user) {
            currentUser = null;
            updateUI();
            return;
        }

        // جلب الدور من جدول profiles
        let profile;
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, phone, role, email')
            .eq('id', user.id)
            .single();

        if (profileError) {
            // إذا لم يكن هناك ملف تعريف، ننشئ واحداً افتراضياً
            if (profileError.code === 'PGRST116') {
                await createUserProfile(user, user.email?.split('@')[0] || 'مستخدم', '');
                
                // إعادة محاولة جلب ملف التعريف
                const { data: newProfile, error: newError } = await supabase
                    .from('profiles')
                    .select('id, full_name, phone, role, email')
                    .eq('id', user.id)
                    .single();
                    
                if (newError) throw newError;
                
                profile = newProfile;
            } else {
                throw profileError;
            }
        } else {
            profile = profileData;
        }

        // تحديث currentUser بالبيانات من profiles
        currentUser = {
            id: user.id,
            email: user.email,
            role: profile?.role || 'customer',
            full_name: profile?.full_name || user.email?.split('@')[0] || 'مستخدم',
            phone: profile?.phone || ''
        };

        updateUI();
    } catch (error) {
        // إنشاء مستخدم افتراضي في حالة الخطأ
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUser = {
                id: user.id,
                email: user.email,
                role: 'customer',
                full_name: user.email?.split('@')[0] || 'مستخدم',
                phone: ''
            };
        } else {
            currentUser = null;
        }
        
        updateUI();
    }
}

// إنشاء ملف تعريف للمستخدم الجديد
async function createUserProfile(user, name, phone) {
    if (!user) {
        return;
    }

    try {
        // تحقق إذا كان الملف موجود مسبقاً
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            return;
        }

        if (existingProfile) {
            return;
        }

        // تحديد الدور بناءً على البريد الإلكتروني
        const userRole = ADMIN_EMAILS.includes(user.email) ? 'admin' : 'customer';

        const { data, error } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: user.email,
                    full_name: name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
                    phone: phone || user.user_metadata?.phone || '',
                    role: userRole
                }
            ])
            .select();

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error creating user profile:', error);
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
            await checkUserRole();
        }

        showMessage('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.', 'success');
        if (authModal) authModal.classList.remove('active');
        updateUI();
    } catch (error) {
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
        
        if (error) {
            throw error;
        }
        
        currentUser = data.user;
        
        await checkUserRole();
        
        if (authModal) authModal.classList.remove('active');
        showMessage('تم تسجيل الدخول بنجاح!', 'success');
        
    } catch (error) {
        showMessage(' خطأ في تسجيل الدخول: ' + (error.message || 'بيانات الدخول غير صحيحة'), 'error');
    }
}

// تسجيل الخروج
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
        
        currentUser = null;
        cart = []; // تفريغ السلة
        updateUI();
        showMessage('تم تسجيل الخروج بنجاح!', 'success');
        
    } catch (error) {
        showMessage('خطأ في تسجيل الخروج: ' + (error.message || 'حدث خطأ غير متوقع'), 'error');
    }
}

// إضافة منتج
async function addProduct() {
    // التحقق من الصلاحيات أولاً
    const hasPermission = await checkAdminPermissions();
    if (!hasPermission) {
        showMessage('ليس لديك صلاحية لإضافة منتجات!', 'error');
        return;
    }

    const addButton = document.querySelector('#add-product-form button[type="submit"]');
    
    try {
        // حفظ النص الأصلي للزر
        const originalText = addButton ? addButton.innerHTML : 'إضافة المنتج';
        
        // إظهار حالة التحميل على الزر
        if (addButton) {
            addButton.disabled = true;
            addButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...`;
            addButton.style.opacity = '0.7';
        }

        // التحقق من الصلاحيات
        if (!currentUser || currentUser.role !== 'admin') {
            showMessage('ليس لديك صلاحية لإضافة منتجات!', 'error');
            return;
        }

        // قراءة القيم من الحقول
        const name = document.getElementById('product-name')?.value.trim();
        const priceValue = document.getElementById('product-price')?.value.trim();
        const quantityValue = document.getElementById('product-quantity')?.value.trim();
        const category = document.getElementById('product-category')?.value.trim();
        const productType = document.getElementById('product-type')?.value.trim();
        const size = document.getElementById('product-size')?.value.trim();
        const colorInput = document.getElementById('product-color');
        const color = colorInput.value;
        const colorHex = colorInput.getAttribute('data-hex-color') || '#000000';
        const currency = document.getElementById('product-currency')?.value;
        const description = document.getElementById('product-description')?.value.trim();

        // التحقق من المدخلات المطلوبة
        if (!name) {
            showMessage('الرجاء إدخال اسم المنتج!', 'error');
            return;
        }
        if (!priceValue || isNaN(parseFloat(priceValue))) {
            showMessage('الرجاء إدخال سعر صحيح!', 'error');
            return;
        }
        if (!quantityValue || isNaN(parseInt(quantityValue))) {
            showMessage('الرجاء إدخال كمية صحيحة!', 'error');
            return;
        }
        if (!category) {
            showMessage('الرجاء اختيار الفئة الرئيسية!', 'error');
            return;
        }
        if (!productType) {
            showMessage('الرجاء اختيار نوع الملابس!', 'error');
            return;
        }
        if (!size) {
            showMessage('الرجاء اختيار المقاس!', 'error');
            return;
        }
        if (!color) {
            showMessage('الرجاء إدخال اللون!', 'error');
            return;
        }

        const price = parseFloat(priceValue);
        const quantity = parseInt(quantityValue);

        // التحقق من وجود صور
        const fileInput = document.getElementById('product-images');
        if (!fileInput || fileInput.files.length === 0) {
            showMessage('الرجاء رفع صورة واحدة على الأقل للمنتج!', 'error');
            return;
        }

        if (fileInput.files.length > 5) {
            showMessage('يمكنك رفع 5 صور كحد أقصى!', 'error');
            return;
        }

        showMessage('جاري رفع الصور وإضافة المنتج...', 'info');

        // رفع الصور المتعددة
        const imageUrls = [];
        const files = Array.from(fileInput.files);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const cleanFileName = Date.now() + '_' + i + '_' + file.name.replace(/\s+/g, '_');

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('images')
                .upload(`products/${cleanFileName}`, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error('فشل في رفع الصورة: ' + uploadError.message);
            }

            // الحصول على رابط الصورة
            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(`products/${cleanFileName}`);
            
            imageUrls.push(urlData.publicUrl);
        }

        // تجهيز بيانات المنتج
        const productData = {
            name,
            price,
            currency,
            quantity,
            category,
            product_type: productType,
            size,
            color,
            color_hex: colorHex,
            description: description || null,
            images: imageUrls,
            image: imageUrls[0],
            user_id: currentUser.id
        };

        showMessage('جاري إضافة المنتج إلى قاعدة البيانات...', 'info');

        // إضافة المنتج
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();

        if (error) {
            throw error;
        }

        // تحديث القائمة
        if (data && data[0]) {
            products.unshift(data[0]);
            renderProducts();
            renderDashboardProducts();
        }

        // إعادة تعيين النموذج
        if (addProductForm) {
            addProductForm.reset();
            const imagesPreviewContainer = document.getElementById('images-preview-container');
            if (imagesPreviewContainer) {
                imagesPreviewContainer.innerHTML = '';
            }
            const imageUploadBox = document.getElementById('image-upload-box');
            if (imageUploadBox) imageUploadBox.classList.remove('has-image');
        }

        showMessage('تم إضافة المنتج بنجاح!', 'success');

        // التبديل تلقائياً إلى تبويب المنتجات
        const productsTabBtn = document.querySelector('.tab-btn[data-tab="products-tab"]');
        if (productsTabBtn) {
            productsTabBtn.click();
        }

    } catch (error) {
        showMessage('❌ خطأ في إضافة المنتج: ' + (error.message || JSON.stringify(error)), 'error');
    } finally {
        // إعادة تعيين الزر
        if (addButton) {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة المنتج';
            addButton.style.opacity = '1';
        }
    }
}

// تحديث المنتج
async function updateProduct(productId, updates) {
    try {
        // التحقق من الصلاحيات أولاً
        const hasPermission = await checkAdminPermissions();
        if (!hasPermission) {
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
        showMessage('خطأ في تحديث المنتج: ' + error.message, 'error');
    }
}

// حذف المنتج
async function deleteProduct(productId) {
    try {
        // التحقق من الصلاحيات أولاً
        const hasPermission = await checkAdminPermissions();
        if (!hasPermission) {
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
        showMessage('خطأ في حذف المنتج: ' + error.message, 'error');
    }
}

// ترقية مستخدم إلى مدير
async function promoteToAdmin(userId) {
    try {
        // التحقق من الصلاحيات أولاً
        const hasPermission = await checkAdminPermissions();
        if (!hasPermission) {
            showMessage('ليس لديك صلاحية لترقية المستخدمين!', 'error');
            return false;
        }
        
        // التحقق من أن userId صالح
        if (!userId) {
            showMessage('معرف المستخدم غير صالح!', 'error');
            return false;
        }
        
        const { data, error } = await supabase
            .from('profiles')
            .update({ 
                role: 'admin',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select();
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            showMessage('تم ترقية المستخدم إلى مدير بنجاح!', 'success');
            return true;
        } else {
            showMessage('لم يتم العثور على المستخدم!', 'error');
            return false;
        }
    } catch (error) {
        // معالجة أنواع الأخطاء المختلفة
        if (error.code === '42501') {
            showMessage('ليس لديك صلاحية لتعديل بيانات المستخدمين!', 'error');
        } else if (error.code === '406') {
            showMessage('خطأ في تنسيق البيانات. يرجى التحقق من السياسات في Supabase.', 'error');
        } else {
            showMessage('خطأ في ترقية المستخدم: ' + (error.message || JSON.stringify(error)), 'error');
        }
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
        showMessage('خطأ في إتمام الطلب: ' + error.message, 'error');
    }
}


// ✅ تحديث دالة renderProducts لتكون آمنة
function renderProducts(filteredProducts = null) {
    const productsToRender = filteredProducts || products;
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لم نعثر على منتجات</h3>
                <p>جرب تعديل كلمات البحث أو الفلاتر للحصول على نتائج أفضل</p>
            </div>
        `;
        return;
    }
    
    productsToRender.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

// ✅ إنشاء بطاقة منتج بشكل آمن
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.style.cursor = 'pointer';
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image-container';
    
    const img = document.createElement('img');
    img.src = product.image || 'images/placeholder.jpg';
    img.alt = product.name;
    img.className = 'product-image';
    // ✅ إصلاح: استخدام addEventListener بدلاً من onerror attribute
    img.addEventListener('error', function() {
        this.src = 'images/placeholder.jpg';
    });
    
    imageContainer.appendChild(img);
    
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = product.name;
    
    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = `${product.price ? product.price.toLocaleString() : 0} ريال يمني`;
    
    const description = document.createElement('p');
    description.className = 'product-description';
    description.textContent = product.description || 'لا يوجد وصف';
    
    const stock = document.createElement('p');
    stock.className = 'product-stock';
    stock.textContent = `المتوفر: ${product.quantity || 0} قطعة`;
    
    const addButton = document.createElement('button');
    addButton.className = 'add-to-cart';
    addButton.setAttribute('data-id', product.id);
    addButton.disabled = !product.quantity || product.quantity === 0;
    addButton.textContent = (!product.quantity || product.quantity === 0) ? 'غير متوفر' : 'إضافة إلى السلة';
    
    productInfo.appendChild(title);
    productInfo.appendChild(price);
    productInfo.appendChild(description);
    productInfo.appendChild(stock);
    productInfo.appendChild(addButton);
    
    productCard.appendChild(imageContainer);
    productCard.appendChild(productInfo);
    
    return productCard;
}

// إضافة إلى السلة
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
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
    }
    
    updateCartCount();
    
    // ✅ إصلاح: تحديث السلة إذا كانت مفتوحة
    if (cartSidebar && cartSidebar.classList.contains('active')) {
        renderCartItems();
    }
    
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

// ✅ تحديث دالة updateUI لتكون آمنة
async function updateUI() {
    const headerActions = document.querySelector('.header-actions');
    const navLoginBtn = document.querySelector('nav .login-btn');
    const navRegisterBtn = document.querySelector('nav .register-btn');
    
    try {
        if (currentUser) {
            const safeUserName = currentUser.full_name || 
                               currentUser.email?.split('@')[0] || 
                               'مستخدم';
            
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
            
            // ✅ تحديث header-actions بشكل آمن
            if (headerActions) {
                headerActions.innerHTML = `
                    <li class="cart-icon">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count">${cart.reduce((total, item) => total + item.quantity, 0)}</span>
                    </li>
                    <li class="user-info">
                        <i class="fas fa-sign-out-alt logout-icon" id="logout-btn-header"></i>
                    </li>
                    <li class="user-info">
                        ${adminButton}
                        <span>مرحباً، ${safeUserName}</span>
                    </li>
                `;
                
                // ✅ ربط الأحداث بعد تحديث DOM
                setTimeout(() => {
                    cartIcon = headerActions.querySelector('.cart-icon');
                    cartCount = headerActions.querySelector('.cart-count');
                    
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
                    
                    // إعادة ربط أحداث السلة
                    if (cartIcon) {
                        cartIcon.removeEventListener('click', openCart);
                        cartIcon.addEventListener('click', openCart);
                    }
                }, 0);
            }
            
            if (navLoginBtn) navLoginBtn.style.display = 'none';
            if (navRegisterBtn) navRegisterBtn.style.display = 'none';
            
        } else {
            if (navLoginBtn) navLoginBtn.style.display = 'inline';
            if (navRegisterBtn) navRegisterBtn.style.display = 'inline';
            
            if (dashboard) dashboard.classList.remove('active');
            
            if (headerActions) {
                headerActions.innerHTML = `
                    <div class="cart-icon">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count">${cart.reduce((total, item) => total + item.quantity, 0)}</span>
                    </div>
                `;
                
                // ✅ ربط الأحداث بعد تحديث DOM
                setTimeout(() => {
                    cartIcon = headerActions.querySelector('.cart-icon');
                    cartCount = headerActions.querySelector('.cart-count');
                    
                    if (cartIcon) {
                        cartIcon.removeEventListener('click', openCart);
                        cartIcon.addEventListener('click', openCart);
                    }
                }, 0);
            }
        }
        
    } catch (error) {
        console.error('Error in updateUI:', error);
    }
}

// إضافة تبويب إدارة المستخدمين في لوحة التحكم (للمدير فقط)
async function addUsersManagementTab() {
    const hasPermission = await checkAdminPermissions();
    if (!hasPermission) return;
    
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
            <div id="users-list">
                <div class="loading">جاري تحميل المستخدمين...</div>
            </div>
        `;
        container.appendChild(usersTabContent);
    }
}

// ترقية مستخدم بالبريد الإلكتروني
async function promoteUserByEmail() {
    const emailInput = document.getElementById('promote-email');
    if (!emailInput) return;

    // التحقق من الصلاحيات أولاً
    const hasPermission = await checkAdminPermissions();
    if (!hasPermission) {
        showMessage('ليس لديك صلاحية لترقية المستخدمين!', 'error');
        return;
    }
    
    const email = emailInput.value.trim();
    if (!email) {
        showMessage('يرجى إدخال البريد الإلكتروني', 'error');
        return;
    }
    
    try {
        // البحث عن المستخدم بالبريد الإلكتروني
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email, role')
            .eq('email', email)
            .maybeSingle();
        
        if (userError) {
            showMessage('خطأ في البحث عن المستخدم: ' + userError.message, 'error');
            return;
        }
        
        if (!userData) {
            showMessage('لم يتم العثور على مستخدم بهذا البريد الإلكتروني!', 'error');
            return;
        }
        
        // التحقق إذا كان المستخدم مدير بالفعل
        if (userData.role === 'admin') {
            showMessage('هذا المستخدم مدير بالفعل!', 'info');
            return;
        }
        
        // ترقية المستخدم
        const success = await promoteToAdmin(userData.id);
        if (success) {
            emailInput.value = '';
            loadUsers();
        }
    } catch (error) {
        showMessage('خطأ في ترقية المستخدم: ' + error.message, 'error');
    }
}

// عرض المستخدمين
function renderUsers(users) {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
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
                    <td>
                        <span class="role-badge ${user.role === 'admin' ? 'admin-badge' : 'user-badge'}">
                            ${user.role === 'admin' ? 'مدير' : 'عميل'}
                        </span>
                    </td>
                    <td>${new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                        ${user.role !== 'admin' ? 
                            `<button class="action-btn promote-btn" data-id="${user.id}">
                                <i class="fas fa-user-shield"></i> ترقية إلى مدير
                            </button>` : 
                            '<span class="admin-text"><i class="fas fa-crown"></i> مدير</span>'
                        }
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    usersList.innerHTML = '';
    usersList.appendChild(table);
}

// دالة مساعدة لترقية المستخدم
async function promoteUser(userId) {
    const success = await promoteToAdmin(userId);
    if (success) {
        loadUsers();
    }
}

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
    enhancedFilterProducts();
}

// عرض الرسائل
function showMessage(message, type) {
    // إزالة أي رسائل سابقة
    const existingMessages = document.querySelectorAll('.message-toast');
    existingMessages.forEach(msg => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
    });

    // تحديد الألوان والرموز بناءً على نوع الرسالة
    const messageConfig = {
        success: {
            icon: 'fa-check-circle',
            color: '#10b981',
            bgColor: '#ecfdf5',
            borderColor: '#a7f3d0'
        },
        error: {
            icon: 'fa-exclamation-circle',
            color: '#ef4444',
            bgColor: '#fef2f2',
            borderColor: '#fecaca'
        },
        warning: {
            icon: 'fa-exclamation-triangle',
            color: '#f59e0b',
            bgColor: '#fffbeb',
            borderColor: '#fed7aa'
        },
        info: {
            icon: 'fa-info-circle',
            color: '#3b82f6',
            bgColor: '#eff6ff',
            borderColor: '#bfdbfe'
        }
    };

    const config = messageConfig[type] || messageConfig.info;

    // إنشاء رسالة جديدة
    const messageEl = document.createElement('div');
    messageEl.className = 'message-toast';
    messageEl.innerHTML = `
        <div class="message-content" style="
            background: ${config.bgColor};
            border: 2px solid ${config.borderColor};
            border-right: 4px solid ${config.color};
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 450px;
            margin: 0 auto;
            position: relative;
            backdrop-filter: blur(10px);
        ">
            <i class="fas ${config.icon}" style="
                color: ${config.color};
                font-size: 20px;
                flex-shrink: 0;
            "></i>
            <span style="
                color: #1f2937;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.5;
                flex: 1;
            ">${message}</span>
            <button class="message-close" style="
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            ">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // إضافة الأنيميشن الأساسية
    messageEl.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        z-index: 10000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        width: 90%;
        max-width: 450px;
    `;

    // إضافة الرسالة إلى الجسم
    document.body.appendChild(messageEl);

    // إضافة مستمع حدث لإغلاق الرسالة
    const closeBtn = messageEl.querySelector('.message-close');
    closeBtn.addEventListener('click', () => {
        closeMessage(messageEl);
    });

    // النقر خارج الرسالة لإغلاقها
    messageEl.addEventListener('click', (e) => {
        if (e.target === messageEl) {
            closeMessage(messageEl);
        }
    });

    // ظهور الرسالة
    setTimeout(() => {
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    // ✅ إصلاح: استخدام arrow function في setTimeout
    const autoCloseTimer = setTimeout(() => {
        closeMessage(messageEl);
    }, 6000);

    // دالة إغلاق الرسالة
    function closeMessage(element) {
        clearTimeout(autoCloseTimer);
        element.style.opacity = '0';
        element.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (element.parentNode) {
                element.remove();
            }
        }, 400);
    }
}

// فتح صفحة تفاصيل المنتج
function openProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    renderProductDetail(product);
    if (productDetailModal) {
        productDetailModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// إغلاق صفحة تفاصيل المنتج
function closeProductDetail() {
    if (productDetailModal) {
        productDetailModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
// عرض تفاصيل المنتج مع الصور المتعددة
function renderProductDetail(product) {
    if (!productDetailContainer) return;
    
    const isAvailable = product.quantity > 0;
    const images = product.images || [product.image || 'images/placeholder.jpg'];
    
    productDetailContainer.innerHTML = `
        <div class="product-detail-gallery">
            <div class="main-image-container">
                <img src="${images[0]}" alt="${product.name}" id="main-product-image">
                ${images.length > 1 ? `
                    <button class="gallery-nav prev-image"><i class="fas fa-chevron-right"></i></button>
                    <button class="gallery-nav next-image"><i class="fas fa-chevron-left"></i></button>
                ` : ''}
            </div>
            
            ${images.length > 1 ? `
                <div class="image-thumbnails">
                    ${images.map((img, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <img src="${img}" alt="${product.name} - صورة ${index + 1}">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
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
    
    // إعداد مستمعي الأحداث للصور المتعددة
    if (images.length > 1) {
        setupImageGallery(images);
    }
    
    setupDetailEventListeners(product);
}

// إعداد معرض الصور
function setupImageGallery(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.prev-image');
    const nextBtn = document.querySelector('.next-image');
    
    let currentImageIndex = 0;

    // تحديث الصورة الرئيسية
    function updateMainImage(index) {
        mainImage.src = images[index];
        currentImageIndex = index;
        
        // تحديث التصغيرات النشطة
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    // أحداث التصغيرات
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            updateMainImage(index);
        });
    });

    // التنقل بين الصور
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            let newIndex = currentImageIndex - 1;
            if (newIndex < 0) newIndex = images.length - 1;
            updateMainImage(newIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            let newIndex = currentImageIndex + 1;
            if (newIndex >= images.length) newIndex = 0;
            updateMainImage(newIndex);
        });
    }

    // التنقل بالسلويدر (سحب الصور)
    let startX = 0;
    let endX = 0;
    
    mainImage.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    mainImage.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // سحب لليسار - الصورة التالية
                let newIndex = currentImageIndex + 1;
                if (newIndex >= images.length) newIndex = 0;
                updateMainImage(newIndex);
            } else {
                // سحب لليمين - الصورة السابقة
                let newIndex = currentImageIndex - 1;
                if (newIndex < 0) newIndex = images.length - 1;
                updateMainImage(newIndex);
            }
        }
    }
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

// دالة مساعدة لتحويل hex إلى اسم اللون
function getColorNameFromHex(hex) {
    const colorMap = {
        '#ff0000': 'أحمر', '#ff4d4d': 'أحمر فاتح', '#cc0000': 'أحمر غامق',
        '#0000ff': 'أزرق', '#4d4dff': 'أزرق فاتح', '#0000cc': 'أزرق غامق',
        '#008000': 'أخضر', '#00cc00': 'أخضر فاتح', '#006600': 'أخضر غامق',
        '#000000': 'أسود', '#333333': 'أسود فاتح',
        '#ffffff': 'أبيض', '#cccccc': 'أبيض دافئ',
        '#808080': 'رمادي', '#a0a0a0': 'رمادي فاتح', '#606060': 'رمادي غامق',
        '#a52a2a': 'بني', '#d2691e': 'بني فاتح', '#8b4513': 'بني غامق',
        '#ffc0cb': 'زهري', '#ff69b4': 'زهري غامق', '#ffb6c1': 'زهري فاتح',
        '#800080': 'بنفسجي', '#9370db': 'بنفسجي فاتح', '#4b0082': 'بنفسجي غامق',
        '#ffa500': 'برتقالي', '#ff8c00': 'برتقالي غامق', '#ffd700': 'ذهبي',
        '#ffff00': 'أصفر', '#ffeb3b': 'أصفر فاتح', '#fbc02d': 'أصفر غامق',
        '#c0c0c0': 'فضي', '#e0e0e0': 'فضي فاتح',
        '#fffdd0': 'كريمي', '#fff8dc': 'كريمي فاتح',
        '#f5f5dc': 'بيج', '#deb887': 'بيج دافئ',
        '#800000': 'نبيتي', '#b22222': 'نبيتي فاتح',
        '#40e0d0': 'تركواز', '#00ced1': 'تركواز غامق',
        '#ccff00': 'فسفوري', '#00ff00': 'فسفوري فاتح'
    };
    
    // البحث عن أقرب لون
    const hexLower = hex.toLowerCase();
    if (colorMap[hexLower]) {
        return colorMap[hexLower];
    }
    
    // إذا لم يكن اللون معروفاً، نعيد "لون مخصص"
    return 'لون مخصص';
}

// تحديث اختيار اللون
function updateColorSelection(color, name) {
    const colorInput = document.getElementById('product-color');
    const colorPreview = document.getElementById('color-preview');
    
    if (colorInput && colorPreview) {
        colorInput.value = name;
        colorPreview.style.backgroundColor = color;
        colorInput.setAttribute('data-hex-color', color);
    }
}

// تهيئة منتقي الألوان المحسن
function initializeEnhancedColorPicker() {
    const colorInput = document.getElementById('product-color');
    const colorPreview = document.getElementById('color-preview');
    const colorPickerBtn = document.getElementById('color-picker-btn');
    const colorPicker = document.getElementById('color-picker');
    const colorOptions = document.querySelectorAll('.color-option');
    const colorResetBtn = document.getElementById('color-reset-btn');

    if (!colorInput || !colorPreview || !colorPickerBtn) {
        setTimeout(initializeEnhancedColorPicker, 500);
        return;
    }

    // فتح Color Picker عند النقر على الزر
    colorPickerBtn.addEventListener('click', function() {
        colorPicker.click();
    });

    // عند تغيير اللون من Color Picker
    colorPicker.addEventListener('input', function() {
        const selectedColor = this.value;
        const colorName = getColorNameFromHex(selectedColor);
        updateColorSelection(selectedColor, colorName);
    });

    // اختيار الألوان السريعة
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            const name = this.getAttribute('data-name');
            
            // إزالة النشاط من جميع الألوان
            colorOptions.forEach(opt => opt.classList.remove('active'));
            // إضافة النشاط للون المحدد
            this.classList.add('active');
            
            updateColorSelection(color, name);
        });
    });

    // إعادة تعيين اللون
    if (colorResetBtn) {
        colorResetBtn.addEventListener('click', function() {
            resetColorSelection();
        });
    }

    // تحديث معاينة اللون
    function updateColorSelection(color, name) {
        colorInput.value = name;
        colorPreview.style.backgroundColor = color;
        colorPreview.classList.add('has-color');
        colorPreview.setAttribute('title', name);
        
        // حفظ قيمة اللون في حقل مخفي
        colorInput.setAttribute('data-hex-color', color);
        
        // تحديث الـ aria-label للوصولية
        colorInput.setAttribute('aria-label', `اللون المختار: ${name}`);
    }

    // إعادة تعيين اللون
    function resetColorSelection() {
        colorInput.value = '';
        colorPreview.style.backgroundColor = '';
        colorPreview.classList.remove('has-color');
        colorPreview.removeAttribute('title');
        colorInput.removeAttribute('data-hex-color');
        
        // إزالة النشاط من جميع الألوان
        colorOptions.forEach(opt => opt.classList.remove('active'));
        
        showMessage('تم إعادة تعيين اللون', 'info');
    }

    // بدء باختيار لون افتراضي
    updateColorSelection('#000000', 'أسود');
    const blackOption = document.querySelector('.color-option[data-color="#000000"]');
    if (blackOption) blackOption.classList.add('active');
}

// تحسينات عداد الوصف
function initializeDescriptionCounter() {
    const descriptionTextarea = document.getElementById('product-description');
    const descriptionCounter = document.getElementById('description-counter');
    
    if (!descriptionTextarea || !descriptionCounter) return;
    
    descriptionTextarea.addEventListener('input', function() {
        const length = this.value.length;
        descriptionCounter.textContent = length;
        
        // تحديث التنسيق بناءً على الطول
        if (length > 450) {
            descriptionCounter.classList.add('warning');
            descriptionCounter.classList.remove('error');
        } else if (length > 500) {
            descriptionCounter.classList.add('error');
            descriptionCounter.classList.remove('warning');
        } else {
            descriptionCounter.classList.remove('warning', 'error');
        }
        
        // منع الكتابة بعد الحد الأقصى
        if (length > 500) {
            this.value = this.value.substring(0, 500);
            descriptionCounter.textContent = 500;
            showMessage('تم الوصول إلى الحد الأقصى لعدد الأحرف (500)', 'warning');
        }
    });
}

// تحسينات رفع الصور المتعددة
function initializeEnhancedImageUpload() {
    const imageInput = document.getElementById('product-images');
    const imageUploadBox = document.getElementById('image-upload-box');
    const imagesPreviewContainer = document.getElementById('images-preview-container');
    const uploadCount = document.getElementById('upload-count');
    const uploadProgress = document.getElementById('progress-bar');

    if (!imageInput || !imageUploadBox) return;

    // محاكاة تقدم الرفع
    function simulateUploadProgress() {
        if (!uploadProgress) return;
        
        let progress = 0;
        // ✅ استخدام arrow function في setInterval
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    uploadProgress.style.width = '0%';
                }, 1000);
            }
            uploadProgress.style.width = progress + '%';
        }, 200);
    }

    // فتح نافذة اختيار الملف عند النقر على منطقة الرفع
    imageUploadBox.addEventListener('click', () => {
        imageInput.click();
    });

    // معالجة اختيار الملفات
    imageInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            const files = Array.from(this.files);
            
            // التحقق من عدد الملفات
            if (files.length > 5) {
                showMessage('يمكنك رفع 5 صور كحد أقصى!', 'error');
                this.value = '';
                return;
            }
            
            // التحقق من أنواع الملفات
            const invalidFiles = files.filter(file => 
                !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
            );
            
            if (invalidFiles.length > 0) {
                showMessage('يجب أن تكون الصور بصيغة JPG أو PNG أو WebP فقط!', 'error');
                this.value = '';
                return;
            }
            
            imagesPreviewContainer.innerHTML = '';
            
            files.forEach((file, index) => {
                if (index >= 5) return;
                
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'image-preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="معاينة الصورة ${index + 1}">
                        <button type="button" class="remove-image-btn" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    imagesPreviewContainer.appendChild(previewItem);
                    
                    // إضافة حدث إزالة الصورة
                    const removeBtn = previewItem.querySelector('.remove-image-btn');
                    removeBtn.addEventListener('click', function() {
                        removeImageFromPreview(index);
                    });
                }
                
                reader.readAsDataURL(file);
            });
            
            updateUploadStatus();
            simulateUploadProgress();
        }
    });

    // دعم السحب والإفلات المحسن
    imageUploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'rgb(194, 69, 216)';
        this.style.backgroundColor = 'rgba(194, 69, 216, 0.1)';
        this.classList.add('drag-over');
    });

    imageUploadBox.addEventListener('dragleave', function() {
        this.style.borderColor = '#ddd';
        this.style.backgroundColor = '#fafafa';
        this.classList.remove('drag-over');
    });

    imageUploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#ddd';
        this.style.backgroundColor = '#fafafa';
        this.classList.remove('drag-over');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            imageInput.files = e.dataTransfer.files;
            const event = new Event('change');
            imageInput.dispatchEvent(event);
        }
    });

    // تحديث الحالة الأولية
    updateUploadStatus();
}

// إزالة صورة من المعاينة
function removeImageFromPreview(index) {
    const imageInput = document.getElementById('product-images');
    const imageUploadBox = document.getElementById('image-upload-box');
    const files = Array.from(imageInput.files);
    
    // حذف الصورة من المصفوفة
    files.splice(index, 1);
    
    // تحديث ملفات الـ input
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    imageInput.files = dt.files;
    
    // إذا لم يبقى أي صور، إعادة تعيين الحالة
    if (files.length === 0) {
        // إعادة تعيين الـ input
        imageInput.value = '';
        
        // إعادة تعيين المعاينة
        const imagesPreviewContainer = document.getElementById('images-preview-container');
        if (imagesPreviewContainer) {
            imagesPreviewContainer.innerHTML = '';
        }
        
        // إعادة تعيين حالة الرفع
        if (imageUploadBox) {
            imageUploadBox.classList.remove('has-images');
        }
        
        // تحديث العداد
        updateUploadStatus();
        
        showMessage('تم حذف جميع الصور', 'success');
    } else {
        // إعادة تحميل المعاينة إذا بقي صور
        const event = new Event('change');
        imageInput.dispatchEvent(event);
        
        showMessage('تم حذف الصورة', 'success');
    }
}

// تحديث حالة الرفع
function updateUploadStatus() {
    const imageInput = document.getElementById('product-images');
    const uploadCount = document.getElementById('upload-count');
    const imageUploadBox = document.getElementById('image-upload-box');
    
    const files = imageInput.files;
    const count = files ? files.length : 0;
    
    if (uploadCount) {
        uploadCount.textContent = `${count}/5 صور مختارة`;
        
        if (count >= 5) {
            uploadCount.classList.add('warning');
        } else {
            uploadCount.classList.remove('warning');
        }
    }
    
    // تحديث حالة منطقة الرفع
    if (imageUploadBox) {
        if (count > 0) {
            imageUploadBox.classList.add('has-images');
        } else {
            imageUploadBox.classList.remove('has-images');
        }
    }
}

// تهيئة المكونات عند تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeEnhancedColorPicker();
    initializeDescriptionCounter();
    initializeEnhancedImageUpload();
});

// جعل الدوال متاحة عالمياً بشكل آمن
if (typeof window !== 'undefined') {
    window.sajaStore = {
        currentUser,
        products,
        cart,
        promoteToAdmin: promoteToAdmin,
        loadUsers: loadUsers,
        promoteUser: promoteUser
    };
}

// ✅ التفعيل الآمن للتبويبات
document.addEventListener('DOMContentLoaded', function() {
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
});

// نظام بحث وفلترة محسن
function initializeEnhancedSearch() {
    
    // تحسين مستمعي الأحداث
    setupEnhancedSearchListeners();
    
    // تهيئة البحث الفوري
    initializeRealTimeSearch();
    
    // تهيئة جميع مكونات الفلترة
    setTimeout(() => {
        setupAdvancedFilters();
        initializePriceSlider();
        initializeClothingTypeFilter();
    }, 100);
}

// إعداد الفلترة المتقدمة
// إعداد الفلترة المتقدمة
function setupAdvancedFilters() {
    const toggleBtn = document.getElementById('toggle-filters');
    const advancedFilters = document.getElementById('advanced-filters');
    
    if (toggleBtn && advancedFilters) {
        toggleBtn.addEventListener('click', function() {
            const advancedContent = document.getElementById('advanced-filters-content');
            const filterTags = document.getElementById('filter-tags');
            
            if (advancedContent.style.display === 'none') {
                // إظهار الفلاتر
                advancedContent.style.display = 'block'; // تغيير من grid إلى block
                filterTags.style.display = 'flex';
                this.innerHTML = '<i class="fas fa-eye-slash"></i> إخفاء الفلاتر';
                advancedFilters.style.borderBottomLeftRadius = '12px'; // استعادة الزوايا
                advancedFilters.style.borderBottomRightRadius = '12px';
            } else {
                // إخفاء الفلاتر
                advancedContent.style.display = 'none';
                filterTags.style.display = 'none';
                this.innerHTML = '<i class="fas fa-eye"></i> إظهار الفلاتر';
                advancedFilters.style.borderBottomLeftRadius = '0'; // جعل الزوايا مربعة عند الإخفاء
                advancedFilters.style.borderBottomRightRadius = '0';
            }
        });
    }
    
    // إضافة مستمعي الأحداث للفلاتر الجديدة
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const productTypeFilter = document.getElementById('product-type-filter');
    const availabilityFilter = document.getElementById('availability-filter');
    const sortBySelect = document.getElementById('sort-by');
    
    if (minPriceInput) minPriceInput.addEventListener('input', debounce(enhancedFilterProducts, 300));
    if (maxPriceInput) maxPriceInput.addEventListener('input', debounce(enhancedFilterProducts, 300));
    if (availabilityFilter) availabilityFilter.addEventListener('change', enhancedFilterProducts);
    if (sortBySelect) sortBySelect.addEventListener('change', enhancedFilterProducts);
}

// تحسين مستمعي الأحداث للبحث
function setupEnhancedSearchListeners() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(enhancedFilterProducts, 500));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                enhancedFilterProducts();
            }
        });
    }
    
    // الفلاتر الحالية
    const categoryFilter = document.getElementById('category-filter');
    const sizeFilter = document.getElementById('size-filter');
    const colorFilter = document.getElementById('color-filter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', enhancedFilterProducts);
    if (sizeFilter) sizeFilter.addEventListener('change', enhancedFilterProducts);
    if (colorFilter) colorFilter.addEventListener('change', enhancedFilterProducts);
}

// تهيئة البحث الفوري
function initializeRealTimeSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length >= 2 || this.value.length === 0) {
                    enhancedFilterProducts();
                }
            }, 300);
        });
    }
}

// دالة الفلترة المحسنة
function enhancedFilterProducts() {
    const searchTerm = document.querySelector('.search-box input')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    const size = document.getElementById('size-filter')?.value || '';
    const color = document.getElementById('color-filter')?.value || '';
    const minPrice = parseFloat(document.getElementById('min-price')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price')?.value) || 100000;
    const availability = document.getElementById('availability-filter')?.value || '';
    const sortBy = document.getElementById('sort-by')?.value || 'newest';
    
    // الحصول على أنواع الملابس المختارة
    const selectedTypes = getSelectedClothingTypes();
    
    let filtered = [...products];
    
    // البحث في النص
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.product_type && product.product_type.toLowerCase().includes(searchTerm))
        );
    }
    
    // الفلترة حسب الفئة
    if (category) {
        filtered = filtered.filter(product => product.category === category);
    }
    
    // الفلترة حسب المقاس
    if (size) {
        filtered = filtered.filter(product => product.size === size);
    }
    
    // الفلترة حسب اللون
    if (color) {
        filtered = filtered.filter(product => product.color === color);
    }
    
    // الفلترة حسب نطاق السعر
    filtered = filtered.filter(product => {
        const price = product.price || 0;
        return price >= minPrice && price <= maxPrice;
    });
    
    // الفلترة حسب نوع الملابس
    if (selectedTypes.length > 0) {
        filtered = filtered.filter(product => 
            product.product_type && selectedTypes.includes(product.product_type)
        );
    }
    
    // الفلترة حسب التوفر
    if (availability === 'available') {
        filtered = filtered.filter(product => product.quantity > 0);
    } else if (availability === 'out-of-stock') {
        filtered = filtered.filter(product => product.quantity === 0);
    }
    
    // الترتيب
    filtered = sortProducts(filtered, sortBy);
    
    // تحديث واجهة المستخدم
    renderEnhancedSearchResults(filtered, searchTerm);
    updateFilterTags();
}


// ترتيب المنتجات
function sortProducts(products, sortBy) {
    switch (sortBy) {
        case 'newest':
            return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'oldest':
            return products.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'price-low':
            return products.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-high':
            return products.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'name':
            return products.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        case 'popular':
            // يمكنك إضافة منطق الشعبية بناءً على المبيعات أو المشاهدات
            return products.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        default:
            return products;
    }
}

// عرض نتائج البحث المحسنة
function renderEnhancedSearchResults(filteredProducts, searchTerm) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    // إضافة header للنتائج
    let resultsHeader = productsContainer.previousElementSibling;
    if (!resultsHeader || !resultsHeader.classList.contains('search-results-header')) {
        resultsHeader = document.createElement('div');
        resultsHeader.className = 'search-results-header';
        productsContainer.parentNode.insertBefore(resultsHeader, productsContainer);
    }
    
    const resultsCount = filteredProducts.length;
    const totalProducts = products.length;
    
    resultsHeader.innerHTML = `
        <div class="results-count">
            ${searchTerm ? `نتائج البحث عن "${searchTerm}" - ` : ''}
            عرض ${resultsCount} من أصل ${totalProducts} منتج
        </div>
        <div class="sort-options">
            <label for="results-sort">ترتيب حسب:</label>
            <select id="results-sort">
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="price-low">السعر: من الأقل للأعلى</option>
                <option value="price-high">السعر: من الأعلى للأقل</option>
                <option value="name">الاسم: أ-ي</option>
            </select>
        </div>
    `;
    
    // تحديث مستمع حدث الترتيب
    const resultsSort = document.getElementById('results-sort');
    if (resultsSort) {
        resultsSort.value = document.getElementById('sort-by')?.value || 'newest';
        resultsSort.addEventListener('change', function() {
            document.getElementById('sort-by').value = this.value;
            enhancedFilterProducts();
        });
    }
    
    // عرض المنتجات أو رسالة عدم العثور على نتائج
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لم نعثر على منتجات تطابق بحثك</h3>
                <p>جرب تعديل كلمات البحث أو الفلاتر للحصول على نتائج أفضل</p>
                <button class="submit-btn" onclick="clearAllFilters()">
                    <i class="fas fa-times"></i> مسح كل الفلاتر
                </button>
            </div>
        `;
    } else {
        renderProducts(filteredProducts);
    }
}

// تحديث وسوم الفلاتر النشطة
function updateFilterTags() {
    const filterTags = document.getElementById('filter-tags');
    if (!filterTags) return;
    
    const activeFilters = getActiveFilters();
    filterTags.innerHTML = '';
    
    activeFilters.forEach(filter => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
            ${filter.label}: ${filter.value}
            <button type="button" onclick="removeFilter('${filter.type}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        filterTags.appendChild(tag);
    });
}

// الحصول على الفلاتر النشطة
function getActiveFilters() {
    const activeFilters = [];
    const searchTerm = document.querySelector('.search-box input')?.value;
    const category = document.getElementById('category-filter')?.value;
    const size = document.getElementById('size-filter')?.value;
    const color = document.getElementById('color-filter')?.value;
    const minPrice = document.getElementById('min-price')?.value;
    const maxPrice = document.getElementById('max-price')?.value;
    const availability = document.getElementById('availability-filter')?.value;
    const selectedTypes = getSelectedClothingTypes();
    
    if (searchTerm) activeFilters.push({ type: 'search', label: 'بحث', value: searchTerm });
    if (category) activeFilters.push({ type: 'category', label: 'الفئة', value: category });
    if (size) activeFilters.push({ type: 'size', label: 'المقاس', value: size });
    if (color) activeFilters.push({ type: 'color', label: 'اللون', value: color });
    if (minPrice && minPrice > 0) activeFilters.push({ type: 'minPrice', label: 'أقل سعر', value: formatPrice(minPrice) + ' ريال' });
    if (maxPrice && maxPrice < 100000) activeFilters.push({ type: 'maxPrice', label: 'أعلى سعر', value: formatPrice(maxPrice) + ' ريال' });
    if (availability) activeFilters.push({ type: 'availability', label: 'الحالة', value: availability === 'available' ? 'متوفر' : 'غير متوفر' });
    
    // إضافة أنواع الملابس المختارة
    selectedTypes.forEach(type => {
        activeFilters.push({ type: 'clothingType', label: 'النوع', value: type });
    });
    
    return activeFilters;
}

// إزالة فلتر معين
function removeFilter(filterType) {
    switch (filterType) {
        case 'search':
            document.querySelector('.search-box input').value = '';
            break;
        case 'category':
            document.getElementById('category-filter').value = '';
            break;
        case 'size':
            document.getElementById('size-filter').value = '';
            break;
        case 'color':
            document.getElementById('color-filter').value = '';
            break;
        case 'minPrice':
            document.getElementById('min-price').value = '';
            break;
        case 'maxPrice':
            document.getElementById('max-price').value = '100000';
            document.getElementById('price-range').value = '100000';
            document.getElementById('max-price-value').textContent = '100,000 ريال';
            break;
        case 'availability':
            document.getElementById('availability-filter').value = '';
            break;
        case 'clothingType':
            // إلغاء تحديد جميع أنواع الملابس
            const typeCheckboxes = document.querySelectorAll('.clothing-type-filter input[type="checkbox"]');
            typeCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.closest('.type-option').classList.remove('active');
            });
            break;
    }
    enhancedFilterProducts();
}


// مسح كل الفلاتر
function clearAllFilters() {
    document.querySelector('.search-box input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('size-filter').value = '';
    document.getElementById('color-filter').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '100000';
    document.getElementById('price-range').value = '100000';
    document.getElementById('max-price-value').textContent = '100,000 ريال';
    document.getElementById('availability-filter').value = '';
    document.getElementById('sort-by').value = 'newest';
    
    // إلغاء تحديد أنواع الملابس
    const typeCheckboxes = document.querySelectorAll('.clothing-type-filter input[type="checkbox"]');
    typeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('.type-option').classList.remove('active');
    });
    
    enhancedFilterProducts();
}
// دالة مساعدة لتنسيق السعر
function formatPrice(price) {
    return new Intl.NumberFormat('ar-YE').format(price);
}

// دالة debounce لتحسين الأداء
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// تهيئة سلايدر السعر
function initializePriceSlider() {
    const priceRange = document.getElementById('price-range');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const minPriceValue = document.getElementById('min-price-value');
    const maxPriceValue = document.getElementById('max-price-value');

    if (!priceRange || !minPriceInput || !maxPriceInput) return;

    // تحديث القيم عند تغيير السلايدر
    priceRange.addEventListener('input', function() {
        const maxPrice = parseInt(this.value);
        maxPriceInput.value = maxPrice;
        maxPriceValue.textContent = formatPrice(maxPrice) + ' ريال';
        enhancedFilterProducts();
    });

    // تحديث السلايدر عند تغيير المدخلات
    minPriceInput.addEventListener('input', function() {
        const minPrice = parseInt(this.value) || 0;
        minPriceValue.textContent = formatPrice(minPrice) + ' ريال';
        enhancedFilterProducts();
    });

    maxPriceInput.addEventListener('input', function() {
        const maxPrice = parseInt(this.value) || 100000;
        priceRange.value = maxPrice;
        maxPriceValue.textContent = formatPrice(maxPrice) + ' ريال';
        enhancedFilterProducts();
    });

    // تعيين القيم الافتراضية
    const maxPrice = parseInt(priceRange.value);
    maxPriceValue.textContent = formatPrice(maxPrice) + ' ريال';
    minPriceValue.textContent = '0 ريال';
}
// تهيئة فلترة نوع الملابس
function initializeClothingTypeFilter() {
    const typeOptions = document.querySelectorAll('.clothing-type-filter input[type="checkbox"]');
    
    typeOptions.forEach(option => {
        option.addEventListener('change', function() {
            // إضافة/إزالة class active للعنصر الأب
            const parentLabel = this.closest('.type-option');
            if (this.checked) {
                parentLabel.classList.add('active');
            } else {
                parentLabel.classList.remove('active');
            }
            enhancedFilterProducts();
        });
    });
}

// الحصول على أنواع الملابس المختارة
function getSelectedClothingTypes() {
    const selectedTypes = [];
    const typeCheckboxes = document.querySelectorAll('.clothing-type-filter input[type="checkbox"]:checked');
    
    typeCheckboxes.forEach(checkbox => {
        selectedTypes.push(checkbox.value);
    });
    
    return selectedTypes;
}

// دوال جديدة لإدارة القائمة الجوال
function toggleMobileMenu() {
    if (nav) nav.classList.toggle('active');
    if (mobileOverlay) mobileOverlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
}

function closeMobileMenu() {
    if (nav) nav.classList.remove('active');
    if (mobileOverlay) mobileOverlay.classList.remove('active');
    document.body.classList.remove('menu-open');
}
// إغلاق القائمة عند النقر على رابط
document.addEventListener('click', function(e) {
    if ((e.target.matches('nav a') && window.innerWidth <= 768)||(e.target.matches('nav i') && window.innerWidth <= 768)) {
        closeMobileMenu();
    }
});