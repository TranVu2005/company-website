const fs = require('fs');

// Cập nhật services.json
const services = JSON.parse(fs.readFileSync('src/data/services.json', 'utf8'));
services.forEach(s => {
  s.details = `Chi tiết dịch vụ ${s.title}: Chúng tôi cung cấp giải pháp toàn diện và chuyên sâu, giúp doanh nghiệp tối ưu hóa quy trình và tăng trưởng bền vững. Với đội ngũ chuyên gia giàu kinh nghiệm, NovaTech cam kết mang lại hiệu quả cao nhất cho khách hàng.`;
  s.features = [
    "Khảo sát và tư vấn chuyên sâu",
    "Triển khai nhanh chóng, chuyên nghiệp",
    "Báo cáo và phân tích kết quả định kỳ",
    "Hỗ trợ kỹ thuật 24/7"
  ];
});
fs.writeFileSync('src/data/services.json', JSON.stringify(services, null, 2), 'utf8');

// Cập nhật products.json
const products = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));
products.forEach(p => {
  p.details = `Sản phẩm ${p.name} được thiết kế với kiến trúc hiện đại, có khả năng mở rộng cao và đáp ứng nhu cầu khắt khe của doanh nghiệp lớn. Tích hợp các công nghệ tiên tiến nhất như AI, Machine Learning để tự động hóa và nâng cao năng suất.`;
});
fs.writeFileSync('src/data/products.json', JSON.stringify(products, null, 2), 'utf8');

// Cập nhật news.json
const news = JSON.parse(fs.readFileSync('src/data/news.json', 'utf8'));
news.forEach(n => {
  n.content = `<p><b>${n.title}</b> là một bước tiến quan trọng của NovaTech trong năm nay.</p>
<p>Thị trường công nghệ đang thay đổi nhanh chóng và chúng tôi luôn tiên phong trong việc mang đến những giải pháp tốt nhất. Sự kiện này đánh dấu sự nỗ lực không ngừng nghỉ của toàn bộ đội ngũ kỹ sư và chuyên gia tại NovaTech.</p>
<p>Chúng tôi tin rằng, với định hướng chiến lược rõ ràng và sự đồng hành của quý khách hàng, NovaTech sẽ tiếp tục gặt hái nhiều thành công hơn nữa trong thời gian tới.</p>`;
});
fs.writeFileSync('src/data/news.json', JSON.stringify(news, null, 2), 'utf8');

console.log('JSON files updated successfully.');
