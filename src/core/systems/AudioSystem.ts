import { World, System } from '../World';
import { AudioManager } from '../AudioManager';
import { Health, Projectile, Renderable, Shield, WaveInfo } from '../components';

/**
 * AudioSystem
 *
 * Plays sounds for game events by watching state change between frames, so gameplay
 * systems don't need to know about audio: enemy shots, hull and Dyson damage, wave
 * start/clear and game over. Runs last-ish, after collisions and the wave system.
 *
 * Sounds tied to a specific action (player laser, explosions, power-ups, boost,
 * lightning, Praetorian beam, upgrades) are played where the action happens.
 */
export class AudioSystem implements System {
  private seenProjectiles = new Set<number>();
  private playerHealth: number | null = null;
  private dysonShield: number | null = null;
  private dysonHealth: number | null = null;
  private waveActive: boolean | null = null;
  private gameOver = false;

  constructor(private world: World, private audio: AudioManager) {}

  update(): void {
    this.checkEnemyShots();
    this.checkPlayer();
    this.checkDyson();
    this.checkWave();
    this.checkGameOver();
  }

  private checkEnemyShots(): void {
    const projectiles = this.world.getEntitiesWith(['Projectile']);
    let enemyFired = false;
    const live = new Set<number>();
    for (const entity of projectiles) {
      live.add(entity);
      if (this.seenProjectiles.has(entity)) continue;
      const projectile = this.world.getComponent<Projectile>(entity, 'Projectile');
      if (projectile && !this.world.hasComponent(projectile.ownerEntity, 'InputReceiver')) {
        enemyFired = true;
      }
    }
    this.seenProjectiles = live;
    if (enemyFired) this.audio.playSynth('enemyLaser');
  }

  private checkPlayer(): void {
    const [player] = this.world.getEntitiesWith(['InputReceiver', 'Health']);
    const health = player === undefined ? undefined : this.world.getComponent<Health>(player, 'Health');
    if (!health) return;
    if (this.playerHealth !== null && health.current < this.playerHealth && health.current > 0) {
      this.audio.playSynth('hullHit');
    }
    this.playerHealth = health.current;
  }

  private checkDyson(): void {
    const dyson = this.world.getEntitiesWith(['Renderable', 'Shield', 'Health']).find(
      (entity) => this.world.getComponent<Renderable>(entity, 'Renderable')?.modelId === 'dysonSphere',
    );
    if (dyson === undefined) return;
    const shield = this.world.getComponent<Shield>(dyson, 'Shield');
    const health = this.world.getComponent<Health>(dyson, 'Health');
    if (!shield || !health) return;

    if (this.dysonHealth !== null && health.current < this.dysonHealth) {
      this.audio.playSynth('coreHit');
    } else if (this.dysonShield !== null && shield.current < this.dysonShield - 0.01) {
      this.audio.playSynth('shieldHit');
    }
    this.dysonShield = shield.current;
    this.dysonHealth = health.current;
  }

  private checkWave(): void {
    const [waveEntity] = this.world.getEntitiesWith(['WaveInfo']);
    const wave = waveEntity === undefined ? undefined : this.world.getComponent<WaveInfo>(waveEntity, 'WaveInfo');
    if (!wave) return;
    if (this.waveActive !== null && wave.isActive !== this.waveActive) {
      this.audio.playSynth(wave.isActive ? 'waveStart' : 'waveClear');
    }
    this.waveActive = wave.isActive;
  }

  private checkGameOver(): void {
    const isOver = this.world.getGameState()?.isGameOver ?? false;
    if (isOver && !this.gameOver) this.audio.playSynth('gameOver');
    this.gameOver = isOver;
  }
}
