// 太陽暦計算ロジック (Solar Ephemeris)
// 参考: NOAA Solar Position Algorithm / Astronomical Almanacs

export function calculateSunPosition(date: Date): [number, number, number] {
    // 1. Calculate Julian Date
    const JD = date.getTime() / 86400000 + 2440587.5;
    const n = JD - 2451545.0; // Days since J2000.0

    // 2. Mean anomaly and ecliptic longitude
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;

    const gRad = g * Math.PI / 180;
    const lambda = L + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
    const lambdaRad = lambda * Math.PI / 180;

    // 3. Obliquity of the ecliptic
    const epsilon = 23.439 - 0.0000004 * n;
    const epsilonRad = epsilon * Math.PI / 180;

    // 4. Right Ascension (RA) and Declination (Dec)
    const sinLambda = Math.sin(lambdaRad);
    let alpha = Math.atan2(Math.cos(epsilonRad) * sinLambda, Math.cos(lambdaRad));
    const delta = Math.asin(Math.sin(epsilonRad) * sinLambda); // Declination

    // 5. Greenwich Mean Sidereal Time (GMST) in radians
    const dU = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    let gmst = (18.697374558 + 24.06570982441908 * n + dU * 1.00273790935) % 24;
    if (gmst < 0) gmst += 24;
    const gmstRad = (gmst * 15) * Math.PI / 180;

    // 6. Subsolar Longitude = RA - GMST
    let lonSubsolar = alpha - gmstRad;

    // Normalize lonSubsolar to [-PI, PI]
    lonSubsolar = ((lonSubsolar + Math.PI) % (2 * Math.PI)) - Math.PI;
    if (lonSubsolar < -Math.PI) lonSubsolar += 2 * Math.PI;

    const latSubsolar = delta;

    // 7. Convert subsolar lat/lon to ECEF/local 3D vector (Radius = 1 for direction vector)
    // WGS84 coordinates in our Three.js scene: Y is Up(North), X and Z are Equatorial Plane
    // Longitude 0 is mostly at X or Z depending on our mapping, but based on CameraSync:
    // x = cos(lat)*sin(lon), z = cos(lat)*cos(lon), y = sin(lat)
    const sunX = Math.cos(latSubsolar) * Math.sin(lonSubsolar);
    const sunZ = Math.cos(latSubsolar) * Math.cos(lonSubsolar);
    const sunY = Math.sin(latSubsolar);

    return [sunX, sunY, sunZ];
}
