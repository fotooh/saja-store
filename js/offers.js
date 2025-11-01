import { supabase } from "./supabase.js";

// حالة السلايدر
let sliderState = {
    currentSlide: 0,
    totalSlides: 0,
    slideInterval: null
};

// حالة إدارة العروض
let currentEditingOfferId = null;
let offerImageInput, offerImageUploadBox, offerImagePreview, removeOfferImageBtn;

// تهيئة السلايدر
function initSlider(reset = false) {
    const sliderTrack = document.getElementById('slider-track');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const sliderDots = document.getElementById('slider-dots');
    
    if (!sliderTrack || !slides.length) {
        // إعادة المحاولة إذا لم يكن جاهزاً
        requestAnimationFrame(() => initSlider(reset));
        return;
    }
    
    // إعادة التعيين إذا طُلب
    if (reset) {
        sliderState = {
            currentSlide: 0,
            totalSlides: slides.length,
            slideInterval: null
        };
    } else {
        sliderState.totalSlides = slides.length;
    }
    
    const { currentSlide, totalSlides } = sliderState;
    
    // إنشاء نقاط التنقل
    createSliderDots(sliderDots, totalSlides);
    
    const dots = document.querySelectorAll('.slider-dot');
    
    function updateSlider() {
        sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // تحديث النقاط النشطة
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        sliderState.currentSlide = currentSlide;
    }
    
    function nextSlide() {
        sliderState.currentSlide = (sliderState.currentSlide + 1) % totalSlides;
        updateSlider();
    }
    
    function prevSlide() {
        sliderState.currentSlide = (sliderState.currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    }
    
    function goToSlide(slideIndex) {
        sliderState.currentSlide = slideIndex;
        updateSlider();
    }
    
    // إعداد أزرار التنقل
    setupSliderNavigation(prevBtn, nextBtn, prevSlide, nextSlide);
    
    // إعداد التشغيل التلقائي
    setupAutoPlay(sliderTrack, nextSlide);
    
    // إعداد السحب على الأجهزة المحمولة
    setupTouchSwipe(sliderTrack, prevSlide, nextSlide);
    
    // التهيئة الأولية
    updateSlider();
}

// إنشاء نقاط السلايدر
function createSliderDots(sliderDots, totalSlides) {
    if (!sliderDots) return;
    
    sliderDots.innerHTML = '';
    
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (i === sliderState.currentSlide) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        sliderDots.appendChild(dot);
    }
}

// إعداد تنقل السلايدر
function setupSliderNavigation(prevBtn, nextBtn, prevSlide, nextSlide) {
    if (nextBtn) {
        nextBtn.onclick = nextSlide;
    }
    
    if (prevBtn) {
        prevBtn.onclick = prevSlide;
    }
}

// إعداد التشغيل التلقائي
function setupAutoPlay(sliderTrack, nextSlide) {
    // إيقاف التشغيل التلقائي القديم
    if (sliderState.slideInterval) {
        clearInterval(sliderState.slideInterval);
    }
    
    // ✅ استخدام arrow function بدلاً من string
    sliderState.slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
    
    // إيقاف التشغيل التلقائي عند التمرير
    if (sliderTrack) {
        sliderTrack.addEventListener('mouseenter', () => {
            clearInterval(sliderState.slideInterval);
        });
        
        sliderTrack.addEventListener('mouseleave', () => {
            clearInterval(sliderState.slideInterval);
            // ✅ استخدام arrow function
            sliderState.slideInterval = setInterval(() => {
                nextSlide();
            }, 5000);
        });
    }
}

// إعداد السحب على الأجهزة المحمولة
function setupTouchSwipe(sliderTrack, prevSlide, nextSlide) {
    if (!sliderTrack) return;
    
    let startX = 0;
    let endX = 0;
    
    sliderTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    sliderTrack.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe(startX, endX, prevSlide, nextSlide);
    });
    
    function handleSwipe(startX, endX, prevSlide, nextSlide) {
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }
}

// تهيئة إدارة العروض
function initializeOfferManagement() {
    console.log('🔧 تهيئة إدارة العروض...');
    
    initializeOfferElements();
    loadOffers();
}

// تهيئة عناصر العروض
function initializeOfferElements() {
    offerImageInput = document.getElementById('offer-image');
    offerImageUploadBox = document.getElementById('offer-image-upload-box');
    offerImagePreview = document.getElementById('offer-image-preview');
    removeOfferImageBtn = document.getElementById('remove-offer-image');
    
    // إعادة المحاولة إذا لم تكن العناصر جاهزة
    if (!offerImageInput || !offerImageUploadBox) {
        setTimeout(initializeOfferElements, 500);
        return;
    }
    
    // إعداد مستمعي الأحداث للصور
    setupOfferImageEvents();
    
    // إعداد أزرار العروض
    setupOfferButtons();
    
    console.log('✅ تم تهيئة عناصر إدارة العروض بنجاح');
}

// إعداد مستمعي الأحداث للصور
function setupOfferImageEvents() {
    if (offerImageUploadBox) {
        offerImageUploadBox.addEventListener('click', () => {
            if (offerImageInput) offerImageInput.click();
        });
    }
    
    if (offerImageInput) {
        offerImageInput.addEventListener('change', handleOfferImageChange);
    }
    
    if (removeOfferImageBtn) {
        removeOfferImageBtn.addEventListener('click', handleRemoveOfferImage);
    }
}

// معالجة تغيير صورة العرض
function handleOfferImageChange() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (offerImagePreview) {
                offerImagePreview.src = e.target.result;
                offerImagePreview.style.display = 'block';
            }
            if (offerImageUploadBox) {
                offerImageUploadBox.classList.add('has-image');
            }
            if (removeOfferImageBtn) {
                removeOfferImageBtn.style.display = 'inline-block';
            }
        }
        reader.readAsDataURL(this.files[0]);
    }
}

// معالجة إزالة صورة العرض
function handleRemoveOfferImage() {
    if (offerImageInput) offerImageInput.value = '';
    if (offerImagePreview) offerImagePreview.style.display = 'none';
    if (offerImageUploadBox) offerImageUploadBox.classList.remove('has-image');
    if (removeOfferImageBtn) removeOfferImageBtn.style.display = 'none';
}

// إعداد أزرار العروض
function setupOfferButtons() {
    const addOfferBtn = document.getElementById('add-offer-btn');
    const cancelOfferBtn = document.getElementById('cancel-offer-btn');
    const offerForm = document.getElementById('offer-form');
    
    if (addOfferBtn) {
        addOfferBtn.addEventListener('click', showOfferForm);
    }
    
    if (cancelOfferBtn) {
        cancelOfferBtn.addEventListener('click', hideOfferForm);
    }
    
    if (offerForm) {
        offerForm.addEventListener('submit', handleOfferFormSubmit);
    }
}

// إظهار نموذج العرض
function showOfferForm() {
    console.log('➕ فتح نموذج إضافة عرض جديد');
    
    currentEditingOfferId = null;
    const offerFormContainer = document.getElementById('offer-form-container');
    const offerForm = document.getElementById('offer-form');
    
    // إعادة تعيين النموذج
    if (offerForm) offerForm.reset();
    
    // إعادة تعيين معاينة الصورة
    resetOfferImagePreview();
    
    // إظهار النموذج
    if (offerFormContainer) {
        offerFormContainer.style.display = 'block';
        offerFormContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// إعادة تعيين معاينة صورة العرض
function resetOfferImagePreview() {
    if (offerImagePreview) {
        offerImagePreview.style.display = 'none';
        offerImagePreview.src = '#';
    }
    if (offerImageUploadBox) {
        offerImageUploadBox.classList.remove('has-image');
    }
    if (removeOfferImageBtn) {
        removeOfferImageBtn.style.display = 'none';
    }
}

// إخفاء نموذج العرض
function hideOfferForm() {
    const offerFormContainer = document.getElementById('offer-form-container');
    if (offerFormContainer) {
        offerFormContainer.style.display = 'none';
    }
}

// التحقق من صحة بيانات العرض
function validateOfferData(offerData) {
    const errors = [];
    
    if (!offerData.title?.trim()) {
        errors.push('عنوان العرض مطلوب');
    }
    
    if (!offerData.description?.trim()) {
        errors.push('وصف العرض مطلوب');
    }
    
    if (!offerData.button_text?.trim()) {
        errors.push('نص زر العرض مطلوب');
    }
    
    return errors;
}

// معالجة تقديم نموذج العرض
async function handleOfferFormSubmit(e) {
    e.preventDefault();
    
    console.log('💾 جاري حفظ العرض...');
    
    const saveOfferBtn = document.getElementById('save-offer-btn');
    const originalText = saveOfferBtn?.innerHTML || '';
    
    try {
        // تعطيل الزر أثناء الحفظ
        if (saveOfferBtn) {
            saveOfferBtn.disabled = true;
            saveOfferBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        }
        
        // جمع بيانات العرض
        const offerData = collectOfferFormData();
        
        // التحقق من الصحة
        const validationErrors = validateOfferData(offerData);
        if (validationErrors.length > 0) {
            alert('❌ يرجى تصحيح الأخطاء التالية:\n' + validationErrors.join('\n'));
            return;
        }

        // رفع الصورة إذا كانت موجودة
        const imageFile = offerImageInput?.files[0];
        if (imageFile) {
            console.log('🖼️ جاري رفع الصورة...');
            offerData.image_url = await uploadOfferImage(imageFile);
        }

        // حفظ أو تحديث العرض
        if (currentEditingOfferId) {
            await updateOffer(currentEditingOfferId, offerData);
        } else {
            await addOffer(offerData);
        }
        
        // التنظيف بعد الحفظ
        hideOfferForm();
        await loadOffers();
        
        console.log('✅ تم حفظ العرض بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في حفظ العرض:', error);
        alert('❌ حدث خطأ في حفظ العرض: ' + error.message);
    } finally {
        // إعادة تمكين الزر
        if (saveOfferBtn) {
            saveOfferBtn.disabled = false;
            saveOfferBtn.innerHTML = originalText;
        }
    }
}

// جمع بيانات النموذج
function collectOfferFormData() {
    return {
        title: document.getElementById('offer-title').value,
        description: document.getElementById('offer-description').value,
        button_text: document.getElementById('offer-button-text').value,
        link: document.getElementById('offer-link').value
    };
}

// تحميل العروض
async function loadOffers() {
    try {
        console.log('🔄 جاري تحميل العروض...');
        
        const { data: offers, error } = await supabase
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('✅ العروض المحملة:', offers);
        
        displayOffers(offers || []);
        displayOffersSlider(offers || []);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل العروض:', error);
        handleOffersLoadError();
    }
}

// معالجة خطأ تحميل العروض
function handleOffersLoadError() {
    const offersGrid = document.getElementById('offers-grid');
    if (offersGrid) {
        offersGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>حدث خطأ في تحميل العروض</p>
                <button class="retry-btn" id="retry-offers-btn">إعادة المحاولة</button>
            </div>
        `;

        // ✅ ربط الحدث بعد إضافة الزر
        const retryBtn = document.getElementById('retry-offers-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadOffers);
        }
    }
    
    displayOffersSlider([]);
}

// عرض العروض في لوحة التحكم
function displayOffers(offers) {
    const offersGrid = document.getElementById('offers-grid');
    if (!offersGrid) return;
    
    console.log('📊 عرض العروض في لوحة التحكم:', offers);

    if (!offers || offers.length === 0) {
        offersGrid.innerHTML = getNoOffersHTML();
        // ✅ ربط الحدث بعد إضافة الزر
        bindNoOffersButton();
        return;
    }

    offersGrid.innerHTML = offers.map(offer => getOfferCardHTML(offer)).join('');
    
    // ✅ لا حاجة لربط الأحداث منفصلة لأننا نستخدم event delegation
}

// HTML عندما لا توجد عروض
function getNoOffersHTML() {
    return `
        <div class="no-offers">
            <i class="fas fa-images" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
            <p>لا توجد عروض حالياً</p>
            <button class="submit-btn" id="add-first-offer-btn">
                <i class="fas fa-plus-circle"></i> إضافة أول عرض
            </button>
        </div>
    `;
}

// ربط حدث الزر "إضافة أول عرض"
function bindNoOffersButton() {
    const addFirstOfferBtn = document.getElementById('add-first-offer-btn');
    if (addFirstOfferBtn) {
        addFirstOfferBtn.addEventListener('click', showOfferForm);
    }
}

// HTML لبطاقة العرض
function getOfferCardHTML(offer) {
    return `
        <div class="offer-card">
            <div class="offer-image-container">
                <img src="${offer.image_url}" alt="${offer.title}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="offer-card-content">
                <h4 class="offer-card-title">${offer.title}</h4>
                <p class="offer-card-description">${offer.description}</p>
                <div class="offer-meta">
                    <span class="offer-button-text">زر: ${offer.button_text || 'تسوق الآن'}</span>
                    <span class="offer-link">رابط: ${offer.link || '#products'}</span>
                </div>
                <div class="offer-card-actions">
                    <button class="action-btn edit-btn" data-id="${offer.id}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="action-btn delete-btn" data-id="${offer.id}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    `;
}

// عرض العروض في السلايدر
function displayOffersSlider(offers) {
    const sliderTrack = document.getElementById('slider-track');
    if (!sliderTrack) return;
    
    console.log('🎠 عرض العروض في السلايدر:', offers);
    
    if (!offers || offers.length === 0) {
        sliderTrack.innerHTML = getDefaultSlideHTML();
    } else {
        sliderTrack.innerHTML = offers.map(offer => getOfferSlideHTML(offer)).join('');
    }
    
    // ✅ استخدام requestAnimationFrame بدلاً من setTimeout مع string
    requestAnimationFrame(() => {
        initSlider(true);
    });
}

// HTML للسلايدر الافتراضي
function getDefaultSlideHTML() {
    return `
        <div class="slide">
            <div class="default-slide" style="background: linear-gradient(135deg, #c245d8, #a8329b); height: 400px; display: flex; align-items: center; justify-content: center; color: white; text-align: center;">
                <div class="slide-content">
                    <h3>مرحباً بكم في سجى ستور</h3>
                    <p>اكتشف أحدث العروض والتصاميم الحصرية</p>
                    <a href="#products" class="slide-btn">تسوق الآن</a>
                </div>
            </div>
        </div>
    `;
}

// HTML لشريحة العرض
function getOfferSlideHTML(offer) {
    return `
        <div class="slide">
            <div class="slide-background">
                <img src="${offer.image_url}" alt="${offer.title}" 
                     onerror="this.style.display='none'; this.parentNode.classList.add('gradient-bg')">
            </div>
            <div class="slide-content">
                <h3>${offer.title}</h3>
                <p>${offer.description}</p>
                <a href="${offer.link || '#products'}" class="slide-btn">
                    ${offer.button_text || 'تسوق الآن'}
                </a>
            </div>
        </div>
    `;
}

// إضافة عرض جديد
async function addOffer(offerData) {
    try {
        console.log('➕ جاري إضافة عرض جديد:', offerData);
        
        const { data, error } = await supabase
            .from('offers')
            .insert([{
                title: offerData.title,
                description: offerData.description,
                button_text: offerData.button_text,
                link: offerData.link,
                image_url: offerData.image_url
            }])
            .select();

        if (error) throw error;

        console.log('✅ تم إضافة العرض بنجاح:', data);
        alert('✅ تم إضافة العرض بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في إضافة العرض:', error);
        throw error;
    }
}

// تعديل العرض
async function updateOffer(offerId, offerData) {
    try {
        console.log('✏️ جاري تحديث العرض:', offerId, offerData);

        const updateData = {
            title: offerData.title,
            description: offerData.description,
            button_text: offerData.button_text,
            link: offerData.link
        };

        if (offerData.image_url) {
            updateData.image_url = offerData.image_url;
        }

        const { data, error } = await supabase
            .from('offers')
            .update(updateData)
            .eq('id', offerId)
            .select();

        if (error) throw error;

        console.log('✅ تم تحديث العرض بنجاح:', data);
        alert('✅ تم تعديل العرض بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحديث العرض:', error);
        throw error;
    }
}

// رفع صورة العرض
async function uploadOfferImage(imageFile) {
    if (!imageFile) return null;
    
    try {
        console.log('📤 جاري رفع الصورة:', imageFile.name);
        
        const fileName = `offers/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        
        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw new Error('فشل في رفع الصورة: ' + error.message);

        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        console.log('✅ تم رفع الصورة بنجاح:', urlData.publicUrl);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('❌ خطأ في رفع الصورة:', error);
        throw error;
    }
}

// تحرير العرض
async function editOffer(offerId) {
    try {
        console.log('📝 جاري تحميل بيانات العرض للتعديل:', offerId);
        
        const { data: offer, error } = await supabase
            .from('offers')
            .select('*')
            .eq('id', offerId)
            .single();

        if (error) throw error;

        currentEditingOfferId = offerId;
        
        // تعبئة النموذج
        populateOfferForm(offer);
        
        // إظهار النموذج
        showOfferFormContainer();
        
        console.log('✅ تم تحميل بيانات العرض بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات العرض:', error);
        alert('❌ حدث خطأ في تحميل بيانات العرض: ' + error.message);
    }
}

// تعبئة نموذج العرض
function populateOfferForm(offer) {
    document.getElementById('offer-title').value = offer.title || '';
    document.getElementById('offer-description').value = offer.description || '';
    document.getElementById('offer-button-text').value = offer.button_text || 'تسوق الآن';
    document.getElementById('offer-link').value = offer.link || '';
    
    if (offer.image_url && offerImagePreview) {
        offerImagePreview.src = offer.image_url;
        offerImagePreview.style.display = 'block';
        if (offerImageUploadBox) {
            offerImageUploadBox.classList.add('has-image');
        }
        if (removeOfferImageBtn) {
            removeOfferImageBtn.style.display = 'inline-block';
        }
    }
}

// إظهار حاوية نموذج العرض
function showOfferFormContainer() {
    const offerFormContainer = document.getElementById('offer-form-container');
    if (offerFormContainer) {
        offerFormContainer.style.display = 'block';
        offerFormContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// حذف العرض
async function deleteOffer(offerId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
        console.log('🗑️ جاري حذف العرض:', offerId);
        
        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', offerId);

        if (error) throw error;
        
        console.log('✅ تم حذف العرض بنجاح');
        alert('✅ تم حذف العرض بنجاح');
        
        await loadOffers();
        
    } catch (error) {
        console.error('❌ خطأ في حذف العرض:', error);
        alert('❌ حدث خطأ في حذف العرض: ' + error.message);
    }
}

// ✅ إعداد event delegation عالمي للأزرار الديناميكية
function setupGlobalEventDelegation() {
    document.addEventListener('click', function(e) {
        // التعامل مع أزرار التعديل
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const btn = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
            if (btn && btn.dataset.id) {
                e.preventDefault();
                editOffer(btn.dataset.id);
            }
        }
        
        // التعامل مع أزرار الحذف
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            if (btn && btn.dataset.id) {
                e.preventDefault();
                deleteOffer(btn.dataset.id);
            }
        }
    });
}

// ✅ تهيئة آمنة
function safeInitialize() {
    try {
        setupGlobalEventDelegation();
        initializeOfferManagement();
    } catch (error) {
        console.error('خطأ في التهيئة الآمنة:', error);
        // إعادة المحاولة بعد تأخير
        setTimeout(safeInitialize, 1000);
    }
}

// ✅ التهيئة عند تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
    safeInitialize();
});

// ✅ جعل الدوال متاحة عالمياً بشكل آمن
if (typeof window !== 'undefined') {
    window.showOfferForm = showOfferForm;
    window.editOffer = editOffer;
    window.deleteOffer = deleteOffer;
    window.loadOffers = loadOffers;
}