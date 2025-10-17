const fs = require('fs');
const path = require('path');

// Broker data with colors matching their personalities
const brokers = [
  { 
    name: 'Michelle Chen', 
    initials: 'MC', 
    color: '#DC2626', // Red - aggressive, high-energy
    bgColor: '#FEE2E2'
  },
  { 
    name: 'Sarah Wong', 
    initials: 'SW', 
    color: '#059669', // Green - balanced, trustworthy
    bgColor: '#D1FAE5'
  },
  { 
    name: 'Grace Lim', 
    initials: 'GL', 
    color: '#7C3AED', // Purple - wise, experienced
    bgColor: '#EDE9FE'
  },
  { 
    name: 'Rachel Tan', 
    initials: 'RT', 
    color: '#2563EB', // Blue - modern, tech-savvy
    bgColor: '#DBEAFE'
  },
  { 
    name: 'Jasmine Lee', 
    initials: 'JL', 
    color: '#EA580C', // Orange - luxury, exclusive
    bgColor: '#FED7AA'
  }
];

// Generate SVG avatar for each broker
brokers.forEach(broker => {
  const fileName = broker.name.toLowerCase().replace(' ', '-') + '.svg';
  const filePath = path.join(__dirname, '..', 'public', 'images', 'brokers', fileName);
  
  const svg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="100" cy="100" r="95" fill="${broker.bgColor}" stroke="${broker.color}" stroke-width="2"/>
  
  <!-- Profile silhouette -->
  <circle cx="100" cy="80" r="35" fill="${broker.color}" opacity="0.2"/>
  <ellipse cx="100" cy="150" rx="55" ry="40" fill="${broker.color}" opacity="0.2"/>
  
  <!-- Initials -->
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="${broker.color}" text-anchor="middle" dominant-baseline="middle">
    ${broker.initials}
  </text>
  
  <!-- Professional touch - small badge -->
  <circle cx="150" cy="150" r="15" fill="${broker.color}"/>
  <text x="150" y="156" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="middle">
    ✓
  </text>
</svg>`;
  
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Generated avatar for ${broker.name}: ${fileName}`);
});

// Also create JPEG versions using base64 encoding for better compatibility
brokers.forEach(broker => {
  const jpgFileName = broker.name.toLowerCase().replace(' ', '-') + '.jpg';
  const jpgFilePath = path.join(__dirname, '..', 'public', 'images', 'brokers', jpgFileName);
  
  // Create a simple HTML template to render as image
  const html = `
    <div style="width: 200px; height: 200px; border-radius: 50%; background: ${broker.bgColor}; 
                display: flex; align-items: center; justify-content: center; border: 2px solid ${broker.color};">
      <span style="font-size: 48px; font-weight: bold; color: ${broker.color};">${broker.initials}</span>
    </div>
  `;
  
  // For now, we'll use the SVG files, but in production you'd want actual photos
  console.log(`📝 Note: For production, replace ${jpgFileName} with an actual photo`);
});

console.log('\n✨ All broker avatars generated successfully!');
console.log('📌 SVG placeholders created in public/images/brokers/');
console.log('💡 For production, replace with actual AI-generated photos from:');
console.log('   - https://thispersondoesnotexist.com/');
console.log('   - https://generated.photos/');
console.log('   - https://www.bing.com/images/create');