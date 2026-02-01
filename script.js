class ObjectAnalyzer {
    constructor() {
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.previewSection = document.getElementById('previewSection');
        this.previewImage = document.getElementById('previewImage');
        this.removeBtn = document.getElementById('removeBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultSection = document.getElementById('resultSection');
        this.resultContent = document.getElementById('resultContent');
        this.newAnalysisBtn = document.getElementById('newAnalysisBtn');
        this.currentFile = null;
    }

    bindEvents() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
        
        this.removeBtn.addEventListener('click', () => this.removeImage());
        this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
        this.newAnalysisBtn.addEventListener('click', () => this.resetToUpload());
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showError('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        this.currentFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.showPreview();
        };
        
        reader.onerror = () => {
            this.showError('이미지를 읽는 중 오류가 발생했습니다.');
        };
        
        reader.readAsDataURL(file);
    }

    showPreview() {
        this.uploadArea.parentElement.style.display = 'none';
        this.previewSection.style.display = 'block';
        this.hideLoading();
        this.hideResult();
    }

    removeImage() {
        this.currentFile = null;
        this.previewImage.src = '';
        this.fileInput.value = '';
        this.uploadArea.parentElement.style.display = 'block';
        this.previewSection.style.display = 'none';
        this.hideResult();
    }

    async analyzeImage() {
        if (!this.currentFile) {
            this.showError('분석할 이미지가 없습니다.');
            return;
        }

        this.showLoading();
        this.hideResult();

        try {
            const analysis = await this.performImageAnalysis(this.currentFile);
            this.showResult(analysis);
        } catch (error) {
            console.error('Analysis error:', error);
            const msg = error.message === 'Failed to fetch'
                ? '서버에 연결할 수 없습니다. 터미널에서 "npm start" 실행 후 http://localhost:3000 으로 접속하세요.'
                : '이미지 분석 중 오류가 발생했습니다: ' + error.message;
            this.showError(msg);
        } finally {
            this.hideLoading();
        }
    }

    getApiBase() {
        if (window.location.protocol === 'file:') {
            return 'http://localhost:3000';
        }
        return '';
    }

    async performImageAnalysis(file) {
        const imageData = await this.fileToBase64(file);
        const mimeType = file.type || 'image/jpeg';

        const apiUrl = `${this.getApiBase()}/api/analyze`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData, mimeType }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || '분석 요청 실패');
        }

        return response.json();
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    showResult(analysis) {
        const resultHTML = `
            <div class="object-info">
                <h3>🔍 인식된 물건</h3>
                <div class="object-name">${analysis.objectName}</div>
                
                <h3>💡 사용 방법</h3>
                <ul class="usage-list">
                    ${analysis.usages.map(usage => `
                        <li>
                            <div class="usage-title">${usage.title}</div>
                            <div class="usage-description">${usage.description}</div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        this.resultContent.innerHTML = resultHTML;
        this.resultSection.style.display = 'block';
    }

    showLoading() {
        this.loadingSection.style.display = 'block';
        this.previewSection.style.display = 'none';
    }

    hideLoading() {
        this.loadingSection.style.display = 'none';
    }

    hideResult() {
        this.resultSection.style.display = 'none';
    }

    resetToUpload() {
        this.currentFile = null;
        this.previewImage.src = '';
        this.fileInput.value = '';
        this.uploadArea.parentElement.style.display = 'block';
        this.previewSection.style.display = 'none';
        this.hideLoading();
        this.hideResult();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const main = document.querySelector('main');
        main.insertBefore(errorDiv, main.firstChild);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ObjectAnalyzer();
});