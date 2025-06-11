const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const statusDiv = document.getElementById('status');
const uploadArea = document.getElementById('upload-area');
const filePreview = document.getElementById('file-preview');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');

let selectedFiles = [];

// Drag & Drop functionality
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    selectedFiles = Array.from(files);
    updateFilePreview();
    
    if (selectedFiles.length > 0) {
        uploadButton.textContent = `💕 ${selectedFiles.length} Anı Paylaş 💕`;
    } else {
        uploadButton.textContent = '💕 Anıları Paylaş 💕';
    }
}

function updateFilePreview() {
    filePreview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        const icon = file.type.startsWith('video/') ? '🎥' : '📷';
        fileItem.textContent = `${icon} ${file.name}`;
        filePreview.appendChild(fileItem);
    });
}

function showStatus(message, type = 'loading') {
    statusDiv.className = `status show ${type}`;
    statusDiv.innerHTML = message;
}

function hideStatus() {
    statusDiv.className = 'status';
}

function showProgress(percent) {
    progressBar.classList.add('show');
    progressFill.style.width = percent + '%';
}

function hideProgress() {
    progressBar.classList.remove('show');
    progressFill.style.width = '0%';
}

uploadButton.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        showStatus('💔 Lütfen en az bir dosya seçin', 'error');
        setTimeout(hideStatus, 3000);
        return;
    }

    // Resim ve video dosyalarını kontrol et
    const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
        'video/quicktime', 'video/x-msvideo', 'video/3gpp', 'video/3gpp2'  // iPhone/iOS uyumluluğu için
    ];
    
    // Debug: Dosya türlerini console'a yazdır
    selectedFiles.forEach(file => {
        console.log(`Dosya: ${file.name}, Tür: ${file.type}, Boyut: ${file.size}`);
    });
    
    const invalidFiles = selectedFiles.filter(file => {
        // Video veya resim dosyası mı kontrol et
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/') || validTypes.includes(file.type);
        return !(isImage || isVideo);
    });
    
    if (invalidFiles.length > 0) {
        console.log('Geçersiz dosyalar:', invalidFiles.map(f => ({ name: f.name, type: f.type })));
        showStatus('📸🎥 Lütfen sadece resim veya video dosyaları seçin (JPG, PNG, GIF, WebP, MP4, AVI, MOV)', 'error');
        setTimeout(hideStatus, 3000);
        return;
    }

    // FormData, dosyaları göndermek için kullanılır
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    showStatus(`💕 ${selectedFiles.length} dosya yükleniyor... Lütfen bekleyin`, 'loading');
    showProgress(0);

    // Fake progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        showProgress(progress);
    }, 500);

    try {
        console.log('Upload isteği gönderiliyor:', selectedFiles.length, 'dosya');
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        clearInterval(progressInterval);
        showProgress(100);

        console.log('Response status:', response.status);
        const resultText = await response.text();
        console.log('Response text:', resultText);

        if (response.ok) {
            showStatus(`🎉 ${resultText}<br><small>✨ Anılarınız Google Drive'a başarıyla eklendi! Teşekkür ederiz 💕</small>`, 'success');
            
            // Reset form
            selectedFiles = [];
            fileInput.value = '';
            updateFilePreview();
            uploadButton.textContent = '💕 Anıları Paylaş 💕';
            
            // Confetti effect (simulate)
            setTimeout(() => {
                document.body.style.animation = 'none';
                document.body.offsetHeight; // Trigger reflow
                document.body.style.animation = 'confetti 2s ease-out';
            }, 500);
            
        } else {
            let errorMessage = `💔 Sunucu Hatası (${response.status}): ${resultText}`;
            
            if (response.status === 500) {
                errorMessage += '<br><small>🔧 Google Drive bağlantısında sorun olabilir. Lütfen daha sonra tekrar deneyin.</small>';
            }
            
            showStatus(errorMessage, 'error');
        }
        
        setTimeout(hideProgress, 2000);
        
    } catch (error) {
        clearInterval(progressInterval);
        hideProgress();
        console.error('Upload hatası:', error);
        showStatus(`💔 Bağlantı hatası: ${error.message}<br><small>📶 İnternet bağlantınızı kontrol edin ve tekrar deneyin.</small>`, 'error');
    }
});

// Add some nice effects
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add entrance animation delay
    setTimeout(() => {
        document.querySelector('.container').style.transform = 'translateY(0)';
        document.querySelector('.container').style.opacity = '1';
    }, 100);
});

// Add confetti animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes confetti {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);