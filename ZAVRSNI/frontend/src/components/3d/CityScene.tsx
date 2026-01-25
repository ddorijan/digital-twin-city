import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { CityBuildings } from './CityBuildings';

export const CityScene = () => {
  return (
    <div className="w-full h-full">
      <Canvas 
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        }}
        dpr={[1, 1.5]}
      >
        <PerspectiveCamera makeDefault position={[80, 60, 80]} fov={50} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 6}
          minDistance={30}
          maxDistance={250}
          target={[0, 0, 0]}
        />
        
        {/* Simple sky color */}
        <color attach="background" args={['#87CEEB']} />
        
        {/* Lighting setup */}
        <ambientLight intensity={0.5} />
        
        {/* Main sun light - simplified shadows */}
        <directionalLight
          position={[50, 80, 50]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={300}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        
        {/* Fill light */}
        <directionalLight
          position={[-30, 40, -30]}
          intensity={0.3}
        />
        
        {/* City Buildings */}
        <CityBuildings />
      </Canvas>
    </div>
  );
};