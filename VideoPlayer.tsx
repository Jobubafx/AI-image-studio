import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, VolumeIcon, VolumeMuteIcon, FullscreenIcon } from './Icons';

interface VideoPlayerProps {
  src: string;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(false);
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = (Number(e.target.value) / 100) * duration;
      videoRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume > 0) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (!newMutedState && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };
  
  const toggleFullscreen = () => {
    if (containerRef.current) {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    setIsMuted(video.muted);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.background = `linear-gradient(to right, #4f46e5 ${progress}%, #4b5563 ${progress}%)`;
    }
  }, [progress]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video group rounded-lg overflow-hidden border border-gray-700"
      onMouseEnter={() => setAreControlsVisible(true)}
      onMouseLeave={() => setAreControlsVisible(false)}
    >
      <video
        ref={videoRef}
        src={src}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="w-full h-full object-contain bg-black cursor-pointer"
      />
      
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${areControlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <input
          ref={progressRef}
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        
        <div className="flex items-center justify-between mt-2 text-white">
          <div className="flex items-center space-x-4">
            <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="p-1">
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <div 
                className="flex items-center space-x-2"
                onMouseEnter={() => setIsVolumeSliderVisible(true)}
                onMouseLeave={() => setIsVolumeSliderVisible(false)}
            >
                <button onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"} className="p-1">
                {isMuted || volume === 0 ? <VolumeMuteIcon className="w-6 h-6" /> : <VolumeIcon className="w-6 h-6" />}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className={`w-20 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-opacity duration-300 ${isVolumeSliderVisible ? 'opacity-100' : 'opacity-0'}`}
                    aria-label="Volume"
                />
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <span className="text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
             <button onClick={toggleFullscreen} aria-label="Toggle Fullscreen" className="p-1">
                <FullscreenIcon className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};