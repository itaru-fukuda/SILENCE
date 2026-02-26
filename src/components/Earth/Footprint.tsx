import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WGS84_A } from '../../utils/math';
import type { ISSTelemetry } from '../UI/ISSDashboard';
import { useGameState } from '../../providers/GameStateProvider';

export function Footprint() {
    const groupRef = useRef<THREE.Group>(null);
    const [targetPos, setTargetPos] = useState<THREE.Vector3 | null>(null);
    const { parts } = useGameState();

    // AttachedされたENSORパーツのバフ倍率を計算
    const buff = parts.reduce((acc, part) => (part.isAttached && part.type === 'SENSOR' ? acc * part.buffValue : acc), 1.0);
    const baseScale = 250;
    const currentScale = baseScale * buff;

    useEffect(() => {
        const handleUpdate = (e: any) => {
            const tel = e.detail as ISSTelemetry;
            const lat = tel.latitude * Math.PI / 180;
            const lon = tel.longitude * Math.PI / 180;
            // 地表すれすれに投影
            const alt = 5.0;

            const e2 = 0.00669437999014; // eccentricity squared
            const N = WGS84_A / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));

            const x = (N + alt) * Math.cos(lat) * Math.sin(lon);
            const z = (N + alt) * Math.cos(lat) * Math.cos(lon);
            const y = ((1 - e2) * N + alt) * Math.sin(lat);

            setTargetPos(new THREE.Vector3(x, y, z));
        };

        window.addEventListener('ISS_UPDATE', handleUpdate);
        return () => window.removeEventListener('ISS_UPDATE', handleUpdate);
    }, []);

    useFrame(() => {
        if (groupRef.current && targetPos) {
            // ISSBeaconと同じ補間で滑らかに追従
            groupRef.current.position.lerp(targetPos, 0.05);

            // 地球からの法線ベクトル（真上）を向きとする
            const up = groupRef.current.position.clone().normalize();

            // Z軸方向がデフォルトなので、Z軸を地球の法線(up)に合わせる
            groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Footprint Border */}
            <mesh scale={[currentScale, currentScale, 1]}>
                <ringGeometry args={[0.95, 1.0, 64]} />
                <meshBasicMaterial color="#00ffaa" transparent opacity={0.8} />
            </mesh>
            {/* Footprint Inner Area */}
            <mesh scale={[currentScale, currentScale, 1]}>
                <circleGeometry args={[1.0, 64]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.15} depthWrite={false} />
            </mesh>
            {/* Center Crosshair Horizontal */}
            <mesh scale={[currentScale * 0.1, currentScale * 0.02, 1]}>
                <planeGeometry />
                <meshBasicMaterial color="#00ffaa" transparent opacity={0.8} />
            </mesh>
            {/* Center Crosshair Vertical */}
            <mesh scale={[currentScale * 0.02, currentScale * 0.1, 1]}>
                <planeGeometry />
                <meshBasicMaterial color="#00ffaa" transparent opacity={0.8} />
            </mesh>
        </group>
    );
}
