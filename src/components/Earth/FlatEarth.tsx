import { useMemo } from 'react';
import * as THREE from 'three';

export function FlatEarth() {
    // Generate a procedural cyber-grid map texture using HTML Canvas
    // This entirely avoids CORS issues and network reliability problems
    const mapTex = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Background (Deep Space Blue)
            ctx.fillStyle = '#000814';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid lines
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.lineWidth = 2;

            // Simple Equirectangular Grid
            // Longitude (36 segments, 10 degrees each)
            for (let x = 0; x <= canvas.width; x += canvas.width / 36) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            // Latitude (18 segments, 10 degrees each)
            for (let y = 0; y <= canvas.height; y += canvas.height / 18) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Equator and Prime Meridian (highlighted)
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.lineWidth = 4;
            // Equator
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
            // Prime Meridian
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();

            // Add decorative "data points" scattered to mimic continents or network clusters
            ctx.fillStyle = 'rgba(0, 255, 170, 0.3)';
            for (let i = 0; i < 600; i++) {
                const cx = Math.random() * canvas.width;
                const cy = Math.random() * canvas.height;
                // Keep them mostly away from poles to look like populated areas
                if (cy > 150 && cy < canvas.height - 150) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, Math.random() * 4 + 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, []);

    // Width=360, Height=180 to map 1 unit = 1 degree
    return (
        <group>
            <mesh position={[0, -100, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[360, 180, 64, 32]} />
                <meshBasicMaterial map={mapTex} side={THREE.DoubleSide} />
            </mesh>
            <ambientLight intensity={1.0} />
        </group>
    );
}
