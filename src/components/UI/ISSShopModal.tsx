import { useGameState } from '../../providers/GameStateProvider';
import './ISSShopModal.css';

export function ISSShopModal({ onClose }: { onClose: () => void }) {
    const { parts, score, buyPart } = useGameState();

    return (
        <div className="shop-modal-overlay">
            <div className="shop-modal-content">
                <div className="shop-header">
                    <h2>SYSTEM EXTENSION STORE</h2>
                    <div className="shop-score">所持ポイント: <span className="highlight-score">{score}</span> pt</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="close-btn" onClick={() => { window.dispatchEvent(new Event('ISS_MODAL_OPEN')); onClose(); }} style={{ color: '#00f0ff', borderColor: '#00f0ff' }}>[ ◁ 戻る ]</button>
                        <button className="close-btn" onClick={onClose}>[ 退出する ]</button>
                    </div>
                </div>

                <div className="shop-body">
                    <div className="shop-clerk-area">
                        <img
                            src="/assets/characters/ai_robot.png"
                            alt="System AI"
                            className="clerk-image"
                            onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('clerk-placeholder')!.style.display = 'flex'; }}
                        />
                        <div id="clerk-placeholder" style={{ display: 'none', width: '100%', height: '100%', border: '1px dashed #00f0ff', color: '#00f0ff', alignItems: 'center', justifyContent: 'center' }}>
                            [ AI UNIT OFFLINE ]
                        </div>
                        <div className="clerk-dialogue">
                            「いらっしゃいませ、司令官。<br />現在の蓄積ポイントと引き換えに、<br />各種センサーや拡張モジュールを提供します。」
                        </div>
                    </div>

                    <div className="shop-items-area">
                        <h3>販売モジュール一覧</h3>
                        <div className="items-list">
                            {parts.map(part => (
                                <div key={part.id} className={`shop-item ${part.isPurchased ? 'purchased' : score >= part.cost ? 'affordable' : 'expensive'}`}>
                                    <div className="item-info">
                                        <div className="item-name">{part.name} <span className="item-type">{part.type}</span></div>
                                        <div className="item-desc">{part.description}</div>
                                    </div>
                                    <div className="item-action">
                                        {part.isPurchased ? (
                                            <span className="purchased-label">購入済</span>
                                        ) : (
                                            <button
                                                className="buy-btn"
                                                disabled={score < part.cost}
                                                onClick={() => {
                                                    if (window.confirm(`${part.name} を ${part.cost}pt で購入しますか？`)) {
                                                        buyPart(part.id);
                                                    }
                                                }}
                                            >
                                                [ 購入 {part.cost}pt ]
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
