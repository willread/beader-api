const cloudinary = require('cloudinary');
const { createCanvas } = require('canvas');

// Configure image upload SDK

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const clearColor = 'ffffff';
const strokeColor = 'dddddd';
const canvasWidth = 700;
const canvasHeight = 700;

module.exports = (width, height, align, data, cb) => {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const context = canvas.getContext('2d');

  const size = width > height ? canvasWidth /width : canvasHeight /height;

  if (align !== 'normal' && align !== 'pixel') {
    size = width > height ? size - size / width / 2 : size - size / height / 2;
  }

  const horizontalOffset = align == 'horizontal' ? size / 2 : 0;
  const verticalOffset = align == 'vertical' ? size / 2 : 0;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      context.beginPath();
      if(align == 'pixel'){
        context.rect(x * size, y * size, size, size);
      }else{
        context.arc(x * size + size / 2 + (y % 2 ? horizontalOffset : 0), y * size + size / 2 + (x % 2 ? verticalOffset : 0), size / 2 - 1, 0, 2 * Math.PI, false);
      }
      context.fillStyle = '#' + (data[x + y * width] || clearColor);
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = '#' + strokeColor;
      context.stroke();
    }
  }

  cloudinary.uploader.upload(canvas.toDataURL('image/png'), result => {
    cb(result.secure_url);
  }, {});
}
