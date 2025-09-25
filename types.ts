
import type { ASPECT_RATIOS, OUTPUT_TYPES } from './constants';

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

export interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
}

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;
export type OutputTypeKey = keyof typeof OUTPUT_TYPES;

export type Step = {
  id: number;
  title: string;
  description: string;
};
