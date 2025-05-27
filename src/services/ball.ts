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
    //todo ajouter une traine et une ombre et un dégradé
    //todo pour le debug ajouter une visualisation du vecteur vélocité
    this.context.beginPath();
    const gradient = this.context.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, this.color); // centre violet vif
    gradient.addColorStop(1, `color-mix(in oklch, ${this.color}, white 50%) `); // transparent vers l’extérieur

    this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.context.fillStyle = gradient;

    this.context.fillStyle = gradient; // Utiliser le dégradé pour le remplissage

    this.context.fill();
    this.context.closePath();

    //vecteur vélocité
    if (CanvasService.DEBUG) {
      this.context.beginPath();
      this.context.moveTo(this.x, this.y);
      this.context.lineTo(this.x + this.dx * 10, this.y + this.dy * 10);
      this.context.strokeStyle = "red";
      this.context.lineWidth = 1;
      this.context.stroke();
      this.context.closePath();
    }
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
