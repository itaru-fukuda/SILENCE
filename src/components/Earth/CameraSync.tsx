import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WGS84_A } from '../../utils/math';
import type { ISSTelemetry } from '../UI/ISSDashboard';
import { useGameState } from '../../providers/GameStateProvider';

export function CameraSync() {
    const { camera } = useThree();
    const { mapMode } = useGameState();

    useEffect(() => {
        let currentPos: THREE.Vector3 | null = null;

        const handleUpdate = (e: any) => {
            const tel = e.detail as ISSTelemetry;
            const lat = tel.latitude * Math.PI / 180;
            const lon = tel.longitude * Math.PI / 180;
            const alt = tel.altitude;

            let newPos = new THREE.Vector3();

            if (mapMode === '3D') {
                const e2 = 0.00669437999014;
                const N = WGS84_A / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));

                const x = (N + alt) * Math.cos(lat) * Math.sin(lon);
                const z = (N + alt) * Math.cos(lat) * Math.cos(lon);
                const y = ((1 - e2) * N + alt) * Math.sin(lat);
                newPos.set(x, y, z);
            } else {
                // 2D Mercator
                const px = tel.longitude;
                const pz = -tel.latitude;
                newPos.set(px, 1.0, pz);
            }

            currentPos = newPos;
        };

        const handleReset = () => {
            if (currentPos) {
                if (mapMode === '3D') {
                    // Place camera above the ISS to get a pure Nadir view of Earth
                    const offset = currentPos.clone().normalize().multiplyScalar(5000);
                    camera.position.copy(currentPos).add(offset);
                    camera.lookAt(0, 0, 0);
                } else {
                    // 2D Mode: Camera looking straight down at the flat plane
                    camera.position.set(currentPos.x, 200, currentPos.z);
                    camera.lookAt(currentPos.x, 0, currentPos.z);
                }
            }
        };

        window.addEventListener('ISS_UPDATE', handleUpdate);
        window.addEventListener('ORBIT_RESET', handleReset);

        return () => {
            window.removeEventListener('ISS_UPDATE', handleUpdate);
            window.removeEventListener('ORBIT_RESET', handleReset);
        };
    }, [camera, mapMode]);

    return null;
}
