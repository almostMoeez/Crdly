import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Sparkles, Type, Smile, Image as ImageIcon, Save, Copy, Check, Trash2, Settings, Search, Link as LinkIcon, Plus, Shapes, Eye, X, Undo2, Redo2, RotateCw, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';

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

const BACKGROUNDS = [
  { id: 'default', name: 'Dreamy', colors: ['#e0e7ff', '#ede9fe', '#fce7f3'] },
  { id: 'sunset', name: 'Sunset', colors: ['#fed7aa', '#fecdd3', '#d8b4fe'] },
  { id: 'ocean', name: 'Ocean', colors: ['#a5f3fc', '#93c5fd', '#818cf8'] },
  { id: 'forest', name: 'Forest', colors: ['#a7f3d0', '#bbf7d0', '#99f6e4'] },
  { id: 'midnight', name: 'Midnight', colors: ['#1e293b', '#312e81', '#0f172a'] },
  { id: 'candy', name: 'Candy', colors: ['#fbcfe8', '#e9d5ff', '#c4b5fd'] },
  { id: 'aurora', name: 'Aurora', colors: ['#86efac', '#67e8f9', '#93c5fd'] },
  { id: 'warm', name: 'Warm', colors: ['#fde68a', '#fed7aa', '#fecaca'] },
];

const BG_DECORATIONS = [
  { id: 'none', name: 'None', icon: 'Ban' },
  { id: 'stars', name: 'Stars', icon: 'Star' },
  { id: 'hearts', name: 'Hearts', icon: 'Heart' },
  { id: 'sparkles', name: 'Sparkles', icon: 'Sparkles' },
  { id: 'clouds', name: 'Clouds', icon: 'Cloud' },
  { id: 'flowers', name: 'Flowers', icon: 'Flower2' },
  { id: 'music', name: 'Music', icon: 'Music' },
];

const OPEN_ANIMATIONS = [
  { id: 'confetti', name: 'Confetti', icon: 'PartyPopper' },
  { id: 'fireworks', name: 'Fireworks', icon: 'Flame' },
  { id: 'hearts', name: 'Hearts', icon: 'Heart' },
  { id: 'stars', name: 'Stars', icon: 'Star' },
  { id: 'none', name: 'None', icon: 'Ban' },
];

const PREVIEW_BG_MAP: Record<string, string> = {
  default: 'from-indigo-100 via-purple-100 to-pink-100',
  sunset: 'from-orange-200 via-rose-200 to-purple-300',
  ocean: 'from-cyan-200 via-blue-300 to-indigo-400',
  forest: 'from-emerald-200 via-green-200 to-teal-200',
  midnight: 'from-slate-800 via-indigo-900 to-slate-900',
  candy: 'from-pink-200 via-fuchsia-200 to-violet-300',
  aurora: 'from-green-300 via-cyan-300 to-blue-300',
  warm: 'from-amber-200 via-orange-200 to-red-200',
};

const DECORATION_ICON_MAP: Record<string, string> = {
  stars: 'Star', hearts: 'Heart', sparkles: 'Sparkles',
  clouds: 'Cloud', flowers: 'Flower2', music: 'Music',
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

  // Display customization
  const [bgStyle, setBgStyle] = useState('default');
  const [bgDecoration, setBgDecoration] = useState('sparkles');
  const [openAnimation, setOpenAnimation] = useState('confetti');

  // Preview mode
  const [showPreview, setShowPreview] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Undo/Redo history
  const historyRef = useRef<CardElement[][]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback((newElements: CardElement[]) => {
    const newIndex = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, newIndex);
    historyRef.current.push(JSON.parse(JSON.stringify(newElements)));
    historyIndexRef.current = newIndex;
    setElements(newElements);
    updateHistoryState();
  }, [updateHistoryState]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setElements(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    updateHistoryState();
  }, [updateHistoryState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setElements(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    updateHistoryState();
  }, [updateHistoryState]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Inline text editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const editRef = useRef<HTMLDivElement>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const resizeInfo = useRef<{ id: string; startX: number; startY: number; initialScale: number; corner: string } | null>(null);

  // Rotate state
  const [isRotating, setIsRotating] = useState(false);
  const rotateInfo = useRef<{ id: string; centerX: number; centerY: number; startAngle: number; initialRotation: number } | null>(null);

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
        const res = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=${import.meta.env.VITE_GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g`);
        const data = await res.json();
        if (!data.data) {
          setStickerResults([]);
          return;
        }
        const urls = data.data.map((r: any) => ({
          id: r.id,
          preview: r.images?.fixed_height_small?.url || r.images?.fixed_width?.url || '',
          url: r.images?.original?.url || r.images?.fixed_width?.url || ''
        })).filter((s: any) => s.url);
        setStickerResults(urls);
      } catch (error) {
        console.error("Failed to fetch stickers", error);
        setStickerResults([]);
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
      historyRef.current = [JSON.parse(JSON.stringify(DEFAULT_ELEMENTS))];
      historyIndexRef.current = 0;
      updateHistoryState();
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
    pushHistory([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const updateElement = (id: string, updates: Partial<CardElement>) => {
    const updated = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    if (isDragging || isResizing) {
      setElements(updated);
    } else {
      pushHistory(updated);
    }
  };

  const deleteElement = (id: string) => {
    pushHistory(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveLayerUp = (id: string) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx < 0 || idx >= elements.length - 1) return;
    const next = [...elements];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    pushHistory(next);
  };

  const moveLayerDown = (id: string) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx <= 0) return;
    const next = [...elements];
    [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
    pushHistory(next);
  };

  const bringToFront = (id: string) => {
    const el = elements.find(el => el.id === id);
    if (!el) return;
    pushHistory([...elements.filter(e => e.id !== id), el]);
  };

  const sendToBack = (id: string) => {
    const el = elements.find(el => el.id === id);
    if (!el) return;
    pushHistory([el, ...elements.filter(e => e.id !== id)]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || shareUrl || editingId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const STEP = e.shiftKey ? 10 : 2;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteElement(selectedId);
          break;
        case 'ArrowUp':
          e.preventDefault();
          updateElement(selectedId, { y: (elements.find(el => el.id === selectedId)?.y ?? 0) - STEP });
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateElement(selectedId, { y: (elements.find(el => el.id === selectedId)?.y ?? 0) + STEP });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          updateElement(selectedId, { x: (elements.find(el => el.id === selectedId)?.x ?? 0) - STEP });
          break;
        case 'ArrowRight':
          e.preventDefault();
          updateElement(selectedId, { x: (elements.find(el => el.id === selectedId)?.x ?? 0) + STEP });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shareUrl, elements, editingId]);

  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if (shareUrl) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [shareUrl, undo, redo]);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (isResizing) return;
    e.stopPropagation();
    if (editingId && editingId !== id) {
      finishEditing();
    }
    setSelectedId(id);
    setIsDragging(true);
    const el = elements.find(e => e.id === id);
    if (el) {
      dragInfo.current = { id, startX: e.clientX, startY: e.clientY, initialX: el.x, initialY: el.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isRotating && rotateInfo.current) {
      const { id, centerX, centerY, startAngle, initialRotation } = rotateInfo.current;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const delta = angle - startAngle;
      updateElement(id, { rotation: Math.round(initialRotation + delta) });
      return;
    }
    if (isResizing && resizeInfo.current) {
      const { id, startX, startY, initialScale, corner } = resizeInfo.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let delta: number;
      switch (corner) {
        case 'se': delta = (dx + dy) / 100; break;
        case 'ne': delta = (dx - dy) / 100; break;
        case 'sw': delta = (-dx + dy) / 100; break;
        case 'nw': delta = (-dx - dy) / 100; break;
        default: delta = (dx + dy) / 100;
      }
      const newScale = Math.max(0.1, Math.min(5, initialScale + delta));
      updateElement(id, { scale: newScale });
      return;
    }
    if (!isDragging || !dragInfo.current) return;
    const { id, startX, startY, initialX, initialY } = dragInfo.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    updateElement(id, { x: initialX + dx, y: initialY + dy });
  };

  const handlePointerUp = () => {
    if (isRotating && rotateInfo.current) {
      pushHistory(elements);
      setIsRotating(false);
      rotateInfo.current = null;
      return;
    }
    if (isResizing && resizeInfo.current) {
      pushHistory(elements);
      setIsResizing(false);
      resizeInfo.current = null;
      return;
    }
    if (isDragging && dragInfo.current) {
      pushHistory(elements);
    }
    setIsDragging(false);
    dragInfo.current = null;
  };

  const handleResizeStart = (e: React.PointerEvent, id: string, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    setIsResizing(true);
    resizeInfo.current = { id, startX: e.clientX, startY: e.clientY, initialScale: el.scale, corner };
  };

  const handleRotateStart = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const target = (e.target as HTMLElement).closest('[data-element-wrapper]') as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    setIsRotating(true);
    rotateInfo.current = { id, centerX, centerY, startAngle, initialRotation: el.rotation };
  };

  const startEditing = (id: string) => {
    if (shareUrl) return;
    const el = elements.find(e => e.id === id);
    if (!el || el.type !== 'text') return;
    setEditingId(id);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const finishEditing = () => {
    if (!editingId || !editRef.current) {
      setEditingId(null);
      return;
    }
    const newContent = editRef.current.innerText;
    updateElement(editingId, { content: newContent });
    setEditingId(null);
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
        elements: JSON.stringify(elements),
        bgStyle,
        bgDecoration,
        openAnimation
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
    historyRef.current = [JSON.parse(JSON.stringify(DEFAULT_ELEMENTS))];
    historyIndexRef.current = 0;
    updateHistoryState();
    setTheme(THEMES[2]);
    setActivePage('cover');
    setSelectedId(null);
    setSlugError('');
    setBgStyle('default');
    setBgDecoration('sparkles');
    setOpenAnimation('confetti');
  };

  const selectedEl = elements.find(e => e.id === selectedId);
  const activeElements = elements.filter(e => e.page === activePage);

  const handlePreviewOpen = () => {
    if (previewOpen) return;
    setPreviewOpen(true);
    if (openAnimation !== 'none') {
      setTimeout(() => triggerPreviewAnimation(openAnimation), 400);
    }
  };

  const triggerPreviewAnimation = (type: string) => {
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    switch (type) {
      case 'confetti': {
        const duration = 3000;
        const animEnd = Date.now() + duration;
        const interval: any = setInterval(() => {
          const left = animEnd - Date.now();
          if (left <= 0) return clearInterval(interval);
          const count = 50 * (left / duration);
          confetti({ ...defaults, particleCount: count, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount: count, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
        break;
      }
      case 'fireworks': {
        const duration = 4000;
        const animEnd = Date.now() + duration;
        const interval: any = setInterval(() => {
          if (Date.now() > animEnd) return clearInterval(interval);
          confetti({ particleCount: 80, spread: 100, origin: { x: 0.2 + Math.random() * 0.6, y: 0.1 + Math.random() * 0.3 }, colors: ['#ff0000', '#ff6600', '#ffff00', '#00ff00', '#0099ff', '#6633ff'], startVelocity: 45, gravity: 1.2, ticks: 100, zIndex: 9999 });
        }, 400);
        break;
      }
      case 'hearts': {
        const duration = 3000;
        const animEnd = Date.now() + duration;
        const interval: any = setInterval(() => {
          if (Date.now() > animEnd) return clearInterval(interval);
          confetti({ particleCount: 12, spread: 120, origin: { x: Math.random(), y: -0.05 }, colors: ['#ff69b4', '#ff1493', '#dc143c', '#ff6b81', '#ee5a24'], shapes: ['circle'], scalar: 2, gravity: 1.2, drift: Math.random() * 2 - 1, ticks: 120, zIndex: 9999 });
        }, 50);
        break;
      }
      case 'stars': {
        const duration = 3000;
        const animEnd = Date.now() + duration;
        const interval: any = setInterval(() => {
          if (Date.now() > animEnd) return clearInterval(interval);
          confetti({ particleCount: 10, spread: 360, origin: { x: 0.5, y: 0.5 }, colors: ['#ffd700', '#ffec8b', '#fff8dc', '#ffa500', '#f0e68c'], shapes: ['star'], scalar: 2, gravity: 0.3, startVelocity: 30, ticks: 150, zIndex: 9999 });
        }, 200);
        break;
      }
    }
  };

  const openPreview = () => {
    setShowPreview(true);
    setPreviewOpen(false);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewOpen(false);
  };

  const renderPreviewElements = (page: PageType) => {
    return elements.filter(el => el.page === page).map(el => (
      <div
        key={el.id}
        className="absolute"
        style={{
          left: el.x, top: el.y,
          transform: `scale(${el.scale}) rotate(${el.rotation}deg)`,
          transformOrigin: 'center', color: el.color,
          whiteSpace: 'pre-wrap', pointerEvents: 'none'
        }}
      >
        {el.type === 'text' ? (
          <div className={`${el.font} leading-tight`}>{el.content}</div>
        ) : el.type === 'image' || (el.type === 'sticker' && (el.content.startsWith('http') || el.content.startsWith('data:'))) ? (
          <img src={el.content} alt="" className="w-32 object-contain pointer-events-none" draggable={false} />
        ) : el.type === 'shape' ? (
          <div className="w-32 h-32 flex items-center justify-center">
            {(() => {
              const shapeName = el.content.charAt(0).toUpperCase() + el.content.slice(1);
              const ShapeIcon = (LucideIcons as any)[shapeName] || (LucideIcons as any)[el.content] || LucideIcons.Circle;
              return ShapeIcon ? <ShapeIcon className="w-full h-full" fill={el.isFilled ? 'currentColor' : 'none'} strokeWidth={el.isFilled ? 0 : 2} /> : null;
            })()}
          </div>
        ) : (
          <div className="text-4xl">{el.content}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col md:flex-row font-sans overflow-hidden" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {/* Sidebar Tools */}
      <div className="w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-white/50 flex flex-col h-auto md:h-screen overflow-y-auto z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-slate-100/50">
          <Link to="/" className="flex items-center gap-1 text-slate-900 font-fredoka text-2xl font-bold tracking-tight mb-6">
            Crdly<span className="text-pink-400">.</span>
          </Link>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pages</h2>
            {!shareUrl && (
              <div className="flex gap-1">
                <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Undo (Ctrl+Z)">
                  <Undo2 size={14} />
                </button>
                <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Redo (Ctrl+Y)">
                  <Redo2 size={14} />
                </button>
              </div>
            )}
          </div>
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
              <h3 className="font-bold text-slate-700 text-lg font-fredoka">All Done!</h3>
              <p className="text-sm">Your card is saved and ready to spread some joy. Share it with someone special!</p>
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
                <div className="flex items-center gap-1">
                  <button onClick={() => sendToBack(selectedEl.id)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Send to Back">
                    <ArrowDownToLine size={14} />
                  </button>
                  <button onClick={() => moveLayerDown(selectedEl.id)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Move Down">
                    <ArrowDown size={14} />
                  </button>
                  <button onClick={() => moveLayerUp(selectedEl.id)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Move Up">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => bringToFront(selectedEl.id)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Bring to Front">
                    <ArrowUpToLine size={14} />
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-0.5" />
                  <button onClick={() => deleteElement(selectedEl.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
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
            <div className="mb-6 space-y-4">
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Page Background</h2>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUNDS.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => setBgStyle(bg.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${bgStyle === bg.id ? 'border-slate-800 scale-110 shadow-md' : 'border-white/50 shadow-sm hover:scale-105'}`}
                      style={{ background: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]})` }}
                      title={bg.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Floating Decorations</h2>
                <div className="flex flex-wrap gap-2">
                  {BG_DECORATIONS.map(d => {
                    const Icon = (LucideIcons as any)[d.icon];
                    return (
                      <button
                        key={d.id}
                        onClick={() => setBgDecoration(d.id)}
                        className={`p-2 rounded-xl border transition-all ${bgDecoration === d.id ? 'border-violet-500 bg-violet-50 text-violet-600 shadow-sm' : 'border-slate-200/60 bg-white/50 text-slate-500 hover:bg-slate-50 shadow-sm'}`}
                        title={d.name}
                      >
                        {Icon && <Icon size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Open Animation</h2>
                <div className="flex flex-wrap gap-2">
                  {OPEN_ANIMATIONS.map(a => {
                    const Icon = (LucideIcons as any)[a.icon];
                    return (
                      <button
                        key={a.id}
                        onClick={() => setOpenAnimation(a.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${openAnimation === a.id ? 'border-violet-500 bg-violet-50 text-violet-600 shadow-sm' : 'border-slate-200/60 bg-white/50 text-slate-500 hover:bg-slate-50 shadow-sm'}`}
                      >
                        {Icon && <Icon size={14} />}
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
            <div className="space-y-3">
              <button
                onClick={openPreview}
                className="w-full py-3 bg-white text-slate-700 border border-slate-200/60 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Eye size={18} />
                Preview
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 disabled:opacity-70"
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save & Share'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative" onPointerDown={() => { if (editingId) finishEditing(); setSelectedId(null); }}>
        {/* The Card Canvas */}
        <div 
          ref={canvasRef}
          className={`relative w-[320px] h-[450px] shadow-2xl overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.border} border ${activePage === 'insideLeft' ? 'rounded-l-3xl rounded-r-none border-r-0' : activePage === 'insideRight' ? 'rounded-r-3xl rounded-l-none border-l-0' : 'rounded-r-3xl rounded-l-sm'}`}
          style={{
            backgroundImage: activePage === 'insideLeft' ? 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)' : 'none',
            backgroundSize: '24px 24px'
          }}
        >
          {activeElements.map((el, idx) => (
            <div
              key={el.id}
              className={`absolute ${shareUrl ? '' : 'cursor-move'} ${selectedId === el.id ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent' : !shareUrl ? 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 hover:ring-offset-transparent' : ''}`}
              style={{
                left: el.x,
                top: el.y,
                zIndex: idx + 1,
                transform: `scale(${el.scale}) rotate(${el.rotation}deg)`,
                transformOrigin: 'center',
                color: el.color,
                whiteSpace: 'pre-wrap',
                userSelect: editingId === el.id ? 'text' : 'none'
              }}
              onPointerDown={(e) => !shareUrl && handlePointerDown(e, el.id)}
              onDoubleClick={() => el.type === 'text' && startEditing(el.id)}
              data-element-wrapper
            >
              {el.type === 'text' ? (
                editingId === el.id ? (
                  <div
                    ref={editRef}
                    contentEditable
                    suppressContentEditableWarning
                    className={`${el.font} leading-tight outline-none min-w-[20px]`}
                    style={{ cursor: 'text' }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { finishEditing(); }
                      e.stopPropagation();
                    }}
                    onBlur={finishEditing}
                  >
                    {el.content}
                  </div>
                ) : (
                  <div className={`${el.font} leading-tight`}>{el.content}</div>
                )
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

              {/* Resize & rotate handles */}
              {selectedId === el.id && !shareUrl && !editingId && (
                <>
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-violet-500 rounded-full cursor-se-resize shadow-sm border border-white"
                    onPointerDown={(e) => handleResizeStart(e, el.id, 'se')}
                  />
                  <div
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-violet-500 rounded-full cursor-ne-resize shadow-sm border border-white"
                    onPointerDown={(e) => handleResizeStart(e, el.id, 'ne')}
                  />
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-violet-500 rounded-full cursor-sw-resize shadow-sm border border-white"
                    onPointerDown={(e) => handleResizeStart(e, el.id, 'sw')}
                  />
                  <div
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-violet-500 rounded-full cursor-nw-resize shadow-sm border border-white"
                    onPointerDown={(e) => handleResizeStart(e, el.id, 'nw')}
                  />
                  {/* Rotation handle */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-8 flex flex-col items-center pointer-events-none">
                    <div
                      className="w-4 h-4 bg-white border-2 border-violet-500 rounded-full cursor-grab active:cursor-grabbing shadow-sm flex items-center justify-center pointer-events-auto"
                      onPointerDown={(e) => handleRotateStart(e, el.id)}
                    >
                      <RotateCw size={8} className="text-violet-500" />
                    </div>
                    <div className="w-px h-3 bg-violet-500/50" />
                  </div>
                </>
              )}
            </div>
          ))}
          
          {/* Page Indicator */}
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none opacity-30 text-xs font-bold uppercase tracking-widest font-sans">
            {activePage === 'cover' ? 'Front Cover' : activePage === 'insideLeft' ? 'Inside Left' : 'Inside Right'}
          </div>
        </div>
      </div>

      {/* Preview Overlay */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden bg-gradient-to-br ${PREVIEW_BG_MAP[bgStyle] || PREVIEW_BG_MAP.default}`}
          >
            {/* Close button */}
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 z-[110] p-2 bg-white/80 backdrop-blur-xl rounded-full shadow-lg hover:bg-white transition-all border border-white/50"
            >
              <X size={20} className="text-slate-700" />
            </button>

            {/* Floating decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {bgDecoration !== 'none' && (() => {
              const iconName = DECORATION_ICON_MAP[bgDecoration] || 'Sparkles';
              const FloatIcon = (LucideIcons as any)[iconName];
              if (!FloatIcon) return null;
              return FLOAT_ITEMS.map(item => (
                <motion.div
                  key={item.id}
                  className="absolute text-current"
                  style={{ left: `${item.x}%`, top: `${item.y}%`, color: bgStyle === 'midnight' ? '#94a3b8' : theme.accent.replace('text-', '').includes('emerald') ? '#6ee7b7' : '#a78bfa' }}
                  animate={{
                    y: [0, -15, 0, 15, 0],
                    x: [0, 8, 0, -8, 0],
                    rotate: [0, 8, 0, -8, 0],
                    opacity: [0.12, 0.3, 0.12],
                    scale: [1, 1.1, 1, 0.9, 1],
                  }}
                  transition={{ duration: item.duration, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}
                >
                  <FloatIcon size={item.size} />
                </motion.div>
              ));
            })()}
            </div>

            {/* Card */}
            <div className="flex-1 flex items-center justify-center w-full">
              <div className={`transition-transform duration-1000 ease-in-out ${previewOpen ? 'scale-[0.55] sm:scale-[0.75] md:scale-90 lg:scale-100' : 'scale-100 sm:scale-110'}`}>
                <motion.div
                  animate={{ x: previewOpen ? '50%' : '0%' }}
                  transition={{ duration: 1, type: 'spring', bounce: 0.3 }}
                  className="relative w-[320px] h-[450px]"
                  style={{ perspective: '2000px' }}
                >
                  {/* Inside Right */}
                  <div className={`absolute inset-0 ${theme.bg} rounded-r-3xl rounded-l-none shadow-2xl border border-l-0 ${theme.border} overflow-hidden`}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: previewOpen ? 1 : 0 }}
                      transition={{ delay: previewOpen ? 0.5 : 0, duration: 0.8 }}
                      className="w-full h-full relative"
                    >
                      {renderPreviewElements('insideRight')}
                    </motion.div>
                  </div>

                  {/* Cover (flap) */}
                  <motion.div
                    animate={{ rotateY: previewOpen ? -180 : 0 }}
                    transition={{ duration: 1, type: 'spring', bounce: 0.3 }}
                    style={{ transformOrigin: 'left', transformStyle: 'preserve-3d' }}
                    className="absolute inset-0 z-10"
                  >
                    {/* Front */}
                    <div
                      className={`absolute inset-0 ${theme.bg} rounded-r-3xl rounded-l-none shadow-2xl border ${theme.border} cursor-pointer hover:brightness-95 transition-all overflow-hidden`}
                      style={{ backfaceVisibility: 'hidden' }}
                      onClick={handlePreviewOpen}
                    >
                      {renderPreviewElements('cover')}
                    </div>
                    {/* Back (Inside Left) */}
                    <div
                      className={`absolute inset-0 ${theme.bg} rounded-l-3xl rounded-r-none border border-r-0 ${theme.border} overflow-hidden shadow-inner`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px', color: 'black' }} />
                      <div className="w-full h-full relative">
                        {renderPreviewElements('insideLeft')}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Hint / replay */}
            <div className="relative z-10 pb-8">
              {!previewOpen ? (
                <p className={`text-sm font-medium ${bgStyle === 'midnight' ? 'text-slate-300' : 'text-slate-500'} animate-pulse`}>Tap the card to open it</p>
              ) : (
                <button
                  onClick={() => { setPreviewOpen(false); }}
                  className="px-5 py-2.5 bg-white/80 backdrop-blur-xl text-slate-700 rounded-full font-medium text-sm shadow-lg hover:bg-white transition-all border border-white/50"
                >
                  Replay
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
