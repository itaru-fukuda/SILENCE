import * as THREE from 'three';
import { useState } from 'react';
import { Html } from '@react-three/drei';
import { useGameState } from '../../providers/GameStateProvider';
import { WGS84_A, getMercatorCoordinates } from '../../utils/math';

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
                    // True Web Mercator
                    position.copy(getMercatorCoordinates(lat, lon));
                }

                // 色分け
                let color = '#00f0ff';
                if (mission.type === 'sub') color = '#ffcc00';
                else if (mission.status === '成功') color = '#00ffaa';
                else if (mission.status === '失敗') color = '#ff3333';

                // スケールはEarthサイズ (6378) に適したまま利用
                const scale = 1.0;

                return (
                    <MarkerItem key={mission.id} mission={mission} position={position} color={color} scale={scale} mapMode={mapMode} />
                );
            })}
        </group>
    );
}

function MarkerItem({ mission, position, color, scale, mapMode }: { mission: any, position: THREE.Vector3, color: string, scale: number, mapMode: string }) {
    const [hovered, setHovered] = useState(false);
    const [clicked, setClicked] = useState(false);

    return (
        <group
            position={position}
            scale={[scale, scale, scale]}
            onClick={(e) => { e.stopPropagation(); setClicked(!clicked); }}
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

            {/* ミッション情報ポップアップ */}
            {clicked && (
                <Html position={[0, 80, 0]} center zIndexRange={[100, 0]}>
                    <div
                        style={{ background: 'rgba(0,10,20,0.95)', border: `1px solid ${color}`, padding: '12px 16px', color: '#fff', borderRadius: '4px', width: '260px', pointerEvents: 'auto', boxShadow: `0 0 15px ${color}44`, backdropFilter: 'blur(4px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${color}88`, paddingBottom: '6px', marginBottom: '8px' }}>
                            <div style={{ color, fontWeight: 'bold', fontSize: '1.1rem' }}>{mission.name}</div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setClicked(false); }}
                                style={{ background: 'transparent', border: 'none', color: '#aaaaaa', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: '1' }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.4 }}>{mission.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '10px', color: '#88ccff' }}>
                            <span>報酬: {mission.rewardScore}pt</span>
                            <span>難度: {mission.difficulty}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', marginTop: '5px', textAlign: 'right', fontWeight: 'bold', color: mission.status === '成功' ? '#00ffaa' : (mission.status === '失敗' ? '#ff3333' : '#ffcc00') }}>
                            状態: {mission.status}
                        </div>
                    </div>
                </Html>
            )}

            {/* PointLightで地球表面を少し照らす (2Dモード時は無効にするか光量を下げる) */}
            {mapMode === '3D' && <pointLight distance={1000} intensity={2.0} color={color} />}
            {mapMode === '2D' && <pointLight distance={100} intensity={0.5} position={[0, 10, 0]} color={color} />}
        </group>
    );
}
