import type { PlanetNode } from './simulation';

/**
 * Represents a 3D vector.
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface GradientStop {
    id: string;
    position: number; // 0 to 1
    color: string; // Hex
    bias?: number; // 0.0 to 1.0, default 0.5
    interpolation?: 'linear' | 'step' | 'smooth' | 'cubic';
}

/**
 * Holds all necessary information to display and position the color picker UI.
 */
export interface ColorPickerInfo {
  target:
    | { type: 'connection'; index: number }
    | { type: 'planet'; id: number }
    | { type: 'background'; key: 'backgroundColor1' | 'backgroundColor2' | 'webGLStarColor' | 'orbitColor' | 'labelColor' | 'lineColorMinDist' | 'lineColorMaxDist' }
    | { type: 'brush' }
    | { type: 'gradientStop'; stopId: string }
    | { type: 'soundNodeDisplay'; nodeId: string };
  x: number;
  y: number;
  initialColor: string;
  sourceBounds?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Holds information to display a tooltip at a specific screen coordinate.
 */
export interface TooltipInfo {
  x: number;
  y: number;
  content: string;
}

/**
 * Holds information to draw the animated line while creating a sound graph connection.
 */
export interface ConnectionLineInfo {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  status: 'drawing' | 'success' | 'fail';
  fromTargetId?: string;
  toTargetId?: string;
}

/**
 * Holds information for the success animation when a connection is made on the main canvas.
 */
export interface ConnectionSuccessAnimation {
    fromScreenPos: { x: number; y: number };
    toScreenPos: { x: number; y: number };
    color: string;
    startTime: number;
}

/**
 * Holds information for drawing the "noodle" line when creating a connection from the UI panels.
 */
export interface PlanetConnectionDragInfo {
  fromNodeId: number;
  fromNodeColor: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  mode: 'drag' | 'click';
}