// Konfigurasi Default & State Management
const CONFIG = {
  CANVAS_SIZE: 1500,
  MIME_TYPE: "image/jpeg",
  BG_IMAGE_URL: "BLANK.jpg"
};

let currentFile = null;
let bgImageCache = null;

// DOM Elements
const DOM = {
  fileInput: document.getElementById("img-input"),
  dropZone: document.getElementById("drop-zone"),
  qualityRange: document.getElementById("quality-range"),
  qualityVal: document.getElementById("quality-val"),
  maxWidth: document.getElementById("max-width"),
  maxHeight: document.getElementById("max-height"),
  canvas: document.getElementById("canvas"),
  ctx: document.getElementById("canvas").getContext("2d"),
  infoCard: document.getElementById("info-card"),
  origSize: document.getElementById("orig-size"),
  compSize: document.getElementById("comp-size"),
  savedRatio: document.getElementById("saved-ratio")
};

// Inisialisasi Event Listener
function initEvents() {
  // Auto-process & download saat file dipilih
  DOM.fileInput.addEventListener("change", handleFileSelect);

  DOM.qualityRange.addEventListener("input", (e) => {
    DOM.qualityVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  // Jika opsi dikosongkan/diubah, langsung proses ulang gambar yang ada
  DOM.qualityRange.addEventListener("change", () => currentFile && processAndDownload());
  DOM.maxWidth.addEventListener("change", () => currentFile && processAndDownload());
  DOM.maxHeight.addEventListener("change", () => currentFile && processAndDownload());

  // Drag & Drop Handling
  DOM.dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    DOM.dropZone.classList.add("dragover");
  });
  
  DOM.dropZone.addEventListener("dragleave", () => {
    DOM.dropZone.classList.remove("dragover");
  });

  DOM.dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    DOM.dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      DOM.fileInput.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });
}

// Event Handler: File Dipilih (Langsung Auto-Process)
async function handleFileSelect() {
  const file = DOM.fileInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Harap pilih file gambar yang valid!");
    return;
  }

  currentFile = file;
  
  // Eksekusi Otomatis
  await processAndDownload();
}

// Render Gambar & Unduh Otomatis
async function processAndDownload() {
  if (!currentFile) return;

  try {
    const img = await loadImage(URL.createObjectURL(currentFile));
    
    // Lazy-load background image sekali saja
    if (!bgImageCache) {
      bgImageCache = await loadImage(CONFIG.BG_IMAGE_URL).catch(() => null);
    }

    const maxW = parseInt(DOM.maxWidth.value) || 1200;
    const maxH = parseInt(DOM.maxHeight.value) || 1200;
    const [newWidth, newHeight] = calculateSize(img, maxW, maxH);

    // Set Ukuran Canvas
    DOM.canvas.width = CONFIG.CANVAS_SIZE;
    DOM.canvas.height = CONFIG.CANVAS_SIZE;

    // Bersihkan Canvas
    DOM.ctx.clearRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

    // Render Background Frame / Solid White
    if (bgImageCache) {
      DOM.ctx.drawImage(bgImageCache, 0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
    } else {
      DOM.ctx.fillStyle = "#ffffff";
      DOM.ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
    }

    // Render Gambar Utama (Presisi posisi awal Anda)
    drawImageCentered(DOM.ctx, img, newWidth, newHeight);

    URL.revokeObjectURL(img.src);

    // Auto-Compress dan Direct Download
    const quality = parseFloat(DOM.qualityRange.value);
    DOM.canvas.toBlob((blob) => {
      if (!blob) return;

      // Update statistik file di UI
      updateStats(currentFile.size, blob.size);

      // Pemicu Otomatis Unduh File
      downloadBlob(blob, currentFile.name);
    }, CONFIG.MIME_TYPE, quality);

  } catch (error) {
    console.error("Gagal memproses gambar:", error);
    alert("Terjadi kesalahan saat memuat gambar.");
  }
}

// Helper: Hitung Aspect Ratio
function calculateSize(img, maxWidth, maxHeight) {
  let { width, height } = img;

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

// Helper: Posisikan Gambar di Tengah (Offset -3.5% Y-axis)
function drawImageCentered(ctx, img, width, height) {
  const canvas = ctx.canvas;
  const centerX = (canvas.width - width) / 2;
  const centerY = (canvas.height - height) / 2 - (canvas.height / 100) * 3.5;

  ctx.drawImage(img, centerX, centerY, width, height);
}

// Helper: Load Image Promisified
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

// Helper: Eksekusi Auto-Download
function downloadBlob(blob, originalName) {
  const lastDot = originalName.lastIndexOf(".");
  const name = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
  const ext = lastDot !== -1 ? originalName.substring(lastDot) : ".jpg";
  const fileName = `${name}-thumb${ext}`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  
  // Trigger klik otomatis
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Helper: Update Informasi Ukuran
function updateStats(originalBytes, compressedBytes) {
  DOM.origSize.textContent = readableBytes(originalBytes);
  DOM.compSize.textContent = readableBytes(compressedBytes);

  const savedPercent = Math.max(0, ((originalBytes - compressedBytes) / originalBytes) * 100).toFixed(1);
  DOM.savedRatio.textContent = `-${savedPercent}%`;

  DOM.infoCard.classList.remove("hidden");
}

function readableBytes(bytes) {
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// Inisialisasi
document.addEventListener("DOMContentLoaded", initEvents);