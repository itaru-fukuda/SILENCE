import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { getTileTexture } from './Earth';
import { WGS84_A } from '../../utils/math';

function MapTile({ tileX, tileY, posX, posZ, size }: { tileX: number, tileY: number, posX: number, posZ: number, size: number }) {
    // 3D側のキャッシュから直接THREE.Textureを受け取る。
    // ロードが完了していなくても、Three.js側が内部的に監視し、画像完了時に自動再描画される。
    const texture = getTileTexture(1, tileX, tileY, () => { });

    return (
        <mesh position={[posX, 0, posZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[size, size, 32, 32]} />
            {/* Color grading approximation to match 3D globe somewhat */}
            <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
    );
}

export function FlatEarth() {
    // 地球の円周（赤道長） = 幅と高さの基準
    const EARTH_CIRCUMFERENCE = 2 * Math.PI * WGS84_A;

    // ズームレベル1のタイルは地球全域を2×2の4枚(幅=円周の半分)でカバーする
    const tileSize = EARTH_CIRCUMFERENCE / 2;
    const offset = tileSize / 2;

    return (
        <group>
            {/* 4枚のArcGISタイル平面を並べる */}
            {/* Top-Left: 北半球・西側 (x=0, y=0) */}
            <MapTile tileX={0} tileY={0} posX={-offset} posZ={-offset} size={tileSize} />

            {/* Top-Right: 北半球・東側 (x=1, y=0) */}
            <MapTile tileX={1} tileY={0} posX={offset} posZ={-offset} size={tileSize} />

            {/* Bottom-Left: 南半球・西側 (x=0, y=1) */}
            <MapTile tileX={0} tileY={1} posX={-offset} posZ={offset} size={tileSize} />

            {/* Bottom-Right: 南半球・東側 (x=1, y=1) */}
            <MapTile tileX={1} tileY={1} posX={offset} posZ={offset} size={tileSize} />

            {/* Earth全体を照らすアンビエントライト */}
            <ambientLight intensity={1.5} />
        </group>
    );
}
