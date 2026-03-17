import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { attackPoints } from '../data/mockData';

export default function Globe({ className, points = attackPoints }) {
  const mountRef = useRef(null);
  const animRef = useRef(null);
  const normalizedPoints = useMemo(() => (Array.isArray(points) && points.length ? points : attackPoints), [points]);
  const pointsSignature = useMemo(
    () => JSON.stringify(normalizedPoints.map(({ lat, lng, intensity }) => ({ lat, lng, intensity }))),
    [normalizedPoints],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Globe geometry
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a1628,
      emissive: 0x001a0a,
      wireframe: false,
      transparent: true,
      opacity: 0.92,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00ff9c,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    });
    const wireframe = new THREE.Mesh(globeGeo, wireMat);
    scene.add(wireframe);

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(1.08, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x00ff9c,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    scene.add(atmosphere);

    // Second atmosphere ring
    const atm2Geo = new THREE.SphereGeometry(1.15, 64, 64);
    const atm2Mat = new THREE.MeshPhongMaterial({
      color: 0x00b4d8,
      transparent: true,
      opacity: 0.02,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atm2Geo, atm2Mat));

    // Latitude/longitude grid lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff9c, transparent: true, opacity: 0.12 });
    for (let lat = -80; lat <= 80; lat += 20) {
      const gridPoints = [];
      for (let lng = 0; lng <= 360; lng += 2) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng) * (Math.PI / 180);
        gridPoints.push(new THREE.Vector3(
          -1.01 * Math.sin(phi) * Math.cos(theta),
          1.01 * Math.cos(phi),
          1.01 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(gridPoints), lineMat));
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const gridPoints = [];
      for (let lat = -90; lat <= 90; lat += 2) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng) * (Math.PI / 180);
        gridPoints.push(new THREE.Vector3(
          -1.01 * Math.sin(phi) * Math.cos(theta),
          1.01 * Math.cos(phi),
          1.01 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(gridPoints), lineMat));
    }

    // Attack points
    normalizedPoints.forEach(({ lat, lng, intensity }) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const r = 1.02;

      const x = -r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      // Core dot
      const ptGeo = new THREE.SphereGeometry(0.018, 8, 8);
      const color = intensity > 0.8 ? 0xff3d3d : intensity > 0.6 ? 0xffd600 : 0x00ff9c;
      const ptMat = new THREE.MeshBasicMaterial({ color });
      const point = new THREE.Mesh(ptGeo, ptMat);
      point.position.set(x, y, z);
      scene.add(point);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.025, 0.04, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      ring.lookAt(0, 0, 0);
      ring.userData = { pulse: Math.random() * Math.PI * 2, intensity };
      scene.add(ring);
    });

    // Lighting
    scene.add(new THREE.AmbientLight(0x002211, 2));
    const dirLight = new THREE.DirectionalLight(0x00ff9c, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    const blueLight = new THREE.PointLight(0x00b4d8, 1, 10);
    blueLight.position.set(-3, -2, -3);
    scene.add(blueLight);

    // Stars background
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 1500; i++) {
      starPos.push((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.015, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(starGeo, starMat));

    let t = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      t += 0.008;
      globe.rotation.y += 0.003;
      wireframe.rotation.y += 0.003;
      atmosphere.rotation.y -= 0.001;

      // Pulse rings
      scene.children.forEach(obj => {
        if (obj.userData.pulse !== undefined) {
          obj.userData.pulse += 0.04;
          const scale = 1 + Math.sin(obj.userData.pulse) * 0.4;
          obj.scale.set(scale, scale, scale);
          obj.material.opacity = (0.3 + 0.3 * Math.sin(obj.userData.pulse));
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [pointsSignature, normalizedPoints]);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
