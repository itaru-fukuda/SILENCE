import { useState } from 'react';
import { useGameState } from '../../providers/GameStateProvider';
import './MissionLog.css';

export function MissionLog() {
    const { missions, scheduleMission } = useGameState();
    const [reservationTime, setReservationTime] = useState<number>(15);
    const [displayType, setDisplayType] = useState<'main' | 'sub'>('main');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleSchedule = (id: string) => {
        const targetUnix = Date.now() + reservationTime * 60000;
        scheduleMission(id, targetUnix);
        alert(`撮像を ${reservationTime} 分後にスケジュールしました`);
    };

    const activeMissions = missions.filter(m => m.type === displayType);

    return (
        <div className="mission-log-container" data-tutorial="mission-panel">
            <div className="mission-header" style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <h3
                        style={{ cursor: 'pointer', opacity: displayType === 'main' ? 1 : 0.5, margin: 0 }}
                        onClick={() => setDisplayType('main')}
                    >
                        メインM
                    </h3>
                    <h3
                        style={{ cursor: 'pointer', opacity: displayType === 'sub' ? 1 : 0.5, margin: 0 }}
                        onClick={() => setDisplayType('sub')}
                    >
                        サブM
                    </h3>
                </div>
                <span className="mission-count">残り {activeMissions.filter(m => m.status === '未完了' || m.status === '失敗').length} 件</span>
            </div>
            <div className="mission-list">
                {activeMissions.map(mission => (
                    <div key={mission.id} className={`mission-item ${mission.status === '失敗' ? 'failed' : mission.status === '成功' ? 'completed' : mission.status === '予約済' ? 'scheduled' : 'pending'}`}>
                        <div className="mission-title">{mission.name}</div>
                        <div className="mission-purpose" style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>{mission.purpose}</div>
                        <div className="mission-coords">
                            緯度: {mission.lat.toFixed(4)} / 経度: {mission.lon.toFixed(4)}
                        </div>
                        <div className="mission-status">
                            状態: <span className="status-badge">{mission.status}</span>
                        </div>
                        {(mission.status === '未完了' || mission.status === '失敗') && (
                            <div className="schedule-controls" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                <select
                                    value={reservationTime}
                                    onChange={(e) => setReservationTime(Number(e.target.value))}
                                    style={{ background: 'transparent', color: '#00f0ff', border: '1px solid #00f0ff', fontFamily: 'monospace' }}
                                >
                                    <option value={15}>15分後</option>
                                    <option value={30}>30分後</option>
                                    <option value={45}>45分後</option>
                                    <option value={60}>60分後</option>
                                    <option value={90}>90分後</option>
                                </select>
                                <button className="schedule-btn" onClick={() => handleSchedule(mission.id)}>
                                    [ 撮像予約 ]
                                </button>
                            </div>
                        )}
                        {mission.status === '成功' && mission.resultImage && (
                            <div className="result-controls" style={{ marginTop: '10px' }}>
                                <button
                                    className="schedule-btn"
                                    onClick={() => setPreviewImage(mission.resultImage!)}
                                    style={{ background: 'rgba(0, 255, 100, 0.2)', borderColor: '#00ff66', color: '#00ff66', width: '100%' }}
                                >
                                    [ 撮像結果を確認 ]
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 画像プレビューモーダル */}
            {previewImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10000,
                        cursor: 'pointer'
                    }}
                    onClick={() => setPreviewImage(null)}
                >
                    <div style={{
                        maxWidth: '80%', maxHeight: '80%',
                        border: '2px solid #00f0ff',
                        boxShadow: '0 0 30px rgba(0,240,255,0.4)',
                        position: 'relative',
                        padding: '10px',
                        background: '#0a141e'
                    }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#e74c3c', color: 'white', padding: '5px 15px', fontWeight: 'bold', border: '1px solid #fff' }}>CLOSE</div>
                        {/* 実際の画像がない場合のフォールバックとしてaltを表示させる */}
                        <img
                            src={previewImage}
                            alt="Mission Result"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            onError={(e) => {
                                // 画像がない場合はダミーのプレースホルダーを表示
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML += `
                                    <div style="width: 600px; height: 350px; display: flex; align-items: center; justify-content: center; color: #00f0ff; border: 1px dashed #00f0ff;">
                                        <h3>[NO SIGNAL - IMAGE DATA MISSING]</h3>
                                    </div>
                                `;
                            }}
                        />
                    </div>
                    <p style={{ color: '#00f0ff', marginTop: '20px', letterSpacing: '2px' }}>[画面クリックで閉じる]</p>
                </div>
            )}
        </div>
    );
}
