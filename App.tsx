import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Uploader } from './components/Uploader';
import { ImagePreviewCard } from './components/ImagePreviewCard';
import { GalleryModal } from './components/GalleryModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { RefinementSuggestions } from './components/RefinementSuggestions';
import { VideoPlayer } from './components/VideoPlayer';
import { ArrowRightIcon, GalleryIcon, LightBulbIcon, SparklesIcon, WandIcon, PlusIcon, FilmIcon, RefreshIcon, DownloadIcon } from './components/Icons';
import * as geminiService from './services/geminiService';
import { ASPECT_RATIOS, OUTPUT_TYPES, WORKFLOW_STEPS, REFINEMENT_SUGGESTIONS } from './constants';
import type { ImageFile, GeneratedImage, AspectRatioKey, OutputTypeKey } from './types';

const ANIMATION_STYLES = [
  'subtle parallax',
  'gentle motion',
  'cinematic zoom in',
  'cinematic zoom out',
  'dolly left',
  'dolly right',
  'pan up',
  'pan down',
];

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<ImageFile[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('1:1');
  const [outputType, setOutputType] = useState<OutputTypeKey>('cinematic-poster');
  const [topic, setTopic] = useState('');
  const [creativeConcept, setCreativeConcept] = useState('');
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(4);
  const [animationStyle, setAnimationStyle] = useState('subtle parallax');
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefinementSuggestionsOpen, setIsRefinementSuggestionsOpen] = useState(false);
  
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isStartOverConfirmOpen, setIsStartOverConfirmOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const suggestionsButtonRef = useRef<HTMLButtonElement>(null);
  const refinementTextareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedImage = useMemo(() => 
    generatedImages.find(img => img.id === selectedImageId),
    [generatedImages, selectedImageId]
  );

  // Effect to clean up the object URL to prevent memory leaks
  useEffect(() => {
    const currentUrl = generatedVideoUrl;
    return () => {
        if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
        }
    };
  }, [generatedVideoUrl]);

  const handleFilesAdded = useCallback((files: ImageFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setProcessedFiles(prev => [...prev, ...files]);
    if (files.length > 0) {
      setStep(2);
    }
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    setProcessedFiles(prev => prev.filter(f => f.id !== id));
  }, []);
  
  const handleRemoveProcessedFile = useCallback((id: string) => {
    setProcessedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleRemoveBackground = async (image: ImageFile) => {
    setIsLoading(true);
    setLoadingMessage('Removing background...');
    try {
      const base64Image = await geminiService.removeBackground(image);
      const newFile = { ...image, previewUrl: `data:image/png;base64,${base64Image}` };
      setProcessedFiles(prev => prev.map(f => (f.id === image.id ? newFile : f)));
    } catch (error) {
      console.error("Background removal failed:", error);
      alert("Sorry, we couldn't remove the background. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCreativeIdeas = async () => {
    setIsLoading(true);
    setLoadingMessage('Generating creative concepts...');
    try {
      const concept = await geminiService.generateCreativeConcepts(processedFiles, outputType, topic);
      setCreativeConcept(concept);
    } catch (error) {
      console.error("Concept generation failed:", error);
      alert("Sorry, we couldn't generate ideas. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (processedFiles.length === 0 && !creativeConcept) {
        alert("Please upload an image or write a creative concept first.");
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Creating your masterpiece...');
    setGeneratedVideoUrl(null); // Reset video when generating a new image
    setStep(3);
    try {
        const base64Image = await geminiService.generateImage(creativeConcept, outputType, processedFiles, ASPECT_RATIOS[aspectRatio].value);
        const newImage: GeneratedImage = {
            id: `gen-${Date.now()}`,
            base64: base64Image,
            prompt: creativeConcept || `Generated ${OUTPUT_TYPES[outputType].label} from reference image(s).`,
        };
        setGeneratedImages(prev => [...prev, newImage]);
        setSelectedImageId(newImage.id);
    } catch (error) {
        console.error("Image generation failed:", error);
        alert("Sorry, we couldn't generate the image. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGenerateVariation = async () => {
    const sourceImage = selectedImage;
    if (!sourceImage) return;

    setIsLoading(true);
    setLoadingMessage('Crafting a new variation...');
    setGeneratedVideoUrl(null); // Reset video when generating a variation
    try {
        const base64Image = await geminiService.generateImage(sourceImage.prompt, outputType, processedFiles, ASPECT_RATIOS[aspectRatio].value);
        const newImage: GeneratedImage = {
            id: `gen-${Date.now()}`,
            base64: base64Image,
            prompt: sourceImage.prompt,
        };
        setGeneratedImages(prev => [...prev, newImage]);
        setSelectedImageId(newImage.id);
    } catch (error) {
        console.error("Variation generation failed:", error);
        alert("Sorry, we couldn't generate a variation. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRefineImage = async () => {
    const sourceImage = selectedImage;
    if (!sourceImage || !refinementPrompt) return;

    setIsLoading(true);
    setLoadingMessage('Refining your image...');
    setGeneratedVideoUrl(null); // Reset video when refining
    try {
        const base64Image = await geminiService.refineImage(sourceImage.base64, refinementPrompt);
        const newImage: GeneratedImage = {
            id: `gen-${Date.now()}`,
            base64: base64Image,
            prompt: `Refined from original prompt "${sourceImage.prompt}" with: ${refinementPrompt}`,
        };
        setGeneratedImages(prev => [...prev, newImage]);
        setSelectedImageId(newImage.id);
        setRefinementPrompt('');
    } catch (error) {
        console.error("Image refinement failed:", error);
        alert("Sorry, we couldn't refine the image. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    const sourceImage = selectedImage;
    if (!sourceImage) return;

    setIsLoading(true);
    setLoadingMessage('Generating video... This can take a few minutes.');
    try {
        const downloadLink = await geminiService.generateVideo(sourceImage.prompt, sourceImage.base64, videoDuration, animationStyle);
        
        // The API key is required to download the video from the returned URI
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        setGeneratedVideoUrl(videoUrl);
    } catch (error) {
        console.error("Video generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        alert(`Sorry, we couldn't generate the video. Reason: ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownload = (urlOrBase64: string, filename: string) => {
    const link = document.createElement('a');
    // Check if it's a data URL or blob URL, if not, assume it's a raw base64 string
    if (urlOrBase64.startsWith('data:') || urlOrBase64.startsWith('blob:')) {
        link.href = urlOrBase64;
    } else {
        link.href = `data:image/png;base64,${urlOrBase64}`;
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addToGallery = (image: GeneratedImage | undefined) => {
    if (!image) return;
    setGalleryImages(prev => [image, ...prev]);
    alert("Image saved to gallery!");
  };

  const confirmStartOver = () => {
    setStep(1);
    setUploadedFiles([]);
    setProcessedFiles([]);
    setAspectRatio('1:1');
    setOutputType('cinematic-poster');
    setTopic('');
    setCreativeConcept('');
    setGeneratedImages([]);
    setSelectedImageId(null);
    if (generatedVideoUrl) {
        URL.revokeObjectURL(generatedVideoUrl);
    }
    setGeneratedVideoUrl(null);
    setRefinementPrompt('');
    setIsRefinementSuggestionsOpen(false);
    setIsStartOverConfirmOpen(false);
  };

  const renderStepContent = () => {
    return (
      <div className="flex-grow flex flex-col p-8 bg-gray-900 overflow-y-auto">
        {step === 1 && (
          <>
            <h2 className="text-3xl font-bold mb-2 text-white">Upload Your Image</h2>
            <p className="text-gray-400 mb-6">Start by uploading one or more images. Drag & drop or click to select.</p>
            <Uploader onFilesAdded={handleFilesAdded} />
            {uploadedFiles.length > 0 && <p className="text-center text-gray-500 mt-6">You can add more files or proceed.</p>}
          </>
        )}
        {step >= 2 && (
          <>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">1. Configure Your Design</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label htmlFor="aspectRatio" className="text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
                    <select id="aspectRatio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatioKey)} className="bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      {Object.entries(ASPECT_RATIOS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="outputType" className="text-sm font-medium text-gray-400 mb-1">Output Type</label>
                    <select id="outputType" value={outputType} onChange={e => setOutputType(e.target.value as OutputTypeKey)} className="bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      {Object.entries(OUTPUT_TYPES).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">2. Get Creative Ideas (Optional)</h3>
                <div className="flex flex-col">
                  <label htmlFor="topic" className="text-sm font-medium text-gray-400 mb-1">Topic (optional, if no image)</label>
                  <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., 'A vintage sci-fi movie poster'" className="bg-gray-700 border border-gray-600 rounded-md p-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <button onClick={handleGetCreativeIdeas} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
                  <SparklesIcon className="w-5 h-5" />
                  <span>Generate Creative Concepts</span>
                </button>
                <textarea value={creativeConcept} onChange={e => setCreativeConcept(e.target.value)} placeholder="AI-generated concepts will appear here... (or write your own)" rows={6} className="w-full bg-gray-800 border border-gray-600 rounded-md p-3 mt-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
              <div>
                <button onClick={handleGenerateImage} disabled={processedFiles.length === 0 && !creativeConcept} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed">
                  <span>Generate Image</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  The creative concept is optional. If left blank, we'll generate an image based on your uploaded images and selected output type.
                </p>
              </div>
            </div>
            {step === 3 && selectedImage && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-3 text-white">3. Refine Your Creation</h3>
                    <div className="relative">
                        <textarea ref={refinementTextareaRef} id="refinement-textarea" value={refinementPrompt} onChange={e => setRefinementPrompt(e.target.value)} placeholder="e.g., 'Change background to a forest at sunset'" rows={3} className="w-full bg-gray-800 border border-gray-600 rounded-md p-3 pr-16 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                         <button
                            ref={suggestionsButtonRef}
                            onClick={() => setIsRefinementSuggestionsOpen(prev => !prev)}
                            className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-gray-400 hover:text-indigo-400"
                            title="Show Suggestions"
                            aria-haspopup="listbox"
                            aria-expanded={isRefinementSuggestionsOpen}
                            aria-controls="refinement-suggestions"
                         >
                            <LightBulbIcon className="w-5 h-5"/>
                        </button>
                        <RefinementSuggestions
                            suggestions={REFINEMENT_SUGGESTIONS}
                            onSelect={(suggestion) => {
                                setRefinementPrompt(suggestion);
                                refinementTextareaRef.current?.focus();
                            }}
                            isOpen={isRefinementSuggestionsOpen}
                            onClose={() => setIsRefinementSuggestionsOpen(false)}
                            targetRef={suggestionsButtonRef}
                        />
                    </div>
                     <button onClick={handleRefineImage} disabled={!refinementPrompt} className="w-full mt-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <WandIcon className="w-5 h-5" />
                        <span>Apply Refinement</span>
                    </button>
                </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-800 font-sans">
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <GalleryModal images={galleryImages} isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
      
      {isStartOverConfirmOpen && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Start Over?</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to start over? All current progress will be lost.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsStartOverConfirmOpen(false)}
                className="w-full bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartOver}
                className="w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gray-900/70 backdrop-blur-md border-b border-gray-700 p-4 flex justify-between items-center z-10 shadow-lg">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <WandIcon className="w-6 h-6 text-white"/>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Image Studio</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsGalleryOpen(true)} className="flex items-center space-x-2 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">
              <GalleryIcon className="w-5 h-5" />
              <span>My Gallery</span>
          </button>
          <button 
            onClick={() => setIsStartOverConfirmOpen(true)}
            className="p-2 bg-gray-700 text-white rounded-md hover:bg-red-600 transition-colors"
            title="Start Over"
          >
            <RefreshIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <aside className="w-full md:w-1/3 xl:w-1/4 flex flex-col bg-gray-800 border-r border-gray-700 shadow-xl">
          <div className="p-4 border-b border-gray-700">
             <div className="flex items-center space-x-4">
               <div className={`w-10 h-10 flex items-center justify-center rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                 <span className="font-bold text-white">1</span>
               </div>
               <div>
                 <h3 className="font-semibold text-white">Upload</h3>
                 <p className="text-sm text-gray-400">Add source images</p>
               </div>
            </div>
          </div>
           <div className="p-4 border-b border-gray-700">
             <div className="flex items-center space-x-4">
               <div className={`w-10 h-10 flex items-center justify-center rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                 <span className="font-bold text-white">2</span>
               </div>
               <div>
                 <h3 className="font-semibold text-white">Configure & Ideate</h3>
                 <p className="text-sm text-gray-400">Set parameters and concepts</p>
               </div>
            </div>
          </div>
           <div className="p-4">
             <div className="flex items-center space-x-4">
               <div className={`w-10 h-10 flex items-center justify-center rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                 <span className="font-bold text-white">3</span>
               </div>
               <div>
                 <h3 className="font-semibold text-white">Generate & Refine</h3>
                 <p className="text-sm text-gray-400">Create and perfect your image</p>
               </div>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
             {renderStepContent()}
          </div>
        </aside>

        {/* Right Panel */}
        <main className="w-full md:w-2/3 xl:w-3/4 flex flex-col bg-gray-900">
            {step === 1 && uploadedFiles.length === 0 && (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                    <p>Your uploaded images will appear here.</p>
                </div>
            )}
            {step >= 2 && (
                <>
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-xl font-semibold text-white">Workspace</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6 space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Reference Images</h3>
                            {processedFiles.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {processedFiles.map(img => (
                                    <ImagePreviewCard 
                                      key={img.id} 
                                      src={img.previewUrl} 
                                      alt={img.file.name} 
                                      onRemove={() => handleRemoveProcessedFile(img.id)}
                                      onDownload={() => handleDownload(img.previewUrl, `processed-${img.file.name}`)}
                                    >
                                       <button onClick={() => handleRemoveBackground(img)} className="w-full text-xs bg-black/50 text-white font-semibold py-1.5 px-2 rounded-md hover:bg-indigo-600/80 transition-colors flex items-center justify-center space-x-1 backdrop-blur-sm">
                                            <WandIcon className="w-3 h-3" />
                                            <span>Remove BG</span>
                                        </button>
                                    </ImagePreviewCard>
                                ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No reference images.</p>
                            )}
                        </div>
                        {generatedImages.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-300 mb-4">Generated Results</h3>
                                {selectedImage && (
                                    <div className="max-w-xl mx-auto mb-6">
                                        <ImagePreviewCard 
                                            src={`data:image/png;base64,${selectedImage.base64}`} 
                                            alt={selectedImage.prompt} 
                                            onDownload={() => handleDownload(selectedImage.base64, `ai-creation-${selectedImage.id}.png`)}
                                        >
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={handleGenerateVariation} className="w-full text-xs bg-black/50 text-white font-semibold py-1.5 px-2 rounded-md hover:bg-indigo-600/80 transition-colors flex items-center justify-center space-x-1 backdrop-blur-sm">
                                                    <SparklesIcon className="w-3 h-3" />
                                                    <span>Variation</span>
                                                </button>
                                                 <button onClick={() => addToGallery(selectedImage)} className="w-full text-xs bg-black/50 text-white font-semibold py-1.5 px-2 rounded-md hover:bg-green-600/80 transition-colors flex items-center justify-center space-x-1 backdrop-blur-sm">
                                                    <PlusIcon className="w-3 h-3" />
                                                    <span>Save</span>
                                                </button>
                                            </div>
                                        </ImagePreviewCard>
                                    </div>
                                )}

                                {generatedImages.length > 1 && (
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-300 mb-3 text-center">History</h4>
                                        <div className="flex justify-center">
                                            <div className="flex space-x-4 overflow-x-auto pb-2">
                                                {generatedImages.map(img => (
                                                <div key={img.id} className="relative group flex-shrink-0 w-24 h-24">
                                                    <button 
                                                        className={`w-full h-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-150 ${selectedImageId === img.id ? 'ring-2 ring-indigo-500' : 'ring-1 ring-gray-700 hover:ring-indigo-400'}`}
                                                        onClick={() => setSelectedImageId(img.id)}
                                                        aria-label={`Select image generated from prompt: ${img.prompt}`}
                                                    >
                                                        <img 
                                                            src={`data:image/png;base64,${img.base64}`} 
                                                            alt={img.prompt}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDownload(img.base64, `ai-creation-${img.id}.png`)}
                                                            className="p-1.5 bg-gray-900/50 rounded-full text-white hover:bg-indigo-600/80 backdrop-blur-sm transition-colors"
                                                            title="Download Image"
                                                        >
                                                            <DownloadIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedImage && !generatedVideoUrl && (
                                    <div className="mt-6 max-w-xl mx-auto p-4 bg-gray-800 border border-gray-700 rounded-lg">
                                        <h4 className="text-md font-semibold text-gray-300 mb-4">Animate Your Image</h4>
                                        <div className="mb-4">
                                            <label htmlFor="videoDuration" className="block text-sm font-medium text-gray-400 mb-2">Duration ({videoDuration}s)</label>
                                            <input 
                                                id="videoDuration" 
                                                type="range" 
                                                min="2" 
                                                max="10" 
                                                value={videoDuration} 
                                                onChange={(e) => setVideoDuration(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="animationStyle" className="block text-sm font-medium text-gray-400 mb-1">Animation Style</label>
                                            <select 
                                                id="animationStyle" 
                                                value={animationStyle} 
                                                onChange={e => setAnimationStyle(e.target.value)} 
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                {ANIMATION_STYLES.map(style => <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>)}
                                            </select>
                                        </div>
                                        <button onClick={handleGenerateVideo} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                                            <FilmIcon className="w-5 h-5" />
                                            <span>Generate Video</span>
                                        </button>
                                    </div>
                                )}

                                {generatedVideoUrl && selectedImage && (
                                    <div className="mt-6 max-w-xl mx-auto">
                                        <h4 className="text-md font-semibold text-gray-300 mb-2">Generated Video</h4>
                                        <VideoPlayer src={generatedVideoUrl} />
                                        <a 
                                            href={generatedVideoUrl} 
                                            download={`ai-video-${selectedImage?.id}.mp4`}
                                            className="mt-2 w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                            <span>Download Video</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;