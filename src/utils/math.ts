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
