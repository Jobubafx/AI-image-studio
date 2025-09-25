import type { Step } from './types';

// Fix: Removed explicit type annotation and added 'as const' to break circular type dependency.
export const ASPECT_RATIOS = {
  '1:1': { label: 'Square (1:1)', value: '1:1' },
  '16:9': { label: 'Landscape (16:9)', value: '16:9' },
  '9:16': { label: 'Portrait (9:16)', value: '9:16' },
  '4:3': { label: 'Standard (4:3)', value: '4:3' },
  '3:4': { label: 'Tall (3:4)', value: '3:4' },
} as const;

// Fix: Removed explicit type annotation and added 'as const' to break circular type dependency.
export const OUTPUT_TYPES = {
  'cinematic-poster': { label: 'Cinematic Poster' },
  'wedding-card': { label: 'Wedding Card' },
  'birthday-card': { label: 'Birthday Card' },
  'flier': { label: 'Flier' },
  'pinterest-pin': { label: 'Pinterest Pin' },
  'facebook-post': { label: 'Facebook Post' },
  'banner': { label: 'Banner' },
} as const;

export const WORKFLOW_STEPS: Step[] = [
  { id: 1, title: 'Upload Your Image', description: 'Start by uploading one or more images.' },
  { id: 2, title: 'Configure & Ideate', description: 'Set your design parameters and get creative ideas.' },
  { id: 3, title: 'Generate & Refine', description: 'Bring your vision to life and make adjustments.' },
];

export const REFINEMENT_SUGGESTIONS: string[] = [
    "Change the background to a futuristic cityscape at night.",
    "Add dramatic cinematic lighting from the left.",
    "Make the color palette warmer and more vibrant.",
    "Render the image in a detailed anime style.",
    "Add a subtle motion blur to create a sense of action.",
    "Change the subject's clothing to a steampunk aesthetic.",
    "Incorporate elements of watercolor painting.",
    "Add a text overlay that says 'DREAM BIG'.",
];