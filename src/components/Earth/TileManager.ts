export class TileManager {
    private static instance: TileManager;
    private readonly maxLayers = 1024; // LODノードの最大数
    private allocMap: boolean[] = [];

    private constructor() {
        for (let i = 0; i < this.maxLayers; i++) this.allocMap.push(false);
    }

    static getInstance() {
        if (!TileManager.instance) {
            TileManager.instance = new TileManager();
        }
        return TileManager.instance;
    }

    public async requestTile(z: number, x: number, y: number, face: number): Promise<number> {
        void z; void x; void y; void face;
        const layer = this.allocMap.findIndex(val => !val);
        if (layer === -1) return -1;
        this.allocMap[layer] = true;

        return new Promise(resolve => {
            // Light delay for LOD splitting effect (no blocking main thread)
            setTimeout(() => {
                resolve(layer);
            }, 20);
        });
    }

    public releaseTile(layer: number) {
        if (layer >= 0 && layer < this.maxLayers) {
            this.allocMap[layer] = false;
        }
    }
}
