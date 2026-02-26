
import * as THREE from 'three';
import { useState } from 'react';
import { useGameState } from '../../providers/GameStateProvider';
import { WGS84_A } from '../../utils/math';

export function MissionMarkers() {
    const { missions, mapMode } = useGameState();

    return (
        <group>
            {missions.map(mission => {
                const lat = mission.lat * Math.PI / 180;
                const lon = mission.lon * Math.PI / 180;
                const alt = 20; // 表面から少し浮かせる

                let position = new THREE.Vector3(0, 0, 0);

                if (mapMode === '3D') {
                    const e2 = 0.00669437999014;
                    const N = WGS84_A / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));

                    const x = (N + alt) * Math.cos(lat) * Math.sin(lon);
                    const z = (N + alt) * Math.cos(lat) * Math.cos(lon);
                    const y = ((1 - e2) * N + alt) * Math.sin(lat);
                    position.set(x, y, z);
                } else {
                    // 2D Mercator (Equirectangular scaled mapping)
                    const px = mission.lon; // -180 to 180
                    const pz = -mission.lat; // Invert lat so N is -z, S is +z
                    position.set(px, 1.0, pz); // Hover slightly above FlatEarth at y=1.0
                }

                // 色分け
                let color = '#00f0ff';
                if (mission.status === '予約済') color = '#ffcc00';
                else if (mission.status === '成功') color = '#00ffaa';
                else if (mission.status === '失敗') color = '#ff3333';

                // 2Dモード向けにマーカースケールを調整
                const scale = mapMode === '2D' ? 0.05 : 1.0;

                return (
                    <MarkerItem key={mission.id} position={position} color={color} scale={scale} mapMode={mapMode} />
                );
            })}
        </group>
    );
}

function MarkerItem({ position, color, scale, mapMode }: { position: THREE.Vector3, color: string, scale: number, mapMode: string }) {
    const [hovered, setHovered] = useState(false);

    return (
        <group
            position={position}
            scale={[scale, scale, scale]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
        >
            {/* ターゲットのコア */}
            <mesh>
                <sphereGeometry args={[30, 16, 16]} />
                <meshBasicMaterial color={hovered ? '#ffffff' : color} />
            </mesh>
            {/* マーカーオーラ */}
            <mesh scale={[2.0, 2.0, 2.0]}>
                <sphereGeometry args={[30, 8, 8]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={hovered ? 0.9 : 0.6} />
            </mesh>

            {/* PointLightで地球表面を少し照らす (2Dモード時は無効にするか光量を下げる) */}
            {mapMode === '3D' && <pointLight distance={1000} intensity={2.0} color={color} />}
            {mapMode === '2D' && <pointLight distance={100} intensity={0.5} pos={[0, 10, 0]} color={color} />}
        </group>
    );
}
