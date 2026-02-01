import { useState, useCallback } from 'react';

const PROMPT = `이 이미지에 있는 물건의 이름과 쓰임새를 분석해주세요.

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "objectName": "물건의 한국어 이름",
  "usages": [
    { "title": "용도 제목", "description": "설명" },
    { "title": "용도 제목", "description": "설명" },
    { "title": "용도 제목", "description": "설명" }
  ]
}

3가지 이상의 다양한 사용 방법을 알려주세요.`;

function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') return 'http://localhost:8788';
  return '';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
}

async function analyzeImage(imageData, mimeType) {
  const apiBase = getApiBase();
  const apiUrl = apiBase ? `${apiBase}/api/analyze` : '/api/analyze';

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData, mimeType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || '분석 요청 실패');
  }
  return res.json();
}

export default function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showUpload, setShowUpload] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleFile = useCallback((file) => {
    if (!file?.type?.startsWith('image/')) {
      showError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }
    setCurrentFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUpload(false);
    setShowPreview(true);
    setResult(null);
  }, [showError]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!currentFile) {
      showError('분석할 이미지가 없습니다.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageData = await fileToBase64(currentFile);
      const mimeType = currentFile.type || 'image/jpeg';
      const analysis = await analyzeImage(imageData, mimeType);
      setResult(analysis);
      setShowPreview(false);
    } catch (err) {
      console.error(err);
      const msg = err.message === 'Failed to fetch'
        ? '서버에 연결할 수 없습니다. Cloudflare Pages 배포 후 환경 변수를 확인하세요.'
        : '이미지 분석 중 오류: ' + err.message;
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCurrentFile(null);
    setPreviewUrl('');
    setShowUpload(true);
    setShowPreview(false);
    setResult(null);
  };

  return (
    <div className="container">
      <header>
        <h1>📸 물건 쓰임새 분석기</h1>
        <p>사진을 찍으면 물건의 쓰임새를 알려드립니다</p>
      </header>

      <main>
        <div className="info-section">
          <div className="info-container">
            <div className="info-icon">🚀</div>
            <h3>Google Gemini AI 이미지 분석</h3>
            <p>Cloudflare Pages + Functions로 배포. 환경 변수로 API 키 설정</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showUpload && (
          <div className="upload-section">
            <div
              className="upload-area"
              onClick={() => document.getElementById('fileInput')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={handleDrop}
            >
              <div className="upload-content">
                <div className="upload-icon">📷</div>
                <p className="upload-text">사진을 여기에 드래그하거나 클릭하여 선택하세요</p>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  capture="camera"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button type="button" className="upload-btn" onClick={(e) => { e.stopPropagation(); document.getElementById('fileInput')?.click(); }}>
                  파일 선택
                </button>
              </div>
            </div>
          </div>
        )}

        {showPreview && (
          <div className="preview-section">
            <div className="image-container">
              <img src={previewUrl} alt="미리보기" className="preview-image" />
              <button type="button" className="remove-btn" onClick={() => { reset(); setShowUpload(true); }}>✕</button>
            </div>
            <button type="button" className="analyze-btn" onClick={handleAnalyze}>🔍 쓰임새 분석하기</button>
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <div className="spinner" />
            <p>이미지를 분석 중입니다...</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2>📋 분석 결과</h2>
            <div className="result-content">
              <div className="object-info">
                <h3>🔍 인식된 물건</h3>
                <div className="object-name">{result.objectName}</div>
                <h3>💡 사용 방법</h3>
                <ul className="usage-list">
                  {result.usages?.map((u, i) => (
                    <li key={i}>
                      <div className="usage-title">{u.title}</div>
                      <div className="usage-description">{u.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button type="button" className="new-analysis-btn" onClick={reset}>📷 새로운 사진 분석하기</button>
          </div>
        )}
      </main>
    </div>
  );
}
