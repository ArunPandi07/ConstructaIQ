import * as THREE from "three";
import type { OpeningDefinition, Point2D, RoomDefinition, WallDefinition } from "../../types/building";

export interface WallTransform {
  length: number;
  angle: number;
  center: [number, number, number];
}

export function wallLength(wall: WallDefinition): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

export function wallTransform(wall: WallDefinition, elevation: number, height: number): WallTransform {
  const length = wallLength(wall);
  return {
    length,
    angle: -Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x),
    center: [
      (wall.start.x + wall.end.x) / 2,
      elevation + height / 2,
      (wall.start.y + wall.end.y) / 2,
    ],
  };
}

export function openingPosition(
  wall: WallDefinition,
  opening: OpeningDefinition,
  elevation: number,
  outward = 0.18,
): [number, number, number] {
  const length = wallLength(wall) || 1;
  const ux = (wall.end.x - wall.start.x) / length;
  const uy = (wall.end.y - wall.start.y) / length;
  const nx = -uy;
  const ny = ux;
  const along = opening.offset_m + opening.width_m / 2;
  return [
    wall.start.x + ux * along + nx * outward,
    elevation + opening.sill_m + opening.height_m / 2,
    wall.start.y + uy * along + ny * outward,
  ];
}

export function wallAngle(wall: WallDefinition): number {
  return -Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
}

export function roomCentroid(room: RoomDefinition): [number, number] {
  if (room.polygon.length === 0) return [0, 0];
  const total = room.polygon.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return [total.x / room.polygon.length, total.y / room.polygon.length];
}

export function polygonShape(points: Point2D[]): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  shape.closePath();
  return shape;
}

export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
}
