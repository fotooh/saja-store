import { supabase } from "./supabase.js";

// دالة تهيئة السلايدر
function initSlider() {
    const sliderTrack = document.getElementById('slider-track');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const sliderDots = document.getElementById('slider-dots');
    
    if (!sliderTrack || !slides.length) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // مسح النقاط القديمة
    if (sliderDots) {
        sliderDots.innerHTML = '';
    }
    
    // إنشاء نقاط السلايدر
    slides.forEach((_, index) => {
        if (sliderDots) {
            const dot = document.createElement('button');
            dot.classList.add('slider-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            sliderDots.appendChild(dot);
        }
    });
    
    const dots = document.querySelectorAll('.slider-dot');
    
    function updateSlider() {
        sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // تحديث النقاط النشطة
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    }
    
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateSlider();
    }
    
    // إعادة تعيين event listeners
    if (nextBtn) {
        nextBtn.onclick = nextSlide;
    }
    
    if (prevBtn) {
        prevBtn.onclick = prevSlide;
    }
    
    // التشغيل التلقائي
    let slideInterval = setInterval(nextSlide, 5000);
    
    // إيقاف التشغيل التلقائي عند التمرير
    sliderTrack.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    sliderTrack.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });
    
    // دعم السحب على الأجهزة المحمولة
    let startX = 0;
    let endX = 0;
    
    sliderTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    sliderTrack.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }
    
    // التهيئة الأولية
    updateSlider();
}

// إدارة العروض
let currentEditingOfferId = null;
let offerImageInput, offerImageUploadBox, offerImagePreview, removeOfferImageBtn;

// تهيئة إدارة العروض بعد تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeOfferManagement();
    loadOffers(); // تحميل العروض مباشرة عند التهيئة
});

function initializeOfferManagement() {
    console.log('🔧 تهيئة إدارة العروض...');
    
    // تهيئة العناصر مباشرة
    initializeOfferElements();
    
    // تحميل العروض
    loadOffers();
}

function initializeOfferElements() {
    // الحصول على العناصر
    offerImageInput = document.getElementById('offer-image');
    offerImageUploadBox = document.getElementById('offer-image-upload-box');
    offerImagePreview = document.getElementById('offer-image-preview');
    removeOfferImageBtn = document.getElementById('remove-offer-image');
    
    console.log('📋 عناصر العروض:', {
        offerImageInput: !!offerImageInput,
        offerImageUploadBox: !!offerImageUploadBox,
        offerImagePreview: !!offerImagePreview,
        removeOfferImageBtn: !!removeOfferImageBtn
    });
    
    // إذا لم تكن العناصر موجودة، حاول مرة أخرى بعد تأخير
    if (!offerImageInput || !offerImageUploadBox) {
        console.log('⏳ عناصر العروض غير جاهزة، إعادة المحاولة...');
        setTimeout(initializeOfferElements, 500);
        return;
    }
    
    // إضافة event listeners
    if (offerImageUploadBox) {
        offerImageUploadBox.addEventListener('click', handleOfferImageUploadClick);
    }
    
    if (offerImageInput) {
        offerImageInput.addEventListener('change', handleOfferImageChange);
    }
    
    if (removeOfferImageBtn) {
        removeOfferImageBtn.addEventListener('click', handleRemoveOfferImage);
    }
    
    // تهيئة الأزرار الأخرى
    initializeOfferButtons();
    
    console.log('✅ تم تهيئة عناصر إدارة العروض بنجاح');
}

function initializeOfferButtons() {
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

// معالجة رفع صورة العرض
function handleOfferImageUploadClick() {
    if (offerImageInput) {
        offerImageInput.click();
    }
}

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

function handleRemoveOfferImage() {
    if (offerImageInput) {
        offerImageInput.value = '';
    }
    if (offerImagePreview) {
        offerImagePreview.style.display = 'none';
    }
    if (offerImageUploadBox) {
        offerImageUploadBox.classList.remove('has-image');
    }
    if (removeOfferImageBtn) {
        removeOfferImageBtn.style.display = 'none';
    }
}

// إظهار وإخفاء نموذج العرض
function showOfferForm() {
    console.log('➕ فتح نموذج إضافة عرض جديد');
    
    currentEditingOfferId = null;
    const offerFormContainer = document.getElementById('offer-form-container');
    const offerForm = document.getElementById('offer-form');
    
    // إعادة تعيين النموذج
    if (offerForm) {
        offerForm.reset();
    }
    
    // إعادة تعيين معاينة الصورة
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
    
    // إظهار النموذج
    if (offerFormContainer) {
        offerFormContainer.style.display = 'block';
        // التمرير إلى النموذج
        offerFormContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function hideOfferForm() {
    const offerFormContainer = document.getElementById('offer-form-container');
    if (offerFormContainer) {
        offerFormContainer.style.display = 'none';
    }
}

// التحقق من صحة بيانات العرض
function validateOfferData(offerData) {
    const errors = [];
    
    if (!offerData.title || offerData.title.trim() === '') {
        errors.push('عنوان العرض مطلوب');
    }
    
    if (!offerData.description || offerData.description.trim() === '') {
        errors.push('وصف العرض مطلوب');
    }
    
    if (!offerData.button_text || offerData.button_text.trim() === '') {
        errors.push('نص زر العرض مطلوب');
    }
    
    return errors;
}

// معالجة تقديم نموذج العرض
async function handleOfferFormSubmit(e) {
    e.preventDefault();
    
    console.log('💾 جاري حفظ العرض...');
    
    const saveOfferBtn = document.getElementById('save-offer-btn');
    const originalText = saveOfferBtn ? saveOfferBtn.innerHTML : '';
    
    try {
        if (saveOfferBtn) {
            saveOfferBtn.disabled = true;
            saveOfferBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        }
        
        // جمع البيانات من النموذج مباشرة (بدون FormData)
        const offerData = {
            title: document.getElementById('offer-title').value,
            description: document.getElementById('offer-description').value,
            button_text: document.getElementById('offer-button-text').value,
            link: document.getElementById('offer-link').value
        };
        
        console.log('📦 بيانات العرض:', offerData);

        // التحقق من صحة البيانات
        const validationErrors = validateOfferData(offerData);
        if (validationErrors.length > 0) {
            alert('❌ يرجى تصحيح الأخطاء التالية:\n' + validationErrors.join('\n'));
            return; // ✅ هذا صحيح لأنه داخل دالة
        }

        // رفع الصورة إذا كانت موجودة
        const imageFile = offerImageInput?.files[0];
        if (imageFile) {
            console.log('🖼️ جاري رفع الصورة...');
            offerData.image_url = await uploadOfferImage(imageFile);
        }

        if (currentEditingOfferId) {
            console.log('✏️ جاري تحديث العرض:', currentEditingOfferId);
            await updateOffer(currentEditingOfferId, offerData);
        } else {
            console.log('➕ جاري إضافة عرض جديد');
            await addOffer(offerData);
        }
        
        // إعادة تعيين النموذج وإخفائه
        hideOfferForm();
        
        // إعادة تحميل العروض
        await loadOffers();
        
        console.log('✅ تم حفظ العرض بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في حفظ العرض:', error);
        alert('❌ حدث خطأ في حفظ العرض: ' + error.message);
    } finally {
        if (saveOfferBtn) {
            saveOfferBtn.disabled = false;
            saveOfferBtn.innerHTML = originalText;
        }
    }
}

// تحميل العروض من Supabase
async function loadOffers() {
    try {
        console.log('🔄 جاري تحميل العروض...');
        const { data: offers, error } = await supabase
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ خطأ في Supabase:', error);
            throw error;
        }
        
        console.log('✅ العروض المحملة:', offers);
        
        // عرض العروض في لوحة التحكم
        displayOffers(offers || []);
        
        // عرض العروض في السلايدر الرئيسي
        displayOffersSlider(offers || []);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل العروض:', error);
        
        // عرض رسالة خطأ في واجهة المستخدم
        const offersGrid = document.getElementById('offers-grid');
        if (offersGrid) {
            offersGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>حدث خطأ في تحميل العروض</p>
                    <button onclick="loadOffers()" class="retry-btn">إعادة المحاولة</button>
                </div>
            `;
        }
        
        // عرض سلايدر افتراضي في حالة الخطأ
        displayOffersSlider([]);
    }
}

// عرض العروض في لوحة التحكم
function displayOffers(offers) {
    const offersGrid = document.getElementById('offers-grid');
    if (!offersGrid) {
        console.log('❌ عنصر عرض العروض غير موجود');
        return;
    }
    
    console.log('📊 عرض العروض في لوحة التحكم:', offers);

    if (!offers || offers.length === 0) {
        offersGrid.innerHTML = `
            <div class="no-offers">
                <i class="fas fa-images" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                <p>لا توجد عروض حالياً</p>
                <button class="submit-btn" onclick="showOfferForm()">
                    <i class="fas fa-plus-circle"></i> إضافة أول عرض
                </button>
            </div>
        `;
        return;
    }

    offersGrid.innerHTML = offers.map(offer => `
        <div class="offer-card">
            <div class="offer-image-container">
                <img src="${offer.image_url}" alt="${offer.title}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvuWDj+Wkp+WtpjwvdGV4dD48L3N2Zz4='">
            </div>
            <div class="offer-card-content">
                <h4 class="offer-card-title">${offer.title}</h4>
                <p class="offer-card-description">${offer.description}</p>
                <div class="offer-meta">
                    <span class="offer-button-text">زر: ${offer.button_text || 'تسوق الآن'}</span>
                    <span class="offer-link">رابط: ${offer.link || '#products'}</span>
                </div>
                <div class="offer-card-actions">
                    <button class="action-btn edit-btn" onclick="editOffer('${offer.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteOffer('${offer.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// عرض العروض في السلايدر
function displayOffersSlider(offers) {
    const sliderTrack = document.getElementById('slider-track');
    if (!sliderTrack) {
        console.log('❌ عنصر السلايدر غير موجود');
        return;
    }
    
    console.log('🎠 عرض العروض في السلايدر:', offers);
    
    if (!offers || offers.length === 0) {
        // عرض سلايدر افتراضي إذا لم تكن هناك عروض
        sliderTrack.innerHTML = `
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
        initSlider();
        return;
    }

    // عرض العروض الحقيقية
    sliderTrack.innerHTML = offers.map(offer => `
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
    `).join('');

    // إعادة تهيئة السلايدر
    setTimeout(() => {
        initSlider();
    }, 100);
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

        if (error) {
            console.error('❌ خطأ في إضافة العرض:', error);
            throw error;
        }

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

        // إذا كانت هناك صورة جديدة، أضفها للبيانات
        if (offerData.image_url) {
            updateData.image_url = offerData.image_url;
        }

        const { data, error } = await supabase
            .from('offers')
            .update(updateData)
            .eq('id', offerId)
            .select();

        if (error) {
            console.error('❌ خطأ في تحديث العرض:', error);
            throw error;
        }

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

        if (error) {
            console.error('❌ خطأ في رفع الصورة:', error);
            throw new Error('فشل في رفع الصورة: ' + error.message);
        }

        // الحصول على رابط الصورة
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

// تعديل العرض
async function editOffer(offerId) {
    try {
        console.log('📝 جاري تحميل بيانات العرض للتعديل:', offerId);
        
        const { data: offer, error } = await supabase
            .from('offers')
            .select('*')
            .eq('id', offerId)
            .single();

        if (error) {
            console.error('❌ خطأ في تحميل بيانات العرض:', error);
            throw error;
        }

        currentEditingOfferId = offerId;
        
        // تعبئة النموذج بالبيانات
        document.getElementById('offer-title').value = offer.title || '';
        document.getElementById('offer-description').value = offer.description || '';
        document.getElementById('offer-button-text').value = offer.button_text || 'تسوق الآن';
        document.getElementById('offer-link').value = offer.link || '';
        
        // عرض الصورة إذا كانت موجودة
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
        
        // إظهار النموذج
        const offerFormContainer = document.getElementById('offer-form-container');
        if (offerFormContainer) {
            offerFormContainer.style.display = 'block';
            // التمرير إلى النموذج
            offerFormContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('✅ تم تحميل بيانات العرض بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات العرض:', error);
        alert('❌ حدث خطأ في تحميل بيانات العرض: ' + error.message);
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

        if (error) {
            console.error('❌ خطأ في حذف العرض:', error);
            throw error;
        }
        
        console.log('✅ تم حذف العرض بنجاح');
        alert('✅ تم حذف العرض بنجاح');
        
        // إعادة تحميل العروض
        await loadOffers();
        
    } catch (error) {
        console.error('❌ خطأ في حذف العرض:', error);
        alert('❌ حدث خطأ في حذف العرض: ' + error.message);
    }
}

// جعل الدوال متاحة globally للاستدعاء من الـ HTML
window.showOfferForm = showOfferForm;
window.editOffer = editOffer;
window.deleteOffer = deleteOffer;
window.loadOffers = loadOffers;