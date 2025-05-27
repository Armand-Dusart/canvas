import CanvasService from "./service";
import { dotProd, norm } from "./utils";

export default class Circle {
  startAngle: number;
  endAngle: number;
  radius: number;
  center: [number, number];
  rotation: number;
  offset: number;
  color: string;
  context: CanvasRenderingContext2D;

  listerners: Map<string, Set<() => void>>;

  constructor(
    radius: number,
    center: [number, number],
    context: CanvasRenderingContext2D,
    offset: number,
    color: string
  ) {
    this.startAngle = 0;
    this.endAngle = 0;
    this.radius = radius;
    this.center = center;
    this.rotation = 0;
    this.context = context;
    this.offset = offset;
    this.listerners = new Map<string, Set<() => void>>();
    this.color = color;
  }

  on(event: "destroy" | "collision", callback: () => void) {
    if (!this.listerners.has(event)) {
      this.listerners.set(event, new Set());
    }
    this.listerners.get(event)!.add(callback);
  }

  draw(rotation: number) {
    const hole = -Math.PI / (2 + this.radius / 75);
    const offset = rotation + this.offset;
    this.rotation = offset;

    const startAngle = -hole / 2 + offset;
    const endAngle = hole / 2 + offset + Math.PI * 2;

    this.startAngle = startAngle;
    this.endAngle = endAngle;

    this.context.beginPath();
    this.context.arc(
      this.center[0],
      this.center[1],
      this.radius,
      startAngle,
      endAngle
    );
    this.context.strokeStyle = this.color;
    this.context.lineWidth = 3;
    this.context.stroke();
    this.context.closePath();

    if (CanvasService.DEBUG) {
      const { a, b } = this.getAndB();
      this.context.beginPath();
      this.context.arc(a[0], a[1], 4, 0, Math.PI * 2);
      this.context.fillStyle = "green";
      this.context.fill();
      this.context.closePath();
      this.context.beginPath();
      this.context.arc(b[0], b[1], 4, 0, Math.PI * 2);
      this.context.fillStyle = "green";
      this.context.fill();
      this.context.closePath();

      const { vA, vB } = this.getVelocities();
      const m = 5;
      this.context.beginPath();
      this.context.moveTo(a[0], a[1]);
      this.context.lineTo(a[0] + vA[0] * m, a[1] + vA[1] * m);
      this.context.strokeStyle = "red";
      this.context.lineWidth = 1;
      this.context.stroke();
      this.context.closePath();

      this.context.beginPath();
      this.context.moveTo(b[0], b[1]);
      this.context.lineTo(b[0] + vB[0] * m, b[1] + vB[1] * m);
      this.context.strokeStyle = "red";
      this.context.lineWidth = 1;
      this.context.stroke();
      this.context.closePath();
    }
  }

  collision(x: number, y: number, dx: number, dy: number) {
    //vecteur normal entre le centre et le point
    const normal = norm([x, y], this.center);
    //vecteur normalisé
    const n: [number, number] = [
      (x - this.center[0]) / normal,
      (y - this.center[1]) / normal,
    ];
    //vélocité courante
    const v: [number, number] = [dx, dy];
    //V  = Vt + Vn
    //V' = Vt - Vn
    //Vt = V - Vn
    //V' = V - 2 * Vn
    const dot = dotProd(v, n);
    //Vn = V.n * n
    const vN: [number, number] = [dot * n[0], dot * n[1]];
    //V' = V - 2 * Vn
    const vNew = [dx - 2 * vN[0], dy - 2 * vN[1]];
    // histoire de faire rebondir plus vite en fonction de la taille du cercle
    const maxRadius =
      CanvasService.START_RADIUS + CanvasService.LEN * CanvasService.SPACING;
    const multiplier = 1 + (this.radius / maxRadius) * 0.1;
    return { dx: vNew[0] * multiplier, dy: vNew[1] * multiplier };
  }

  private getAndB() {
    const a: [number, number] = [
      this.center[0] + this.radius * Math.cos(this.startAngle),
      this.center[1] + this.radius * Math.sin(this.startAngle),
    ];
    const b: [number, number] = [
      this.center[0] + this.radius * Math.cos(this.endAngle),
      this.center[1] + this.radius * Math.sin(this.endAngle),
    ];

    return {
      a,
      b,
    };
  }

  private getVelocities() {
    /*
      Le vecteur vitesse d'un mouvement circulaire est tangent au cercle de la trajectoire, donc perpendiculaire au rayon OM durant tout le mouvement.
      Le mouvement étant uniforme, le vecteur vitesse est constant en norme.
      **/
    const { a, b } = this.getAndB();
    //velocité tangentielle de A
    const speed = this.getSpeed();

    // Fonction pour calculer un vecteur vitesse tangent
    const velocity = ([x, y]: number[]): [number, number] => {
      // Vecteur position du point par rapport au centre
      const dx = x - this.center[0];
      const dy = y - this.center[1];
      const norm = Math.sqrt(dx * dx + dy * dy);
      if (norm === 0) return [0, 0]; // Éviter la division par zéro
      // Vecteur unitaire
      const unitX = dx / norm;
      const unitY = dy / norm;
      // Vecteur tangent (perpendiculaire)
      const tangentX = -unitY; // Inverser les coordonnées pour obtenir la tangente
      const tangentY = unitX;
      // Vecteur vitesse
      return [tangentX * speed, tangentY * speed];
    };

    return {
      vA: velocity(a),
      vB: velocity(b),
    };
  }

  getSpeed() {
    return this.radius * CanvasService.ROTATION_SPEED;
  }

  deviate(x: number, y: number, dx: number, dy: number) {
    //todo probleme lorsque la balle roule sur le cercle
    const { a, b } = this.getAndB();
    const ball: [number, number] = [x, y];
    const dA = norm(a, ball);
    const dB = norm(b, ball);
    const isColisionWithA = dA < dB;
    const point = isColisionWithA ? a : b;
    const vPoint = isColisionWithA
      ? this.getVelocities().vA
      : this.getVelocities().vB;

    // Direction entre point (A ou B) et la balle
    const nx = ball[0] - point[0];
    const ny = ball[1] - point[1];
    const nNorm = nx * nx + ny * ny;
    if (nNorm === 0) return { dx, dy }; // éviter division par zéro

    // Vecteur vitesse relative
    const rvx = dx - vPoint[0];
    const rvy = dy - vPoint[1];

    // Projection de la vitesse relative sur l'axe de collision
    const dot = rvx * nx + rvy * ny;
    const factor = dot / nNorm;

    // Correction tangentielle (rebond élastique simple)
    const correctionX = factor * nx;
    const correctionY = factor * ny;

    return {
      dx: dx - correctionX,
      dy: dy - correctionY,
    };
  }

  action(
    x: number,
    y: number,
    r: number
  ): "pass" | "destroy" | "collision" | "deviate" {
    const ball: [number, number] = [x, y];
    const { a, b } = this.getAndB();
    const d = norm(ball, this.center);

    // la balle à entierement passé le cercle
    const passCircle = d >= this.radius;
    if (passCircle) {
      return "destroy";
    }
    const distanceAC = norm(a, ball);
    const distanceBC = norm(b, ball);

    if (distanceAC <= r || distanceBC <= r) {
      return "deviate";
    }

    const distanceAB = norm(a, b);
    //todo faire avec l'angle
    if (distanceAB > distanceAC && distanceAB > distanceBC) {
      return "pass";
    }

    return "collision";
  }

  checkCollision(
    x: number,
    y: number,
    dx: number,
    dy: number,
    r: number
  ): { dy: number; dx: number; action: string } {
    const d = norm([x, y], this.center) + r;

    if (d >= this.radius) {
      const action = this.action(x, y, r);
      switch (action) {
        case "pass":
          return { dx: dx, dy: dy, action: "pass" };
        case "destroy":
          this.listerners.get("destroy")?.forEach((callback) => callback());
          return { dx: dx, dy: dy, action: "destroy" };
        case "collision":
          this.listerners.get("collision")?.forEach((callback) => callback());
          return { ...this.collision(x, y, dx, dy), action: "collision" };
        case "deviate":
          this.listerners.get("collision")?.forEach((callback) => callback());
          return { ...this.deviate(x, y, dx, dy), action: "deviate" };
      }
    }
    return { dx: dx, dy: dy, action: "pass" };
  }
}
