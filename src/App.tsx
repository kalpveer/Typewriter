import React, { useState, useEffect, useRef } from 'react';
import { useDraggable } from './useDraggable'; // Import the hook
import { Save, FilePlus, Download, Volume2, VolumeX, Camera, FolderOpen, X, Trash2, Play, Pause, SkipBack, SkipForward, Settings, Monitor, Coffee, Zap, Info, Sun, Moon, CloudRain, Flame, Stamp } from 'lucide-react';
import html2canvas from 'html2canvas';
import './index.css';
import './music_player.css';
import './widgets.css';

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
    const [screenshotMenuOpen, setScreenshotMenuOpen] = useState(false);
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
            if (e.altKey) {
                // Alt + M: Music Player
                if (e.key === 'm' || e.key === 'M') setShowMusicPlayer(true);
                // Alt + P: Pomodoro
                if (e.key === 'p' || e.key === 'P') setShowPomodoro(prev => !prev);
                // Alt + W: Word Count
                if (e.key === 'w' || e.key === 'W') setShowWordCount(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);
    // ---------------------------

    // --- Draggable State ---
    const musicDrag = useDraggable({ x: 0, y: 0 });
    const pomoDrag = useDraggable({ x: 0, y: 0 });
    const wordDrag = useDraggable({ x: 0, y: 0 });
    // ---------------------------

    const [text, setText] = useState<string>('');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const [buffers, setBuffers] = useState<AudioBuffers>({ keys: [], space: null, enter: null, paper: null });

    // Multi-Entry State
    const [entries, setEntries] = useState<Entry[]>([]);
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
    const [showEntries, setShowEntries] = useState(false);

    // --- New Features State ---
    // 1. Lighting Theme
    const [theme, setTheme] = useState<'normal' | 'warm' | 'dim'>('normal');

    // 2. Ambience
    const [ambienceDrawerOpen, setAmbienceDrawerOpen] = useState(false);
    const [ambienceLevels, setAmbienceLevels] = useState({ rain: 0, fire: 0, cafe: 0 });
    const ambienceRefs = {
        rain: useRef<HTMLAudioElement | null>(null),
        fire: useRef<HTMLAudioElement | null>(null),
        cafe: useRef<HTMLAudioElement | null>(null)
    };

    // 3. Pomodoro
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
    const [pomodoroActive, setPomodoroActive] = useState(false);
    const [showPomodoro, setShowPomodoro] = useState(true);

    // 4. Stats
    const [wordCount, setWordCount] = useState(0);
    const [wordGoal, setWordGoal] = useState(500);
    const [showWordCount, setShowWordCount] = useState(true);
    const [isEditingGoal, setIsEditingGoal] = useState(false);

    // 5. Inspiration
    const [cardFlipped, setCardFlipped] = useState(false);
    const [currentQuote, setCurrentQuote] = useState({ text: "Write drunk, edit sober.", author: "Hemingway" });

    // 6. Settings (Paper/Font)
    const [settingOpen, setSettingOpen] = useState(false);
    const [paperStyle, setPaperStyle] = useState('plain'); // plain, lined, grid
    const [fontStyle, setFontStyle] = useState('Special Elite'); // Special Elite, Courier Prime

    const QUOTES = [
        { text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Hemingway" },
        { text: "Detailed outlining is the enemy of spontaneity.", author: "Stephen King" },
        { text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour" },
        { text: "You can make anything by writing.", author: "C.S. Lewis" },
        { text: "Don't tell me the moon is shining; show me the glint of light on broken glass.", author: "Chekhov" }
    ];

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

    // Save Text to LocalStorage Draft & Update Word Count
    useEffect(() => {
        localStorage.setItem('diary_content', text);
        setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
        updateCaretPosition();
    }, [text]);

    // Pomodoro Timer Logic
    useEffect(() => {
        let interval: any = null;
        if (pomodoroActive && pomodoroTime > 0) {
            interval = setInterval(() => {
                setPomodoroTime((prev) => prev - 1);
            }, 1000);
        } else if (pomodoroTime === 0 && pomodoroActive) {
            setPomodoroActive(false);
            // Bell sound could go here
            if (audioCtx) playSound('enter'); // Use Enter sound as convenient bell
        }
        return () => clearInterval(interval);
    }, [pomodoroActive, pomodoroTime]);

    // Ambience Logic
    const toggleAmbience = (type: 'rain' | 'fire' | 'cafe', vol: number) => {
        setAmbienceLevels(prev => ({ ...prev, [type]: vol }));
        const ref = ambienceRefs[type].current;
        if (ref) {
            ref.volume = vol;
            if (vol > 0 && ref.paused) ref.play().catch(e => console.log(e));
            if (vol === 0) ref.pause();
        }
    };

    // Initialize Ambience Refs on mount
    useEffect(() => {
        if (!ambienceRefs.rain.current) {
            // "Rain"
            ambienceRefs.rain.current = new Audio("/sounds/Rain.mp3");
            ambienceRefs.rain.current.loop = true;
        }
        if (!ambienceRefs.fire.current) {
            // "Fire"
            ambienceRefs.fire.current = new Audio("/sounds/Fire.mp3");
            ambienceRefs.fire.current.loop = true;
        }
        if (!ambienceRefs.cafe.current) {
            // "Cafe"
            ambienceRefs.cafe.current = new Audio("/sounds/Cafe.mp3");
            ambienceRefs.cafe.current.loop = true;
        }
    }, []);

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

        // Adjust for scroll
        // Since container scrolls, we use offsetTop relative to it?
        // Actually, mirror grows with text. 
        // We need caret position relative to the scrollable container.

        caret.style.transform = `translate(${left}px, ${top}px)`;

        // Auto-Scroll Logic
        // If the caret is near the bottom of the visible container (e.g. obscured by typewriter)
        const container = textarea.parentElement;
        if (container) {
            const caretAbsTop = spanRect.top;
            const containerRect = container.getBoundingClientRect();
            const bottomThreshold = containerRect.bottom - 200; // 200px buffer for typewriter

            if (caretAbsTop > bottomThreshold) {
                container.scrollBy({ top: caretAbsTop - bottomThreshold, behavior: 'smooth' });
            }
        }
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
    // Date Stamp Logic
    const addDateStamp = () => {
        const now = new Date();

        const day = now.getDate();
        const month = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();

        const getOrdinal = (n: number) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        };

        const stampText = `\n[ ${day}${getOrdinal(day)} ${month} ${year} ]\n`;

        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText = text.substring(0, start) + stampText + text.substring(end);
            setText(newText);

            // Move cursor after stamp
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + stampText.length;
                textarea.focus();
            }, 0);
        } else {
            setText(prev => prev + stampText);
        }
        playSound('enter'); // Use the mechanical zip/thud sound for the stamp action
    };

    // Implemented Screenshot using html2canvas
    const handleScreenshot = async (mode: 'desk' | 'paper') => {
        setScreenshotMenuOpen(false);

        // Temporary hide controls and caret for clean shot
        const controls = document.querySelector('.controls') as HTMLElement;
        const caret = document.querySelector('.custom-caret') as HTMLElement;
        const mirror = mirrorRef.current;
        const textarea = textareaRef.current;

        if (controls) controls.style.display = 'none';
        if (caret) caret.style.display = 'none';

        // Swap textarea with mirror-div for better rendering
        if (mirror && textarea) {
            mirror.style.visibility = 'visible';
            mirror.style.color = '#2b2b2b'; // Ensure ink color
            textarea.style.opacity = '0';
        }

        try {
            const element = document.querySelector('.container') as HTMLElement; // Capture full container (Desk + Paper)
            if (element) {
                // Ensure starting from top
                window.scrollTo(0, 0);

                const options: any = {
                    scale: 2, // Retina quality
                    useCORS: true,
                    backgroundColor: null,
                    scrollX: 0,
                    scrollY: -window.scrollY,
                    windowWidth: document.documentElement.offsetWidth,
                    windowHeight: document.documentElement.offsetHeight
                };

                if (mode === 'paper') {
                    const paperElement = document.querySelector('.paper-sheet');
                    if (paperElement) {
                        const rect = paperElement.getBoundingClientRect();
                        // Crop to the paper width + typewriter area
                        // We set X and Width to match the paper
                        options.x = rect.left;
                        options.y = 0;
                        options.width = rect.width;
                        options.height = window.innerHeight; // Full height to include typewriter
                    }
                }

                const canvas = await html2canvas(element, options);

                const link = document.createElement('a');
                link.download = `typewriter_diary_${mode}_${new Date().toISOString().slice(0, 10)}.png`;
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
            if (mirror && textarea) {
                mirror.style.visibility = 'hidden';
                textarea.style.opacity = '1';
            }
        }
    };

    return (
        <div className="container" style={{ fontFamily: fontStyle === 'Special Elite' ? "'Special Elite', monospace" : "'Courier Prime', monospace" }}>
            <div className={`wood-texture ${theme === 'warm' ? 'overlay-warm' : ''}`} />

            {/* Lighting Overlay */}
            {theme !== 'normal' && <div className={`lighting-layer light-${theme}`} />}

            {/* Lamp Switch */}
            <div className="lamp-switch" onClick={() => setTheme(prev => prev === 'normal' ? 'warm' : prev === 'warm' ? 'dim' : 'normal')} title="Toggle Light">
                <div className="pull-chain" style={{ height: theme === 'normal' ? '40px' : '55px' }}>
                    <div className="pull-knob"></div>
                </div>
            </div>

            {/* Sticky Note (Word Count) */}
            {showWordCount && (
                <div
                    className="sticky-note"
                    style={{
                        transform: `translate(${wordDrag.position.x}px, ${wordDrag.position.y}px) rotate(-2deg)`,
                        cursor: wordDrag.isDragging ? 'grabbing' : 'grab',
                        zIndex: 60
                    }}
                    onMouseDown={wordDrag.startDrag}
                >
                    <button
                        className="close-widget-btn"
                        onClick={() => setShowWordCount(false)}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ top: '5px', right: '5px' }}
                        title="Close (Alt+W to reopen)"
                    >
                        <X size={12} />
                    </button>
                    <div className="sticky-pin"></div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Word Count</div>
                    <div style={{ fontSize: '2.5rem', marginTop: '10px' }}>{wordCount}</div>

                    {isEditingGoal ? (
                        <input
                            type="number"
                            value={wordGoal}
                            onChange={(e) => setWordGoal(parseInt(e.target.value) || 0)}
                            onBlur={() => setIsEditingGoal(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoal(false)}
                            autoFocus
                            style={{ width: '60px', background: 'transparent', border: 'none', borderBottom: '1px solid #444', textAlign: 'center', fontSize: '0.8rem' }}
                        />
                    ) : (
                        <div
                            style={{ fontSize: '0.8rem', opacity: 0.7, cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); setIsEditingGoal(true); }}
                            title="Click to edit goal"
                        >
                            Goal: {wordGoal}
                        </div>
                    )}
                </div>
            )}

            {/* Pomodoro Timer */}
            {showPomodoro && (
                <div
                    className="pomodoro-widget"
                    title="Click face to Start/Pause"
                    style={{
                        transform: `translate(${pomoDrag.position.x}px, ${pomoDrag.position.y}px)`,
                        cursor: pomoDrag.isDragging ? 'grabbing' : 'grab',
                        zIndex: 60
                    }}
                    onMouseDown={pomoDrag.startDrag}
                >
                    <button
                        className="close-widget-btn"
                        onClick={() => setShowPomodoro(false)}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ top: '0px', right: '0px', transform: 'translate(30%, -30%)' }}
                        title="Close (Alt+P to reopen)"
                    >
                        <X size={12} />
                    </button>
                    <div className="timer-face" onClick={(e) => { e.stopPropagation(); setPomodoroActive(!pomodoroActive); }} style={{ cursor: 'pointer' }}>
                        {Math.floor(pomodoroTime / 60)}:{(pomodoroTime % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="timer-progress" style={{ transform: `rotate(${((25 * 60 - pomodoroTime) / (25 * 60)) * 360}deg)` }}></div>
                    <div className="timer-label">{pomodoroActive ? "Running" : "Paused"}</div>
                </div>
            )}

            {/* Inspiration Deck */}
            <div className={`inspiration-deck ${cardFlipped ? 'flipped' : ''}`} onClick={() => {
                if (!cardFlipped) {
                    const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
                    setCurrentQuote(random);
                }
                setCardFlipped(!cardFlipped);
            }}>
                <div className="card">
                    <div className="card-front">
                        <span>Need Inspiration?<br />Click to Flip</span>
                    </div>
                    <div className="card-back">
                        <div style={{ padding: '5px' }}>
                            <p>"{currentQuote.text}"</p>
                            <div style={{ marginTop: '5px', fontStyle: 'italic' }}>- {currentQuote.author}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ambience Control Drawer */}
            <div className={`ambience-drawer ${ambienceDrawerOpen ? 'open' : ''}`}>
                <div className="ambience-toggle" onClick={() => setAmbienceDrawerOpen(!ambienceDrawerOpen)}>
                    <CloudRain size={20} />
                </div>
                <h3 style={{ marginBottom: '15px', color: '#fff' }}>Atmosphere</h3>

                <div className="ambience-item">
                    <CloudRain size={16} /> <span>Rain</span>
                    <input type="range" min="0" max="1" step="0.1" value={ambienceLevels.rain} onChange={(e) => toggleAmbience('rain', parseFloat(e.target.value))} className="ambience-slider" />
                </div>
                <div className="ambience-item">
                    <Flame size={16} /> <span>Fire</span>
                    <input type="range" min="0" max="1" step="0.1" value={ambienceLevels.fire} onChange={(e) => toggleAmbience('fire', parseFloat(e.target.value))} className="ambience-slider" />
                </div>
                <div className="ambience-item">
                    <Coffee size={16} /> <span>Cafe</span>
                    <input type="range" min="0" max="1" step="0.1" value={ambienceLevels.cafe} onChange={(e) => toggleAmbience('cafe', parseFloat(e.target.value))} className="ambience-slider" />
                </div>
            </div>

            {/* Settings Modal */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100 }}>
                <button onClick={() => setSettingOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#554' }}>
                    <Settings size={28} />
                </button>
            </div>

            {settingOpen && (
                <div className="settings-modal" onClick={() => setSettingOpen(false)}>
                    <div className="settings-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2>Typewriter Options</h2>
                            <button onClick={() => setSettingOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                        </div>

                        <div className="settings-group">
                            <h3>Paper Type</h3>
                            <button className={`option-btn ${paperStyle === 'plain' ? 'active' : ''}`} onClick={() => setPaperStyle('plain')}>Plain</button>
                            <button className={`option-btn ${paperStyle === 'lined' ? 'active' : ''}`} onClick={() => setPaperStyle('lined')}>Lined</button>
                            <button className={`option-btn ${paperStyle === 'aged' ? 'active' : ''}`} onClick={() => setPaperStyle('aged')}>Aged</button>
                        </div>

                        <div className="settings-group">
                            <h3>Font Style</h3>
                            <button className={`option-btn ${fontStyle === 'Special Elite' ? 'active' : ''}`} onClick={() => setFontStyle('Special Elite')}>Inked Ribbon</button>
                            <button className={`option-btn ${fontStyle === 'Courier Prime' ? 'active' : ''}`} onClick={() => setFontStyle('Courier Prime')}>Clean Digital</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="main-content">
                <div className={`paper-sheet ${paperStyle}`}>
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
                        <button onClick={addDateStamp} title="Stamp Date">
                            <Stamp size={20} />
                        </button>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button onClick={() => setScreenshotMenuOpen(!screenshotMenuOpen)} title="Snapshot Options">
                                <Camera size={20} />
                            </button>
                            {screenshotMenuOpen && (
                                <div className="screenshot-menu" style={{
                                    position: 'absolute',
                                    top: '40px',
                                    right: '0',
                                    background: '#f7f4e9',
                                    border: '1px solid #1a1512',
                                    borderRadius: '4px',
                                    padding: '5px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '5px',
                                    minWidth: '120px',
                                    zIndex: 100,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    <button
                                        onClick={() => handleScreenshot('desk')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            textAlign: 'left',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            color: '#2b2b2b'
                                        }}
                                        onMouseEnter={(e) => (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.05)'}
                                        onMouseLeave={(e) => (e.target as HTMLElement).style.background = 'none'}
                                    >
                                        Full Desk View
                                    </button>
                                    <button
                                        onClick={() => handleScreenshot('paper')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            textAlign: 'left',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            color: '#2b2b2b'
                                        }}
                                        onMouseEnter={(e) => (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.05)'}
                                        onMouseLeave={(e) => (e.target as HTMLElement).style.background = 'none'}
                                    >
                                        Paper View
                                    </button>
                                </div>
                            )}
                        </div>
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
                            style={{ fontFamily: fontStyle === 'Special Elite' ? "'Special Elite', monospace" : "'Courier Prime', monospace" }}
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
                            transform: `translate(${musicDrag.position.x}px, ${musicDrag.position.y}px)`,
                            cursor: musicDrag.isDragging ? 'grabbing' : 'grab'
                        }}
                        onMouseDown={musicDrag.startDrag}
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
