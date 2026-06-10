import { searchData } from '../services/api.js';

export default function SearchOverlay() {
  const template = `
    <div class="search-overlay" id="search-overlay">
      <div class="search-header">
        <button class="close-search" id="close-search" aria-label="Close search">&times;</button>
      </div>
      <div class="search-container">
        <div class="search-input-wrapper">
          <input type="text" id="search-input" class="search-input" placeholder="Nhập từ khóa tìm kiếm..." autocomplete="off">
        </div>
        <div class="search-results" id="search-results">
          <!-- Results injected here -->
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const searchBtn = document.getElementById('search-toggle');
    const overlay = document.getElementById('search-overlay');
    const closeBtn = document.getElementById('close-search');
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    if (!searchBtn || !overlay) return;

    const openSearch = () => {
      overlay.classList.add('active');
      setTimeout(() => input.focus(), 100);
      document.body.style.overflow = 'hidden';
    };

    const closeSearch = () => {
      overlay.classList.remove('active');
      input.value = '';
      resultsContainer.innerHTML = '';
      document.body.style.overflow = '';
    };

    searchBtn.addEventListener('click', openSearch);
    closeBtn.addEventListener('click', closeSearch);
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeSearch();
      }
    });

    // Handle search input with debounce
    let timeoutId;
    input.addEventListener('input', (e) => {
      clearTimeout(timeoutId);
      const query = e.target.value.trim();
      
      if (!query) {
        resultsContainer.innerHTML = '';
        return;
      }

      timeoutId = setTimeout(async () => {
        const results = await searchData(query);
        renderResults(results);
      }, 300);
    });

    function renderResults(results) {
      if (results.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">Không tìm thấy kết quả nào.</div>`;
        return;
      }

      resultsContainer.innerHTML = results.map(item => `
        <a href="#/${item.section}/${item.id}" class="search-result-item" onclick="document.getElementById('close-search').click()">
          <span class="result-type">${item.type}</span>
          <h4 class="result-title">${item.title}</h4>
          <p class="result-desc">${item.desc}</p>
        </a>
      `).join('');
    }
  }, 100);

  return template;
}
