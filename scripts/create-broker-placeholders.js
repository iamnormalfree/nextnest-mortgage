// Script to create placeholder broker images
const fs = require('fs');
const path = require('path');

// SVG placeholder for broker images
const createBrokerSVG = (name, color) => {
  const initials = name.split(' ').map(n => n[0]).join('');
  return `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${color}"/>
  <circle cx="100" cy="80" r="35" fill="#ffffff" opacity="0.9"/>
  <ellipse cx="100" cy="145" rx="55" ry="35" fill="#ffffff" opacity="0.9"/>
  <text x="100" y="105" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${color}" text-anchor="middle">${initials}</text>
</svg>`;
};

const brokers = [
  { name: 'Michelle Chen', file: 'michelle-chen.svg', color: '#FF6B6B' },
  { name: 'Sarah Wong', file: 'sarah-wong.svg', color: '#4ECDC4' },
  { name: 'Grace Lim', file: 'grace-lim.svg', color: '#9B5DE5' },
  { name: 'Rachel Tan', file: 'rachel-tan.svg', color: '#00BBF9' },
  { name: 'Jasmine Lee', file: 'jasmine-lee.svg', color: '#FEB800' }
];

const outputDir = path.join(__dirname, '..', 'public', 'images', 'brokers');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create SVG files
brokers.forEach(broker => {
  const svg = createBrokerSVG(broker.name, broker.color);
  const filePath = path.join(outputDir, broker.file);
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Created ${broker.file}`);
});

// Also create a default broker image
const defaultSVG = createBrokerSVG('AI', '#888888');
fs.writeFileSync(path.join(outputDir, 'default-broker.svg'), defaultSVG);
console.log(`✅ Created default-broker.svg`);

console.log('\n🎉 All broker placeholder images created successfully!');