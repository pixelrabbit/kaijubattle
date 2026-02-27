import { Rectangle } from "pixi.js";
import type { Character } from "./character";
import type { Obstacle } from "./buildings";

const GRID_SIZE = 40;

class Node {
  x: number;
  y: number;
  walkable: boolean;
  gCost = 0;
  hCost = 0;
  parent: Node | null = null;

  constructor(x: number, y: number, walkable: boolean) {
    this.x = x;
    this.y = y;
    this.walkable = walkable;
  }

  get fCost() {
    return this.gCost + this.hCost;
  }
}

class Grid {
  private nodes: Node[][];
  private gridWidth: number;
  private gridHeight: number;

  constructor(worldWidth: number, worldHeight: number, obstacles: Obstacle[], character: Character) {
    this.gridWidth = Math.ceil(worldWidth / GRID_SIZE);
    this.gridHeight = Math.ceil(worldHeight / GRID_SIZE);
    this.nodes = [];

    const charRadius = Math.max(character.width, character.height) / 2;

    for (let x = 0; x < this.gridWidth; x++) {
      this.nodes[x] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        const worldX = x * GRID_SIZE + GRID_SIZE / 2;
        const worldY = y * GRID_SIZE + GRID_SIZE / 2;
        let walkable = true;

        const nodeRect = new Rectangle(worldX - GRID_SIZE / 2, worldY - GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);

        for (const obstacle of obstacles) {
          const obstacleBounds = obstacle.getBounds().rectangle;
          // "Grow" the obstacle by the character's radius for collision checking
          const grownBounds = new Rectangle(
            obstacleBounds.x - charRadius,
            obstacleBounds.y - charRadius,
            obstacleBounds.width + charRadius * 2,
            obstacleBounds.height + charRadius * 2
          );

          if (grownBounds.intersects(nodeRect)) {
            walkable = false;
            break;
          }
        }
        this.nodes[x][y] = new Node(x, y, walkable);
      }
    }
  }

  public getNodeFromWorldPoint(worldX: number, worldY: number): Node | null {
    const x = Math.floor(worldX / GRID_SIZE);
    const y = Math.floor(worldY / GRID_SIZE);
    if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
      return this.nodes[x][y];
    }
    return null;
  }

  public getNeighbors(node: Node): Node[] {
    const neighbors: Node[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        if (x === 0 && y === 0) continue;

        const checkX = node.x + x;
        const checkY = node.y + y;

        if (checkX >= 0 && checkX < this.gridWidth && checkY >= 0 && checkY < this.gridHeight) {
          neighbors.push(this.nodes[checkX][checkY]);
        }
      }
    }
    return neighbors;
  }
}

function getDistance(nodeA: Node, nodeB: Node): number {
  const dstX = Math.abs(nodeA.x - nodeB.x);
  const dstY = Math.abs(nodeA.y - nodeB.y);
  if (dstX > dstY) return 14 * dstY + 10 * (dstX - dstY);
  return 14 * dstX + 10 * (dstY - dstX);
}

function retracePath(startNode: Node, endNode: Node): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  let currentNode: Node | null = endNode;

  while (currentNode && currentNode !== startNode) {
    path.push({
      x: currentNode.x * GRID_SIZE + GRID_SIZE / 2,
      y: currentNode.y * GRID_SIZE + GRID_SIZE / 2,
    });
    currentNode = currentNode.parent;
  }
  path.reverse();
  return path;
}

export function findPath(
  worldWidth: number,
  worldHeight: number,
  obstacles: Obstacle[],
  startPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  character: Character
): { x: number; y: number }[] | null {
  const grid = new Grid(worldWidth, worldHeight, obstacles, character);
  const startNode = grid.getNodeFromWorldPoint(startPos.x, startPos.y);
  const targetNode = grid.getNodeFromWorldPoint(targetPos.x, targetPos.y);

  if (!startNode || !targetNode || !targetNode.walkable) {
    return null;
  }

  const openSet: Node[] = [startNode];
  const closedSet = new Set<Node>();

  while (openSet.length > 0) {
    let currentNode = openSet[0];
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].fCost < currentNode.fCost || (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)) {
        currentNode = openSet[i];
      }
    }

    openSet.splice(openSet.indexOf(currentNode), 1);
    closedSet.add(currentNode);

    if (currentNode === targetNode) {
      return retracePath(startNode, targetNode);
    }

    for (const neighbor of grid.getNeighbors(currentNode)) {
      if (!neighbor.walkable || closedSet.has(neighbor)) {
        continue;
      }

      const newMovementCostToNeighbor = currentNode.gCost + getDistance(currentNode, neighbor);
      if (newMovementCostToNeighbor < neighbor.gCost || !openSet.includes(neighbor)) {
        neighbor.gCost = newMovementCostToNeighbor;
        neighbor.hCost = getDistance(neighbor, targetNode);
        neighbor.parent = currentNode;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null; // No path found
}