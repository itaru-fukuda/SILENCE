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
            const now = new Date();
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
                                background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff', cursor: 'pointer',
                                padding: '4px 12px', fontSize: '0.9rem', borderRadius: '4px', letterSpacing: '1px'
                            }}
                        >
                            {mapMode === '3D' ? '🌍 3D MODE' : '🗺️ 2D MODE'}
                        </button>
                        <span className="live-indicator">● LIVE</span>
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
                        <span className="label">日照状態</span>
                        <span className={`value ${telemetry.visibility}`}>{(telemetry.visibility === 'daylight' ? '日照' : '日陰')}</span>
                    </div>
                </div>

                <div className="hud-footer" style={{ display: 'flex', gap: '10px' }}>
                    <button className="hud-btn" data-tutorial="locate-iss-btn" onClick={() => window.dispatchEvent(new Event('ORBIT_RESET'))} style={{ fontSize: '1rem', padding: '10px', flex: 1, background: 'rgba(0, 240, 255, 0.15)', borderColor: '#00f0ff' }}>
                        [ 🎯 LOCATE ISS ]
                    </button>
                    <button className="hud-btn" data-tutorial="shop-open-btn" onClick={() => window.dispatchEvent(new Event('SHOP_OPEN'))} style={{ fontSize: '1rem', padding: '10px', flex: 1, background: 'rgba(255, 204, 0, 0.15)', borderColor: '#ffcc00', color: '#ffcc00' }}>
                        [ 🛒 モジュール拡張 ]
                    </button>
                </div>
            </div>
        </>
    );
}
