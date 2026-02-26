export type CharacterId = 'ai_robot' | 'protag' | 'system';
export type EmotionId = 'normal' | 'happy' | 'sad' | 'angry' | 'surprised' | 'serious';

export interface ScenarioMessage {
    id: string;
    speaker: CharacterId;
    speakerName: string;
    text: string;
    emotion?: EmotionId;
    hideCharacterImage?: boolean; // このメッセージの表示時、強制的に立ち絵を非表示にする
    hideBlur?: boolean; // 背景のぼかしと暗転を解除するかどうか
    highlightTarget?: string; // 指定した data-tutorial 属性を持つDOM要素をハイライトする
    highlightPosition?: 'top' | 'bottom' | 'left' | 'right'; // 指差しアイコンを配置する方向
    triggerNext?: string; // 次に連続して表示するメッセージID
}

export interface ScenarioEvent {
    id: string; // ex: 'tutorial', 'tokyo_success'
    messages: ScenarioMessage[];
    onCompleteReward?: { score?: number; unlockPart?: string; newMissions?: string[] };
    nextEventId?: string; // すぐに次のシナリオイベントへ移行する場合
}

export const characters: Record<CharacterId, { name: string; image: Partial<Record<EmotionId, string>> | null }> = {
    ai_robot: {
        name: 'システムAI',
        image: {
            normal: '/assets/characters/ai_robot.png'
        }
    },
    protag: {
        name: '司令官',
        image: {
            normal: '/assets/characters/protag_indoor.png'
        }
    },
    system: {
        name: 'SYS',
        image: null
    }
};

export const scenarios: Record<string, ScenarioEvent> = {
    'prologue': {
        id: 'prologue',
        messages: [
            {
                id: 'p1',
                speaker: 'system',
                speakerName: 'SYS',
                text: '>>> INITIALIZING PROJECT SILENCE...',
                triggerNext: 'p2'
            },
            {
                id: 'p2',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: 'おはようございます、司令官。コールドスリープからの目覚めはいかがですか？',
                triggerNext: 'p3'
            },
            {
                id: 'p3',
                speaker: 'protag',
                speakerName: '司令官 (あなた)',
                text: 'ああ、最悪だ。身体が鉛のように重い……。ここは？',
                emotion: 'sad',
                triggerNext: 'p4'
            },
            {
                id: 'p4',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: '現在、当ステーションは軌道上をデブリとの衝突を避けながら漂流中です。地球との広域通信ネットワークは途絶しています。',
                emotion: 'serious',
                triggerNext: 'p5'
            },
            {
                id: 'p5',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: 'まずはシステムの再起動と、地表の状況確認が必要です。右側のパネルから「ミッション」を選択し、実行可能な撮像を予約してください。',
                triggerNext: 'p6'
            },
            {
                id: 'p6',
                speaker: 'system',
                speakerName: 'SYS',
                text: '>>> チュートリアル・シークエンス開始...',
                triggerNext: 'p7'
            },
            {
                id: 'p7',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: '画面右側の【MISSION LOG】パネルをご覧ください。ここには現在実行可能な極秘ミッションがリストアップされています。',
                hideBlur: true,
                highlightTarget: 'mission-panel',
                triggerNext: 'p8',
                hideCharacterImage: true
            },
            {
                id: 'p8',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: '各ミッションには目標地点（ターゲット）が設定されています。「予約する」ボタンを押し、ISSがターゲットの上空を通過する【目標時刻】をセットしてください。',
                hideBlur: true,
                highlightTarget: 'mission-panel',
                triggerNext: 'p9',
                hideCharacterImage: true
            },
            {
                id: 'p9',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: '地球の周囲に表示されている青い軌道ラインと、その上の「+15m」などの時刻マーカーが、未来の軌道を予測する助けになります。',
                hideBlur: true,
                highlightTarget: 'mission-panel',
                triggerNext: 'p10',
                hideCharacterImage: true
            },
            {
                id: 'p10',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: '画面左下の【🎯 LOCATE ISS】ボタンを押すと、いつでもカメラを現在のISS直下へ戻すことができます。',
                hideBlur: true,
                highlightTarget: 'locate-iss-btn',
                highlightPosition: 'top', // ボタンが下にあるため上から指す
                triggerNext: 'p11',
                hideCharacterImage: true
            },
            {
                id: 'p11',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: '予約時刻になり、ISSがターゲットの定まった範囲内（緑のサークル内）に近接していれば、撮像成功となりポイントを獲得できます。',
                hideBlur: true,
                highlightTarget: 'mission-panel',
                triggerNext: 'p12',
                hideCharacterImage: true
            },
            {
                id: 'p12',
                speaker: 'protag',
                speakerName: '司令官 (あなた)',
                text: 'なるほど……。軌道を読み、タイミングを合わせてターゲットをカメラに収めるわけか。',
                triggerNext: 'p13'
            },
            {
                id: 'p13',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: 'その通りです。獲得したポイントで【ENGINEERING BAY】から新たなセンサーや拡張アンテナをアンロック・装着し、ISSの機能を強化することが可能です。',
                triggerNext: 'p14'
            },
            {
                id: 'p14',
                speaker: 'ai_robot',
                speakerName: 'AI ナビゲーター',
                text: 'それでは司令官、最初のミッションの指揮をお願いします。幸運を。'
            }
        ],
        onCompleteReward: {
            // プロローグ終了後に追加されるテストのサブミッション
            newMissions: ['tutorial_sub1']
        }
    }
};
