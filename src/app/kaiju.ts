import { Texture, Ticker } from "pixi.js";
import { Enemy } from "./enemy";
import type { Homebase, Obstacle } from "./buildings";
import { Player } from "./player";

export class Kaiju extends Enemy {
  constructor(
    texture: Texture,
    player: Player, // required by super, but we'll ignore it
    private homebase: Homebase
  ) {
    super(texture, player);
    this.speed = 0.5;
    this.fireRate = 4000;
    this.health = 20;
    this.maxHealth = 100;
    this.scale.set(4); // Make it huge
    this.minimapColor = 0xff00ff; // Magenta for the big boss
    this.minimapRadius = 5;
  }

  // Override fire to target homebase
  protected fire() {
    // const dx = this.homebase.x - this.x;
    // const dy = this.homebase.y - this.y;
    // const angle = Math.atan2(dy, dx);

    // const bullet = new Bullet(this.x, this.y, angle, colors.red);
    // this.bullets.push(bullet);
    // this.parent?.addChild(bullet);
  }

  // Override update to target homebase instead of player
  public update(ticker: Ticker, worldWidth: number, worldHeight: number, obstacles: Obstacle[]) {
    const dt = ticker.deltaTime;

    // move towards homebase
    const dx = this.homebase.x - this.x;
    const dy = this.homebase.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 50) { // Stop when close to homebase
      this.moveTowards(dt, this.homebase, worldWidth, worldHeight, obstacles);
    }

    this.keepInBounds(worldWidth, worldHeight);

    // Firing logic
    if (distance > 50 && Date.now() - this.lastFired > this.fireRate) {
      this.fire();
      this.lastFired = Date.now();
    }
  }
}