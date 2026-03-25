
import type { AppState } from '../../types';
import { interactionState } from '../../store/interactionState';
import { getGizmoPaths, getGizmoButtons } from './gizmoGeometry';

// Colors for axes (matching standard 3D tools)
const COLORS = {
    x: '#FF5252', // Red
    y: '#4CAF50', // Green
    z: '#448AFF'  // Blue
};

export const drawGizmo = (ctx: CanvasRenderingContext2D, state: AppState) => {
    if (!state.pivotPoint || !state.showPivot) return;

    // Get current interaction state
    const { activeAxis, hoveredAxis } = interactionState.gizmo;
    
    // Generate paths
    const axisToHighlight = activeAxis || hoveredAxis;
    const paths = getGizmoPaths(state, ctx.canvas, axisToHighlight);

    // Draw Axes
    paths.forEach(path => {
        const isHighlighted = path.axis === axisToHighlight;
        const isDimmed = axisToHighlight !== null && !isHighlighted;
        
        ctx.beginPath();
        
        // Start
        if (!path.points[0].behind) {
             ctx.moveTo(path.points[0].x, path.points[0].y);
        }
        
        for (let i = 1; i < path.points.length; i++) {
            const p = path.points[i];
            if (!p.behind) {
                if (path.points[i-1].behind) {
                    ctx.moveTo(p.x, p.y);
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
        }

        ctx.lineWidth = isHighlighted ? 4 : 2;
        const baseColor = COLORS[path.axis];
        
        if (isHighlighted) {
            ctx.strokeStyle = '#FFFFFF'; // Highlight color
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 10;
        } else {
            ctx.strokeStyle = baseColor;
            ctx.globalAlpha = isDimmed ? 0.3 : 0.8;
            ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset alpha
        ctx.shadowBlur = 0;
        
        // Re-draw colored stroke on top of highlight for "core" color
        if (isHighlighted) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = baseColor;
            ctx.stroke();
        }
    });
    
    // Draw UI Buttons (Close / Hide)
    const mouseX = state.canvasHoverState ? state.canvasHoverState.mouseX : -1;
    const mouseY = state.canvasHoverState ? state.canvasHoverState.mouseY : -1;
    
    const buttons = getGizmoButtons(state, ctx.canvas, mouseX, mouseY);

    if (buttons) {
        // Draw Close (Trash Can)
        drawButton(ctx, buttons.close.x, buttons.close.y, buttons.close.hovered, 'close');
        // Draw Hide (Eye)
        drawButton(ctx, buttons.hide.x, buttons.hide.y, buttons.hide.hovered, 'hide');
    }
};

function drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, hovered: boolean, type: 'close' | 'hide') {
    const radius = 12;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = hovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();
    
    // Icon
    ctx.beginPath();
    ctx.strokeStyle = hovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (type === 'close') {
        // Trash Can Icon
        const binW = 10;
        const binH = 10;
        const lidW = 14;
        
        // Lid Line
        ctx.moveTo(x - lidW/2, y - binH/2);
        ctx.lineTo(x + lidW/2, y - binH/2);
        
        // Handle
        ctx.moveTo(x - 2, y - binH/2);
        ctx.lineTo(x - 2, y - binH/2 - 2);
        ctx.lineTo(x + 2, y - binH/2 - 2);
        ctx.lineTo(x + 2, y - binH/2);
        
        // Bin Body (tapered slightly)
        ctx.moveTo(x - binW/2 + 1, y - binH/2);
        ctx.lineTo(x - binW/2 + 2, y + binH/2 + 1);
        ctx.lineTo(x + binW/2 - 2, y + binH/2 + 1);
        ctx.lineTo(x + binW/2 - 1, y - binH/2);
        
        // Vertical slats
        ctx.moveTo(x - 1.5, y - binH/2 + 2);
        ctx.lineTo(x - 1, y + binH/2 - 2);
        
        ctx.moveTo(x + 1.5, y - binH/2 + 2);
        ctx.lineTo(x + 1, y + binH/2 - 2);

    } else {
        // Eye Icon
        ctx.lineWidth = 2;
        ctx.moveTo(x - 6, y);
        ctx.quadraticCurveTo(x, y - 4, x + 6, y);
        ctx.quadraticCurveTo(x, y + 4, x - 6, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = hovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
    }
    ctx.stroke();
}
