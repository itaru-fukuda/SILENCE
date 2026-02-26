---
name: Orbital Mechanics
description: satellite.jsを使用してTLEから衛星の現在位置（ECI/ECEF/経緯度）を算出するスキル
---

# Skill: Orbital Mechanics

## 概要
`satellite.js` を使用して、TLE (Two-Line Elements) から衛星の現在位置を算出する専門スキル。

## 機能要件
1. **TLEの取得と伝播**
   - Celestrak API 等から最新の ISS TLE を取得する。
   - SGP4 モデルで秒単位の軌道伝播（Propagation）を行う。
2. **座標変換**
   - TEME (True Equator, Mean Equinox) 座標系から ECI, ECEF を経由し、WGS84 経緯度 (Latitude, Longitude, Altitude) への変換ロジックを確実に含めること。
3. **計算精度**
   - 誤差をなくすため、計算基盤は `.agent/rules/physics_constants.md` に従い倍精度 (`Float64Array`等) を使用する。

## 実装例 (Reference)
```javascript
import * as satellite from 'satellite.js';

// TLEデータを用いた初期化
const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

// 現在時刻での位置・速度計算
const positionAndVelocity = satellite.propagate(satrec, new Date());
const positionEci = positionAndVelocity.position;

// GMST計算
const gmst = satellite.gstime(new Date());

// ECIから緯度/経度/高度へ変換
const positionGd = satellite.eciToGeodetic(positionEci, gmst);
const longitude = satellite.degreesLong(positionGd.longitude);
const latitude  = satellite.degreesLat(positionGd.latitude);
const height    = positionGd.height;
```
