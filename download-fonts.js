const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, 'public', 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Font URLs
const fonts = [
  {
    name: 'JetBrainsMono-Regular.woff2',
    url: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/webfonts/JetBrainsMono-Regular.woff2'
  },
  {
    name: 'JetBrainsMono-Bold.woff2',
    url: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/webfonts/JetBrainsMono-Bold.woff2'
  }
];

// Download each font
fonts.forEach(font => {
  const filePath = path.join(fontsDir, font.name);
  const file = fs.createWriteStream(filePath);
  
  https.get(font.url, response => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${font.name}`);
    });
  }).on('error', err => {
    fs.unlink(filePath);
    console.error(`Error downloading ${font.name}: ${err.message}`);
  });
}); 