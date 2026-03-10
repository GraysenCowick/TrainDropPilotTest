"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface Chapter {
  title: string;
  start_time: number;
  summary: string;
}

interface VideoPlayerProps {
  src: string;
  /** VTT caption text (not URL). Player creates a blob URL internally. */
  vttContent?: string;
  chapters?: Chapter[];
  onProgress?: (percent: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  vttContent,
  chapters,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadError, setLoadError] = useState(false);
  // Blob URL for VTT captions (avoids CORS issues with <track src>)
  const [vttBlobUrl, setVttBlobUrl] = useState<string | null>(null);

  const hasCaption = !!vttContent;

  // Build a blob URL from the VTT text so <track> works cross-origin
  useEffect(() => {
    if (!vttContent) return;
    const blob = new Blob([vttContent], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    setVttBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [vttContent]);

  // Sync mute state to the video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    const d = video.duration || 1;
    const pct = (t / d) * 100;
    setCurrentTime(t);
    setProgress(pct);
    onProgress?.(pct);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const pct = Number(e.target.value);
    video.currentTime = (pct / 100) * (video.duration || 0);
    setProgress(pct);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => {
        console.error("Video play error:", err);
        setLoadError(true);
      });
    } else {
      video.pause();
    }
  }

  function toggleMute() {
    setMuted((v) => !v);
  }

  function seekToChapter(start: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = start;
    video.play().catch((err) => {
      console.error("Video play error:", err);
      setLoadError(true);
    });
  }

  if (loadError) {
    return (
      <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center">
        <p className="text-sm text-white/50">Video unavailable. Please contact your manager.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Video */}
      <div className="relative bg-black rounded-xl overflow-hidden group">
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={(e) => {
            const v = e.currentTarget;
            console.error("[VideoPlayer] load error", {
              src: v.currentSrc || src,
              code: v.error?.code,
              message: v.error?.message,
            });
            setLoadError(true);
          }}
          onClick={togglePlay}
          playsInline
        >
          {hasCaption && vttBlobUrl && (
            <track
              kind="captions"
              src={vttBlobUrl}
              srcLang="en"
              label="Captions"
              default
            />
          )}
        </video>

        {/* Controls overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 accent-[#00D4AA] mb-3 cursor-pointer"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-accent transition-colors"
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>

            <span className="text-xs text-white/70 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            <button
              onClick={toggleMute}
              className="text-white hover:text-accent transition-colors"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => videoRef.current?.requestFullscreen()}
              className="text-white hover:text-accent transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Play button overlay when paused */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-accent/80 transition-all">
              <Play className="h-6 w-6 text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Chapter markers */}
      {chapters && chapters.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
            Chapters
          </p>
          {chapters.map((chapter, i) => (
            <button
              key={i}
              onClick={() => seekToChapter(chapter.start_time)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-xs text-accent tabular-nums w-10 shrink-0">
                {formatTime(chapter.start_time)}
              </span>
              <span className="text-sm text-text-primary">{chapter.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
