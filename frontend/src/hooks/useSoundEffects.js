import { useCallback, useState } from 'react';

export const useSoundEffects = () => {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('soundMuted') === 'true';
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem('soundMuted', String(newValue));
      return newValue;
    });
  };

  const playSound = useCallback((type) => {
    if (localStorage.getItem('soundMuted') === 'true') return;

    const sounds = {
      click: '/sounds/click.mp3',
      hover: '/sounds/hover.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      delete: '/sounds/delete.mp3',
    };

    if (sounds[type]) {
      const audio = new Audio(sounds[type]);
      audio.currentTime = 0;
      audio.volume = 2;
      audio.play().catch(() => {
        // Catch auto-play blocks or missing file errors
      });
    }
  }, []);

  return { playSound, isMuted, toggleMute };
};
