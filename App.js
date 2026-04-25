/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                  LUMINA — v2.0 DEEP UPGRADE                  ║
 * ║                                                              ║
 * ║  • Pollinations.ai (бесплатно, без гео-блоков)               ║
 * ║  • Прозрачное логирование ошибок                             ║
 * ║  • Гостевой режим без зависаний                              ║
 * ║  • Улучшенный интерфейс: glass cards, smooth animations      ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  УСТАНОВКА (один раз):                                       ║
 * ║  npx expo install expo-image expo-haptics expo-blur          ║
 * ║    expo-linear-gradient expo-media-library expo-file-system  ║
 * ║    @react-native-async-storage/async-storage                 ║
 * ║    @react-navigation/native @react-navigation/bottom-tabs    ║
 * ║    react-native-screens react-native-safe-area-context       ║
 * ║    @expo/vector-icons firebase                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
  memo, createContext, useContext,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Modal, Platform,
  StatusBar, Dimensions, Animated, Pressable, Alert,
  KeyboardAvoidingView, RefreshControl, Share, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile, onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDoc, addDoc,
  updateDoc, query, orderBy, limit, onSnapshot, increment,
  serverTimestamp, where, getDocs, writeBatch, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL,
} from 'firebase/storage';
import { firebaseConfig, OPENAI_KEY } from './firebase.config';

const { width, height } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// ═══════════════════════════════════════════════════════════════
// CONFIG — настрой под себя
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
  // Генерация: 'pollinations' (бесплатно) или 'openai' (нужен ключ)
  generator: 'pollinations',
  // Ключ читается из firebase.config.js (в .gitignore) — НЕ хардкодить здесь
  openaiKey: OPENAI_KEY,

  // Firebase Storage загрузка (если выключить — URL берётся напрямую)
  uploadToStorage: false,

  // Таймауты в мс
  authTimeout: 10000,
  firestoreTimeout: 6000,
  generateTimeout: 60000,
};

// ═══════════════════════════════════════════════════════════════
// FIREBASE — конфиг читается из firebase.config.js (gitignored)
// ═══════════════════════════════════════════════════════════════
const fbApp   = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth    = getAuth(fbApp);
const db      = getFirestore(fbApp);
const storage = getStorage(fbApp);

// ═══════════════════════════════════════════════════════════════
// LOCALIZATION
// ═══════════════════════════════════════════════════════════════
const LANGS = {
  ru: {
    appName:'Lumina', tagline:'AI Art Studio',
    signin:'Войти', signup:'Регистрация',
    email:'EMAIL', password:'ПАРОЛЬ', name:'ИМЯ',
    emailPh:'you@example.com', passPh:'Минимум 6 символов', namePh:'Твоё имя',
    createAcc:'Создать аккаунт', login:'Войти', orContinue:'ИЛИ', guest:'Продолжить как гость',
    terms:'Продолжая, ты принимаешь Условия и Политику конфиденциальности',
    errEmail:'Введи корректный email', errPass:'Пароль минимум 6 символов',
    errInvalid:'Неверный email', errNotFound:'Аккаунт не найден',
    errWrong:'Неверный пароль', errCred:'Неверный email или пароль',
    errUsed:'Email уже используется', errWeak:'Пароль слишком слабый',
    errMany:'Слишком много попыток', errNet:'Нет интернета',
    hello:'Привет,', subtitle:'Что создадим сегодня?',
    search:'Поиск промптов, авторов, тегов...',
    trending:'Trending', neww:'Новые', top:'Топ', following:'Подписки',
    feed:'Лента', explore:'Обзор', create:'Создать', profile:'Профиль',
    categories:'КАТЕГОРИИ', topWorks:'ТОП РАБОТЫ',
    prompt:'ПРОМПТ', model:'МОДЕЛЬ', style:'СТИЛЬ', ratio:'СООТНОШЕНИЕ',
    promptPh:'Опиши что ты хочешь создать...',
    random:'Случайный', generate:'Создать изображение',
    generating:'Создаю магию...', genSub:'Обычно 5–15 секунд',
    previewTitle:'Твой арт появится здесь', previewSub:'Напиши промпт и нажми Создать',
    history:'История генераций', histEmpty:'Пока нет генераций',
    editProfile:'Редактировать профиль', save:'Сохранить', cancel:'Отмена',
    works:'Работы', likes:'Лайки', saved:'Сохранённые',
    followers:'Подписчики', edit:'Редактировать', share:'Поделиться',
    settings:'Настройки', darkTheme:'Тёмная тема', notifications:'Уведомления',
    language:'Язык', privacy:'Конфиденциальность', help:'Помощь', about:'О приложении',
    logout:'Выйти из аккаунта',
    copyPrompt:'Копировать', copied:'Промпт скопирован!',
    buyFor:'Купить за', scrollTop:'Наверх',
    onb1t:'Добро пожаловать в Lumina', onb1s:'Создавай уникальные AI-изображения за секунды',
    onb2t:'Исследуй сообщество', onb2s:'Тысячи работ от авторов со всего мира',
    onb3t:'Создавай без ограничений', onb3s:'Выбирай модель, стиль и соотношение сторон',
    next:'Далее', start:'Начать',
    featured:'РЕКОМЕНДУЕМОЕ',
    portraits:'Портреты', fantasy:'Фэнтези', scifi:'Sci-Fi',
    abstract:'Абстракция', nature:'Природа', cyberpunk:'Киберпанк',
    anime:'Аниме', three:'3D',
    comments:'Комментарии', addComment:'Написать комментарий...',
    send:'Отправить', noComments:'Будь первым!',
    savedToGallery:'Сохранено в галерею!', saveError:'Ошибка сохранения',
    noCredits:'Недостаточно кредитов', creditsLeft:'кредитов',
    postShared:'Работа опубликована!', generating2:'Загружаю в облако...',
    genError:'Ошибка генерации',
    publish:'Опубликовать',
    enhancePrompt:'Улучшить промпт', enhancing:'Улучшаю...', enhanced:'Промпт улучшен!',
    negativePrompt:'НЕГАТИВНЫЙ ПРОМПТ', negativePh:'Что НЕ должно быть в изображении...',
    notifications2:'Уведомления', activity:'Активность', noNotifs:'Пока нет уведомлений',
    likedYourArt:'оценил(а) твою работу', commentedOnArt:'прокомментировал(а):', startedFollowing:'подписался на тебя',
    yourLevel:'Уровень', xp:'XP', achievements:'Достижения', viewProfile:'Открыть профиль',
    posts:'Постов', remix:'Ремикс', remixOf:'Ремикс на', trendingTags:'ТРЕНДОВЫЕ ТЕГИ',
    follow:'Подписаться', unfollow:'Отписаться', following2:'Подписан', viewAll:'Все',
    achLevel1:'Новичок', achLevel2:'Творец', achLevel3:'Художник', achLevel4:'Мастер', achLevel5:'Легенда',
    achFirstPost:'Первый пост', achFirstLike:'Первый лайк', ach10Posts:'10 работ', ach100Likes:'100 лайков',
    achDaily:'Ежедневный', earnXP:'+10 XP за создание','earned':'Получено',
    skipLogin:'Пропустить вход',
    welcomeBack:'С возвращением',
    newUser:'Новый пользователь?',
    haveAccount:'Уже есть аккаунт?',
  },
  en: {
    appName:'Lumina', tagline:'AI Art Studio',
    signin:'Sign In', signup:'Sign Up',
    email:'EMAIL', password:'PASSWORD', name:'NAME',
    emailPh:'you@example.com', passPh:'Min 6 characters', namePh:'Your name',
    createAcc:'Create account', login:'Sign In', orContinue:'OR', guest:'Continue as guest',
    terms:'By continuing, you agree to Terms and Privacy Policy',
    errEmail:'Enter a valid email', errPass:'Password min 6 characters',
    errInvalid:'Invalid email', errNotFound:'Account not found',
    errWrong:'Wrong password', errCred:'Wrong email or password',
    errUsed:'Email already in use', errWeak:'Password too weak',
    errMany:'Too many attempts', errNet:'No internet',
    hello:'Hey,', subtitle:'What will we create today?',
    search:'Search prompts, authors, tags...',
    trending:'Trending', neww:'New', top:'Top', following:'Following',
    feed:'Feed', explore:'Explore', create:'Create', profile:'Profile',
    categories:'CATEGORIES', topWorks:'TOP WORKS',
    prompt:'PROMPT', model:'MODEL', style:'STYLE', ratio:'RATIO',
    promptPh:'Describe what you want to create...',
    random:'Random', generate:'Generate image',
    generating:'Creating magic...', genSub:'Usually 5–15 seconds',
    previewTitle:'Your art will appear here', previewSub:'Write a prompt and hit Generate',
    history:'Generation history', histEmpty:'No generations yet',
    editProfile:'Edit profile', save:'Save', cancel:'Cancel',
    works:'Works', likes:'Likes', saved:'Saved',
    followers:'Followers', edit:'Edit', share:'Share',
    settings:'Settings', darkTheme:'Dark theme', notifications:'Notifications',
    language:'Language', privacy:'Privacy', help:'Help', about:'About',
    logout:'Sign out',
    copyPrompt:'Copy', copied:'Prompt copied!',
    buyFor:'Buy for', scrollTop:'Top',
    onb1t:'Welcome to Lumina', onb1s:'Create unique AI images in seconds',
    onb2t:'Explore the community', onb2s:'Thousands of works from creators worldwide',
    onb3t:'Create without limits', onb3s:'Choose model, style and aspect ratio',
    next:'Next', start:'Get started',
    featured:'FEATURED',
    portraits:'Portraits', fantasy:'Fantasy', scifi:'Sci-Fi',
    abstract:'Abstract', nature:'Nature', cyberpunk:'Cyberpunk',
    anime:'Anime', three:'3D',
    comments:'Comments', addComment:'Write a comment...',
    send:'Send', noComments:'Be the first!',
    savedToGallery:'Saved to gallery!', saveError:'Save failed',
    noCredits:'Not enough credits', creditsLeft:'credits left',
    postShared:'Post published!', generating2:'Uploading to cloud...',
    genError:'Generation failed',
    publish:'Publish',
    enhancePrompt:'Enhance prompt', enhancing:'Enhancing...', enhanced:'Prompt enhanced!',
    negativePrompt:'NEGATIVE PROMPT', negativePh:'What should NOT appear in the image...',
    notifications2:'Notifications', activity:'Activity', noNotifs:'No notifications yet',
    likedYourArt:'liked your art', commentedOnArt:'commented:', startedFollowing:'started following you',
    yourLevel:'Level', xp:'XP', achievements:'Achievements', viewProfile:'View profile',
    posts:'Posts', remix:'Remix', remixOf:'Remix of', trendingTags:'TRENDING TAGS',
    follow:'Follow', unfollow:'Unfollow', following2:'Following', viewAll:'All',
    achLevel1:'Newbie', achLevel2:'Creator', achLevel3:'Artist', achLevel4:'Master', achLevel5:'Legend',
    achFirstPost:'First post', achFirstLike:'First like', ach10Posts:'10 works', ach100Likes:'100 likes',
    achDaily:'Daily streak', earnXP:'+10 XP for creating',earned:'Earned',
    skipLogin:'Skip sign in',
    welcomeBack:'Welcome back',
    newUser:'New user?',
    haveAccount:'Already have an account?',
  },
};

// ═══════════════════════════════════════════════════════════════
// THEME — улучшенная палитра
// ═══════════════════════════════════════════════════════════════
const DARK = {
  bg:'#06060E', bgSoft:'#0B0B16', bgCard:'#101020', bgElevated:'#16162A',
  border:'#1F1F35', borderSoft:'#2C2C44', borderActive:'#7B6CF5',
  text:'#F0F0FF', textMid:'#C8C8E0', textSoft:'#8E8EAC', textDim:'#525272',
  accent:'#7B6CF5', accentLight:'#9D91FF', accent2:'#EE5FA0', accent3:'#F5A623', accent4:'#10B981',
  glow:'rgba(123,108,245,0.32)', glowPink:'rgba(238,95,160,0.18)',
  error:'#EF4444', success:'#10B981',
  isDark:true,
  shadowColor: '#000',
};
const LIGHT = {
  bg:'#FAFAFF', bgSoft:'#F0F0FA', bgCard:'#FFFFFF', bgElevated:'#F5F5FF',
  border:'#E2E2F0', borderSoft:'#CFCFE5', borderActive:'#7B6CF5',
  text:'#0A0A18', textMid:'#2A2A40', textSoft:'#5C5C80', textDim:'#9090B0',
  accent:'#6B5CE5', accentLight:'#5A4DD0', accent2:'#E14B95', accent3:'#D08000', accent4:'#0E9968',
  glow:'rgba(123,108,245,0.14)', glowPink:'rgba(238,95,160,0.08)',
  error:'#DC2626', success:'#0E9968',
  isDark:false,
  shadowColor: '#7B6CF5',
};

// ═══════════════════════════════════════════════════════════════
// CONTEXTS
// ═══════════════════════════════════════════════════════════════
const ThemeContext = createContext(null);
const LangContext  = createContext(null);
const UserContext  = createContext(null);
const ToastContext = createContext(null);
const useTheme = () => useContext(ThemeContext);
const useLang  = () => useContext(LangContext);
const useUser  = () => useContext(UserContext);
const useToast = () => useContext(ToastContext);

// ═══════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════
const CARD_GRADIENTS = [
  ['#FF006E','#8338EC','#3A86FF'],['#06FFA5','#0891B2','#1E3A8A'],
  ['#F59E0B','#EF4444','#7C3AED'],['#E0E7FF','#6366F1','#1E1B4B'],
  ['#06B6D4','#8B5CF6','#EC4899'],['#FBBF24','#DC2626','#1F2937'],
  ['#8B5CF6','#3B82F6','#06B6D4'],['#DC2626','#991B1B','#0A0A0A'],
  ['#10B981','#065F46','#022C22'],['#F472B6','#BE185D','#831843'],
  ['#7C3AED','#2563EB','#0891B2'],['#F97316','#DB2777','#7E22CE'],
];
const AUTHOR_GRADIENTS = {
  'Alex K.':['#8B5CF6','#EC4899'],'Maya L.':['#10B981','#0891B2'],
  'Dmitri V.':['#F59E0B','#EF4444'],'Sophie B.':['#6366F1','#3B82F6'],
  'Kenji T.':['#06B6D4','#EC4899'],'Elena R.':['#FBBF24','#DC2626'],
  'Ravi P.':['#8B5CF6','#06B6D4'],'Luca M.':['#DC2626','#1F2937'],
};
const HEIGHTS = [200, 260, 220, 300, 180, 280, 240, 210, 270, 230, 190, 250];
const BASE_FEED = [
  {id:'s1',prompt:'Cyberpunk samurai in neon rain, highly detailed, cinematic',model:'Phoenix',  likesCount:2341,authorName:'Alex K.',  gradientIdx:0,tags:['cyberpunk'],forSale:true, price:12,viewsCount:12400},
  {id:'s2',prompt:'Ancient forest with bioluminescent plants and ethereal light',model:'Vision XL',likesCount:1876,authorName:'Maya L.',  gradientIdx:1,tags:['fantasy'],              viewsCount:8900},
  {id:'s3',prompt:'Abstract liquid metal sculpture, chrome finish',             model:'Phoenix',  likesCount:3102,authorName:'Dmitri V.',gradientIdx:2,tags:['abstract'],forSale:true,price:24,viewsCount:15600},
  {id:'s4',prompt:'Arctic wolf in blizzard, realistic fur details',             model:'Kino XL',  likesCount:987, authorName:'Sophie B.',gradientIdx:3,tags:['nature'],                viewsCount:4200},
  {id:'s5',prompt:'Underwater coral city at sunset with schools of fish',       model:'Vision XL',likesCount:2654,authorName:'Kenji T.', gradientIdx:4,tags:['fantasy'],forSale:true,price:18,viewsCount:11200},
  {id:'s6',prompt:'Minimalist geometric portrait in crimson and gold',          model:'Phoenix',  likesCount:4201,authorName:'Elena R.', gradientIdx:5,tags:['portrait'],              viewsCount:18700},
  {id:'s7',prompt:'Mystical mountain temple in golden hour light',              model:'Kino XL',  likesCount:1543,authorName:'Ravi P.',  gradientIdx:6,tags:['fantasy'],              viewsCount:6800},
  {id:'s8',prompt:'Vintage racing car studio shot, dramatic lighting',          model:'Vision XL',likesCount:2890,authorName:'Luca M.',  gradientIdx:7,tags:['product'],              viewsCount:13100},
  {id:'s9',prompt:'Dreamy cherry blossom garden with floating petals',          model:'Kino XL',  likesCount:3412,authorName:'Kenji T.', gradientIdx:8,tags:['nature'],               viewsCount:16300},
  {id:'s10',prompt:'Futuristic space station interior, cinematic',              model:'Phoenix',  likesCount:2105,authorName:'Alex K.',  gradientIdx:9,tags:['sci-fi'],forSale:true,price:15,viewsCount:9400},
  {id:'s11',prompt:'Oil painting of autumn forest, impressionist',              model:'Vision XL',likesCount:1876,authorName:'Maya L.',  gradientIdx:10,tags:['painting'],            viewsCount:7200},
  {id:'s12',prompt:'Neon tokyo alley at midnight, wet reflections',             model:'Phoenix',  likesCount:5102,authorName:'Elena R.', gradientIdx:11,tags:['cyberpunk'],forSale:true,price:20,viewsCount:23400},
];
const MODELS=[
  {id:'flux',         name:'Flux',         desc:'Universal · Best',  tag:'BEST', icon:'flame',          poll:'flux'},
  {id:'flux-realism', name:'Realism',      desc:'Photorealistic',    tag:null,   icon:'eye',            poll:'flux-realism'},
  {id:'flux-anime',   name:'Anime',        desc:'Illustration',      tag:null,   icon:'color-palette',  poll:'flux-anime'},
  {id:'flux-3d',      name:'3D',           desc:'3D Render',         tag:null,   icon:'cube',           poll:'flux-3d'},
];
const STYLES_LIST = ['Dynamic','Cinematic','Photoreal','3D Render','Illustration','Anime','Painting','Sketch'];
// Готовые идеи-стартеры для промпта
const PROMPT_IDEAS = [
  { emoji:'🌃', label:'Cyberpunk', text:'futuristic cyberpunk city at night, neon lights, rain-slicked streets, blade runner aesthetic' },
  { emoji:'🐉', label:'Dragon',    text:'majestic dragon perched on ancient ruins, sunset golden hour, fantasy art' },
  { emoji:'👤', label:'Portrait',  text:'cinematic portrait of a person, dramatic lighting, professional photography, 50mm lens' },
  { emoji:'🌌', label:'Cosmos',    text:'breathtaking nebula in deep space, swirling galaxies, vibrant cosmic colors' },
  { emoji:'🏰', label:'Castle',    text:'medieval fantasy castle on a misty mountain peak at dawn, ethereal lighting' },
  { emoji:'🌸', label:'Anime',     text:'anime girl with cherry blossoms, soft lighting, studio ghibli style' },
  { emoji:'🤖', label:'Robot',     text:'sleek humanoid robot in chrome armor, futuristic studio, dramatic shadows' },
  { emoji:'🎨', label:'Abstract',  text:'abstract fluid art with iridescent colors, marble texture, ultra detailed' },
  { emoji:'🦊', label:'Animal',    text:'majestic fox in enchanted forest, magical realism, golden hour, ethereal mist' },
  { emoji:'🏝️', label:'Tropical',  text:'paradise tropical beach with crystal clear water, palm trees, sunset, drone shot' },
];

const STYLE_ENHANCE = {
  Dynamic: '',
  Cinematic: ', cinematic',
  Photoreal: ', photorealistic',
  '3D Render': ', 3D render',
  Illustration: ', digital illustration',
  Anime: ', anime style',
  Painting: ', oil painting',
  Sketch: ', pencil sketch',
};
const RATIOS = ['1:1','16:9','9:16','4:3','3:4','21:9'];
const RATIO_DIMS = {
  '1:1':[1024,1024], '16:9':[1280,720], '9:16':[720,1280],
  '4:3':[1024,768],  '3:4':[768,1024],  '21:9':[1344,576],
};
const STORIES = [
  {id:1,name:'Alex K.',  colors:['#8B5CF6','#EC4899'],seen:false},
  {id:2,name:'Maya L.',  colors:['#10B981','#0891B2'],seen:false},
  {id:3,name:'Elena R.', colors:['#FBBF24','#DC2626'],seen:true},
  {id:4,name:'Kenji T.', colors:['#06B6D4','#EC4899'],seen:false},
  {id:5,name:'Dmitri V.',colors:['#F59E0B','#EF4444'],seen:true},
  {id:6,name:'Ravi P.',  colors:['#8B5CF6','#06B6D4'],seen:false},
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const getInitials = n => (n||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const haptic = (style='Light') => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]); } catch(e){}
};
const formatNum = n => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n||0);
const timeAgo = (ts) => {
  if (!ts) return '';
  const ms = ts.toMillis ? ts.toMillis() : (ts.seconds ? ts.seconds*1000 : Date.now());
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s<60) return 'сейчас';
  if (s<3600) return `${Math.floor(s/60)}м`;
  if (s<86400) return `${Math.floor(s/3600)}ч`;
  return `${Math.floor(s/86400)}д`;
};

// Promise with timeout — ключ к решению зависаний
const withTimeout = (promise, ms, label='operation') =>
  Promise.race([
    promise,
    new Promise((_,rej)=>setTimeout(()=>rej(new Error(`${label} timeout`)), ms)),
  ]);


// ═══════════════════════════════════════════════════════════════
// SECURITY HELPERS
// ═══════════════════════════════════════════════════════════════

// Убирает символы, способные сломать prompt-injection атаку
const sanitizePromptInput = (input) =>
  String(input)
    .replace(/[\x00-\x1F\x7F]/g, ' ')  // control chars
    .replace(/[<>{}|\\^`]/g, '')         // shell/template meta
    .slice(0, 500)
    .trim();

// Санитизация имени пользователя
const sanitizeName = (name) =>
  String(name || '')
    .replace(/[<>&"']/g, '')
    .replace(/[\x00-\x1F]/g, '')
    .trim()
    .slice(0, 50) || 'User';

// Разрешённые домены для скачивания изображений
const ALLOWED_IMAGE_HOSTS = [
  'image.pollinations.ai',
  'firebasestorage.googleapis.com',
  'oaidalleapiprodscus.blob.core.windows.net',
  'storage.googleapis.com',
];

const isAllowedImageUrl = (url) => {
  try {
    const { protocol, hostname } = new URL(url);
    return (protocol === 'https:') && ALLOWED_IMAGE_HOSTS.includes(hostname);
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
// AI PROMPT ENHANCER — улучшает промпт через Pollinations text API
// ═══════════════════════════════════════════════════════════════
async function enhancePromptWithAI(userPrompt) {
  const clean = sanitizePromptInput(userPrompt);
  // Фиксированный системный промпт отделён от пользовательского ввода
  const sys = 'Improve this AI image generation prompt by adding vivid details about lighting, atmosphere, composition and art style. Reply with ONLY the improved prompt, no quotes, no explanations, max 250 chars.\n\nOriginal prompt:\n';
  const fullQuery = encodeURIComponent(sys + clean);
  try {
    const res = await withTimeout(
      fetch(`https://text.pollinations.ai/${fullQuery}?model=openai`),
      20000, 'enhance'
    );
    if (!res.ok) throw new Error('Service error');
    const text = await res.text();
    return sanitizePromptInput(
      text.replace(/^["']|["']$/g, '').replace(/\n/g, ' ').trim()
    ).slice(0, 400);
  } catch(e) {
    throw new Error('AI улучшение временно недоступно');
  }
}

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION — Pollinations.ai (free, no geo-blocks)
// ═══════════════════════════════════════════════════════════════
async function generateImage(prompt, modelId, styleName, ratio) {
  const model = MODELS.find(m => m.id === modelId) || MODELS[0];
  const styleTag = STYLE_ENHANCE[styleName] || '';
  const finalPrompt = (prompt.trim() + styleTag).slice(0, 500);

  if (CONFIG.generator === 'openai' && CONFIG.openaiKey) {
    return generateWithOpenAI(finalPrompt, ratio);
  }
  return generateWithPollinations(finalPrompt, model.poll, ratio);
}

async function generateWithPollinations(prompt, model, ratio) {
  const [w, h] = RATIO_DIMS[ratio] || [1024, 1024];
  const seed = Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=${w}&height=${h}&seed=${seed}&nologo=true`;
  console.log('[Generate]', url.slice(0, 100) + '...');

  // Probe URL — Pollinations генерирует "на лету" при первом запросе
  try {
    const probe = await withTimeout(
      fetch(url, { method: 'GET' }),
      CONFIG.generateTimeout,
      'generation'
    );
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
  } catch (e) {
    if (e.message.includes('timeout')) {
      // Pollinations иногда долго генерирует — возвращаем URL, expo-image сам подгрузит
      if (__DEV__) console.warn('[Generate] Probe timeout, returning URL anyway');
      return url;
    }
    throw new Error('Сервис недоступен. Попробуй ещё раз.');
  }
  return url;
}

async function generateWithOpenAI(prompt, ratio) {
  const sizeMap = {'1:1':'1024x1024','16:9':'1792x1024','9:16':'1024x1792'};
  const res = await withTimeout(fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.openaiKey,
    },
    body: JSON.stringify({
      model: 'dall-e-3', prompt, n: 1,
      size: sizeMap[ratio] || '1024x1024',
      quality: 'standard', response_format: 'url',
    }),
  }), CONFIG.generateTimeout, 'OpenAI');
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(text).error?.message || msg; } catch(e){}
    throw new Error(msg);
  }
  return JSON.parse(text).data[0].url;
}

// ═══════════════════════════════════════════════════════════════
// FIRESTORE HELPERS — все с timeout
// ═══════════════════════════════════════════════════════════════
async function ensureUserDoc(uid, name, email) {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await withTimeout(getDoc(ref), CONFIG.firestoreTimeout, 'getDoc');
    if (!snap.exists()) {
      await withTimeout(setDoc(ref, {
        name: name || 'User',
        email: email || '',
        credits: 150,
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        likedPosts: [],
        createdAt: serverTimestamp(),
      }), CONFIG.firestoreTimeout, 'setDoc');
      return { credits: 150, name, email, likedPosts: [] };
    }
    return snap.data();
  } catch (e) {
    if (__DEV__) console.warn('[ensureUserDoc]');
    return { credits: 150, name, email, likedPosts: [] };
  }
}

async function seedFirestore() {
  try {
    const snap = await withTimeout(
      getDocs(query(collection(db, 'posts'), limit(1))),
      CONFIG.firestoreTimeout, 'seed-check'
    );
    if (!snap.empty) return;
    const batch = writeBatch(db);
    BASE_FEED.forEach(item => {
      const r = doc(collection(db, 'posts'));
      batch.set(r, {
        prompt: item.prompt, model: item.model, style: 'Dynamic', ratio: '1:1',
        imageUrl: null, gradientIdx: item.gradientIdx,
        authorId: 'seed', authorName: item.authorName,
        likesCount: item.likesCount, viewsCount: item.viewsCount,
        tags: item.tags, forSale: item.forSale || false, price: item.price || 0,
        createdAt: serverTimestamp(),
      });
    });
    await withTimeout(batch.commit(), CONFIG.firestoreTimeout, 'seed-commit');
  } catch (e) {
    if (__DEV__) console.warn('[seedFirestore]');
  }
}

async function uploadImageToStorage(imageUrl, uid) {
  if (!isAllowedImageUrl(imageUrl)) throw new Error('Недопустимый источник изображения');
  try {
    const localPath = `${FileSystem.cacheDirectory}lumina_${Date.now()}.jpg`;
    await FileSystem.downloadAsync(imageUrl, localPath);
    const response = await fetch(localPath);
    const blob = await response.blob();
    const path = `posts/${uid}/${Date.now()}.jpg`;
    const ref = sRef(storage, path);
    await uploadBytes(ref, blob);
    const url = await getDownloadURL(ref);
    await FileSystem.deleteAsync(localPath, { idempotent: true });
    return url;
  } catch (e) {
    if (__DEV__) console.warn('[uploadImage]');
    return imageUrl;
  }
}

async function saveImageToGallery(imageUrl) {
  if (!isAllowedImageUrl(imageUrl)) throw new Error('Недопустимый источник изображения');
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission denied');
  const localPath = `${FileSystem.cacheDirectory}lumina_save_${Date.now()}.jpg`;
  await FileSystem.downloadAsync(imageUrl, localPath);
  await MediaLibrary.saveToLibraryAsync(localPath);
  await FileSystem.deleteAsync(localPath, { idempotent: true });
}


// ═══════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Avatar
function Avatar({ name, size=32, fontSize, ring=false }) {
  const g = AUTHOR_GRADIENTS[name] || ['#7B6CF5','#EE5FA0'];
  return (
    <View style={ring && {padding:2, borderRadius:size/2+2, borderWidth:2, borderColor:'#7B6CF5'}}>
      <LinearGradient colors={g} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{width:size, height:size, borderRadius:size/2, alignItems:'center', justifyContent:'center'}}>
        <Text style={{color:'white', fontSize:fontSize||size*0.4, fontWeight:'800'}}>
          {getInitials(name)}
        </Text>
      </LinearGradient>
    </View>
  );
}

// Glass Card — стеклянный эффект
function GlassCard({ children, style, intensity=20 }) {
  const T = useTheme();
  return (
    <View style={[{borderRadius:18, overflow:'hidden', borderWidth:1, borderColor:T.border}, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={T.isDark?'dark':'light'} style={{flex:1}}>
          <View style={{backgroundColor:T.isDark?'rgba(20,20,40,0.5)':'rgba(255,255,255,0.7)', flex:1}}>
            {children}
          </View>
        </BlurView>
      ) : (
        <View style={{backgroundColor:T.bgCard, flex:1}}>
          {children}
        </View>
      )}
    </View>
  );
}

// Toast Provider
function ToastProvider({ children }) {
  const [toast, setToast] = useState({ msg: '', type: 'success', visible: false });
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;

  const show = useCallback((msg, type='success') => {
    setToast({ msg, type, visible: true });
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(ty, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast(p => ({ ...p, visible: false })));
    }, 2200);
  }, []);

  const colors = toast.type==='error' ? ['#EF4444','#DC2626']
              : toast.type==='info'  ? ['#3B82F6','#2563EB']
              : ['#7B6CF5','#EE5FA0'];
  const icon = toast.type==='error' ? 'alert-circle' : toast.type==='info' ? 'information-circle' : 'checkmark-circle';

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast.visible && (
        <Animated.View pointerEvents="none" style={[s.toastWrap, { opacity: op, transform: [{ translateY: ty }] }]}>
          <LinearGradient colors={colors} start={{x:0,y:0}} end={{x:1,y:0}} style={s.toastInner}>
            <Ionicons name={icon} size={16} color="white"/>
            <Text style={s.toastTxt} numberOfLines={2}>{toast.msg}</Text>
          </LinearGradient>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// Skeleton loader
function Skeleton({ h, radius=12, style }) {
  const T = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[{ height: h, borderRadius: radius, backgroundColor: T.bgElevated, opacity: anim }, style]}/>;
}

function FeedSkeleton() {
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 8, gap: 8 }}>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton h={200}/><Skeleton h={260}/><Skeleton h={180}/>
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton h={260}/><Skeleton h={200}/><Skeleton h={240}/>
      </View>
    </View>
  );
}

// Premium Gradient Button
function GradientButton({ onPress, disabled, loading, children, style, colors, height=52 }) {
  const sc = useRef(new Animated.Value(1)).current;
  const T = useTheme();
  return (
    <Pressable
      onPress={() => { haptic('Medium'); onPress?.(); }}
      disabled={disabled || loading}
      onPressIn={() => Animated.spring(sc, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start()}
      onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, friction: 6 }).start()}
    >
      <Animated.View style={[{ transform: [{ scale: sc }], opacity: disabled ? 0.5 : 1 }, style]}>
        <LinearGradient
          colors={colors || ['#7B6CF5', '#EE5FA0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.gradBtn, { height, shadowColor: T.accent }]}
        >
          {loading
            ? <ActivityIndicator color="white" size="small"/>
            : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{children}</View>}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// Animated Logo
function AnimatedLogo({ size=82, animate=true }) {
  const rot = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.loop(Animated.sequence([
      Animated.timing(sc, { toValue: 1.05, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(sc, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ])).start();
    Animated.loop(Animated.timing(rot, { toValue: 1, duration: 12000, useNativeDriver: true, easing: Easing.linear })).start();
  }, []);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', transform: [{ rotate: spin }] }}>
          <LinearGradient
            colors={['#7B6CF5', '#EE5FA0', '#F5A623', '#7B6CF5']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: size, height: size, borderRadius: size/3 }}
          />
        </Animated.View>
        <View style={{
          width: size - 6, height: size - 6, borderRadius: (size-6)/3,
          backgroundColor: '#06060E', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="sparkles" size={size * 0.42} color="#9D91FF"/>
        </View>
      </View>
    </Animated.View>
  );
}


// ═══════════════════════════════════════════════════════════════
// ONBOARDING — улучшенный с параллакс-эффектом
// ═══════════════════════════════════════════════════════════════
function OnboardingScreen({ onDone }) {
  const L = useLang();
  const [page, setPage] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const items = [
    { key: 'onb1', icon: 'sparkles', colors: ['#7B6CF5', '#EE5FA0'], particle: 'star' },
    { key: 'onb2', icon: 'compass',  colors: ['#10B981', '#0891B2'], particle: 'globe' },
    { key: 'onb3', icon: 'create',   colors: ['#F59E0B', '#EF4444'], particle: 'flash' },
  ];

  const go = (n) => {
    haptic('Medium');
    if (n >= items.length) { onDone(); return; }
    Animated.spring(slideX, { toValue: -n * width, useNativeDriver: true, friction: 9, tension: 40 }).start();
    setPage(n);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#06060E' }}>
      <StatusBar barStyle="light-content" backgroundColor="#06060E"/>

      {/* Decorative blurred orbs */}
      <View style={{ position: 'absolute', top: 60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(123,108,245,0.15)' }}/>
      <View style={{ position: 'absolute', bottom: 200, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(238,95,160,0.12)' }}/>

      <Animated.View style={{ flexDirection: 'row', width: width * items.length, transform: [{ translateX: slideX }], flex: 1 }}>
        {items.map((item, i) => (
          <View key={item.key} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80 }}>
            <View style={{
              shadowColor: item.colors[0], shadowOpacity: 0.6, shadowRadius: 40,
              elevation: 20, marginBottom: 36,
            }}>
              <LinearGradient
                colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: 130, height: 130, borderRadius: 38, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={item.icon} size={56} color="white"/>
              </LinearGradient>
            </View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#F0F0FF', textAlign: 'center', letterSpacing: -0.6, marginBottom: 14 }}>
              {L[item.key + 't']}
            </Text>
            <Text style={{ fontSize: 16, color: '#8E8EAC', textAlign: 'center', lineHeight: 25 }}>
              {L[item.key + 's']}
            </Text>
          </View>
        ))}
      </Animated.View>

      <View style={{ position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', gap: 28 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {items.map((_, i) => (
            <View key={i} style={{
              height: 7, borderRadius: 4,
              backgroundColor: i === page ? '#7B6CF5' : 'rgba(255,255,255,0.15)',
              width: i === page ? 28 : 7,
            }}/>
          ))}
        </View>
        <View style={{ width: 280 }}>
          <GradientButton onPress={() => go(page + 1)}>
            <Text style={s.btnTxt}>{page < items.length - 1 ? L.next : L.start}</Text>
            <Ionicons name={page < items.length - 1 ? 'arrow-forward' : 'checkmark'} size={18} color="white"/>
          </GradientButton>
        </View>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH SCREEN — переработанный с гарантией от зависаний
// ═══════════════════════════════════════════════════════════════
function AuthScreen({ onGuest, onAuthSuccess }) {
  const T = useTheme();
  const L = useLang();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(L.errEmail); return false; }
    if (password.length < 6) { setError(L.errPass); return false; }
    return true;
  };

  const mapErr = (code) => {
    const m = {
      'auth/invalid-email': L.errInvalid,
      'auth/user-not-found': L.errNotFound,
      'auth/wrong-password': L.errWrong,
      'auth/invalid-credential': L.errCred,
      'auth/email-already-in-use': L.errUsed,
      'auth/weak-password': L.errWeak,
      'auth/too-many-requests': L.errMany,
      'auth/network-request-failed': L.errNet,
    };
    return m[code] || L.errCred;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const cred = await withTimeout(
          createUserWithEmailAndPassword(auth, email.trim(), password),
          CONFIG.authTimeout, 'signup'
        );
        try {
          await withTimeout(
            updateProfile(cred.user, { displayName: name.trim() || 'User' }),
            CONFIG.authTimeout, 'updateProfile'
          );
        } catch (e) { if (__DEV__) console.warn('[updateProfile]'); }
      } else {
        await withTimeout(
          signInWithEmailAndPassword(auth, email.trim(), password),
          CONFIG.authTimeout, 'signin'
        );
      }
      // onAuthStateChanged подхватит дальнейшую инициализацию
    } catch (e) {
      if (__DEV__) console.warn('[Auth error]', e.code);
      if (e.message?.includes('timeout')) {
        setError('Сервер не отвечает. Попробуй ещё раз.');
      } else {
        setError(mapErr(e.code));
      }
      setLoading(false);
    }
    // НЕ ставим setLoading(false) при успехе — onAuthStateChanged сменит экран
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg}/>

      {/* Decorative gradient */}
      <LinearGradient
        colors={[T.glow, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      <ScrollView contentContainerStyle={s.authScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.authLogoWrap}>
          <AnimatedLogo size={88}/>
          <Text style={[s.authTitle, { color: T.text }]}>{L.appName}</Text>
          <Text style={[s.authSub, { color: T.textSoft }]}>{L.tagline}</Text>
        </View>

        <View style={[s.authCard, { backgroundColor: T.bgCard, borderColor: T.border, shadowColor: T.shadowColor }]}>
          {/* Mode tabs */}
          <View style={[s.modeRow, { backgroundColor: T.bgSoft, borderColor: T.border }]}>
            {['signin', 'signup'].map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => { haptic(); setMode(m); setError(''); }}
                style={[s.modeBtn, m === mode && { backgroundColor: T.bgCard }]}
                activeOpacity={0.8}
              >
                {m === mode && (
                  <LinearGradient
                    colors={['#7B6CF5', '#EE5FA0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[s.modeTxt, { color: m === mode ? 'white' : T.textSoft }]}>
                  {m === 'signin' ? L.signin : L.signup}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!error && (
            <View style={s.errBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444"/>
              <Text style={s.errTxt}>{error}</Text>
            </View>
          )}

          {mode === 'signup' && (
            <View style={s.fGroup}>
              <Text style={[s.fLabel, { color: T.textSoft }]}>{L.name}</Text>
              <View style={[s.fRow, { backgroundColor: T.bgElevated, borderColor: T.border }]}>
                <Ionicons name="person-outline" size={17} color={T.textDim} style={{ marginRight: 10 }}/>
                <TextInput
                  style={[s.fInput, { color: T.text }]}
                  value={name} onChangeText={setName}
                  placeholder={L.namePh} placeholderTextColor={T.textDim}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={s.fGroup}>
            <Text style={[s.fLabel, { color: T.textSoft }]}>{L.email}</Text>
            <View style={[s.fRow, { backgroundColor: T.bgElevated, borderColor: T.border }]}>
              <Ionicons name="mail-outline" size={17} color={T.textDim} style={{ marginRight: 10 }}/>
              <TextInput
                style={[s.fInput, { color: T.text }]}
                value={email} onChangeText={setEmail}
                placeholder={L.emailPh} placeholderTextColor={T.textDim}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              />
            </View>
          </View>

          <View style={s.fGroup}>
            <Text style={[s.fLabel, { color: T.textSoft }]}>{L.password}</Text>
            <View style={[s.fRow, { backgroundColor: T.bgElevated, borderColor: T.border }]}>
              <Ionicons name="lock-closed-outline" size={17} color={T.textDim} style={{ marginRight: 10 }}/>
              <TextInput
                style={[s.fInput, { flex: 1, color: T.text }]}
                value={password} onChangeText={setPassword}
                placeholder={L.passPh} placeholderTextColor={T.textDim}
                secureTextEntry={!showPwd}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={17} color={T.textDim}/>
              </TouchableOpacity>
            </View>
          </View>

          <GradientButton onPress={submit} loading={loading} style={{ marginTop: 8 }}>
            <Text style={s.btnTxt}>{mode === 'signup' ? L.createAcc : L.login}</Text>
            <Ionicons name="arrow-forward" size={17} color="white"/>
          </GradientButton>

          <View style={s.divRow}>
            <View style={[s.divLine, { backgroundColor: T.border }]}/>
            <Text style={[s.divTxt, { color: T.textDim }]}>{L.orContinue}</Text>
            <View style={[s.divLine, { backgroundColor: T.border }]}/>
          </View>

          <TouchableOpacity
            style={[s.guestBtn, { borderColor: T.border, backgroundColor: T.bgElevated }]}
            onPress={() => { haptic(); onGuest(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="rocket-outline" size={17} color={T.accent}/>
            <Text style={[s.guestTxt, { color: T.accent }]}>{L.guest}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.terms, { color: T.textDim }]}>{L.terms}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ═══════════════════════════════════════════════════════════════
// STORIES BAR
// ═══════════════════════════════════════════════════════════════
function StoriesBar() {
  const T = useTheme();
  const [stories, setStories] = useState(STORIES);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, gap: 14 }}>
      {stories.map(story => (
        <TouchableOpacity
          key={story.id}
          onPress={() => { haptic(); setStories(p => p.map(st => st.id === story.id ? { ...st, seen: true } : st)); }}
          style={{ alignItems: 'center', gap: 6 }}
          activeOpacity={0.7}
        >
          <View style={{
            padding: 2.5, borderRadius: 30,
            borderWidth: story.seen ? 0 : 2.5,
            borderColor: story.seen ? 'transparent' : '#7B6CF5',
          }}>
            <LinearGradient colors={story.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                width: 54, height: 54, borderRadius: 27,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2.5, borderColor: T.bg,
              }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 19 }}>{story.name[0]}</Text>
            </LinearGradient>
          </View>
          <Text
            style={{
              fontSize: 10, color: story.seen ? T.textDim : T.textSoft,
              fontWeight: '600', maxWidth: 60, textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {story.name.split(' ')[0]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURED BANNER — с правильным порядком хуков
// ═══════════════════════════════════════════════════════════════
function FeaturedBanner({ item }) {
  const T = useTheme();
  const L = useLang();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!item) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.025, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [item]);

  if (!item) return null;
  const g = CARD_GRADIENTS[(item.gradientIdx || 5) % CARD_GRADIENTS.length];

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: T.textDim, letterSpacing: 0.8 }}>
          {L.featured}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(123,108,245,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7B6CF5' }}/>
          <Text style={{ fontSize: 11, color: '#9D91FF', fontWeight: '700' }}>LIVE</Text>
        </View>
      </View>

      <Animated.View style={{
        borderRadius: 22, overflow: 'hidden', height: 200,
        transform: [{ scale: pulse }],
        shadowColor: g[0], shadowOpacity: 0.3, shadowRadius: 18, elevation: 8,
      }}>
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400}/>
          : <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}/>
        }
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, paddingTop: 60 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Avatar name={item.authorName} size={24} fontSize={10}/>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' }}>{item.authorName}</Text>
            <View style={{ backgroundColor: 'rgba(123,108,245,0.85)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2.5, marginLeft: 4 }}>
              <Text style={{ fontSize: 9, color: 'white', fontWeight: '800' }}>{item.model}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: 'white', fontWeight: '600', lineHeight: 20 }} numberOfLines={2}>
            {item.prompt}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="heart" size={13} color="#EE5FA0"/>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{formatNum(item.likesCount)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="eye" size={13} color="rgba(255,255,255,0.6)"/>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>{formatNum(item.viewsCount)}</Text>
            </View>
            {item.forSale && (
              <View style={{ marginLeft: 'auto', backgroundColor: '#FBBF24', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#422006' }}>${item.price}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEED CARD — улучшенный с blurhash и smooth transitions
// ═══════════════════════════════════════════════════════════════
const FeedCard = memo(function FeedCard({ item, index, onPress, onLike, onShare }) {
  const sc = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const h = HEIGHTS[index % HEIGHTS.length];
  const g = CARD_GRADIENTS[(item.gradientIdx ?? index) % CARD_GRADIENTS.length];
  const liked = item._liked || false;

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, friction: 4 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
  };

  return (
    <Pressable
      onPress={() => onPress(item)}
      onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start()}
      onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, friction: 7 }).start()}
    >
      <Animated.View style={[s.card, { height: h, transform: [{ scale: sc }] }]}>
        {item.imageUrl
          ? <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              transition={300}
            />
          : <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}/>
        }

        {item.forSale && (
          <View style={s.saleBadge}>
            <LinearGradient colors={['#FBBF24', '#F59E0B']} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#422006' }}>${item.price}</Text>
            </LinearGradient>
          </View>
        )}

        <TouchableOpacity onPress={() => onShare(item)} style={s.shareBtn} activeOpacity={0.7}>
          <BlurView intensity={30} tint="dark" style={s.actionBlur}>
            <Ionicons name="share-outline" size={13} color="white"/>
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { haptic('Medium'); animateHeart(); onLike(item); }}
          style={s.heartBtn}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <BlurView intensity={30} tint="dark" style={s.actionBlur}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#EE5FA0' : 'white'}/>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.92)']}
          locations={[0.3, 1]}
          style={s.cardOverlay}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <Avatar name={item.authorName} size={18} fontSize={8}/>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
              {item.authorName}
            </Text>
          </View>
          <Text
            style={{ fontSize: 11, color: 'white', fontWeight: '500', lineHeight: 16, marginBottom: 7 }}
            numberOfLines={2}
          >
            {item.prompt}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={s.modelPill}>
              <Text style={s.modelPillTxt}>{item.model}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="eye" size={9} color="rgba(255,255,255,0.55)"/>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '600' }}>
                  {formatNum(item.viewsCount)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="heart" size={9} color="rgba(255,255,255,0.7)"/>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                  {formatNum(item.likesCount)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});


// ═══════════════════════════════════════════════════════════════
// COMMENTS SHEET
// ═══════════════════════════════════════════════════════════════
function CommentsSheet({ postId, visible, onClose }) {
  const T = useTheme();
  const L = useLang();
  const { user } = useUser();
  const showToast = useToast();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible || !postId) return;
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => { if (__DEV__) console.warn('[comments error]'); });
    return unsub;
  }, [postId, visible]);

  const MAX_COMMENT_LENGTH = 500;

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || user.isGuest) {
      if (user?.isGuest) showToast('Войди чтобы комментировать', 'info');
      return;
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      showToast(`Комментарий не может быть длиннее ${MAX_COMMENT_LENGTH} символов`, 'error');
      return;
    }
    setSending(true);
    try {
      await withTimeout(
        addDoc(collection(db, 'posts', postId, 'comments'), {
          text: trimmed,
          authorId: user.uid,
          authorName: sanitizeName(user.name),
          createdAt: serverTimestamp(),
        }),
        CONFIG.firestoreTimeout, 'addComment'
      );
      setText('');
      haptic('Medium');
    } catch (e) {
      showToast('Не удалось отправить', 'error');
    }
    setSending(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}/>
        </TouchableOpacity>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{
            backgroundColor: T.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderWidth: 1, borderColor: T.border, maxHeight: '80%', minHeight: 320,
          }}>
            <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.border }}/>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: T.border,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: T.text }}>{L.comments}</Text>
              <TouchableOpacity onPress={onClose} style={{
                width: 32, height: 32, borderRadius: 8, backgroundColor: T.bgElevated,
                alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border,
              }}>
                <Ionicons name="close" size={16} color={T.text}/>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 20 }}>
              {comments.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="chatbubbles-outline" size={40} color={T.textDim}/>
                  <Text style={{ color: T.textDim, marginTop: 12, fontSize: 14 }}>{L.noComments}</Text>
                </View>
              ) : comments.map(c => (
                <View key={c.id} style={{ flexDirection: 'row', gap: 10 }}>
                  <Avatar name={c.authorName} size={36}/>
                  <View style={{
                    flex: 1, backgroundColor: T.bgElevated, borderRadius: 14,
                    padding: 12, borderWidth: 1, borderColor: T.border,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: T.text }}>{c.authorName}</Text>
                      <Text style={{ fontSize: 11, color: T.textDim }}>{timeAgo(c.createdAt)}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: T.textMid, lineHeight: 20 }}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{
              flexDirection: 'row', gap: 10, padding: 16,
              borderTopWidth: 1, borderTopColor: T.border,
              paddingBottom: Platform.OS === 'ios' ? 34 : 16,
            }}>
              <TextInput
                style={{
                  flex: 1, backgroundColor: T.bgElevated, borderRadius: 14,
                  paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
                  color: T.text, borderWidth: 1,
                  borderColor: text.length > MAX_COMMENT_LENGTH ? '#EF4444' : T.border,
                  maxHeight: 80,
                }}
                value={text} onChangeText={setText}
                placeholder={L.addComment}
                placeholderTextColor={T.textDim}
                maxLength={MAX_COMMENT_LENGTH}
                multiline
              />
              <TouchableOpacity
                onPress={send}
                disabled={!text.trim() || sending}
                style={{
                  width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                  alignSelf: 'flex-end', opacity: text.trim() ? 1 : 0.4,
                }}
              >
                <LinearGradient colors={['#7B6CF5', '#EE5FA0']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  {sending ? <ActivityIndicator size="small" color="white"/> : <Ionicons name="send" size={18} color="white"/>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
function DetailModal({ item, onClose, onLike, onShare, onCopy, onAuthorTap }) {
  const T = useTheme();
  const L = useLang();
  const [showComments, setShowComments] = useState(false);
  if (!item) return null;
  const g = CARD_GRADIENTS[(item.gradientIdx ?? 0) % CARD_GRADIENTS.length];
  const liked = item._liked || false;
  return (
    <>
      <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
        <View style={{ flex: 1 }}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}/>
          <TouchableOpacity style={s.mClose} onPress={onClose} activeOpacity={0.8}>
            <BlurView intensity={50} tint="dark" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color="white"/>
            </BlurView>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={{ paddingTop: 80, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            <View style={{
              height: 320, marginHorizontal: 16, borderRadius: 22, overflow: 'hidden',
              shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
            }}>
              {item.imageUrl
                ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300}/>
                : <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}/>
              }
            </View>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => { haptic('Light'); onAuthorTap && onAuthorTap(item); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                  activeOpacity={0.7}
                >
                  <Avatar name={item.authorName} size={42}/>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>{item.authorName}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.model}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onShare(item)} style={{
                  width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center', justifyContent: 'center', marginRight: 8,
                }}>
                  <Ionicons name="share-outline" size={16} color="white"/>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { haptic('Medium'); onLike(item); }}
                  style={[s.likeBtn, liked && { borderColor: '#EE5FA0', backgroundColor: 'rgba(238,95,160,0.15)' }]}
                >
                  <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#EE5FA0' : 'white'}/>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: liked ? '#EE5FA0' : 'white' }}>
                    {formatNum(item.likesCount)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 0.6 }}>{L.prompt}</Text>
                <TouchableOpacity
                  onPress={() => onCopy(item.prompt)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(123,108,245,0.2)', borderRadius: 8,
                    paddingHorizontal: 9, paddingVertical: 4,
                  }}
                >
                  <Ionicons name="copy-outline" size={12} color="#9D91FF"/>
                  <Text style={{ fontSize: 11, color: '#9D91FF', fontWeight: '600' }}>{L.copyPrompt}</Text>
                </TouchableOpacity>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16,
              }}>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22 }}>{item.prompt}</Text>
              </View>

              <TouchableOpacity
                onPress={() => { haptic(); setShowComments(true); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14,
                  marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Ionicons name="chatbubble-outline" size={18} color="rgba(255,255,255,0.55)"/>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', flex: 1 }}>{L.comments}</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)"/>
              </TouchableOpacity>

              {item.forSale && (
                <TouchableOpacity style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <LinearGradient colors={['#FBBF24', '#F59E0B']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 }}>
                    <Ionicons name="cart-outline" size={18} color="#422006"/>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#422006' }}>{L.buyFor} ${item.price}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
      <CommentsSheet postId={item?.id} visible={showComments} onClose={() => setShowComments(false)}/>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════
// USER PROFILE MODAL — открывается тапом на автора
// ═══════════════════════════════════════════════════════════════
function UserProfileModal({ author, visible, onClose }) {
  const T = useTheme();
  const L = useLang();
  const [following, setFollowing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !author) return;
    setLoading(true);
    setPosts([]);
    // В реальном приложении: query Firestore by authorId
    // Здесь генерируем mock-посты на основе BASE_FEED
    const userPosts = BASE_FEED
      .filter(p => p.authorName === author.authorName)
      .slice(0, 6);
    if (userPosts.length === 0) {
      // Создаём 6 моковых постов с тем же автором
      const mocks = BASE_FEED.slice(0, 6).map((p, i) => ({
        ...p, id: `mock-${author.authorName}-${i}`,
        authorName: author.authorName, authorId: author.authorId,
      }));
      setPosts(mocks);
    } else {
      setPosts(userPosts);
    }
    setTimeout(() => setLoading(false), 400);
  }, [visible, author]);

  if (!author) return null;

  const avatarColor = String(author.authorName || 'U').charCodeAt(0) % 6;
  const stats = {
    posts: posts.length || 6,
    followers: Math.floor(Math.random() * 5000) + 200,
    following: Math.floor(Math.random() * 500) + 50,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}/>
        <View style={{
          flex: 1, marginTop: 60, backgroundColor: T.bg,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderWidth: 1, borderColor: T.border, overflow: 'hidden',
        }}>
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: T.border }}/>
          </View>

          {/* Header with close */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 8,
          }}>
            <Text style={{ fontSize: 14, color: T.textDim, fontWeight: '700' }}>{L.viewProfile}</Text>
            <TouchableOpacity onPress={onClose}
              style={[s.iconBtn, { backgroundColor: T.bgElevated, borderColor: T.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={T.text}/>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile header */}
            <LinearGradient
              colors={[T.glow, T.glowPink, 'transparent']}
              style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22 }}
            >
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: T.glow }}/>
                <Avatar name={author.authorName} size={86} fontSize={32} ring/>
                <Text style={{ fontSize: 22, fontWeight: '900', color: T.text, marginTop: 14, letterSpacing: -0.4 }}>
                  {author.authorName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981' }}/>
                  <Text style={{ fontSize: 12, color: T.textSoft, fontWeight: '600' }}>AI Artist</Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: T.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                borderRadius: 16, padding: 14, marginBottom: 14,
                borderWidth: 1, borderColor: T.border,
              }}>
                {[
                  [String(stats.posts),     L.posts],
                  [formatNum(stats.followers), L.followers],
                  [String(stats.following), L.following2],
                ].map(([v, l], i) => (
                  <React.Fragment key={l}>
                    {i > 0 && <View style={{ width: 1, height: 28, backgroundColor: T.border }}/>}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 17, fontWeight: '900', color: T.text }}>{v}</Text>
                      <Text style={{ fontSize: 10, color: T.textDim, fontWeight: '700', marginTop: 2 }}>{l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => { haptic(); setFollowing(!following); }}
                  style={{ flex: 1, borderRadius: 13, overflow: 'hidden' }}
                  activeOpacity={0.85}
                >
                  {following ? (
                    <View style={{
                      backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12,
                    }}>
                      <Ionicons name="checkmark" size={15} color={T.text}/>
                      <Text style={{ color: T.text, fontSize: 13, fontWeight: '800' }}>{L.following2}</Text>
                    </View>
                  ) : (
                    <LinearGradient colors={['#7B6CF5', '#EE5FA0']}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}
                    >
                      <Ionicons name="person-add" size={15} color="white"/>
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>{L.follow}</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="paper-plane-outline" size={17} color={T.text}/>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Posts grid */}
            <View style={{ paddingHorizontal: 12, paddingTop: 14 }}>
              <Text style={[s.sLabel, { color: T.textDim, marginBottom: 10, paddingHorizontal: 4 }]}>
                🎨 {L.works.toUpperCase()}
              </Text>
              {loading ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[0,1,2,3,4,5].map(i => (
                    <Skeleton key={i} h={(width - 36) / 3} radius={12} style={{ width: (width - 36) / 3 }}/>
                  ))}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {posts.map((p, i) => (
                    <TouchableOpacity key={p.id || i}
                      style={{ width: (width - 36) / 3, height: (width - 36) / 3, borderRadius: 12, overflow: 'hidden' }}
                      activeOpacity={0.85}
                    >
                      {p.imageUrl ? (
                        <Image source={{ uri: p.imageUrl }} style={{ flex: 1 }} contentFit="cover"/>
                      ) : (
                        <LinearGradient
                          colors={CARD_GRADIENTS[(p.gradientIdx || i) % CARD_GRADIENTS.length]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={{ flex: 1 }}
                        />
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)']}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 6 }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="heart" size={9} color="#EE5FA0"/>
                          <Text style={{ color: 'white', fontSize: 9, fontWeight: '700' }}>
                            {formatNum(p.likesCount || 0)}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ height: 30 }}/>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS MODAL — premium activity inbox
// ═══════════════════════════════════════════════════════════════
function NotificationsModal({ visible, onClose }) {
  const T = useTheme();
  const L = useLang();

  // Mock notifications (in real app — load from Firestore)
  const notifs = [
    { id: 1, type: 'like',    name: 'Alex K.',   time: '5м',  thumb: 0 },
    { id: 2, type: 'comment', name: 'Maya L.',   time: '12м', text: 'Невероятно красиво! 🔥', thumb: 1 },
    { id: 3, type: 'follow',  name: 'Elena R.',  time: '1ч' },
    { id: 4, type: 'like',    name: 'Kenji T.',  time: '2ч',  thumb: 4 },
    { id: 5, type: 'like',    name: 'Sophie B.', time: '3ч',  thumb: 2 },
    { id: 6, type: 'comment', name: 'Dmitri V.', time: '5ч',  text: 'Какая модель?', thumb: 5 },
    { id: 7, type: 'follow',  name: 'Ravi P.',   time: '1д' },
    { id: 8, type: 'like',    name: 'Luca M.',   time: '2д',  thumb: 3 },
  ];

  const renderNotif = (n) => {
    const iconMap = { like: 'heart', comment: 'chatbubble', follow: 'person-add' };
    const colorMap = { like: '#EE5FA0', comment: '#7B6CF5', follow: '#10B981' };
    const labelMap = { like: L.likedYourArt, comment: L.commentedOnArt, follow: L.startedFollowing };

    return (
      <TouchableOpacity key={n.id} activeOpacity={0.75}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingVertical: 12, paddingHorizontal: 16,
          borderBottomWidth: 1, borderBottomColor: T.border,
        }}
      >
        <View style={{ position: 'relative' }}>
          <Avatar name={n.name} size={44} />
          <View style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: colorMap[n.type],
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: T.bg,
          }}>
            <Ionicons name={iconMap[n.type]} size={11} color="white" />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: T.text, lineHeight: 18 }}>
            <Text style={{ fontWeight: '800' }}>{n.name}</Text>{' '}
            <Text style={{ color: T.textMid }}>{labelMap[n.type]}</Text>
          </Text>
          {n.text && (
            <Text style={{ fontSize: 12, color: T.textSoft, marginTop: 3, fontStyle: 'italic' }} numberOfLines={1}>
              "{n.text}"
            </Text>
          )}
          <Text style={{ fontSize: 11, color: T.textDim, marginTop: 3, fontWeight: '600' }}>{n.time}</Text>
        </View>

        {n.type === 'follow' ? (
          <TouchableOpacity activeOpacity={0.7} style={{ borderRadius: 8, overflow: 'hidden' }}>
            <LinearGradient colors={['#7B6CF5', '#EE5FA0']} style={{ paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>{L.follow}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : n.thumb !== undefined ? (
          <View style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden' }}>
            <LinearGradient
              colors={CARD_GRADIENTS[n.thumb % CARD_GRADIENTS.length]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}/>
        <View style={{
          flex: 1, marginTop: 60, backgroundColor: T.bgCard,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderWidth: 1, borderColor: T.border, overflow: 'hidden',
        }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: T.border }}/>
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: T.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 11, overflow: 'hidden' }}>
                <LinearGradient colors={['#7B6CF5', '#EE5FA0']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="notifications" size={17} color="white"/>
                </LinearGradient>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: T.text }}>{L.notifications2}</Text>
                <Text style={{ fontSize: 11, color: T.textDim, fontWeight: '600' }}>
                  {notifs.length} новых · {L.activity}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}
              style={[s.iconBtn, { backgroundColor: T.bgElevated, borderColor: T.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={T.text}/>
            </TouchableOpacity>
          </View>

          {notifs.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <View style={{ width: 86, height: 86, borderRadius: 24, marginBottom: 20, overflow: 'hidden', opacity: 0.6 }}>
                <LinearGradient colors={[T.glow, T.glowPink]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="notifications-off" size={36} color={T.accent}/>
                </LinearGradient>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: T.text }}>{L.noNotifs}</Text>
              <Text style={{ fontSize: 12, color: T.textDim, marginTop: 6, textAlign: 'center', maxWidth: 240 }}>
                Когда кто-то лайкнет или прокомментирует твою работу — увидишь здесь
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifs.map(renderNotif)}
              <View style={{ height: 40 }}/>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}


// ═══════════════════════════════════════════════════════════════
// FEED SCREEN — с гарантированной загрузкой
// ═══════════════════════════════════════════════════════════════
function FeedScreen() {
  const T = useTheme();
  const L = useLang();
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const { user } = useUser();
  const showToast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('trending');
  const [feed, setFeed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [likedSet, setLikedSet] = useState(new Set());
  const scrollRef = useRef(null);
  const [showTop, setShowTop] = useState(false);

  // Load liked posts
  useEffect(() => {
    if (!user?.uid || user.isGuest) return;
    withTimeout(getDoc(doc(db, 'users', user.uid)), CONFIG.firestoreTimeout, 'getLikes')
      .then(snap => {
        if (snap.exists()) setLikedSet(new Set(snap.data().likedPosts || []));
      })
      .catch(() => {});
  }, [user?.uid]);

  // Real-time feed with safety timeout
  useEffect(() => {
    setLoading(true);
    seedFirestore(); // не ждём
    const sortField = filter === 'new' ? 'createdAt' : 'likesCount';
    const q = query(collection(db, 'posts'), orderBy(sortField, 'desc'), limit(30));

    // Safety: убираем загрузку через 6 сек если Firestore не отвечает
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setRefresh(false);
      // Fallback: показываем встроенный демо-фид
      setFeed(prev => prev.length === 0 ? BASE_FEED.map(it => ({ ...it })) : prev);
    }, 6000);

    const unsub = onSnapshot(q,
      snap => {
        clearTimeout(safetyTimer);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFeed(items.length ? items : BASE_FEED);
        setLoading(false);
        setRefresh(false);
      },
      err => {
        clearTimeout(safetyTimer);
        if (__DEV__) console.warn('[feed error]');
        setFeed(BASE_FEED);
        setLoading(false);
        setRefresh(false);
      }
    );
    return () => { clearTimeout(safetyTimer); unsub(); };
  }, [filter]);

  const onRefresh = () => {
    setRefresh(true);
    setTimeout(() => setRefresh(false), 1500);
  };

  const toggleLike = useCallback(async (item) => {
    if (!user?.uid || user.isGuest) {
      showToast('Войди чтобы лайкать', 'info');
      return;
    }
    const isLiked = likedSet.has(item.id);
    // Optimistic UI
    setLikedSet(p => { const n = new Set(p); isLiked ? n.delete(item.id) : n.add(item.id); return n; });
    setFeed(p => p.map(i => i.id === item.id ? { ...i, likesCount: (i.likesCount || 0) + (isLiked ? -1 : 1) } : i));
    setSelected(p => p?.id === item.id ? { ...p, likesCount: (p.likesCount || 0) + (isLiked ? -1 : 1), _liked: !isLiked } : p);

    try {
      if (!item.id.startsWith('s')) {
        await Promise.all([
          updateDoc(doc(db, 'posts', item.id), { likesCount: increment(isLiked ? -1 : 1) }),
          updateDoc(doc(db, 'users', user.uid), { likedPosts: isLiked ? arrayRemove(item.id) : arrayUnion(item.id) }),
        ]);
      }
    } catch (e) {
      // Откат optimistic update при ошибке
      setLikedSet(p => { const n = new Set(p); isLiked ? n.add(item.id) : n.delete(item.id); return n; });
      setFeed(p => p.map(i => i.id === item.id ? { ...i, likesCount: (i.likesCount || 0) + (isLiked ? 1 : -1) } : i));
      setSelected(p => p?.id === item.id ? { ...p, likesCount: (p.likesCount || 0) + (isLiked ? 1 : -1), _liked: isLiked } : p);
      if (__DEV__) console.warn('[toggleLike error]');
    }
  }, [user, likedSet, showToast]);

  const handleShare = useCallback(async (item) => {
    try { await Share.share({ message: `🎨 "${item.prompt}"\n\nСоздано в Lumina AI` }); } catch (e) {}
  }, []);

  const handleCopy = useCallback((txt) => { showToast(L.copied); }, [L, showToast]);

  const filters = [
    { id: 'trending', label: L.trending, icon: 'flame' },
    { id: 'new', label: L.neww, icon: 'sparkles' },
    { id: 'top', label: L.top, icon: 'trophy' },
    { id: 'following', label: L.following, icon: 'people' },
  ];

  const filteredFeed = useMemo(() => {
    if (!search) return feed;
    const q = search.toLowerCase();
    return feed.filter(i =>
      i.prompt?.toLowerCase().includes(q) ||
      i.authorName?.toLowerCase().includes(q) ||
      i.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [feed, search]);

  const feedWithLiked = useMemo(
    () => filteredFeed.map(i => ({ ...i, _liked: likedSet.has(i.id) })),
    [filteredFeed, likedSet]
  );
  const featured = useMemo(
    () => [...feed].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))[0],
    [feed]
  );

  return (
    <View style={[s.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg}/>
      <LinearGradient
        colors={[T.glow, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}
      />

      <View style={s.header}>
        <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          <AnimatedLogo size={32} animate={false}/>
        </View>
        <Text style={[s.headerTitle, { color: T.text }]}>{L.appName}</Text>
        <TouchableOpacity
          style={[s.iconBtn, { backgroundColor: T.bgCard, borderColor: T.border }]}
          activeOpacity={0.7}
          onPress={() => { haptic(); setShowNotifs(true); }}
        >
          <Ionicons name="notifications-outline" size={19} color={T.text}/>
          <View style={[s.notifDot, { borderColor: T.bgCard }]}/>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: T.text, letterSpacing: -0.4 }}>
          {L.hello} {user?.name || 'User'} 👋
        </Text>
        <Text style={{ fontSize: 13, color: T.textSoft, marginTop: 3 }}>{L.subtitle}</Text>
      </View>

      <View style={[s.searchBox, { backgroundColor: T.bgCard, borderColor: T.border }]}>
        <Ionicons name="search" size={16} color={T.textDim}/>
        <TextInput
          style={[s.searchIn, { color: T.text }]}
          value={search} onChangeText={setSearch}
          placeholder={L.search} placeholderTextColor={T.textDim}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={T.textDim}/>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 50, marginBottom: 4 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', gap: 8, paddingVertical: 4 }}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => { haptic(); setFilter(f.id); }}
              style={[
                s.chip,
                { backgroundColor: T.bgCard, borderColor: T.border },
                filter === f.id && {
                  backgroundColor: T.isDark ? 'rgba(123,108,245,0.15)' : 'rgba(123,108,245,0.1)',
                  borderColor: T.borderActive,
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name={f.icon} size={12} color={filter === f.id ? T.accentLight : T.textSoft}/>
              <Text style={[s.chipTxt, { color: filter === f.id ? T.accentLight : T.textSoft }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={T.accent} colors={['#7B6CF5']}/>
        }
        onScroll={e => setShowTop(e.nativeEvent.contentOffset.y > 500)}
        scrollEventThrottle={250}
      >
        <View style={{ marginBottom: 8 }}><StoriesBar/></View>
        {!search && <FeaturedBanner item={featured}/>}
        {loading ? <FeedSkeleton/> : (
          <View style={{ flexDirection: 'row', paddingHorizontal: 8, gap: 8 }}>
            <View style={{ flex: 1, gap: 8 }}>
              {feedWithLiked.filter((_, i) => i % 2 === 0).map((item, i) => (
                <FeedCard
                  key={item.id} item={item} index={i * 2}
                  onPress={setSelected} onLike={toggleLike} onShare={handleShare}
                />
              ))}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {feedWithLiked.filter((_, i) => i % 2 === 1).map((item, i) => (
                <FeedCard
                  key={item.id} item={item} index={i * 2 + 1}
                  onPress={setSelected} onLike={toggleLike} onShare={handleShare}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {showTop && (
        <TouchableOpacity
          style={s.scrollTopBtn}
          onPress={() => { haptic(); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#7B6CF5', '#EE5FA0']} style={s.scrollTopInner}>
            <Ionicons name="arrow-up" size={18} color="white"/>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <DetailModal
        item={selected} onClose={() => setSelected(null)}
        onLike={toggleLike} onShare={handleShare} onCopy={handleCopy}
        onAuthorTap={(post) => { setSelected(null); setTimeout(() => setSelectedAuthor(post), 200); }}
      />
      <NotificationsModal visible={showNotifs} onClose={() => setShowNotifs(false)}/>
      <UserProfileModal author={selectedAuthor} visible={!!selectedAuthor} onClose={() => setSelectedAuthor(null)}/>
    </View>
  );
}


// ═══════════════════════════════════════════════════════════════
// EXPLORE SCREEN
// ═══════════════════════════════════════════════════════════════
function ExploreScreen() {
  const T = useTheme();
  const L = useLang();
  const [topPosts, setTopPosts] = useState(BASE_FEED);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    haptic('Light');
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(12));
    const unsub = onSnapshot(q,
      snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (items.length) setTopPosts(items);
      },
      err => { if (__DEV__) console.warn('[explore error]'); }
    );
    return unsub;
  }, []);

  const cats = [
    { label: L.portraits, colors: ['#8B5CF6', '#EC4899'], icon: 'person', tag: 'portrait' },
    { label: L.fantasy,   colors: ['#10B981', '#0891B2'], icon: 'leaf',   tag: 'fantasy' },
    { label: L.scifi,     colors: ['#3B82F6', '#06B6D4'], icon: 'planet', tag: 'sci-fi' },
    { label: L.abstract,  colors: ['#F59E0B', '#EF4444'], icon: 'shapes', tag: 'abstract' },
    { label: L.nature,    colors: ['#10B981', '#065F46'], icon: 'flower', tag: 'nature' },
    { label: L.cyberpunk, colors: ['#7C3AED', '#EC4899'], icon: 'flash',  tag: 'cyberpunk' },
    { label: L.anime,     colors: ['#F472B6', '#BE185D'], icon: 'star',   tag: 'anime' },
    { label: L.three,     colors: ['#0891B2', '#1E3A8A'], icon: 'cube',   tag: '3d' },
  ];

  const filtered = useMemo(() => {
    let res = topPosts;
    if (activeTag) res = res.filter(p => p.tags?.includes(activeTag));
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(p =>
        p.prompt?.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q)
      );
    }
    return res;
  }, [topPosts, activeTag, search]);

  return (
    <View style={[s.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg}/>
      <LinearGradient
        colors={[T.glow, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}
      />
      <View style={s.header}>
        <Text style={[s.headerTitle, { marginLeft: 0, color: T.text }]}>{L.explore}</Text>
      </View>

      <View style={[s.searchBox, { backgroundColor: T.bgCard, borderColor: T.border }]}>
        <Ionicons name="search" size={16} color={T.textDim}/>
        <TextInput
          style={[s.searchIn, { color: T.text }]}
          value={search} onChangeText={setSearch}
          placeholder={L.search} placeholderTextColor={T.textDim}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={T.textDim}/>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} colors={[T.accent]}/>}
      >
        {/* TRENDING TAGS BAR */}
        <View style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
            <Text style={[s.sLabel, { color: T.textDim }]}>🔥 {L.trendingTags}</Text>
            <Text style={{ fontSize: 11, color: T.accentLight, fontWeight: '700' }}>{L.viewAll}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 7 }}>
            {[
              { tag: 'cyberpunk', count: '2.4K', hot: true },
              { tag: 'fantasy',   count: '1.8K', hot: true },
              { tag: 'portrait',  count: '1.5K' },
              { tag: 'anime',     count: '987' },
              { tag: 'nature',    count: '654' },
              { tag: 'abstract',  count: '432' },
              { tag: '3d',        count: '321' },
              { tag: 'sci-fi',    count: '289' },
            ].map(t => (
              <TouchableOpacity key={t.tag} onPress={() => { haptic(); setActiveTag(activeTag === t.tag ? null : t.tag); setSearch(''); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: activeTag === t.tag ? 'rgba(123,108,245,0.15)' : T.bgCard,
                  borderWidth: 1, borderColor: activeTag === t.tag ? T.borderActive : T.border,
                  borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
                }}
                activeOpacity={0.7}
              >
                {t.hot && <Text style={{ fontSize: 11 }}>🔥</Text>}
                <Text style={{ fontSize: 12, fontWeight: '700', color: activeTag === t.tag ? T.accentLight : T.text }}>
                  #{t.tag}
                </Text>
                <Text style={{ fontSize: 11, color: T.textDim, fontWeight: '600' }}>{t.count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={[s.sLabel, { paddingHorizontal: 16, marginBottom: 12, color: T.textDim }]}>{L.categories}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 24 }}>
          {cats.map(cat => (
            <TouchableOpacity
              key={cat.label}
              onPress={() => { haptic(); setActiveTag(activeTag === cat.tag ? null : cat.tag); }}
              style={{
                width: (width - 44) / 2, height: 88, borderRadius: 18, overflow: 'hidden',
                opacity: activeTag && activeTag !== cat.tag ? 0.4 : 1,
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={cat.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name={cat.icon} size={26} color="white"/>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>{cat.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[s.sLabel, { paddingHorizontal: 16, marginBottom: 12, color: T.textDim }]}>{L.topWorks}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 }}>
          {filtered.map((item, idx) => (
            <View key={item.id} style={{ width: (width - 40) / 2, height: 168, borderRadius: 16, overflow: 'hidden' }}>
              {item.imageUrl
                ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover"/>
                : <LinearGradient
                    colors={CARD_GRADIENTS[(item.gradientIdx || idx) % CARD_GRADIENTS.length]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
              }
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}
              >
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                  {item.authorName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="eye" size={10} color="rgba(255,255,255,0.55)"/>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600' }}>
                      {formatNum(item.viewsCount)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="heart" size={10} color="#EE5FA0"/>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600' }}>
                      {formatNum(item.likesCount)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}


// ═══════════════════════════════════════════════════════════════
// CREATE SCREEN — улучшенный с Pollinations
// ═══════════════════════════════════════════════════════════════
function CreateScreen() {
  const T = useTheme();
  const L = useLang();
  const { user, setCredits, credits } = useUser();
  const showToast = useToast();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [model, setModel] = useState('flux');
  const [styleSel, setStyleSel] = useState('Dynamic');
  const [ratio, setRatio] = useState('1:1');
  const [stage, setStage] = useState('idle');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHist, setShowH] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const enhancePulse = useRef(new Animated.Value(1)).current;
  const lastGenerateRef = useRef(0);
  const GENERATE_COOLDOWN_MS = 15000;

  // AI prompt enhancer
  const enhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return;
    haptic('Medium');
    setEnhancing(true);
    Animated.loop(Animated.sequence([
      Animated.timing(enhancePulse,{toValue:1.05,duration:600,useNativeDriver:true}),
      Animated.timing(enhancePulse,{toValue:1,duration:600,useNativeDriver:true}),
    ])).start();
    try {
      const enhanced = await enhancePromptWithAI(prompt);
      setPrompt(enhanced);
      showToast(L.enhanced, 'success');
      haptic('Heavy');
    } catch(e) {
      showToast(e.message || L.genError, 'error');
    } finally {
      setEnhancing(false);
      enhancePulse.stopAnimation();
      enhancePulse.setValue(1);
    }
  };

  // Load history from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('@lumina_history')
      .then(json => { if (json) setHistory(JSON.parse(json)); })
      .catch(() => {});
  }, []);

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    AsyncStorage.setItem('@lumina_history', JSON.stringify(newHistory)).catch(() => {});
  };

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 0.85, duration: 18000, useNativeDriver: false, easing: Easing.out(Easing.cubic),
    }).start();
  };

  const generate = async () => {
    if (!prompt.trim()) {
      showToast('Напиши промпт', 'info');
      return;
    }
    if (!user?.isGuest && (credits || 0) < 5) {
      showToast(L.noCredits, 'error');
      return;
    }
    const now = Date.now();
    if (now - lastGenerateRef.current < GENERATE_COOLDOWN_MS) {
      const secsLeft = Math.ceil((GENERATE_COOLDOWN_MS - (now - lastGenerateRef.current)) / 1000);
      showToast(`Подожди ещё ${secsLeft} сек перед следующей генерацией`, 'info');
      return;
    }
    lastGenerateRef.current = now;

    haptic('Medium');
    setStage('generating');
    setResult(null);
    startProgress();

    try {
      // Pollinations поддерживает negative через "negative_prompt" параметр в URL
      const fullPrompt = negativePrompt.trim()
        ? `${prompt} | NOT: ${negativePrompt}`
        : prompt;
      const tempUrl = await generateImage(fullPrompt, model, styleSel, ratio);

      let finalUrl = tempUrl;
      if (CONFIG.uploadToStorage && user?.uid && !user.isGuest) {
        setStage('uploading');
        Animated.timing(progressAnim, { toValue: 0.95, duration: 2000, useNativeDriver: false }).start();
        try {
          finalUrl = await withTimeout(uploadImageToStorage(tempUrl, user.uid), 12000, 'storage');
        } catch (e) {
          if (__DEV__) console.warn('[uploadToStorage error]');
          finalUrl = tempUrl;
        }
      }

      // Save to Firestore (если не гость)
      if (user?.uid && !user.isGuest) {
        try {
          await withTimeout(addDoc(collection(db, 'posts'), {
            prompt, model: MODELS.find(m => m.id === model)?.name || model,
            style: styleSel, ratio, imageUrl: finalUrl,
            gradientIdx: Math.floor(Math.random() * CARD_GRADIENTS.length),
            authorId: user.uid, authorName: user.name || 'User',
            likesCount: 0, viewsCount: 0,
            tags: [], forSale: false, price: 0,
            createdAt: serverTimestamp(),
          }), CONFIG.firestoreTimeout, 'addPost');

          await withTimeout(updateDoc(doc(db, 'users', user.uid), {
            credits: increment(-5), postsCount: increment(1),
          }), CONFIG.firestoreTimeout, 'updateCredits');

          setCredits(c => Math.max(0, (c || 5) - 5));
          showToast(L.postShared);
        } catch (e) {
          if (__DEV__) console.warn('[saveToFirestore error]');
          showToast('Сохранено локально', 'info');
        }
      }

      progressAnim.stopAnimation();
      Animated.timing(progressAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
      setResult({ imageUrl: finalUrl });

      // Local history
      const newItem = { id: Date.now(), prompt, model, style: styleSel, ratio, imageUrl: finalUrl };
      saveHistory([newItem, ...history.slice(0, 19)]);

      setStage('done');
      haptic('Heavy');
    } catch (e) {
      console.error('[Generate]', e);
      setStage('idle');
      progressAnim.setValue(0);
      const msg = e.message || L.genError;
      Alert.alert(L.genError, msg);
    }
  };

  const saveToGallery = async () => {
    if (!result?.imageUrl) return;
    try {
      haptic('Medium');
      await saveImageToGallery(result.imageUrl);
      showToast(L.savedToGallery);
    } catch (e) {
      showToast(L.saveError, 'error');
    }
  };

  const surprise = () => {
    haptic();
    const ps = [
      'A magical forest with glowing mushrooms and floating fireflies',
      'Cyberpunk city street at night with neon reflections',
      'A majestic dragon soaring over snow-capped mountains',
      'Underwater coral palace with colorful tropical fish',
      'Abstract geometric art in purple and gold',
      'A robot in shiny chrome armor in a futuristic studio',
      'Solarpunk greenhouse city with lush vertical gardens',
      'Cozy cabin in autumn forest at golden hour',
      'A samurai warrior in a cherry blossom garden',
      'Space station orbiting a colorful nebula',
    ];
    setPrompt(ps[Math.floor(Math.random() * ps.length)]);
  };

  const isGenerating = stage === 'generating' || stage === 'uploading';

  return (
    <View style={[s.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg}/>
      <LinearGradient
        colors={[T.glow, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}
      />

      <View style={s.header}>
        <Text style={[s.headerTitle, { marginLeft: 0, color: T.text }]}>{L.create}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {history.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowH(true)}
              style={[s.iconBtn, { backgroundColor: T.bgCard, borderColor: T.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={19} color={T.text}/>
            </TouchableOpacity>
          )}
          <View style={[s.creditsBadge, { backgroundColor: T.bgCard, borderColor: T.border }]}>
            <Ionicons name="flash" size={12} color={T.accent3}/>
            <Text style={{ fontSize: 13, color: T.accent3, fontWeight: '800' }}>
              {user?.isGuest ? '∞' : (credits ?? 150)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={{ marginBottom: 22 }}>
          {stage === 'done' && result ? (
            <View style={s.preview}>
              <Image source={{ uri: result.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400}/>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, paddingTop: 60 }}
              >
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 6, fontWeight: '700' }}>
                  {MODELS.find(m => m.id === model)?.name} · {styleSel} · {ratio}
                </Text>
                <Text style={{ fontSize: 13, color: 'white', fontWeight: '500', lineHeight: 19 }} numberOfLines={2}>
                  {prompt}
                </Text>
              </LinearGradient>
              <View style={{ position: 'absolute', top: 14, right: 14, flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={saveToGallery}
                  style={{ width: 38, height: 38, borderRadius: 11, overflow: 'hidden' }}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={45} tint="dark" style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="download-outline" size={17} color="white"/>
                  </BlurView>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    try { await Share.share({ message: `🎨 "${prompt}"\n\nСоздано в Lumina AI` }); } catch (e) {}
                  }}
                  style={{ width: 38, height: 38, borderRadius: 11, overflow: 'hidden' }}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={45} tint="dark" style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="share-outline" size={17} color="white"/>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </View>
          ) : isGenerating ? (
            <View style={[s.preview, { backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border }]}>
              <View style={{
                width: 70, height: 70, borderRadius: 20,
                alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                shadowColor: T.accent, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
              }}>
                <LinearGradient colors={['#7B6CF5', '#EE5FA0']} style={{ width: '100%', height: '100%', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color="white"/>
                </LinearGradient>
              </View>
              <Text style={{ fontSize: 16, color: T.text, fontWeight: '800' }}>
                {stage === 'uploading' ? L.generating2 : L.generating}
              </Text>
              <Text style={{ fontSize: 12, color: T.textDim, marginTop: 6 }}>{L.genSub}</Text>
              <View style={{ width: 220, height: 4, backgroundColor: T.bgElevated, borderRadius: 3, marginTop: 22, overflow: 'hidden' }}>
                <Animated.View style={{
                  height: '100%', borderRadius: 3,
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }}>
                  <LinearGradient colors={['#7B6CF5', '#EE5FA0']} start={{x:0,y:0}} end={{x:1,y:0}} style={{ flex: 1 }}/>
                </Animated.View>
              </View>
            </View>
          ) : (
            <View style={[s.preview, { backgroundColor: T.bgCard, borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed' }]}>
              <LinearGradient
                colors={['rgba(123,108,245,0.2)', 'rgba(238,95,160,0.15)']}
                style={{ width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
              >
                <Ionicons name="image-outline" size={34} color={T.accent}/>
              </LinearGradient>
              <Text style={{ fontSize: 16, fontWeight: '800', color: T.text, marginBottom: 6 }}>
                {L.previewTitle}
              </Text>
              <Text style={{ fontSize: 13, color: T.textSoft }}>{L.previewSub}</Text>
            </View>
          )}
        </View>

        {/* Smart Prompt Ideas — quick starters */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 0, marginBottom: 10 }}>
            <Text style={[s.sLabel, { color: T.textDim }]}>💡 БЫСТРЫЕ ИДЕИ</Text>
            <Text style={{ fontSize: 10, color: T.textDim, fontWeight:'600' }}>Тапни — заполнится</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 8 }}>
            {PROMPT_IDEAS.map((idea, i) => (
              <TouchableOpacity key={i}
                onPress={() => { haptic('Light'); setPrompt(idea.text); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border,
                  borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14 }}>{idea.emoji}</Text>
                <Text style={{ fontSize: 12, color: T.text, fontWeight: '700' }}>{idea.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prompt */}
        <View style={s.sect}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[s.sLabel, { color: T.textDim }]}>{L.prompt}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={surprise}
                style={[s.surpriseBtn, { backgroundColor: T.bgCard, borderColor: T.border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="shuffle" size={11} color={T.accent}/>
                <Text style={{ fontSize: 11, color: T.accent, fontWeight: '700' }}>{L.random}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{
            backgroundColor: T.bgCard, borderRadius: 16, padding: 16, paddingBottom: 12,
            borderWidth: 1, borderColor: T.border, minHeight: 110,
          }}>
            <TextInput
              style={{ color: T.text, fontSize: 14, lineHeight: 22, textAlignVertical: 'top', minHeight: 60 }}
              value={prompt} onChangeText={setPrompt}
              placeholder={L.promptPh} placeholderTextColor={T.textDim}
              multiline
            />

            {/* AI Enhance + Negative toggle row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border }}>
              <Animated.View style={{ transform: [{ scale: enhancePulse }] }}>
                <TouchableOpacity
                  onPress={enhancePrompt}
                  disabled={!prompt.trim() || enhancing}
                  style={{ borderRadius: 10, overflow: 'hidden', opacity: prompt.trim() ? 1 : 0.4 }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={enhancing ? ['#7B6CF5', '#EE5FA0'] : ['rgba(123,108,245,0.2)', 'rgba(238,95,160,0.2)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7 }}
                  >
                    {enhancing
                      ? <ActivityIndicator size="small" color="white" />
                      : <Ionicons name="sparkles" size={13} color={enhancing ? 'white' : T.accentLight} />
                    }
                    <Text style={{ fontSize: 12, fontWeight: '800', color: enhancing ? 'white' : T.accentLight, letterSpacing: 0.2 }}>
                      {enhancing ? L.enhancing : L.enhancePrompt}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={() => { haptic(); setShowNegative(!showNegative); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: showNegative ? 'rgba(239,68,68,0.15)' : T.bgElevated,
                  borderWidth: 1, borderColor: showNegative ? 'rgba(239,68,68,0.4)' : T.border,
                  borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={showNegative ? 'remove-circle' : 'remove-circle-outline'} size={13} color={showNegative ? '#EF4444' : T.textSoft} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: showNegative ? '#EF4444' : T.textSoft }}>
                  {showNegative ? '−' : '+'} Negative
                </Text>
              </TouchableOpacity>

              {prompt.length > 0 && (
                <Text style={{ marginLeft: 'auto', fontSize: 10, color: T.textDim, fontWeight: '600' }}>
                  {prompt.length}/500
                </Text>
              )}
            </View>
          </View>

          {/* Negative prompt — collapsible */}
          {showNegative && (
            <View style={{
              backgroundColor: T.bgCard, borderRadius: 14, padding: 14, marginTop: 8,
              borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
            }}>
              <Text style={[s.sLabel, { color: '#EF4444', marginBottom: 8, fontSize: 10 }]}>
                <Ionicons name="close-circle" size={11} color="#EF4444" /> {L.negativePrompt}
              </Text>
              <TextInput
                style={{ color: T.text, fontSize: 13, minHeight: 40, textAlignVertical: 'top' }}
                value={negativePrompt}
                onChangeText={setNegativePrompt}
                placeholder={L.negativePh}
                placeholderTextColor={T.textDim}
                multiline
              />
            </View>
          )}
        </View>

        {/* Model */}
        <View style={s.sect}>
          <Text style={[s.sLabel, { marginBottom: 10, color: T.textDim }]}>{L.model}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 10 }}>
            {MODELS.map(m => (
              <TouchableOpacity
                key={m.id}
                onPress={() => { haptic(); setModel(m.id); }}
                style={[
                  s.modelCard,
                  { backgroundColor: T.bgCard, borderColor: T.border },
                  model === m.id && {
                    borderColor: T.borderActive,
                    backgroundColor: T.isDark ? 'rgba(123,108,245,0.1)' : 'rgba(123,108,245,0.06)',
                  }
                ]}
                activeOpacity={0.85}
              >
                {m.tag && (
                  <View style={[s.modelTag, { backgroundColor: T.accent }]}>
                    <Text style={s.modelTagTxt}>{m.tag}</Text>
                  </View>
                )}
                <Ionicons name={m.icon} size={22} color={model === m.id ? T.accentLight : T.textSoft}/>
                <Text style={[s.modelName, { color: model === m.id ? T.accentLight : T.text }]}>{m.name}</Text>
                <Text style={{ fontSize: 11, color: T.textDim }} numberOfLines={1}>{m.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Style */}
        <View style={s.sect}>
          <Text style={[s.sLabel, { marginBottom: 10, color: T.textDim }]}>{L.style}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STYLES_LIST.map(st => (
              <TouchableOpacity
                key={st}
                onPress={() => { haptic(); setStyleSel(st); }}
                style={[
                  s.pill,
                  { backgroundColor: T.bgCard, borderColor: T.border },
                  styleSel === st && {
                    backgroundColor: T.isDark ? 'rgba(123,108,245,0.15)' : 'rgba(123,108,245,0.08)',
                    borderColor: T.borderActive,
                  }
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.pillTxt,
                  { color: styleSel === st ? T.accentLight : T.textSoft },
                  styleSel === st && { fontWeight: '800' }
                ]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ratio */}
        <View style={s.sect}>
          <Text style={[s.sLabel, { marginBottom: 10, color: T.textDim }]}>{L.ratio}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {RATIOS.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => { haptic(); setRatio(r); }}
                style={[
                  s.pill,
                  { backgroundColor: T.bgCard, borderColor: T.border },
                  ratio === r && {
                    backgroundColor: T.isDark ? 'rgba(123,108,245,0.15)' : 'rgba(123,108,245,0.08)',
                    borderColor: T.borderActive,
                  }
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.pillTxt,
                  { color: ratio === r ? T.accentLight : T.textSoft },
                  ratio === r && { fontWeight: '800' }
                ]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Generate button */}
      <View style={{ position: 'absolute', bottom: 100, left: 16, right: 16 }}>
        <GradientButton onPress={generate} disabled={!prompt.trim() || isGenerating} loading={isGenerating} height={56}>
          <Ionicons name="sparkles" size={17} color="white"/>
          <Text style={s.btnTxt}>{L.generate}</Text>
          {!user?.isGuest && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 2,
              backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 7,
              paddingHorizontal: 9, paddingVertical: 3, marginLeft: 4,
            }}>
              <Ionicons name="flash" size={10} color="rgba(255,255,255,0.9)"/>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.95)', fontWeight: '800' }}>-5</Text>
            </View>
          )}
        </GradientButton>
      </View>

      {/* History modal */}
      <Modal visible={showHist} transparent animationType="slide" onRequestClose={() => setShowH(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}/>
          <View style={{
            flex: 1, marginTop: 80, backgroundColor: T.bgCard,
            borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 20, borderBottomWidth: 1, borderBottomColor: T.border,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: T.text }}>{L.history}</Text>
              <TouchableOpacity
                onPress={() => setShowH(false)}
                style={[s.iconBtn, { backgroundColor: T.bgElevated, borderColor: T.border }]}
              >
                <Ionicons name="close" size={18} color={T.text}/>
              </TouchableOpacity>
            </View>
            {history.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="time-outline" size={42} color={T.textDim}/>
                <Text style={{ color: T.textDim, marginTop: 12, fontSize: 14 }}>{L.histEmpty}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
                {history.map(h => (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => { haptic(); setPrompt(h.prompt); setModel(h.model); setShowH(false); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: T.bgElevated, borderRadius: 14, padding: 12,
                      borderWidth: 1, borderColor: T.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden' }}>
                      {h.imageUrl
                        ? <Image source={{ uri: h.imageUrl }} style={{ flex: 1 }} contentFit="cover"/>
                        : <LinearGradient colors={CARD_GRADIENTS[Math.floor(Math.random()*CARD_GRADIENTS.length)]} style={{ flex: 1 }}/>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: T.text, fontWeight: '700' }} numberOfLines={1}>
                        {h.prompt}
                      </Text>
                      <Text style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                        {h.model} · {h.style} · {h.ratio}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={T.textDim}/>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}


// ═══════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════
function ProfileScreen({ onOpenSettings }) {
  const T = useTheme();
  const L = useLang();
  const { user, credits } = useUser();
  const [tab, setTab] = useState('works');
  const [editModal, setEdit] = useState(false);
  const [newName, setNew] = useState(user?.name || '');
  const [saving, setSave] = useState(false);
  const [userPosts, setPosts] = useState([]);
  const [userStats, setStats] = useState({ postsCount: 0, followersCount: 0, likesTotal: 0 });

  useEffect(() => {
    if (!user?.uid || user.isGuest) return;
    const q = query(collection(db, 'posts'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      snap => {
        const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(posts);
        const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
        setStats({ postsCount: posts.length, followersCount: 0, likesTotal: totalLikes });
      },
      err => { if (__DEV__) console.warn('[profile-posts error]'); }
    );
    return unsub;
  }, [user?.uid]);

  const saveProfile = async () => {
    if (!newName.trim()) return;
    setSave(true);
    try {
      if (auth.currentUser) {
        await withTimeout(updateProfile(auth.currentUser, { displayName: newName.trim() }), CONFIG.firestoreTimeout, 'updateProfile');
      }
      if (user?.uid && !user.isGuest) {
        await withTimeout(updateDoc(doc(db, 'users', user.uid), { name: newName.trim() }), CONFIG.firestoreTimeout, 'updateUserName');
      }
    } catch (e) { if (__DEV__) console.warn('[error]'); }
    setSave(false);
    setEdit(false);
  };

  const displayPosts = user?.isGuest ? BASE_FEED.slice(0, 6) : userPosts;

  return (
    <View style={[s.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg}/>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[T.glow, T.glowPink, 'transparent']}
          style={{ paddingTop: Platform.OS === 'android' ? 44 : 56, paddingBottom: 26 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 30 }}>
            <Text style={[s.headerTitle, { marginLeft: 0, flex: 1, color: T.text }]}>{L.profile}</Text>
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: T.bgCard, borderColor: T.border }]}
              onPress={onOpenSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={19} color={T.text}/>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 26 }}>
            <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: T.glow, top: -16 }}/>
            <Avatar name={user?.name || 'User'} size={92} fontSize={34}/>
            <Text style={{ fontSize: 23, fontWeight: '900', color: T.text, marginTop: 16, letterSpacing: -0.4, textAlign: 'center' }}>
              {user?.name || 'User'}
            </Text>
            <Text style={{ fontSize: 13, color: T.textSoft, marginTop: 4, textAlign: 'center' }}>
              {user?.email || L.guest}
            </Text>
            {!user?.isGuest && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10,
                backgroundColor: 'rgba(123,108,245,0.15)', borderRadius: 14,
                paddingHorizontal: 14, paddingVertical: 6,
              }}>
                <Ionicons name="flash" size={13} color={T.accent3}/>
                <Text style={{ fontSize: 13, color: T.accent3, fontWeight: '800' }}>
                  {credits ?? 150} {L.creditsLeft}
                </Text>
              </View>
            )}
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: T.isDark ? T.bgSoft : T.bgCard,
            marginHorizontal: 16, borderRadius: 18, padding: 18,
            borderWidth: 1, borderColor: T.border, marginBottom: 16,
          }}>
            {[
              [user?.isGuest ? '48' : String(userStats.postsCount), L.works],
              [user?.isGuest ? '1.2K' : String(userStats.followersCount), L.followers],
              [user?.isGuest ? '8.4K' : formatNum(userStats.likesTotal), L.likes],
            ].map(([v, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && <View style={{ width: 1, height: 36, backgroundColor: T.border }}/>}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 19, fontWeight: '900', color: T.text, marginBottom: 3 }}>{v}</Text>
                  <Text style={{ fontSize: 11, color: T.textDim, fontWeight: '700' }}>{l}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* LEVEL & XP CARD */}
          {!user?.isGuest && (() => {
            const totalXp = (userStats.postsCount || 0) * 10 + (userStats.likesTotal || 0);
            const lvl = Math.min(5, 1 + Math.floor(totalXp / 100));
            const xpInLvl = totalXp % 100;
            const lvlNames = [L.achLevel1, L.achLevel2, L.achLevel3, L.achLevel4, L.achLevel5];
            return (
              <View style={{
                marginHorizontal: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden',
                shadowColor: '#7B6CF5', shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
              }}>
                <LinearGradient
                  colors={['rgba(123,108,245,0.25)', 'rgba(238,95,160,0.18)', 'rgba(245,166,35,0.1)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 16, borderWidth: 1, borderColor: 'rgba(123,108,245,0.3)', borderRadius: 18 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#7B6CF5', shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
                    }}>
                      <LinearGradient colors={['#7B6CF5', '#EE5FA0']} style={{ width: '100%', height: '100%', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: 'white' }}>{lvl}</Text>
                      </LinearGradient>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: T.textDim, fontWeight: '700', letterSpacing: 0.6 }}>{L.yourLevel.toUpperCase()}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: T.text, marginTop: 2 }}>{lvlNames[lvl - 1]}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: T.accentLight }}>{totalXp}</Text>
                      <Text style={{ fontSize: 10, color: T.textDim, fontWeight: '700' }}>{L.xp}</Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <View style={{ width: `${xpInLvl}%`, height: '100%', borderRadius: 3, overflow: 'hidden' }}>
                      <LinearGradient colors={['#7B6CF5', '#EE5FA0', '#F5A623']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }}/>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10, color: T.textDim, marginTop: 6, textAlign: 'right', fontWeight: '600' }}>
                    {xpInLvl}/100 XP до следующего
                  </Text>
                </LinearGradient>
              </View>
            );
          })()}

          {/* DAILY STREAK CARD */}
          {!user?.isGuest && (() => {
            // Имитация streak — в реальности храним в Firestore
            const streak = Math.max(1, Math.floor((userStats.postsCount || 1) / 2) + 3);
            const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
            const todayIdx = new Date().getDay();
            // Сдвигаем чтобы пн = 0
            const todayShifted = (todayIdx + 6) % 7;
            return (
              <View style={{
                marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16,
                backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(245,166,35,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>🔥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: T.text }}>{streak} дней подряд!</Text>
                    <Text style={{ fontSize: 11, color: T.textDim, fontWeight: '600', marginTop: 1 }}>Не пропускай сегодня</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#F5A623' }}>+{streak * 5}</Text>
                    <Text style={{ fontSize: 9, color: T.textDim, fontWeight: '700' }}>XP БОНУС</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {days.map((d, i) => {
                    const completed = i <= todayShifted && i >= Math.max(0, todayShifted - streak + 1);
                    const isToday = i === todayShifted;
                    return (
                      <View key={d} style={{ alignItems: 'center', gap: 5 }}>
                        <View style={{
                          width: 30, height: 30, borderRadius: 15,
                          backgroundColor: completed ? (isToday ? T.accent : 'rgba(245,166,35,0.2)') : T.bgElevated,
                          borderWidth: isToday ? 2 : 1,
                          borderColor: isToday ? '#F5A623' : (completed ? 'rgba(245,166,35,0.4)' : T.border),
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          {completed && <Text style={{ fontSize: 13 }}>{isToday ? '🔥' : '✓'}</Text>}
                        </View>
                        <Text style={{ fontSize: 9, color: isToday ? T.accent : T.textDim, fontWeight: '700' }}>{d}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          {/* ACHIEVEMENTS ROW */}
          {!user?.isGuest && (
            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={[s.sLabel, { color: T.textDim }]}>🏆 {L.achievements.toUpperCase()}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {[
                  { icon: '🎨', label: L.achFirstPost, unlocked: userStats.postsCount >= 1 },
                  { icon: '❤️', label: L.achFirstLike, unlocked: userStats.likesTotal >= 1 },
                  { icon: '🔥', label: L.ach10Posts,   unlocked: userStats.postsCount >= 10 },
                  { icon: '⭐', label: L.ach100Likes,  unlocked: userStats.likesTotal >= 100 },
                  { icon: '👑', label: L.achDaily,     unlocked: false },
                ].map((ach, i) => (
                  <View key={i} style={{
                    width: 88, height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: ach.unlocked ? T.bgCard : T.bgSoft,
                    borderWidth: 1, borderColor: ach.unlocked ? T.borderActive : T.border,
                    opacity: ach.unlocked ? 1 : 0.5, padding: 6,
                  }}>
                    <Text style={{ fontSize: 26, marginBottom: 4, opacity: ach.unlocked ? 1 : 0.3 }}>{ach.icon}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: ach.unlocked ? T.text : T.textDim, textAlign: 'center' }} numberOfLines={2}>
                      {ach.label}
                    </Text>
                    {ach.unlocked && (
                      <View style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={10} color="white"/>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
            <TouchableOpacity
              style={{ flex: 1, borderRadius: 13, overflow: 'hidden' }}
              onPress={() => { haptic(); setEdit(true); }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#7B6CF5', '#EE5FA0']}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13 }}
              >
                <Ionicons name="create-outline" size={15} color="white"/>
                <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>{L.edit}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 7, backgroundColor: T.bgCard, paddingVertical: 13, borderRadius: 13,
                borderWidth: 1, borderColor: T.border,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={15} color={T.text}/>
              <Text style={{ color: T.text, fontSize: 13, fontWeight: '700' }}>{L.share}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={{
          flexDirection: 'row', backgroundColor: T.bgCard,
          marginHorizontal: 16, borderRadius: 13, padding: 4,
          marginBottom: 16, borderWidth: 1, borderColor: T.border,
        }}>
          {['works', 'liked', 'saved'].map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => { haptic(); setTab(t); }}
              style={{
                flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 9,
                backgroundColor: tab === t ? T.bgElevated : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? T.text : T.textDim }}>
                {t === 'works' ? L.works : t === 'liked' ? L.likes : L.saved}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 4 }}>
          {displayPosts.length === 0 ? (
            <View style={{ width: '100%', alignItems: 'center', paddingVertical: 50 }}>
              <Ionicons name="images-outline" size={42} color={T.textDim}/>
              <Text style={{ color: T.textDim, marginTop: 12, fontSize: 13 }}>Пока нет работ</Text>
            </View>
          ) : displayPosts.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={{ width: (width - 36) / 3, height: (width - 36) / 3, borderRadius: 11, overflow: 'hidden' }}
              activeOpacity={0.85}
            >
              {item.imageUrl
                ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover"/>
                : <LinearGradient
                    colors={CARD_GRADIENTS[(item.gradientIdx ?? idx) % CARD_GRADIENTS.length]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
              }
              <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                flexDirection: 'row', alignItems: 'center', gap: 3,
                backgroundColor: 'rgba(0,0,0,0.5)', padding: 5,
              }}>
                <Ionicons name="heart" size={10} color="white"/>
                <Text style={{ fontSize: 10, color: 'white', fontWeight: '700' }}>{formatNum(item.likesCount)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEdit(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill}/>
          <View style={{
            backgroundColor: T.bgCard, borderRadius: 24, padding: 24, margin: 16,
            borderWidth: 1, borderColor: T.border,
          }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: T.text, marginBottom: 22 }}>
              {L.editProfile}
            </Text>
            <Text style={[s.fLabel, { color: T.textSoft, marginBottom: 8 }]}>{L.name}</Text>
            <View style={[s.fRow, { backgroundColor: T.bgElevated, borderColor: T.border, marginBottom: 22 }]}>
              <Ionicons name="person-outline" size={17} color={T.textDim} style={{ marginRight: 10 }}/>
              <TextInput
                style={[s.fInput, { flex: 1, color: T.text }]}
                value={newName} onChangeText={setNew}
                placeholderTextColor={T.textDim}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 13,
                  backgroundColor: T.bgElevated, alignItems: 'center',
                  borderWidth: 1, borderColor: T.border,
                }}
                onPress={() => setEdit(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: T.textSoft, fontWeight: '700' }}>{L.cancel}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <GradientButton onPress={saveProfile} loading={saving}>
                  <Text style={s.btnTxt}>{L.save}</Text>
                </GradientButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


// ═══════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════
function SettingsModal({ visible, onClose, onLogout, isDark, onToggleTheme, lang, onToggleLang, notifEnabled, onToggleNotif }) {
  const T = useTheme();
  const L = useLang();
  const rows = [
    { icon: 'moon-outline', label: L.darkTheme, right: () => (
      <TouchableOpacity
        onPress={onToggleTheme}
        style={[s.toggle, { backgroundColor: isDark ? T.accent : T.bgElevated, borderWidth: 1, borderColor: T.border }]}
      >
        <Animated.View style={[s.toggleDot, { transform: [{ translateX: isDark ? 22 : 2 }] }]}/>
      </TouchableOpacity>
    )},
    { icon: 'notifications-outline', label: L.notifications, right: () => (
      <TouchableOpacity
        onPress={onToggleNotif}
        style={[s.toggle, { backgroundColor: notifEnabled ? T.accent : T.bgElevated, borderWidth: 1, borderColor: T.border }]}
      >
        <Animated.View style={[s.toggleDot, { transform: [{ translateX: notifEnabled ? 22 : 2 }] }]}/>
      </TouchableOpacity>
    )},
    { icon: 'language-outline', label: L.language, right: () => (
      <TouchableOpacity
        onPress={onToggleLang}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: T.bgElevated, borderRadius: 20,
          paddingHorizontal: 12, paddingVertical: 6,
          borderWidth: 1, borderColor: T.border,
        }}
      >
        <Text style={{ fontSize: 13, color: T.accent, fontWeight: '800' }}>
          {lang === 'ru' ? 'RU' : 'EN'}
        </Text>
        <Ionicons name="swap-horizontal" size={14} color={T.accent}/>
      </TouchableOpacity>
    )},
    { icon: 'lock-closed-outline', label: L.privacy, right: () => <Ionicons name="chevron-forward" size={16} color={T.textDim}/> },
    { icon: 'help-circle-outline', label: L.help, right: () => <Ionicons name="chevron-forward" size={16} color={T.textDim}/> },
    { icon: 'information-circle-outline', label: L.about, right: () => <Ionicons name="chevron-forward" size={16} color={T.textDim}/> },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}/>
        </TouchableOpacity>
        <View style={{
          backgroundColor: T.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderWidth: 1, borderColor: T.border,
          paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        }}>
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.border }}/>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, marginBottom: 14,
          }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: T.text }}>{L.settings}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[s.iconBtn, { backgroundColor: T.bgElevated, borderColor: T.border }]}
            >
              <Ionicons name="close" size={18} color={T.text}/>
            </TouchableOpacity>
          </View>
          {rows.map((row, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => haptic()}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 20, paddingVertical: 15,
                borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                borderBottomColor: T.border,
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 11,
                backgroundColor: T.bgElevated, alignItems: 'center', justifyContent: 'center',
                marginRight: 14, borderWidth: 1, borderColor: T.border,
              }}>
                <Ionicons name={row.icon} size={17} color={T.textSoft}/>
              </View>
              <Text style={{ flex: 1, fontSize: 15, color: T.text, fontWeight: '600' }}>{row.label}</Text>
              {row.right()}
            </TouchableOpacity>
          ))}
          <View style={{ marginHorizontal: 16, marginTop: 10 }}>
            <GradientButton onPress={onLogout} colors={['#EF4444', '#DC2626']}>
              <Ionicons name="log-out-outline" size={16} color="white"/>
              <Text style={s.btnTxt}>{L.logout}</Text>
            </GradientButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM TAB BAR
// ═══════════════════════════════════════════════════════════════
function CustomTabBar({ state, navigation }) {
  const T = useTheme();
  const L = useLang();
  const tabs = [
    { name: 'Feed',    icon: 'home-outline',    activeIcon: 'home',    label: L.feed },
    { name: 'Explore', icon: 'compass-outline', activeIcon: 'compass', label: L.explore },
    { name: 'Create',  icon: 'sparkles',        activeIcon: 'sparkles', label: L.create },
    { name: 'Profile', icon: 'person-outline',  activeIcon: 'person',  label: L.profile },
  ];

  return (
    <View style={[s.tabBar, { backgroundColor: T.bg, borderTopColor: T.border }]}>
      <View style={[s.tabBarLine, { backgroundColor: T.border }]}/>
      {state.routes.map((route, index) => {
        const tab = tabs[index];
        const isFocused = state.index === index;
        const onPress = () => { haptic(); navigation.navigate(route.name); };
        if (route.name === 'Create') {
          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={s.tabItem} activeOpacity={0.85}>
              <LinearGradient
                colors={['#7B6CF5', '#EE5FA0']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.createBtn}
              >
                <Ionicons name="sparkles" size={22} color="white"/>
              </LinearGradient>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={s.tabItem} activeOpacity={0.7}>
            {isFocused && <View style={[s.tabStripe, { backgroundColor: T.accent }]}/>}
            <View style={[
              s.tabIconBox,
              isFocused && { backgroundColor: T.isDark ? 'rgba(123,108,245,0.13)' : 'rgba(123,108,245,0.08)' }
            ]}>
              <Ionicons
                name={isFocused ? tab.activeIcon : tab.icon}
                size={22}
                color={isFocused ? T.accent : T.textDim}
              />
            </View>
            <Text style={[s.tabLabel, { color: isFocused ? T.accent : T.textDim }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN TABS
// ═══════════════════════════════════════════════════════════════
function MainTabs({ onOpenSettings }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props}/>}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Feed" component={FeedScreen}/>
      <Tab.Screen name="Explore" component={ExploreScreen}/>
      <Tab.Screen name="Create" component={CreateScreen}/>
      <Tab.Screen name="Profile">
        {() => <ProfileScreen onOpenSettings={onOpenSettings}/>}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


// ═══════════════════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════════════════
function SplashScreen() {
  const T = useTheme();
  const L = useLang();
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg}/>
      <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: T.glow }}/>
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <AnimatedLogo size={92}/>
        <Text style={{ fontSize: 32, fontWeight: '900', color: T.text, marginTop: 22, letterSpacing: -0.6 }}>
          {L.appName}
        </Text>
        <Text style={{ fontSize: 13, color: T.textSoft, marginTop: 6, fontWeight: '600' }}>
          {L.tagline}
        </Text>
        <ActivityIndicator size="small" color={T.accent} style={{ marginTop: 30 }}/>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP ROOT — с гарантированной защитой от зависаний
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState('ru');
  const [onboard, setOnboard] = useState(null); // null = ещё не загрузили
  const [settings, setSettings] = useState(false);
  const [credits, setCredits] = useState(150);
  const [notifOn, setNotifOn] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const T = isDark ? DARK : LIGHT;
  const L = LANGS[lang];

  // Persist settings — гарантированно не блокируем UI
  useEffect(() => {
    AsyncStorage.multiGet(['isDark', 'lang', 'onboard'])
      .then(pairs => {
        const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
        if (map.isDark !== null) setIsDark(map.isDark === 'true');
        if (map.lang) setLang(map.lang);
        setOnboard(map.onboard !== 'done');
      })
      .catch(() => setOnboard(true));
  }, []);

  const saveSettings = useCallback((key, val) => {
    AsyncStorage.setItem(key, String(val)).catch(() => {});
  }, []);

  // Splash минимум 1.2 сек — чтобы не было резкого мигания
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Auth state listener — с тройной защитой
  useEffect(() => {
    let isCancelled = false;

    const safetyTimer = setTimeout(() => {
      if (!isCancelled) setAuthReady(true);
    }, CONFIG.authTimeout);

    const unsub = onAuthStateChanged(auth,
      async (fbUser) => {
        if (isCancelled) return;
        clearTimeout(safetyTimer);
        try {
          if (fbUser) {
            const safeName = sanitizeName(fbUser.displayName || 'User');
            const data = await ensureUserDoc(fbUser.uid, safeName, fbUser.email || '');
            if (isCancelled) return;
            setCredits(data?.credits ?? 150);
            setUser({ uid: fbUser.uid, name: safeName, email: fbUser.email, isGuest: false });
          } else {
            setUser(null);
          }
        } catch (e) {
          if (__DEV__) console.warn('[Auth callback error]');
          if (fbUser) {
            const safeName = sanitizeName(fbUser.displayName || 'User');
            setUser({ uid: fbUser.uid, name: safeName, email: fbUser.email, isGuest: false });
          }
        } finally {
          setAuthReady(true);
        }
      },
      () => {
        clearTimeout(safetyTimer);
        if (!isCancelled) setAuthReady(true);
      }
    );

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimer);
      unsub();
    };
  }, []);

  // Fade in when ready
  useEffect(() => {
    if (authReady && user) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [authReady, user]);

  const logout = async () => {
    try {
      if (user?.isGuest) {
        setUser(null);
      } else {
        await signOut(auth);
      }
    } catch (e) { if (__DEV__) console.warn('[error]'); }
    setSettings(false);
  };

  const toggleTheme = () => {
    haptic();
    const next = !isDark;
    setIsDark(next);
    saveSettings('isDark', next);
  };

  const toggleLang = () => {
    haptic();
    const next = lang === 'ru' ? 'en' : 'ru';
    setLang(next);
    saveSettings('lang', next);
  };

  const handleOnboardDone = () => {
    setOnboard(false);
    AsyncStorage.setItem('onboard', 'done').catch(() => {});
  };

  const handleGuest = () => {
    setUser({
      uid: 'guest',
      name: lang === 'ru' ? 'Гость' : 'Guest',
      email: null,
      isGuest: true,
    });
  };

  const userCtx = useMemo(
    () => ({ user, setUser, credits, setCredits }),
    [user, credits]
  );

  // Wait for splash + auth + onboard load
  const isStillLoading = !splashDone || !authReady || onboard === null;

  return (
    <ThemeContext.Provider value={T}>
      <LangContext.Provider value={L}>
        <UserContext.Provider value={userCtx}>
          <ToastProvider>
            <NavigationContainer>
              {isStillLoading ? (
                <SplashScreen/>
              ) : onboard ? (
                <OnboardingScreen onDone={handleOnboardDone}/>
              ) : !user ? (
                <AuthScreen onGuest={handleGuest}/>
              ) : (
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                  <MainTabs onOpenSettings={() => setSettings(true)}/>
                  <SettingsModal
                    visible={settings}
                    onClose={() => setSettings(false)}
                    onLogout={logout}
                    isDark={isDark}
                    onToggleTheme={toggleTheme}
                    lang={lang}
                    onToggleLang={toggleLang}
                    notifEnabled={notifOn}
                    onToggleNotif={() => { haptic(); setNotifOn(!notifOn); }}
                  />
                </Animated.View>
              )}
            </NavigationContainer>
          </ToastProvider>
        </UserContext.Provider>
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}


// ═══════════════════════════════════════════════════════════════
// STYLES — улучшенные с premium-feel
// ═══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1 },

  // Auth
  authScroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  authLogoWrap: { alignItems: 'center', marginBottom: 36 },
  authTitle: { fontSize: 36, fontWeight: '900', marginTop: 18, letterSpacing: -0.6 },
  authSub: { fontSize: 14, marginTop: 6, textAlign: 'center', fontWeight: '500' },
  authCard: {
    borderRadius: 24, padding: 22, borderWidth: 1,
    shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  modeRow: {
    flexDirection: 'row', borderRadius: 14, padding: 4,
    marginBottom: 20, borderWidth: 1, overflow: 'hidden',
  },
  modeBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 11, overflow: 'hidden',
  },
  modeTxt: { fontSize: 14, fontWeight: '700' },
  errBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12,
    padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  errTxt: { fontSize: 13, color: '#FCA5A5', flex: 1, lineHeight: 18 },
  fGroup: { marginBottom: 14 },
  fLabel: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 0.6 },
  fRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 13, borderWidth: 1, paddingHorizontal: 14 },
  fInput: { flex: 1, fontSize: 14, paddingVertical: 14 },
  divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  divLine: { flex: 1, height: 1 },
  divTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 14, borderWidth: 1,
  },
  guestTxt: { fontSize: 14, fontWeight: '700' },
  terms: { fontSize: 11, textAlign: 'center', marginTop: 22, lineHeight: 18, paddingHorizontal: 14 },

  // Buttons
  gradBtn: {
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  btnTxt: { fontSize: 15, fontWeight: '800', color: 'white', letterSpacing: 0.2 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 12, gap: 8,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EE5FA0', borderWidth: 1.5,
  },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 15, paddingHorizontal: 14, paddingVertical: 12,
    marginHorizontal: 16, marginBottom: 6, borderWidth: 1,
  },
  searchIn: { flex: 1, fontSize: 14 },

  // Chips
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
  },
  chipTxt: { fontSize: 13, fontWeight: '700' },

  // Cards
  card: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  saleBadge: { position: 'absolute', top: 10, left: 10, zIndex: 2, borderRadius: 8, overflow: 'hidden' },
  shareBtn: { position: 'absolute', top: 10, right: 48, zIndex: 2, borderRadius: 10, overflow: 'hidden' },
  heartBtn: { position: 'absolute', top: 10, right: 10, zIndex: 2, borderRadius: 10, overflow: 'hidden' },
  actionBlur: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingTop: 40 },
  modelPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2.5 },
  modelPillTxt: { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '800' },

  // Detail modal
  mClose: { position: 'absolute', top: 50, right: 16, zIndex: 10, borderRadius: 13, overflow: 'hidden' },
  likeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22,
    paddingHorizontal: 13, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  // Create
  creditsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 11, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1,
  },
  preview: {
    height: 320, borderRadius: 20, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  sect: { marginBottom: 24 },
  sLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  surpriseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1,
  },
  modelCard: {
    borderRadius: 15, padding: 14, width: 140,
    borderWidth: 1, alignItems: 'flex-start',
  },
  modelTag: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2.5,
  },
  modelTagTxt: { fontSize: 9, color: 'white', fontWeight: '900', letterSpacing: 0.5 },
  modelName: { fontSize: 14, fontWeight: '800', marginTop: 9, marginBottom: 3 },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1 },
  pillTxt: { fontSize: 13, fontWeight: '600' },

  // Tab Bar
  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    paddingHorizontal: 4, borderTopWidth: 0.5, overflow: 'hidden',
  },
  tabBarLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 0.5 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 3 },
  tabStripe: { position: 'absolute', top: -10, width: 30, height: 3, borderRadius: 2 },
  tabIconBox: { width: 44, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  createBtn: {
    width: 50, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7B6CF5', shadowOpacity: 0.45, shadowRadius: 10, elevation: 8,
  },

  // Misc
  scrollTopBtn: {
    position: 'absolute', bottom: 110, right: 16, zIndex: 10,
    shadowColor: '#7B6CF5', shadowOpacity: 0.45, shadowRadius: 12, elevation: 10,
  },
  scrollTopInner: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },

  // Toast
  toastWrap: {
    position: 'absolute', bottom: 130, alignSelf: 'center',
    zIndex: 9999, maxWidth: '90%',
  },
  toastInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 26, paddingHorizontal: 18, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  toastTxt: { fontSize: 13, color: 'white', fontWeight: '700', flex: 1 },

  // Toggle
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center', padding: 2 },
  toggleDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: 'white',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 2,
  },
});
