import CanvasService from "./service";

export default class Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  context: CanvasRenderingContext2D;

  constructor(
    positon: [number, number],
    velocity: [number, number],
    radius: number,
    color: string,
    context: CanvasRenderingContext2D
  ) {
    this.x = positon[0];
    this.y = positon[1];
    this.dx = velocity[0];
    this.dy = velocity[1];
    this.radius = radius;
    this.color = color;
    this.context = context;
  }

  move() {
    this.x += this.dx;
    this.y += this.dy;
  }

  draw() {
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.context.fillStyle = this.color;
    this.context.fill();
    this.context.closePath();
  }

  getPosition() {
    return [this.x, this.y] as [number, number];
  }
  getVelocity() {
    return [this.dx, this.dy] as [number, number];
  }
  setPosition(position: [number, number]) {
    this.x = position[0];
    this.y = position[1];
  }
  setVelocity(velocity: [number, number]) {
    let dx = velocity[0];
    let dy = velocity[1];
    if (Math.abs(dx) > CanvasService.SPEED_MAX) {
      dx = Math.sign(dx) * CanvasService.SPEED_MAX;
    }
    if (Math.abs(dy) > CanvasService.SPEED_MAX) {
      dy = Math.sign(dy) * CanvasService.SPEED_MAX;
    }
    this.dx = dx;
    this.dy = dy;
  }
}
