import { useRef } from 'react';

const useSound = (src, volume = 1) => {
    const soundRef = useRef(new Audio(src));
    soundRef.current.volume = volume;

    const play = () => {
        const sound = soundRef.current.cloneNode();
        sound.play();
    };

    return play;
};

export default useSound;