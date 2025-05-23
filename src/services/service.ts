import * as Tone from "tone";
import Circle from "./circle";
import { norm, palette } from "./utils";
import Ball from "./ball";
import type { Note } from "@tonejs/midi/dist/Note";

export default class CanvasService {
  static readonly SPEED = 1;
  static readonly SPEED_MAX = 5;
  static readonly GRAVITY = CanvasService.SPEED / 75;
  static readonly LEN = 35;
  static readonly START_RADIUS = 100;
  static readonly SPACING = 10;
  static readonly BALL_RADIUS = 10;
  //radians
  static readonly ROTATION_SPEED = 0.001;

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private balls: Ball[];

  private rotation: number;
  private circles: Circle[];
  private notes: Note[];
  private currentNoteIndex: number;

  private _resume: boolean;

  playNote(note: Note) {
    //MembraneSynth
    // Synthé principal type "cordes épiques"
    const mainSynth = new Tone.MembraneSynth();

    // Effets cinéma
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 });

    // Chaîne audio
    mainSynth.chain(reverb, Tone.Destination);
    mainSynth.triggerAttackRelease(note.name, note.duration, Tone.now(), 0.5);
  }

  constructor(ballCount: number, canvas: HTMLCanvasElement, notes: Note[]) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d")!;

    this.balls = new Array(ballCount).fill(0).map((_, i) => {
      const x = canvas.width / 2;
      const y = canvas.height / 2 + (CanvasService.BALL_RADIUS * 2 + 10) * i;
      return new Ball(
        [x, y],
        [CanvasService.SPEED * Math.random(), CanvasService.SPEED],
        CanvasService.BALL_RADIUS,
        palette[i % palette.length],
        this.context
      );
    });

    this.rotation = 0; // Initial rotation angle

    this.circles = new Array(CanvasService.LEN).fill(0).map((_, i) => {
      const r = CanvasService.START_RADIUS + i * CanvasService.SPACING;
      const circle = new Circle(
        r,
        [canvas.width / 2, canvas.height / 2],
        this.context,
        i * 0.1,
        palette[i % palette.length]
      );

      circle.on("collision", () => {
        const note = this.notes[this.currentNoteIndex];
        if (note) {
          this.playNote(note);
          this.currentNoteIndex =
            (this.currentNoteIndex + 1) % this.notes.length;
        }
      });

      circle.on("destroy", () => {
        this.circles = this.circles.filter((c) => c.radius !== r);
      });

      return circle;
    });
    this.currentNoteIndex = 0;
    this.notes = notes;
    this._resume = false;
  }

  public pause() {
    this._resume = false;
  }
  public resume() {
    this._resume = true;
  }

  private drawGrid(): void {
    const gridSize = 50;

    for (let x = 0; x < this.canvas.width; x += gridSize) {
      const isCenter = x === this.canvas.width / 2;
      this.context.strokeStyle = isCenter ? "red" : "lightgray";
      this.context.lineWidth = isCenter ? 2 : 0.5;
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, this.canvas.height);
      this.context.stroke();
      this.context.closePath();
    }
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      const isCenter = y === this.canvas.width / 2;
      this.context.strokeStyle = isCenter ? "red" : "lightgray";
      this.context.lineWidth = isCenter ? 2 : 0.5;
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.canvas.width, y);
      this.context.stroke();
      this.context.closePath();
    }
  }

  private ajustPosition(ball: Ball) {
    const position = ball.getPosition();
    const r = this.circles[0];
    if (r) {
      const distance = norm(position, r.center) + ball.radius;
      if (distance > r.radius) {
        const angle = Math.atan2(
          position[1] - r.center[1],
          position[0] - r.center[0]
        );
        const newX = r.center[0] + Math.cos(angle) * (r.radius - ball.radius);
        const newY = r.center[1] + Math.sin(angle) * (r.radius - ball.radius);
        ball.setPosition([newX, newY]);
      }
    }

    for (const b of this.balls) {
      if (b === ball) continue;

      const distance = norm(position, b.getPosition());
      // Check if the balls are overlapping
      if (distance < ball.radius + b.radius) {
        // On calcule l'angle entre la balle b et la balle ball (direction de collision)
        const bPosition = b.getPosition();
        const angle = Math.atan2(
          position[1] - bPosition[1],
          position[0] - bPosition[0]
        );
        const newX = bPosition[0] + Math.cos(angle) * (ball.radius + b.radius);
        const newY = bPosition[1] + Math.sin(angle) * (ball.radius + b.radius);
        ball.setPosition([newX, newY]);
      }
    }
  }

  private draw(): void {
    for (const ball of this.balls) {
      const r = this.circles[0];
      const position = ball.getPosition();
      const velocity = ball.getVelocity();

      let dx = velocity[0];
      let dy = velocity[1];
      const x = position[0];
      const y = position[1];

      let action = "pass";
      if (r) {
        ({ dx, dy, action } = r.checkCollision(x, y, dx, dy, ball.radius));
      }

      if (x + ball.radius > this.canvas.width || x - ball.radius < 0) {
        dx = -dx; // Reverse horizontal direction
      }
      if (y + ball.radius > this.canvas.height || y - ball.radius < 0) {
        dy = -dy; // Reverse vertical direction
      }

      dy += CanvasService.GRAVITY;
      // Update position

      ball.setVelocity([dx, dy]);

      const collision = this.checkCollision(ball);
      if (collision) {
        this.collision(ball, collision);
      }

      if (action !== "pass") {
        this.ajustPosition(ball);
      }

      ball.move();
      ball.draw();

      this.rotation += CanvasService.ROTATION_SPEED; // Update rotation angle
    }
  }

  private checkCollision(ball: Ball) {
    for (const b of this.balls) {
      if (b === ball) continue;
      const distance = norm(ball.getPosition(), b.getPosition());
      if (distance < ball.radius + b.radius) {
        return b;
      }
    }

    return null;
  }

  private collision(ballA: Ball, ballB: Ball) {
    const pA = ballA.getPosition();
    const pB = ballB.getPosition();
    const vA = ballA.getVelocity();
    const vB = ballB.getVelocity();

    const dx = pA[0] - pB[0];
    const dy = pA[1] - pB[1];
    const dvx = vA[0] - vB[0];
    const dvy = vA[1] - vB[1];

    const dotProduct = dvx * dx + dvy * dy;
    const dist2 = dx * dx + dy * dy;

    if (dist2 === 0) {
      return { vA_: vA, vB_: vB }; // éviter division par 0
    }

    const factor = dotProduct / dist2;

    const correction = [factor * dx, factor * dy];
    ballA.setVelocity([vA[0] - correction[0], vA[1] - correction[1]]);
    ballB.setVelocity([vB[0] + correction[0], vB[1] + correction[1]]);
  }

  public startAnimation() {
    const animate = () => {
      if (!this._resume) {
        return requestAnimationFrame(animate);
      }
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid();
      this.circles.forEach((r) => {
        r.draw(this.rotation);
      });
      this.draw();
      requestAnimationFrame(animate);
    };
    // setInterval(() => {
    //   const animationId = animate();
    // }, 1000); // 60 FPS
    const animationId = animate();
  }
}
