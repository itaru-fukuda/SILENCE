import { useState, useEffect } from 'react';
import './SAMInterface.css';

type MissionState = 'BOOT' | 'ISSUING' | 'WAITING' | 'VERIFYING' | 'COMPLETED';

export function SAMInterface() {
    const [state, setState] = useState<MissionState>('BOOT');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let timer: any;
        if (state === 'BOOT') {
            setMessage('SYSTEM BOOTING...\nCONNECTING TO ORBITAL TELEMETRY...\nSAM ONLINE.');
            timer = setTimeout(() => setState('ISSUING'), 3000);
        } else if (state === 'ISSUING') {
            setMessage('>> NEW DIRECTIVE RECEIVED <<\nMISSION: 指定時刻に目標地域を SAR (合成開口レーダー) で撮像せよ。\n軌道同期を確認中...');
            timer = setTimeout(() => setState('WAITING'), 4000);
        } else if (state === 'VERIFYING') {
            setMessage('>> PROCESSING SAR BACKSCATTER DATA <<\nスペックルノイズ生成中...\nレイオーバー補正シミュレーション実行中...');
            timer = setTimeout(() => setState('COMPLETED'), 3000);
        } else if (state === 'COMPLETED') {
            setMessage('>> MISSION COMPLETE <<\n高品質のSAR画像を取得しました。司令部へアップリンクを開始します。');
        }
        return () => clearTimeout(timer);
    }, [state]);

    const handleAction = () => {
        setState('VERIFYING');
        window.dispatchEvent(new CustomEvent('TRIGGER_SAR_IMAGING', { detail: { isSAR: true } }));

        // Reset to optical after some time for demo purposes
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('TRIGGER_SAR_IMAGING', { detail: { isSAR: false } }));
        }, 10000);
    };

    return (
        <div className="sam-container">
            <div className="sam-header">
                <span>SAM_OS v2.4</span>
                <span className="sam-status">■</span>
            </div>
            <div className="sam-message" style={{ whiteSpace: 'pre-wrap' }}>
                {message}
            </div>
            {state === 'WAITING' && (
                <button className="sam-action-btn" onClick={handleAction}>
                    [ EXECUTE SAR IMAGING SEQUENCE ]
                </button>
            )}
        </div>
    );
}
