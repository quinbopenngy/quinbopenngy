import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Generous body limit to allow high-res photo uploads of medical receipts / MCs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientError(error: any): boolean {
  if (!error) return false;
  const errMsg = typeof error === 'string' ? error : error?.message || JSON.stringify(error);
  return (
    errMsg.includes('503') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('high demand') ||
    errMsg.includes('429') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('rate limit') ||
    errMsg.includes('temporarily') ||
    errMsg.includes('ECONNRESET') ||
    errMsg.includes('ETIMEDOUT')
  );
}

async function callGeminiOCRWithRetry(cleanBase64: string, mimeType: string) {
  const prompt = `You are a high-accuracy medical receipt, invoice, and Medical Certificate (MC) OCR extraction system.
Analyze the provided medical image carefully. The image could be:
- A medical clinic receipt or tax invoice
- A hospital / dental bill
- A Medical Certificate (MC / Sick Leave / Medical Leave Chit / Certificate of Attendance)

Extract the following required fields with high precision:
1. "employeeName": The full name of the employee or patient. On receipts look for "Patient:", "Name:", "Attn:", "Client:". On Medical Certificates (MC), look for "Patient's Name", "This is to certify that [Name]", or similar. If no name found, return "Unknown".
2. "clinicName": The name of the medical clinic, health center, hospital, dental surgery, or practitioner.
3. "subTotal": The pre-tax subtotal amount as a numeric value. If this is an MC without payment details, or if fees are not printed on this document, return 0.
4. "gst": The Goods and Services Tax (GST) or tax amount as a numeric value. If 0%, exempt, not stated, or on an MC without fees, return 0.
5. "grandTotal": The final total amount billed / paid as a numeric value. If this is an MC without billing details, return 0.
6. "illnessSummary": A clear, concise summary of the illness, diagnosis, medical symptoms, prescribed treatments, or reason for leave (e.g. "Acute Upper Respiratory Infection", "Routine Dental Scaling and Polishing", "Unfit for duty for 2 days due to Gastroenteritis", "General Practice Consultation for Migraine"). On an MC, extract the stated diagnosis or medical reason for unfit duty. If not explicitly printed, infer from consultation items/medicines or state "General Medical Consultation".
7. "currency": The currency code or symbol detected, e.g. "SGD", "USD", "MYR", "$", "€". Default to "$".
8. "receiptDate": Date of invoice/consultation/MC issuance in YYYY-MM-DD format if detected, otherwise as printed.
9. "receiptNumber": Receipt, invoice, tax bill, or MC certificate reference number if present.
10. "lineItems": A list of items or charges detected with description and amount.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      employeeName: { type: Type.STRING, description: "Name of employee or patient" },
      clinicName: { type: Type.STRING, description: "Name of clinic or medical center" },
      subTotal: { type: Type.NUMBER, description: "Sub-total before GST" },
      gst: { type: Type.NUMBER, description: "GST or tax amount" },
      grandTotal: { type: Type.NUMBER, description: "Grand total amount" },
      illnessSummary: { type: Type.STRING, description: "Summary of illness or diagnosis or MC reason" },
      currency: { type: Type.STRING, description: "Currency symbol or code" },
      receiptDate: { type: Type.STRING, description: "Consultation, receipt, or MC date" },
      receiptNumber: { type: Type.STRING, description: "Receipt or MC reference number" },
      lineItems: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
          },
        },
      },
    },
    required: [
      'employeeName',
      'clinicName',
      'subTotal',
      'gst',
      'grandTotal',
      'illnessSummary',
    ],
  };

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        const text = response.text || '{}';
        return JSON.parse(text);
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} attempt ${attempt} failed:`, err?.message || err);

        if (isTransientError(err) && attempt < maxRetries) {
          // Exponential backoff delay: 1.2s, 2.4s
          const backoffMs = attempt * 1200 + Math.floor(Math.random() * 400);
          console.log(`Retrying ${model} in ${backoffMs}ms due to high demand/rate limit...`);
          await sleep(backoffMs);
          continue;
        }

        // If not transient or last attempt for this model, break to try next fallback model
        break;
      }
    }
  }

  throw lastError;
}

app.post('/api/extract-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const parsedData = await callGeminiOCRWithRetry(cleanBase64, mimeType);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in receipt extraction:', error);

    let clientMessage = 'Failed to extract information from receipt.';
    const rawError = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));

    if (rawError.includes('503') || rawError.includes('high demand') || rawError.includes('UNAVAILABLE')) {
      clientMessage = 'AI model experienced a temporary high-demand spike. Please try again in a few moments.';
    } else if (rawError.includes('429') || rawError.includes('RESOURCE_EXHAUSTED')) {
      clientMessage = 'Rate limit reached. Please wait a few seconds before uploading again.';
    } else {
      // Try to parse error if it's a JSON string
      try {
        const parsed = JSON.parse(rawError);
        if (parsed.error?.message) {
          clientMessage = parsed.error.message;
        }
      } catch {
        if (error?.message) {
          clientMessage = error.message;
        }
      }
    }

    return res.status(500).json({
      error: clientMessage,
      isTransient: isTransientError(error),
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
