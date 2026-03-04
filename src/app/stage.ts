import { Assets, Container, Ticker, FederatedPointerEvent, Rectangle, TilingSprite } from "pixi.js";
import { Player } from "./player";
import { Minimap } from "./hud";
import { Kaiju } from "./kaiju";
import { Enemy } from "./enemy";
import { Homebase, Obstacle } from "./buildings";

// interface ObstacleData {
//   x: number;
//   y: number;
//   w: number;
//   h: number;
// }

export class GameStage extends Container {
  // The '!' is a definite assignment assertion. It tells TypeScript that 'player'
  // will be assigned a value later (in setup()), even though it's not in the constructor.
  private player!: Player;
  private enemies: Enemy[] = [];
  private readonly enemiesNumber = 0;
  // private hud: HUD;
  private minimap: Minimap;
  private readonly screenWidth: number;
  private readonly screenHeight: number;
  private readonly worldWidth = 2400;
  private readonly worldHeight = 2400;
  private world: Container;
  private kaiju: Kaiju | null = null;
  private timeSinceStart = 0;
  // private kaijuSpawned = false;
  private homebase!: Homebase;

  constructor(screenWidth: number, screenHeight: number) {
    super();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.world = new Container();

    this.addChild(this.world);

    // this.hud = new HUD();
    // this.addChild(this.hud);

    this.minimap = new Minimap(this.worldWidth, this.worldHeight, this.screenWidth, this.screenHeight);
    this.addChild(this.minimap);

    // Make stage interactive to capture mouse events across the whole screen
    this.eventMode = "static";
    this.hitArea = new Rectangle(0, 0, screenWidth, screenHeight);
    this.on("pointermove", this.onPointerMove, this);
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    if (this.player) {
      // Convert screen coordinates to world coordinates
      const worldPoint = this.world.toLocal(event.global);
      this.player.setMousePosition(worldPoint);
    }
  }

  public async setup(): Promise<void> {
    const grassTexture = await Assets.load("assets/bg1.png");
    const background = new TilingSprite({
      texture: grassTexture,
      width: this.worldWidth,
      height: this.worldHeight,
    });
    this.world.addChild(background);

    // this.createWaterArea();

    // Load the bunny player
    const texture = await Assets.load("https://pixijs.com/assets/bunny.png");
    this.player = new Player(texture);

    // PLAYER
    this.player.x = this.worldWidth / 2;
    this.player.y = this.worldHeight / 2;
    this.world.addChild(this.player);

    // const obstacleData = [
    //   { x: 200, y: 200, w: 100, h: 100 },
    //   { x: 800, y: 150, w: 50, h: 300 },
    //   { x: 500, y: 500, w: 200, h: 40 },
    //   { x: 900, y: 600, w: 120, h: 120 },
    // ];
    // this.createObstacles(obstacleData);

    this.minimap.setObstacles(this.obstacles);

    // BASE
    this.homebase = new Homebase();
    this.homebase.x = 120;
    this.homebase.y = 120;
    this.world.addChild(this.homebase);
    this.minimap.setHomebase(this.homebase);
    this.obstacles.push(this.homebase);


    // ENEMIES
    for (let i = 0; i < this.enemiesNumber; i++) {
      const enemy = new Enemy(texture, this.player);

      // Find a valid spawn position
      do {
        enemy.x = Math.random() * this.worldWidth;
        enemy.y = Math.random() * this.worldHeight;
      } while (enemy.isCollidingWithObstacles(this.obstacles));

      this.enemies.push(enemy);
      this.world.addChild(enemy);
    }

    // KAIJU
    const kaijuTexture = await Assets.load("assets/kaiju.png");
    this.kaiju = new Kaiju(kaijuTexture, this.player, this.homebase);

    // Position on the right side of the stage
    this.kaiju.x = this.worldWidth - 100;
    this.kaiju.y = this.worldHeight / 2;

    this.enemies.push(this.kaiju);
    this.world.addChild(this.kaiju);
  }


  //   const water = new Graphics();
  //   const waterStartX = this.worldWidth * 0.9;
  //   const amplitude1 = 40;
  //   const frequency1 = 150;
  //   const amplitude2 = 20;
  //   const frequency2 = 70;
  //   const segmentLength = 20;

  //   water.moveTo(waterStartX, -10); // Start slightly off-screen

  //   // Generate the wavy boundary using a combination of sine waves for a more natural look
  //   for (let y = 0; y <= this.worldHeight + 10; y += segmentLength) {
  //     const randomFactor = (Math.random() - 0.5) * 25;
  //     const sin1 = Math.sin(y / frequency1) * amplitude1;
  //     const sin2 = Math.sin(y / frequency2) * amplitude2;
  //     const x = waterStartX + sin1 + sin2 + randomFactor;
  //     water.lineTo(x, y);
  //   }

  //   // Close the shape to the right
  //   water.lineTo(this.worldWidth + 10, this.worldHeight + 10);
  //   water.lineTo(this.worldWidth + 10, -10);
  //   water.closePath();

  //   // Fill with a water-like color
  //   water.fill({ color: 0x33a1de, alpha: 0.85 });

  //   this.world.addChildAt(water, 1); // Add it after the background

  //   // Add water representation to minimap
  //   const waterMinimap = new Graphics()
  //     .rect(
  //       waterStartX * this.minimap.minimapScale,
  //       0,
  //       (this.worldWidth - waterStartX) * this.minimap.minimapScale,
  //       this.worldHeight * this.minimap.minimapScale
  //     )
  //     .fill({ color: 0x33a1de, alpha: 0.5 });
  //   this.minimap.addChildAt(waterMinimap, 1); // Add behind player/camera but above background

  // }

  // OBSTACLES
  private obstacles: Obstacle[] = [];
  // private createObstacles(obstacleData: ObstacleData[]): void {
  //   obstacleData.forEach((data: ObstacleData) => {
  //     const obstacle = new Obstacle(data.w, data.h, 0x333333);
  //     obstacle.x = data.x;
  //     obstacle.y = data.y;

  //     this.obstacles.push(obstacle);
  //     this.world.addChild(obstacle);
  //   });
  // }

  private handleCollisions(dt: number): void {
    if (!this.player) return;

    // bullets vs enemy
    for (let i = this.player.bullets.length - 1; i >= 0; i--) {
      const bullet = this.player.bullets[i];
      bullet.update(dt);

      let hitEnemy = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (bullet.isCollidingWithCharacter(enemy)) {
          hitEnemy = true;
          enemy.takeDamage(1);
          if (enemy.isDead()) {
            this.removeChild(enemy);
            this.enemies.splice(j, 1);
          }
          break; // Bullet hits one enemy
        }
      }

      if (hitEnemy || bullet.isOutOfBounds(this.worldWidth, this.worldHeight) || bullet.isColliding(this.obstacles)) {
        this.world.removeChild(bullet);
        this.player.bullets.splice(i, 1);
      }
    }

    // bullets vs player
    for (const enemy of this.enemies) {
      for (let i = enemy.bullets.length - 1; i >= 0; i--) {
        const bullet = enemy.bullets[i];
        bullet.update(dt);

        let hitPlayer = false;
        if (this.player && !this.player.isDead() && bullet.isCollidingWithCharacter(this.player)) {
          hitPlayer = true;
          this.player.takeDamage(1);
          if (this.player.isDead()) {
            this.removeChild(this.player);
            this.player = null!;
            // TODO: game over
          }
        }

        if (
          hitPlayer ||
          bullet.isOutOfBounds(this.worldWidth, this.worldHeight) ||
          bullet.isColliding(this.obstacles)
        ) {
          this.world.removeChild(bullet);
          enemy.bullets.splice(i, 1);
        }
      }
    }
  }

  public update(ticker: Ticker): void {
    this.timeSinceStart += ticker.deltaMS;

    // if (!this.kaijuSpawned && this.timeSinceStart > 10) {
    //   this.createKaiju();
    //   this.kaijuSpawned = true;
    // }

    this.player?.update(ticker, this.worldWidth, this.worldHeight, this.obstacles, this.enemies); // The '?' handles if player is null
    this.enemies.forEach((enemy) => {
      enemy.update(ticker, this.worldWidth, this.worldHeight, this.obstacles);
    });

    this.handleCollisions(ticker.deltaTime);

    // Camera follow logic
    if (this.player) {
      this.world.x = this.screenWidth / 2 - this.player.x;
      this.world.y = this.screenHeight / 2 - this.player.y;

      // Clamp camera to world boundaries
      this.world.x = Math.max(Math.min(this.world.x, 0), this.screenWidth - this.worldWidth);
      this.world.y = Math.max(Math.min(this.world.y, 0), this.screenHeight - this.worldHeight);
    }

    // Update HUD
    this.minimap.update(this.player, this.world, this.enemies);
  }
}
