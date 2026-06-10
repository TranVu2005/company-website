export default function Navbar() {
  const template = `
    <header class="navbar" id="navbar">
      <div class="container nav-container">
        <a href="#" class="logo">Nova<span>Tech</span></a>
        
        <nav class="nav-links" id="nav-links">
          <a href="#hero-root" class="nav-link active" data-section="hero-root">Trang chủ</a>
          <a href="#about-root" class="nav-link" data-section="about-root">Giới thiệu</a>
          <a href="#services-root" class="nav-link" data-section="services-root">Dịch vụ</a>
          <a href="#products-root" class="nav-link" data-section="products-root">Sản phẩm</a>
          <a href="#team-root" class="nav-link" data-section="team-root">Đội ngũ</a>
          <a href="#news-root" class="nav-link" data-section="news-root">Tin tức</a>
          <a href="#contact-root" class="nav-link" data-section="contact-root">Liên hệ</a>
          <span class="nav-indicator" id="nav-indicator"></span>
        </nav>
        
        <div class="nav-actions">
          <button class="icon-btn" id="search-toggle" aria-label="Search"><i data-lucide="search" style="width:18px;height:18px;"></i></button>
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu">☰</button>
        </div>
      </div>
    </header>
  `;

  // Attach functionality after render
  setTimeout(() => {
    const navbar = document.getElementById('navbar');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinksContainer = document.getElementById('nav-links');
    const indicator = document.getElementById('nav-indicator');
    const navLinks = document.querySelectorAll('.nav-link');

    // Di chuyển thanh indicator đến link đang active
    const moveIndicator = (link) => {
      if (!indicator || !link) return;
      const linkRect = link.getBoundingClientRect();
      const navRect = navLinksContainer.getBoundingClientRect();
      indicator.style.width = linkRect.width + 'px';
      indicator.style.left = (linkRect.left - navRect.left) + 'px';
    };

    // Set vị trí ban đầu
    const initialActive = document.querySelector('.nav-link.active');
    if (initialActive) moveIndicator(initialActive);

    // Scroll Spy: detect section hiện tại khi cuộn
    const sectionIds = ['hero-root', 'about-root', 'services-root', 'products-root', 'team-root', 'news-root', 'contact-root'];

    const onScroll = () => {
      // Navbar scroll effect
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      // Scroll spy
      let currentSection = 'hero-root';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            currentSection = id;
          }
        }
      }

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === currentSection) {
          link.classList.add('active');
          moveIndicator(link);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Recalculate on resize
    window.addEventListener('resize', () => {
      const active = document.querySelector('.nav-link.active');
      if (active) moveIndicator(active);
    });

    // Mobile menu toggle
    mobileBtn.addEventListener('click', () => {
      navLinksContainer.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('active');
      });
    });
  }, 0);

  return template;
}
