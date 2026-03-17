import { useEffect, useState } from 'react';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { WGS84_A, getMercatorCoordinates } from '../../utils/math';
import { useGameState } from '../../providers/GameStateProvider';

export function OrbitPath() {
    // 3D/2D兼用のため、連続した線の「配列の配列」として管理。
    // 3Dなら大抵1つの要素（1本の線）、2Dならラップ境界ごとに分割された複数要素になる。
    const [segments, setSegments] = useState<THREE.Vector3[][]>([]);
    const { mapMode } = useGameState();

    useEffect(() => {
        // ISS TLE (This should ideally be fetched from Celestrak, using a static recent one for demo/fallback)
        const tleLine1 = '1 25544U 98067A   23272.56475694  .00015504  00000-0  28173-3 0  9997';
        const tleLine2 = '2 25544  51.6416 288.0827 0005703 147.2345 328.6775 15.50293635418146';

        // Fetch latest TLE for ISS (NORAD 25544) (CORS issues might apply, using static for now)
        // To implement real fetch: fetch('https://celestrak.org/NORAD/elements/stations.txt')

        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

        const updateOrbit = () => {
            const newSegments: THREE.Vector3[][] = [];
            let currentSegment: THREE.Vector3[] = [];
            // TLE data is from late 2023 (epoch day ~272). 
            // Using a current date in 2026 causes propagation algorithms to simulate 2.5 years of atmospheric drag, 
            // causing the satellite to "crash" (negative altitude) and resulting in a flat/broken line. 
            // We lock the base calculation time to match the TLE epoch to restore a perfect sine wave ground track.
            const now = new Date('2023-09-30T00:00:00Z');

            // Calculate three full orbits (approx 90 mins * 3 = 270 mins) to show the S-curve shift
            for (let i = 0; i < 270; i++) {
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
                        currentSegment.push(new THREE.Vector3(x, y, z));
                    } else {
                        // 2D (True Web Mercator Plane)
                        const p2d = getMercatorCoordinates(lat, lon);

                        // Avoid wrapping artifacts connecting East to West across the screen
                        if (currentSegment.length > 0) {
                            const lastPoint = currentSegment[currentSegment.length - 1];
                            const W_HALF = Math.PI * WGS84_A;
                            if (Math.abs(p2d.x - lastPoint.x) > W_HALF) {
                                // 画面端（日付変更線等）をまたいだ場合、現在の線を確定して次から新しい線を引く
                                newSegments.push([...currentSegment]);
                                currentSegment = [];
                            }
                        }

                        // p2d is already new THREE.Vector3(x, 1.0, z) from getMercatorCoordinates
                        currentSegment.push(p2d);
                    }
                }
            }
            // 最後のセグメントを追加
            if (currentSegment.length > 0) {
                newSegments.push(currentSegment);
            }

            setSegments(newSegments);
        };

        // 初期計算と、短めの定期更新（マーカーが確実に現在地起点で更新されるように）
        updateOrbit();
        const interval = setInterval(updateOrbit, 10000); // 10秒ごとに軌道パスを未来方向へ引き直す

        return () => clearInterval(interval);
    }, [mapMode]);

    if (segments.length === 0) return null;

    return (
        <group>
            {/* 分割されたOrbitの各セグメントを描画 (2点以上ある場合のみ) */}
            {segments.map((seg, idx) => (
                seg.length >= 2 ? (
                    <Line
                        key={idx}
                        points={seg}
                        color="#00f0ff"
                        lineWidth={2}
                        transparent
                        opacity={0.6}
                        depthTest={false}
                        renderOrder={1}
                        dashed={true}
                        dashSize={3}
                        gapSize={2}
                    />
                ) : null
            ))}

            {/* 15分ごとに軌道上に時刻マーカーを配置 */}
            {segments.flatMap(s => s).map((pos, index) => {
                if (index > 0 && index % 15 === 0) {
                    return (
                        <group key={index} position={pos}>
                            <mesh>
                                <sphereGeometry args={[10, 8, 8]} />
                                <meshBasicMaterial color="#ffcc00" />
                            </mesh>
                            <Text
                                position={[0, 150, 0]}
                                rotation={mapMode === '2D' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
                                fontSize={150}
                                color="#ffffff"
                                outlineWidth={6}
                                outlineColor="#000000"
                            >
                                +{(index / 15) * 15}m
                            </Text>
                        </group>
                    );
                }
                return null;
            })}
        </group>
    );
}
