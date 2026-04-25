/**
 * Скопируй этот файл в firebase.config.js и вставь свои значения.
 * firebase.config.js добавлен в .gitignore — он никогда не попадёт в репозиторий.
 *
 * Где взять значения:
 *   Firebase Console → Project settings → Your apps → SDK setup and configuration
 */
export const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.firebasestorage.app',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

/**
 * OpenAI ключ (нужен только если CONFIG.generator === 'openai').
 * Храни здесь — в коде не хардкодить.
 */
export const OPENAI_KEY = 'REPLACE_ME';
