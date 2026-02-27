import { Texture, Ticker } from "pixi.js";
import { Bullet } from "./bullet";
import { Player } from "./player";
import { Character } from "./character";
import { colors } from "./variables";
import type { Obstacle } from "./buildings";

export class Enemy extends Character {
  private pursuitRadius = 600;
  public minimapColor = colors.red;
  public minimapRadius = 2;

  constructor(
    texture: Texture,
    private player: Player
  ) {
    super(texture, 2, 2000, 0xff0000, 2); // speed, fireRate, hitboxColor, health
  }

  protected fire() {
    // Fire towards the player
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const angle = Math.atan2(dy, dx);

    const bullet = new Bullet(this.x, this.y, angle, colors.red);
    this.bullets.push(bullet);
    this.parent?.addChild(bullet);
  }

  public update(ticker: Ticker, worldWidth: number, worldHeight: number, obstacles: Obstacle[]) {
    if (!this.player || this.player.isDead()) return; // Stop updating if player is dead

    const dt = ticker.deltaTime;

    const distanceToPlayer = Math.sqrt(
      (this.player.x - this.x) ** 2 + (this.player.y - this.y) ** 2
    );

    // Only move if the player is within the pursuit radius
    if (distanceToPlayer > 0 && distanceToPlayer < this.pursuitRadius) {
      this.moveTowards(dt, this.player, worldWidth, worldHeight, obstacles);
    }

    this.keepInBounds(worldWidth, worldHeight);

    // Firing logic
    if (distanceToPlayer > 50 && Date.now() - this.lastFired > this.fireRate) {
      // Don't fire if too close
      this.fire();
      this.lastFired = Date.now();
    }
  }
}
