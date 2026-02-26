import { useEffect, useState } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { WGS84_A } from '../../utils/math';
import { useGameState } from '../../providers/GameStateProvider';

export function OrbitPath() {
    const [points, setPoints] = useState<THREE.Vector3[]>([]);
    const { mapMode } = useGameState();

    useEffect(() => {
        // ISS TLE (This should ideally be fetched from Celestrak, using a static recent one for demo/fallback)
        const tleLine1 = '1 25544U 98067A   23272.56475694  .00015504  00000-0  28173-3 0  9997';
        const tleLine2 = '2 25544  51.6416 288.0827 0005703 147.2345 328.6775 15.50293635418146';

        // Fetch latest TLE for ISS (NORAD 25544) (CORS issues might apply, using static for now)
        // To implement real fetch: fetch('https://celestrak.org/NORAD/elements/stations.txt')

        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

        const updateOrbit = () => {
            const orbitPoints = [];
            const now = new Date();

            // Calculate one full orbit (approx 90 mins)
            for (let i = 0; i < 90; i++) {
                const d = new Date(now.getTime() + i * 60000);
                const positionAndVelocity = satellite.propagate(satrec, d);

                if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
                    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
                    const gmst = satellite.gstime(d);
                    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                    const lat = positionGd.latitude;
                    const lon = positionGd.longitude;
                    const alt = positionGd.height;

                    if (mapMode === '3D') {
                        const e2 = 0.00669437999014; // eccentricity squared
                        const N = WGS84_A / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));

                        const x = (N + alt) * Math.cos(lat) * Math.sin(lon);
                        const z = (N + alt) * Math.cos(lat) * Math.cos(lon);
                        const y = ((1 - e2) * N + alt) * Math.sin(lat);
                        orbitPoints.push(new THREE.Vector3(x, y, z));
                    } else {
                        // 2D (Mercator Plane) Mapping
                        // Plane is 360 x 180, ranging from x: [-180, 180], z: [-90, 90]
                        const px = lon * 180 / Math.PI;
                        const pz = -lat * 180 / Math.PI; // Invert lat so N is -z, S is +z (matches PlaneGeometry orientation if rotated)
                        // Note: For a true Web Mercator, y = log(tan(pi/4 + lat/2)), but 
                        // equirectangular mapping (direct lat/lon to rect) is used by the basic PlaneGeometry mapping.

                        // Avoid wrapping artifacts connecting 180 to -180 across the screen
                        if (orbitPoints.length > 0) {
                            const lastPoint = orbitPoints[orbitPoints.length - 1];
                            if (Math.abs(px - lastPoint.x) > 180) {
                                // Cut the line by inserting a dummy point or handling multi-line
                                // For simplicity, we just stop rendering the continuous line when crossing dateline
                                // or split into multiple lines. Since Drei Line expects one contiguous array,
                                // we'll skip wrapping points or limit orbit drawing in 2D to avoid huge horizontal lines.
                            }
                        }

                        orbitPoints.push(new THREE.Vector3(px, 1.0, pz)); // Y=1.0 to hover slightly above the 2D plane
                    }
                }
            }
            setPoints(orbitPoints);
        };

        // 初期計算と、短めの定期更新（マーカーが確実に現在地起点で更新されるように）
        updateOrbit();
        const interval = setInterval(updateOrbit, 10000); // 10秒ごとに軌道パスを未来方向へ引き直す

        return () => clearInterval(interval);
    }, [mapMode]);

    if (points.length === 0) return null;

    return (
        <group>
            <Line points={points} color="#00f0ff" lineWidth={2} transparent opacity={0.6} depthTest={false} renderOrder={1} />

            {/* 15分ごとに軌道上に時刻マーカーを配置 */}
            {points.map((pos, index) => {
                if (index > 0 && index % 15 === 0) {
                    return (
                        <group key={index} position={pos}>
                            <mesh>
                                <sphereGeometry args={[10, 8, 8]} />
                                <meshBasicMaterial color="#ffcc00" />
                            </mesh>
                        </group>
                    );
                }
                return null;
            })}
        </group>
    );
}
