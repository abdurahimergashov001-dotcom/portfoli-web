/* ========================================
   PREMIUM PORTFOLIO — JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- NAVBAR SCROLL ---------- */
  const navbar = document.getElementById('navbar');
  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ---------- BURGER MENU ---------- */
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Stagger animation for card grids
        const parent = entry.target.parentElement;
        const siblings = parent ? parent.querySelectorAll('.reveal') : [];
        let delay = 0;
        if (siblings.length > 1) {
          const index = Array.from(siblings).indexOf(entry.target);
          delay = index * 100;
        }
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- COUNTER ANIMATION ---------- */
  const counters = document.querySelectorAll('.stat-number[data-target]');
  let countersStarted = false;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      el.textContent = current.toLocaleString('en-US');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const statsSection = document.getElementById('stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          counters.forEach(c => animateCounter(c));
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
  }

  /* ---------- PRICING TOGGLE ---------- */
  const pricingToggle = document.getElementById('pricingToggle');
  const toggleMonth = document.getElementById('toggleMonth');
  const toggleYear = document.getElementById('toggleYear');
  const priceValues = document.querySelectorAll('.price-value');
  const periodTexts = document.querySelectorAll('.period-text');
  let isYearly = false;

  const formatPrice = (num) => {
    return num.toLocaleString('en-US');
  };

  const updatePrices = () => {
    priceValues.forEach(el => {
      const price = isYearly ? parseInt(el.dataset.year, 10) : parseInt(el.dataset.month, 10);
      el.textContent = formatPrice(price);
    });
    periodTexts.forEach(el => {
      el.textContent = isYearly ? 'yr' : 'mo';
    });
    toggleMonth.classList.toggle('active', !isYearly);
    toggleYear.classList.toggle('active', isYearly);
    pricingToggle.classList.toggle('active', isYearly);
  };

  if (pricingToggle) {
    pricingToggle.addEventListener('click', () => {
      isYearly = !isYearly;
      updatePrices();
    });
  }
  if (toggleMonth) {
    toggleMonth.addEventListener('click', () => { isYearly = false; updatePrices(); });
  }
  if (toggleYear) {
    toggleYear.addEventListener('click', () => { isYearly = true; updatePrices(); });
  }

  /* ---------- FAQ ACCORDION ---------- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      // Close all
      faqItems.forEach(i => i.classList.remove('active'));
      // Open clicked if it was closed
      if (!isOpen) item.classList.add('active');
    });
  });

  /* ---------- CTA FORM — Connected to Backend API ---------- */
  const ctaForm = document.getElementById('ctaForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('ctaEmail');
      const btn = ctaForm.querySelector('.btn-cta');
      const originalText = btn.textContent;

      if (input && input.value) {
        btn.textContent = 'Sending...';
        btn.disabled = true;

        try {
          const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: input.value })
          });
          const data = await response.json();

          if (data.success) {
            input.value = '';
            btn.textContent = 'Sent ✓';
            btn.style.background = '#43E97B';
            btn.style.color = '#fff';
          } else {
            btn.textContent = 'Error ✗';
            btn.style.background = '#FF6584';
            btn.style.color = '#fff';
          }
        } catch (error) {
          btn.textContent = 'Error ✗';
          btn.style.background = '#FF6584';
          btn.style.color = '#fff';
        }

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
        }, 2500);
      }
    });
  }

  /* ---------- SMOOTH SCROLL for all anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 72;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    });
  });

});
