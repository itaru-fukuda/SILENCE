export interface ISSPart {
    id: string;
    name: string;
    type: 'SENSOR' | 'ANTENNA' | 'THRUSTER';
    description: string;
    cost: number; // 購入に必要なスコア
    isUnlocked: boolean; // 購入可能になったかどうか（UIで見えるか）
    isPurchased: boolean; // 購入済み（所持している）かどうか
    isAttached: boolean;  // 装備中かどうか
    buffValue: number; // 例: SAR範囲+1.5倍など
}

export const partsData: Record<string, ISSPart> = {
    p1: {
        id: 'p1',
        name: 'SAR拡張レンズ',
        type: 'SENSOR',
        description: '高出力化により、撮像フットプリント（観測可能範囲）の半径を50%拡大する。',
        cost: 1000,
        isUnlocked: false,
        isPurchased: false,
        isAttached: false,
        buffValue: 1.5
    },
    p2: {
        id: 'p2',
        name: '量子通信アンテナ',
        type: 'ANTENNA',
        description: 'トラッキング・予測精度を向上させ、ミッション成功判定の許容誤差（時間・距離）を拡大する。',
        cost: 2000,
        isUnlocked: false,
        isPurchased: false,
        isAttached: false,
        buffValue: 2.0
    }
};
