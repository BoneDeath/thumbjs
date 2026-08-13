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
  processBtn: document.getElementById("process-btn"),
  canvas: document.getElementById("canvas"),
  ctx: document.getElementById("canvas").getContext("2d"),
  infoCard: document.getElementById("info-card"),
  origSize: document.getElementById("orig-size"),
  compSize: document.getElementById("comp-size"),
  savedRatio: document.getElementById("saved-ratio")
};

// Inisialisasi Event Listener
function initEvents() {
  DOM.fileInput.addEventListener("change", handleFileSelect);
  DOM.qualityRange.addEventListener("input", (e) => {
    DOM.qualityVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  // Drag & Drop
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

  DOM.processBtn.addEventListener("click", processAndDownload);
}

// Event Handler: File Dipilih
async function handleFileSelect() {
  const file = DOM.fileInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Harap pilih file gambar yang valid!");
    return;
  }

  currentFile = file;
  DOM.processBtn.disabled = false;

  // Render preview pertama kali
  await renderImage();
}

// Render Gambar ke Canvas
async function renderImage() {
  if (!currentFile) return;

  try {
    const img = await loadImage(URL.createObjectURL(currentFile));
    if (!bgImageCache) {
      bgImageCache = await loadImage(CONFIG.BG_IMAGE_URL).catch(() => null);
    }

    const maxW = parseInt(DOM.maxWidth.value) || 1200;
    const maxH = parseInt(DOM.maxHeight.value) || 1200;
    const [newWidth, newHeight] = calculateSize(img, maxW, maxH);

    // Set Ukuran Canvas Tetap
    DOM.canvas.width = CONFIG.CANVAS_SIZE;
    DOM.canvas.height = CONFIG.CANVAS_SIZE;

    // Clear Canvas
    DOM.ctx.clearRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);

    // Draw Background Frame (jika ada, jika tidak pakai warna solid putih)
    if (bgImageCache) {
      DOM.ctx.drawImage(bgImageCache, 0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
    } else {
      DOM.ctx.fillStyle = "#ffffff";
      DOM.ctx.fillRect(0, 0, CONFIG.CANVAS_SIZE, CONFIG.CANVAS_SIZE);
    }

    // Draw Main Scaled Image (Center Alignment)
    drawImageCentered(DOM.ctx, img, newWidth, newHeight);

    URL.revokeObjectURL(img.src);
  } catch (error) {
    console.error("Gagal memproses gambar:", error);
    alert("Terjadi kesalahan saat memuat gambar.");
  }
}

// Proses Kompresi dan Auto-Download
async function processAndDownload() {
  await renderImage(); // Pastikan state canvas terbaru

  const quality = parseFloat(DOM.qualityRange.value);

  DOM.canvas.toBlob((blob) => {
    if (!blob) return;

    // Update UI Stats
    updateStats(currentFile.size, blob.size);

    // Trigger Download
    downloadBlob(blob, currentFile.name);
  }, CONFIG.MIME_TYPE, quality);
}

// Helper: Menghitung Proporsi Gambar (Aspect Ratio)
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

// Helper: Posisikan Gambar di Tengah Canvas
function drawImageCentered(ctx, img, width, height) {
  const canvas = ctx.canvas;
  const centerX = (canvas.width - width) / 2;
  // Offset vertikal khusus sesuai kalkulasi awal (-3.5%)
  const centerY = (canvas.height - height) / 2 - (canvas.height / 100) * 3.5;

  ctx.drawImage(img, centerX, centerY, width, height);
}

// Helper: Load Image Async
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

// Helper: Download File
function downloadBlob(blob, originalName) {
  const lastDot = originalName.lastIndexOf(".");
  const name = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
  const ext = lastDot !== -1 ? originalName.substring(lastDot) : ".jpg";
  const fileName = `${name}-thumb${ext}`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Helper: Tampilkan Ukuran File & Rasio
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

// Jalankan saat DOM SIAP
document.addEventListener("DOMContentLoaded", initEvents);