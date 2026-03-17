import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Sparkles, Send, Palette, ArrowRight, Star } from 'lucide-react';

import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const FLOATING_CARDS = [
  { emoji: '🎂', bg: 'bg-rose-100', border: 'border-rose-200', text: 'Happy Birthday!', font: 'font-pacifico', x: '-left-6 md:left-8', y: 'top-32', rotate: -12, delay: 0 },
  { emoji: '💐', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Thank You', font: 'font-caveat', x: '-right-4 md:right-12', y: 'top-20', rotate: 8, delay: 0.15 },
  { emoji: '🎉', bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'Congrats!', font: 'font-fredoka', x: 'left-4 md:left-20', y: 'bottom-16 md:bottom-24', rotate: 6, delay: 0.3 },
  { emoji: '❤️', bg: 'bg-pink-50', border: 'border-pink-200', text: 'I Love You', font: 'font-pacifico', x: 'right-2 md:right-24', y: 'bottom-20 md:bottom-32', rotate: -6, delay: 0.45 },
];

export default function LandingPage() {
  const [cardCount, setCardCount] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'stats', 'cards'), (snap) => {
      if (snap.exists()) {
        setCardCount(snap.data().count ?? 0);
      } else {
        setCardCount(0);
      }
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans overflow-x-hidden">
      {/* Nav */}
      <nav aria-label="Main navigation" className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-slate-900 font-fredoka tracking-tight">
          Crdly<span className="text-pink-400">.</span>
        </span>
        <Link
          to="/create"
          className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Create a Card
        </Link>
      </nav>

      {/* Hero */}
      <main>
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 md:pt-24 pb-24 sm:pb-32 md:pb-44">
        {/* Floating Mini Cards — decorative */}
        {FLOATING_CARDS.map((card) => (
          <motion.div
            key={card.text}
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6 + card.delay, duration: 0.7, type: 'spring', bounce: 0.4 }}
            className={`absolute ${card.x} ${card.y} hidden sm:block z-0 pointer-events-none`}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3 + card.delay * 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`${card.bg} ${card.border} border rounded-2xl p-4 shadow-md w-32 md:w-36`}
              style={{ transform: `rotate(${card.rotate}deg)` }}
            >
              <span className="text-2xl">{card.emoji}</span>
              <p className={`text-xs mt-1.5 text-slate-700 ${card.font}`}>{card.text}</p>
            </motion.div>
          </motion.div>
        ))}

        {/* Center content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/80 rounded-full px-4 py-1.5 text-sm text-amber-700 font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              100% free, no sign-up
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900 font-fredoka"
          >
            Cards that feel{' '}
            <span className="relative inline-block">
              <span className="relative z-10">personal</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
                className="absolute -bottom-1 left-0 w-full h-3.5 bg-pink-200/60 rounded-full -z-0 origin-left"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed"
          >
            Design a greeting card with stickers, custom text &amp; fun themes — share it with a link in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/create"
              className="group w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl text-base sm:text-lg font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-3"
            >
              <Palette className="w-5 h-5" />
              Make a Card
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Card Count */}
          {cardCount !== null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 text-sm text-slate-400"
            >
              <Heart className="w-3.5 h-3.5 inline text-pink-400 fill-pink-400 mr-1 -translate-y-px" />
              <span className="font-semibold text-slate-500">{cardCount.toLocaleString()}</span> cards created so far
            </motion.p>
          )}
        </div>
      </section>

      {/* Divider wave */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-fredoka">
            Three steps. That's it.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {[
            {
              num: '01',
              title: 'Pick a theme',
              desc: 'Choose colours, fonts, and a vibe that fits the occasion.',
              accent: 'bg-violet-100 text-violet-600',
              icon: <Palette className="w-5 h-5" />,
            },
            {
              num: '02',
              title: 'Make it yours',
              desc: 'Add stickers, images, and a heartfelt message.',
              accent: 'bg-pink-100 text-pink-600',
              icon: <Sparkles className="w-5 h-5" />,
            },
            {
              num: '03',
              title: 'Share the link',
              desc: 'Copy a unique link and send it anywhere — no app required.',
              accent: 'bg-amber-100 text-amber-600',
              icon: <Send className="w-5 h-5" />,
            },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${step.accent} mb-4`}>
                {step.icon}
              </div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 font-fredoka">{step.num}</p>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-fredoka">Why Crdly?</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            {[
              { title: 'Totally free', desc: 'No hidden costs, ever. Create as many cards as you want.' },
              { title: 'No sign-up', desc: 'Start designing immediately. No accounts or passwords.' },
              { title: 'Auto-expires in 3 days', desc: 'Cards feel special because they don\'t last forever.' },
              { title: 'Works everywhere', desc: 'Share via WhatsApp, text, email — any app that opens links.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <h3 className="text-base font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <p className="text-4xl mb-4">💌</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-fredoka mb-3">
            Ready to make someone's day?
          </h2>
          <p className="text-slate-500 mb-8">It only takes a minute.</p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-base font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
          >
            Start Creating
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-3 text-sm text-slate-400">
        <p>Made by <span className="text-slate-600 font-medium">Moeez Ahmed</span></p>
        <a
          href="https://github.com/almostMoeez/Crdly"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Star className="w-3.5 h-3.5" />
          Star on GitHub
        </a>
      </footer>
    </div>
  );
}
