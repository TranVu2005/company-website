/**
 * Setup Intersection Observer cho các animation khi scroll
 */
export const initScrollAnimations = () => {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15 // Kích hoạt khi 15% element hiển thị
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Tuỳ chọn: Bỏ comment dòng dưới nếu chỉ muốn animate 1 lần
        // observer.unobserve(entry.target);
      } else {
        // Tuỳ chọn: Remove class nếu muốn animate lại khi scroll lên
        // entry.target.classList.remove('active');
      }
    });
  }, observerOptions);

  // Quan sát tất cả elements có class bắt đầu bằng 'reveal'
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
};

/**
 * Hiệu ứng typing cho văn bản
 */
export const typeWriter = (element, text, speed = 50) => {
  let i = 0;
  element.innerHTML = '';
  
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Thêm con trỏ nhấp nháy sau khi gõ xong
      element.innerHTML += '<span class="typing-cursor"></span>';
    }
  }
  
  type();
};

/**
 * Animation số liệu thống kê (counter up)
 */
export const animateCounter = (element, targetValue, duration = 2000) => {
  let startTimestamp = null;
  const startValue = 0;
  
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // easeOutQuad
    const easeProgress = progress * (2 - progress);
    const currentValue = Math.floor(easeProgress * (targetValue - startValue) + startValue);
    
    element.innerText = currentValue;
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.innerText = targetValue;
    }
  };
  
  window.requestAnimationFrame(step);
};
