// Sound effect utilities

const pickupSounds = [
  "/fx/pickup1.wav",
  "/fx/pickup2.wav",
  "/fx/pickup3.wav",
  "/fx/pickup4.wav",
];

const dropSounds = ["/fx/drop1.wav", "/fx/drop2.wav"];

const newElementSounds = [
  "/fx/new-element1.wav",
  "/fx/new-element2.mp3",
  "/fx/new-element3.mp3",
  "/fx/new-element4.mp3",
];

function playRandomSound(sounds: string[], volume = 0.5) {
  const randomIndex = Math.floor(Math.random() * sounds.length);
  const audio = new Audio(sounds[randomIndex]);
  audio.volume = volume;
  audio.play().catch(() => {
    // Ignore autoplay errors
  });
}

export function playPickupSound() {
  playRandomSound(pickupSounds, 0.4);
}

export function playDropSound() {
  playRandomSound(dropSounds, 0.4);
}

export function playNewElementSound() {
  playRandomSound(newElementSounds, 0.5);
}
