import * as THREE from 'three';

/**
 * Audio Manager for Dyson Sphere Defender
 * 
 * Manages loading and playing of audio files throughout the game.
 * Handles the soundtrack and sound effects using Three.js Audio capabilities.
 */
export class AudioManager {
  private sounds: Map<string, THREE.Audio['buffer']> = new Map();
  private audioSources: Map<string, THREE.Audio> = new Map();
  private audioLoader: THREE.AudioLoader = new THREE.AudioLoader();
  private listener: THREE.AudioListener = new THREE.AudioListener();
  private soundtrackVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private muted: boolean = false;
  private audioEnabled: boolean = true;

  constructor() {
    console.log('[AudioManager] Initializing...');
    
    // Check if audio is supported in this browser
    try {
      // Feature detection for Web Audio API
      this.audioEnabled = typeof AudioContext !== 'undefined' || 
                         typeof (window as any).webkitAudioContext !== 'undefined';
    } catch (e) {
      console.warn('[AudioManager] Web Audio API not supported in this browser. Audio disabled.');
      this.audioEnabled = false;
    }
  }

  /**
   * Attach the audio listener to a camera
   * @param camera The camera to attach the audio listener to
   */
  public setCamera(camera: THREE.Camera): void {
    if (!this.audioEnabled) return;
    
    camera.add(this.listener);
  }

  /**
   * Load all game sounds
   * @returns Promise that resolves when all sounds are loaded
   */
  public async loadSounds(): Promise<void> {
    if (!this.audioEnabled) {
      console.warn('[AudioManager] Audio disabled. Skipping sound loading.');
      return;
    }
    
    try {
      console.log('[AudioManager] Loading sounds...');
      
      // Load soundtrack
      try {
        const soundtrackBuffer = await this.audioLoader.loadAsync('/audio/DysonDefenderTheme.mp3');
        this.sounds.set('soundtrack', soundtrackBuffer);
        console.log('[AudioManager] Soundtrack loaded successfully');
      } catch (error) {
        console.warn('[AudioManager] Soundtrack not found, continuing without music:', error);
      }
      
      // Load other sound effects (examples)
      await this.loadSoundSafely('laser', '/audio/laser.mp3');
      await this.loadSoundSafely('explosion', '/audio/explosion.mp3');
      await this.loadSoundSafely('powerup', '/audio/powerup.mp3');
      await this.loadSoundSafely('boost', '/audio/boost.mp3');
      
      console.log('[AudioManager] Sound loading completed');
    } catch (error) {
      console.error('[AudioManager] Error loading sounds:', error);
      this.audioEnabled = false;
    }
  }
  
  /**
   * Safely load a sound file, with error handling
   * @param key The identifier for the sound
   * @param path The file path to load
   */
  private async loadSoundSafely(key: string, path: string): Promise<void> {
    try {
      const buffer = await this.audioLoader.loadAsync(path);
      this.sounds.set(key, buffer);
      console.log(`[AudioManager] Sound "${key}" loaded successfully`);
    } catch (error) {
      console.warn(`[AudioManager] Sound "${key}" not found, continuing without it:`, error);
    }
  }

  /**
   * Play a sound with the specified key
   * @param key The key of the sound to play
   * @param loop Whether the sound should loop
   * @param volume Optional volume override
   * @returns The audio object that was created
   */
  public playSound(key: string, loop: boolean = false, volume?: number): THREE.Audio | undefined {
    if (!this.audioEnabled || this.muted) return;
    
    const buffer = this.sounds.get(key);
    if (!buffer) {
      console.warn(`[AudioManager] Sound "${key}" not found`);
      return;
    }
    
    // Stop existing instance of this sound if it exists
    this.stopSound(key);
    
    // Create new audio source
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(buffer);
    
    // Set volume based on sound type with optional override
    if (volume !== undefined) {
      sound.setVolume(volume);
    } else {
      sound.setVolume(key === 'soundtrack' ? this.soundtrackVolume : this.sfxVolume);
    }
    
    sound.setLoop(loop);
    sound.play();
    
    // Store the audio source for later control
    this.audioSources.set(key, sound);
    
    return sound;
  }

  /**
   * Stop a sound with the specified key
   * @param key The key of the sound to stop
   */
  public stopSound(key: string): void {
    if (!this.audioEnabled) return;
    
    const sound = this.audioSources.get(key);
    if (sound && sound.isPlaying) {
      sound.stop();
      this.audioSources.delete(key);
    }
  }

  /**
   * Play the game soundtrack
   */
  public playSoundtrack(): void {
    if (!this.audioEnabled) return;
    
    const result = this.playSound('soundtrack', true);
    if (!result) {
      console.warn('[AudioManager] Could not play soundtrack');
    }
  }

  /**
   * Pause the game soundtrack
   */
  public pauseSoundtrack(): void {
    if (!this.audioEnabled) return;
    
    const soundtrack = this.audioSources.get('soundtrack');
    if (soundtrack && soundtrack.isPlaying) {
      soundtrack.pause();
    }
  }

  /**
   * Resume the game soundtrack
   */
  public resumeSoundtrack(): void {
    if (!this.audioEnabled) return;
    
    const soundtrack = this.audioSources.get('soundtrack');
    if (soundtrack && !soundtrack.isPlaying) {
      soundtrack.play();
    }
  }

  /**
   * Set the volume for all sounds
   * @param volume The volume to set (0-1)
   * @param isSoundtrack Whether to set the soundtrack volume or SFX volume
   */
  public setVolume(volume: number, isSoundtrack: boolean = false): void {
    if (!this.audioEnabled) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (isSoundtrack) {
      this.soundtrackVolume = clampedVolume;
      const soundtrack = this.audioSources.get('soundtrack');
      if (soundtrack) {
        soundtrack.setVolume(clampedVolume);
      }
    } else {
      this.sfxVolume = clampedVolume;
      // Update volume for all non-soundtrack sounds
      this.audioSources.forEach((sound, key) => {
        if (key !== 'soundtrack') {
          sound.setVolume(clampedVolume);
        }
      });
    }
  }

  /**
   * Mute or unmute all sounds
   * @param muted Whether to mute or unmute
   */
  public setMuted(muted: boolean): void {
    if (!this.audioEnabled) return;
    
    this.muted = muted;
    
    if (muted) {
      // Pause all sounds
      this.audioSources.forEach(sound => {
        if (sound.isPlaying) {
          sound.pause();
        }
      });
    } else {
      // Resume soundtrack only
      const soundtrack = this.audioSources.get('soundtrack');
      if (soundtrack && !soundtrack.isPlaying) {
        soundtrack.play();
      }
    }
  }

  /**
   * Dispose of all audio resources
   */
  public dispose(): void {
    if (!this.audioEnabled) return;
    
    // Stop and dispose all audio sources
    this.audioSources.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    
    this.audioSources.clear();
    this.sounds.clear();
  }
} 