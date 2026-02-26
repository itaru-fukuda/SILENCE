export interface Mission {
    id: string;
    name: string;
    purpose: string;
    type: 'main' | 'sub';
    lat: number;
    lon: number;
    targetTime?: number; // 予約されたUnixTime
    resultImage?: string; // 撮像成功時に表示される結果画像のパス
    rewardScore: number; // ミッション成功時に得られるスコア
    status: '未完了' | '予約済' | '成功' | '失敗';
}

export const missionData: Record<string, Mission> = {
    m1: { id: 'm1', name: '目標: 東京', purpose: '首都圏インフラ・災害状況のSARおよび光学複合観測', type: 'main', lat: 35.6895, lon: 139.6917, resultImage: '/assets/missions/m1_tokyo.png', rewardScore: 1000, status: '未完了' },
    m2: { id: 'm2', name: '目標: ロンドン', purpose: '市街地の違法・ジャミング電波源の特定および高解像度撮像', type: 'main', lat: 51.5074, lon: -0.1278, resultImage: '/assets/missions/m2_london.png', rewardScore: 1000, status: '未完了' },
    m3: { id: 'm3', name: '目標: ニューヨーク', purpose: '異常気象に伴う沿岸部の被害・浸水状況スクリーニング', type: 'sub', lat: 40.7128, lon: -74.0060, resultImage: '/assets/missions/m3_ny.png', rewardScore: 500, status: '未完了' },
    tutorial_sub1: {
        id: 'tutorial_sub1',
        name: '機器の較正テスト',
        purpose: '姿勢制御モジュールの安定性確認のため赤道付近をテスト撮像',
        type: 'sub',
        lat: 0.0,
        lon: 100.0,
        resultImage: '/assets/missions/tutorial_sub1.png',
        rewardScore: 500,
        status: '未完了'
    }
};
