
/**
 * Calculates the squared distance between two 2D points.
 * Faster than `dist` because it avoids a square root.
 * @param v The first point {x, y}.
 * @param w The second point {x, y}.
 * @returns The squared distance.
 */
const distSq = (v: {x:number,y:number}, w: {x:number,y:number}): number => {
    return (v.x - w.x)**2 + (v.y - w.y)**2;
}

/**
 * Calculates the squared shortest distance from a point `p` to a line segment `vw`.
 * @param p The point {x, y}.
 * @param v The start of the line segment {x, y}.
 * @param w The end of the line segment {x, y}.
 * @returns The squared distance from the point to the segment.
 */
export const distToSegmentSq = (p: {x:number,y:number}, v: {x:number,y:number}, w: {x:number,y:number}): number => {
  const l2 = distSq(v, w);
  if (l2 === 0) return distSq(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distSq(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};
