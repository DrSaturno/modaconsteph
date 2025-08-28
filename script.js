// Configuración y variables globales
const CONFIG = {
    SCROLL_THRESHOLD: 100,
    SMOOTH_SCROLL_OFFSET: 80,
    ANIMATION_DURATION: 400,
    DEBOUNCE_DELAY: 16 // ~60fps
};

// Estado global
const STATE = {
    isScrolled: false,
    isMobileMenuOpen: false,
    currentSection: 'inicio',
    isTransitioning: false
};

// Utilidades
const Utils = {
    // Debounce function para optimizar el scroll
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Función para smooth scroll con offset
    smoothScrollTo(element, offset = CONFIG.SMOOTH_SCROLL_OFFSET) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },

    // Detectar sección activa
    getCurrentSection() {
        const sections = document.querySelectorAll('section[id]');
        let currentSection = 'inicio';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= CONFIG.SMOOTH_SCROLL_OFFSET && rect.bottom >= CONFIG.SMOOTH_SCROLL_OFFSET) {
                currentSection = section.id;
            }
        });
        
        return currentSection;
    },

    // Animación de entrada para elementos
    animateOnScroll() {
        const elements = document.querySelectorAll('.course-card, .testimonial-content, .about-text');
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = (rect.top >= 0 && rect.top <= window.innerHeight * 0.8);
            
            if (isVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
};

// Manejo del Header y Navegación
const Navigation = {
    init() {
        this.bindEvents();
        this.setupInitialStyles();
        this.initializeNavState();
    },

    bindEvents() {
        // Scroll event con debounce
        window.addEventListener('scroll', Utils.debounce(this.handleScroll.bind(this), CONFIG.DEBOUNCE_DELAY));
        
        // Click en links del menú
        document.querySelectorAll('.nav-menu a[href^="#"]').forEach(link => {
            link.addEventListener('click', this.handleMenuClick.bind(this));
        });

        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
    },

    setupInitialStyles() {
        // Preparar elementos para animaciones
        const animatedElements = document.querySelectorAll('.course-card, .testimonial-content, .about-text');
        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
    },

    initializeNavState() {
        const header = document.querySelector('.header');
        const menuLinks = document.querySelectorAll('.nav-menu a');
        
        // Configurar estado inicial
        header.setAttribute('data-state', 'transparent');
        
        // Configurar hover habilitado para elementos no activos
        menuLinks.forEach(link => {
            if (!link.classList.contains('active')) {
                link.setAttribute('data-hover-enabled', 'true');
            }
        });
    },

    handleScroll() {
        const scrolled = window.scrollY > CONFIG.SCROLL_THRESHOLD;
        
        if (scrolled !== STATE.isScrolled) {
            STATE.isScrolled = scrolled;
            this.updateHeaderState(scrolled);
        }

        // Actualizar sección activa
        const currentSection = Utils.getCurrentSection();
        if (currentSection !== STATE.currentSection) {
            STATE.currentSection = currentSection;
            this.updateActiveMenuItem(currentSection);
        }

        // Animaciones al hacer scroll
        Utils.animateOnScroll();
    },

    updateHeaderState(scrolled) {
        if (STATE.isTransitioning) return;
        
        STATE.isTransitioning = true;
        const header = document.querySelector('.header');
        
        if (scrolled) {
            header.style.background = 'rgba(248, 245, 243, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
            header.style.borderBottom = '1px solid rgba(216, 177, 186, 0.2)';
            header.setAttribute('data-state', 'opaque');
            header.classList.add('scrolled');
        } else {
            header.style.background = 'transparent';
            header.style.backdropFilter = 'none';
            header.style.borderBottom = 'none';
            header.setAttribute('data-state', 'transparent');
            header.classList.remove('scrolled');
        }

        // Resetear el bloqueo de transición
        setTimeout(() => {
            STATE.isTransitioning = false;
        }, 300);
    },

    updateActiveMenuItem(sectionId) {
        const menuLinks = document.querySelectorAll('.nav-menu a');
        
        menuLinks.forEach(link => {
            const wasActive = link.classList.contains('active');
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            const isCurrentActive = href === `#${sectionId}`;
            
            if (isCurrentActive) {
                link.classList.add('active');
                link.setAttribute('data-hover-enabled', 'false');
            } else {
                link.setAttribute('data-hover-enabled', 'true');
            }
        });
    },

    handleMenuClick(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            Utils.smoothScrollTo(targetElement);
            
            // Cerrar menú móvil si está abierto
            if (STATE.isMobileMenuOpen) {
                this.toggleMobileMenu();
            }
        }
    },

    toggleMobileMenu() {
        STATE.isMobileMenuOpen = !STATE.isMobileMenuOpen;
        const navMenu = document.querySelector('.nav-menu');
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu) {
            navMenu.style.display = STATE.isMobileMenuOpen ? 'flex' : 'none';
        }
        
        if (toggleButton) {
            toggleButton.classList.toggle('active', STATE.isMobileMenuOpen);
        }
    }
};

// Manejo de Formularios
// Manejo de Formularios - VERSIÓN ACTUALIZADA
const Forms = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactSubmit.bind(this));
        }

        // Mejorar UX de los inputs del formulario
        this.enhanceFormInputs();
    },

    enhanceFormInputs() {
        const inputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
        
        inputs.forEach(input => {
            input.addEventListener('focus', this.handleInputFocus);
            input.addEventListener('blur', this.handleInputBlur);
            input.addEventListener('input', this.handleInputChange);
        });
    },

    handleInputFocus(e) {
        const formGroup = e.target.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('focused');
        }
    },

    handleInputBlur(e) {
        const formGroup = e.target.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('focused');
            if (e.target.value) {
                formGroup.classList.add('has-value');
            } else {
                formGroup.classList.remove('has-value');
            }
        }
    },

    handleInputChange(e) {
        // Validación en tiempo real
        this.validateField(e.target);
    },

    validateField(field) {
        const isValid = field.checkValidity();
        const formGroup = field.closest('.form-group');
        
        if (formGroup) {
            formGroup.classList.toggle('error', !isValid);
            formGroup.classList.toggle('valid', isValid && field.value);
        }
    },

    async handleContactSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Validar campos obligatorios
        const nombre = formData.get('nombre');
        const email = formData.get('email');
        const mensaje = formData.get('mensaje');
        
        if (!nombre || !email || !mensaje) {
            this.showErrorMessage('Por favor completa todos los campos obligatorios');
            return;
        }
        
        // Deshabilitar botón durante el envío
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        try {
            const response = await fetch(CONTACT_ENDPOINT, {
  method: 'POST',
  body: formData,
  headers: { 'Accept': 'application/json' }
});

            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccessMessage();
                form.reset();
                // Limpiar clases de validación
                form.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('focused', 'has-value', 'valid', 'error');
                });
            } else {
                this.showErrorMessage(result.message || 'Error al enviar el mensaje');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage('Error de conexión. Inténtalo nuevamente.');
        } finally {
            // Restaurar botón
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Mensaje';
        }
    },

    showSuccessMessage(message = '¡Mensaje enviado con éxito! Te contactaremos pronto.') {
        this.showMessage(message, 'success');
    },

    showErrorMessage(message = 'Hubo un error al enviar el mensaje. Inténtalo nuevamente.') {
        this.showMessage(message, 'error');
    },

    showMessage(message, type) {
        // Remover mensajes previos
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'form-message';
        
        const isSuccess = type === 'success';
        const backgroundColor = isSuccess ? 'var(--primary-color)' : '#e74c3c';
        const icon = isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle';
        
        messageDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${backgroundColor};
                color: white;
                padding: 1rem 2rem;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 9999;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
                font-weight: 500;
            ">
                <i class="fas ${icon}" style="margin-right: 0.5rem;"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remover mensaje después de 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    messageDiv.remove();
                }, 300);
            }
        }, 5000);
    }
};

// Agregar estilos para las animaciones de los mensajes
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(messageStyles);

// Manejo de Videos
const VideoManager = {
    init() {
        this.optimizeVideos();
        this.handleVideoIntersection();
    },

    optimizeVideos() {
        const videos = document.querySelectorAll('video');
        
        videos.forEach(video => {
            // Configuración para mejor rendimiento
            video.muted = true;
            video.playsInline = true;
            video.preload = 'metadata';
            
            // Manejo de errores
            video.addEventListener('error', this.handleVideoError);
        });
    },

    handleVideoError(e) {
        console.warn('Error al cargar video:', e.target.src);
        // Ocultar video si no se puede cargar
        e.target.style.display = 'none';
    },

    handleVideoIntersection() {
        // Pausar videos que no están visibles para mejorar rendimiento
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        video.play().catch(() => {
                            // Manejar error silenciosamente
                        });
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.1 });

            const videos = document.querySelectorAll('video');
            videos.forEach(video => observer.observe(video));
        }
    }
};

// Manejo de Interacciones UI
const UIInteractions = {
    init() {
        this.bindButtonEvents();
        this.addLoadingStates();
        this.enhanceHoverEffects();
    },

    bindButtonEvents() {
        // Botones de cursos
        document.querySelectorAll('.btn[href="#"]').forEach(btn => {
            btn.addEventListener('click', this.handleCourseButtonClick.bind(this));
        });

        // Botones con enlaces externos
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            link.addEventListener('click', this.handleExternalLink.bind(this));
        });
    },

    handleCourseButtonClick(e) {
        e.preventDefault();
        
        const button = e.currentTarget;
        const courseName = this.getCourseNameFromButton(button);
        
        // Mostrar modal o mensaje informativo
        this.showCourseInfoModal(courseName);
    },

    getCourseNameFromButton(button) {
        // Encontrar el nombre del curso basado en el contexto del botón
        const courseCard = button.closest('.course-card');
        const featuredSection = button.closest('.featured-workshop, .featured-colorimetry');
        
        if (courseCard) {
            const title = courseCard.querySelector('h3');
            return title ? title.textContent : 'Curso';
        }
        
        if (featuredSection) {
            const title = featuredSection.querySelector('h2');
            return title ? title.textContent : 'Taller';
        }
        
        return 'Curso';
    },

    showCourseInfoModal(courseName) {
        // Crear modal dinámico
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        modal.innerHTML = `
            <div class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            ">
                <div class="modal-content" style="
                    background: white;
                    border-radius: 20px;
                    padding: 3rem;
                    max-width: 500px;
                    margin: 2rem;
                    text-align: center;
                    position: relative;
                    animation: slideUp 0.3s ease;
                ">
                    <button class="modal-close" style="
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: #8b4d5c;
                        cursor: pointer;
                    ">&times;</button>
                    <h3 style="color: #8b4d5c; margin-bottom: 1rem;">${courseName}</h3>
                    <p style="color: #666; margin-bottom: 2rem;">
                        ¡Próximamente tendremos más información sobre este curso! 
                        Mientras tanto, puedes contactarnos para recibir actualizaciones.
                    </p>
                    <a href="#contacto" class="btn btn-primary" style="margin-right: 1rem;">Contactar</a>
                    <button class="btn btn-outline modal-close-btn">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Event listeners para cerrar el modal
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
        const overlay = modal.querySelector('.modal-overlay');
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(modal));
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal(modal);
            }
        });

        // Cerrar con ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    },

    closeModal(modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }, 300);
    },

    handleExternalLink(e) {
        // Agregar indicador visual para enlaces externos
        const link = e.currentTarget;
        if (!link.querySelector('.external-indicator')) {
            const indicator = document.createElement('i');
            indicator.className = 'fas fa-external-link-alt external-indicator';
            indicator.style.marginLeft = '0.5rem';
            indicator.style.fontSize = '0.8rem';
            link.appendChild(indicator);
        }
    },

    addLoadingStates() {
        // Agregar estados de carga para botones
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                // Solo para botones que no son enlaces internos
                if (!this.getAttribute('href') || this.getAttribute('href') === '#') {
                    this.classList.add('loading');
                    setTimeout(() => {
                        this.classList.remove('loading');
                    }, 1000);
                }
            });
        });
    },

    enhanceHoverEffects() {
        // Mejorar efectos hover para cards
        const cards = document.querySelectorAll('.course-card, .pain-conclusion');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', this.handleCardHover);
            card.addEventListener('mouseleave', this.handleCardLeave);
        });
    },

    handleCardHover(e) {
        const card = e.currentTarget;
        card.style.transform = 'translateY(-10px) scale(1.02)';
        card.style.boxShadow = '0 20px 40px rgba(139, 77, 92, 0.15)';
    },

    handleCardLeave(e) {
        const card = e.currentTarget;
        card.style.transform = '';
        card.style.boxShadow = '';
    }
};

// Integración de WhatsApp
const WhatsAppIntegration = {
    init() {
        this.setupWhatsAppTracking();
        this.addWhatsAppAnalytics();
    },

    setupWhatsAppTracking() {
        const whatsappButton = document.querySelector('.whatsapp-button');
        if (whatsappButton) {
            whatsappButton.addEventListener('click', this.trackWhatsAppClick.bind(this));
            // Agregar evento de hover para analytics
            whatsappButton.addEventListener('mouseenter', this.trackWhatsAppHover.bind(this));
        }
    },

    trackWhatsAppClick() {
        // Analytics tracking (opcional)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                event_category: 'WhatsApp',
                event_label: 'Contact Button',
                value: 1
            });
        }
        
        // Log para debugging
        console.log('WhatsApp contact initiated');
        
        // Opcional: Mostrar mensaje de confirmación
        this.showContactMessage();
    },

    trackWhatsAppHover() {
        // Analytics para hover (opcional)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'hover', {
                event_category: 'WhatsApp',
                event_label: 'Button Hover',
            });
        }
    },

    showContactMessage() {
        // Mensaje temporal que confirma la acción
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 100px;
                right: 25px;
                background: #25d366;
                color: white;
                padding: 0.8rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
                z-index: 9998;
                font-size: 14px;
                font-weight: 500;
                animation: slideUp 0.3s ease;
            ">
                Abriendo WhatsApp...
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 2 segundos
        setTimeout(() => {
            notification.remove();
        }, 2000);
    },

    addWhatsAppAnalytics() {
        // Configurar eventos de analytics avanzados
        const whatsappFloat = document.querySelector('.whatsapp-float');
        if (whatsappFloat) {
            // Observar cuando el botón entra en el viewport
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // El botón de WhatsApp es visible
                            if (typeof gtag !== 'undefined') {
                                gtag('event', 'view', {
                                    event_category: 'WhatsApp',
                                    event_label: 'Button Visible'
                                });
                            }
                        }
                    });
                }, { threshold: 0.1 });
                
                observer.observe(whatsappFloat);
            }
        }
    }
};

// Optimizaciones de Performance
const Performance = {
    init() {
        this.lazyLoadImages();
        this.preloadCriticalAssets();
        this.optimizeAnimations();
    },

    lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },

    preloadCriticalAssets() {
        // Precargar imágenes críticas
        const criticalImages = [
            '/img/logosteph.png',
            '/img/logonegro.png'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    },

    optimizeAnimations() {
        // Reducir animaciones si el usuario prefiere menos movimiento
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition', 'none');
            
            // Deshabilitar animaciones CSS
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// Manejo de Errores
const ErrorHandler = {
    init() {
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    },

    handleError(e) {
        console.error('Error capturado:', e.error);
        // En producción, aquí enviarías el error a un servicio de logging
    },

    handlePromiseRejection(e) {
        console.error('Promise rechazada:', e.reason);
        e.preventDefault(); // Prevenir que se muestre en consola
    }
};

// Inicialización de la aplicación
const App = {
    init() {
        // Verificar que el DOM esté cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.start.bind(this));
        } else {
            this.start();
        }
    },

    start() {
        try {
            // Inicializar todos los módulos
            Navigation.init();
            Forms.init();
            VideoManager.init();
            UIInteractions.init();
            WhatsAppIntegration.init(); // Nueva integración
            Performance.init();
            ErrorHandler.init();

            // Agregar estilos dinámicos
            this.addDynamicStyles();
            
            // Mostrar página con fade in
            this.showPage();
            
            console.log('🎨 Moda con Steph - Website iniciado correctamente');
            console.log('📱 WhatsApp integration activa');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
        }
    },

    addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .loading {
                position: relative;
                color: transparent !important;
            }
            
            .loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            .mobile-menu-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .mobile-menu-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
            
            .form-group.focused input,
            .form-group.focused select,
            .form-group.focused textarea {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(216, 177, 186, 0.1);
            }
            
            .form-group.error input,
            .form-group.error select,
            .form-group.error textarea {
                border-color: #e74c3c;
            }
            
            .form-group.valid input,
            .form-group.valid select,
            .form-group.valid textarea {
                border-color: #27ae60;
            }
        `;
        document.head.appendChild(style);
    },

    showPage() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    }
};

// Inicializar la aplicación
App.init();