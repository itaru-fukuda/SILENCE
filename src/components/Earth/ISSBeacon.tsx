import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { WGS84_A, getMercatorCoordinates } from '../../utils/math';
import type { ISSTelemetry } from '../UI/ISSDashboard';
import { useGameState } from '../../providers/GameStateProvider';

export function ISSBeacon({ onClick }: { onClick?: () => void }) {
    const groupRef = useRef<THREE.Group>(null);
    const outerMeshRef = useRef<THREE.Mesh>(null);

    // Keep track of the latest target WGS84 coordinates
    const [targetPos, setTargetPos] = useState<THREE.Vector3 | null>(null);
    const { parts, mapMode } = useGameState();

    const hasSensor = parts.find(p => p.id === 'p1')?.isAttached;
    const hasAntenna = parts.find(p => p.id === 'p2')?.isAttached;
    const [hovered, setHovered] = useState(false);

    const issTexture = useTexture('/iss_core.png');
    const antennaTexture = useTexture('/part_antenna.png');
    // const sensorTexture = useTexture('/part_sensor.png'); // Uncomment when ready

    useEffect(() => {
        const handleUpdate = (e: any) => {
            const tel = e.detail as ISSTelemetry;
            const lat = tel.latitude * Math.PI / 180;
            const lon = tel.longitude * Math.PI / 180;
            const alt = tel.altitude;

            let newPos = new THREE.Vector3();

            if (mapMode === '3D') {
                // Coordinate matching with WGS84 logic defined in CameraSync.tsx
                const e2 = 0.00669437999014; // eccentricity squared
                const N = WGS84_A / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));

                const x = (N + alt) * Math.cos(lat) * Math.sin(lon);
                const z = (N + alt) * Math.cos(lat) * Math.cos(lon);
                const y = ((1 - e2) * N + alt) * Math.sin(lat);
                newPos.set(x, y, z);
            } else {
                // True Web Mercator 
                newPos.copy(getMercatorCoordinates(lat, lon));
            }

            setTargetPos(newPos);
        };

        window.addEventListener('ISS_UPDATE', handleUpdate);
        return () => window.removeEventListener('ISS_UPDATE', handleUpdate);
    }, [mapMode]);

    useFrame(() => {
        if (groupRef.current && targetPos) {
            // Smooth interpolation for the 5-sec polling gap to make it look real-time
            groupRef.current.position.lerp(targetPos, 0.05);

            // Make it look outward from earth center (in 3D) or straight up (in 2D)
            if (mapMode === '3D') {
                groupRef.current.lookAt(0, 0, 0);
            } else {
                groupRef.current.rotation.set(-Math.PI / 2, 0, 0);
            }
        }

        // Animate outer shell rotation for sci-fi feel
        if (outerMeshRef.current) {
            outerMeshRef.current.rotation.x += 0.01;
            outerMeshRef.current.rotation.y += 0.02;
        }
    });

    const baseScale = 400;
    const hoverScale = 480;
    const groupScale = 1.0;

    return (
        <group
            ref={groupRef}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick();
                }
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
        >
            <group scale={[groupScale, groupScale, groupScale]}>
                <sprite scale={hovered ? [hoverScale, hoverScale, hoverScale] : [baseScale, baseScale, baseScale]}>
                    {/* @ts-ignore */}
                    <spriteMaterial map={issTexture} transparent blending={THREE.AdditiveBlending} depthTest={false} renderOrder={999} />
                </sprite>

                {/* Target Marker Ring */}
                <mesh rotation-x={Math.PI / 2} scale={[120, 120, 120]}>
                    <ringGeometry args={[0.9, 1.0, 32]} />
                    <meshBasicMaterial color="#00f0ff" transparent opacity={0.5} side={THREE.DoubleSide} />
                </mesh>

                {/* SENSOR PART: SAR Extended Lens */}
                {hasSensor && (
                    <group position={[80, 0, 0]}>
                        <mesh>
                            <boxGeometry args={[40, 20, 20]} />
                            <meshStandardMaterial color="#ffcc00" metalness={0.8} roughness={0.2} emissive="#ffaa00" emissiveIntensity={1.5} />
                        </mesh>
                        <pointLight position={[0, 0, 0]} color="#ffaa00" intensity={2} distance={100} />
                    </group>
                )}

                {/* ANTENNA PART: Quantum Antenna */}
                {hasAntenna && (
                    <group position={[-60, 0, 0]}>
                        <sprite scale={[baseScale * 0.5, baseScale * 0.5, baseScale * 0.5]}>
                            {/* @ts-ignore */}
                            <spriteMaterial map={antennaTexture} transparent blending={THREE.AdditiveBlending} depthTest={false} renderOrder={1000} />
                        </sprite>
                        <pointLight position={[0, 0, 0]} color="#00ffaa" intensity={2} distance={100} />
                    </group>
                )}
            </group>
        </group>
    );
}
