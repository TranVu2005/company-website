import './styles/index.css';

// Utilities
import { renderComponent } from './utils/helpers.js';
import { initScrollAnimations } from './utils/animations.js';

// Components
import Navbar from './components/Navbar.js';
import Hero from './components/Hero.js';
import About from './components/About.js';
import Services from './components/Services.js';
import Products from './components/Products.js';
import Team from './components/Team.js';
import Stats from './components/Stats.js';
import Clients from './components/Clients.js';
import News from './components/News.js';
import Contact from './components/Contact.js';
import Footer from './components/Footer.js';
import SearchOverlay from './components/SearchOverlay.js';
import { getCurrentRoute, isRoute } from './utils/router.js';
import ServiceDetail from './components/ServiceDetail.js';
import ProductDetail from './components/ProductDetail.js';
import NewsDetail from './components/NewsDetail.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('NovaTech Website Initializing...');
  
  // Mảng các components và root ID tương ứng
  const components = [
    { id: 'navbar-root', component: Navbar },
    { id: 'hero-root', component: Hero },
    { id: 'about-root', component: About },
    { id: 'services-root', component: Services },
    { id: 'products-root', component: Products },
    { id: 'team-root', component: Team },
    { id: 'stats-root', component: Stats },
    { id: 'clients-root', component: Clients },
    { id: 'news-root', component: News },
    { id: 'contact-root', component: Contact },
    { id: 'footer-root', component: Footer }
  ];

  // Khởi tạo container cho overlay nếu chưa có
  if (!document.getElementById('search-overlay-root')) {
    const searchRoot = document.createElement('div');
    searchRoot.id = 'search-overlay-root';
    document.body.appendChild(searchRoot);
    components.push({ id: 'search-overlay-root', component: SearchOverlay });
  }

  // Render tất cả components tuần tự hoặc song song
  // Dùng map để render song song giúp tăng tốc độ load
  await Promise.all(components.map(async ({ id, component }) => {
    const root = document.getElementById(id);
    if (root) {
      root.innerHTML = await component();
    }
  }));

  // Khởi tạo Lucide Icons sau khi render xong HTML
  if (window.lucide) {
    lucide.createIcons();
  }

  // Hiển thị trang chủ (ẩn detail)
  const showHomePage = () => {
    const mainContent = document.getElementById('main-content');
    const detailContent = document.getElementById('detail-content');
    mainContent.style.display = 'block';
    detailContent.style.display = 'none';
    detailContent.innerHTML = '';
  };

  // Hiển thị trang chi tiết (ẩn trang chủ)
  const showDetailPage = async (route) => {
    const mainContent = document.getElementById('main-content');
    const detailContent = document.getElementById('detail-content');
    
    mainContent.style.display = 'none';
    detailContent.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    let html = '';
    if (route.path === 'service') {
      html = await ServiceDetail(route.id);
    } else if (route.path === 'product') {
      html = await ProductDetail(route.id);
    } else if (route.path === 'news') {
      html = await NewsDetail(route.id);
    } else {
      html = '<div class="container" style="padding: 8rem 0; text-align: center;"><h2>Trang không tồn tại</h2></div>';
    }
    
    detailContent.innerHTML = html;
    if (window.lucide) lucide.createIcons();
    setTimeout(initScrollAnimations, 100);
  };

  // Router handler - CHỈ xử lý hash dạng #/path/id
  const handleRoute = async () => {
    const hash = window.location.hash;

    // Nếu hash không phải route (vd: #about-root) → bỏ qua, để trình duyệt cuộn bình thường
    if (!isRoute(hash)) {
      // Đảm bảo trang chủ đang hiện (trường hợp quay lại từ detail page)
      showHomePage();
      return;
    }

    const route = getCurrentRoute();
    if (route.path === 'home') {
      showHomePage();
    } else {
      await showDetailPage(route);
    }
  };

  window.addEventListener('hashchange', handleRoute);
  // Initial route check
  handleRoute();

  // Khởi tạo animations sau khi DOM đã render xong
  setTimeout(() => {
    initScrollAnimations();
    console.log('App loaded and animations initialized');
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }, 300); // Tăng delay nhỏ để user kịp thấy loading screen
});
