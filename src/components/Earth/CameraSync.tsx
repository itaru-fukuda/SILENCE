import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WGS84_A, getMercatorCoordinates } from '../../utils/math';
import type { ISSTelemetry } from '../UI/ISSDashboard';
import { useGameState } from '../../providers/GameStateProvider';

export function CameraSync() {
    const { camera, controls } = useThree();
    const { mapMode } = useGameState();

    useEffect(() => {
        let currentPos: THREE.Vector3 | null = null;
        let isFirstUpdate = true;

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
                // True Web Mercator 
                newPos.copy(getMercatorCoordinates(lat, lon));
            }

            currentPos = newPos;

            if (isFirstUpdate) {
                handleReset();
                isFirstUpdate = false;
            }
        };

        const handleReset = () => {
            if (currentPos) {
                if (mapMode === '3D') {
                    // Place camera above the ISS to get a pure Nadir view of Earth
                    const offset = currentPos.clone().normalize().multiplyScalar(5000);
                    camera.position.copy(currentPos).add(offset);
                    camera.up.set(0, 1, 0); // Reset up vector for 3D
                    camera.lookAt(0, 0, 0);
                    if (controls) (controls as any).target.set(0, 0, 0);
                } else {
                    // 2D Mode: Camera looking straight down at the flat plane
                    camera.position.set(currentPos.x, 2000, currentPos.z);
                    camera.up.set(0, 0, -1);
                    camera.lookAt(currentPos.x, 0, currentPos.z);
                    if (controls) {
                        const orbControls = controls as any;
                        // カメラ直下を原点(ターゲット)とする
                        orbControls.target.set(currentPos.x, 0, currentPos.z);
                        // update呼び出し前に内部変数を再同期
                        orbControls.object.position.set(currentPos.x, 8000, currentPos.z);
                        orbControls.object.up.set(0, 0, -1);
                        orbControls.update();
                    }
                }
            }
        };

        const handleZoomIn = () => {
            if (!controls) return;
            const orbControls = controls as any;
            const object = orbControls.object;
            const offset = new THREE.Vector3().copy(object.position).sub(orbControls.target);
            offset.multiplyScalar(0.98); // 距離を0.85倍に縮める (変化量を少なく)
            object.position.copy(orbControls.target).add(offset);
            orbControls.update();
        };

        const handleZoomOut = () => {
            if (!controls) return;
            const orbControls = controls as any;
            const object = orbControls.object;
            const offset = new THREE.Vector3().copy(object.position).sub(orbControls.target);
            offset.multiplyScalar(1.15); // 距離を1.15倍に伸ばす (変化量を少なく)
            object.position.copy(orbControls.target).add(offset);
            orbControls.update();
        };

        window.addEventListener('ISS_UPDATE', handleUpdate);
        window.addEventListener('ORBIT_RESET', handleReset);
        window.addEventListener('ZOOM_IN', handleZoomIn);
        window.addEventListener('ZOOM_OUT', handleZoomOut);

        return () => {
            window.removeEventListener('ISS_UPDATE', handleUpdate);
            window.removeEventListener('ORBIT_RESET', handleReset);
            window.removeEventListener('ZOOM_IN', handleZoomIn);
            window.removeEventListener('ZOOM_OUT', handleZoomOut);
        };
    }, [camera, mapMode]);

    return null;
}
