const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const statusDiv = document.getElementById('status');
const uploadArea = document.getElementById('upload-area');
const filePreview = document.getElementById('file-preview');
const uploadProgressContainer = document.getElementById('upload-progress-container');

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
    
    selectedFiles.forEach((file) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        const icon = file.type.startsWith('video/') ? '🎥' : '📷';
        
        // Dosya boyutunu MB olarak formatla
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

        fileItem.innerHTML = `${icon} ${file.name} <span class="file-size">(${sizeInMB} MB)</span>`;
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

// Her bir dosyayı tek tek yükleyen fonksiyon
function uploadFile(file, index, totalFiles) {
    return new Promise((resolve, reject) => {
        // Her dosya için kendi progress barını oluştur
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';

        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-item-info';

        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-bar-container';
        const progressBarFill = document.createElement('div');
        progressBarFill.className = 'progress-bar-fill';
        progressBarContainer.appendChild(progressBarFill);
        
        const progressStatus = document.createElement('div');
        progressStatus.className = 'progress-item-status';
        progressStatus.textContent = '⏳'; // Bekliyor...

        progressItem.appendChild(progressStatus);
        progressItem.appendChild(progressInfo);
        
        // Dosya adı ve ilerleme çubuğunu yan yana koy
        const infoAndBar = document.createElement('div');
        infoAndBar.style.flexGrow = '1';
        const fileNameDiv = document.createElement('div');
        fileNameDiv.textContent = `[${index + 1}/${totalFiles}] ${file.name}`;
        infoAndBar.appendChild(fileNameDiv);
        infoAndBar.appendChild(progressBarContainer);
        progressInfo.appendChild(infoAndBar);


        uploadProgressContainer.appendChild(progressItem);

        const formData = new FormData();
        formData.append('files', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBarFill.style.width = percentComplete + '%';
                progressStatus.textContent = '📤'; // Yükleniyor...
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                progressBarFill.style.width = '100%';
                progressBarFill.style.backgroundColor = '#4caf50';
                progressStatus.textContent = '✅'; // Başarılı
                resolve(xhr.responseText);
            } else {
                progressStatus.textContent = '❌'; // Hata
                progressBarFill.style.backgroundColor = '#f44336';
                reject(new Error(`Sunucu Hatası (${xhr.status}): ${xhr.responseText}`));
            }
        };

        xhr.onerror = () => {
            progressStatus.textContent = '❌'; // Hata
            progressBarFill.style.backgroundColor = '#f44336';
            reject(new Error('Ağ hatası veya sunucuya ulaşılamıyor.'));
        };

        xhr.send(formData);
    });
}


uploadButton.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        showStatus('💔 Lütfen en az bir dosya seçin', 'error');
        setTimeout(hideStatus, 3000);
        return;
    }

    const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mov', 'video/quicktime', 'video/x-msvideo',
        'video/avi', 'video/wmv', 'video/flv', 'video/webm', 'video/3gpp', 'video/3gpp2'
    ];
    
    const invalidFiles = selectedFiles.filter(file => !validTypes.some(type => file.type.startsWith(type)));
    
    if (invalidFiles.length > 0) {
        console.log('Geçersiz dosyalar:', invalidFiles.map(f => ({ name: f.name, type: f.type })));
        showStatus('📸🎥 Lütfen sadece resim veya video dosyaları seçin.', 'error');
        setTimeout(hideStatus, 5000);
        return;
    }
    
    uploadButton.disabled = true;
    uploadButton.textContent = '⏳ Yükleniyor...';
    hideStatus();
    uploadProgressContainer.innerHTML = ''; // Önceki sonuçları temizle
    filePreview.innerHTML = ''; // Seçim önizlemesini temizle, yerini progress bar'lar alacak

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
            await uploadFile(file, i, selectedFiles.length);
            successCount++;
        } catch (error) {
            console.error(`Dosya yüklenemedi: ${file.name}`, error);
            errorCount++;
        }
    }
    
    // Kalıcı sonuç mesajı
    if (errorCount === 0) {
        showStatus(`🎉 Harika! ${successCount} anının tamamı başarıyla yüklendi. Teşekkür ederiz! 💕`, 'success');
    } else {
        showStatus(`💔 ${successCount} dosya yüklendi, ${errorCount} dosyada hata oluştu. Lütfen hatalı olanları (❌) tekrar yüklemeyi deneyin.`, 'error');
    }
    
    // Formu sıfırla ama sonuçları ekranda bırak
    uploadButton.disabled = false;
    uploadButton.textContent = '💕 Başka Anı Paylaş 💕';
    selectedFiles = [];
    fileInput.value = '';
});

// Add some nice effects
document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.style.scrollBehavior = 'smooth';
    setTimeout(() => {
        document.querySelector('.container').style.transform = 'translateY(0)';
        document.querySelector('.container').style.opacity = '1';
    }, 100);
});

// Stilleri CSS dosyasına taşımak daha iyi ama basitlik için burada
const style = document.createElement('style');
style.textContent = `
    .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px;
        background-color: #f9f9f9;
        border-radius: 5px;
        margin-bottom: 5px;
        font-size: 0.9rem;
    }
    .file-size {
        color: #666;
        font-style: italic;
    }
    @keyframes confetti {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);