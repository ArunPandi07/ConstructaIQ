import React, { useMemo } from "react";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";
import type { PresentationSpec } from "../../types/presentationModel";

export function FacadeFloorBands({ spec }: { spec: PresentationSpec }) {
  const {
    stories,
    floorHeight_m,
    footprint: { width_m, depth_m },
    hasBalconies,
    balconyDepth_m,
    windowBayWidth_m,
    windowsPerBay,
    finCount,
    spandrelHeight_m,
    facade,
  } = spec;

  const totalFloors = stories;

  // Pre-calculate positions
  const floors = Array.from({ length: totalFloors }, (_, i) => i);
  
  // Calculate window bays
  const frontBays = Math.max(1, Math.floor(width_m / windowBayWidth_m));
  const sideBays = Math.max(1, Math.floor(depth_m / windowBayWidth_m));

  // Materials
  const spandrelMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2d3540", roughness: 0.8 }),
    []
  );
  const balconyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.9 }),
    []
  );
  const glassPanelMaterial = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    }),
    []
  );
  const windowFrameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1a1f2a", roughness: 0.5, metalness: 0.8 }),
    []
  );
  const windowGlassMaterial = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: "#a8d0e6",
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
    }),
    []
  );
  const finMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ 
      color: facade.material === "glass_curtain" ? "#1a1f2a" : "#f0f0f0", 
      roughness: 0.6 
    }),
    []
  );

  return (
    <group>
      {/* 1. Spandrel Bands */}
      <Instances limit={totalFloors * 4} material={spandrelMaterial}>
        <boxGeometry args={[1, spandrelHeight_m, 1]} />
        {floors.map((floor) => {
          const y = floor * floorHeight_m + floorHeight_m - spandrelHeight_m / 2;
          return (
            <group key={`spandrel-${floor}`}>
              {/* Front */}
              <Instance position={[width_m / 2, y, -0.01]} scale={[width_m, 1, 0.02]} />
              {/* Rear */}
              <Instance position={[width_m / 2, y, depth_m + 0.01]} scale={[width_m, 1, 0.02]} />
              {/* Left */}
              <Instance position={[-0.01, y, depth_m / 2]} scale={[0.02, 1, depth_m]} />
              {/* Right */}
              <Instance position={[width_m + 0.01, y, depth_m / 2]} scale={[0.02, 1, depth_m]} />
            </group>
          );
        })}
      </Instances>

      {/* 2. Balcony Slabs & Railings */}
      {hasBalconies && (
        <group>
          {/* Slabs */}
          <Instances limit={totalFloors * 2} material={balconyMaterial} castShadow receiveShadow>
            <boxGeometry args={[width_m, 0.2, balconyDepth_m]} />
            {floors.map((floor) => {
              // Skip ground floor rear balcony
              const y = floor * floorHeight_m + 0.1;
              return (
                <group key={`balcony-slab-${floor}`}>
                  <Instance position={[width_m / 2, y, balconyDepth_m / 2]} />
                  {floor > 0 && (
                    <Instance position={[width_m / 2, y, depth_m - balconyDepth_m / 2]} />
                  )}
                </group>
              );
            })}
          </Instances>

          {/* Glass Railing Panels */}
          <Instances limit={totalFloors * 2} material={glassPanelMaterial}>
            <boxGeometry args={[width_m, 1.1, 0.02]} />
            {floors.map((floor) => {
              const y = floor * floorHeight_m + 0.2 + 1.1 / 2;
              return (
                <group key={`railing-panel-${floor}`}>
                  <Instance position={[width_m / 2, y, balconyDepth_m - 0.01]} />
                  {floor > 0 && (
                    <Instance position={[width_m / 2, y, depth_m - balconyDepth_m + 0.01]} />
                  )}
                </group>
              );
            })}
          </Instances>

          {/* Top Rail (Steel) */}
          <Instances limit={totalFloors * 2} material={windowFrameMaterial}>
            <boxGeometry args={[width_m, 0.05, 0.05]} />
            {floors.map((floor) => {
              const y = floor * floorHeight_m + 0.2 + 1.1;
              return (
                <group key={`top-rail-${floor}`}>
                  <Instance position={[width_m / 2, y, balconyDepth_m - 0.01]} />
                  {floor > 0 && (
                    <Instance position={[width_m / 2, y, depth_m - balconyDepth_m + 0.01]} />
                  )}
                </group>
              );
            })}
          </Instances>
        </group>
      )}

      {/* 3. Grouped Window Bays */}
      <group>
        {/* Window Frames (instanced boxes) */}
        <Instances limit={totalFloors * (frontBays * 2 + sideBays * 2) * windowsPerBay * 4} material={windowFrameMaterial}>
          <boxGeometry args={[1, 1, 1]} />
          {floors.map((floor) => {
            const yOffset = floor * floorHeight_m;
            const windowHeight = floorHeight_m - spandrelHeight_m - 0.2; // 0.2 for sill/frame
            const windowY = yOffset + windowHeight / 2 + 0.1;
            const paneWidth = (windowBayWidth_m * 0.8) / windowsPerBay; // 80% of bay is glass
            
            const instances: React.ReactElement[] = [];
            
            // Function to generate window frame instances for a bay
            const addBayFrames = (xCenter: number, zCenter: number, isFrontRear: boolean) => {
              for (let w = 0; w < windowsPerBay; w++) {
                const paneOffset = (w - (windowsPerBay - 1) / 2) * paneWidth;
                const px = isFrontRear ? xCenter + paneOffset : xCenter;
                const pz = isFrontRear ? zCenter : zCenter + paneOffset;
                
                // Add top, bottom, left, right frame pieces
                // This is simplified; normally we'd do this cleaner, but boxGeometry scale handles it
                if (isFrontRear) {
                  instances.push(
                    <Instance key={`fw-${floor}-${px}-${pz}-t`} position={[px, windowY + windowHeight/2, pz]} scale={[paneWidth, 0.05, 0.1]} />,
                    <Instance key={`fw-${floor}-${px}-${pz}-b`} position={[px, windowY - windowHeight/2, pz]} scale={[paneWidth, 0.05, 0.1]} />,
                    <Instance key={`fw-${floor}-${px}-${pz}-l`} position={[px - paneWidth/2, windowY, pz]} scale={[0.05, windowHeight, 0.1]} />,
                    <Instance key={`fw-${floor}-${px}-${pz}-r`} position={[px + paneWidth/2, windowY, pz]} scale={[0.05, windowHeight, 0.1]} />
                  );
                } else {
                  instances.push(
                    <Instance key={`fw-${floor}-${px}-${pz}-t`} position={[px, windowY + windowHeight/2, pz]} scale={[0.1, 0.05, paneWidth]} />,
                    <Instance key={`fw-${floor}-${px}-${pz}-b`} position={[px, windowY - windowHeight/2, pz]} scale={[0.1, 0.05, paneWidth]} />,
                    <Instance key={`fw-${floor}-${px}-${pz}-l`} position={[px, windowY, pz - paneWidth/2]} scale={[0.1, windowHeight, 0.05]} />,
                    <Instance key={`fw-${floor}-${px}-${pz}-r`} position={[px, windowY, pz + paneWidth/2]} scale={[0.1, windowHeight, 0.05]} />
                  );
                }
              }
            };

            // Front face bays
            for (let b = 0; b < frontBays; b++) {
              if (floor === 0 && b === Math.floor(frontBays / 2) && spec.hasEntranceSteps) continue; // Skip for entrance
              const bx = (b + 0.5) * windowBayWidth_m;
              addBayFrames(bx, -0.02, true);
            }
            // Rear face bays
            for (let b = 0; b < frontBays; b++) {
              const bx = (b + 0.5) * windowBayWidth_m;
              addBayFrames(bx, depth_m + 0.02, true);
            }
            // Left face bays
            for (let b = 0; b < sideBays; b++) {
              const bz = (b + 0.5) * windowBayWidth_m;
              addBayFrames(-0.02, bz, false);
            }
            // Right face bays
            for (let b = 0; b < sideBays; b++) {
              const bz = (b + 0.5) * windowBayWidth_m;
              addBayFrames(width_m + 0.02, bz, false);
            }

            return <group key={`frames-${floor}`}>{instances}</group>;
          })}
        </Instances>

        {/* Window Glass Panes */}
        <Instances limit={totalFloors * (frontBays * 2 + sideBays * 2) * windowsPerBay} material={windowGlassMaterial}>
          <boxGeometry args={[1, 1, 0.02]} />
          {floors.map((floor) => {
            const yOffset = floor * floorHeight_m;
            const windowHeight = floorHeight_m - spandrelHeight_m - 0.2;
            const windowY = yOffset + windowHeight / 2 + 0.1;
            const paneWidth = (windowBayWidth_m * 0.8) / windowsPerBay;
            
            const instances: React.ReactElement[] = [];
            
            const addBayGlass = (xCenter: number, zCenter: number, isFrontRear: boolean) => {
              for (let w = 0; w < windowsPerBay; w++) {
                const paneOffset = (w - (windowsPerBay - 1) / 2) * paneWidth;
                const px = isFrontRear ? xCenter + paneOffset : xCenter;
                const pz = isFrontRear ? zCenter : zCenter + paneOffset;
                
                instances.push(
                  <Instance 
                    key={`glass-${floor}-${px}-${pz}`} 
                    position={[px, windowY, pz]} 
                    scale={isFrontRear ? [paneWidth, windowHeight, 1] : [1, windowHeight, paneWidth]} 
                  />
                );
              }
            };

            for (let b = 0; b < frontBays; b++) {
              if (floor === 0 && b === Math.floor(frontBays / 2) && spec.hasEntranceSteps) continue;
              addBayGlass((b + 0.5) * windowBayWidth_m, -0.02, true);
            }
            for (let b = 0; b < frontBays; b++) {
              addBayGlass((b + 0.5) * windowBayWidth_m, depth_m + 0.02, true);
            }
            for (let b = 0; b < sideBays; b++) {
              addBayGlass(-0.02, (b + 0.5) * windowBayWidth_m, false);
            }
            for (let b = 0; b < sideBays; b++) {
              addBayGlass(width_m + 0.02, (b + 0.5) * windowBayWidth_m, false);
            }

            return <group key={`glass-${floor}`}>{instances}</group>;
          })}
        </Instances>
      </group>

      {/* 4. Vertical Fins */}
      {finCount > 0 && (
        <Instances limit={totalFloors * finCount * 4} material={finMaterial}>
          <boxGeometry args={[1, 1, 1]} />
          {floors.map((floor) => {
            const yOffset = floor * floorHeight_m;
            const finHeight = floorHeight_m - spandrelHeight_m;
            const finY = yOffset + finHeight / 2;
            const instances = [];

            for (let i = 0; i < finCount; i++) {
              const xPos = (width_m / finCount) * i;
              const zPos = (depth_m / finCount) * i;

              // Front/Rear (project out in Z)
              instances.push(
                <Instance key={`fin-f-${floor}-${i}`} position={[xPos, finY, -0.08]} scale={[0.05, finHeight, 0.2]} />,
                <Instance key={`fin-r-${floor}-${i}`} position={[xPos, finY, depth_m + 0.08]} scale={[0.05, finHeight, 0.2]} />
              );

              // Left/Right (project out in X)
              instances.push(
                <Instance key={`fin-l-${floor}-${i}`} position={[-0.08, finY, zPos]} scale={[0.2, finHeight, 0.05]} />,
                <Instance key={`fin-rt-${floor}-${i}`} position={[width_m + 0.08, finY, zPos]} scale={[0.2, finHeight, 0.05]} />
              );
            }

            return <group key={`fins-${floor}`}>{instances}</group>;
          })}
        </Instances>
      )}
    </group>
  );
}
