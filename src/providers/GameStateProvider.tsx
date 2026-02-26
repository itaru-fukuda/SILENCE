import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as satellite from 'satellite.js';
import type { Mission } from '../data/mission';
import { missionData } from '../data/mission';
import type { ISSPart } from '../data/parts';
import { partsData } from '../data/parts';

export type GameMode = 'SIM' | 'ADV';
export type MapMode = '3D' | '2D';

interface GameState {
    gameMode: GameMode;
    mapMode: MapMode;
    currentScenarioId: string | null;
    missions: Mission[];
    parts: ISSPart[];
    score: number;
    scheduleMission: (id: string, time: number) => void;
    updateMissionStatus: (id: string, status: Mission['status']) => void;
    addMissions: (missionIds: string[]) => void;
    togglePartAttachment: (id: string) => void;
    unlockPart: (id: string) => void;
    buyPart: (id: string) => void;
    addScore: (points: number) => void;
    startScenario: (scenarioId: string) => void;
    completeScenario: () => void;
    toggleMapMode: () => void;
}

const defaultState: GameState = {
    gameMode: 'ADV', // 初期モードはプロローグ用
    mapMode: '3D', // デフォルトは3Dマップ
    currentScenarioId: 'prologue',
    missions: [
        missionData['m1'],
        missionData['m2'],
        missionData['m3']
    ],
    parts: [
        partsData['p1'],
        partsData['p2']
    ],
    score: 0,
    scheduleMission: () => { },
    updateMissionStatus: () => { },
    addMissions: () => { },
    togglePartAttachment: () => { },
    unlockPart: () => { },
    buyPart: () => { },
    addScore: () => { },
    startScenario: () => { },
    completeScenario: () => { },
    toggleMapMode: () => { },
};

const GameStateContext = createContext<GameState>(defaultState);

export const useGameState = () => useContext(GameStateContext);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gameMode, setGameMode] = useState<GameMode>(defaultState.gameMode);
    const [mapMode, setMapMode] = useState<MapMode>(defaultState.mapMode);
    const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(defaultState.currentScenarioId);
    const [missions, setMissions] = useState<Mission[]>(defaultState.missions);
    const [parts, setParts] = useState<ISSPart[]>(defaultState.parts);
    const [score, setScore] = useState<number>(0);

    const partsRef = useRef(parts);
    useEffect(() => { partsRef.current = parts; }, [parts]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setMissions(prev => {
                let changed = false;
                let addPoints = 0;
                let newlyUnlocked: string[] = [];

                const next = prev.map(m => {
                    if (m.status === '予約済' && m.targetTime && m.targetTime <= now) {
                        changed = true;

                        // === 距離判定の実行 ===
                        const tleLine1 = '1 25544U 98067A   23272.56475694  .00015504  00000-0  28173-3 0  9997';
                        const tleLine2 = '2 25544  51.6416 288.0827 0005703 147.2345 328.6775 15.50293635418146';
                        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
                        const d = new Date(m.targetTime);
                        const positionAndVelocity = satellite.propagate(satrec, d);

                        let isSuccess = false;
                        if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
                            const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
                            const gmst = satellite.gstime(d);
                            const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                            const issLat = positionGd.latitude * 180 / Math.PI;
                            const issLon = positionGd.longitude * 180 / Math.PI;

                            // 単純なユークリッド距離（度数）で近似判定
                            const dist = Math.sqrt(Math.pow(issLat - m.lat, 2) + Math.pow(issLon - m.lon, 2));

                            // 基本の許容距離（度数）
                            let threshold = 15.0;
                            // パーツによるバフ計算
                            const sensorBuff = partsRef.current.reduce((acc, p) => (p.isAttached && p.type === 'SENSOR' ? acc * p.buffValue : acc), 1.0);
                            const antennaBuff = partsRef.current.reduce((acc, p) => (p.isAttached && p.type === 'ANTENNA' ? acc * p.buffValue : acc), 1.0);

                            threshold *= sensorBuff * antennaBuff;
                            isSuccess = dist <= threshold;

                            console.log(`[EVALUATION] Mission: ${m.name}, Dist: ${dist.toFixed(2)}, Threshold: ${threshold.toFixed(2)} -> ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
                        }

                        if (isSuccess) {
                            addPoints += m.rewardScore;
                            if (m.id === 'm1') newlyUnlocked.push('p1');
                            if (m.id === 'm2') newlyUnlocked.push('p2');
                            return { ...m, status: '成功' as Mission['status'] };
                        } else {
                            // 失敗時は再度挑戦できるようにPENDINGに戻すか、FAILEDにする。今回はFAILED。
                            return { ...m, status: '失敗' as Mission['status'] };
                        }
                    }
                    return m;
                });

                if (changed) {
                    if (addPoints > 0) setScore(s => s + addPoints);
                    if (newlyUnlocked.length > 0) {
                        setParts(pt => pt.map(p => newlyUnlocked.includes(p.id) ? { ...p, isUnlocked: true } : p));
                    }
                    return next;
                }
                return prev;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const scheduleMission = (id: string, time: number) => {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, targetTime: time, status: '予約済' } : m));
    };

    const updateMissionStatus = (id: string, status: Mission['status']) => {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    };

    const addMissions = (missionIds: string[]) => {
        setMissions(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const distinctNew = missionIds
                .map(id => missionData[id])
                .filter(m => m !== undefined && !existingIds.has(m.id));
            return [...prev, ...distinctNew];
        });
    };

    const togglePartAttachment = (id: string) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, isAttached: !p.isAttached } : p));
    };

    const unlockPart = (id: string) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, isUnlocked: true } : p));
    };

    const buyPart = (id: string) => {
        setParts(prev => {
            const part = prev.find(p => p.id === id);
            if (part && score >= part.cost && !part.isPurchased) {
                setScore(s => s - part.cost);
                return prev.map(p => p.id === id ? { ...p, isPurchased: true } : p);
            }
            return prev;
        });
    };

    const addScore = (points: number) => {
        setScore(prev => prev + points);
    };

    const startScenario = (id: string) => {
        setCurrentScenarioId(id);
        setGameMode('ADV');
    };

    const completeScenario = () => {
        setCurrentScenarioId(null);
        setGameMode('SIM');
    };

    const toggleMapMode = () => {
        setMapMode(prev => prev === '3D' ? '2D' : '3D');
    };

    return (
        <GameStateContext.Provider value={{
            gameMode, mapMode, currentScenarioId, missions, parts, score,
            scheduleMission, updateMissionStatus, addMissions, togglePartAttachment, unlockPart, buyPart, addScore,
            startScenario, completeScenario, toggleMapMode
        }}>
            {children}
        </GameStateContext.Provider>
    );
};
