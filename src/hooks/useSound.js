import { useRef } from 'react';

const useSound = (url) => {
  // Usamos useRef para asegurar que el objeto Audio y el estado de inicialización persistan durante todo el ciclo de vida del componente.
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = {
      audio: new Audio(url),
      isInitialized: false,
    };
  }

  const play = () => {
    if (audioRef.current.isInitialized) {
      audioRef.current.audio.currentTime = 0;
      audioRef.current.audio.play().catch(error => console.error("Error playing sound:", error));
    } else {
      console.warn("Sound not initialized. Please interact with the page first.");
    }
  };

  const init = () => {
    if (!audioRef.current.isInitialized) {
      audioRef.current.audio.volume = 0;
      audioRef.current.audio.play().then(() => {
        audioRef.current.audio.pause();
        audioRef.current.audio.currentTime = 0;
        audioRef.current.audio.volume = 1;
        audioRef.current.isInitialized = true;
      }).catch(error => {
        console.warn("Audio initialization failed. This is expected if there was no user interaction yet.", error);
      });
    }
  };

  return { play, init };
};

export default useSound;