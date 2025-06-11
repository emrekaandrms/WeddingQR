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

    // FormData, dosyaları göndermek için kullanılır
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file); // 'files' anahtarı backend'deki upload.array('files') ile eşleşmeli
    }

    statusDiv.textContent = 'Yükleniyor... Lütfen bekleyin.';
    statusDiv.style.color = 'blue';

    try {
        // Backend'in çalıştığı adrese POST isteği gönderiyoruz
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });

        const resultText = await response.text();

        if (response.ok) {
            statusDiv.textContent = resultText;
            statusDiv.style.color = 'green';
            fileInput.value = ''; // Yükleme sonrası dosya listesini temizle
        } else {
            statusDiv.textContent = `Hata: ${resultText}`;
            statusDiv.style.color = 'red';
        }
    } catch (error) {
        statusDiv.textContent = 'Sunucuya bağlanırken bir hata oluştu. Backend\'in çalıştığından emin olun.';
        statusDiv.style.color = 'red';
        console.error('Fetch Hatası:', error);
    }
});