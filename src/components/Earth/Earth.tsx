import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WGS84_A } from '../../utils/math';
import { calculateSunPosition } from '../../utils/ephemeris';
import { useGameState } from '../../providers/GameStateProvider';
import { FlatEarth } from './FlatEarth';

// Shader mapping Web Mercator Tile Sphere + Physics Shading (SAR / Optical Sunglint)
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPositionLocal;
  
  uniform float uIsSAR;

  void main() {
    vUv = uv;
    vPositionLocal = position;
    
    // Normal is conceptually outward from center for a sphere
    vNormal = normalMatrix * normal;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    
    // View direction for specular (Optical) and layover (SAR)
    vViewDir = normalize(cameraPosition - worldPos.xyz);

    // SAR Layover Implementation (Vertex Shift)
    if (uIsSAR > 0.5) {
      // Mock elevation function based on coords
      float elevation = (sin(position.x * 0.001) * cos(position.y * 0.001) * 0.5 + 0.5) * 50.0; // max 50km height
      worldPos.xyz += vViewDir * elevation; // Pull towards radar (camera)
    }

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const earthFragmentShader = `
  precision highp float;

  uniform sampler2D tBaseMap;
  uniform float uIsSAR;
  uniform vec3 uSunDir;
  uniform float uWindSpeed;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPositionLocal;

  // Simple pseudo-random for speckle
  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec4 texColor = texture(tBaseMap, vUv);
    
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    vec3 s = normalize(uSunDir);
    
    // Diffuse lighting baseline for Day/Night calculation
    float diff = max(dot(n, s), 0.0); 

    if (uIsSAR < 0.5) {
      // OPTICAL MODE (Cox-Munk sunglint physics)
      vec3 h = normalize(s + v);
      float NdotH = max(dot(n, h), 0.0);
      
      // Roughness 'm' based on wind speed
      float m = 0.02 + uWindSpeed * 0.005;
      float spec = pow(NdotH, 1.0 / (m * m));
      
      // Ocean mask approximation (blue is stronger than red/green)
      float isOcean = (texColor.b > texColor.r * 1.0 && texColor.b > texColor.g * 1.0) ? 1.0 : 0.0;
      
      // Compute day light color + slight ambient moon/starlight for night side
      vec3 ambientNight = texColor.rgb * 0.03; 
      vec3 dayColor = texColor.rgb * diff + vec3(spec * isOcean * 2.0 * diff); 
      
      vec3 finalColor = dayColor + (1.0 - diff > 0.99 ? ambientNight : vec3(0.0));
      gl_FragColor = vec4(finalColor, 1.0);
      
      // Very basic pseudo-atmosphere
      float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      gl_FragColor.rgb += vec3(0.3, 0.5, 1.0) * fresnel * 0.5 * (diff + 0.1); 

    } else {
      // SAR MODE
      float backscatter = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      
      // Multiplicative Speckle Noise
      float randomU = max(rand(vUv), 0.001);
      float speckle = -log(randomU);
      
      vec3 sarColor = vec3(backscatter * speckle);
      gl_FragColor = vec4(sarColor, 1.0);
    }
  }
`;

function createTileGeometry(z: number, x: number, y: number, segments: number = 16) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    const normals = [];

    const n = Math.pow(2, z);

    // Web Mercator Y to Lat Radian
    const tileYToLat = (ty: number) => {
        const MAX_LAT = 85.0511 * Math.PI / 180;
        let lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * ty / n)));
        if (lat > MAX_LAT) lat = MAX_LAT;
        if (lat < -MAX_LAT) lat = -MAX_LAT;
        return lat;
    };
    // Tile X to Lon Radian
    const tileXToLon = (tx: number) => (tx / n * 360 - 180) * Math.PI / 180;

    for (let iy = 0; iy <= segments; iy++) {
        const ty = y + iy / segments;
        const lat = tileYToLat(ty);

        for (let ix = 0; ix <= segments; ix++) {
            const tx = x + ix / segments;
            const lon = tileXToLon(tx);

            const e2 = 0.00669437999014;
            const N = WGS84_A / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));

            // WGS84
            const px = N * Math.cos(lat) * Math.sin(lon);
            const pz = N * Math.cos(lat) * Math.cos(lon);
            const py = N * (1 - e2) * Math.sin(lat);

            vertices.push(px, py, pz);

            // Normals
            const norm = new THREE.Vector3(px, py, pz).normalize();
            normals.push(norm.x, norm.y, norm.z);

            uvs.push(ix / segments, 1.0 - iy / segments);
        }
    }

    const indices = [];
    for (let iy = 0; iy < segments; iy++) {
        for (let ix = 0; ix < segments; ix++) {
            const a = ix + (segments + 1) * iy;
            const b = ix + (segments + 1) * (iy + 1);
            const c = (ix + 1) + (segments + 1) * (iy + 1);
            const d = (ix + 1) + (segments + 1) * iy;
            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
}

export const tileCache = new Map<string, THREE.Texture>();
export const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

export const getTileTexture = (z: number, x: number, y: number, onLoad: (tex: THREE.Texture) => void) => {
    const key = `${z}_${x}_${y}`;
    if (tileCache.has(key)) {
        const tex = tileCache.get(key)!;
        // 既にキャッシュされていれば（画像未完了でもThree.js側に任せるので）すぐにonLoadを呼ぶ
        onLoad(tex);
        return tex;
    }
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    const tex = textureLoader.load(url, (loadedTex) => {
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        onLoad(loadedTex);
    }, undefined, () => {
        onLoad(new THREE.Texture());
    });
    // 早めにカラースペースを設定しキャッシュに入れる
    tex.colorSpace = THREE.SRGBColorSpace;
    tileCache.set(key, tex);

    // 初回ロード時も、即座に空テクスチャのまま構成を完了させることで無限ロードを防ぐ
    onLoad(tex);
    return tex;
};

class QuadTreeNode {
    z: number;
    x: number;
    y: number;
    mesh: THREE.Mesh | null = null;
    children: QuadTreeNode[] = [];
    isLoading: boolean = false;
    isReady: boolean = false;
    maxDepth = 6;

    constructor(z: number, x: number, y: number) {
        this.z = z;
        this.x = x;
        this.y = y;
    }

    loadTile(materialTemplate: THREE.ShaderMaterial) {
        if (this.isLoading || this.isReady) return;
        this.isLoading = true;

        getTileTexture(this.z, this.x, this.y, (texture) => {
            this.isLoading = false;
            this.isReady = true;

            const geometry = createTileGeometry(this.z, this.x, this.y, 16);
            const mat = materialTemplate.clone();
            mat.uniforms.tBaseMap.value = texture;
            this.mesh = new THREE.Mesh(geometry, mat);
        });
    }

    release() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
            this.mesh.geometry.dispose();
            (this.mesh.material as THREE.ShaderMaterial).dispose();
            this.mesh = null;
        }
        this.children.forEach(c => c.release());
        this.children = [];
        this.isReady = false;
        this.isLoading = false;
    }
}

export function Earth() {
    const groupRef = useRef<THREE.Group>(null);
    const quadTrees = useRef<QuadTreeNode[]>([]);
    const { mapMode } = useGameState();

    const [isSAR, setIsSAR] = useState(false);

    useEffect(() => {
        const handleSAR = (e: any) => setIsSAR(e.detail.isSAR);
        window.addEventListener('TRIGGER_SAR_IMAGING', handleSAR as any);
        return () => window.removeEventListener('TRIGGER_SAR_IMAGING', handleSAR as any);
    }, []);

    const baseMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            tBaseMap: { value: new THREE.Texture() },
            uIsSAR: { value: isSAR ? 1.0 : 0.0 },
            uSunDir: { value: new THREE.Vector3(1, 0, 0).normalize() },
            uWindSpeed: { value: 15.0 }
        },
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
        side: THREE.FrontSide
    }), [isSAR]);

    useEffect(() => {
        quadTrees.current = [
            new QuadTreeNode(1, 0, 0),
            new QuadTreeNode(1, 1, 0),
            new QuadTreeNode(1, 0, 1),
            new QuadTreeNode(1, 1, 1)
        ];
        return () => {
            quadTrees.current.forEach(root => root.release());
            quadTrees.current = [];
        };
    }, []);

    useFrame(({ camera }) => {
        if (!groupRef.current) return;

        // 2Dモード時はQuadTreeの処理をスキップ
        if (mapMode === '2D') return;

        const now = new Date();
        const [sunX, sunY, sunZ] = calculateSunPosition(now);
        baseMaterial.uniforms.uSunDir.value.set(sunX, sunY, sunZ).normalize();

        const cameraPos = camera.position.clone();
        const group = groupRef.current;
        group.clear();

        const updateUniforms = (node: QuadTreeNode) => {
            if (node.mesh) {
                const mat = node.mesh.material as THREE.ShaderMaterial;
                mat.uniforms.uIsSAR.value = isSAR ? 1.0 : 0.0;
                mat.uniforms.uSunDir.value.copy(baseMaterial.uniforms.uSunDir.value);
            }
            node.children.forEach(updateUniforms);
        };
        quadTrees.current.forEach(updateUniforms);

        const processNode = (node: QuadTreeNode) => {
            if (!node.isReady && !node.isLoading) {
                node.loadTile(baseMaterial);
            }

            const n = Math.pow(2, node.z);
            const cx = node.x + 0.5;
            const cy = node.y + 0.5;
            const latC = Math.atan(Math.sinh(Math.PI * (1 - 2 * cy / n)));
            const lonC = (cx / n * 360 - 180) * Math.PI / 180;

            const e2 = 0.00669437999014;
            const N = WGS84_A / Math.sqrt(1 - e2 * Math.sin(latC) * Math.sin(latC));
            const centerVec = new THREE.Vector3(
                N * Math.cos(latC) * Math.sin(lonC),
                N * (1 - e2) * Math.sin(latC),
                N * Math.cos(latC) * Math.cos(lonC)
            );

            let dist = cameraPos.distanceTo(centerVec);
            const wantSplit = node.z < node.maxDepth && dist < 20000 / Math.pow(1.5, node.z);

            if (wantSplit) {
                if (node.children.length === 0) {
                    node.children = [
                        new QuadTreeNode(node.z + 1, node.x * 2, node.y * 2),
                        new QuadTreeNode(node.z + 1, node.x * 2 + 1, node.y * 2),
                        new QuadTreeNode(node.z + 1, node.x * 2, node.y * 2 + 1),
                        new QuadTreeNode(node.z + 1, node.x * 2 + 1, node.y * 2 + 1)
                    ];
                }
                let allReady = true;
                node.children.forEach(c => {
                    if (!c.isReady) {
                        allReady = false;
                        if (!c.isLoading) c.loadTile(baseMaterial);
                    }
                });

                if (!allReady) {
                    if (node.isReady && node.mesh) group.add(node.mesh);
                } else {
                    node.children.forEach(processNode);
                }
            } else {
                if (node.children.length > 0) {
                    node.children.forEach(c => c.release());
                    node.children = [];
                }
                if (node.isReady && node.mesh) group.add(node.mesh);
            }
        };

        quadTrees.current.forEach(processNode);
    });

    if (mapMode === '2D') {
        return <FlatEarth />;
    }

    return <group ref={groupRef} />;
}
