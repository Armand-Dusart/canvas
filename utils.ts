export function dotProd(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function norm(a: [number, number], b: [number, number]): number {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

export const palette = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#FF33D4",
  "#33FFD4",
  "#D4FF33",
  "#D433FF",
  "#FF8C33",
  "#33FF8C",
  "#8C33FF",
  "#FF338C",
  "#FF8C33",
  "#33FF8C",
  "#8C33FF",
  "#FF338C",
];
