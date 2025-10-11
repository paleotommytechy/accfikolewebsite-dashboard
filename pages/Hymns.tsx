import React, { useState, useMemo, useRef, useEffect } from 'react';
import Card from '../components/ui/Card';
import { hymns, Hymn } from '../services/hymns';
import { SearchIcon, ChevronDownIcon, MusicNoteIcon, PlayIcon, PauseIcon } from '../components/ui/Icons';

// --- Custom Audio Player Component ---
interface CustomAudioPlayerProps {
    src: string;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src, isPlaying, onPlay, onPause }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    // Effect to control playback from parent state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.play().catch(e => console.error("Error playing audio:", e));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // Effect for setting up audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            onPause();
            setCurrentTime(0);
        };

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        // Reset state when src changes
        setDuration(0);
        setCurrentTime(0);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src, onPause]);
    
    const togglePlayPause = () => {
        if (isPlaying) {
            onPause();
        } else {
            onPlay();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Number(e.target.value);
            setCurrentTime(audioRef.current.currentTime);
        }
    };
    
    const formatTime = (time: number) => {
        if (isNaN(time) || time === Infinity) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <audio ref={audioRef} src={src} preload="metadata" />
            <button onClick={togglePlayPause} className="bg-primary-500 text-white rounded-full p-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform hover:scale-110">
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            <div className="flex-grow flex items-center gap-3">
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{formatTime(duration)}</span>
            </div>
        </div>
    );
};


// --- Main Hymns Component ---
const Hymns: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeHymnId, setActiveHymnId] = useState<number | null>(null);
    const [playingHymnId, setPlayingHymnId] = useState<number | null>(null);

    const filteredHymns = useMemo(() => {
        if (!searchTerm) return hymns;
        return hymns.filter(hymn =>
            hymn.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hymn.lyrics.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const toggleHymnLyrics = (id: number) => {
        setActiveHymnId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Hymn Book</h1>

            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search for a hymn by title or lyrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-dark border border-gray-300 dark:border-gray-700 rounded-full pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
            </div>
            
            <Card className="!p-0">
                {filteredHymns.length > 0 ? (
                    <div className="divide-y dark:divide-gray-700">
                        {filteredHymns.map((hymn, index) => (
                            <div key={hymn.id}>
                                <button
                                    onClick={() => toggleHymnLyrics(hymn.id)}
                                    className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    aria-expanded={activeHymnId === hymn.id}
                                >
                                    <div className="flex items-center">
                                        <span className="text-gray-500 font-semibold w-8">{index + 1}.</span>
                                        <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{hymn.title}</span>
                                    </div>
                                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${activeHymnId === hymn.id ? 'rotate-180' : ''}`} />
                                </button>
                                {activeHymnId === hymn.id && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 animate-fade-in-up" style={{ animationDuration: '300ms' }}>
                                        <div className="mb-4">
                                            <CustomAudioPlayer
                                                key={hymn.id} // Add key to re-mount component on hymn change
                                                src={hymn.audioUrl}
                                                isPlaying={playingHymnId === hymn.id}
                                                onPlay={() => setPlayingHymnId(hymn.id)}
                                                onPause={() => setPlayingHymnId(null)}
                                            />
                                        </div>
                                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                                            {hymn.lyrics}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12">
                         <MusicNoteIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold mt-4">No Hymns Found</h3>
                        <p className="text-gray-500 mt-2">Your search for "{searchTerm}" did not match any hymns.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Hymns;
