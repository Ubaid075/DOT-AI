import { GoogleGenAI } from "@google/genai";

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9', resolution: string): Promise<string> => {
  try {
    // Note: The 'resolution' parameter is included for UI purposes as requested,
    // but the 'imagen-4.0-generate-001' model API does not currently support
    // a direct resolution setting. The output size is determined by the model
    // and the specified aspect ratio.
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No images were generated.");
    }
  } catch (error: any) {
    console.error("Error generating image with Gemini API:", error);
    let userMessage = "An unexpected error occurred. Please try again. If the issue continues, please contact support.";
    
    if (error && error.message) {
      const errorMessage = error.message.toLowerCase();

      // Content Policy Violation (User Actionable)
      if (errorMessage.includes('prompt was blocked')) {
        userMessage = "Your prompt could not be processed due to content policy restrictions. Please revise your prompt to align with our safety guidelines.";
      } 
      // API Quota/Capacity Issues (User Actionable: Wait)
      else if (errorMessage.includes('resource has been exhausted') || errorMessage.includes('quota')) {
        userMessage = "We're experiencing high demand right now, and the service is at capacity. Please try your request again in a few moments.";
      }
      // Invalid Prompt or Arguments (User Actionable: Revise)
      else if (errorMessage.includes('invalid')) {
         userMessage = "The request was invalid. This may be due to an unsupported format or unusual phrasing in your prompt. Please try simplifying or rephrasing your request.";
      }
      // Service/Infrastructure issues (Not User Actionable)
      else if (errorMessage.includes('api key not valid') || errorMessage.includes('server error') || errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
        userMessage = "The image generation service is temporarily unavailable. We're working to resolve the issue. Please try again in a little while.";
      }
    }
    
    throw new Error(userMessage);
  }
};
