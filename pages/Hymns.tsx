import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import { hymns, Hymn } from '../services/hymns';
import { SearchIcon, ChevronDownIcon, MusicNoteIcon } from '../components/ui/Icons';

const Hymns: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeHymnId, setActiveHymnId] = useState<number | null>(null);

    const filteredHymns = useMemo(() => {
        if (!searchTerm) return hymns;
        return hymns.filter(hymn =>
            hymn.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hymn.lyrics.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const toggleHymn = (id: number) => {
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
                                    onClick={() => toggleHymn(hymn.id)}
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
                                        {/* 
                                          Placeholder for audio player.
                                          If you have audio files, you can add an <audio> element here.
                                          Example:
                                          <div className="mb-4">
                                              <audio controls className="w-full">
                                                  <source src={`/audio/hymn_${hymn.id}.mp3`} type="audio/mpeg" />
                                                  Your browser does not support the audio element.
                                              </audio>
                                          </div>
                                        */}
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