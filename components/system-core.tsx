"use client";

import { useEffect, useRef } from "react";

export function SystemCore({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion || !mount.current) return;
    let disposed = false;
    let cleanup = () => {};
    import("three").then((THREE) => {
      if (disposed || !mount.current) return;
      try {
        const container = mount.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        camera.position.z = 5.6;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
        container.appendChild(renderer.domElement);
        const coreGeometry = new THREE.IcosahedronGeometry(1.28, 1);
        const crystal = new THREE.Mesh(coreGeometry, new THREE.MeshBasicMaterial({ color: 0x38bbff, wireframe: true, transparent: true, opacity: 0.58 }));
        const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), new THREE.MeshBasicMaterial({ color: 0x2b4dff, wireframe: true, transparent: true, opacity: 0.66 }));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.006, 3, 100), new THREE.MeshBasicMaterial({ color: 0x47cfff, transparent: true, opacity: 0.58 }));
        ring.rotation.x = Math.PI / 2.7;
        const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(1.67, 0.006, 3, 100), new THREE.MeshBasicMaterial({ color: 0x755cff, transparent: true, opacity: 0.45 }));
        ringTwo.rotation.y = Math.PI / 3;
        scene.add(crystal, inner, ring, ringTwo);
        const positions = new Float32Array(120 * 3);
        for (let i = 0; i < positions.length; i += 3) {
          const radius = 2 + Math.random() * 1.2;
          const angle = Math.random() * Math.PI * 2;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = Math.sin(angle) * radius;
          positions[i + 2] = (Math.random() - 0.5) * 2;
        }
        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: 0x8bdaff, size: 0.025, transparent: true, opacity: 0.72 }));
        scene.add(particles);
        const resize = () => {
          if (!container.isConnected) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        let frame = 0;
        const animate = () => {
          frame = requestAnimationFrame(animate);
          crystal.rotation.y += 0.004;
          crystal.rotation.x += 0.0016;
          inner.rotation.y -= 0.006;
          inner.rotation.z += 0.002;
          ring.rotation.z += 0.002;
          ringTwo.rotation.x -= 0.002;
          particles.rotation.z += 0.0007;
          renderer.render(scene, camera);
        };
        animate();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          coreGeometry.dispose();
          crystal.material.dispose();
          inner.geometry.dispose(); inner.material.dispose();
          ring.geometry.dispose(); ring.material.dispose();
          ringTwo.geometry.dispose(); ringTwo.material.dispose();
          particlesGeometry.dispose(); particles.material.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch { /* CSS fallback stays visible when WebGL is unavailable. */ }
    });
    return () => { disposed = true; cleanup(); };
  }, [reducedMotion]);
  return <div className="core-visual" aria-hidden="true"><div className="core-halo" /><div className="core-fallback" /><div ref={mount} className="core-canvas" /><div className="core-reticle core-reticle-one" /><div className="core-reticle core-reticle-two" /><div className="core-center" /></div>;
}
