/**
 * Base Entity class
 * 
 * Purpose:
 * Provides the foundation for all game entities, ensuring consistent
 * behavior and interface across different entity types.
 * 
 * Responsibilities:
 * - Manages entity identification
 * - Provides common entity lifecycle methods
 * - Ensures proper resource cleanup
 * 
 * This class follows the use-types.mdc rule by providing a strong
 * type foundation for all game entities.
 */
export abstract class Entity {
  public readonly id: string;
  
  constructor(id: string) {
    this.id = id;
  }
  
  /**
   * Get the entity's unique identifier
   */
  public getId(): string {
    return this.id;
  }
  
  /**
   * Clean up entity resources
   */
  public abstract dispose(): void;
  
  /**
   * Update the entity's state
   * @param deltaTime Time elapsed since last update in seconds
   */
  public abstract update(deltaTime: number): void;
} 