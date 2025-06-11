const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const statusDiv = document.getElementById('status');

uploadButton.addEventListener('click', async () => {
    const files = fileInput.files;
    if (files.length === 0) {
        statusDiv.textContent = 'Lütfen en az bir dosya seçin.';
        statusDiv.style.color = 'red';
        return;
    }

    // Sadece resim dosyalarını kontrol et
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = Array.from(files).filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
        statusDiv.textContent = 'Lütfen sadece resim dosyaları seçin (JPG, PNG, GIF, WebP).';
        statusDiv.style.color = 'red';
        return;
    }

    // FormData, dosyaları göndermek için kullanılır
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file); // 'files' anahtarı backend'deki upload.array('files') ile eşleşmeli
    }

    statusDiv.textContent = `${files.length} dosya yükleniyor... Lütfen bekleyin.`;
    statusDiv.style.color = 'blue';

    try {
        console.log('Upload isteği gönderiliyor:', files.length, 'dosya');
        
        // Backend'in çalıştığı adrese POST isteği gönderiyoruz
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        console.log('Response status:', response.status);
        const resultText = await response.text();
        console.log('Response text:', resultText);

        if (response.ok) {
            statusDiv.innerHTML = `✅ ${resultText}<br><small>Dosyalar Google Drive'a yüklendi!</small>`;
            statusDiv.style.color = 'green';
            fileInput.value = ''; // Yükleme sonrası dosya listesini temizle
        } else {
            // Server hatası durumunda daha detaylı bilgi göster
            let errorMessage = `❌ Sunucu Hatası (${response.status}): ${resultText}`;
            
            if (response.status === 500) {
                errorMessage += '<br><small>Google Drive bağlantısında sorun olabilir. Lütfen site yöneticisine haber verin.</small>';
            }
            
            statusDiv.innerHTML = errorMessage;
            statusDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Upload hatası:', error);
        statusDiv.innerHTML = `❌ Bağlantı hatası: ${error.message}<br><small>İnternet bağlantınızı kontrol edin.</small>`;
        statusDiv.style.color = 'red';
    }
});

// Test butonu ekle (geliştirme için)
const testButton = document.createElement('button');
testButton.textContent = 'Sunucu Testi';
testButton.style.marginLeft = '10px';
testButton.onclick = async () => {
    try {
        const response = await fetch('/test');
        const data = await response.json();
        alert('Sunucu çalışıyor: ' + data.message);
    } catch (error) {
        alert('Sunucu testi başarısız: ' + error.message);
    }
};
document.querySelector('.container').appendChild(testButton);