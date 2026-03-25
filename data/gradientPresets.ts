
import type { GradientStop } from '../types';

export interface GradientPreset {
    name: string;
    stops: GradientStop[];
}

export const GRADIENT_PRESETS: GradientPreset[] = [
    {
        name: "Default",
        stops: [
            { id: "1", position: 0, color: "#4ECDC4", bias: 0.5, interpolation: "linear" },
            { id: "2", position: 1, color: "#C34A36", bias: 0.5, interpolation: "linear" }
        ]
    },
    {
        name: "Thermal",
        stops: [
            { id: "t1", position: 0.0, color: "#000000", bias: 0.5, interpolation: "smooth" },
            { id: "t2", position: 0.33, color: "#5F00FF", bias: 0.5, interpolation: "smooth" },
            { id: "t3", position: 0.66, color: "#FF0000", bias: 0.5, interpolation: "smooth" },
            { id: "t4", position: 1.0, color: "#FFFF00", bias: 0.5, interpolation: "smooth" }
        ]
    },
    {
        name: "Synthwave",
        stops: [
            { id: "s1", position: 0.0, color: "#241734", bias: 0.5, interpolation: "linear" },
            { id: "s2", position: 0.5, color: "#FF2A6D", bias: 0.5, interpolation: "linear" },
            { id: "s3", position: 1.0, color: "#05D9E8", bias: 0.5, interpolation: "linear" }
        ]
    },
    {
        name: "Deep Ocean",
        stops: [
            { id: "d1", position: 0.0, color: "#000000", bias: 0.6, interpolation: "smooth" },
            { id: "d2", position: 0.4, color: "#023E8A", bias: 0.5, interpolation: "smooth" },
            { id: "d3", position: 0.8, color: "#00B4D8", bias: 0.5, interpolation: "smooth" },
            { id: "d4", position: 1.0, color: "#90E0EF", bias: 0.5, interpolation: "smooth" }
        ]
    },
    {
        name: "Golden Hour",
        stops: [
            { id: "g1", position: 0.0, color: "#422040", bias: 0.5, interpolation: "linear" },
            { id: "g2", position: 0.4, color: "#E57C04", bias: 0.5, interpolation: "linear" },
            { id: "g3", position: 0.8, color: "#F6C90E", bias: 0.5, interpolation: "linear" },
            { id: "g4", position: 1.0, color: "#F8F3D4", bias: 0.5, interpolation: "linear" }
        ]
    },
    {
        name: "Grayscale",
        stops: [
            { id: "gs1", position: 0.0, color: "#000000", bias: 0.5, interpolation: "linear" },
            { id: "gs2", position: 1.0, color: "#FFFFFF", bias: 0.5, interpolation: "linear" }
        ]
    },
     {
        name: "Rainbow",
        stops: [
            { id: "r1", position: 0.0, color: "#FF0000", bias: 0.5, interpolation: "linear" },
            { id: "r2", position: 0.17, color: "#FFFF00", bias: 0.5, interpolation: "linear" },
            { id: "r3", position: 0.33, color: "#00FF00", bias: 0.5, interpolation: "linear" },
            { id: "r4", position: 0.5, color: "#00FFFF", bias: 0.5, interpolation: "linear" },
            { id: "r5", position: 0.67, color: "#0000FF", bias: 0.5, interpolation: "linear" },
            { id: "r6", position: 0.83, color: "#FF00FF", bias: 0.5, interpolation: "linear" },
            { id: "r7", position: 1.0, color: "#FF0000", bias: 0.5, interpolation: "linear" }
        ]
    }
];
