import { Container, Graphics } from "pixi.js";
import { colors } from "./variables";

export class Obstacle extends Container {
  constructor(w: number, h: number, color: number) {
    super();

    const body = new Graphics().rect(0, 0, w, h).fill({ color });
    this.addChild(body);
  }
}

export class Homebase extends Obstacle {
  // private background: Graphics;
  private segments: Graphics[] = [];
  private readonly barWidth = 20;
  private readonly barHeight = 80;
  private readonly segmentSpacing = 4;
  private health = 4;

  constructor() {
    super(240, 240, colors.green);

    // Vertical bar background (the track)
    const barTrack = new Graphics()
      .rect(
        (100 - this.barWidth) / 2,
        (100 - this.barHeight) / 2,
        this.barWidth,
        this.barHeight
      )
      .fill({ color: 0x333333 });
    this.addChild(barTrack);

    // Create 4 segments
    const totalSpacing = this.segmentSpacing * 3;
    const segmentHeight = (this.barHeight - totalSpacing) / 4;
    const startX = (100 - this.barWidth) / 2;
    const startY = (100 - this.barHeight) / 2;

    for (let i = 0; i < 4; i++) {
      const segment = new Graphics()
        .rect(
          startX,
          startY + (segmentHeight + this.segmentSpacing) * (3 - i), // Draw from bottom up
          this.barWidth,
          segmentHeight
        )
        .fill({ color: colors.red });

      this.segments.push(segment);
      this.addChild(segment);
    }
  }

  /**
   * Update health display
   * @param health Value between 0 and 4
   */
  public setHealth(health: number): void {
    this.health = Math.max(0, health);
    this.segments.forEach((segment, index) => {
      segment.visible = index < this.health;
    });
  }

  public takeDamage(amount: number): void {
    this.setHealth(this.health - amount);
  }
}
