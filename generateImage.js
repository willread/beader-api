var cloudinary = require('cloudinary');

// Configure image upload SDK

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var Canvas = require('canvas');

var clearColor = 'ffffff';
var strokeColor = 'dddddd';
var canvasWidth = 700;
var canvasHeight = 700;

module.exports = function(width, height, align, data, cb) {
  var canvas = new Canvas(canvasWidth, canvasHeight);
  var context = canvas.getContext('2d');

  var size = width > height ? canvasWidth /width : canvasHeight /height;

  if (align !== 'normal' && align !== 'pixel') {
    size = width > height ? size - size / width / 2 : size - size / height / 2;
  }

  var horizontalOffset = align == 'horizontal' ? size / 2 : 0;
  var verticalOffset = align == 'vertical' ? size / 2 : 0;

  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
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

  cloudinary.uploader.upload(canvas.toDataURL('image/png'), function(result) {
    cb(result.secure_url);
  }, {});
}
