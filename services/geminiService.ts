// Fix: Added 'Type' to imports for response schema.
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import type { ImageFile, OutputTypeKey } from '../types';
import { OUTPUT_TYPES } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development. In a real Vercel deployment, the app would fail to build or run if the env var is missing.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            resolve(''); // Should not happen with readAsDataURL
        }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateCreativeConcepts = async (images: ImageFile[], outputType: OutputTypeKey, topic?: string) => {
  const outputTypeName = OUTPUT_TYPES[outputType].label;

  let prompt = `Generate a detailed, creative, and professional concept for a ${outputTypeName}. The concept should be at least 300 characters long and describe a unique, high-quality studio design idea. Describe the mood, color palette, potential text overlays, and overall composition. The final output should be suitable for a high-end design project.`;

  if (images.length > 0) {
    prompt = `Analyze the provided image(s). ${prompt}`;
  } else if (topic) {
    prompt = `${prompt} The concept should be based on the topic: "${topic}".`;
  } else {
    return "Please provide an image or a topic to generate ideas.";
  }
  
  const imageParts = await Promise.all(images.map(img => fileToGenerativePart(img.file)));

  const contents = { parts: [...imageParts, { text: prompt }] };
  // Fix: Updated to use the recommended ai.models.generateContent API.
  const response: GenerateContentResponse = await ai.models.generateContent({ 
    model: 'gemini-2.5-flash',
    contents 
  });

  return response.text;
};

export const removeBackground = async (image: ImageFile): Promise<string> => {
  const imagePart = await fileToGenerativePart(image.file);
  const promptPart = { text: "Critically important: Remove the background from the provided image. The new background must be transparent. Retain all details of the main subject. Output only the modified image as a PNG with a transparent background." };

  // Fix: Updated to use the recommended ai.models.generateContent API.
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts: [imagePart, promptPart] },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
  });

  const imageOutput = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
  if (imageOutput && imageOutput.inlineData) {
    return imageOutput.inlineData.data;
  }
  throw new Error("Failed to remove background.");
};

export const generateImage = async (prompt: string, outputType: OutputTypeKey, referenceImages: ImageFile[], aspectRatio: string): Promise<string> => {
    const outputTypeName = OUTPUT_TYPES[outputType].label;
    
    let generationPrompt: string;
    if (prompt) {
        generationPrompt = `Generate a high-quality, professional, upscaled, studio-quality, cinematic, premium image design based on the following concept: "${prompt}". The image should be in a ${aspectRatio} aspect ratio. If reference images are provided, use them as stylistic and compositional inspiration. Ensure the final image is clear, detailed, and visually stunning. The central subject should be the hero of the image, placed in an immersive, high-quality environment. Output only the generated image.`;
    } else {
        generationPrompt = `Based on the provided reference image(s), generate a new, high-quality, professional, upscaled, studio-quality, cinematic, premium image design in the style of a ${outputTypeName}. The new image should be in a ${aspectRatio} aspect ratio, using the reference image(s) for stylistic and compositional inspiration. Ensure the final result is a complete, clear, detailed, and visually stunning piece. Output only the generated image.`;
    }

    const imageParts = await Promise.all(referenceImages.map(img => fileToGenerativePart(img.file)));
    const promptPart = { text: generationPrompt };

    // Fix: Updated to use the recommended ai.models.generateContent API.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [...imageParts, promptPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
    });

    const imageOutput = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imageOutput && imageOutput.inlineData) {
      return imageOutput.inlineData.data;
    }
    throw new Error("Image generation failed.");
};

export const refineImage = async (baseImageBase64: string, prompt: string): Promise<string> => {
    const refinementPrompt = `Take the provided image and refine it based on the following instruction: "${prompt}". Apply the change while maintaining the overall quality and style of the original image. Output only the refined image.`;
    
    const imagePart = { inlineData: { data: baseImageBase64, mimeType: 'image/png' } };
    const promptPart = { text: refinementPrompt };

    // Fix: Updated to use the recommended ai.models.generateContent API.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, promptPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
    });

    const imageOutput = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imageOutput && imageOutput.inlineData) {
      return imageOutput.inlineData.data;
    }
    throw new Error("Image refinement failed.");
};

export const generateVideo = async (prompt: string, imageBase64: string, duration: number, animationStyle: string): Promise<string> => {
    const videoPrompt = `Based on the provided image and original concept, create a short, ${duration}-second video with high-quality, ${animationStyle} animation. Original concept: "${prompt}"`;

    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: videoPrompt,
        image: {
            imageBytes: imageBase64,
            mimeType: 'image/png',
        },
        config: {
            numberOfVideos: 1,
        }
    });

    // Poll for the result
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before checking again
        try {
            operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch(e) {
            console.error("Polling failed", e);
            throw new Error("Polling for video generation status failed.");
        }
    }

    // After polling, check if the operation resulted in an error.
    if ((operation as any).error) {
        const error = (operation as any).error;
        console.error('Video generation operation failed:', error);
        const errorMessage = error.message || 'Unknown error during video generation.';
        throw new Error(`Video generation failed: ${errorMessage}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (downloadLink) {
        return downloadLink;
    }

    // If the operation is done, has no error, but also no link, something is unexpected.
    console.error("Video generation completed, but no download link was found. Full operation object:", operation);
    throw new Error("Video generation failed to produce a valid link.");
};
