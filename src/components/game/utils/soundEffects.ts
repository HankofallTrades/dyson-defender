import { Howl, Howler } from 'howler';

// Flag to track if audio has been unlocked
let audioUnlocked = false;

// For simple fallback sounds using AudioContext
let audioContext: AudioContext | null = null;

// Initialize AudioContext for fallback sounds
export function initAudioContext() {
  if (audioContext) return audioContext;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('AudioContext created successfully');
    return audioContext;
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    return null;
  }
}

// Create simple sounds with AudioContext (guaranteed to work)
export function createSimpleSound(type: 'laser' | 'hit' | 'explosion') {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  // Configure the sound based on type
  switch (type) {
    case 'laser': {
      // Create a more complex, sci-fi laser sound
      // We'll create multiple oscillators with different frequency characteristics 
      // and combine them for a richer sound
      
      // Main laser oscillator (high pitched sweep down)
      const mainOscillator = ctx.createOscillator();
      mainOscillator.type = 'sawtooth';
      mainOscillator.frequency.setValueAtTime(1800, ctx.currentTime); // Start at a high pitch
      mainOscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15); // Sweep down
      
      // Secondary oscillator for a subtle layer
      const subOscillator = ctx.createOscillator();
      subOscillator.type = 'sine';
      subOscillator.frequency.setValueAtTime(550, ctx.currentTime);
      subOscillator.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.1);
      
      // Create a filter for a more focused sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      filter.Q.value = 8; // Narrow band for a sharper sound
      
      // Main gain node for volume envelope
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.01, ctx.currentTime); // Start quiet
      mainGain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02); // Quick attack
      mainGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15); // Decay
      
      // Sub oscillator gain
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.15, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      // Connect everything
      mainOscillator.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);
      
      subOscillator.connect(subGain);
      subGain.connect(ctx.destination);
      
      // Start and stop oscillators
      mainOscillator.start(ctx.currentTime);
      subOscillator.start(ctx.currentTime);
      
      mainOscillator.stop(ctx.currentTime + 0.2);
      subOscillator.stop(ctx.currentTime + 0.2);
      break;
    }
      
    case 'hit': {
      // Keep the hit sound implementation but improve it slightly
      const oscillator = ctx.createOscillator();
      const noiseBuffer = createNoiseBuffer(ctx, 0.2);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      // Noise filter for a "thud" quality
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 400;
      
      // Gain nodes
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      // Connections
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);
      
      oscillator.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Start and stop
      oscillator.start(ctx.currentTime);
      noiseSource.start(ctx.currentTime);
      
      oscillator.stop(ctx.currentTime + 0.3);
      noiseSource.stop(ctx.currentTime + 0.3);
      break;
    }
      
    case 'explosion': {
      // Create a better explosion sound using noise and filters
      const bufferSize = 4096;
      const noiseBuffer = createNoiseBuffer(ctx, 0.5);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      
      // Create multiple filters for different frequency bands
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.value = 200;
      
      const midFilter = ctx.createBiquadFilter();
      midFilter.type = 'bandpass';
      midFilter.frequency.value = 500;
      midFilter.Q.value = 1;
      
      const highFilter = ctx.createBiquadFilter();
      highFilter.type = 'highpass';
      highFilter.frequency.value = 1000;
      
      // Create gain nodes for each frequency band
      const lowGain = ctx.createGain();
      lowGain.gain.setValueAtTime(1, ctx.currentTime);
      lowGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      const midGain = ctx.createGain();
      midGain.gain.setValueAtTime(0.5, ctx.currentTime);
      midGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      const highGain = ctx.createGain();
      highGain.gain.setValueAtTime(0.3, ctx.currentTime);
      highGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      // Connect everything
      noise.connect(lowFilter);
      noise.connect(midFilter);
      noise.connect(highFilter);
      
      lowFilter.connect(lowGain);
      midFilter.connect(midGain);
      highFilter.connect(highGain);
      
      lowGain.connect(ctx.destination);
      midGain.connect(ctx.destination);
      highGain.connect(ctx.destination);
      
      // Start and stop
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.8);
      break;
    }
  }
}

// Helper function to create noise buffer
export function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  return buffer;
}

// Create Howl instances for our sound effects
const sounds = {
  playerLaser: new Howl({
    src: ['https://assets.codepen.io/21542/howler-shoot.mp3'],
    volume: 0.6,
    html5: true, // Use HTML5 Audio for better compatibility
    onload: () => console.log('Player laser sound loaded'),
    onloaderror: (id, error) => console.error('Error loading player laser sound:', error)
  }),
  enemyLaser: new Howl({
    src: ['https://assets.codepen.io/21542/howler-sfx-laser9.mp3'],
    volume: 0.5,
    html5: true,
    onload: () => console.log('Enemy laser sound loaded'),
    onloaderror: (id, error) => console.error('Error loading enemy laser sound:', error)
  }),
  hit: new Howl({
    src: ['https://assets.codepen.io/21542/howler-sfx-explosion7.mp3'],
    volume: 0.6,
    html5: true,
    onload: () => console.log('Hit sound loaded'),
    onloaderror: (id, error) => console.error('Error loading hit sound:', error)
  }),
  explosion: new Howl({
    src: ['https://assets.codepen.io/21542/howler-sfx-explosion12.mp3'],
    volume: 0.8,
    html5: true,
    onload: () => console.log('Explosion sound loaded'),
    onloaderror: (id, error) => console.error('Error loading explosion sound:', error)
  })
};

/**
 * Attempts to unlock audio on first user interaction
 */
export function unlockAudio() {
  if (audioUnlocked) return;
  
  console.log('Attempting to unlock audio...');
  
  // Initialize the audio context
  initAudioContext();
  
  // Try to play one sound to unlock audio
  const unlockSound = sounds.playerLaser;
  
  // Play and immediately stop to unlock
  const id = unlockSound.play();
  unlockSound.stop(id);
  
  audioUnlocked = true;
  console.log('Audio unlocked!');
  
  // For debugging
  Howler.volume(1.0);
  console.log('Howler global volume:', Howler.volume());
}

/**
 * Preloads sound effects to reduce latency when they're first played
 */
export function preloadSounds() {
  // Howler automatically handles preloading
  console.log('Sound effects preloaded with Howler.js');
  
  // Setup audio unlock listener
  const unlockEvents = ['click', 'touchstart', 'keydown'];
  
  const unlock = () => {
    unlockAudio();
    
    // Remove the event listeners once audio is unlocked
    unlockEvents.forEach(event => {
      document.removeEventListener(event, unlock);
    });
  };
  
  // Add event listeners for common user interactions
  unlockEvents.forEach(event => {
    document.addEventListener(event, unlock);
  });
}

/**
 * Plays a sound effect
 * @param soundPath - Path to the sound file
 * @param volume - Volume level (0.0 to 1.0)
 * @param playbackRate - Speed of playback (1.0 is normal)
 */
export function playSound(soundPath: string, volume = 1.0, playbackRate = 1.0) {
  // Map the sound path to our Howl instances
  let sound: Howl | null = null;
  let fallbackType: 'laser' | 'hit' | 'explosion' | null = null;
  
  if (soundPath.includes('laser_player')) {
    sound = sounds.playerLaser;
    fallbackType = 'laser';
  } else if (soundPath.includes('laser_enemy')) {
    sound = sounds.enemyLaser;
    fallbackType = 'laser';
  } else if (soundPath.includes('hit')) {
    sound = sounds.hit;
    fallbackType = 'hit';
  } else if (soundPath.includes('explosion')) {
    sound = sounds.explosion;
    fallbackType = 'explosion';
  }
  
  // Try to play with Howler
  if (sound) {
    // Apply the volume and rate modifications
    sound.volume(volume);
    sound.rate(playbackRate * (0.9 + Math.random() * 0.2)); // Apply slight randomization
    
    // Play the sound
    const soundId = sound.play();
    console.log(`Playing sound (${soundPath}), id: ${soundId}`);
    
    // Debug if sound failed to play
    if (soundId === undefined || soundId === null) {
      console.warn(`Failed to play sound with Howler: ${soundPath}, trying fallback`);
      // Use fallback audio if Howler fails
      if (fallbackType) {
        createSimpleSound(fallbackType);
      }
    }
  } else {
    console.warn('Unknown sound:', soundPath);
    // Try fallback if known type
    if (fallbackType) {
      createSimpleSound(fallbackType);
    }
  }
}

/**
 * Play hit sound effect when a laser hits an enemy without destroying it
 */
export function playHitSound() {
  try {
    sounds.hit.volume(0.6);
    sounds.hit.rate(1.0 + (Math.random() * 0.3));
    const soundId = sounds.hit.play();
    console.log(`Playing hit sound, id: ${soundId}`);
    
    if (soundId === undefined || soundId === null) {
      // Fallback to simple sound
      createSimpleSound('hit');
    }
  } catch (error) {
    console.error('Error playing hit sound:', error);
    createSimpleSound('hit');
  }
}

/**
 * Play explosion sound effect when an enemy is destroyed
 */
export function playExplosionSound() {
  try {
    sounds.explosion.volume(0.8);
    sounds.explosion.rate(0.9 + (Math.random() * 0.2));
    const soundId = sounds.explosion.play();
    console.log(`Playing explosion sound, id: ${soundId}`);
    
    if (soundId === undefined || soundId === null) {
      // Fallback to simple sound
      createSimpleSound('explosion');
    }
  } catch (error) {
    console.error('Error playing explosion sound:', error);
    createSimpleSound('explosion');
  }
} 