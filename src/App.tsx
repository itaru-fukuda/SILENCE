import { useState, memo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Earth } from './components/Earth/Earth';
import { CameraSync } from './components/Earth/CameraSync';
import { ISSDashboard } from './components/UI/ISSDashboard';
import { ISSBeacon } from './components/Earth/ISSBeacon';
import { GameStateProvider } from './providers/GameStateProvider';
import { MissionLog } from './components/UI/MissionLog';
import { MissionMarkers } from './components/Earth/MissionMarkers';
import { OrbitPath } from './components/Earth/OrbitPath';
import { Footprint } from './components/Earth/Footprint';
import { ISSUpgradeModal } from './components/UI/ISSUpgradeModal';
import { ISSShopModal } from './components/UI/ISSShopModal';
import { AdventureLayer } from './components/Adventure/AdventureLayer';
import { useGameState } from './providers/GameStateProvider';

const MapControls = () => {
  const { mapMode } = useGameState();
  return (
    <OrbitControls
      makeDefault
      rotateSpeed={0.3}
      enablePan={mapMode === '2D'} // 2Dモード時はパン(平行移動)のみ許可
      enableRotate={mapMode !== '2D'} // 2Dモード時は回転を完全に禁止
      enableZoom={true}
      // 2D時は極角の制約を解除し、CameraSync側でY軸正方向から見下ろす姿勢を維持しやすくする
      minPolarAngle={mapMode === '2D' ? 0 : 0}
      maxPolarAngle={mapMode === '2D' ? Math.PI : Math.PI}
      minAzimuthAngle={mapMode === '2D' ? -Infinity : -Infinity}
      maxAzimuthAngle={mapMode === '2D' ? Infinity : Infinity}
      mouseButtons={{
        LEFT: mapMode === '2D' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: mapMode === '2D' ? THREE.MOUSE.PAN : THREE.MOUSE.PAN // 右クリックもパンにする（回転防止）
      }}
      enableDamping={false}
      minDistance={mapMode === '2D' ? 1000 : 6600}
      maxDistance={mapMode === '2D' ? 100000 : 50000}
    />
  );
};

// === WebGL Canvas内部のツリーをメモ化し、グローバルステート（ADV文字送りなど）の変更による再描画巻き込みを防ぐ ===
const SceneContent = memo(({ setIsModalOpen }: { setIsModalOpen: (v: boolean) => void }) => {
  return (
    <>
      <MapControls />
      <ambientLight intensity={0.1} />
      <directionalLight position={[10000, 0, 0]} intensity={2} />
      <Earth />
      <MissionMarkers />
      <OrbitPath />
      <Footprint />
      <ISSBeacon onClick={() => setIsModalOpen(true)} />
      <CameraSync />
      <EffectComposer>
        <Bloom luminanceThreshold={1.0} mipmapBlur intensity={1.5} />
      </EffectComposer>
    </>
  );
});

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  useEffect(() => {
    const handleShopOpen = () => setIsShopOpen(true);
    const handleModalOpen = () => setIsModalOpen(true);
    window.addEventListener('SHOP_OPEN', handleShopOpen);
    window.addEventListener('ISS_MODAL_OPEN', handleModalOpen);
    return () => {
      window.removeEventListener('SHOP_OPEN', handleShopOpen);
      window.removeEventListener('ISS_MODAL_OPEN', handleModalOpen);
    }
  }, []);

  return (
    <GameStateProvider>
      <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* 16:9 画面比率固定ラッパー */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          maxWidth: 'calc(100vh * 16 / 9)', 
          maxHeight: 'calc(100vw * 9 / 16)', 
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          backgroundColor: '#050510', // 背景との境界をわずかに見分けるためのベースカラー
          boxShadow: '0 0 50px rgba(0,0,0,0.8)' // ピラーボックス/レターボックスとの境界に影
        }}>
          
          {/* 背景の3D Canvas */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas camera={{ far: 1000000, position: [0, 0, 15000] }}>
              <SceneContent setIsModalOpen={setIsModalOpen} />
            </Canvas>
          </div>

          {/* キューポラ（窓）空間の暗がりを再現するビネット・オーバーレイ */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none',
            zIndex: 5,
            background: 'radial-gradient(circle, transparent 40%, rgba(0, 5, 10, 0.8) 90%, #000 100%)',
            boxShadow: 'inset 0 0 120px rgba(0,0,0,1)'
          }} />

          {/* 前景のUI群 */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
            <ISSDashboard />
            <MissionLog />
            {isModalOpen && <div style={{ pointerEvents: 'auto' }}><ISSUpgradeModal onClose={() => setIsModalOpen(false)} /></div>}
            {isShopOpen && <div style={{ pointerEvents: 'auto' }}><ISSShopModal onClose={() => setIsShopOpen(false)} /></div>}
            <AdventureLayer />
          </div>
          
        </div>
      </div>
    </GameStateProvider>
  );
}
