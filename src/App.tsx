import { useState } from 'react';
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
import { memo, useEffect } from 'react';

// === WebGL Canvas内部のツリーをメモ化し、グローバルステート（ADV文字送りなど）の変更による再描画巻き込みを防ぐ ===
const SceneContent = memo(({ setIsModalOpen }: { setIsModalOpen: (v: boolean) => void }) => {
  return (
    <>
      <OrbitControls makeDefault rotateSpeed={0.3} enablePan={false} enableDamping={false} minDistance={6600} maxDistance={50000} />
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
    window.addEventListener('SHOP_OPEN', handleShopOpen);
    return () => window.removeEventListener('SHOP_OPEN', handleShopOpen);
  }, []);

  return (
    <GameStateProvider>
      <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative' }}>
        <ISSDashboard />
        <MissionLog />
        {isModalOpen && <ISSUpgradeModal onClose={() => setIsModalOpen(false)} />}
        {isShopOpen && <ISSShopModal onClose={() => setIsShopOpen(false)} />}

        <AdventureLayer />

        <Canvas camera={{ far: 1000000, position: [0, 0, 15000] }}>
          <SceneContent setIsModalOpen={setIsModalOpen} />
        </Canvas>
      </div>
    </GameStateProvider>
  );
}
