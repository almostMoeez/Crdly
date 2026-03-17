import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Sparkles, Type, Smile, Image as ImageIcon, Save, Copy, Check, Trash2, Settings, Search, Link as LinkIcon, Plus, Shapes } from 'lucide-react';

import { db } from '../firebase';
import { doc, setDoc, getDoc, increment, runTransaction } from 'firebase/firestore';

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

const THEMES = [
  { id: 'emerald', name: 'Mint', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', accent: 'text-emerald-600' },
  { id: 'rose', name: 'Blush', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900', accent: 'text-rose-600' },
  { id: 'gold', name: 'Sunshine', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', accent: 'text-amber-600' },
  { id: 'indigo', name: 'Twilight', bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', accent: 'text-indigo-600' },
  { id: 'fuchsia', name: 'Bubblegum', bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-900', accent: 'text-fuchsia-600' },
  { id: 'sky', name: 'Breeze', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-900', accent: 'text-sky-600' },
];

const FONTS = [
  { id: 'font-sans', name: 'Sans', class: 'font-sans' },
  { id: 'font-serif', name: 'Serif', class: 'font-serif' },
  { id: 'font-caveat', name: 'Hand', class: 'font-caveat' },
  { id: 'font-pacifico', name: 'Script', class: 'font-pacifico' },
  { id: 'font-fredoka', name: 'Chunky', class: 'font-fredoka' },
  { id: 'font-righteous', name: 'Funky', class: 'font-righteous' }
];
const COLORS = ['#1c1917', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

const DEFAULT_ELEMENTS: CardElement[] = [
  { id: '1', type: 'sticker', content: 'https://media.tenor.com/Z1Gg1aG1e_8AAAAi/happy-birthday.gif', x: 100, y: 60, scale: 1.5, rotation: 0, color: '#f59e0b', font: 'font-sans', page: 'cover' },
  { id: '2', type: 'text', content: 'Happy Birthday!', x: 60, y: 200, scale: 1.5, rotation: -5, color: '#ec4899', font: 'font-pacifico', page: 'cover' },
  { id: '3', type: 'text', content: 'Tap to open ✨', x: 90, y: 280, scale: 0.8, rotation: 0, color: '#8b5cf6', font: 'font-fredoka', page: 'cover' },
  { id: '4', type: 'text', content: 'Wishing you a fantastic day filled with joy and laughter.', x: 40, y: 150, scale: 1, rotation: 0, color: '#1c1917', font: 'font-caveat', page: 'insideRight' },
];

export default function CreateGreeting() {
  const [theme, setTheme] = useState(THEMES[2]);
  const [activePage, setActivePage] = useState<PageType>('cover');
  const [elements, setElements] = useState<CardElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [customSlug, setCustomSlug] = useState(() => Math.random().toString(36).substr(2, 9));
  const [slugError, setSlugError] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Sticker Search State
  const [stickerQuery, setStickerQuery] = useState('cute');
  const [stickerResults, setStickerResults] = useState<{id: string, preview: string, url: string}[]>([]);
  const [isSearchingStickers, setIsSearchingStickers] = useState(false);

  // Shape Search State
  const [shapeQuery, setShapeQuery] = useState('');
  const [shapeResults, setShapeResults] = useState<string[]>([]);

  const currentElementType = elements.find(e => e.id === selectedId)?.type;

  // Shape Search Effect
  useEffect(() => {
    if (currentElementType !== 'shape') return;
    
    const q = shapeQuery.toLowerCase().trim();
    const allIcons = Object.keys(LucideIcons).filter(key => 
      key !== 'createLucideIcon' && 
      key !== 'defaultAttributes' && 
      key !== 'Icon' && 
      key !== 'LucideProps' && 
      key !== 'LucideIcon' &&
      /^[A-Z]/.test(key)
    );
    
    if (!q) {
      setShapeResults(['Circle', 'Square', 'Triangle', 'Hexagon', 'Octagon', 'Diamond', 'Star', 'Heart', 'Cloud', 'Shield']);
      return;
    }
    
    const results = allIcons.filter(iconName => iconName.toLowerCase().includes(q)).slice(0, 30);
    setShapeResults(results);
  }, [shapeQuery, currentElementType]);

  useEffect(() => {
    if (currentElementType !== 'sticker') return;

    const fetchStickers = async () => {
      setIsSearchingStickers(true);
      try {
        const q = stickerQuery.trim() || 'cute';
        const res = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=LIVDSRZULELA&limit=24&searchfilter=sticker`);
        const data = await res.json();
        const urls = data.results.map((r: any) => ({
          id: r.id,
          preview: r.media[0].tinygif.url,
          url: r.media[0].gif.url
        }));
        setStickerResults(urls);
      } catch (error) {
        console.error("Failed to fetch stickers", error);
      } finally {
        setIsSearchingStickers(false);
      }
    };

    const timeoutId = setTimeout(fetchStickers, 500);
    return () => clearTimeout(timeoutId);
  }, [stickerQuery, currentElementType]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addElement('image', dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Default templates
  useEffect(() => {
    if (elements.length === 0) {
      setElements(DEFAULT_ELEMENTS);
    }
  }, []);

  const addElement = (type: ElementType, content: string) => {
    const newEl: CardElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      x: 100,
      y: 150,
      scale: 1,
      rotation: 0,
      color: COLORS[0],
      font: FONTS[0].class,
      page: activePage,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const updateElement = (id: string, updates: Partial<CardElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    const el = elements.find(e => e.id === id);
    if (el) {
      dragInfo.current = { id, startX: e.clientX, startY: e.clientY, initialX: el.x, initialY: el.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragInfo.current) return;
    const { id, startX, startY, initialX, initialY } = dragInfo.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    updateElement(id, { x: initialX + dx, y: initialY + dy });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragInfo.current = null;
  };

  const handleSave = async () => {
    if (!customSlug.trim()) {
      setSlugError('Please enter a custom link');
      return;
    }
    
    setIsSaving(true);
    setSlugError('');
    
    try {
      const docRef = doc(db, 'cards', customSlug);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSlugError('This link is already taken. Please choose another.');
        setIsSaving(false);
        return;
      }

      const expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days from now
      
      const cardData = {
        id: customSlug,
        theme: theme.id,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        elements: JSON.stringify(elements)
      };
      
      await setDoc(docRef, cardData);

      // Increment global card counter
      const statsRef = doc(db, 'stats', 'cards');
      await runTransaction(db, async (transaction) => {
        const statsSnap = await transaction.get(statsRef);
        if (statsSnap.exists()) {
          transaction.update(statsRef, { count: increment(1) });
        } else {
          transaction.set(statsRef, { count: 1 });
        }
      });

      const url = `${window.location.origin}/#/view?id=${customSlug}`;
      setShareUrl(url);
      setSelectedId(null);
    } catch (error) {
      console.error("Error saving card:", error);
      alert("Failed to save card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNew = () => {
    setShareUrl('');
    setCustomSlug(Math.random().toString(36).substr(2, 9));
    setElements(DEFAULT_ELEMENTS);
    setTheme(THEMES[2]);
    setActivePage('cover');
    setSelectedId(null);
    setSlugError('');
  };

  const selectedEl = elements.find(e => e.id === selectedId);
  const activeElements = elements.filter(e => e.page === activePage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col md:flex-row font-sans overflow-hidden" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {/* Sidebar Tools */}
      <div className="w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-white/50 flex flex-col h-auto md:h-screen overflow-y-auto z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-slate-100/50">
          <Link to="/" className="flex items-center gap-1 text-slate-900 font-fredoka text-2xl font-bold tracking-tight mb-6">
            Crdly<span className="text-pink-400">.</span>
          </Link>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pages</h2>
          <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl">
            {(['cover', 'insideLeft', 'insideRight'] as PageType[]).map((p) => (
              <button
                key={p}
                onClick={() => { setActivePage(p); setSelectedId(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activePage === p ? 'bg-white shadow-sm text-violet-700 ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
              >
                {p === 'cover' ? 'Cover' : p === 'insideLeft' ? 'Inside L' : 'Inside R'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-b border-slate-100/50 flex-1">
          {shareUrl ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Check size={32} />
              </div>
              <h3 className="font-bold text-slate-700 text-lg font-fredoka">Card Locked</h3>
              <p className="text-sm">Your card has been saved and is ready to share. Editing is now disabled.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Elements</h2>
              <div className="grid grid-cols-4 gap-3 mb-8">
            <button onClick={() => addElement('text', 'New Text')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200/60 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-slate-600 hover:text-violet-600 bg-white/50 shadow-sm">
              <Type size={20} />
              <span className="text-xs font-medium">Text</span>
            </button>
            <button onClick={() => addElement('sticker', 'https://media.tenor.com/1J12J5_w_50AAAAi/star-sparkle.gif')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200/60 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-slate-600 hover:text-violet-600 bg-white/50 shadow-sm">
              <Smile size={20} />
              <span className="text-xs font-medium">Sticker</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200/60 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-slate-600 hover:text-violet-600 bg-white/50 shadow-sm">
              <ImageIcon size={20} />
              <span className="text-xs font-medium">Image</span>
            </button>
            <button onClick={() => addElement('shape', 'Circle')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200/60 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-slate-600 hover:text-violet-600 bg-white/50 shadow-sm">
              <Shapes size={20} />
              <span className="text-xs font-medium">Shape</span>
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>

          {selectedEl ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Edit Element</h2>
                <button onClick={() => deleteElement(selectedEl.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>

              {selectedEl.type === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Content</label>
                  <textarea 
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                    className="w-full p-3 bg-white/50 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none shadow-sm"
                    rows={3}
                  />
                </div>
              )}

              {selectedEl.type === 'shape' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Search Shapes</label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={shapeQuery}
                        onChange={(e) => setShapeQuery(e.target.value)}
                        placeholder="Search shapes (e.g., star, heart)..."
                        className="w-full pl-9 pr-3 py-2 bg-white/50 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none shadow-sm"
                      />
                    </div>
                    <div className="h-48 overflow-y-auto border border-slate-200/60 rounded-xl p-2 bg-slate-50/50 shadow-inner">
                      <div className="grid grid-cols-5 gap-2">
                        {shapeResults.map(shape => {
                          const Icon = (LucideIcons as any)[shape];
                          if (!Icon) return null;
                          return (
                            <button
                              key={shape}
                              onClick={() => updateElement(selectedEl.id, { content: shape })}
                              className={`p-2 rounded-xl border flex items-center justify-center ${selectedEl.content === shape ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-slate-200/60 hover:bg-slate-50 text-slate-600 bg-white'}`}
                              title={shape}
                            >
                              <Icon size={20} />
                            </button>
                          );
                        })}
                      </div>
                      {shapeResults.length === 0 && (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No shapes found</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Style</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateElement(selectedEl.id, { isFilled: true })}
                        className={`flex-1 py-2 text-sm rounded-xl border ${selectedEl.isFilled ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium shadow-sm' : 'border-slate-200/60 bg-white/50 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                      >
                        Filled
                      </button>
                      <button
                        onClick={() => updateElement(selectedEl.id, { isFilled: false })}
                        className={`flex-1 py-2 text-sm rounded-xl border ${!selectedEl.isFilled ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium shadow-sm' : 'border-slate-200/60 bg-white/50 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                      >
                        Outline
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedEl.type === 'sticker' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-500">Search Stickers</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={stickerQuery}
                      onChange={(e) => setStickerQuery(e.target.value)}
                      placeholder="Search animated stickers..."
                      className="w-full pl-9 pr-3 py-2 bg-white/50 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none shadow-sm"
                    />
                  </div>
                  <div className="h-64 overflow-y-auto border border-slate-200/60 rounded-xl p-2 bg-slate-50/50 shadow-inner">
                    {isSearchingStickers ? (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">Searching...</div>
                    ) : stickerResults.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {stickerResults.map(s => (
                          <button
                            key={s.id}
                            onClick={() => updateElement(selectedEl.id, { content: s.url })}
                            className={`border-2 rounded-xl overflow-hidden hover:border-amber-400 transition-colors bg-white ${selectedEl.content === s.url ? 'border-amber-500 ring-2 ring-amber-200' : 'border-transparent shadow-sm'}`}
                          >
                            <img src={s.preview} alt="sticker" className="w-full h-auto object-contain" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">No stickers found</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Size</label>
                <input 
                  type="range" min="0.05" max="5" step="0.05" 
                  value={selectedEl.scale} 
                  onChange={(e) => updateElement(selectedEl.id, { scale: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Rotation</label>
                <input 
                  type="range" min="-180" max="180" step="1" 
                  value={selectedEl.rotation} 
                  onChange={(e) => updateElement(selectedEl.id, { rotation: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500"
                />
              </div>

              {(selectedEl.type === 'text' || selectedEl.type === 'shape') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(c => (
                        <button 
                          key={c} 
                          onClick={() => updateElement(selectedEl.id, { color: c })}
                          className={`w-8 h-8 rounded-full border-2 ${selectedEl.color === c ? 'border-violet-500 scale-110 shadow-sm' : 'border-transparent shadow-sm'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  {selectedEl.type === 'text' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">Font</label>
                      <div className="grid grid-cols-3 gap-2">
                        {FONTS.map(f => (
                        <button 
                          key={f.id} 
                          onClick={() => updateElement(selectedEl.id, { font: f.class })}
                          className={`py-2 text-sm rounded-xl border ${selectedEl.font === f.class ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm' : 'border-slate-200/60 bg-white/50 text-slate-600 hover:bg-slate-50 shadow-sm'} ${f.class}`}
                          title={f.name}
                        >
                          Aa
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
              <Settings size={32} className="opacity-50" />
              <p className="text-sm">Select an element on the card to edit it, or add a new one.</p>
            </div>
          )}
            </>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100/50">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Card Theme</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {THEMES.map(t => (
              <button 
                key={t.id} 
                onClick={() => !shareUrl && setTheme(t)}
                disabled={!!shareUrl}
                className={`w-8 h-8 rounded-full border-2 ${theme.id === t.id ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent shadow-sm'} ${t.bg} ${shareUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={t.name}
              />
            ))}
          </div>

          {!shareUrl && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Custom Link</h2>
              <div className="flex items-center bg-white border border-slate-200/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 transition-all shadow-sm">
                <div className="pl-3 pr-2 py-2 bg-slate-50 border-r border-slate-100 text-slate-400 flex items-center justify-center">
                  <LinkIcon size={14} />
                </div>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => {
                    setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase());
                    setSlugError('');
                  }}
                  className="w-full px-3 py-2 text-sm outline-none text-slate-700 placeholder-slate-300"
                  placeholder="my-custom-link"
                  maxLength={30}
                />
              </div>
              {slugError && <p className="text-rose-500 text-xs mt-2 font-medium animate-in fade-in">{slugError}</p>}
            </div>
          )}

          {shareUrl ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm">
                <Check size={16} /> Card saved successfully!
              </div>
              <button onClick={copyLink} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20">
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <Link to={`/view?id=${shareUrl.split('id=')[1]}`} target="_blank" className="w-full py-3 bg-white text-slate-700 border border-slate-200/60 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                Preview Card
              </Link>
              <button onClick={handleCreateNew} className="w-full py-3 bg-transparent text-slate-500 border border-slate-200/60 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 mt-2">
                <Plus size={18} />
                Create New Card
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 disabled:opacity-70"
            >
              {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Saving...' : 'Save & Share'}
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative" onPointerDown={() => setSelectedId(null)}>
        {/* The Card Canvas */}
        <div 
          ref={canvasRef}
          className={`relative w-[320px] h-[450px] shadow-2xl overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.border} border ${activePage === 'insideLeft' ? 'rounded-l-3xl rounded-r-none border-r-0' : activePage === 'insideRight' ? 'rounded-r-3xl rounded-l-none border-l-0' : 'rounded-r-3xl rounded-l-sm'}`}
          style={{
            backgroundImage: activePage === 'insideLeft' ? 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)' : 'none',
            backgroundSize: '24px 24px'
          }}
        >
          {activeElements.map(el => (
            <div
              key={el.id}
              className={`absolute ${shareUrl ? '' : 'cursor-move'} ${selectedId === el.id ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent z-50' : !shareUrl ? 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 hover:ring-offset-transparent z-10' : 'z-10'}`}
              style={{
                left: el.x,
                top: el.y,
                transform: `scale(${el.scale}) rotate(${el.rotation}deg)`,
                transformOrigin: 'center',
                color: el.color,
                whiteSpace: 'pre-wrap',
                userSelect: 'none'
              }}
              onPointerDown={(e) => !shareUrl && handlePointerDown(e, el.id)}
            >
              {el.type === 'text' ? (
                <div className={`${el.font} leading-tight`}>{el.content}</div>
              ) : el.type === 'image' || (el.type === 'sticker' && (el.content.startsWith('http') || el.content.startsWith('data:'))) ? (
                <img src={el.content} alt="card element" className="w-32 object-contain pointer-events-none" draggable={false} style={{ transform: 'translateZ(0)', willChange: 'transform' }} />
              ) : el.type === 'shape' ? (
                <div className="w-32 h-32 flex items-center justify-center">
                  {(() => {
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
          ))}
          
          {/* Page Indicator */}
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none opacity-30 text-xs font-bold uppercase tracking-widest font-sans">
            {activePage === 'cover' ? 'Front Cover' : activePage === 'insideLeft' ? 'Inside Left' : 'Inside Right'}
          </div>
        </div>
      </div>
    </div>
  );
}
