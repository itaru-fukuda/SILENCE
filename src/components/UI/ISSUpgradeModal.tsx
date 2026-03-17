
import { useGameState } from '../../providers/GameStateProvider';
import './ISSUpgradeModal.css';

export function ISSUpgradeModal({ onClose }: { onClose: () => void }) {
    const { parts, togglePartAttachment, score } = useGameState();

    return (
        <div className="upgrade-modal-overlay">
            <div className="upgrade-modal-content">
                <div className="modal-header">
                    <h2>ISS エンジニアリングベイ [ 3Dプリント＆アタッチメント ]</h2>
                    <button className="close-btn" onClick={onClose}>[ 閉じる ]</button>
                </div>

                <div className="modal-body">
                    {/* 2D Blueprint / Assembly View */}
                    <div className="modal-2d-view" style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, rgba(0,240,255,0.05) 0%, transparent 70%)', borderRight: '1px solid rgba(0, 240, 255, 0.2)', overflow: 'hidden' }}>
                        <img src="/iss_core.png" alt="ISS Core" style={{ position: 'absolute', width: 'auto', height: '90%', maxWidth: '100%', objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.5))' }} />
                        {parts.find(p => p.id === 'p1')?.isAttached && (
                            <>
                                <img src="/part_sensor.png" alt="SAR Lens" style={{ position: 'absolute', width: '35%', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 20px #ffcc00)' }} onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('sensor-placeholder')!.style.display = 'flex'; }} />
                                <div id="sensor-placeholder" style={{ display: 'none', position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', width: '30%', height: '20%', background: 'rgba(255,204,0,0.1)', border: '2px solid #ffcc00', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', color: '#ffcc00', fontFamily: 'monospace', fontWeight: 'bold', mixBlendMode: 'screen', boxShadow: '0 0 20px rgba(255,204,0,0.5)', textAlign: 'center' }}>
                                    [ SAR LENS ]<br />
                                    (Save part_sensor.png to /public)
                                </div>
                            </>
                        )}
                        {parts.find(p => p.id === 'p2')?.isAttached && (
                            <img src="/part_antenna.png" alt="Quantum Antenna" style={{ position: 'absolute', width: '35%', top: '50%', right: '15%', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 20px #00ffaa)' }} />
                        )}
                    </div>

                    {/* Parts List Area */}
                    <div className="modal-parts-list">
                        <h3>利用可能な拡張パーツ (INT. スコア: {score})</h3>
                        <p className="parts-desc">アタッチメントを有効化し、ミッション遂行能力を強化します。</p>
                        <div className="parts-container">
                            {parts.map(part => (
                                <div key={part.id} className={`part-card ${part.isAttached ? 'attached' : ''} ${!part.isUnlocked ? 'locked' : ''}`}>
                                    <div className="part-info">
                                        <h4>{part.name}</h4>
                                        <span className="part-type">{part.type}</span>
                                        <p>{part.description}</p>
                                    </div>
                                    <div className="part-action">
                                        {part.isUnlocked ? (
                                            <button onClick={() => togglePartAttachment(part.id)} className={part.isAttached ? 'btn-detach' : 'btn-attach'}>
                                                {part.isAttached ? '[ 取り外す ]' : '[ 装着する ]'}
                                            </button>
                                        ) : (
                                            <span className="locked-text">未開放</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid rgba(0,240,255,0.3)', paddingTop: '20px' }}>
                            <button className="btn-shop-link" onClick={() => { window.dispatchEvent(new Event('SHOP_OPEN')); onClose(); }} style={{ background: 'transparent', border: '1px solid #ffcc00', color: '#ffcc00', padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', fontFamily: 'monospace' }}>
                                [ 🛒 モジュール拡張ショップへ ]
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
