import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for image uploads
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Extract timetable from image endpoint
  app.post('/api/gemini/extract-timetable', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', existingClasses = [] } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'لم يتم إرسال صورة الجدول' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم. يرجى التأكد من إضافة GEMINI_API_KEY في إعدادات التطبيق.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

      const classContext = existingClasses && existingClasses.length > 0
        ? `الفصول المسجلة حالياً في النظام هي:\n${existingClasses.map((c: any) => `- ${c.name}`).join('\n')}\nيرجى مطابقة الفصول الموجودة في الصورة مع هذه الأسماء إن أمكن.`
        : '';

      const prompt = `أنت مساعد خبير ومتخصص في قراءة وجدولة جداول الحصص المدرسية في المملكة العربية السعودية والوطن العربي.
المطلوب منك تحليل صورة جدول الحصص الأسبوعي للمعلم/المعلمة واستخراج جميع الحصص بدقة متناهية.

${classContext}

أيام الأسبوع وترقيمها في النظام:
- الأحد (Sunday): dayOfWeek = 0
- الإثنين (Monday): dayOfWeek = 1
- الثلاثاء (Tuesday): dayOfWeek = 2
- الأربعاء (Wednesday): dayOfWeek = 3
- الخميس (Thursday): dayOfWeek = 4

أرقام الحصص (periodNumber): من 1 إلى 8 (الحصة الأولى = 1، الحصة الثانية = 2، إلخ).

تعليمات الاستخراج:
1. اقرأ كل خلية في الجدول: إذا كانت الخلية تحتوي على اسم فصل دراسي (مثل: 1/1، أول/1، أول ثانوي 1، خامس أ، 3/2، بدنية، إلخ) أو مادة/صف لمعلم التربية البدنية، استخرجها.
2. إذا كانت الخلية فارغة أو استراحة أو فسحة أو صلاة أو لا يوجد بها حصة، لا تضفها في قائمة الحصص (entries).
3. استخرج اسم الفصل كما هو واضح أو موحد (مثال: "أول/1", "ثاني/2", "ثالث/1", "خامس/أ").
4. إذا وُجدت أوقات الحصص (بداية ونهاية الحصة مثل 07:00 إلى 07:45)، استخرجها في مصفوفة periodTimes.
5. أعد النتيجة بتنسيق JSON حصراً بدون أي كتل نصية أخرى، بالهيكل التالي:

\`\`\`json
{
  "entries": [
    {
      "dayOfWeek": 0,
      "periodNumber": 1,
      "className": "أول/1"
    }
  ],
  "detectedClasses": ["أول/1", "ثاني/1"],
  "periodTimes": [
    {
      "periodNumber": 1,
      "startTime": "07:00",
      "endTime": "07:45"
    }
  ],
  "summary": "تم استخراج الجدول بنجاح"
}
\`\`\``;

      // Models to try in order of preference with fallback handling for 503 / high demand
      const candidateModels = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let responseText = '';
      let lastError: any = null;

      for (const modelName of candidateModels) {
        let attempts = 0;
        const maxAttempts = 2;
        let success = false;

        while (attempts < maxAttempts && !success) {
          try {
            attempts++;
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: cleanBase64,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            });

            responseText = response.text || '';
            if (responseText.trim()) {
              success = true;
              break;
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err?.message || String(err);
            const isTransient =
              errMsg.includes('503') ||
              errMsg.includes('UNAVAILABLE') ||
              errMsg.includes('429') ||
              errMsg.includes('high demand') ||
              errMsg.includes('RESOURCE_EXHAUSTED');

            console.warn(`Attempt ${attempts} failed for model ${modelName}:`, errMsg);

            if (isTransient && attempts < maxAttempts) {
              // Wait 1.2 seconds before retrying same model
              await new Promise((r) => setTimeout(r, 1200));
            } else {
              // Break inner loop to try next fallback model
              break;
            }
          }
        }

        if (success) {
          break;
        }
      }

      if (!responseText) {
        throw (
          lastError ||
          new Error('تعذر الحصول على استجابة من نموذج الذكاء الاصطناعي نظراً للضغط الحالي على الخدمة. يرجى المحاولة مرة أخرى.')
        );
      }
      
      // Extract JSON from response
      let jsonString = responseText.trim();
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0].trim();
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0].trim();
      }

      try {
        const parsed = JSON.parse(jsonString);
        return res.json({
          success: true,
          data: parsed,
        });
      } catch (parseErr) {
        console.error('JSON parsing error from Gemini output:', parseErr, responseText);
        return res.status(500).json({
          error: 'تعذر معالجة استجابة الذكاء الاصطناعي كبيانات جدولية منظمة',
          rawResponse: responseText,
        });
      }
    } catch (err: any) {
      console.error('Error in /api/gemini/extract-timetable:', err);
      return res.status(500).json({
        error: err?.message || 'حدث خطأ غير متوقع أثناء معالجة صورة الجدول',
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
