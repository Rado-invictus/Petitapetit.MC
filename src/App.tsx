import React, { useState, useEffect, Component } from 'react';
import { Menu, X, Bike, Calendar, ShoppingCart, Users, History, MapPin, Phone, Mail, Instagram, Facebook, Plus, Trash2, LogOut, LogIn, ShieldCheck, Save, Check, TrendingUp, TrendingDown, Wallet, Search, AlertTriangle, ChevronLeft, ChevronRight, GripVertical, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable as DraggableBase, DropResult } from '@hello-pangea/dnd';
const Draggable = DraggableBase as any;
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, doc, signInWithEmailAndPassword, updatePassword, createUserWithEmailAndPassword, secondaryAuth, setDoc, getDoc } from './firebase';

declare const cloudinary: any;

const CloudinaryUploadButton = ({
  value,
  onChange,
  label = "Choisir une photo",
}: {
  value: string,
  onChange: (url: string) => void,
  label?: string,
}) => {
  const handleUpload = () => {
    const widget = cloudinary.createUploadWidget(
      {
        cloudName: 'dipmf3yd2',    // ← ton cloud name (déjà le bon)
        uploadPreset: 'club_moto', // ← à créer dans Cloudinary (voir README ci-dessous)
        multiple: false,
        maxFiles: 1,
        sources: ['local', 'camera'],
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5000000,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          onChange(result.info.secure_url);
        }
      }
    );
    widget.open();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleUpload}
        className="w-full bg-zinc-800 border border-zinc-700 border-dashed p-3 rounded text-gray-300 hover:border-red-600 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label}
      </button>
      {value && (
        <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded">
          <img src={value} className="w-10 h-10 rounded object-cover shrink-0" referrerPolicy="no-referrer" />
          <span className="text-gray-400 text-xs truncate flex-1">{value}</span>
          <button type="button" onClick={() => onChange('')} className="text-gray-600 hover:text-red-500 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const CloudinaryGalleryUpload = ({
  value,
  onChange,
}: {
  value: string,
  onChange: (urls: string) => void,
}) => {
  const currentUrls: string[] = value
    ? value.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const handleUpload = () => {
    const widget = cloudinary.createUploadWidget(
      {
        cloudName: 'dipmf3yd2',
        uploadPreset: 'club_moto',
        multiple: true,
        maxFiles: 20,
        sources: ['local', 'camera'],
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5000000,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          const newUrls = [...currentUrls, result.info.secure_url];
          onChange(newUrls.join(', '));
        }
      }
    );
    widget.open();
  };

  const removeImage = (index: number) => {
    const newUrls = currentUrls.filter((_: string, i: number) => i !== index);
    onChange(newUrls.join(', '));
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleUpload}
        className="w-full bg-zinc-800 border border-zinc-700 border-dashed p-3 rounded text-gray-300 hover:border-red-600 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Ajouter des photos à la galerie
      </button>
      {currentUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {currentUrls.map((url: string, i: number) => (
            <div key={i} className="relative group">
              <img src={url} className="w-16 h-16 rounded object-cover border border-zinc-700" referrerPolicy="no-referrer" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {currentUrls.length > 0 && (
        <p className="text-gray-600 text-xs">{currentUrls.length} photo(s) dans la galerie</p>
      )}
    </div>
  );
};
// --- Error Handling ---

const Reveal = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => {
  const [inView, setInView] = useState(false);
  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      onViewportLeave={() => setInView(false)}
      viewport={{ amount: 0.5 }}
      className={`${className} ${inView ? 'is-in-view' : ''}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${day} ${months[parseInt(month) - 1]} ${year}`;
};
const getDaysRemaining = (dateStr: string) => {
  console.log('date reçue:', dateStr); 
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  eventDate.setHours(0, 0, 0, 0);
  const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Passé";
  if (diff === 0) return "Aujourd'hui !";
  if (diff === 1) return "Demain !";
  return `${diff} jours restants`;
};

const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Map 'Admin' to the admin email.
      let email = identifiant.toLowerCase() === 'admin' ? 'admin@petitapetit.com' : identifiant;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if admin
      if (user.email === "rradoharifetra@gmail.com" || user.email === "master@petitapetit.com") {
        onClose();
        return;
      }

      const adminDoc = await getDoc(doc(db, 'admins', user.email!.toLowerCase()));
      if (adminDoc.exists()) {
        onClose();
      } else {
        await signOut(auth);
        setError("Accès refusé. Vous n'êtes pas administrateur.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("L'authentification par email/mot de passe n'est pas activée dans Firebase.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Identifiants incorrects.');
      } else {
        setError('Erreur: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-red-900/30 p-8 rounded-xl max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-black text-white uppercase italic mb-6 text-center">Connexion <span className="text-red-600">Admin</span></h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2 uppercase tracking-widest">Identifiant</label>
            <input 
              type="text" 
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-600 outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2 uppercase tracking-widest">Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-600 outline-none transition-colors"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          
          <div className="mt-6 border-t border-zinc-800 pt-6">
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  try {
                    const userCredential = await signInWithPopup(auth, googleProvider);
                    const user = userCredential.user;

                    // Check if admin
                    if (user.email === "rradoharifetra@gmail.com" || user.email === "master@petitapetit.com") {
                      onClose();
                      return;
                    }

                    const adminDoc = await getDoc(doc(db, 'admins', user.email!.toLowerCase()));
                    if (adminDoc.exists()) {
                      onClose();
                    } else {
                      await signOut(auth);
                      setError("Accès refusé. Ce compte Google n'est pas autorisé.");
                    }
                  } catch (err: any) {
                    console.error("Google login error:", err);
                    setError("Erreur de connexion Google: " + err.message);
                  }
                }}
                className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Only throw if it's a critical error that should break the app
  // For permission-denied in listeners, we might want to just log it
  if (errInfo.error.includes('permission-denied')) {
    return; // Silently handle permission denied for listeners as we handle it via UI
  }
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, errorInfo: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-8 rounded-xl border border-red-600 max-w-lg w-full text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white uppercase italic mb-4">Oups ! Une erreur est survenue</h2>
            <p className="text-gray-400 mb-6">L'application a rencontré un problème inattendu. Veuillez rafraîchir la page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Types ---

interface Member {
  id?: string;
  name: string;
  role: string;
  bike: string;
  img: string;
  quote?: string;
  order?: number;
}

interface AgendaEvent {
  id?: string;
  title: string;
  date: string;
  time: string;
  type: string;
  desc: string;
  location?: string;
  timestamp?: number;
}

interface PastEvent {
  id?: string;
  title: string;
  date: string;
  desc?: string;
  img: string;
  images?: string[];
  timestamp?: number;
}

interface Contribution {
  id?: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  timestamp: number;
}

interface Expense {
  id?: string;
  title: string;
  amount: number;
  date: string;
  timestamp: number;
}

interface ShopItem {
  id?: string;
  title: string;
  price: number;
  desc: string;
  img: string;
  category: string;
  contact?: string;
  timestamp: number;
}

interface EventRegistration {
  id?: string;
  eventId: string;
  eventName: string;
  name: string;
  bike: string;
  contact: string;
  timestamp: number;
}

interface Stats {
  id?: string;
  activeMembers: string;
  annualRides: string;
  kilometers: string;
  yearsActive: string;
  charityWorks: string;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab, user, isAdmin, onLoginClick }: { activeTab: string, setActiveTab: (tab: string) => void, user: any, isAdmin: boolean, onLoginClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Bike },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'shop', label: 'Shop', icon: ShoppingCart },
    { id: 'members', label: 'Les bikers', icon: Users },
    { id: 'member_space', label: 'Events', icon: History },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Espace membre', icon: ShieldCheck });
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 border-b border-red-900/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
<img src="https://res.cloudinary.com/dipmf3yd2/image/upload/v1772705541/LOGO_FINAL_l1f3td.png" alt="Logo" className="w-20 h-20 object-contain" />
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic">Petit <span className="text-red-600">A PETIT</span></span>
          </div>
          
          <div className="hidden lg:block">
            <div className="ml-10 flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === item.id ? 'text-red-600' : 'text-gray-300 hover:text-red-500'
                  }`}
                >
                  {item.id === 'shop' ? (
                    <div className={`p-2 rounded-full transition-all flex flex-col items-center ${activeTab === 'shop' ? 'bg-red-600 text-white' : 'bg-red-600/10 text-red-600 hover:bg-red-600/20'}`}>
                      <item.icon className="w-8 h-8" />
                      <span className="text-[10px] uppercase font-bold mt-1">Shop</span>
                    </div>
                  ) : (
                    item.label
                  )}
                </button>
              ))}
              {!user ? (
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 transition-all"
                >
                  <LogIn className="w-4 h-4" /> Login
                </button>
              ) : (
                <button 
                  onClick={() => signOut(auth)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-md text-sm font-bold hover:bg-red-600 hover:text-white transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-black border-b border-red-900/30"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                  className={`block w-full text-left px-3 py-4 rounded-md text-base font-medium ${
                    activeTab === item.id ? 'text-red-600 bg-red-900/10' : 'text-gray-300 hover:text-red-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.id === 'shop' ? (
                      <div className="p-2 bg-red-600 rounded-full text-white flex flex-col items-center">
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] uppercase font-bold mt-1">Shop</span>
                      </div>
                    ) : (
                      <item.icon className="w-5 h-5" />
                    )}
                    {item.label}
                  </div>
                </button>
              ))}
              {!user ? (
                <button 
                  onClick={() => { onLoginClick(); setIsOpen(false); }}
                  className="w-full text-left px-3 py-4 text-red-600 font-bold flex items-center gap-3"
                >
                  <LogIn className="w-5 h-5" /> Login
                </button>
              ) : (
                <button 
                  onClick={() => { signOut(auth); setIsOpen(false); }}
                  className="w-full text-left px-3 py-4 text-gray-400 font-bold flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5" /> Déconnexion
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-zinc-950 border-t border-red-900/20 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">Petit à Petit <span className="text-red-600">Motard Club</span></span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            La sécurité est notre fondation. Nous roulons avec discipline et respect pour la machine. Un équipement de protection complet ainsi que le casque sont obligatoires pour chaque participant.
          </p>
        </div>
        <div>
          <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Contact</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Antananarivo, Madagascar</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <Phone className="w-4 h-4 text-red-600" />
              <span>+261 34 03 896 22</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <Mail className="w-4 h-4 text-red-600" />
              <span>petitapetit261@gmail.com</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Suivez-nous</h3>
          <div className="flex gap-4">
            <a href="https://www.facebook.com/profile.php?id=61559290282828" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/ride_made_in_mada.261" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-zinc-900 text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} <span className="text-white">Petit à Petit</span> <span className="text-red-600">Motard Club</span>. Tous droits réservés.
      </div>
    </div>
  </footer>
);

const Home = ({ setActiveTab, stats, members }: { setActiveTab: (tab: string) => void, stats: Stats, members: Member[] }) => (
  <div className="pt-20">
    {/* Hero Section */}
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop" 
          alt="Motorcycle on road" 
          className="w-full h-full object-cover opacity-50 grayscale"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-6">
            Les petits deviendront <span className="text-red-600">Grands</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 font-light max-w-2xl mx-auto">
            Roulez avec une communauté de motards d'Antananarivo. 
            Vivez l'aventure malgache avec style et puissance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setActiveTab('agenda')} className="px-8 py-4 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all transform hover:scale-105">
              Les prochaines sorties
            </button>
            <button onClick={() => setActiveTab('members')} className="px-8 py-4 border border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all transform hover:scale-105">
              Les membres
            </button>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Presentation Section */}
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase italic mb-8 border-l-4 border-red-600 pl-6">
              Qui sommes-nous ?
            </h2>
            <div className="space-y-6 text-gray-400 leading-relaxed text-lg">
              <p>
                <span className="text-white font-bold">Petit à Petit</span> est un club de moto fondé en 2024, réunissant des passionnés de moto sportives, café racers et roadsters. Notre philosophie repose sur des valeurs de solidarité, de bénévolat et de participation aux événements caritatifs et compétitions.
              </p>
              <p>
                Nous organisons des sorties à moto, des ateliers de réparation et soutenons des <span className="text-white font-bold">causes qui nous tiennent à cœur.</span>
              </p>
            </div>
          </motion.div>
          <Reveal className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-4 border-l-4 border-red-600"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-4 border-r-4 border-red-600"></div>
            <img 
              src="https://res.cloudinary.com/dipmf3yd2/image/upload/v1772726052/Yoran_goauxm.jpg" 
              alt="Club meeting" 
              className="rounded-lg shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
          </Reveal>
        </div>
      </div>
    </section>

    {/* Stats Section */}
    <section className="py-20 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 text-center">
          {[
            { label: 'Membres Actifs', value: String(members.length) },
            { label: 'Sorties Annuelles', value: stats.annualRides },
            { label: 'Kilomètres Parcourus', value: stats.kilometers },
            { label: 'Années d\'Existence', value: stats.yearsActive },
            { label: 'Œuvres Caritatives & Sociales', value: stats.charityWorks },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-black text-red-600 mb-2 italic">{stat.value}</div>
              <div className="text-gray-400 uppercase text-xs tracking-widest font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const Agenda = ({ events }: { events: AgendaEvent[] }) => {
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [regForm, setRegForm] = useState({ name: '', bike: '', contact: '', accepted: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !regForm.accepted) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'event_registrations'), {
        eventId: selectedEvent.id,
        eventName: selectedEvent.title,
        name: regForm.name,
        bike: regForm.bike,
        contact: regForm.contact,
        timestamp: Date.now()
      });
      setSelectedEvent(null);
      setRegForm({ name: '', bike: '', contact: '', accepted: false });
      alert('Inscription réussie !');
    } catch (error) {
      console.error(error);
      alert('Erreur lors de l\'inscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase italic mb-4">Agenda <span className="text-red-600">2026</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Ne manquez aucun de nos prochains rendez-vous. Préparez vos machines !</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.length > 0 ? events.map((event, i) => (
            <Reveal
              key={event.id || i}
              className="bg-zinc-900 p-8 border-l-4 border-red-600 hover:bg-zinc-800 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-red-600 font-bold text-sm uppercase tracking-widest">{event.type}</span>
                <div className="text-right">
<div className="text-white font-bold">{formatDate(event.date)}</div>
<div className="text-red-500 text-xs font-bold uppercase tracking-widest">{getDaysRemaining(event.date)}</div>
<div className="text-gray-500 text-sm">{event.time}</div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic mb-4 group-hover:text-red-500 transition-colors">{event.title}</h3>
              {event.location && (
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{event.location}</span>
                </div>
              )}
              <p className="text-gray-400 text-sm leading-relaxed">{event.desc}</p>
              <button 
                onClick={() => setSelectedEvent(event)}
                className="mt-6 text-white text-xs font-bold uppercase tracking-widest border-b border-red-600 pb-1 hover:text-red-600 transition-colors"
              >
                S'inscrire à l'event
              </button>
            </Reveal>
          )) : (
            <div className="col-span-2 text-center py-20 text-gray-500">Aucun événement prévu pour le moment.</div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-red-900/30 p-8 rounded-xl max-w-md w-full relative"
            >
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-black text-white uppercase italic mb-2">Inscription</h3>
              <p className="text-red-600 font-bold text-sm mb-6">{selectedEvent.title}</p>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2">Nom complet</label>
                  <input type="text" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-600 outline-none transition-colors" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2">Moto</label>
                  <input type="text" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-600 outline-none transition-colors" value={regForm.bike} onChange={e => setRegForm({...regForm, bike: e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2">Contact (Téléphone)</label>
                  <input type="tel" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white focus:border-red-600 outline-none transition-colors" value={regForm.contact} onChange={e => setRegForm({...regForm, contact: e.target.value})} />
                </div>
                
                <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg mt-6">
                  <p className="text-gray-300 text-xs leading-relaxed italic">
                    La sécurité est notre fondation. Nous roulons avec discipline et respect pour la machine. Un équipement de protection complet ainsi que le casque sont obligatoires pour chaque participant.
                  </p>
                </div>
                
                <label className="flex items-start gap-3 cursor-pointer mt-4">
                  <input type="checkbox" required className="mt-1 accent-red-600" checked={regForm.accepted} onChange={e => setRegForm({...regForm, accepted: e.target.checked})} />
                  <span className="text-sm text-gray-400">J'accepte les conditions de sécurité et m'engage à les respecter.</span>
                </label>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setSelectedEvent(null)} className="flex-1 py-3 bg-zinc-900 text-white font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all rounded">
                    Annuler
                  </button>
                  <button type="submit" disabled={isSubmitting || !regForm.accepted} className="flex-1 py-3 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'En cours...' : 'Valider'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Shop = ({ shopItems }: { shopItems: ShopItem[] }) => {
  const [filter, setFilter] = useState('Tous');
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  const categories = ['Tous', 'Moto', 'Pièces', 'Équipement', 'Consommables'];

  const filteredItems = shopItems
    .filter(item => filter === 'Tous' || item.category.toLowerCase() === filter.toLowerCase())
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return b.timestamp - a.timestamp;
    });

  return (
    <div className="pt-32 pb-24 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Service Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-red-600 font-bold uppercase tracking-[0.3em] text-sm mb-4 block">Service Premium</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase italic mb-8 leading-tight">
              Escorte <span className="text-red-600">Mariage</span> & Prestige
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Faites de votre entrée un moment inoubliable. Notre club propose un service d'escorte professionnel pour vos mariages et événements de prestige à Antananarivo.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Cortège de 3 à 15 motos de prestige',
                'Tenue de club coordonnée et élégante',
                'Sécurisation des carrefours et fluidification du trajet',
                'Séance photo avec les mariés et les machines',
                'Disponibilité sur tout le périmètre d\'Antananarivo'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => window.open('https://wa.me/261344428327?text=Bonjour,%20je%20souhaite%20demander%20un%20devis%20pour%20le%20service%20Premium.', '_blank')}
              className="px-10 py-5 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Demander un Devis
          </button>
        </motion.div>
        
        <Reveal className="relative grid grid-cols-2 gap-4">
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            src="https://res.cloudinary.com/dipmf3yd2/image/upload/q_auto,f_auto,w_800,c_limit/v1773057769/2026-03-09-15-00-32-318.jpg_yipnwu.jpg" 
            alt="Wedding escort 1" 
            className="rounded-lg grayscale hover:grayscale-0 transition-all duration-500"
            referrerPolicy="no-referrer"
          />
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            src="https://res.cloudinary.com/dipmf3yd2/image/upload/q_auto,f_auto,w_800,c_limit/v1773057769/2026-03-09-14-59-45-910.jpg_onugka.jpg" 
            alt="Wedding escort 2" 
            className="rounded-lg mt-12 grayscale hover:grayscale-0 transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </Reveal>
      </div>

      {/* Shop Items Section */}
      <div className="border-t border-zinc-900 pt-24">
        <div className="mb-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase italic mb-4">La <span className="text-red-600">Boutique</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Équipements, accessoires et machines d'exception sélectionnés par le club.</p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === cat ? 'bg-red-600 text-white' : 'bg-black text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-xs uppercase font-bold tracking-widest">Trier par:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black border border-zinc-800 text-white text-xs font-bold uppercase tracking-widest p-2 rounded outline-none focus:border-red-600"
            >
              <option value="recent">Plus récent</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredItems.length > 0 ? filteredItems.map((item, i) => (
            <motion.div
              key={item.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-red-600/50 transition-all"
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-white uppercase italic mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-black text-xl">{item.price.toLocaleString()} Ar</span>
                  <button 
                    onClick={() => setSelectedItem(item)}
                    className="p-3 bg-zinc-800 rounded-lg text-white hover:bg-red-600 transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-3 text-center py-20 text-gray-500">Aucun article disponible pour le moment.</div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-red-900/30 p-8 rounded-xl max-w-md w-full relative text-center"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-10 h-10 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-black text-white uppercase italic mb-2">Contact Vendeur</h3>
              <p className="text-gray-400 mb-6">Pour acheter cet article, veuillez contacter le vendeur directement.</p>
              
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-8">
                <div className="text-white font-black text-2xl tracking-widest mb-2">
                  {selectedItem.contact || '+261 34 03 896 22'}
                </div>
                <div className="text-red-600 text-xs font-bold uppercase tracking-widest">Téléphone / WhatsApp</div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-4 bg-zinc-800 text-white font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all rounded"
                >
                  Fermer
                </button>
                <a 
                  href={`https://wa.me/${(selectedItem.contact || '261340389622').replace(/\D/g, '')}?text=Bonjour,%20je%20suis%20intéressé%20par%20votre%20article%20:${selectedItem.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all rounded flex items-center justify-center gap-2"
                >
                  WhatsApp
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
};

const Members = ({ members }: { members: Member[] }) => {
  return (
    <div className="pt-32 pb-24 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase italic mb-4">L'Équipage</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Les visages derrière la passion. Une équipe dévouée au service du club.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {members.length > 0 ? members.map((member, i) => (
            <Reveal
              key={member.id || i}
              className="group relative overflow-hidden rounded-xl bg-zinc-900"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img 
                  src={member.img} 
                  alt={member.name} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="text-red-600 font-bold text-xs uppercase tracking-widest mb-1">{member.role}</div>
                <h3 className="text-2xl font-black text-white uppercase italic mb-2">{member.name}</h3>
                <p className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-white font-medium">Machine:</span> {member.bike}
                </p>
                {member.quote && (
                  <p className="text-gray-300 text-xs italic mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    "{member.quote}"
                  </p>
                )}
              </div>
            </Reveal>
          )) : (
            <div className="col-span-3 text-center py-20 text-gray-500">Aucun membre enregistré.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const MemberSpace = ({ events }: { events: PastEvent[] }) => {
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const allImages = selectedEvent ? [selectedEvent.img, ...(selectedEvent.images || [])] : [];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % allImages.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase italic mb-4">Nos <span className="text-red-600">Events</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Chez Petit à Petit, on ne se contente pas de faire ronronner les moteurs, on fait aussi rouler nos cœurs. Notre agenda est bien rempli, avec une variété d’événements pour tous les goûts : sorties moto, actions caritatives, et rencontres entre passionnés.
</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length > 0 ? events.map((event, i) => (
            <Reveal
              key={event.id || i}
              className="relative aspect-video overflow-hidden rounded-lg group cursor-pointer border border-zinc-800"
            >
              <div onClick={() => setSelectedEvent(event)}>
                <img 
                  src={event.img} 
                  alt={event.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="text-red-600 font-bold text-xs uppercase tracking-widest mb-1">{event.date}</div>
                  <h3 className="text-xl font-black text-white uppercase italic">{event.title}</h3>
                  {event.images && event.images.length > 0 && (
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> {event.images.length + 1} photos
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )) : (
            <div className="col-span-3 text-center py-20 text-gray-500">Aucun événement enregistré.</div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4 md:p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black text-white uppercase italic">{selectedEvent.title}</h3>
                <p className="text-red-600 font-bold uppercase tracking-widest text-sm">{selectedEvent.date}</p>
                {selectedEvent.desc && <p className="text-gray-400 mt-2 max-w-2xl">{selectedEvent.desc}</p>}
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-red-600 transition-all shrink-0 ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allImages.map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    className="w-full aspect-video object-cover rounded-lg border border-zinc-800 cursor-pointer hover:border-red-600 transition-colors" 
                    referrerPolicy="no-referrer"
                    onClick={() => setSelectedImageIndex(i)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button 
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-zinc-900/50 flex items-center justify-center text-white hover:bg-red-600 transition-all z-50"
            >
              <X className="w-6 h-6" />
            </button>
            
            <button 
              onClick={handlePrevImage}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900/50 flex items-center justify-center text-white hover:bg-red-600 transition-all z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img 
              src={allImages[selectedImageIndex]} 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />

            <button 
              onClick={handleNextImage}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900/50 flex items-center justify-center text-white hover:bg-red-600 transition-all z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-bold tracking-widest bg-black/50 px-4 py-2 rounded-full">
              {selectedImageIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AdminUser {
  id: string;
  email: string;
  createdAt: number;
}

const AdminDashboard = ({ 
  members, 
  agenda, 
  past, 
  shopItems,
  eventRegistrations,
  contributions, 
  expenses,
  adminUsers,
  stats
}: { 
  members: Member[], 
  agenda: AgendaEvent[], 
  past: PastEvent[],
  shopItems: ShopItem[],
  eventRegistrations: EventRegistration[],
  contributions: Contribution[],
  expenses: Expense[],
  adminUsers: AdminUser[],
  stats: Stats
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'agenda' | 'past' | 'treasury' | 'shop' | 'settings' | 'registrations'>('members');
  const [memberForm, setMemberForm] = useState<Partial<Member>>({});
  const [agendaForm, setAgendaForm] = useState<Partial<AgendaEvent>>({});
  const [pastForm, setPastForm] = useState<any>({});
  const [shopForm, setShopForm] = useState<Partial<ShopItem>>({});
  const [contributionForm, setContributionForm] = useState<Partial<Contribution>>({});
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({});
  const [confirmDelete, setConfirmDelete] = useState<{ coll: string, id: string } | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [statsForm, setStatsForm] = useState<Stats>(stats);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);
  const [editingPastId, setEditingPastId] = useState<string | null>(null);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);

  useEffect(() => {
    setStatsForm(stats);
  }, [stats]);

  const handleUpdateStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'stats'), statsForm);
      alert('Statistiques mises à jour avec succès');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    }
  };

  const ANNUAL_FEE = 50000; // 50.000 Ar

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMemberId) {
        await updateDoc(doc(db, 'members', editingMemberId), memberForm);
        setEditingMemberId(null);
      } else {
        await addDoc(collection(db, 'members'), { ...memberForm, order: members.length });
      }
      setMemberForm({});
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'members'); }
  };

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAgendaId) {
        await updateDoc(doc(db, 'agenda', editingAgendaId), agendaForm);
        setEditingAgendaId(null);
      } else {
        await addDoc(collection(db, 'agenda'), { ...agendaForm, timestamp: Date.now() });
      }
      setAgendaForm({});
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'agenda'); }
  };

  const handleAddPast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const images = typeof pastForm.images === 'string' 
        ? pastForm.images.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') 
        : (pastForm.images || []);
      
      if (editingPastId) {
        await updateDoc(doc(db, 'past_events', editingPastId), {
          ...pastForm,
          images
        });
        setEditingPastId(null);
      } else {
        await addDoc(collection(db, 'past_events'), { 
          ...pastForm, 
          images,
          timestamp: Date.now() 
        });
      }
      setPastForm({});
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'past_events'); }
  };

  const handleAddShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShopId) {
        await updateDoc(doc(db, 'shop_items', editingShopId), {
          ...shopForm,
          price: Number(shopForm.price) || 0
        });
        setEditingShopId(null);
      } else {
        await addDoc(collection(db, 'shop_items'), { 
          ...shopForm, 
          price: Number(shopForm.price) || 0,
          timestamp: Date.now() 
        });
      }
      setShopForm({});
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'shop_items'); }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!contributionForm.memberId) {
        console.error("Member ID is required");
        return;
      }
      const member = members.find(m => String(m.id).trim() === String(contributionForm.memberId).trim());
      await addDoc(collection(db, 'contributions'), { 
        memberId: contributionForm.memberId,
        memberName: member?.name || 'Inconnu',
        amount: Number(contributionForm.amount) || 0,
        date: contributionForm.date || new Date().toISOString().split('T')[0],
        timestamp: Date.now() 
      });
      setContributionForm({});
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'contributions'); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!expenseForm.title || !expenseForm.amount || !expenseForm.date) {
        console.error("All fields are required for expenses");
        return;
      }
      await addDoc(collection(db, 'expenses'), { 
        title: expenseForm.title,
        amount: Number(expenseForm.amount) || 0,
        date: expenseForm.date,
        timestamp: Date.now() 
      });
      setExpenseForm({});
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'expenses'); }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (confirmDelete?.id === id) {
      try {
        await deleteDoc(doc(db, coll, id));
        setConfirmDelete(null);
      } catch (e) { console.error(e); }
    } else {
      setConfirmDelete({ coll, id });
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage('');
    try {
      const email = newAdminEmail.toLowerCase().trim();
      if (!email) return;
      
      await setDoc(doc(db, 'admins', email), {
        email: email,
        createdAt: Date.now()
      });
      
      setNewAdminEmail('');
      setAdminMessage('Administrateur ajouté avec succès.');
    } catch (error: any) {
      console.error("Error adding admin:", error);
      setAdminMessage("Erreur lors de l'ajout: " + error.message);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (id === auth.currentUser?.email?.toLowerCase()) {
      setAdminMessage("Erreur: Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'admins', id));
      setAdminMessage('Accès supprimé.');
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      setAdminMessage("Erreur lors de la suppression.");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(members);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      const updates = items.map((item, index) => {
        return updateDoc(doc(db, 'members', item.id!), { order: index });
      });
      await Promise.all(updates);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 mb-12 border-b border-zinc-800 pb-4 overflow-x-auto">
          <button onClick={() => setActiveTab('members')} className={`px-6 py-2 uppercase text-sm font-black italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'members' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Les bikers</button>
          <button onClick={() => setActiveTab('agenda')} className={`px-6 py-2 uppercase text-sm font-black italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'agenda' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Agenda</button>
          <button onClick={() => setActiveTab('past')} className={`px-6 py-2 uppercase text-sm font-black italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'past' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Events</button>
          <button onClick={() => setActiveTab('shop')} className={`px-6 py-2 uppercase text-sm font-black italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'shop' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Boutique</button>
          <button onClick={() => setActiveTab('registrations')} className={`px-6 py-2 uppercase text-sm font-black italic tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'registrations' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>
            Inscriptions Event
            {eventRegistrations.length > 0 && (
              <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{eventRegistrations.length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('treasury')} className={`px-6 py-2 uppercase text-sm font-black italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'treasury' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Trésorerie</button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 uppercase text-sm font-black italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'settings' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Paramètres</button>
        </div>

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 bg-zinc-900 p-8 rounded-xl border border-red-900/20">
              <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2">
                {editingMemberId ? <Edit2 className="text-red-600" /> : <Plus className="text-red-600" />} 
                {editingMemberId ? 'Modifier Membre' : 'Nouveau Membre'}
              </h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <input type="text" placeholder="Nom" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={memberForm.name || ''} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                <input type="text" placeholder="Rôle" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={memberForm.role || ''} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
                <input type="text" placeholder="Moto" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={memberForm.bike || ''} onChange={e => setMemberForm({...memberForm, bike: e.target.value})} />
                <CloudinaryUploadButton value={memberForm.img || ''} onChange={(url) => setMemberForm({...memberForm, img: url})} label="Photo du membre" />
                <input type="text" placeholder="Citation (optionnelle)" className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={memberForm.quote || ''} onChange={e => setMemberForm({...memberForm, quote: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">
                    {editingMemberId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  {editingMemberId && (
                    <button type="button" onClick={() => { setEditingMemberId(null); setMemberForm({}); }} className="px-4 bg-zinc-800 py-3 font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="members">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {members.map((m, index) => (
                        <Draggable key={m.id || `member-${index}`} draggableId={m.id || `member-${index}`} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-zinc-900 p-4 flex items-center justify-between rounded border border-zinc-800"
                            >
                              <div className="flex items-center gap-4">
                                <div {...provided.dragHandleProps} className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <img src={m.img} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                                <div>
                                  <div className="text-white font-bold">{m.name}</div>
                                  <div className="text-gray-500 text-xs uppercase">{m.role}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => { setMemberForm(m); setEditingMemberId(m.id!); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                                  className="p-2 text-gray-500 hover:text-blue-500 transition-all"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete('members', m.id!)} 
                                  className={`p-2 rounded transition-all ${confirmDelete?.id === m.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-600'}`}
                                >
                                  {confirmDelete?.id === m.id ? <Check className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 bg-zinc-900 p-8 rounded-xl border border-red-900/20">
              <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2">
                {editingAgendaId ? <Edit2 className="text-red-600" /> : <Plus className="text-red-600" />} 
                {editingAgendaId ? 'Modifier Event' : 'Nouvel Event'}
              </h3>
              <form onSubmit={handleAddAgenda} className="space-y-4">
                <input type="text" placeholder="Titre" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={agendaForm.title || ''} onChange={e => setAgendaForm({...agendaForm, title: e.target.value})} />
                <input type="date" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={agendaForm.date || ''} onChange={e => setAgendaForm({...agendaForm, date: e.target.value})} />
                <input type="time" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={agendaForm.time || ''} onChange={e => setAgendaForm({...agendaForm, time: e.target.value})} />
                <input type="text" placeholder="Type" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={agendaForm.type || ''} onChange={e => setAgendaForm({...agendaForm, type: e.target.value})} />
                <input type="text" placeholder="Lieu de rendez-vous (facultatif)" className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={agendaForm.location || ''} onChange={e => setAgendaForm({...agendaForm, location: e.target.value})} />
                <textarea placeholder="Description" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white h-24" value={agendaForm.desc || ''} onChange={e => setAgendaForm({...agendaForm, desc: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">
                    {editingAgendaId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  {editingAgendaId && (
                    <button type="button" onClick={() => { setEditingAgendaId(null); setAgendaForm({}); }} className="px-4 bg-zinc-800 py-3 font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {agenda.map(e => (
                <div key={e.id} className="bg-zinc-900 p-4 flex items-center justify-between rounded border border-zinc-800">
                  <div>
                    <div className="text-white font-bold">{e.title}</div>
                    <div className="text-gray-500 text-xs uppercase">{formatDate(e.date)} - {e.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setAgendaForm(e); setEditingAgendaId(e.id!); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                      className="p-2 text-gray-500 hover:text-blue-500 transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete('agenda', e.id!)} 
                      className={`p-2 rounded transition-all ${confirmDelete?.id === e.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-600'}`}
                    >
                      {confirmDelete?.id === e.id ? <Check className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'past' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 bg-zinc-900 p-8 rounded-xl border border-red-900/20">
              <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2">
                {editingPastId ? <Edit2 className="text-red-600" /> : <Plus className="text-red-600" />} 
                {editingPastId ? 'Modifier Galerie' : 'Nouvelle Galerie'}
              </h3>
              <form onSubmit={handleAddPast} className="space-y-4">
                <input type="text" placeholder="Titre" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={pastForm.title || ''} onChange={e => setPastForm({...pastForm, title: e.target.value})} />
                <input type="date" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={pastForm.date || ''} onChange={e => setPastForm({...pastForm, date: e.target.value})} />
                <textarea placeholder="Description" className="w-full bg-black border border-zinc-800 p-3 rounded text-white h-24" value={pastForm.desc || ''} onChange={e => setPastForm({...pastForm, desc: e.target.value})} />
                <CloudinaryUploadButton value={pastForm.img || ''} onChange={(url) => setPastForm({...pastForm, img: url})} label="Photo principale de l'événement" />
<CloudinaryGalleryUpload 
  value={Array.isArray(pastForm.images) ? pastForm.images.join(', ') : (pastForm.images || '')} 
  onChange={(urls) => setPastForm({...pastForm, images: urls})} 
/>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">
                    {editingPastId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  {editingPastId && (
                    <button type="button" onClick={() => { setEditingPastId(null); setPastForm({}); }} className="px-4 bg-zinc-800 py-3 font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {past.map(e => (
                <div key={e.id} className="bg-zinc-900 p-4 flex items-center justify-between rounded border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <img src={e.img} className="w-12 h-12 rounded object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-white font-bold">{e.title}</div>
                      <div className="text-gray-500 text-xs uppercase">{e.date} {e.images?.length ? `(${e.images.length + 1} photos)` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setPastForm(e); setEditingPastId(e.id!); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                      className="p-2 text-gray-500 hover:text-blue-500 transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete('past_events', e.id!)} 
                      className={`p-2 rounded transition-all ${confirmDelete?.id === e.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-600'}`}
                    >
                      {confirmDelete?.id === e.id ? <Check className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 bg-zinc-900 p-8 rounded-xl border border-red-900/20">
              <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2">
                {editingShopId ? <Edit2 className="text-red-600" /> : <Plus className="text-red-600" />} 
                {editingShopId ? 'Modifier Article' : 'Nouvel Article'}
              </h3>
              <form onSubmit={handleAddShopItem} className="space-y-4">
                <input type="text" placeholder="Titre" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={shopForm.title || ''} onChange={e => setShopForm({...shopForm, title: e.target.value})} />
                <input type="text" placeholder="Prix (Ar)" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={shopForm.price ? shopForm.price.toLocaleString('fr-FR') : ''} onChange={e => setShopForm({...shopForm, price: Number(e.target.value.replace(/\D/g, ''))})} />
                <select 
                  required 
                  className="w-full bg-black border border-zinc-800 p-3 rounded text-white outline-none focus:border-red-600" 
                  value={shopForm.category || ''} 
                  onChange={e => setShopForm({...shopForm, category: e.target.value})}
                >
                  <option value="" disabled>Choisir une catégorie</option>
                  <option value="Moto">Moto</option>
                  <option value="Pièces">Pièces</option>
                  <option value="Équipement">Équipement</option>
                  <option value="Consommables">Consommables</option>
                </select>
                <input type="text" placeholder="Contact Vendeur (ex: +261 ...)" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={shopForm.contact || ''} onChange={e => setShopForm({...shopForm, contact: e.target.value})} />
                <CloudinaryUploadButton value={shopForm.img || ''} onChange={(url) => setShopForm({...shopForm, img: url})} label="Photo de l'article" />
                <textarea placeholder="Description" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white h-24" value={shopForm.desc || ''} onChange={e => setShopForm({...shopForm, desc: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">
                    {editingShopId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  {editingShopId && (
                    <button type="button" onClick={() => { setEditingShopId(null); setShopForm({}); }} className="px-4 bg-zinc-800 py-3 font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {shopItems.map(item => (
                <div key={item.id} className="bg-zinc-900 p-4 flex items-center justify-between rounded border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <img src={item.img} className="w-12 h-12 rounded object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-white font-bold">{item.title}</div>
                      <div className="text-gray-500 text-xs uppercase">{item.category} - {item.price.toLocaleString()} Ar</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setShopForm(item); setEditingShopId(item.id!); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                      className="p-2 text-gray-500 hover:text-blue-500 transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete('shop_items', item.id!)} 
                      className={`p-2 rounded transition-all ${confirmDelete?.id === item.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-600'}`}
                    >
                      {confirmDelete?.id === item.id ? <Check className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white uppercase italic mb-6">Inscriptions aux événements</h3>
            {eventRegistrations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventRegistrations.map(reg => (
                  <div key={reg.id} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                    <div className="text-red-600 font-bold text-xs uppercase tracking-widest mb-2">{reg.eventName}</div>
                    <div className="text-white font-bold text-lg mb-4">{reg.name}</div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2"><Bike className="w-4 h-4" /> {reg.bike}</div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {reg.contact}</div>
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(reg.timestamp).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <button 
                      onClick={() => handleDelete('event_registrations', reg.id!)} 
                      className={`mt-4 w-full p-2 rounded transition-all flex items-center justify-center gap-2 ${confirmDelete?.id === reg.id ? 'bg-red-600 text-white' : 'bg-zinc-800 text-gray-400 hover:text-red-600 hover:bg-zinc-700'}`}
                    >
                      {confirmDelete?.id === reg.id ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      {confirmDelete?.id === reg.id ? 'Confirmer' : 'Supprimer'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">Aucune inscription pour le moment.</div>
            )}
          </div>
        )}

        {activeTab === 'treasury' && (
          <div className="space-y-12">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-bold tracking-widest">Cotisations</div>
                  <div className="text-2xl font-black text-white italic">{contributions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()} Ar</div>
                </div>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-bold tracking-widest">Dépenses</div>
                  <div className="text-2xl font-black text-white italic">{expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()} Ar</div>
                </div>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-500">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-bold tracking-widest">Solde Actuel</div>
                  <div className="text-2xl font-black text-white italic">{(contributions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) - expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)).toLocaleString()} Ar</div>
                </div>
              </div>
            </div>

            {/* Member Payment Status */}
            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800">
              <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2"><Users className="text-red-600" /> Suivi des Cotisations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-zinc-800">
                      <th className="pb-4 font-bold">Membre</th>
                      <th className="pb-4 font-bold">Payé</th>
                      <th className="pb-4 font-bold">Restant</th>
                      <th className="pb-4 font-bold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {members.map(m => {
                      const paid = contributions
                        .filter(c => String(c.memberId).trim() === String(m.id).trim())
                        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                      const remaining = Math.max(0, ANNUAL_FEE - paid);
                      return (
                        <tr key={m.id} className="text-sm">
                          <td className="py-4 text-white font-medium">{m.name}</td>
                          <td className="py-4 text-emerald-500 font-bold">{paid.toLocaleString()} Ar</td>
                          <td className="py-4 text-red-500 font-bold">{remaining.toLocaleString()} Ar</td>
                          <td className="py-4">
                            {remaining === 0 ? (
                              <span className="px-2 py-1 bg-emerald-900/20 text-emerald-500 text-[10px] font-bold uppercase rounded">À jour</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase rounded">En retard</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Add Contribution Form */}
              <div className="bg-zinc-900 p-8 rounded-xl border border-red-900/20">
                <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2"><Plus className="text-red-600" /> Enregistrer une Cotisation</h3>
                <form onSubmit={handleAddContribution} className="space-y-4">
                  <select 
                    required 
                    className="w-full bg-black border border-zinc-800 p-3 rounded text-white" 
                    value={contributionForm.memberId || ''} 
                    onChange={e => setContributionForm({...contributionForm, memberId: e.target.value})}
                  >
                    <option value="">Sélectionner un membre</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input type="text" placeholder="Montant (Ar)" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={contributionForm.amount ? contributionForm.amount.toLocaleString('fr-FR') : ''} onChange={e => setContributionForm({...contributionForm, amount: Number(e.target.value.replace(/\D/g, ''))})} />
                  <input type="date" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={contributionForm.date || ''} onChange={e => setContributionForm({...contributionForm, date: e.target.value})} />
                  <button type="submit" className="w-full bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">Enregistrer</button>
                </form>
              </div>

              {/* Add Expense Form */}
              <div className="bg-zinc-900 p-8 rounded-xl border border-red-900/20">
                <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2"><Plus className="text-red-600" /> Enregistrer une Dépense</h3>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <input type="text" placeholder="Titre / Motif" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={expenseForm.title || ''} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} />
                  <input type="text" placeholder="Montant (Ar)" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={expenseForm.amount ? expenseForm.amount.toLocaleString('fr-FR') : ''} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value.replace(/\D/g, ''))})} />
                  <input type="date" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={expenseForm.date || ''} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                  <button type="submit" className="w-full bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">Enregistrer</button>
                </form>
              </div>
            </div>

            {/* History Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Dernières Cotisations</h4>
                {contributions.map(c => (
                  <div key={c.id} className="bg-zinc-900 p-4 flex items-center justify-between rounded border border-zinc-800">
                    <div>
                      <div className="text-white font-bold">{c.memberName}</div>
                      <div className="text-gray-500 text-xs uppercase">{c.date} - <span className="text-emerald-500">+{c.amount.toLocaleString()} Ar</span></div>
                    </div>
                    <button 
                      onClick={() => handleDelete('contributions', c.id!)} 
                      className={`p-2 rounded transition-all ${confirmDelete?.id === c.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-600'}`}
                    >
                      {confirmDelete?.id === c.id ? <Check className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Dernières Dépenses</h4>
                {expenses.map(e => (
                  <div key={e.id} className="bg-zinc-900 p-4 flex items-center justify-between rounded border border-zinc-800">
                    <div>
                      <div className="text-white font-bold">{e.title}</div>
                      <div className="text-gray-500 text-xs uppercase">{e.date} - <span className="text-red-500">-{e.amount.toLocaleString()} Ar</span></div>
                    </div>
                    <button 
                      onClick={() => handleDelete('expenses', e.id!)} 
                      className={`p-2 rounded transition-all ${confirmDelete?.id === e.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-600'}`}
                    >
                      {confirmDelete?.id === e.id ? <Check className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-12">
              <div className="bg-zinc-900 p-8 rounded-xl border border-red-900/20">
                <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2"><TrendingUp className="text-red-600" /> Statistiques</h3>
                <form onSubmit={handleUpdateStats} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Membres Actifs</label>
                    <input type="text" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={statsForm.activeMembers} onChange={e => setStatsForm({...statsForm, activeMembers: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Sorties Annuelles</label>
                    <input type="text" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={statsForm.annualRides} onChange={e => setStatsForm({...statsForm, annualRides: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Kilomètres Parcourus</label>
                    <input type="text" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={statsForm.kilometers} onChange={e => setStatsForm({...statsForm, kilometers: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Années d'Existence</label>
                    <input type="text" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={statsForm.yearsActive} onChange={e => setStatsForm({...statsForm, yearsActive: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs uppercase tracking-widest mb-1">Œuvres Caritatives & Sociales</label>
                    <input type="text" required className="w-full bg-black border border-zinc-800 p-3 rounded text-white" value={statsForm.charityWorks} onChange={e => setStatsForm({...statsForm, charityWorks: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">Mettre à jour</button>
                </form>
              </div>
            </div>

            <div className="space-y-12">
              <div className="bg-zinc-900 p-8 rounded-xl border border-red-900/20">
                <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2"><ShieldCheck className="text-red-600" /> Nouvel Accès</h3>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Adresse Email Google" 
                    required 
                    className="w-full bg-black border border-zinc-800 p-3 rounded text-white" 
                    value={newAdminEmail} 
                    onChange={e => setNewAdminEmail(e.target.value)} 
                  />
                  {adminMessage && (
                    <p className={`text-sm ${adminMessage.includes('Erreur') ? 'text-red-500' : 'text-emerald-500'}`}>
                      {adminMessage}
                    </p>
                  )}
                  <button type="submit" className="w-full bg-red-600 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all">Ajouter l'accès</button>
                </form>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white uppercase italic mb-6">Comptes Administrateurs</h3>
                {adminUsers.map(admin => (
                  <div key={admin.id} className="bg-zinc-900 p-4 flex items-center justify-between rounded border border-zinc-800">
                    <div>
                      <div className="text-white font-bold">{admin.email}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteAdmin(admin.id)} 
                      className="p-2 rounded transition-all text-gray-500 hover:text-red-600"
                      title="Supprimer l'accès"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {adminUsers.length === 0 && (
                  <div className="text-gray-500 italic">Aucun compte administrateur supplémentaire.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeMembers: '30+',
    annualRides: '24',
    kilometers: '10k+',
    yearsActive: '2',
    charityWorks: '5'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const qMembers = query(collection(db, 'members'), orderBy('order', 'asc'));
    const unsubscribeMembers = onSnapshot(qMembers, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'members'));

    const qAgenda = query(collection(db, 'agenda'), orderBy('date', 'asc'));
    const unsubscribeAgenda = onSnapshot(qAgenda, (snapshot) => {
      setAgenda(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgendaEvent)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'agenda'));

    const qPast = query(collection(db, 'past_events'), orderBy('timestamp', 'desc'));
    const unsubscribePast = onSnapshot(qPast, (snapshot) => {
      setPastEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PastEvent)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'past_events');
      setLoading(false);
    });

    const qShop = query(collection(db, 'shop_items'), orderBy('timestamp', 'desc'));
    const unsubscribeShop = onSnapshot(qShop, (snapshot) => {
      setShopItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItem)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'shop_items'));

    const qRegistrations = query(collection(db, 'event_registrations'), orderBy('timestamp', 'desc'));
    const unsubscribeRegistrations = onSnapshot(qRegistrations, (snapshot) => {
      setEventRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRegistration)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'event_registrations'));

    const unsubscribeStats = onSnapshot(doc(db, 'settings', 'stats'), (docSnap) => {
      if (docSnap.exists()) {
        setStats({ id: docSnap.id, ...docSnap.data() } as Stats);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings'));

    return () => {
      unsubscribeAuth();
      unsubscribeMembers();
      unsubscribeAgenda();
      unsubscribePast();
      unsubscribeShop();
      unsubscribeRegistrations();
      unsubscribeStats();
    };
  }, []);

  useEffect(() => {
    if (user && user.email) {
      if (user.email === "rradoharifetra@gmail.com" || user.email === "master@petitapetit.com") {
        setIsAdmin(true);
      } else {
        const unsubscribeAdmin = onSnapshot(doc(db, 'admins', user.email.toLowerCase()), (doc) => {
          setIsAdmin(doc.exists());
        }, (error) => {
          console.error("Admin check failed", error);
          setIsAdmin(false);
        });
        return () => unsubscribeAdmin();
      }
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAdmin) {
      setContributions([]);
      setExpenses([]);
      setAdminUsers([]);
      return;
    }

    const qContributions = query(collection(db, 'contributions'), orderBy('timestamp', 'desc'));
    const unsubscribeContributions = onSnapshot(qContributions, (snapshot) => {
      setContributions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contributions'));

    const qExpenses = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'expenses'));

    const qAdmins = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
    const unsubscribeAdmins = onSnapshot(qAdmins, (snapshot) => {
      setAdminUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'admins'));

    return () => {
      unsubscribeContributions();
      unsubscribeExpenses();
      unsubscribeAdmins();
    };
  }, [isAdmin]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const renderContent = () => {
    if (loading) return <div className="pt-40 text-center text-red-600 animate-pulse font-black italic uppercase tracking-widest">Chargement...</div>;

    switch (activeTab) {
      case 'home': return <Home setActiveTab={setActiveTab} stats={stats} members={members} />;
      case 'agenda': return <Agenda events={agenda} />;
      case 'shop': return <Shop shopItems={shopItems} />;
      case 'members': return <Members members={members} />;
      case 'member_space': return <MemberSpace events={pastEvents} />;
      case 'admin': return isAdmin ? <AdminDashboard members={members} agenda={agenda} past={pastEvents} shopItems={shopItems} eventRegistrations={eventRegistrations} contributions={contributions} expenses={expenses} adminUsers={adminUsers} stats={stats} /> : <Home setActiveTab={setActiveTab} stats={stats} />;
      default: return <Home setActiveTab={setActiveTab} stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} isAdmin={isAdmin} onLoginClick={() => setShowLoginModal(true)} />
      
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
