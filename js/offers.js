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
});

function initializeOfferManagement() {
    // تهيئة event listeners للتبويبات
    initializeTabListeners();
    
    // تحميل العروض فقط إذا كان تبويب العروض نشطاً
    const offersTab = document.getElementById('offers-tab');
    if (offersTab && offersTab.classList.contains('active')) {
        loadOffers();
    }
}

function initializeTabListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إذا كان التبويب المنقرض عليه هو تبويب العروض
            if (tabId === 'offers-tab') {
                // تأخير تهيئة العروض حتى يكتمل تحميل التبويب
                setTimeout(() => {
                    initializeOfferElements();
                    loadOffers();
                }, 100);
            }
        });
    });
}

function initializeOfferElements() {
    // الحصول على العناصر فقط عندما يكون تبويب العروض نشطاً
    offerImageInput = document.getElementById('offer-image');
    offerImageUploadBox = document.getElementById('offer-image-upload-box');
    offerImagePreview = document.getElementById('offer-image-preview');
    removeOfferImageBtn = document.getElementById('remove-offer-image');
    
    // إذا لم تكن العناصر موجودة، لا تكمل
    if (!offerImageInput || !offerImageUploadBox || !offerImagePreview || !removeOfferImageBtn) {
        console.log('عناصر إدارة العروض غير جاهزة بعد');
        return;
    }
    
    console.log('تم تهيئة عناصر إدارة العروض بنجاح');
    
    // إزالة event listeners القديمة أولاً (إن وجدت)
    offerImageUploadBox.removeEventListener('click', handleOfferImageUploadClick);
    offerImageInput.removeEventListener('change', handleOfferImageChange);
    removeOfferImageBtn.removeEventListener('click', handleRemoveOfferImage);
    
    // إضافة event listeners جديدة
    offerImageUploadBox.addEventListener('click', handleOfferImageUploadClick);
    offerImageInput.addEventListener('change', handleOfferImageChange);
    removeOfferImageBtn.addEventListener('click', handleRemoveOfferImage);
    
    // تهيئة الأزرار الأخرى
    initializeOfferButtons();
}

function initializeOfferButtons() {
    const addOfferBtn = document.getElementById('add-offer-btn');
    const cancelOfferBtn = document.getElementById('cancel-offer-btn');
    const offerForm = document.getElementById('offer-form');
    
    if (addOfferBtn) {
        // إزالة event listener القديم أولاً
        addOfferBtn.removeEventListener('click', showOfferForm);
        addOfferBtn.addEventListener('click', showOfferForm);
    }
    
    if (cancelOfferBtn) {
        cancelOfferBtn.removeEventListener('click', hideOfferForm);
        cancelOfferBtn.addEventListener('click', hideOfferForm);
    }
    
    if (offerForm) {
        offerForm.removeEventListener('submit', handleOfferFormSubmit);
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
    currentEditingOfferId = null;
    const offerFormContainer = document.getElementById('offer-form-container');
    const offerForm = document.getElementById('offer-form');
    
    if (offerForm) {
        offerForm.reset();
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
    
    if (offerFormContainer) {
        offerFormContainer.style.display = 'block';
    }
}

function hideOfferForm() {
    const offerFormContainer = document.getElementById('offer-form-container');
    if (offerFormContainer) {
        offerFormContainer.style.display = 'none';
    }
}

// معالجة تقديم نموذج العرض
async function handleOfferFormSubmit(e) {
    e.preventDefault();
    
    // تأكد من تهيئة العناصر أولاً
    if (!offerImageInput) {
        initializeOfferElements();
    }
    
    const saveOfferBtn = document.getElementById('save-offer-btn');
    if (saveOfferBtn) {
        saveOfferBtn.disabled = true;
        saveOfferBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    }
    
    try {
        const formData = new FormData();
        formData.append('title', document.getElementById('offer-title').value);
        formData.append('description', document.getElementById('offer-description').value);
        formData.append('button_text', document.getElementById('offer-button-text').value);
        formData.append('link', document.getElementById('offer-link').value);
        
        const imageFile = offerImageInput ? offerImageInput.files[0] : null;
        if (imageFile) {
            formData.append('image', imageFile);
        }

        if (currentEditingOfferId) {
            await updateOffer(currentEditingOfferId, formData);
        } else {
            await addOffer(formData);
        }
        
        hideOfferForm();
        await loadOffers();
        
    } catch (error) {
        console.error('Error saving offer:', error);
        alert('حدث خطأ في حفظ العرض');
    } finally {
        if (saveOfferBtn) {
            saveOfferBtn.disabled = false;
            saveOfferBtn.innerHTML = '<i class="fas fa-save"></i> حفظ العرض';
        }
    }
}

// تحميل العروض من Supabase
async function loadOffers() {
    try {
        console.log('جاري تحميل العروض...');
        const { data: offers, error } = await supabase
            .from('offers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log('العروض المحملة:', offers);
        displayOffers(offers);
        displayOffersSlider(offers);
    } catch (error) {
        console.error('Error loading offers:', error);
        // عرض رسالة للمستخدم في واجهة المستخدم
        const offersGrid = document.getElementById('offers-grid');
        if (offersGrid) {
            offersGrid.innerHTML = '<p class="error-message">حدث خطأ في تحميل العروض</p>';
        }
    }
}

// عرض العروض في لوحة التحكم
function displayOffers(offers) {
    const offersGrid = document.getElementById('offers-grid');
    if (!offersGrid) return;
    
    

    offersGrid.innerHTML = offers.map(offer => `
        <div class="offer-card">
            <div style="position: relative; height: 200px; overflow: hidden;">
                <img src="${offer.image_url}" alt="${offer.title}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPue+juS8muWbvuWDjzwvdGV4dD48L3N2Zz4='">
            </div>
            <div class="offer-card-content">
                <h4 class="offer-card-title">${offer.title}</h4>
                <p class="offer-card-description">${offer.description}</p>
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
    if (!sliderTrack) return;
    
    if (!offers || offers.length === 0) {
        sliderTrack.innerHTML = `
            <div class="slide">
                <div style="background: linear-gradient(135deg, #c245d8, #a8329b); height: 100%; display: flex; align-items: center; justify-content: center; color: white; text-align: center;">
                    <div class="slide-content">
                        <h3>عروض سجى ستور</h3>
                        <p>اكتشف أحدث العروض والتصاميم الحصرية</p>
                        <a href="#products" class="slide-btn">تسوق الآن</a>
                    </div>
                </div>
            </div>
        `;
        initSlider();
        return;
    }

    sliderTrack.innerHTML = offers.map(offer => `
        <div class="slide">
            <img src="${offer.image_url}" alt="${offer.title}" onerror="this.onerror=null; this.style.display='none'; this.parentNode.style.background='linear-gradient(135deg, #c245d8, #a8329b)';">
            <div class="slide-content">
                <h3>${offer.title}</h3>
                <p>${offer.description}</p>
                <a href="${offer.link || '#products'}" class="slide-btn">${offer.button_text || 'تسوق الآن'}</a>
            </div>
        </div>
    `).join('');

    initSlider();
}

// إضافة عرض جديد
async function addOffer(formData) {
    let imageUrl = null;
    
    if (formData.get('image')) {
        imageUrl = await uploadOfferImage(formData.get('image'));
    }
    
    const { data, error } = await supabase
        .from('offers')
        .insert([{
            title: formData.get('title'),
            description: formData.get('description'),
            button_text: formData.get('button_text'),
            link: formData.get('link'),
            image_url: imageUrl
        }]);

    if (error) throw error;
    alert('تم إضافة العرض بنجاح');
}

// تعديل العرض
async function updateOffer(offerId, formData) {
    let imageUrl = null;
    
    if (formData.get('image')) {
        imageUrl = await uploadOfferImage(formData.get('image'));
    }

    const updateData = {
        title: formData.get('title'),
        description: formData.get('description'),
        button_text: formData.get('button_text'),
        link: formData.get('link')
    };

    if (imageUrl) {
        updateData.image_url = imageUrl;
    }

    const { error } = await supabase
        .from('offers')
        .update(updateData)
        .eq('id', offerId);

    if (error) throw error;
    alert('تم تعديل العرض بنجاح');
}

// رفع صورة العرض
async function uploadOfferImage(imageFile) {
    if (!imageFile) return null;
    
    const fileName = `offers/${Date.now()}_${imageFile.name}`;
    
    const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, imageFile);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

    return publicUrl;
}

// تعديل العرض
async function editOffer(offerId) {
    try {
        const { data: offer, error } = await supabase
            .from('offers')
            .select('*')
            .eq('id', offerId)
            .single();

        if (error) throw error;

        currentEditingOfferId = offerId;
        
        document.getElementById('offer-title').value = offer.title;
        document.getElementById('offer-description').value = offer.description;
        document.getElementById('offer-button-text').value = offer.button_text || 'تسوق الآن';
        document.getElementById('offer-link').value = offer.link || '';
        
        if (offer.image_url && offerImagePreview) {
            offerImagePreview.src = offer.image_url;
            offerImagePreview.style.display = 'block';
            offerImageUploadBox.classList.add('has-image');
            removeOfferImageBtn.style.display = 'inline-block';
        }
        
        document.getElementById('offer-form-container').style.display = 'block';
    } catch (error) {
        console.error('Error loading offer for edit:', error);
        alert('حدث خطأ في تحميل بيانات العرض');
    }
}

// حذف العرض
async function deleteOffer(offerId) {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', offerId);

        if (error) throw error;
        
        alert('تم حذف العرض بنجاح');
        await loadOffers();
    } catch (error) {
        console.error('Error deleting offer:', error);
        alert('حدث خطأ في حذف العرض');
    }
}

// جعل الدوال متاحة globally للاستدعاء من الـ HTML
window.showOfferForm = showOfferForm;
window.editOffer = editOffer;
window.deleteOffer = deleteOffer;