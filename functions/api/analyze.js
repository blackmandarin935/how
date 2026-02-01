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

function validateImageData(imageData) {
  if (!imageData || typeof imageData !== 'string') return { valid: false, error: '유효한 이미지 데이터가 아닙니다.' };
  const pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!pattern.test(imageData)) return { valid: false, error: '지원되는 이미지 형식이 아닙니다.' };
  const base64 = imageData.replace(pattern, '');
  try {
    const binary = atob(base64);
    if (binary.length > 10 * 1024 * 1024) return { valid: false, error: '이미지 크기는 10MB 이하여야 합니다.' };
    return { valid: true, mimeType: imageData.match(pattern)[1], base64 };
  } catch {
    return { valid: false, error: '잘못된 base64 형식입니다.' };
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json({ error: '서버 설정 오류: GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const { imageData } = await request.json();
    const validation = validateImageData(imageData);

    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { base64, mimeType } = validation;
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType: `image/${mimeType}`, data: base64 } },
          { text: PROMPT }
        ]
      }]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', errText);
      if (res.status === 429) {
        return Response.json({ error: 'API 사용량 초과. 잠시 후 다시 시도해주세요.' }, { status: 500 });
      }
      return Response.json({ error: '이미지 분석 중 오류가 발생했습니다.' }, { status: 500 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return Response.json(analysis);
    }

    return Response.json({
      objectName: '인식된 물건',
      usages: [{ title: '분석 결과', description: text || '분석 결과를 가져오지 못했습니다.' }]
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return Response.json(
      { error: err.message || '이미지 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
}
