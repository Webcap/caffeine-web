"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Loader2, 
  Server, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  Play,
  Pause,
  Maximize,
  Volume2,
  VolumeX,
  RotateCcw,
  SkipForward,
  ChevronLeft,
  Settings,
  Info,
  ListVideo,
  ExternalLink,
  Gauge,
  FastForward
} from "lucide-react";
import Image from "next/image";
import Hls from "hls.js";
import { fetchStreamLinks, fetchEpisodes, StreamLink } from "@/lib/api";
import { MediaItem } from "@/lib/tmdb";

interface VideoPlayerProps {
  id: string | number;
  type: "movie" | "tv";
  title: string;
  releaseDate?: string;
  season?: number;
  episode?: number;
  backdropPath?: string;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  id,
  type,
  title,
  releaseDate,
  season: initialSeason = 1,
  episode: initialEpisode = 1,
  backdropPath,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [loadingStep, setLoadingStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [availableLinks, setAvailableLinks] = useState<StreamLink[]>([]);
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const [showControls, setShowControls] = useState(true);
  const [activeOverlay, setActiveOverlay] = useState<'settings' | 'episodes' | null>(null);
  const [episodes, setEpisodes] = useState<MediaItem[]>([]);
  const [curSeason, setCurSeason] = useState(initialSeason);
  const [curEpisode, setCurEpisode] = useState(initialEpisode);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { icon: <Loader2 />, text: "Searching sources..." },
    { icon: <Server />, text: "Optimizing network..." },
    { icon: <ShieldCheck />, text: "Securing stream..." },
    { icon: <Zap />, text: "Buffering..." }
  ];

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fetch Stream Links
  useEffect(() => {
    const fetchData = async () => {
      setIsLoaded(false);
      setLoadingStep(0);
      const data = await fetchStreamLinks(id.toString(), type, curSeason, curEpisode);
      if (data && data.success && data.links.length > 0) {
        setAvailableLinks(data.links);
        setStreamUrl(data.links[currentLinkIndex]?.url || data.links[0].url);
      }
    };
    fetchData();
  }, [id, type, curSeason, curEpisode, currentLinkIndex]);

  // Fetch Episodes for Overlay
  useEffect(() => {
    if (type === "tv") {
      fetchEpisodes(id, curSeason).then(setEpisodes);
    }
  }, [id, type, curSeason]);

  // Loading Sequence
  useEffect(() => {
    if (loadingStep < steps.length) {
      const timer = setTimeout(() => setLoadingStep(prev => prev + 1), 800);
      return () => clearTimeout(timer);
    } else if (streamUrl) {
      const timer = setTimeout(() => setIsLoaded(true), 2000); // More time for total masking
      return () => clearTimeout(timer);
    }
  }, [loadingStep, streamUrl]);

  // HLS Setup
  useEffect(() => {
    if (isLoaded && streamUrl && videoRef.current) {
      const video = videoRef.current;
      if (hlsRef.current) hlsRef.current.destroy();

      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => video.play());
      }
      
      video.playbackRate = playbackSpeed;
    }
  }, [isLoaded, streamUrl, playbackSpeed]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !activeOverlay) setShowControls(false);
    }, 4000);
  };

  const backdropUrl = backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : null;

  return (
    <div 
      ref={containerRef}
      className="select-none"
      style={{ 
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        backgroundColor: '#000', zIndex: 10000, overflow: 'hidden'
      }}
      onMouseMove={resetControlsTimeout}
    >
      {/* 🟢 LAYER 0: VIDEO - ALWAYS BOTTOM */}
      <div style={{ 
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0,
        opacity: isLoaded ? 1 : 0, transition: 'opacity 1s ease'
      }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={() => { if (activeOverlay) setActiveOverlay(null); else togglePlay(); }}
        />
      </div>

      {/* 🔴 LAYER 1: LOADER - STRICT OVERRIDE */}
      {!isLoaded && (
        <div style={{ 
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          backgroundColor: '#000', zIndex: 500, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px'
        }}>
           {backdropUrl && (
             <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
               <Image src={backdropUrl} alt={title} fill className="object-cover" style={{ filter: "blur(80px)" }} priority />
             </div>
           )}
           <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px', width: '100%' }}>
              <h1 className="text-6xl font-black mb-1 uppercase tracking-tighter" style={{ color: "white" }}>{title}</h1>
              <p className="text-white/30 font-bold mb-20 uppercase tracking-[0.2em] text-sm">
                {type === "tv" ? `S${curSeason} E${curEpisode}` : releaseDate?.split("-")[0]}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                 {steps.map((step, i) => (
                   <div key={i} style={{ 
                     display: 'flex', alignItems: 'center', gap: '24px', transition: 'all 0.7s ease',
                     opacity: i === loadingStep ? 1 : i < loadingStep ? 0.2 : 0,
                     transform: i === loadingStep ? 'translateX(24px)' : 'translateX(0)'
                   }}>
                      <div style={{ 
                        padding: '16px', borderRadius: '16px', 
                        backgroundColor: i === loadingStep ? 'var(--primary)' : 'transparent',
                        color: i === loadingStep ? 'white' : 'var(--win-green)',
                        boxShadow: i === loadingStep ? '0 0 30px var(--primary)' : 'none',
                        transition: 'all 0.4s ease'
                      }}>
                        {React.cloneElement(step.icon as React.ReactElement<any>, { size: 32, strokeWidth: 2.5, className: i === loadingStep && i === 0 ? "animate-spin-slow" : "" })}
                      </div>
                      <span style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.025em' }}>{step.text}</span>
                      {i < loadingStep && <CheckCircle2 style={{ color: 'var(--win-green)', marginLeft: 'auto' }} size={28} strokeWidth={2.5} />}
                   </div>
                 ))}
              </div>
              <div style={{ 
                width: '100%', maxWidth: '450px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', 
                borderRadius: '99px', marginTop: '100px', overflow: 'hidden', margin: '100px auto 0' 
              }}>
                <div className="shimmer" style={{ 
                  height: '100%', backgroundColor: 'var(--primary)',
                  width: `${(loadingStep / steps.length) * 100}%`, transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" 
                }} />
              </div>
           </div>
        </div>
      )}

      {/* ⚪ LAYER 2: CONTROLS - ONLY IF LOADED */}
      {isLoaded && (
        <div style={{ 
          position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 100,
          opacity: showControls ? 1 : 0, transition: 'opacity 0.7s ease', pointerEvents: showControls ? 'auto' : 'none'
        }}>
          
          {/* TOP BAR */}
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, padding: '48px 32px 64px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transform: showControls ? 'translateY(0)' : 'translateY(-100%)', transition: 'transform 0.7s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button 
                onClick={onClose} 
                className="hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-3xl group"
                style={{ padding: '16px', transition: 'all 0.3s ease', cursor: 'pointer' }}
              >
                <ChevronLeft size={36} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', lineHeight: 1, margin: 0, color: 'white' }}>{title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                   <span style={{ fontSize: '12px', fontWeight: 900, padding: '2px 8px', backgroundColor: 'var(--primary)', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>HD</span>
                   <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
                     {type === "tv" ? `Season ${curSeason} Episode ${curEpisode}` : releaseDate?.split("-")[0]}
                   </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setActiveOverlay(activeOverlay === 'settings' ? null : 'settings')} 
              className={`rounded-full border ${activeOverlay === 'settings' ? "bg-primary border-primary" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
              style={{ padding: '16px', transition: 'all 0.3s ease', cursor: 'pointer' }}
            >
               <Settings size={28} strokeWidth={2.5} className={activeOverlay === 'settings' ? "rotate-45" : ""} />
            </button>
          </div>

          {/* CENTER UI - DEAD CENTER */}
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', transition: 'all 0.5s ease', textAlign: 'center',
            opacity: (!isPlaying || showControls) ? 1 : 0
          }}>
             <div style={{ 
               padding: '64px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.4)',
               backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)',
               boxShadow: '0 0 100px rgba(0,0,0,0.5)', transition: 'all 0.5s ease',
               transform: !isPlaying ? 'scale(1)' : 'scale(0.8)'
             }}>
                {!isPlaying ? <Play size={80} fill="white" strokeWidth={2.5} style={{ marginLeft: '8px' }} /> : <Pause size={80} fill="white" strokeWidth={2.5} />}
             </div>
          </div>

          {/* SKIP INTRO */}
          {isPlaying && currentTime < 85 && (
             <div style={{ 
               position: 'absolute', bottom: '180px', right: '48px', 
               animation: 'slide-up-fade 0.5s ease forwards'
             }}>
                <button 
                  onClick={() => { if(videoRef.current) videoRef.current.currentTime = 85; }}
                  className="hover:bg-primary backdrop-blur-3xl border border-white/10"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '20px 40px', borderRadius: '24px', fontSize: '24px', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.3s ease',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.4)', cursor: 'pointer'
                  }}
                >
                   <FastForward size={32} fill="white" strokeWidth={3} />
                   Skip Intro
                </button>
             </div>
          )}

          {/* BOTTOM BAR */}
          <div style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, padding: '200px 32px 48px',
            background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.8) 60%, transparent 100%)',
            transform: showControls ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.7s ease'
          }}>
            
            {/* 1. PROGRESS BAR */}
            <div className="group/progress" style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative', cursor: 'pointer' }}>
               <div style={{ 
                 position: 'absolute', top: '-40px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between',
                 fontSize: '12px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em',
                 opacity: 0, transition: 'opacity 0.3s ease'
               }} className="group-hover/progress:opacity-100">
                  <span style={{ color: 'var(--primary)' }}>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
               </div>
               <div style={{ 
                 width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px',
                 position: 'relative', transition: 'all 0.5s ease', overflow: 'visible'
               }} className="group-hover/progress:h-2.5">
                  <div 
                    className="progress-glow"
                    style={{ 
                      position: 'absolute', left: 0, top: 0, height: '100%', 
                      backgroundColor: 'var(--primary)', borderRadius: '99px',
                      width: `${(currentTime / (duration || 1)) * 100}%`,
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible'
                    }}
                  >
                     <div style={{ 
                       width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%',
                       marginRight: '-12px', boxShadow: '0 0 30px white', opacity: 0, transition: 'opacity 0.3s ease'
                     }} className="group-hover/progress:opacity-100" />
                  </div>
                  <input 
                    type="range" min="0" max={duration || 100} step="0.1" value={currentTime} 
                    onChange={(e) => {
                      const time = parseFloat(e.target.value);
                      if(videoRef.current) videoRef.current.currentTime = time;
                    }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                  />
               </div>
            </div>

            {/* 2. CONTROLS BAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '56px' }}>
                <button onClick={togglePlay} style={{ color: 'white', transition: 'all 0.3s ease', cursor: 'pointer', border: 'none', background: 'none' }} className="hover:scale-110 active:scale-95 hover:text-primary">
                  {isPlaying ? <Pause size={56} fill="white" strokeWidth={2.5} /> : <Play size={56} fill="white" strokeWidth={2.5} style={{ marginLeft: '4px' }} />}
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)} style={{ color: 'white', transition: 'all 0.3s ease', cursor: 'pointer', border: 'none', background: 'none' }} className="hover:text-primary hover:scale-110">
                    <RotateCcw size={40} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => videoRef.current && (videoRef.current.currentTime += 10)} style={{ color: 'white', transition: 'all 0.3s ease', cursor: 'pointer', border: 'none', background: 'none' }} className="hover:text-primary hover:scale-110">
                    <SkipForward size={40} strokeWidth={2.5} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginLeft: '24px' }} className="group/vol">
                  <button onClick={() => setIsMuted(!isMuted)} style={{ color: 'white', transition: 'all 0.3s ease', cursor: 'pointer', border: 'none', background: 'none' }} className="hover:text-primary">
                    {isMuted || volume === 0 ? <VolumeX size={40} strokeWidth={2.5} /> : <Volume2 size={40} strokeWidth={2.5} />}
                  </button>
                  <div style={{ width: 0, transition: 'all 0.5s ease', overflow: 'hidden', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px' }} className="group-hover/vol:w-44">
                    <input 
                      type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} 
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (videoRef.current) videoRef.current.volume = v;
                      }} 
                      style={{ width: '100%', height: '100%', cursor: 'pointer' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                 {type === "tv" && (
                    <button 
                      onClick={() => setActiveOverlay('episodes')}
                      className={`hover:bg-white/10 ${activeOverlay === 'episodes' ? "bg-primary border-primary shadow-2xl shadow-primary" : "bg-white/5 border-transparent"}`}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 40px', borderRadius: '24px', 
                        transition: 'all 0.3s ease', border: '2px solid transparent', cursor: 'pointer', color: 'white'
                      }}
                    >
                       <ListVideo size={32} strokeWidth={2.5} />
                       <span style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Episodes</span>
                    </button>
                 )}
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.05em', color: 'white' }}>{formatTime(currentTime)}</div>
                    <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)' }}>/ {formatTime(duration)}</div>
                 </div>
                 <button 
                  onClick={() => { if (!document.fullscreenElement) containerRef.current?.requestFullscreen(); else document.exitFullscreen(); }} 
                  style={{ padding: '16px', transition: 'all 0.3s ease', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', background: 'none' }}
                  className="hover:bg-white/10 rounded-2xl"
                 >
                   <Maximize size={36} strokeWidth={2.5} style={{ color: 'white' }} />
                 </button>
              </div>
            </div>
          </div>

          {/* SETTINGS OVERLAY */}
          {activeOverlay === 'settings' && (
             <div style={{ 
               position: 'absolute', right: '48px', top: '144px', width: '400px', backgroundColor: 'rgba(0,0,0,0.8)',
               backdropFilter: 'blur(60px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px',
               padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', animation: 'slide-up-fade 0.5s ease forwards'
             }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                      <ExternalLink size={16} strokeWidth={3} />
                      <span>Server / Source</span>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {availableLinks.map((link, i) => (
                         <button 
                           key={i}
                           onClick={() => { setCurrentLinkIndex(i); setActiveOverlay(null); }}
                           style={{ 
                             width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px',
                             borderRadius: '20px', border: '1px solid', transition: 'all 0.3s ease', cursor: 'pointer',
                             borderColor: currentLinkIndex === i ? 'white' : 'rgba(255,255,255,0.05)',
                             backgroundColor: currentLinkIndex === i ? 'white' : 'rgba(255,255,255,0.05)',
                             color: currentLinkIndex === i ? 'black' : 'white'
                           }}
                         >
                            <span style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Source {i + 1}</span>
                            {currentLinkIndex === i ? <CheckCircle2 size={24} strokeWidth={3} /> : <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />}
                         </button>
                      ))}
                   </div>
                   <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '48px 0' }} />
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                      <Gauge size={16} strokeWidth={3} />
                      <span>Playback Speed</span>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      {[0.5, 1, 1.5, 2].map(speed => (
                         <button 
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            style={{ 
                              padding: '20px', borderRadius: '20px', fontSize: '14px', fontWeight: 900, transition: 'all 0.3s ease', cursor: 'pointer', border: '1px solid',
                              borderColor: playbackSpeed === speed ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                              backgroundColor: playbackSpeed === speed ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                              color: playbackSpeed === speed ? 'white' : 'rgba(255,255,255,0.4)',
                              boxShadow: playbackSpeed === speed ? '0 0 30px var(--primary)' : 'none'
                            }}
                         >
                            {speed}x
                         </button>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {/* EPISODES OVERLAY */}
          {activeOverlay === 'episodes' && (
             <div style={{ 
               position: 'absolute', right: 0, top: 0, bottom: 0, width: '500px', backgroundColor: 'rgba(0,0,0,0.4)',
               backdropFilter: 'blur(120px)', borderLeft: '1px solid rgba(255,255,255,0.1)', zIndex: 1000,
               display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.5s ease forwards'
             }}>
                   <div style={{ padding: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', color: 'white', margin: 0 }}>Episodes</h3>
                      <button 
                        onClick={() => setActiveOverlay(null)} 
                        style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: 'white' }}
                        className="hover:bg-white/10"
                      >
                         <X size={36} strokeWidth={3} />
                      </button>
                   </div>
                   <div style={{ flex: 1, overflowY: 'auto', padding: '0 40px 56px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="custom-scrollbar">
                      {episodes.map((ep) => (
                         <button 
                           key={ep.id}
                           onClick={() => { setCurEpisode(ep.episode_num || 1); setActiveOverlay(null); }}
                           style={{ 
                             width: '100%', borderRadius: '40px', overflow: 'hidden', transition: 'all 0.3s ease', border: '2px solid',
                             borderColor: curEpisode === ep.episode_num ? 'var(--primary)' : 'transparent',
                             backgroundColor: curEpisode === ep.episode_num ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)',
                             padding: '24px', textAlign: 'left', cursor: 'pointer', color: 'white'
                           }}
                           className="group"
                         >
                            <div style={{ display: 'flex', gap: '32px' }}>
                               <div style={{ position: 'relative', width: '192px', height: '112px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                                  <Image 
                                    src={ep.poster_path ? `https://image.tmdb.org/t/p/w300${ep.poster_path}` : backdropUrl || ""} 
                                    alt={ep.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                  />
                                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, backdropFilter: 'blur(3px)', transition: 'opacity 0.3s ease' }} className="group-hover:opacity-100">
                                     <Play size={32} fill="white" strokeWidth={3} />
                                  </div>
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '12px' }}>EPISODE {ep.episode_num}</span>
                                  <h4 className="group-hover:text-primary transition-colors" style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>{ep.title}</h4>
                               </div>
                            </div>
                         </button>
                      ))}
                   </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
