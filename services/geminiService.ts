import { GoogleGenAI } from "@google/genai";
import { ShotDefinition, ProductAnalysisResult, AspectRatio } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getBase64Data = (base64String: string): string => {
  if (base64String.includes(',')) {
    return base64String.split(',')[1];
  }
  return base64String;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// specialized analysis for images using gemini-2.5-flash (multimodal)
export const analyzeProduct = async (sourceImageBase64: string): Promise<ProductAnalysisResult> => {
  try {
    const cleanBase64 = getBase64Data(sourceImageBase64);
    
    // Using gemini-2.5-flash for robust, available multimodal analysis
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this image and provide a JSON output. STRICTLY JSON.
            1. Identify the specific product or subject name.
            2. Provide a concise but detailed visual description of the subject (colors, materials, features, pose if human).
            3. Identify the category.
            4. Detect if the subject is a human (true/false).
            5. Evaluate framing quality for a portrait/product shot: 'ok', 'too_far' (subject too small), 'cut_off' (important parts missing), or 'empty'.
            
            Output format:
            {
              "productName": "string",
              "description": "string",
              "category": "string",
              "confidence": number,
              "isHuman": boolean,
              "framingQuality": "string",
              "recommendations": ["string"]
            }`
          },
        ],
      },
    });

    const text = response.text || '';
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const result = JSON.parse(jsonStr);
      return {
        productName: result.productName || 'Subject',
        description: result.description || 'A detailed shot of the subject.',
        category: result.category || 'general',
        confidence: result.confidence || 0.8,
        isHuman: result.isHuman,
        framingQuality: result.framingQuality || 'ok',
        recommendations: result.recommendations || []
      };
    } catch (e) {
      console.warn("Failed to parse analysis JSON", e);
      return {
        productName: 'Subject',
        description: 'A detailed shot of the subject.',
        category: 'general',
        confidence: 0,
        recommendations: []
      };
    }

  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      productName: 'Subject',
      description: 'A detailed shot of the subject.',
      category: 'general',
      confidence: 0,
      recommendations: []
    };
  }
};

// Map unsupported aspect ratios to nearest Gemini supported ratio
// Gemini 2.5 Flash Image supports: '1:1', '3:4', '4:3', '9:16', '16:9'
const mapToGeminiAspectRatio = (ratio: AspectRatio): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
  switch (ratio) {
    case '2:3': return '3:4';
    case '3:2': return '4:3';
    case '21:9': return '16:9';
    default: return ratio as any;
  }
};

// Generate shot using gemini-2.5-flash-image
export const generateShot = async (
  sourceImageBase64: string, 
  shotDef: ShotDefinition,
  productName: string,
  productDescription: string,
  aspectRatio: AspectRatio = '3:4'
): Promise<string> => {
  
  const cleanBase64 = getBase64Data(sourceImageBase64);
  
  // Construct a rich prompt combining the shot definition and the visual description
  const template = shotDef.promptTemplate.replace(/\[PRODUCT\]/g, productName);
  const fullPrompt = `${template}
  
  SUBJECT VISUAL DETAILS: ${productDescription}.
  
  Ensure the subject matches these visual details exactly. High resolution, photorealistic.`;

  // Switching to gemini-2.5-flash-image as it is widely available and supports image generation/editing
  const modelId = 'gemini-2.5-flash-image'; 
  const MAX_RETRIES = 3;
  let attempt = 0;

  const validAspectRatio = mapToGeminiAspectRatio(aspectRatio);

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: fullPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio
          }
        }
      });

      // Gemini 2.5 Flash Image returns image in the response parts
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/jpeg;base64,${part.inlineData.data}`;
          }
        }
      }

      throw new Error("No image data found in response");

    } catch (error: any) {
      const isRateLimit = error.status === 429 || 
                          error.code === 429 ||
                          (error.message && error.message.includes('429')) || 
                          (error.message && error.message.includes('RESOURCE_EXHAUSTED'));

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt + 1) * 1000; 
        console.warn(`Rate limit hit for ${shotDef.id}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
        await wait(delay);
        attempt++;
        continue;
      }

      console.error(`Error generating shot ${shotDef.id}:`, error);
      throw error;
    }
  }
  throw new Error(`Failed to generate shot ${shotDef.id} after ${MAX_RETRIES} retries`);
};

// Edit existing shot using gemini-2.5-flash-image
export const editShot = async (
  productName: string,
  productDescription: string,
  shotDef: ShotDefinition,
  editPrompt: string,
  aspectRatio: AspectRatio = '3:4'
): Promise<string> => {
  
  // Construct a prompt that includes the original context PLUS the edit instruction
  const template = shotDef.promptTemplate.replace(/\[PRODUCT\]/g, productName);
  const fullPrompt = `${template}
  
  SUBJECT DETAILS: ${productDescription}
  
  MODIFICATION REQUEST: ${editPrompt}
  
  Apply this modification strictly while maintaining photorealism.`;

  const modelId = 'gemini-2.5-flash-image';
  const validAspectRatio = mapToGeminiAspectRatio(aspectRatio);
  
  try {
     const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/jpeg;base64,${part.inlineData.data}`;
          }
        }
      }
    throw new Error("No image returned from edit");
  } catch (error) {
    console.error("Error editing shot:", error);
    throw error;
  }
};