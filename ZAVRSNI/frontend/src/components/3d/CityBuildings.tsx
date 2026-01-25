import { useCityStore } from '../../store/cityStore';
import { Text } from '@react-three/drei';

// Realistic Đakovo city center layout
// Koordinate: Trg Pape Ivana Pavla II - centar

// Main streets and roads
const streets = [
  // Horizontal streets (East-West)
  { position: [0, 0.01, 0], size: [80, 0.05, 8], name: 'Trg Pape Ivana Pavla II' },
  { position: [0, 0.01, 25], size: [60, 0.05, 6], name: 'Korzo' },
  { position: [0, 0.01, -25], size: [60, 0.05, 6], name: 'Ulica kralja Tomislava' },
  
  // Vertical streets (North-South)
  { position: [-30, 0.01, 0], size: [6, 0.05, 70] },
  { position: [30, 0.01, 0], size: [6, 0.05, 70] },
  { position: [0, 0.01, 0], size: [6, 0.05, 50] },
];

// Sidewalks
const sidewalks = [
  // Around main square
  { position: [-35, 0.02, 0], size: [3, 0.03, 25] },
  { position: [35, 0.02, 0], size: [3, 0.03, 25] },
];

// Buildings with realistic Đakovo architecture
const buildings = [
  // Katedrala Sv. Petra (Cathedral) - iconic red brick towers
  { 
    position: [-15, 25, 5], 
    size: [18, 50, 22], 
    color: '#8b4513',
    name: 'Katedrala Sv. Petra',
    hasRoof: true,
    roofColor: '#654321'
  },
  
  // Bishop's Palace
  { 
    position: [-35, 7, 5], 
    size: [15, 14, 18], 
    color: '#daa520',
    name: 'Biskupski dvor',
    hasRoof: true,
    roofColor: '#8b0000'
  },
  
  // Main square buildings - north side
  { position: [-20, 5, -15], size: [12, 10, 8], color: '#f4e4c1', hasRoof: true, roofColor: '#8b0000' },
  { position: [-8, 6, -15], size: [10, 12, 8], color: '#e8d5b7', hasRoof: true, roofColor: '#a0522d' },
  { position: [5, 5, -15], size: [12, 10, 8], color: '#f4e4c1', hasRoof: true, roofColor: '#8b0000' },
  { position: [18, 6, -15], size: [10, 12, 8], color: '#d4a574', hasRoof: true, roofColor: '#a0522d' },
  
  // Main square buildings - south side  
  { position: [-22, 5, 20], size: [10, 10, 8], color: '#e8d5b7', hasRoof: true, roofColor: '#8b0000' },
  { position: [-10, 6, 20], size: [11, 12, 8], color: '#f4e4c1', hasRoof: true, roofColor: '#a0522d' },
  { position: [3, 5, 20], size: [10, 10, 8], color: '#d4a574', hasRoof: true, roofColor: '#8b0000' },
  { position: [15, 6, 20], size: [11, 12, 8], color: '#e8d5b7', hasRoof: true, roofColor: '#a0522d' },
  { position: [28, 5, 20], size: [9, 10, 8], color: '#f4e4c1', hasRoof: true, roofColor: '#8b0000' },
  
  // Korzo area - east side
  { position: [40, 6, 25], size: [10, 12, 10], color: '#f5deb3', hasRoof: true, roofColor: '#8b4513' },
  { position: [40, 5, 35], size: [10, 10, 8], color: '#e8d5b7', hasRoof: true, roofColor: '#a0522d' },
  
  // Korzo area - west side
  { position: [-40, 6, 25], size: [10, 12, 10], color: '#daa520', hasRoof: true, roofColor: '#8b0000' },
  { position: [-40, 5, 35], size: [10, 10, 8], color: '#f4e4c1', hasRoof: true, roofColor: '#a0522d' },
  
  // Residential buildings - background
  { position: [50, 8, 0], size: [12, 16, 15], color: '#c9b18a', hasRoof: true, roofColor: '#8b0000' },
  { position: [-50, 8, 0], size: [12, 16, 15], color: '#d4a574', hasRoof: true, roofColor: '#a0522d' },
  { position: [0, 7, 45], size: [20, 14, 12], color: '#f4e4c1', hasRoof: true, roofColor: '#8b4513' },
  { position: [0, 7, -40], size: [18, 14, 12], color: '#e8d5b7', hasRoof: true, roofColor: '#8b0000' },
];

// Green spaces
const greenSpaces = [
  { position: [25, 0.02, -5], size: [8, 0.03, 8] },
  { position: [-25, 0.02, -5], size: [8, 0.03, 8] },
];

export const CityBuildings = () => {
  const cityData = useCityStore((state) => state.cityData);

  return (
    <group>
      {/* Ground - grass/earth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#4a5a3c" roughness={0.9} />
      </mesh>

      {/* Streets - asphalt */}
      {streets.map((street, index) => (
        <mesh
          key={`street-${index}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={street.position as [number, number, number]}
          receiveShadow
        >
          <boxGeometry args={street.size as [number, number, number]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
        </mesh>
      ))}

      {/* Sidewalks */}
      {sidewalks.map((walk, index) => (
        <mesh
          key={`walk-${index}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={walk.position as [number, number, number]}
          receiveShadow
        >
          <boxGeometry args={walk.size as [number, number, number]} />
          <meshStandardMaterial color="#888888" roughness={0.7} />
        </mesh>
      ))}

      {/* Green spaces */}
      {greenSpaces.map((green, index) => (
        <mesh
          key={`green-${index}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={green.position as [number, number, number]}
          receiveShadow
        >
          <boxGeometry args={green.size as [number, number, number]} />
          <meshStandardMaterial color="#2d5016" roughness={0.9} />
        </mesh>
      ))}

      {/* Buildings with roofs */}
      {buildings.map((building, index) => (
        <group key={`building-${index}`}>
          {/* Main building */}
          <mesh
            position={building.position as [number, number, number]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={building.size as [number, number, number]} />
            <meshStandardMaterial 
              color={building.color}
              roughness={0.7}
              metalness={0.1}
            />
          </mesh>
          
          {/* Roof */}
          {building.hasRoof && (
            <mesh
              position={[
                building.position[0],
                building.position[1] + building.size[1] / 2 + 1,
                building.position[2]
              ]}
              castShadow
              rotation={[0, Math.PI / 4, 0]}
            >
              <coneGeometry args={[building.size[0] * 0.7, building.size[1] * 0.15, 4]} />
              <meshStandardMaterial 
                color={building.roofColor}
                roughness={0.6}
              />
            </mesh>
          )}
          
          {/* Building name label (for cathedral) */}
          {building.name && (
            <Text
              position={[
                building.position[0],
                building.position[1] + building.size[1] / 2 + 5,
                building.position[2]
              ]}
              fontSize={2}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {building.name}
            </Text>
          )}
        </group>
      ))}

      {/* Sensor markers with glow effect */}
      {cityData?.locations.map((location) => {
        // Convert lat/lng to approximate 3D position (scaled better)
        const x = (location.lng - 18.4103) * 3000;
        const z = -(location.lat - 45.3089) * 3000;
        
        let color = '#3b82f6';
        if (location.type === 'traffic') color = '#ef4444';
        if (location.type === 'environment') color = '#10b981';
        if (location.type === 'parking') color = '#f59e0b';
        if (location.type === 'energy') color = '#8b5cf6';

        return (
          <group key={location.id}>
            {/* Sensor sphere */}
            <mesh position={[x, 3, z]}>
              <sphereGeometry args={[1.2, 16, 16]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={0.8}
                transparent
                opacity={0.9}
              />
            </mesh>
            
            {/* Glow ring */}
            <mesh position={[x, 0.1, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 2.5, 32]} />
              <meshBasicMaterial 
                color={color}
                transparent
                opacity={0.3}
              />
            </mesh>
            
            {/* Location label */}
            <Text
              position={[x, 5, z]}
              fontSize={0.8}
              color="#ffffff"
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {location.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
};
