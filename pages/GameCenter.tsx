
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
    StarIcon, PlayIcon, StopIcon, FireIcon, TrophyIcon, 
    ClockIcon, BookOpenIcon, CheckCircleIcon, XCircleIcon, 
    ArrowLeftIcon, SparklesIcon, HeartIcon, CrownIcon,
    ArrowUpIcon
} from '../components/ui/Icons';
import { useNotifier } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

// --- GLOBAL CONFIG ---
const DAILY_ACCESS_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

// --- UTILS ---
const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);
const getRandomSubset = <T,>(array: T[], count: number): T[] => shuffle(array).slice(0, count);

// --- GAME 1: SPIRIT BLITZ ASSETS (Expanded) ---
const BLITZ_GRID_SIZE = 9;
const BLITZ_GOOD = [
    { text: 'Joy', color: 'bg-yellow-400 text-yellow-900' }, { text: 'Peace', color: 'bg-blue-400 text-blue-900' }, 
    { text: 'Love', color: 'bg-red-400 text-red-900' }, { text: 'Faith', color: 'bg-green-400 text-green-900' },
    { text: 'Kindness', color: 'bg-pink-400 text-pink-900' }, { text: 'Patience', color: 'bg-indigo-400 text-indigo-900' },
    { text: 'Gentleness', color: 'bg-teal-400 text-teal-900' }, { text: 'Goodness', color: 'bg-orange-400 text-orange-900' }
];
const BLITZ_BAD = [
    { text: 'Fear', color: 'bg-gray-600 text-white' }, { text: 'Sin', color: 'bg-gray-800 text-white' }, 
    { text: 'Envy', color: 'bg-purple-800 text-purple-100' }, { text: 'Anger', color: 'bg-red-900 text-red-100' },
    { text: 'Pride', color: 'bg-slate-700 text-slate-100' }, { text: 'Greed', color: 'bg-emerald-900 text-emerald-100' }
];

// --- GAME 2: BIBLE TRIVIA ASSETS (Large Pool) ---
const ALL_TRIVIA_QUESTIONS = [
    { q: "Who built the ark?", a: ["Noah", "Moses", "David", "Jesus"], c: 0 },
    { q: "How many disciples did Jesus have?", a: ["10", "12", "7", "3"], c: 1 },
    { q: "Where was Jesus born?", a: ["Nazareth", "Jerusalem", "Bethlehem", "Egypt"], c: 2 },
    { q: "Who defeated Goliath?", a: ["Saul", "Jonathan", "David", "Samson"], c: 2 },
    { q: "First book of the Bible?", a: ["Exodus", "Matthew", "Genesis", "Psalms"], c: 2 },
    { q: "Swallowed by a great fish?", a: ["Jonah", "Peter", "Paul", "Malachi"], c: 0 },
    { q: "Part of Adam used for Eve?", a: ["Leg", "Arm", "Rib", "Hair"], c: 2 },
    { q: "Which sea did Moses part?", a: ["Black Sea", "Red Sea", "Dead Sea", "Galilee"], c: 1 },
    { q: "Who betrayed Jesus?", a: ["Peter", "Judas", "John", "Thomas"], c: 1 },
    { q: "Who denied Jesus 3 times?", a: ["Judas", "Peter", "Paul", "Matthew"], c: 1 },
    { q: "King of dreams in Egypt?", a: ["Joseph", "Pharaoh", "Jacob", "Potiphar"], c: 0 },
    { q: "Survived the lions' den?", a: ["Daniel", "David", "Samson", "Elijah"], c: 0 },
    { q: "Strongest man in Bible?", a: ["Goliath", "Samson", "David", "Saul"], c: 1 },
    { q: "Wife of Abraham?", a: ["Sarah", "Rebekah", "Rachel", "Leah"], c: 0 },
    { q: "Mother of Jesus?", a: ["Martha", "Mary", "Elizabeth", "Anna"], c: 1 },
    { q: "Led Israel around Jericho?", a: ["Moses", "Joshua", "Aaron", "Caleb"], c: 1 },
    { q: "Written by David?", a: ["Proverbs", "Psalms", "Ecclesiastes", "Song of Solomon"], c: 1 },
    { q: "Place of the skull?", a: ["Gethsemane", "Golgotha", "Nazareth", "Zion"], c: 1 },
    { q: "Shortest verse text?", a: ["God is love", "Jesus wept", "Pray always", "Rejoice"], c: 1 },
    { q: "Last book of Bible?", a: ["Revelation", "Jude", "Acts", "Malachi"], c: 0 },
    { q: "Who baptized Jesus?", a: ["Peter", "John the Baptist", "Paul", "James"], c: 1 },
    { q: "Oldest man in Bible?", a: ["Methuselah", "Noah", "Adam", "Moses"], c: 0 },
    { q: "Who climbed a sycamore tree?", a: ["Zacchaeus", "Peter", "Matthew", "John"], c: 0 },
    { q: "Wife of Isaac?", a: ["Leah", "Rachel", "Rebekah", "Sarah"], c: 2 },
    { q: "Mountain of 10 Commandments?", a: ["Sinai", "Zion", "Olives", "Carmel"], c: 0 },
];

// --- GAME 3: VERSE SCRAMBLE ASSETS (Large Pool) ---
const ALL_VERSES = [
    { text: "JESUS WEPT", ref: "John 11:35" },
    { text: "REJOICE ALWAYS", ref: "1 Thess 5:16" },
    { text: "GOD IS LOVE", ref: "1 John 4:8" },
    { text: "PRAY WITHOUT CEASING", ref: "1 Thess 5:17" },
    { text: "I AM THE WAY", ref: "John 14:6" },
    { text: "TRUST IN THE LORD", ref: "Prov 3:5" },
    { text: "THE LORD IS MY SHEPHERD", ref: "Psalm 23:1" },
    { text: "FEAR NOT FOR I AM WITH YOU", ref: "Isaiah 41:10" },
    { text: "LOVE YOUR NEIGHBOR", ref: "Mark 12:31" },
    { text: "BLESSED ARE THE PEACEMAKERS", ref: "Matt 5:9" },
    { text: "WALK BY FAITH", ref: "2 Cor 5:7" },
    { text: "SEEK FIRST THE KINGDOM", ref: "Matt 6:33" },
    { text: "BE STRONG AND COURAGEOUS", ref: "Josh 1:9" },
    { text: "I CAN DO ALL THINGS", ref: "Phil 4:13" },
    { text: "LOVE NEVER FAILS", ref: "1 Cor 13:8" }
];

// --- GAME 4: DIVINE MATCH ASSETS (Large Pool) ---
const ALL_MATCH_ICONS = ['🕊️', '✝️', '📖', '👑', '🔥', '❤️', '🍞', '🍷', '🐑', '⚓', '⛪', '🙏', '💡', '🦁', '🎺', '🌾', '🐟', '🌟', '🍇', '🚪', '🛡️', '⚔️'];

// --- TYPES ---
type GameType = 'blitz' | 'trivia' | 'scramble' | 'match' | 'snake' | null;

interface BlitzCell {
    text: string;
    color: string;
    type: 'good' | 'bad';
    expires: number;
    id: number;
}

// ==========================================
// SUB-COMPONENT: SPIRIT BLITZ
// ==========================================
const SpiritBlitzGame: React.FC<{ onScore: (s: number) => void, onEnd: () => void }> = ({ onScore, onEnd }) => {
    const [cells, setCells] = useState<Map<number, BlitzCell>>(new Map());
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const timerRef = useRef<number>();

    useEffect(() => {
        timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) {
            onScore(score);
            onEnd();
        }
    }, [timeLeft]);

    useEffect(() => {
        const spawn = setInterval(() => {
            setCells(prev => {
                const newMap = new Map<number, BlitzCell>(prev);
                // Clean expired
                const now = Date.now();
                Array.from(newMap.entries()).forEach(([k, v]) => { if (v.expires < now) newMap.delete(k); });
                // Spawn new
                if (newMap.size < 5) {
                    const idx = Math.floor(Math.random() * BLITZ_GRID_SIZE);
                    if (!newMap.has(idx)) {
                        const isBad = Math.random() < 0.35; // Slight difficulty increase
                        const item = isBad ? BLITZ_BAD[Math.floor(Math.random() * BLITZ_BAD.length)] : BLITZ_GOOD[Math.floor(Math.random() * BLITZ_GOOD.length)];
                        newMap.set(idx, { ...item, type: isBad ? 'bad' : 'good', expires: Date.now() + 1500, id: Math.random() });
                    }
                }
                return newMap;
            });
        }, 600);
        return () => clearInterval(spawn);
    }, []);

    const handleTap = (idx: number) => {
        const cell = cells.get(idx);
        if (!cell) return;
        if (cell.type === 'good') setScore(s => s + 10);
        else setScore(s => Math.max(0, s - 20));
        setCells(prev => { const n = new Map(prev); n.delete(idx); return n; });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between font-bold text-xl px-2">
                <span className="text-gray-800 dark:text-gray-200">Score: <span className="text-primary-600 dark:text-primary-400">{score}</span></span>
                <span className="text-red-500">{timeLeft}s</span>
            </div>
            <div className="grid grid-cols-3 gap-3 aspect-square bg-gray-100 dark:bg-gray-800 p-3 rounded-xl select-none border-2 border-primary-100 dark:border-primary-900/30">
                {Array.from({ length: BLITZ_GRID_SIZE }).map((_, i) => {
                    const cell = cells.get(i);
                    return (
                        <div key={i} onMouseDown={(e) => {e.preventDefault(); handleTap(i);}} className={`rounded-lg flex items-center justify-center font-bold text-sm sm:text-base transition-all cursor-pointer select-none shadow-sm ${cell ? cell.color : 'bg-white/50 dark:bg-white/5'} ${cell ? 'scale-100' : 'scale-95'}`}>
                            {cell?.text}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: BIBLE TRIVIA (DYNAMIC)
// ==========================================
const BibleTriviaGame: React.FC<{ onScore: (s: number) => void, onEnd: () => void }> = ({ onScore, onEnd }) => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    // Initialize with a random subset of questions
    useEffect(() => {
        const sessionQuestions = getRandomSubset(ALL_TRIVIA_QUESTIONS, 7); // 7 questions per round
        setQuestions(sessionQuestions);
    }, []);

    const handleAnswer = (idx: number) => {
        if (idx === questions[qIndex].c) setScore(s => s + 100);
        if (qIndex < questions.length - 1) {
            setQIndex(q => q + 1);
        } else {
            setFinished(true);
        }
    };

    useEffect(() => {
        if (finished) {
            onScore(score);
            setTimeout(onEnd, 2000); 
        }
    }, [finished]);

    if (questions.length === 0) return <div className="text-center py-10 text-gray-500">Loading Questions...</div>;
    if (finished) return <div className="text-center text-2xl font-bold py-10 text-primary-600 dark:text-primary-400 animate-fade-in-up">Final Score: {score}</div>;

    const q = questions[qIndex];

    return (
        <div className="space-y-6 text-center animate-fade-in-up">
            <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                <span>Q: {qIndex + 1}/{questions.length}</span>
                <span>Score: {score}</span>
            </div>
            <h3 className="text-xl font-bold h-24 flex items-center justify-center px-2 text-gray-900 dark:text-white">{q.q}</h3>
            <div className="grid grid-cols-1 gap-3">
                {q.a.map((opt: string, i: number) => (
                    <button 
                        key={i} 
                        onClick={() => handleAnswer(i)} 
                        className="w-full py-4 px-4 text-lg font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-all active:scale-[0.98]"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: VERSE SCRAMBLE (DYNAMIC)
// ==========================================
const VerseScrambleGame: React.FC<{ onScore: (s: number) => void, onEnd: () => void }> = ({ onScore, onEnd }) => {
    const [verses, setVerses] = useState<any[]>([]);
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [words, setWords] = useState<{id:number, t:string}[]>([]);
    const [selected, setSelected] = useState<{id:number, t:string}[]>([]);
    
    // Initialize random verses
    useEffect(() => {
        const sessionVerses = getRandomSubset(ALL_VERSES, 5);
        setVerses(sessionVerses);
    }, []);

    useEffect(() => {
        if (verses.length > 0) {
            if (round >= verses.length) {
                onScore(score);
                onEnd();
                return;
            }
            const verseWords = verses[round].text.split(' ').map((t: string, i: number) => ({ id: i, t }));
            setWords(shuffle(verseWords));
            setSelected([]);
        }
    }, [round, verses]);

    const handleWordClick = (word: {id:number, t:string}) => {
        const newSelected = [...selected, word];
        setSelected(newSelected);
        setWords(words.filter(w => w.id !== word.id));

        const currentPhrase = newSelected.map(w => w.t).join(' ');
        if (currentPhrase === verses[round].text) {
            setScore(s => s + 50);
            setTimeout(() => setRound(r => r + 1), 500);
        } else if (newSelected.length === verses[round].text.split(' ').length) {
            setTimeout(() => {
                const verseWords = verses[round].text.split(' ').map((t: string, i: number) => ({ id: i, t }));
                setWords(shuffle(verseWords));
                setSelected([]);
            }, 500);
        }
    };

    if (verses.length === 0) return <div className="text-center py-10 text-gray-500">Loading Verses...</div>;
    if (round >= verses.length) return <div className="text-center py-10 text-primary-600 font-bold text-xl">Complete!</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                <span>Verse {round + 1}/{verses.length}</span>
                <span>Score: {score}</span>
            </div>
            <div className="min-h-[80px] p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800 flex flex-wrap gap-2 justify-center items-center">
                {selected.map(w => (
                    <span key={w.id} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg font-bold shadow-sm animate-fade-in-up">{w.t}</span>
                ))}
                {selected.length === 0 && <span className="text-gray-400 italic text-sm">Tap words below to build the verse</span>}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
                {words.map(w => (
                    <button 
                        key={w.id} 
                        onClick={() => handleWordClick(w)} 
                        className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm font-semibold text-gray-800 dark:text-gray-200 hover:border-primary-400 dark:hover:border-primary-500 active:scale-95 transition-all"
                    >
                        {w.t}
                    </button>
                ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-4 font-medium bg-gray-100 dark:bg-gray-800 py-1 px-3 rounded-full mx-auto w-fit">Hint: {verses[round].ref}</p>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: DIVINE MATCH (DYNAMIC)
// ==========================================
const DivineMatchGame: React.FC<{ onScore: (s: number) => void, onEnd: () => void }> = ({ onScore, onEnd }) => {
    const [cards, setCards] = useState<{id:number, icon:string, matched:boolean, flipped:boolean}[]>([]);
    const [moves, setMoves] = useState(0);
    
    // Initialize random icons
    useEffect(() => {
        const sessionIcons = getRandomSubset(ALL_MATCH_ICONS, 8); // 8 pairs
        const deck = [...sessionIcons, ...sessionIcons]
            .sort(() => Math.random() - 0.5)
            .map((icon, id) => ({ id, icon, matched: false, flipped: false }));
        setCards(deck);
    }, []);

    const handleFlip = (id: number) => {
        const flipped = cards.filter(c => c.flipped && !c.matched);
        if (flipped.length >= 2) return;

        setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

        if (flipped.length === 1) {
            setMoves(m => m + 1);
            const first = flipped[0];
            const second = cards.find(c => c.id === id);
            
            if (second && first.icon === second.icon) {
                setCards(prev => prev.map(c => (c.id === first.id || c.id === second.id) ? { ...c, matched: true } : c));
            } else {
                setTimeout(() => {
                    setCards(prev => prev.map(c => (c.id === first.id || c.id === id) ? { ...c, flipped: false } : c));
                }, 1000);
            }
        }
    };

    const isComplete = cards.length > 0 && cards.every(c => c.matched);

    useEffect(() => {
        if (isComplete) {
            const finalScore = Math.max(0, 1000 - (moves * 10));
            onScore(finalScore);
            setTimeout(onEnd, 2000);
        }
    }, [isComplete]);

    return (
        <div className="space-y-4">
            <div className="text-center font-bold text-gray-700 dark:text-gray-300">Moves: {moves}</div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {cards.map(c => (
                    <div 
                        key={c.id} 
                        onClick={() => !c.flipped && !c.matched && handleFlip(c.id)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer transition-all duration-500 transform ${c.flipped || c.matched ? 'bg-white dark:bg-gray-800 border-2 border-primary-500 rotate-y-180' : 'bg-primary-600 hover:bg-primary-500 shadow-md text-transparent'}`}
                    >
                        <span className={c.flipped || c.matched ? 'opacity-100' : 'opacity-0'}>{c.icon}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// SUB-COMPONENT: SHEPHERD'S SNAKE (Replaces Echo)
// ==========================================
const ShepherdSnakeGame: React.FC<{ onScore: (s: number) => void, onEnd: () => void }> = ({ onScore, onEnd }) => {
    const GRID_SIZE = 15;
    const SPEED = 200;
    
    // Initial State
    const [snake, setSnake] = useState([{x: 7, y: 7}]);
    const [food, setFood] = useState({x: 3, y: 3});
    const [direction, setDirection] = useState({x: 0, y: -1}); // Start moving UP
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    
    const gameLoopRef = useRef<number>();
    const directionRef = useRef({x: 0, y: -1}); // Ref to prevent multiple direction changes per tick

    const generateFood = () => {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        setFood(newFood);
    };

    const gameOver = () => {
        setIsGameOver(true);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        onScore(score * 10);
        setTimeout(onEnd, 3000);
    };

    const moveSnake = useCallback(() => {
        if (isGameOver) return;

        setSnake(prevSnake => {
            const head = prevSnake[0];
            const newHead = {
                x: head.x + directionRef.current.x,
                y: head.y + directionRef.current.y
            };

            // Wall Collision
            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                gameOver();
                return prevSnake;
            }

            // Self Collision
            if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                gameOver();
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Food Collision
            if (newHead.x === food.x && newHead.y === food.y) {
                setScore(s => s + 1);
                generateFood();
            } else {
                newSnake.pop(); // Remove tail if no food eaten
            }

            return newSnake;
        });
    }, [food, isGameOver]);

    // Handle Controls
    const changeDirection = (newDir: {x: number, y: number}) => {
        // Prevent reversing directly
        if (newDir.x === -directionRef.current.x && newDir.y === -directionRef.current.y) return;
        directionRef.current = newDir;
        setDirection(newDir);
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch(e.key) {
                case 'ArrowUp': changeDirection({x: 0, y: -1}); break;
                case 'ArrowDown': changeDirection({x: 0, y: 1}); break;
                case 'ArrowLeft': changeDirection({x: -1, y: 0}); break;
                case 'ArrowRight': changeDirection({x: 1, y: 0}); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Game Loop
    useEffect(() => {
        if (!isGameOver) {
            gameLoopRef.current = window.setInterval(moveSnake, SPEED);
        }
        return () => clearInterval(gameLoopRef.current);
    }, [moveSnake, isGameOver]);

    // Update food state ref for generateFood closure if needed, but setState handles it.

    return (
        <div className="space-y-4 text-center">
            <div className="font-bold text-xl flex justify-between text-gray-800 dark:text-white px-2">
                <span>Sheep Found: {score}</span>
                {isGameOver && <span className="text-red-500 animate-pulse">GAME OVER</span>}
            </div>
            
            {/* Game Board */}
            <div 
                className="bg-slate-900 rounded-lg mx-auto relative overflow-hidden shadow-2xl border-4 border-primary-600"
                style={{
                    width: '300px',
                    height: '300px',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                }}
            >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    const isSnakeHead = snake[0].x === x && snake[0].y === y;
                    const isSnakeBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
                    const isFood = food.x === x && food.y === y;

                    let content = null;
                    if (isSnakeHead) content = <div className="w-full h-full bg-primary-400 rounded-sm z-10 shadow-sm" />;
                    else if (isSnakeBody) content = <div className="w-full h-full bg-primary-600 rounded-sm opacity-80" />;
                    else if (isFood) content = <div className="w-full h-full flex items-center justify-center text-xs animate-bounce">🐑</div>;

                    return <div key={i} className="relative">{content}</div>;
                })}
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                <div></div>
                <Button size="sm" variant="secondary" className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600" onClick={() => changeDirection({x: 0, y: -1})}>▲</Button>
                <div></div>
                <Button size="sm" variant="secondary" className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600" onClick={() => changeDirection({x: -1, y: 0})}>◄</Button>
                <Button size="sm" variant="secondary" className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600" onClick={() => changeDirection({x: 0, y: 1})}>▼</Button>
                <Button size="sm" variant="secondary" className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600" onClick={() => changeDirection({x: 1, y: 0})}>►</Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Collect the lost sheep! Don't hit walls.</p>
        </div>
    );
};


// ==========================================
// MAIN COMPONENT: GAME CENTER
// ==========================================
const GameCenter: React.FC = () => {
    const { addToast } = useNotifier();
    const navigate = useNavigate();
    
    // Global State
    const [sessionState, setSessionState] = useState<'checking' | 'active' | 'expired'>('checking');
    const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
    const [activeGame, setActiveGame] = useState<GameType>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // --- SESSION MANAGEMENT (GLOBAL FOR ALL GAMES) ---
    useEffect(() => {
        const checkSession = () => {
            const now = Date.now();
            const today = new Date().toDateString();
            const storageKey = 'accf_game_session_v1';
            
            let session = null;
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) session = JSON.parse(stored);
            } catch(e) { console.error(e); }

            if (!session || session.date !== today) {
                const expiresAt = now + DAILY_ACCESS_LIMIT_MS;
                localStorage.setItem(storageKey, JSON.stringify({ date: today, expiresAt }));
                setSessionState('active');
                setSessionTimeLeft(DAILY_ACCESS_LIMIT_MS);
            } else {
                if (now >= session.expiresAt) {
                    setSessionState('expired');
                    setSessionTimeLeft(0);
                    if (isPlaying) endGame();
                } else {
                    setSessionState('active');
                    setSessionTimeLeft(session.expiresAt - now);
                }
            }
        };

        checkSession();
        const interval = setInterval(checkSession, 1000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatSessionTime = (ms: number) => {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    };

    const startGame = (type: GameType) => {
        if (sessionState === 'expired') {
            addToast("Daily limit reached! Come back tomorrow.", "error");
            return;
        }
        setActiveGame(type);
        setIsPlaying(true);
    };

    const endGame = () => {
        setIsPlaying(false);
        setActiveGame(null);
    };

    const handleGameScore = (score: number) => {
        if (score > 0) {
            addToast(`Great Job! Score: ${score}`, 'success');
            // In a real app, save high score to DB here
        } else {
            addToast(`Game Over.`, 'info');
        }
    };

    if (sessionState === 'checking') return <div className="text-center p-8">Checking access...</div>;

    if (sessionState === 'expired') {
        return (
            <div className="max-w-md mx-auto py-12 px-4 animate-fade-in-up">
                <Card className="text-center border-t-4 border-red-500 bg-white dark:bg-dark">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClockIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Arcade Closed</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        You've used your 10 minutes of game time today. Stay focused on your spiritual goals!
                    </p>
                    <Button onClick={() => navigate('/tasks')} variant="primary" className="w-full">
                        <ClockIcon className="w-5 h-5 mr-2" /> Go to Tasks
                    </Button>
                </Card>
            </div>
        );
    }

    // --- GAME LOBBY VIEW ---
    if (!activeGame) {
        const games = [
            { id: 'blitz', name: 'Spirit Blitz', icon: <FireIcon className="w-8 h-8 text-orange-500"/>, desc: 'Tap Fruits of Spirit, avoid Flesh!', color: 'border-orange-500' },
            { id: 'trivia', name: 'Bible Trivia', icon: <BookOpenIcon className="w-8 h-8 text-blue-500"/>, desc: 'Test your scriptural knowledge.', color: 'border-blue-500' },
            { id: 'scramble', name: 'Verse Scramble', icon: <SparklesIcon className="w-8 h-8 text-purple-500"/>, desc: 'Unscramble the holy words.', color: 'border-purple-500' },
            { id: 'match', name: 'Divine Match', icon: <HeartIcon className="w-8 h-8 text-red-500"/>, desc: 'Find the matching pairs.', color: 'border-red-500' },
            { id: 'snake', name: "Shepherd's Snake", icon: <CrownIcon className="w-8 h-8 text-green-500"/>, desc: 'Collect lost sheep, avoid walls!', color: 'border-green-500' },
        ];

        return (
            <div className="space-y-6 max-w-2xl mx-auto pb-8">
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex items-center justify-center gap-2 text-primary-800 dark:text-primary-200 text-sm font-bold">
                    <ClockIcon className="w-4 h-4" />
                    <span>Time Remaining: {formatSessionTime(sessionTimeLeft)}</span>
                </div>

                <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Fellowship Arcade</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {games.map(g => (
                        <div 
                            key={g.id} 
                            onClick={() => startGame(g.id as GameType)}
                            className={`bg-white dark:bg-dark p-6 rounded-xl shadow-md cursor-pointer hover:shadow-xl hover:scale-105 transition-all border-b-4 hover:border-primary-500 border-gray-200 dark:border-gray-700 flex flex-col items-center text-center group`}
                        >
                            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">{g.icon}</div>
                            <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-100">{g.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{g.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- ACTIVE GAME VIEW ---
    return (
        <div className="max-w-lg mx-auto pb-8 space-y-4">
            <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/30 p-3 rounded-lg border border-primary-100 dark:border-primary-800">
                <Button variant="ghost" size="sm" onClick={endGame} className="hover:bg-white dark:hover:bg-gray-800">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Exit
                </Button>
                <div className="flex items-center gap-2 font-mono font-bold text-primary-700 dark:text-primary-300">
                    <ClockIcon className="w-4 h-4" /> {formatSessionTime(sessionTimeLeft)}
                </div>
            </div>

            <Card className="relative overflow-hidden border-4 border-gray-100 dark:border-gray-700 min-h-[400px] flex flex-col justify-center select-none bg-white dark:bg-dark">
                {activeGame === 'blitz' && <SpiritBlitzGame onScore={handleGameScore} onEnd={endGame} />}
                {activeGame === 'trivia' && <BibleTriviaGame onScore={handleGameScore} onEnd={endGame} />}
                {activeGame === 'scramble' && <VerseScrambleGame onScore={handleGameScore} onEnd={endGame} />}
                {activeGame === 'match' && <DivineMatchGame onScore={handleGameScore} onEnd={endGame} />}
                {activeGame === 'snake' && <ShepherdSnakeGame onScore={handleGameScore} onEnd={endGame} />}
            </Card>
        </div>
    );
};

export default GameCenter;
