import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import * as LucideIcons from 'lucide-react';
import { Moon, Stars, Sparkles, Clock } from 'lucide-react';

import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const BACKGROUNDS: Record<string, { gradient: string }> = {
  default: { gradient: 'from-indigo-100 via-purple-100 to-pink-100' },
  sunset: { gradient: 'from-orange-200 via-rose-200 to-purple-300' },
  ocean: { gradient: 'from-cyan-200 via-blue-300 to-indigo-400' },
  forest: { gradient: 'from-emerald-200 via-green-200 to-teal-200' },
  midnight: { gradient: 'from-slate-800 via-indigo-900 to-slate-900' },
  candy: { gradient: 'from-pink-200 via-fuchsia-200 to-violet-300' },
  aurora: { gradient: 'from-green-300 via-cyan-300 to-blue-300' },
  warm: { gradient: 'from-amber-200 via-orange-200 to-red-200' },
};

const DECORATION_ICONS: Record<string, string> = {
  stars: 'Star',
  hearts: 'Heart',
  sparkles: 'Sparkles',
  clouds: 'Cloud',
  flowers: 'Flower2',
  music: 'Music',
};

const FLOAT_ITEMS = [
  { id: 0, x: 5, y: 8, size: 22, delay: 0, duration: 7 },
  { id: 1, x: 88, y: 5, size: 18, delay: 1.2, duration: 9 },
  { id: 2, x: 12, y: 75, size: 26, delay: 0.5, duration: 6 },
  { id: 3, x: 92, y: 70, size: 20, delay: 2, duration: 8 },
  { id: 4, x: 50, y: 3, size: 16, delay: 0.8, duration: 10 },
  { id: 5, x: 3, y: 45, size: 24, delay: 1.5, duration: 7 },
  { id: 6, x: 95, y: 40, size: 18, delay: 0.3, duration: 9 },
  { id: 7, x: 30, y: 90, size: 20, delay: 2.5, duration: 6 },
  { id: 8, x: 70, y: 88, size: 22, delay: 1, duration: 8 },
  { id: 9, x: 55, y: 50, size: 14, delay: 3, duration: 11 },
];

const THEMES = {
  emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', accent: 'text-emerald-600', icon: 'text-emerald-400' },
  rose: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900', accent: 'text-rose-600', icon: 'text-rose-400' },
  gold: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', accent: 'text-amber-600', icon: 'text-amber-400' },
  indigo: { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', accent: 'text-indigo-600', icon: 'text-indigo-400' },
  fuchsia: { bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-900', accent: 'text-fuchsia-600', icon: 'text-fuchsia-400' },
  sky: { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-900', accent: 'text-sky-600', icon: 'text-sky-400' },
};

type PageType = 'cover' | 'insideLeft' | 'insideRight';
type ElementType = 'text' | 'sticker' | 'image' | 'shape';

interface CardElement {
  id: string;
  type: ElementType;
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  font: string;
  page: PageType;
  isFilled?: boolean;
}

interface CardData {
  id: string;
  theme: string;
  elements: CardElement[];
  bgStyle: string;
  bgDecoration: string;
  openAnimation: string;
}

export default function ViewGreeting() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<CardData | null>(null);
  const [error, setError] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      const id = searchParams.get('id');
      const d = searchParams.get('d'); // Legacy support

      if (id) {
        try {
          const docRef = doc(db, 'cards', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const cardData = docSnap.data();
            
            // Check if card is expired
            if (cardData.expiresAt && cardData.expiresAt < Date.now()) {
              setIsExpired(true);
              setIsLoading(false);
              return;
            }

            setData({
              id: cardData.id,
              theme: cardData.theme,
              elements: JSON.parse(cardData.elements),
              bgStyle: cardData.bgStyle || 'default',
              bgDecoration: cardData.bgDecoration || 'sparkles',
              openAnimation: cardData.openAnimation || 'confetti'
            });
          } else {
            setError(true);
          }
        } catch (e) {
          console.error('Failed to fetch card', e);
          setError(true);
        }
      } else if (d) {
        // Legacy base64 support
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(d)));
          if (decoded.t && decoded.f && decoded.m) {
            // Convert legacy to new format
            setData({
              id: 'legacy',
              theme: decoded.th || 'gold',
              bgStyle: 'default',
              bgDecoration: 'sparkles',
              openAnimation: 'confetti',
              elements: [
                { id: '1', type: 'sticker', content: '🌙', x: 140, y: 80, scale: 3, rotation: 0, color: '#d97706', font: 'font-sans', page: 'cover' },
                { id: '2', type: 'text', content: 'Eid Mubarak!', x: 60, y: 200, scale: 1.5, rotation: 0, color: '#1c1917', font: 'font-serif', page: 'cover' },
                { id: '3', type: 'text', content: 'Tap to open ✨', x: 90, y: 280, scale: 0.8, rotation: 0, color: '#78716c', font: 'font-sans', page: 'cover' },
                { id: '4', type: 'text', content: `Eid Mubarak,\n${decoded.t}!`, x: 40, y: 50, scale: 1.2, rotation: 0, color: '#1c1917', font: 'font-serif', page: 'insideRight' },
                { id: '5', type: 'text', content: `"${decoded.m}"`, x: 20, y: 150, scale: 0.9, rotation: 0, color: '#57534e', font: 'font-sans', page: 'insideRight' },
                { id: '6', type: 'text', content: `With love,\n${decoded.f}`, x: 100, y: 300, scale: 1, rotation: 0, color: '#1c1917', font: 'font-serif', page: 'insideRight' },
              ]
            });
          } else {
            setError(true);
          }
        } catch (e) {
          console.error('Failed to parse legacy data', e);
          setError(true);
        }
      } else {
        setError(true);
      }
      setIsLoading(false);
    };

    fetchCard();
  }, [searchParams]);

  const handleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    const animType = data?.openAnimation || 'confetti';
    if (animType !== 'none') {
      setTimeout(() => triggerOpenAnimation(animType), 400);
    }
  };

  const triggerOpenAnimation = (type: string) => {
    switch (type) {
      case 'confetti': triggerConfetti(); break;
      case 'fireworks': triggerFireworks(); break;
      case 'hearts': triggerHeartsAnim(); break;
      case 'stars': triggerStarsAnim(); break;
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  };

  const triggerFireworks = () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.1 + Math.random() * 0.3 },
        colors: ['#ff0000', '#ff6600', '#ffff00', '#00ff00', '#0099ff', '#6633ff'],
        startVelocity: 45,
        gravity: 1.2,
        ticks: 100,
        zIndex: 50,
      });
    }, 400);
  };

  const triggerHeartsAnim = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      confetti({
        particleCount: 12,
        spread: 120,
        origin: { x: Math.random(), y: -0.05 },
        colors: ['#ff69b4', '#ff1493', '#dc143c', '#ff6b81', '#ee5a24'],
        shapes: ['circle'],
        scalar: 2,
        gravity: 1.2,
        drift: Math.random() * 2 - 1,
        ticks: 120,
        zIndex: 50,
      });
    }, 50);
  };

  const triggerStarsAnim = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      confetti({
        particleCount: 10,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#ffd700', '#ffec8b', '#fff8dc', '#ffa500', '#f0e68c'],
        shapes: ['star'],
        scalar: 2,
        gravity: 0.3,
        startVelocity: 30,
        ticks: 150,
        zIndex: 50,
      });
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-white/50">
          <Clock className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-2xl font-fredoka text-slate-800 mb-2">Link Expired</h2>
          <p className="text-slate-500 mb-6">This greeting card has expired and is no longer available. Cards are automatically deleted after 3 days.</p>
          <Link to="/" className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-lg shadow-violet-500/25">
            Create a new greeting
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-white/50">
          <Moon className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-2xl font-fredoka text-slate-800 mb-2">Oops!</h2>
          <p className="text-slate-500 mb-6">This greeting link seems to be broken or invalid.</p>
          <Link to="/" className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-lg shadow-violet-500/25">
            Create a new greeting
          </Link>
        </div>
      </div>
    );
  }

  const theme = THEMES[data.theme as keyof typeof THEMES] || THEMES.gold;
  const bgConfig = BACKGROUNDS[data.bgStyle] || BACKGROUNDS.default;

  const renderElements = (page: PageType) => {
    return data.elements.filter(el => el.page === page).map(el => (
      <div
        key={el.id}
        className="absolute"
        style={{
          left: el.x,
          top: el.y,
          transform: `scale(${el.scale}) rotate(${el.rotation}deg)`,
          transformOrigin: 'center',
          color: el.color,
          whiteSpace: 'pre-wrap',
          pointerEvents: 'none'
        }}
      >
        {el.type === 'text' ? (
          <div className={`${el.font} leading-tight`}>{el.content}</div>
        ) : el.type === 'image' || (el.type === 'sticker' && (el.content.startsWith('http') || el.content.startsWith('data:'))) ? (
          <img src={el.content} alt="card element" className="w-32 object-contain pointer-events-none" draggable={false} style={{ transform: 'translateZ(0)', willChange: 'transform' }} />
        ) : el.type === 'shape' ? (
          <div className="w-32 h-32 flex items-center justify-center">
            {(() => {
              // Legacy support for lowercase shape names
              const shapeName = el.content.charAt(0).toUpperCase() + el.content.slice(1);
              const ShapeIcon = (LucideIcons as any)[shapeName] || (LucideIcons as any)[el.content] || LucideIcons.Circle;
              return ShapeIcon ? (
                <ShapeIcon 
                  className="w-full h-full" 
                  fill={el.isFilled ? 'currentColor' : 'none'} 
                  strokeWidth={el.isFilled ? 0 : 2} 
                />
              ) : null;
            })()}
          </div>
        ) : (
          <div className="text-4xl">{el.content}</div>
        )}
      </div>
    ));
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-gradient-to-br ${bgConfig.gradient} transition-colors duration-1000`}>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {data.bgDecoration !== 'none' && (() => {
          const iconName = DECORATION_ICONS[data.bgDecoration] || 'Sparkles';
          const Icon = (LucideIcons as any)[iconName];
          if (!Icon) return null;
          return FLOAT_ITEMS.map(item => (
            <motion.div
              key={item.id}
              className={`absolute ${theme.icon}`}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              animate={{
                y: [0, -15, 0, 15, 0],
                x: [0, 8, 0, -8, 0],
                rotate: [0, 8, 0, -8, 0],
                opacity: [0.12, 0.3, 0.12],
                scale: [1, 1.1, 1, 0.9, 1],
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                delay: item.delay,
                ease: 'easeInOut',
              }}
            >
              <Icon size={item.size} />
            </motion.div>
          ));
        })()}
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className={`transition-transform duration-1000 ease-in-out ${isOpen ? 'scale-[0.48] sm:scale-[0.55] md:scale-90 lg:scale-100' : 'scale-[0.85] sm:scale-100 md:scale-110'}`}>
          <motion.div
            animate={{ x: isOpen ? '50%' : '0%' }}
            transition={{ duration: 1, type: "spring", bounce: 0.3 }}
            className="relative w-[320px] h-[450px]"
            style={{ perspective: '2000px' }}
          >
            {/* Inside Right (Message) */}
            <div 
              className={`absolute inset-0 ${theme.bg} rounded-r-3xl rounded-l-none shadow-2xl border border-l-0 ${theme.border} overflow-hidden`}
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ delay: isOpen ? 0.5 : 0, duration: 0.8 }}
                className="w-full h-full relative"
              >
                {renderElements('insideRight')}
              </motion.div>
            </div>

            {/* The Cover (Flap) */}
            <motion.div
              animate={{ rotateY: isOpen ? -180 : 0 }}
              transition={{ duration: 1, type: "spring", bounce: 0.3 }}
              style={{ transformOrigin: 'left', transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
              className="absolute inset-0 z-10"
            >
              {/* Front of Cover */}
              <div 
                className={`absolute inset-0 ${theme.bg} rounded-r-3xl rounded-l-none shadow-2xl border ${theme.border} cursor-pointer hover:brightness-95 transition-all overflow-hidden`}
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                onClick={handleOpen}
              >
                {renderElements('cover')}
              </div>

              {/* Back of Cover (Inside Left) */}
              <div 
                className={`absolute inset-0 ${theme.bg} rounded-l-3xl rounded-r-none border border-r-0 ${theme.border} overflow-hidden shadow-inner cursor-pointer`}
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                onClick={handleOpen}
              >
                 {/* Decorative pattern */}
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px', color: 'black' }}></div>
                 
                 <div className="w-full h-full relative">
                   {renderElements('insideLeft')}
                 </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative z-10 pb-4 sm:pb-8"
          >
            <p className={`text-xs sm:text-sm font-medium animate-pulse ${data.bgStyle === 'midnight' ? 'text-slate-300' : 'text-slate-500'}`}>
              Tap the card to open it
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="relative z-10 pb-4 sm:pb-8"
          >
            <Link 
              to="/" 
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-xl text-slate-700 rounded-full font-medium text-xs sm:text-sm shadow-lg hover:bg-white hover:shadow-xl transition-all flex items-center gap-2 border border-white/50"
            >
              <Sparkles size={16} className="text-violet-500" />
              Create your own greeting
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
