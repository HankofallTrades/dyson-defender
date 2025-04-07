import * as THREE from 'three';

/**
 * Audio Manager for Dyson Sphere Defender
 * 
 * Manages loading and playing of audio files throughout the game.
 * Handles the soundtrack and sound effects using Three.js Audio capabilities.
 */
export class AudioManager {
  private audioContext: AudioContext;
  private soundBuffers: Map<string, AudioBuffer>;
  private sounds: Map<string, THREE.Audio['buffer']> = new Map();
  private audioSources: Map<string, THREE.Audio> = new Map();
  private audioLoader: THREE.AudioLoader = new THREE.AudioLoader();
  private listener: THREE.AudioListener = new THREE.AudioListener();
  private soundtrackVolume: number = 0.8;
  private sfxVolume: number = 0.3;
  private muted: boolean = true;
  private audioEnabled: boolean = true;
  private isContextResumed: boolean = false; // Track AudioContext state

  constructor() {
    // console.log('[AudioManager] Initializing...'); // REMOVED
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.soundBuffers = new Map<string, AudioBuffer>();
    
    // Check if audio is supported in this browser
    try {
      // Feature detection for Web Audio API
      this.audioEnabled = typeof AudioContext !== 'undefined' || 
                         typeof (window as any).webkitAudioContext !== 'undefined';
      
      // Try to resume the context immediately if it's suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.isContextResumed = true;
          console.log('[AudioManager] AudioContext resumed during initialization');
        }).catch(error => {
          console.warn('[AudioManager] Failed to resume AudioContext during initialization:', error);
        });
      } else {
        this.isContextResumed = true;
      }
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
   * Attempts to resume the AudioContext if it's suspended.
   * This is often required due to browser autoplay policies.
   */
  public async resumeContextIfNeeded(): Promise<void> {
    if (!this.audioEnabled || this.isContextResumed) return;

    const context = this.listener.context;
    if (context.state === 'suspended') {
      console.log('[AudioManager] AudioContext suspended, attempting to resume...');
      try {
        await context.resume();
        this.isContextResumed = true;
        console.log('[AudioManager] AudioContext resumed successfully.');
      } catch (error) {
        console.warn('[AudioManager] Failed to resume AudioContext:', error);
        // It might remain suspended until another interaction
        // isContextResumed remains false
      }
    } else {
      this.isContextResumed = true; // Already running or closed
      console.log(`[AudioManager] AudioContext state is ${context.state}, no resume needed.`);
    }
  }

  /**
   * Load all game sounds
   * @returns Promise that resolves when all sounds are loaded
   */
  public async loadSounds(): Promise<void> {
    // console.log('[AudioManager] Loading sounds...'); // REMOVED
    if (!this.audioEnabled) {
      console.warn('[AudioManager] Audio disabled. Skipping sound loading.');
      return;
    }
    
    try {
      // console.log('[AudioManager] Loading sounds...'); // REMOVED - Duplicate also removed
      
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
   * Play a sound effect (non-soundtrack) with the specified key.
   * Stops any existing instance of the same sound effect before playing.
   * @param key The key of the sound to play
   * @param loop Whether the sound should loop
   * @param volume Optional volume override
   * @returns The audio object that was created or undefined if failed
   */
  public async playSound(key: string, loop: boolean = false, volume?: number): Promise<THREE.Audio | undefined> {
    if (key === 'soundtrack') {
      console.warn('[AudioManager] Use playSoundtrack() method for the soundtrack.');
      await this.playSoundtrack(); // Redirect to the proper method
      return this.audioSources.get('soundtrack');
    }
    
    if (!this.audioEnabled || this.muted) return undefined;

    // --- Attempt to resume context before playing --- 
    await this.resumeContextIfNeeded();
    if (!this.isContextResumed) {
      console.warn(`[AudioManager] Cannot play sound "${key}", AudioContext not active.`);
      return undefined;
    }
    // ----------------------------------------------

    const buffer = this.sounds.get(key);
    if (!buffer) {
      console.warn(`[AudioManager] Sound "${key}" not found`);
      return undefined;
    }

    // Stop existing SFX instance explicitly *before* creating the new one
    this.stopSound(key);

    // Create new audio source
    const sound = new THREE.Audio(this.listener);
    sound.setBuffer(buffer);

    // Set volume based on sound type with optional override
    const finalVolume = volume !== undefined ? volume : this.sfxVolume;
    sound.setVolume(finalVolume);

    sound.setLoop(loop);
    sound.offset = 0; // Explicitly start from the beginning
    sound.play();

    // Store the audio source for later control
    // Non-looping sounds don't strictly need storing unless we want to stop them early
    if (loop) {
      this.audioSources.set(key, sound);
    }

    return sound;
  }

  /**
   * Stop a sound with the specified key
   * @param key The key of the sound to stop
   */
  public stopSound(key: string): void {
    if (!this.audioEnabled) return;
    
    const sound = this.audioSources.get(key);
    if (sound) {
      if (sound.isPlaying) {
        sound.stop();
      }
      // Reset offset specifically for the soundtrack when stopped
      if (key === 'soundtrack') {
        sound.offset = 0;
        console.log('[AudioManager] Explicitly reset soundtrack offset on stop.');
      }
      // Remove the source only if we stopped it successfully
      // Keep the soundtrack source even when stopped.
      if (key !== 'soundtrack') {
        this.audioSources.delete(key);
      }
    }
  }

  /**
   * Play the game soundtrack, ensuring it starts cleanly and loops.
   * Manages a persistent THREE.Audio instance for the soundtrack.
   */
  public async playSoundtrack(): Promise<void> {
    if (this.muted) {
        console.log('[AudioManager] Muted, skipping soundtrack playback.');
        return;
    }

    if (!this.audioEnabled) return;

    await this.resumeContextIfNeeded();
    if (!this.isContextResumed) {
      console.warn('[AudioManager] Cannot play soundtrack, AudioContext not active.');
      return;
    }

    const buffer = this.sounds.get('soundtrack');
    if (!buffer) {
      console.warn('[AudioManager] Soundtrack buffer not loaded.');
      return;
    }

    let soundtrack = this.audioSources.get('soundtrack');

    if (soundtrack) {
      // Soundtrack object exists
      if (!soundtrack.isPlaying) {
        console.log('[AudioManager] Resuming existing soundtrack instance.');
        soundtrack.offset = 0; // Ensure it starts from beginning if paused/stopped
        soundtrack.play();
      } else {
        // Already playing, ensure loop and volume are correct (might have changed)
        soundtrack.setLoop(true);
        soundtrack.setVolume(this.soundtrackVolume);
      }
    } else {
      // Soundtrack object does not exist, create it
      console.log('[AudioManager] Creating new soundtrack instance.');
      soundtrack = new THREE.Audio(this.listener);
      soundtrack.setBuffer(buffer);
      soundtrack.setVolume(this.soundtrackVolume);
      soundtrack.setLoop(true);
      soundtrack.offset = 0; // Start from the beginning
      soundtrack.play();

      // Store the persistent soundtrack source
      this.audioSources.set('soundtrack', soundtrack);
    }
  }

  /**
   * Pause the game soundtrack
   */
  public pauseSoundtrack(): void {
    if (!this.audioEnabled) return;
    
    const soundtrack = this.audioSources.get('soundtrack');
    // Only pause, don't remove from audioSources
    if (soundtrack && soundtrack.isPlaying) {
      console.log('[AudioManager] Pausing soundtrack.');
      soundtrack.pause();
      // Explicitly set offset to 0 immediately after pausing
      soundtrack.offset = 0;
      console.log('[AudioManager] Explicitly reset soundtrack offset on pause.');
    }
  }

  /**
   * Resume the game soundtrack (simple alias for playSoundtrack now)
   */
  public resumeSoundtrack(): void {
    console.log('[AudioManager] Attempting to resume soundtrack.');
    // playSoundtrack now handles resuming correctly
    this.playSoundtrack();
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
   * Sets the master muted state for all audio.
   * @param muted Whether to mute all sounds
   */
  public async setMuted(muted: boolean): Promise<void> {
    if (!this.audioEnabled) return;

    this.muted = muted;
    console.log(`[AudioManager] Setting muted state to: ${muted}`);

    if (muted) {
      this.pauseSoundtrack();
      // Stop any currently playing non-looping SFX
      this.audioSources.forEach((sound, key) => {
        if (key !== 'soundtrack' && sound.isPlaying && !sound.getLoop()) {
          console.log(`[AudioManager] Stopping non-looping SFX: ${key}`);
          sound.stop();
          this.audioSources.delete(key); // Remove source if stopped
        }
      });
    } else {
      // Attempt to resume context *before* trying to play anything
      await this.resumeContextIfNeeded();
      
      // Only play soundtrack if context is active *after* attempting resume
      if (this.isContextResumed) {
        await this.playSoundtrack();
        console.log('[AudioManager] Soundtrack started after unmuting');
      } else {
        console.warn('[AudioManager] Cannot play soundtrack on unmute, AudioContext still not active.');
        // Try one more time to resume the context
        try {
          await this.audioContext.resume();
          this.isContextResumed = true;
          await this.playSoundtrack();
          console.log('[AudioManager] Successfully resumed context and started soundtrack on second attempt');
        } catch (error) {
          console.error('[AudioManager] Failed to resume context on second attempt:', error);
        }
      }
    }
  }

  /**
   * Gets the current muted state.
   * @returns True if audio is muted, false otherwise.
   */
  public isMuted(): boolean {
    return this.muted;
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