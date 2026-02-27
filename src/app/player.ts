import { Graphics, Texture, Ticker, PointData } from "pixi.js";
import { Bullet } from "./bullet";
import { colors } from "./variables";
import { Enemy } from "./enemy";
import { Character } from "./character";
import type { Obstacle } from "./buildings";

export class Player extends Character {
  private keys: Record<string, boolean> = {};
  private reticle: Graphics;
  private mousePos = { x: 0, y: 0 };
  private readonly RETICLE_RADIUS = 300;
  private isFiring = false;

  constructor(texture: Texture) {
    super(texture, 3, 300, colors.green, 4);

    // Create reticle
    this.reticle = new Graphics().circle(0, 0, 12).fill({ color: colors.green, alpha: 0.7 }).circle(0, 0, 10).cut();
    this.addChild(this.reticle);

    // Event listeners
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.isFiring = true;
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.isFiring = false;
    });
  }

  public setMousePosition(position: PointData): void {
    this.mousePos.x = position.x;
    this.mousePos.y = position.y;
  }

  protected fire() {
    const dx = this.mousePos.x - this.x;
    const dy = this.mousePos.y - this.y;
    const angle = Math.atan2(dy, dx);

    const bullet = new Bullet(this.x, this.y, angle, colors.green);
    this.bullets.push(bullet);
    this.parent?.addChild(bullet);
  }

  private updateReticle() {
    const dx = this.mousePos.x - this.x;
    const dy = this.mousePos.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.atan2(dy, dx);
    const constrainedDist = Math.min(distance, this.RETICLE_RADIUS);

    this.reticle.x = Math.cos(angle) * constrainedDist;
    this.reticle.y = Math.sin(angle) * constrainedDist;
  }

  public update(ticker: Ticker, worldWidth: number, worldHeight: number, obstacles: Obstacle[], enemies: Enemy[]) {
    const dt = ticker.deltaTime;
    const oldX = this.x;
    const oldY = this.y;

    // Movement
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) this.x -= this.speed * dt;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) this.x += this.speed * dt;

    if (this.isCollidingWithObstacles(obstacles) || this.isCollidingWithCharacters(enemies)) {
      this.x = oldX;
    }

    if (this.keys["ArrowUp"] || this.keys["KeyW"]) this.y -= this.speed * dt;
    if (this.keys["ArrowDown"] || this.keys["KeyS"]) this.y += this.speed * dt;

    if (this.isCollidingWithObstacles(obstacles) || this.isCollidingWithCharacters(enemies)) {
      this.y = oldY;
    }

    this.keepInBounds(worldWidth, worldHeight);
    this.updateReticle();

    // Firing
    if (this.isFiring && Date.now() - this.lastFired > this.fireRate) {
      this.fire();
      this.lastFired = Date.now();
    }
  }
}
