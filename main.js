// Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navMenu = document.getElementById('nav-menu');

        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuBtn.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        });

        // Close mobile menu when clicking on a link
        navMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navMenu.classList.remove('active');
                mobileMenuBtn.textContent = '☰';
            }
        });

        // Header scroll effect
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Loading animations
        const observerOptions = {
    root: null,         // الشاشة كلها
    rootMargin: "0px 0px 50% 0px", // يبدأ يظهر قبل ما يدخل بنسبة بسيطة
    threshold: 0        // يعني أول ما يلمس الشاشة
};


        const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('loaded');
            observer.unobserve(entry.target); // 🆕 علشان ما يشتغلش كل مرة
        }
    });
}, observerOptions);


        // Observe all loading elements
        document.querySelectorAll('.loading').forEach(el => {
            observer.observe(el);
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Add hover effects to service cards
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Promo code copy functionality
        const promoCode = document.querySelector('.promo-code');
        promoCode.addEventListener('click', function() {
            navigator.clipboard.writeText('ELMOSTASHAR').then(() => {
                const originalText = this.textContent;
                this.textContent = 'تم النسخ! ✓';
                this.style.background = '#4CAF50';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = 'var(--white)';
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = 'ELMOSTASHAR';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                const originalText = this.textContent;
                this.textContent = 'تم النسخ! ✓';
                this.style.background = '#4CAF50';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = 'var(--white)';
                }, 2000);
            });
        });
// Add loading animation delay for staggered effect
document.addEventListener('DOMContentLoaded', function () {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.transitionDelay = `${index * 0.1}s`;
        }, 100);
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;

    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add counter animation for stats
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + (target === 100 ? '%' : '+');
    }, 20);
}

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            if (statNumber) {
                const text = statNumber.textContent;
                const number = parseInt(text.replace(/\D/g, ''));

                if (!entry.target.classList.contains('animated')) {
                    animateCounter(statNumber, number);
                    entry.target.classList.add('animated');
                }
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
    statsObserver.observe(stat);
});

// Booking Modal Functions
function openBookingModal() {
    document.getElementById('bookingModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function callDirect() {
    window.location.href = 'tel:01277776870';
}

function openWhatsApp() {
    const message = encodeURIComponent('السلام عليكم، أريد الاستفسار عن خدمات المستشار');
    window.open(`https://wa.me/201277776870?text=${message}`, '_blank');
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) {
        closeBookingModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeBookingModal();
    }
});
