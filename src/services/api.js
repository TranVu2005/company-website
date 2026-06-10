/**
 * Data Service Layer
 * 
 * Hiện tại sử dụng dữ liệu tĩnh từ các file JSON để build demo.
 * Trong tương lai, chỉ cần thay đổi nội dung các hàm này thành `fetch('/api/endpoint')`
 * để tích hợp với backend mà không cần sửa UI components.
 */

import companyData from '../data/company.json';
import servicesData from '../data/services.json';
import productsData from '../data/products.json';
import teamData from '../data/team.json';
import statsData from '../data/stats.json';
import clientsData from '../data/clients.json';
import newsData from '../data/news.json';

// Lấy thông tin công ty
export const getCompanyInfo = async () => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(companyData), 100);
  });
};

export const getServices = async () => {
  return Promise.resolve(servicesData);
};

export const getProducts = async () => {
  return Promise.resolve(productsData);
};

export const getTeam = async () => {
  return Promise.resolve(teamData);
};

export const getStats = async () => {
  return Promise.resolve(statsData);
};

export const getClients = async () => {
  return Promise.resolve(clientsData);
};

export const getNews = async () => {
  return Promise.resolve(newsData);
};

// Hàm submit form liên hệ (giả lập)
export const submitContact = async (formData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Form submitted:', formData);
      resolve({ success: true, message: 'Gửi thành công!' });
    }, 1000);
  });
};

export const searchData = async (query) => {
  query = query.toLowerCase();
  const results = [];

  // Search services
  servicesData.forEach(s => {
    if (s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) {
      results.push({ type: 'Dịch vụ', title: s.title, desc: s.description, section: 'service', id: s.id });
    }
  });

  // Search products
  productsData.forEach(p => {
    if (p.name.toLowerCase().includes(query) || p.tagline.toLowerCase().includes(query)) {
      results.push({ type: 'Sản phẩm', title: p.name, desc: p.tagline, section: 'product', id: p.id });
    }
  });

  // Search news
  newsData.forEach(n => {
    if (n.title.toLowerCase().includes(query) || n.excerpt.toLowerCase().includes(query)) {
      results.push({ type: 'Tin tức', title: n.title, desc: n.excerpt, section: 'news', id: n.id });
    }
  });

  return Promise.resolve(results);
};
