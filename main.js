const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const MIME_TYPE = "image/jpeg";
const QUALITY = 0.4;

const input = document.getElementById("img-input");
input.addEventListener("change", aa, false);

async function  aa() {
  const file = this.files[0]; // get the file
  const blobURL = URL.createObjectURL(file);
  const img = new Image();
  const imgBg= await loadImage("BLANK.jpg");
  const canvas = document.getElementById("canvas");

  img.src = blobURL;


  img.onerror = function () {
    URL.revokeObjectURL(this.src);
    // Handle the failure properly
    console.log("Cannot load image");
  };
  img.onload = async function () {
    URL.revokeObjectURL(this.src);
    const [newWidth, newHeight] = calculateSize(img, MAX_WIDTH, MAX_HEIGHT);
    canvas.width = 1500;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");

    var scale = Math.min(canvas.width / newWidth, canvas.height / newHeight);
    var w = newWidth * scale;
    var h = newHeight * scale;
    var link = document.createElement("a");

    ctx.drawImage(imgBg, 0, 0);

    //img bg
    drawImageScaled(img, ctx,newWidth,newHeight);
    //ctx.drawImage(img, left, top, newWidth, newHeight);
    //img transparant
    document.getElementById("root").append(canvas);

    canvas.toBlob(
      (blob) => {
        // Handle the compressed image. es. upload or save in local state
        displayInfo('Original file', file);
        displayInfo('Compressed file', blob);
        download(file,blob,canvas);
        console.log(link.href);
      },
      MIME_TYPE,
      QUALITY
    );
  };
 // download(file,canvas);
};

function calculateSize(img, maxWidth, maxHeight) {
  let width = img.width;
  let height = img.height;

  // calculate the width and height, constraining the proportions
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }
  return [width, height];
}

// Utility functions for demo purpose

function displayInfo(label, file) {
  const p = document.createElement('p');
  p.innerText = `${label} - ${readableBytes(file.size)}`;
  document.getElementById('root').append(p);
}

function readableBytes(bytes) {
  const i = Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function loadImage(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}

function drawImageScaled(img, ctx,w,h) {
  // var canvas = ctx.canvas ;
  // var hRatio = canvas.width  / w    ;
  // var vRatio =  canvas.height / h  ;
  // var ratio  = Math.min ( hRatio, vRatio );
  // var centerShift_x = ( canvas.width - w*ratio ) / 2;
  // var centerShift_y = ( canvas.height - h*ratio ) / 2;  
  var canvas = ctx.canvas ;
  var cW2 = canvas.width  / 2   ;
  var cH2 =  canvas.height / 2  ;
  var centerShift_x =cW2 - (w/2);
  var centerShift_y = (cH2 - (h/2)- (canvas.height/100)*3.5); 


  ctx.drawImage(img, centerShift_x,centerShift_y, w, h);  
}

function download(file, o, canvas) {
  var link = document.createElement('a');

  // Pisahkan nama file dan ekstensi
  const lastDot = file.name.lastIndexOf('.');
  let fileName;

  if (lastDot !== -1) {
    const name = file.name.substring(0, lastDot);
    const ext = file.name.substring(lastDot);
    fileName = `${name}-thumb${ext}`;
  } else {
    fileName = `${file.name}-thumb`;
  }

  link.download = fileName;
  link.href = URL.createObjectURL(o);
  link.click();
}

