const fs = require('fs');

const company = JSON.parse(fs.readFileSync('src/data/company.json', 'utf8'));
company.technologies[0].icon = 'database';
company.technologies[1].icon = 'brain-circuit';
company.technologies[2].icon = 'bot';
company.technologies[3].icon = 'message-square';
fs.writeFileSync('src/data/company.json', JSON.stringify(company, null, 2), 'utf8');

const services = JSON.parse(fs.readFileSync('src/data/services.json', 'utf8'));
const serviceIcons = ['pie-chart', 'line-chart', 'zap', 'shield-check', 'compass', 'target'];
services.forEach((s, i) => s.icon = serviceIcons[i]);
fs.writeFileSync('src/data/services.json', JSON.stringify(services, null, 2), 'utf8');

console.log('JSON files updated');
