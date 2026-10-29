import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VideoOff } from 'lucide-react';
import type { VideoDetection } from '../data/plantData';
import styles from './VideoPlayer.module.css';

type VideoFrameRequestVideoElement = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: { mediaTime: number; presentedFrames: number }) => void,
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/**
 * A plain URL works for MP4/WebM today and for an HLS manifest once an HLS
 * loader (e.g. hls.js) is attached. A MediaStream can be supplied for WebRTC.
 */
export type VideoPlayerSource = string | MediaStream;

/**
 * Canvas paint styles do not accept CSS custom properties, so token references
 * from detection metadata are resolved against the active design tokens before use.
 */
function resolvePaint(value: string): string {
  const token = /^var\((--[\w-]+)\)$/.exec(value.trim());
  if (!token) return value;

  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue(token[1]).trim() || 'CanvasText';
}

export interface VideoPlayerProps {
  src: VideoPlayerSource;
  detections: VideoDetection[];
  sourceType?: 'auto' | 'file' | 'hls' | 'webrtc';
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  className?: string;
  ariaLabel?: string;
  /** Hide detection labels, confidence scores and technical fallback text. */
  plainMode?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  detections,
  sourceType = 'auto',
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  poster,
  className,
  ariaLabel = 'Incident camera playback with detection overlays',
  plainMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const syncCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const rect = video.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    syncCanvasSize();

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    // The video uses object-fit: cover, so map normalized detections onto the
    // visible (cropped) video content rather than the full player box.
    const sourceWidth = video.videoWidth || width;
    const sourceHeight = video.videoHeight || height;
    const sourceRatio = sourceWidth / sourceHeight;
    const containerRatio = width / height;

    let renderWidth: number;
    let renderHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (sourceRatio > containerRatio) {
      renderHeight = height;
      renderWidth = height * sourceRatio;
      offsetX = (width - renderWidth) / 2;
      offsetY = 0;
    } else {
      renderWidth = width;
      renderHeight = width / sourceRatio;
      offsetX = 0;
      offsetY = (height - renderHeight) / 2;
    }

    const currentTime = video.currentTime;

    detections.forEach(detection => {
      if (detection.startTime !== undefined && currentTime < detection.startTime) return;
      if (detection.endTime !== undefined && currentTime > detection.endTime) return;

      const color = resolvePaint(detection.color ?? 'var(--accent)');
      const x = offsetX + detection.bbox.x * renderWidth;
      const y = offsetY + detection.bbox.y * renderHeight;
      const boxWidth = detection.bbox.width * renderWidth;
      const boxHeight = detection.bbox.height * renderHeight;

      context.save();
      context.lineWidth = 2;
      context.strokeStyle = color;
      context.fillStyle = color;
      context.globalAlpha = 0.12;
      context.fillRect(x, y, boxWidth, boxHeight);
      context.globalAlpha = 1;

      if (detection.dashed) {
        context.setLineDash([7, 5]);
      }

      context.strokeRect(x, y, boxWidth, boxHeight);

      if (!plainMode) {
        const confidence = Math.round(detection.confidence * 100);
        const label = `${detection.label} ${confidence}%`;
        context.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        const labelWidth = context.measureText(label).width + 12;
        const labelHeight = 20;
        const labelY = Math.max(0, y - labelHeight);

        context.fillStyle = color;
        context.fillRect(x, labelY, labelWidth, labelHeight);
        context.fillStyle = resolvePaint('var(--on-accent)');
        context.fillText(label, x + 6, labelY + 14);
      }
      context.restore();
    });
  }, [detections, syncCanvasSize, plainMode]);

  // Attach the source (file/HLS URL or WebRTC MediaStream).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasLoaded(false);
    setMediaError(false);

    const isStream = typeof src !== 'string';
    const useStream = isStream || sourceType === 'webrtc';

    if (useStream && !isStream) {
      setMediaError(true);
      return;
    }

    if (useStream) {
      video.srcObject = src as MediaStream;
    } else {
      video.srcObject = null;
      // HLS integration point: when sourceType === 'hls' and the browser cannot
      // play the manifest natively, attach hls.js here and call hls.attachMedia(video).
      video.src = src as string;
      video.load();
    }

    if (autoPlay) {
      void video.play().catch(() => {
        // Autoplay can be blocked until user interaction; controls remain usable.
      });
    }

    return () => {
      if (isStream) {
        video.srcObject = null;
      }
    };
  }, [src, sourceType, autoPlay]);

  // Keep the overlay bitmap aligned with the rendered video size.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    syncCanvasSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncCanvasSize);
      return () => window.removeEventListener('resize', syncCanvasSize);
    }

    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(video);

    return () => observer.disconnect();
  }, [syncCanvasSize]);

  // Draw detections on every presented video frame, with a rAF fallback for
  // browsers that do not implement requestVideoFrameCallback.
  useEffect(() => {
    const video = videoRef.current as VideoFrameRequestVideoElement | null;
    if (!video) return;

    let cancelled = false;
    let rvfcHandle: number | null = null;
    let rafHandle: number | null = null;

    drawFrame();

    const schedule = () => {
      if (cancelled) return;

      if (typeof video.requestVideoFrameCallback === 'function') {
        rvfcHandle = video.requestVideoFrameCallback(() => {
          drawFrame();
          schedule();
        });
      } else {
        rafHandle = window.requestAnimationFrame(() => {
          drawFrame();
          schedule();
        });
      }
    };

    schedule();

    const handleVisualUpdate = () => drawFrame();
    video.addEventListener('loadeddata', handleVisualUpdate);
    video.addEventListener('seeked', handleVisualUpdate);
    video.addEventListener('play', handleVisualUpdate);

    return () => {
      cancelled = true;

      if (rvfcHandle !== null) {
        video.cancelVideoFrameCallback?.(rvfcHandle);
      }
      if (rafHandle !== null) {
        window.cancelAnimationFrame(rafHandle);
      }

      video.removeEventListener('loadeddata', handleVisualUpdate);
      video.removeEventListener('seeked', handleVisualUpdate);
      video.removeEventListener('play', handleVisualUpdate);
    };
  }, [drawFrame]);

  return (
    <div className={`${styles.player} ${className ?? ''}`}>
      <video
        ref={videoRef}
        className={styles.video}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline
        preload="auto"
        aria-label={ariaLabel}
        onLoadedData={() => setHasLoaded(true)}
        onError={() => {
          setHasLoaded(false);
          setMediaError(true);
        }}
      />

      <canvas ref={canvasRef} className={styles.overlayCanvas} aria-hidden="true" />

      {(!hasLoaded || mediaError) && (
        <div className={styles.fallback}>
          <VideoOff size={22} />
          <span>{mediaError ? 'Camera feed unavailable' : 'Connecting to camera…'}</span>
          {!plainMode && <small>Mock source • detection canvas ready</small>}
        </div>
      )}

      {!plainMode && detections.length > 0 && (
        <span className={styles.detectionCount}>
          {detections.length} overlay{detections.length === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
};
