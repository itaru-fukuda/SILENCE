import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../../providers/GameStateProvider';
import { scenarios, characters } from '../../data/scenario';
import './AdventureLayer.css';

export function AdventureLayer() {
    const { gameMode, currentScenarioId, completeScenario, addMissions, addScore, unlockPart } = useGameState();
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const typingTimerRef = useRef<number | null>(null);

    // シナリオが変わったら初期化
    useEffect(() => {
        if (currentScenarioId) {
            setCurrentMessageIndex(0);
            setDisplayedText('');
            setIsTyping(false);
            if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        }
    }, [currentScenarioId]);

    // 現在のメッセージを特定する (useEffectの依存に使うため)
    const scenario = currentScenarioId ? scenarios[currentScenarioId] : null;
    const currentMessage = scenario && scenario.messages[currentMessageIndex] ? scenario.messages[currentMessageIndex] : null;

    // ハイライト枠の状態
    const highlightTarget = currentMessage?.highlightTarget;
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

    // タイプライターエフェクト
    useEffect(() => {
        if (!currentMessage) return;

        // タイマーをクリア
        if (typingTimerRef.current !== null) {
            window.clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
        }

        const textToType = currentMessage.text || '';
        if (textToType.length === 0) {
            setDisplayedText('');
            setIsTyping(false);
            return;
        }

        // 初期化
        setIsTyping(true);
        setDisplayedText('');
        let currentLength = 0;

        typingTimerRef.current = window.setInterval(() => {
            currentLength += 1;
            if (currentLength <= textToType.length) {
                setDisplayedText(textToType.substring(0, currentLength));
            } else {
                setIsTyping(false);
                if (typingTimerRef.current !== null) {
                    window.clearInterval(typingTimerRef.current);
                    typingTimerRef.current = null;
                }
            }
        }, 30); // 文字送り速度

        return () => {
            if (typingTimerRef.current !== null) {
                window.clearInterval(typingTimerRef.current);
                typingTimerRef.current = null;
            }
        };
    }, [currentMessage]); // currentMessageの切り替わりのみで再構築

    // 無効な状態の場合はすぐにシナリオを終了させる（RenderフェーズでのState更新を避ける）
    useEffect(() => {
        if (gameMode === 'ADV' && currentScenarioId && (!scenario || !currentMessage)) {
            completeScenario();
        }
    }, [gameMode, currentScenarioId, scenario, currentMessage, completeScenario]);

    // ハイライト要素の座標取得
    useEffect(() => {
        if (!highlightTarget) {
            setHighlightRect(null);
            return;
        }

        const updateRect = () => {
            const el = document.querySelector(`[data-tutorial="${highlightTarget}"]`);
            if (el) {
                setHighlightRect(el.getBoundingClientRect());
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);

        // DOM描画直後の不整合対策として、少し時間をおいてから再取得する
        const timer1 = setTimeout(updateRect, 50);
        const timer2 = setTimeout(updateRect, 300);

        return () => {
            window.removeEventListener('resize', updateRect);
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [highlightTarget]);

    // 早期リターン（全てのHook宣言の後に配置すること！）
    if (gameMode !== 'ADV' || !currentScenarioId || !scenario || !currentMessage) {
        return null;
    }

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();

        const textToType = currentMessage?.text || '';

        if (isTyping) {
            // タイプ中の場合は全表示してスキップ
            if (typingTimerRef.current !== null) {
                window.clearInterval(typingTimerRef.current);
                typingTimerRef.current = null;
            }
            setDisplayedText(textToType);
            setIsTyping(false);
        } else {
            // 次のメッセージへ
            if (currentMessageIndex < scenario.messages.length - 1) {
                setCurrentMessageIndex(prev => prev + 1);
            } else {
                // シナリオ終了
                if (scenario.onCompleteReward) {
                    if (scenario.onCompleteReward.score) addScore(scenario.onCompleteReward.score);
                    if (scenario.onCompleteReward.unlockPart) unlockPart(scenario.onCompleteReward.unlockPart);
                    if (scenario.onCompleteReward.newMissions) addMissions(scenario.onCompleteReward.newMissions);
                }
                completeScenario();
            }
        }
    };

    // 話者の立ち絵を取得 (emotionに応じて切り替え、無ければnormalをフォールバック)
    const currentEmotion = currentMessage.emotion || 'normal';
    const charData = characters[currentMessage.speaker];
    const activeImage = currentMessage.hideCharacterImage ? null : (charData?.image ? (charData.image[currentEmotion] || charData.image['normal']) : null);

    // 話者の位置によってレイアウトを変える
    const isProtag = currentMessage.speaker === 'protag';

    // 指差しの方向とアイコンを決定する
    const pointerPos = currentMessage.highlightPosition || 'left';
    let pointerEmoji = '👉';
    if (pointerPos === 'top') pointerEmoji = '👇';
    else if (pointerPos === 'bottom') pointerEmoji = '👆';
    else if (pointerPos === 'right') pointerEmoji = '👈';

    return (
        <div className={`adv-layer-container ${currentMessage.hideBlur ? 'no-blur' : ''}`} onClick={handleNext}>
            {/* チュートリアル対象のハイライト枠と矢印 */}
            {highlightRect && (
                <div className="adv-tutorial-highlight" style={{
                    top: highlightRect.top - 10,
                    left: highlightRect.left - 10,
                    width: highlightRect.width + 20,
                    height: highlightRect.height + 20,
                }}>
                    <div className={`adv-tutorial-pointer pos-${pointerPos}`}>
                        {pointerEmoji}
                    </div>
                </div>
            )}

            {/* 立ち絵 (オーバーレイ) */}
            {activeImage && (
                <div className={`adv-character-portrait ${isProtag ? 'protag' : 'npc'}`}>
                    <img src={activeImage} alt={currentMessage.speakerName} />
                </div>
            )}

            {/* メッセージウィンドウ */}
            <div className="adv-message-window">
                <div className={`adv-speaker-name ${isProtag ? 'protag' : 'npc'}`}>
                    {currentMessage.speakerName}
                </div>
                <div className="adv-message-text">
                    <span>{displayedText}</span>
                    <span className="adv-cursor" style={{ visibility: isTyping ? 'hidden' : 'visible' }}>▼</span>
                </div>
            </div>
        </div>
    );
}
