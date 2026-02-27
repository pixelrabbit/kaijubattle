import { Container, Graphics, Sprite, Texture, Rectangle } from "pixi.js";
import { Bullet } from "./bullet";
import type { Obstacle } from "./buildings";
import { findPath } from "./pathfinding";

export abstract class Character extends Container {
  protected speed: number;
  protected sprite: Sprite;
  public bullets: Bullet[] = [];
  protected lastFired = 0;
  protected fireRate: number;
  public health: number;
  public maxHealth: number;

  // A* Pathfinding
  private path: { x: number; y: number }[] | null = null;
  private pathTarget: { x: number; y: number } | null = null;
  private pathRecalculateTimer = 0;
  protected pathRecalculationInterval = 120; // How often to recalculate path, in frames.

  constructor(texture: Texture, speed: number, fireRate: number, hitboxColor: number, health: number) {
    super();
    this.speed = speed;
    this.fireRate = fireRate;
    this.health = health;
    this.maxHealth = health;

    const hitbox = new Graphics();
    hitbox
      .rect(-texture.width / 2, -texture.height / 2, texture.width, texture.height)
      .stroke({ width: 4, color: hitboxColor });
    this.addChild(hitbox);

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
  }

  public getHitbox(): Rectangle {
    return this.sprite.getBounds().rectangle;
  }

  public isCollidingWithObstacles(obstacles: Obstacle[]): boolean {
    const bounds = this.getHitbox();
    for (const obstacle of obstacles) {
      const obstacleBounds = obstacle.getBounds().rectangle;

      if (
        bounds.x < obstacleBounds.x + obstacleBounds.width &&
        bounds.x + bounds.width > obstacleBounds.x &&
        bounds.y < obstacleBounds.y + obstacleBounds.height &&
        bounds.y + bounds.height > obstacleBounds.y
      ) {
        return true;
      }
    }
    return false;
  }

  public takeDamage(amount: number) {
    this.health -= amount;
  }

  public isDead(): boolean {
    return this.health <= 0;
  }
  protected keepInBounds(worldWidth: number, worldHeight: number) {
    const halfWidth = this.sprite.width / 2;
    const halfHeight = this.sprite.height / 2;
    this.x = Math.max(halfWidth, Math.min(worldWidth - halfWidth, this.x));
    this.y = Math.max(halfHeight, Math.min(worldHeight - halfHeight, this.y));
  }

  protected abstract fire(): void;

  public isCollidingWithCharacters(characters: Character[]): boolean {
    const bounds = this.getHitbox();
    for (const other of characters) {
      if (this === other) continue;
      const otherBounds = other.getHitbox();
      if (bounds.intersects(otherBounds)) {
        return true;
      }
    }
    return false;
  }

  protected moveTowards(
    dt: number,
    target: { x: number; y: number },
    worldWidth: number,
    worldHeight: number,
    obstacles: Obstacle[]
  ) {
    this.pathRecalculateTimer -= dt;

    const targetDistance = this.pathTarget
      ? Math.sqrt((target.x - this.pathTarget.x) ** 2 + (target.y - this.pathTarget.y) ** 2)
      : Infinity;

    // Recalculate path if needed
    if (!this.path || this.path.length === 0 || targetDistance > 50 || this.pathRecalculateTimer <= 0) {
      this.path = findPath(worldWidth, worldHeight, obstacles, { x: this.x, y: this.y }, target, this);
      this.pathTarget = { x: target.x, y: target.y };
      this.pathRecalculateTimer = this.pathRecalculationInterval;
    }

    // Follow the path
    if (this.path && this.path.length > 0) {
      const nextPoint = this.path[0];
      const dx = nextPoint.x - this.x;
      const dy = nextPoint.y - this.y;
      const distanceToNextPoint = Math.sqrt(dx * dx + dy * dy);

      if (distanceToNextPoint < this.speed * dt || distanceToNextPoint < 5) {
        // Reached the waypoint, move to the next one
        this.path.shift();
      } else {
        // Move towards the next waypoint
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
      }
    }
  }
}
