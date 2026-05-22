import { Maximize, Pause, Play, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type VideoSource = {
  label: string;
  src: string;
};

type MenuOption<T extends string | number> = {
  label: string;
  value: T;
};

function PlayerMenu<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: MenuOption<T>[];
  onChange: (value: T) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={label}
        className="h-9 min-w-20 rounded-full border border-white/16 bg-black/70 px-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] outline-none backdrop-blur-md transition hover:bg-white/16"
      >
        {current?.label}
      </button>
      {isOpen && (
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 min-w-28 overflow-hidden rounded-[14px] border border-white/14 bg-[#111114] py-1 text-white shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs font-semibold transition ${
                option.value === value ? 'bg-white text-[#111114]' : 'text-white hover:bg-white/12'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VideoPlayer({
  src,
  title = 'Video',
  sources,
  autoPlay = false,
  className = '',
}: {
  src: string;
  title?: string;
  sources?: VideoSource[];
  autoPlay?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const availableSources = useMemo(() => sources?.length ? sources : [{ label: 'Original', src }], [sources, src]);
  const [selectedSource, setSelectedSource] = useState(availableSources[0]?.src ?? src);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => ({ label: `${rate}x`, value: rate }));

  useEffect(() => {
    const nextSource = availableSources[0]?.src ?? src;
    setSelectedSource((current) => availableSources.some((source) => source.src === current) ? current : nextSource);
  }, [availableSources, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [selectedSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;
    video.playbackRate = playbackRate;
  }, [isMuted, playbackRate, volume]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const seekTo = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value;
    setCurrentTime(value);
  };

  const changeSource = (nextSource: string) => {
    const video = videoRef.current;
    const previousTime = video?.currentTime ?? 0;
    const shouldResume = Boolean(video && !video.paused);
    setSelectedSource(nextSource);

    window.setTimeout(() => {
      const nextVideo = videoRef.current;
      if (!nextVideo) return;

      nextVideo.currentTime = previousTime;
      nextVideo.playbackRate = playbackRate;
      if (shouldResume) void nextVideo.play();
    }, 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  };

  const formattedTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.55 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden bg-black text-white ${className}`}
      onMouseMove={() => setControlsVisible(true)}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        src={selectedSource}
        aria-label={title}
        autoPlay={autoPlay}
        playsInline
        className="aspect-video h-full w-full bg-black object-contain"
        onClick={togglePlay}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
        className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-[#111114] shadow-[0_18px_48px_rgba(0,0,0,0.28)] transition duration-200 hover:scale-105 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
      >
        {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
      </button>

      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 via-black/55 to-transparent px-3 pb-3 pt-10 transition duration-200 sm:px-4 ${controlsVisible || !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="mb-3 flex items-center gap-3">
          <span className="w-10 text-right text-[11px] font-semibold tabular-nums text-white/82">{formattedTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            onChange={(event) => seekTo(Number(event.target.value))}
            aria-label="Progresso do vídeo"
            className="h-1 flex-1 cursor-pointer accent-white"
          />
          <span className="w-10 text-[11px] font-semibold tabular-nums text-white/82">{formattedTime(duration)}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMuted((current) => !current)}
              aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22"
            >
              <VolumeIcon className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(event) => {
                const nextVolume = Number(event.target.value);
                setVolume(nextVolume);
                setIsMuted(nextVolume === 0);
              }}
              aria-label="Volume"
              className="hidden h-1 w-20 cursor-pointer accent-white sm:block"
            />
          </div>

          <div className="flex items-center gap-2">
            <PlayerMenu
              label="Qualidade do video"
              value={selectedSource}
              options={availableSources.map((source) => ({ label: source.label, value: source.src }))}
              onChange={changeSource}
            />
            <PlayerMenu
              label="Velocidade do video"
              value={playbackRate}
              options={speedOptions}
              onChange={setPlaybackRate}
            />
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Tela cheia"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
