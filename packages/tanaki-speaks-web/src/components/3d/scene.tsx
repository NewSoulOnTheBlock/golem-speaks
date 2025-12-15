"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, type PropsWithChildren } from "react";
import Controls from "./controls";
import Lighting from "./lighting";

function CameraLookAt({ target }: { target: [number, number, number] }) {
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateMatrixWorld();
  }, [camera, target]);

  return null;
}

export type SceneProps = PropsWithChildren<{
  className?: string;
  camera?: {
    position?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
  };
  lookAt?: [number, number, number];
  showControls?: boolean;
  showLighting?: boolean;
}>;

export default function Scene({
  className,
  camera,
  lookAt,
  showControls = true,
  showLighting = true,
  children,
}: SceneProps) {
  const defaultCamera = {
    position: (camera?.position ?? [0, 1.2, 2.5]) as [number, number, number],
    fov: camera?.fov ?? 45,
    near: camera?.near ?? 0.1,
    far: camera?.far ?? 100,
  };

  return (
    <Canvas className={className} camera={defaultCamera} shadows>
      {lookAt && <CameraLookAt target={lookAt} />}
      <Suspense fallback={null}>
        {showLighting && <Lighting />}
        {children}
        {showControls && <Controls />}
      </Suspense>
    </Canvas>
  );
}


