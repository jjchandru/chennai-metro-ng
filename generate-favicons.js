// Simple script to help generate PNG favicons
// You can use online tools or this as a reference

const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

console.log('To generate PNG favicons from your SVG, you can:');
console.log('1. Use online tools like https://favicon.io/favicon-converter/');
console.log('2. Upload your SVG file (src/assets/favicon.svg)');
console.log('3. Download the generated files and place them in src/assets/');
console.log('\nRequired files:');
faviconSizes.forEach(size => {
  console.log(`- ${size.name} (${size.size}x${size.size}px)`);
});

console.log('\nAlternatively, you can:');
console.log('1. Find a Chennai Metro logo/icon online');
console.log('2. Use it with favicon generators');
console.log('3. Replace the files in src/assets/');
