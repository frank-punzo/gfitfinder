import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ClothingItem, Product } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for models
const VISION_MODEL = "gemini-2.5-flash";
const SEARCH_MODEL = "gemini-2.5-flash"; // Using 2.5 flash for search as well, efficient and capable

/**
 * Analyzes an image to identify clothing items.
 */
export const analyzeImageWithGemini = async (
  base64Image: string,
  mimeType: string
): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
            {
              text: `Analyze this image and identify all clothing items visible. For each item, provide:
1. A detailed description of the item (style, color, material, brand if visible)
2. Estimated price range
3. Search terms that would help find this exact item online

Return the response in JSON format.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  color: { type: Type.STRING },
                  style: { type: Type.STRING },
                  estimatedPrice: { type: Type.STRING },
                  searchTerms: { type: Type.STRING },
                },
                required: ["name", "description", "color", "style", "estimatedPrice", "searchTerms"],
              },
            },
            overallStyle: { type: Type.STRING },
          },
          required: ["items", "overallStyle"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Searches for purchasable products using Google Search grounding.
 */
export const searchProductsWithGemini = async (
  item: ClothingItem
): Promise<Product[]> => {
  const searchQuery = `${item.searchTerms} buy online`;
  
  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: `For the clothing item described as "${item.description}" (Search terms: "${item.searchTerms}"), identify 3-4 major retailers that likely carry this style (e.g., Nordstrom, Amazon, ASOS, Zara, H&M, Revolve, Shopbop, etc.).

      For each retailer, construct a VALID search URL that searches for these specific keywords on their website. Do NOT try to find a specific product page URL (like /product/123), as these often break. Instead, create a search results page URL (like /search?q=keywords).

      Return a JSON object with a "products" array.
      
      Format:
      \`\`\`json
      {
        "products": [
          { 
            "title": "Search for [Item Name] at [Store]", 
            "store": "[Store Name]", 
            "price": "Check Price", 
            "url": "https://www.retailer.com/search?q=encoded+keywords", 
            "description": "Click to see available options at [Store Name]" 
          }
        ]
      }
      \`\`\`
      `,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) return [];

    // Extract JSON from Markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      if (parsed.products && Array.isArray(parsed.products)) {
        return parsed.products;
      }
    }

    return [];
  } catch (error) {
    console.error(`Gemini Search Error for ${item.name}:`, error);
    return [];
  }
};