document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('fileInput');
    const statusMsg = document.getElementById('upload-status');
    const statsElements = {
        pending: document.getElementById('stat-pending'),
        sent: document.getElementById('stat-sent'),
        failed: document.getElementById('stat-failed'),
        total: document.getElementById('stat-total')
    };

    // Drag & Drop Events
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    function handleFileUpload(file) {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            showStatus('Please upload a CSV file.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        showStatus('Uploading...', 'normal');

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showStatus(data.error, 'error');
                } else {
                    showStatus(data.message, 'success');
                    fetchStats(); // Update stats immediately
                }
            })
            .catch(error => {
                showStatus('Upload failed. Please try again.', 'error');
                console.error(error);
            });
    }

    function showStatus(message, type) {
        statusMsg.textContent = message;
        statusMsg.className = 'status-msg'; // Reset
        if (type === 'error') statusMsg.style.color = 'var(--error)';
        else if (type === 'success') statusMsg.style.color = 'var(--success)';
        else statusMsg.style.color = 'var(--text-secondary)';
    }

    function fetchStats() {
        fetch('/api/stats')
            .then(response => response.json())
            .then(data => {
                statsElements.pending.textContent = data.PENDING || 0;
                statsElements.sent.textContent = data.SENT || 0;
                statsElements.failed.textContent = data.FAILED || 0;
                statsElements.total.textContent = data.TOTAL || 0;
            })
            .catch(console.error);
    }

    // Poll stats every 5 seconds
    fetchStats();
    setInterval(fetchStats, 5000);
});
