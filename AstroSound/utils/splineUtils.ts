
export function createSplinePath(start: {x: number, y: number}, points: {x: number, y: number}[], end: {x: number, y: number}): string {
    const allPoints = [start, ...points, end];
    if (allPoints.length < 2) return '';

    let path = `M ${allPoints[0].x} ${allPoints[0].y}`;
    if (allPoints.length === 2) {
        // Simple Bezier for a straight line with some curve
        const dx = allPoints[1].x - allPoints[0].x;
        const controlPointOffset = Math.max(30, Math.abs(dx) * 0.4);
        path += ` C ${allPoints[0].x + controlPointOffset} ${allPoints[0].y}, ${allPoints[1].x - controlPointOffset} ${allPoints[1].y}, ${allPoints[1].x} ${allPoints[1].y}`;
        return path;
    }

    // Catmull-Rom spline generation
    for (let i = 0; i < allPoints.length - 1; i++) {
        const p0 = i > 0 ? allPoints[i - 1] : allPoints[i];
        const p1 = allPoints[i];
        const p2 = allPoints[i + 1];
        const p3 = i < allPoints.length - 2 ? allPoints[i + 2] : p2;

        const tension = 0.5;
        const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
        const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
        const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
        const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

        path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }

    return path;
}
