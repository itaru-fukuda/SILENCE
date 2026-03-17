import { useState, useEffect } from 'react';
import * as satellite from 'satellite.js';
import { useGameState } from '../../providers/GameStateProvider';
import './ISSDashboard.css';

export interface ISSTelemetry {
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    visibility: string;
    timestamp: number;
}

const useISSTelemetry = () => {
    const [telemetry, setTelemetry] = useState<ISSTelemetry | null>(null);

    useEffect(() => {
        // ISS TLE (This should match the one in OrbitPath / GameStateProvider)
        const tleLine1 = '1 25544U 98067A   23272.56475694  .00015504  00000-0  28173-3 0  9997';
        const tleLine2 = '2 25544  51.6416 288.0827 0005703 147.2345 328.6775 15.50293635418146';
        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

        const updateTelemetry = () => {
            // TLE data is from late 2023. Sync with OrbitPath.tsx to avoid math drift.
            const now = new Date('2023-09-30T00:00:00Z');
            const positionAndVelocity = satellite.propagate(satrec, now);

            if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') return;
            if (!positionAndVelocity.velocity || typeof positionAndVelocity.velocity === 'boolean') return;

            const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
            const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;
            const gmst = satellite.gstime(now);
            const positionGd = satellite.eciToGeodetic(positionEci, gmst);
            const velocityMag = Math.sqrt(velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2);

            const newTelemetry: ISSTelemetry = {
                latitude: positionGd.latitude * 180 / Math.PI,
                longitude: positionGd.longitude * 180 / Math.PI,
                altitude: positionGd.height, // in km
                velocity: velocityMag * 3600, // km/s to km/h
                visibility: 'daylight',
                timestamp: Date.now()
            };

            setTelemetry(newTelemetry);

            // Dispatch for other 3D components like CameraSync, ISSBeacon, Footprint
            window.dispatchEvent(new CustomEvent('ISS_UPDATE', { detail: newTelemetry }));
        };

        // 初回実行とインターバル設定
        updateTelemetry();
        const interval = setInterval(updateTelemetry, 2000);
        return () => clearInterval(interval);
    }, []);

    return telemetry;
};

export function ISSDashboard() {
    const telemetry = useISSTelemetry();
    const { mapMode, toggleMapMode } = useGameState();

    if (!telemetry) {
        return (
            <div className="iss-dashboard loading">
                <h3>AEROSPACE TELEMETRY HUD</h3>
                <p>ACQUIRING SIGNAL...</p>
            </div>
        );
    }

    return (
        <>
            <div className="iss-dashboard">
                <div className="hud-header">
                    <h3>航空宇宙テレメトリ HUD</h3>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button
                            onClick={toggleMapMode}
                            style={{
                                background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.4)', color: '#00f0ff', cursor: 'pointer',
                                padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px', letterSpacing: '1.5px', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                            }}
                        >
                            {mapMode === '3D' ? '3D→2D' : '2D→3D'}
                        </button>
                        <span className="live-indicator">●LIVE</span>
                    </div>
                </div>

                <div className="data-grid">
                    <div className="data-box">
                        <span className="label">追跡目標</span>
                        <span className="value">ISS (ZARYA)</span>
                    </div>
                    <div className="data-box">
                        <span className="label">緯度</span>
                        <span className="value">{telemetry.latitude.toFixed(4)}°</span>
                    </div>
                    <div className="data-box">
                        <span className="label">経度</span>
                        <span className="value">{telemetry.longitude.toFixed(4)}°</span>
                    </div>
                    <div className="data-box">
                        <span className="label">高度</span>
                        <span className="value">{telemetry.altitude.toFixed(2)} km</span>
                    </div>
                    <div className="data-box highlight">
                        <span className="label">速度</span>
                        <span className="value">{telemetry.velocity.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} km/h</span>
                    </div>
                    <div className="data-box">
                        <span className="label">環境光</span>
                        <span className={`value ${telemetry.visibility}`}>{(telemetry.visibility === 'daylight' ? '日照' : '日陰（エクリプス）')}</span>
                    </div>
                </div>

                <div className="hud-footer" style={{ display: 'flex', gap: '10px' }}>
                    <button className="hud-btn" data-tutorial="locate-iss-btn" onClick={() => window.dispatchEvent(new Event('ORBIT_RESET'))} style={{ fontSize: '1rem', padding: '10px', flex: 1, background: 'rgba(0, 240, 255, 0.15)', borderColor: '#00f0ff' }}>
                        [ 🎯 LOCATE ISS ]
                    </button>
                </div>
            </div>

            {/* カメラズーム操作UI（画面右下） */}
            <div style={{ position: 'absolute', bottom: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 100, pointerEvents: 'auto' }}>
                <button 
                  onClick={() => window.dispatchEvent(new Event('ZOOM_IN'))}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ width: '45px', height: '45px', fontSize: '24px', borderRadius: '12px', background: 'rgba(5, 7, 12, 0.7)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0, 240, 255, 0.1)', backdropFilter: 'blur(10px)', userSelect: 'none', transition: 'all 0.2s' }}
                >
                    +
                </button>
                <button 
                  onClick={() => window.dispatchEvent(new Event('ZOOM_OUT'))}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ width: '45px', height: '45px', fontSize: '24px', borderRadius: '12px', background: 'rgba(5, 7, 12, 0.7)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0, 240, 255, 0.1)', backdropFilter: 'blur(10px)', userSelect: 'none', transition: 'all 0.2s' }}
                >
                    −
                </button>
            </div>
        </>
    );
}
