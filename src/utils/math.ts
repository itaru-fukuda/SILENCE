import * as THREE from 'three';

// WGS84 Earth Model parameters (km)
export const WGS84_A = 6378.137;
export const WGS84_F = 1 / 298.257223563;
export const WGS84_B = WGS84_A * (1 - WGS84_F);

// Calculates WGS84 Position from ECEF normal
export function getWGS84Position(normalizedNormal: [number, number, number]): [number, number, number] {
    return [
        normalizedNormal[0] * WGS84_A,
        normalizedNormal[1] * WGS84_B,
        normalizedNormal[2] * WGS84_A
    ];
}

/**
 * Converts Latitude and Longitude (in radians) to a True Web Mercator (EPSG:3857)
 * 2D plane coordinate system, scaled precisely to match the WGS84_A radius.
 * The output Vector3 has X = Longitude, Z = -Latitude (North is -Z), Y = 1.0 (slightly above plane).
 */
export function getMercatorCoordinates(latRad: number, lonRad: number): THREE.Vector3 {
    // Map Longitude linearly to X
    const x = lonRad * WGS84_A;

    // Map Latitude to Y using the Web Mercator formula
    // Limits applied just in case, Web Mercator goes up to ~85.05 degrees.
    const clampedLat = Math.max(-1.4844, Math.min(1.4844, latRad));
    const yMercator = Math.log(Math.tan(Math.PI / 4 + clampedLat / 2)) * WGS84_A;

    // In our 3D space, the 2D plane is usually drawn on X-Z with Y=0.
    // North is usually -Z. So Z corresponds to -yMercator.
    const z = -yMercator;

    return new THREE.Vector3(x, 1.0, z);
}
