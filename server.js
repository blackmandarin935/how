// 실행 방법: npm install && npm start
// GEMINI_API_KEY 환경변수 필요 (.env 또는 터미널에서 설정)

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - connectSrc에 localhost 포함 (file://에서 접속 시)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:*", "http://127.0.0.1:*"]
    }
  }
}));

// CORS - Cloudflare Pages 및 로컬 개발 허용
const allowedOrigins = [
  'https://how-als.pages.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50, // limit each IP to 50 requests per windowMs
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
app.use(express.json({ limit: '20mb' }));

// OPTIONS preflight 명시적 처리
app.options('/api/analyze', (req, res) => res.sendStatus(204));

app.use(express.static('.'));

let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

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

// Helper function to validate base64 image
function validateBase64Image(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    return { valid: false, error: '유효한 이미지 데이터가 아닙니다.' };
  }

  // Check if it's a data URL
  const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!dataUrlPattern.test(imageData)) {
    return { valid: false, error: '지원되는 이미지 형식이 아닙니다.' };
  }

  // Extract and validate base64 content
  const base64Content = imageData.replace(dataUrlPattern, '');
  
  // Check if base64 is valid
  try {
    const buffer = Buffer.from(base64Content, 'base64');
    if (buffer.length === 0) {
      return { valid: false, error: '이미지 내용이 비어있습니다.' };
    }
    
    // Check size limit (10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return { valid: false, error: '이미지 크기는 10MB 이하여야 합니다.' };
    }
    
    return { valid: true, mimeType: imageData.match(dataUrlPattern)[1] };
  } catch (error) {
    return { valid: false, error: '잘못된 base64 형식입니다.' };
  }
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { imageData, mimeType } = req.body;

    // Input validation
    if (!imageData) {
      return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
    }

    // Validate API key
    if (!ai || !process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ error: '서버 설정 오류: .env 파일에 GEMINI_API_KEY를 설정해주세요.' });
    }

    // Validate API key format
    if (!process.env.GEMINI_API_KEY.startsWith('AIza') || process.env.GEMINI_API_KEY.length < 35) {
      console.error('Invalid GEMINI_API_KEY format');
      return res.status(500).json({ error: '서버 설정 오류: 유효하지 않은 API 키 형식입니다.' });
    }

    // Validate image data
    const imageValidation = validateBase64Image(imageData);
    if (!imageValidation.valid) {
      return res.status(400).json({ error: imageValidation.error });
    }

    // base64에서 data:image/...;base64, 접두사 제거
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const detectedMimeType = `image/${imageValidation.mimeType}`;

    const tools = [{ googleSearch: {} }];

    const config = {
      thinkingConfig: {
        thinkingLevel: 'HIGH',
      },
      tools,
    };

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: detectedMimeType,
              data: base64Data,
            },
          },
          {
            text: PROMPT,
          },
        ],
      },
    ];

    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return res.json(analysis);
    }

    return res.json({
      objectName: '인식된 물건',
      usages: [
        { title: '분석 결과', description: fullText || '분석 결과를 가져오지 못했습니다.' },
      ],
    });
  } catch (error) {
    console.error('Analysis error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Don't expose internal error details to client
    let errorMessage = '이미지 분석 중 오류가 발생했습니다.';
    
    // Check for specific Gemini API errors
    if (error.message?.includes('API key')) {
      errorMessage = 'API 인증 오류가 발생했습니다. 관리자에게 문의하세요.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API 사용량 초과. 잠시 후 다시 시도해주세요.';
    } else if (error.message?.includes('content')) {
      errorMessage = '이미지 내용 처리 오류가 발생했습니다.';
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '설정됨' : '미설정');
});
