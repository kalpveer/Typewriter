import React, { useState, useEffect, useRef } from 'react';
import { Save, FilePlus, Download, Volume2, VolumeX, Camera, FolderOpen, X, Trash2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import html2canvas from 'html2canvas';
import './index.css';
import './music_player.css';

// Sound Engine Types
type SoundType = 'key' | 'space' | 'enter' | 'paper';

interface AudioBuffers {
    keys: AudioBuffer[];
    space: AudioBuffer | null;
    enter: AudioBuffer | null;
    paper: AudioBuffer | null;
}

interface Entry {
    id: string;
    date: string; // ISO string
    content: string;
}

function App() {
    // --- Music Player State ---
    const [showMusicPlayer, setShowMusicPlayer] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Playlist with simulated separate tracks using long mixes + short loops
    const PLAYLIST = [
        { title: "Tokyo Vibes", src: "https://radioweblatina.com/playlist/music/lofi/80_'s%20Tokyo%20Vibes%20-%20Lofi%20hiphop%20mix%201H31m.mp3" },
        { title: "Lofi Study", src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" },
        { title: "City Girl", src: "https://radioweblatina.com/playlist/music/lofi/80s%20Tokyo%20City%20Girl%20-%20%201hour%20Lofi%20hiphop%20mix%201H.mp3" },
        { title: "Night Rain", src: "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3?filename=rainy-day-110825.mp3" },
        { title: "Lonely Night", src: "https://radioweblatina.com/playlist/music/lofi/80s%20Tokyo%20Lonely%20Night%20-%20Lofi%20hiphop%20mix%20-%20Chill%20%20Study%201H31m.mp3" },
        { title: "Vintage Jazz", src: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=salty-swing-11354.mp3" },
        { title: "Tokyo Chill", src: "https://radioweblatina.com/playlist/music/lofi/1980_'s%20lo-fi%20chill%20music%20-%201hour%20Lofi%20hiphop%20mix%201H.mp3" },
        { title: "Distant Memory", src: "https://radioweblatina.com/playlist/music/lofi/OLD%20Tokyo%20Distant%20Memory%20%20-%20Lofi%20hiphop%20mix%201H.mp3" },
        { title: "Lazy Night", src: "https://radioweblatina.com/playlist/music/lofi/Tokyo%20Lazy%20Night%20-%201hour%20Lofi%20hiphop%20mix%20-%20chill%20beats%201H.mp3" },
        { title: "Midnight Vibes", src: "https://radioweblatina.com/playlist/music/lofi/80s%20Tokyo%20Night%20Lofi%20Chill%20Hiphop%20%20-%20Lofi%20hiphop%20mix%201H22m%20.mp3" }
    ];

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio(PLAYLIST[currentTrack].src);
        } else {
            // Track change logic
            if (audioRef.current.src !== PLAYLIST[currentTrack].src) {
                audioRef.current.src = PLAYLIST[currentTrack].src;
                if (isPlaying) {
                    audioRef.current.play().catch(e => console.log("Playback failed", e));
                }
            }
        }
        audioRef.current.volume = volume;
        audioRef.current.onended = () => nextTrack();
    }, [currentTrack, volume]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => {
                    console.error("Play error:", e);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const togglePlay = () => setIsPlaying(!isPlaying);
    const nextTrack = () => setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length);
    const prevTrack = () => setCurrentTrack((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    // ---------------------------

    // --- Global Shortcuts ---
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Alt + M to reopen Music Player
            if (e.altKey && (e.key === 'm' || e.key === 'M')) {
                setShowMusicPlayer(true);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);
    // ---------------------------

    // --- Draggable Widget Logic ---
    const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });

    const startDrag = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        initialPos.current = { x: widgetPos.x, y: widgetPos.y };
    };

    useEffect(() => {
        const handleDrag = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            setWidgetPos({ x: initialPos.current.x + dx, y: initialPos.current.y + dy });
        };

        const stopDrag = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', stopDrag);
        }
        return () => {
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', stopDrag);
        };
    }, [isDragging]);
    // ---------------------------

    const [text, setText] = useState<string>('');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const [buffers, setBuffers] = useState<AudioBuffers>({ keys: [], space: null, enter: null, paper: null });

    // Multi-Entry State
    const [entries, setEntries] = useState<Entry[]>([]);
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
    const [showEntries, setShowEntries] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    const caretRef = useRef<HTMLDivElement>(null);

    // Initialize Audio Context and Buffers
    useEffect(() => {
        const initAudio = async () => {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            setAudioCtx(ctx);

            // 1. Vintage Mechanical Key Sound (Pure Snap, No Body Thud)
            const createDetailedKeySound = () => {
                const duration = 0.12; // Slightly shorter
                const sampleRate = ctx.sampleRate;
                const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
                const data = buffer.getChannelData(0);

                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;

                    // Impact Noise ONLY
                    // Sharp attack, fast decay. Pure mechanical staccato.
                    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 80);

                    // Boost volume slightly since we lost the thud
                    data[i] = noise * 0.8;
                }
                return buffer;
            };

            // 2. Spacebar (Thud-like)
            const createSpaceSound = () => {
                const duration = 0.15;
                const sampleRate = ctx.sampleRate;
                const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;
                    const thud = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 30) * 0.6;
                    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.3;
                    data[i] = (thud + noise) * 0.7;
                }
                return buffer;
            };

            // 3. Enter Sound (PURE ZIP only. No Beep. No Bell.)
            const createEnterSound = () => {
                const duration = 0.5;
                const sampleRate = ctx.sampleRate;
                const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < sampleRate * duration; i++) {
                    const t = i / sampleRate;

                    // Carriage Slide "Zip" (Filtered Noise)
                    // Starts fast, sustains briefly, decays.
                    const noise = Math.random() * 2 - 1;

                    // Envelope: Attack (0-0.05), Sustain/Decay
                    let envelope = 0;
                    if (t < 0.05) {
                        envelope = t / 0.05;
                    } else {
                        envelope = Math.exp(-(t - 0.05) * 6);
                    }

                    const zip = noise * envelope * 0.5;

                    // Mechanical Thud at end (Non-tonal) to signify "lock"
                    // Use low pass filtered noise burst instead of sine to avoid "tone" perception
                    let endThud = 0;
                    if (t > 0.35 && t < 0.45) {
                        const thudT = t - 0.35;
                        endThud = (Math.random() * 2 - 1) * Math.exp(-thudT * 40) * 0.6;
                    }

                    data[i] = zip + endThud;
                }
                return buffer;
            };

            // Generate multiple variations for keys
            const keyBuffers = Array.from({ length: 8 }, createDetailedKeySound);

            setBuffers({
                keys: keyBuffers,
                space: createSpaceSound(),
                enter: createEnterSound(),
                paper: null
            });
        };

        initAudio();
    }, []);

    // Initialize Entries from LocalStorage
    useEffect(() => {
        const savedEntries = localStorage.getItem('diary_entries');
        if (savedEntries) {
            try {
                setEntries(JSON.parse(savedEntries));
            } catch (e) {
                console.error("Failed to parse entries", e);
            }
        }

        // Check for "unsaved" draft
        const savedDraft = localStorage.getItem('diary_content');
        if (savedDraft) {
            setText(savedDraft);
        }
    }, []);

    // Save Text to LocalStorage Draft
    useEffect(() => {
        localStorage.setItem('diary_content', text);
        updateCaretPosition();
    }, [text]);

    const playSound = (type: SoundType) => {
        if (!soundEnabled || !audioCtx) return;

        let buffer: AudioBuffer | null = null;
        let playbackRate = 1.0;

        switch (type) {
            case 'key':
                if (buffers.keys.length > 0) {
                    const index = Math.floor(Math.random() * buffers.keys.length);
                    buffer = buffers.keys[index];
                    playbackRate = 0.95 + Math.random() * 0.1; // Subtle variation
                }
                break;
            case 'space':
                buffer = buffers.space;
                playbackRate = 0.95 + Math.random() * 0.1;
                break;
            case 'enter':
                buffer = buffers.enter;
                break;
        }

        if (buffer) {
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = playbackRate;

            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.8;

            // Highshelf filter for crispness (mechanical feel)
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highshelf';
            filter.frequency.value = 3000;
            filter.gain.value = 5;

            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            source.start();
        }
    };

    const updateCaretPosition = () => {
        if (!textareaRef.current || !mirrorRef.current || !caretRef.current) return;

        const textarea = textareaRef.current;
        const mirror = mirrorRef.current;
        const caret = caretRef.current;

        const textBefore = textarea.value.substring(0, textarea.selectionStart);

        // Setup mirror content correctly
        mirror.textContent = textBefore;

        const span = document.createElement('span');
        span.textContent = '|';
        mirror.appendChild(span);

        const spanRect = span.getBoundingClientRect();
        const mirrorRect = mirror.getBoundingClientRect();

        const top = spanRect.top - mirrorRect.top;
        const left = spanRect.left - mirrorRect.left;
        const adjustedTop = top - textarea.scrollTop;

        caret.style.transform = `translate(${left}px, ${adjustedTop}px)`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Prevent Machine-Gun sound on Hold
        if (e.repeat) return;

        if (e.key === 'Enter') {
            playSound('enter');
        } else if (e.key === ' ') {
            playSound('space');
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            playSound('key');
        }

        requestAnimationFrame(updateCaretPosition);
    };

    const handleSelect = () => updateCaretPosition();
    const handleScroll = () => updateCaretPosition();
    const handleClick = () => updateCaretPosition();

    // Multi-Entry Logic
    const saveEntry = () => {
        if (!text.trim()) return;

        const timestamp = new Date();
        // Default to first line as title or generic


        const newEntry: Entry = {
            id: currentEntryId || crypto.randomUUID(),
            date: timestamp.toISOString(),
            content: text
        };

        let updatedEntries;
        if (currentEntryId && entries.some(e => e.id === currentEntryId)) {
            updatedEntries = entries.map(e => e.id === currentEntryId ? newEntry : e);
        } else {
            updatedEntries = [newEntry, ...entries];
            setCurrentEntryId(newEntry.id);
        }

        setEntries(updatedEntries);
        localStorage.setItem('diary_entries', JSON.stringify(updatedEntries));

        // Mechanical zip to confirm
        playSound('enter');
    };

    const handleCreateNew = () => {
        setText('');
        setCurrentEntryId(null);
        localStorage.removeItem('diary_content');
        playSound('enter');
    };

    const deleteEntry = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = entries.filter(ent => ent.id !== id);
        setEntries(updated);
        localStorage.setItem('diary_entries', JSON.stringify(updated));

        if (currentEntryId === id) {
            setText('');
            setCurrentEntryId(null);
        }
    };

    const loadEntry = (entry: Entry) => {
        setText(entry.content);
        setCurrentEntryId(entry.id);
        setShowEntries(false);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "typewriter_diary.txt";
        document.body.appendChild(element);
        element.click();
    };

    // Implemented Screenshot using html2canvas
    const handleScreenshot = async () => {
        // Temporary hide controls and caret for clean shot
        const controls = document.querySelector('.controls') as HTMLElement;
        const caret = document.querySelector('.custom-caret') as HTMLElement;

        if (controls) controls.style.display = 'none';
        if (caret) caret.style.display = 'none';

        try {
            const element = document.querySelector('.container') as HTMLElement; // Capture full container (Desk + Paper)
            if (element) {
                const canvas = await html2canvas(element, {
                    scale: 2, // Retina quality
                    useCORS: true,
                    backgroundColor: null,
                    scrollX: 0,
                    scrollY: 0,
                    width: element.offsetWidth,
                    height: element.offsetHeight
                });

                const link = document.createElement('a');
                link.download = `typewriter_diary_${new Date().toISOString().slice(0, 10)}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) {
            console.error("Snapshot failed:", err);
            alert("Could not take snapshot. Please try a browser extension.");
        } finally {
            // Restore UI
            if (controls) controls.style.display = 'flex';
            if (caret) caret.style.display = 'block';
        }
    };

    return (
        <div className="container">
            <div className="wood-texture" />

            <div className="main-content">
                <div className="paper-sheet">
                    <div className="controls">
                        <button onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? "Mute" : "Unmute"}>
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <div className="divider" />
                        <button onClick={() => setShowEntries(true)} title="My Entries">
                            <FolderOpen size={20} />
                        </button>
                        <button onClick={handleCreateNew} title="New Page">
                            <FilePlus size={20} />
                        </button>
                        <button onClick={saveEntry} title="Save Entry">
                            <Save size={20} />
                        </button>
                        <button onClick={handleDownload} title="Download">
                            <Download size={20} />
                        </button>
                        <button onClick={handleScreenshot} title="Snapshot">
                            <Camera size={20} />
                        </button>
                    </div>

                    <div className="typing-container">
                        <div ref={mirrorRef} className="mirror-div"></div>
                        <div ref={caretRef} className="custom-caret"></div>
                        <textarea
                            ref={textareaRef}
                            className="typing-area"
                            spellCheck={false}
                            value={text}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onSelect={handleSelect}
                            onScroll={handleScroll}
                            onClick={handleClick}
                            autoFocus
                            placeholder=""
                        />
                    </div>
                </div>
            </div>

            {/* Entries Modal */}
            {showEntries && (
                <div className="entries-overlay">
                    <div className="entries-header">
                        <h2 className="entries-title">My Diary Entries</h2>
                        <button className="close-btn" onClick={() => setShowEntries(false)}><X size={24} /></button>
                    </div>

                    <div className="entries-list">
                        {entries.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No saved entries yet.</div>
                        ) : (
                            entries.map(entry => (
                                <div key={entry.id} className="entry-item" onClick={() => loadEntry(entry)}>
                                    <div className="entry-info">
                                        <h3>{new Date(entry.date).toLocaleString()}</h3>
                                        <div className="entry-preview">
                                            {entry.content.slice(0, 50) || "(Empty Entry)"}...
                                        </div>
                                    </div>
                                    <div className="entry-actions">
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#822' }}
                                            onClick={(e) => deleteEntry(entry.id, e)} title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Foreground Typewriter SVG */}
            <div className="typewriter-foreground">
                <svg
                    viewBox="0 0 800 400"
                    className="typewriter-svg"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <filter id="ink-bleed">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    </filter>

                    <g filter="url(#ink-bleed)">
                        {/* Platen Roller*/}
                        <rect x="150" y="20" width="500" height="60" rx="5" fill="#1a1a1a" stroke="#222" strokeWidth="2" />

                        {/* Paper Guide */}
                        <line x1="160" y1="70" x2="640" y2="70" stroke="#444" strokeWidth="2" />
                        {Array.from({ length: 20 }).map((_, i) => (
                            <line key={i} x1={180 + i * 22} y1="65" x2={180 + i * 22} y2="75" stroke="#555" strokeWidth="1" />
                        ))}

                        {/* Return Lever */}
                        <path d="M 120 40 Q 100 40, 90 80 L 80 80" fill="none" stroke="#ccc" strokeWidth="4" />
                        <circle cx="80" cy="80" r="5" fill="#ddd" />

                        {/* Knobs */}
                        <rect x="650" y="30" width="20" height="40" fill="#111" rx="2" />
                        <rect x="130" y="30" width="20" height="40" fill="#111" rx="2" />

                        {/* Main Body */}
                        <path d="M 100 100 
                     C 100 80, 700 80, 700 100 
                     L 750 350 
                     Q 400 380, 50 350 
                     Z"
                            fill="#f2f0e6" stroke="#333" strokeWidth="3" />

                        {/* Brand */}
                        <rect x="350" y="140" width="100" height="30" fill="#111" stroke="#333" />
                        <text x="400" y="160" textAnchor="middle" fill="#d4af37" fontFamily="monospace" fontSize="16" letterSpacing="2">TYPO</text>

                        {/* Keys */}
                        <g transform="translate(140, 200)">
                            {/* Keys Row 1 */}
                            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key, i) => (
                                <g key={key} transform={`translate(${i * 45}, 0)`}>
                                    <circle cx="20" cy="20" r="18" fill="#fff" stroke="#333" strokeWidth="2" />
                                    <circle cx="20" cy="20" r="14" fill="none" stroke="#ccc" strokeWidth="1" />
                                    <text x="20" y="25" textAnchor="middle" fontSize="14" fontFamily="monospace">{key}</text>
                                </g>
                            ))}
                            {/* Keys Row 2 */}
                            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key, i) => (
                                <g key={key} transform={`translate(${20 + i * 45}, 45)`}>
                                    <circle cx="20" cy="20" r="18" fill="#fff" stroke="#333" strokeWidth="2" />
                                    <text x="20" y="25" textAnchor="middle" fontSize="14" fontFamily="monospace">{key}</text>
                                </g>
                            ))}
                            {/* Keys Row 3 */}
                            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key, i) => (
                                <g key={key} transform={`translate(${50 + i * 45}, 90)`}>
                                    <circle cx="20" cy="20" r="18" fill="#fff" stroke="#333" strokeWidth="2" />
                                    <text x="20" y="25" textAnchor="middle" fontSize="14" fontFamily="monospace">{key}</text>
                                </g>
                            ))}

                            {/* Spacebar */}
                            <rect x="120" y="140" width="250" height="20" rx="10" fill="#333" stroke="#111" />
                        </g>
                    </g>
                </svg>
                {/* Music Player Widget */}
                {showMusicPlayer && (
                    <div
                        className="music-player"
                        style={{
                            transform: `translate(${widgetPos.x}px, ${widgetPos.y}px)`,
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                        onMouseDown={startDrag}
                    >
                        <button
                            className="close-widget-btn"
                            onClick={() => setShowMusicPlayer(false)}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Close (Alt+M to reopen)"
                        >
                            <X size={14} />
                        </button>

                        <div className="album-art">
                            <div className={`vinyl ${isPlaying ? 'playing' : ''}`}></div>
                        </div>
                        <div className="track-info">
                            <strong>{PLAYLIST[currentTrack].title}</strong>
                        </div>
                        <div className="controls" onMouseDown={(e) => e.stopPropagation()}>
                            <button className="control-btn" onClick={prevTrack}><SkipBack size={18} /></button>
                            <button className="control-btn" onClick={togglePlay}>
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button className="control-btn" onClick={nextTrack}><SkipForward size={18} /></button>
                        </div>
                        <div className="volume-slider-container" onMouseDown={(e) => e.stopPropagation()}>
                            <Volume2 size={14} color="#888" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="volume-slider"
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default App;
