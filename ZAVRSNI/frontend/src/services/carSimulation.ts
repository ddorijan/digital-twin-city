import type { CityData } from '../types';

export type CarType = 'car' | 'taxi' | 'bus';
export type CarState = 'driving' | 'seeking_parking' | 'rerouting' | 'parked';

export interface TrafficIncident {
  id: string;
  lat: number;
  lng: number;
}

export interface RouteInfo {
  coords: [number, number][];   // [lng, lat]
  cumDist: number[];             // cumulative metres
  totalDist: number;
}

export interface SimCar {
  id: string;
  type: CarType;
  color: string;
  routeId: number;
  distAlongRoute: number;
  routeInfo: RouteInfo | null;  // null = route not yet loaded → car invisible
  lat: number;
  lng: number;
  bearing: number;
  state: CarState;
  canPark: boolean;             // only ~10 % of non-bus cars may seek parking
  targetParking: { lat: number; lng: number; name: string } | null;
  parkedUntil: number;
  /** Road-snapped route to the parking lot (fetched async via Mapbox Directions). */
  parkingRouteInfo: RouteInfo | null;
  /** Distance travelled along parkingRouteInfo (metres). */
  parkingDistAlongRoute: number;
  /** Detour generated after a traffic incident blocks the current route. */
  detourRouteInfo: RouteInfo | null;
  detourDistAlongRoute: number;
  incidentId: string | null;
  /** Timestamp when the car entered rerouting; used for an on-road fallback. */
  rerouteStartedAt: number;
}

// ─── Route waypoints ──────────────────────────────────────────────────────────
// Each route is a loop: last waypoint ≈ first waypoint.
// All coordinates use real road intersections in Đakovo.
// Mapbox Directions API snaps these to driveable roads.
//
// City extent: W 18.393 · E 18.431 · N 45.322 · S 45.292
//
// Route 0 – Main E-W spine  (west exit ↔ east industrial)
// Route 1 – Main N-S spine  (north residential ↔ south Vinkovci exit)
// Route 2 – North residential loop  (hospital area + north neighbourhoods)
// Route 3 – Bus major circuit  (large outer loop serving whole city)
// Route 4 – NW neighbourhood  (Ulica V. Nazora area)
// Route 5 – NE quarter  (road toward Osijek / Đakovačka Biskupija)
// Route 6 – SE industrial + south residential
// Route 7 – SW residential  (towards Vinkovci road from the west)
// Route 8 – Inner city ring  (around Cathedral / Trg)
// Route 9 – Full outer bypass ring

export const ROUTE_WAYPOINTS: [number, number][][] = [
  // Route 0: Full E-W spine – west exit (D7 road) to east industrial zone
  [
    [18.3932, 45.3090],   // W city exit (toward Đurđanci)
    [18.3990, 45.3090],   // W residential junction
    [18.4055, 45.3090],   // west-centre
    [18.4107, 45.3089],   // main square
    [18.4175, 45.3082],   // east bypass junction
    [18.4260, 45.3078],   // east industrial zone
    [18.4310, 45.3074],   // far east (road toward Osijek industrial)
    [18.4260, 45.3078],   // back east junction
    [18.4175, 45.3082],   // back east bypass
    [18.4107, 45.3089],   // centre
    [18.4055, 45.3090],   // west-centre
    [18.3990, 45.3090],   // W residential
    [18.3932, 45.3090],   // loop end
  ],
  // Route 1: Full N-S spine – north residential to south Vinkovci road
  [
    [18.4103, 45.3220],   // far north (end of Đakovo urban area)
    [18.4103, 45.3180],   // north residential
    [18.4103, 45.3140],   // hospital area
    [18.4103, 45.3089],   // centre / cathedral
    [18.4103, 45.3040],   // south junction
    [18.4103, 45.2980],   // south residential
    [18.4103, 45.2930],   // south city exit (toward Vinkovci)
    [18.4103, 45.2980],   // back south residential
    [18.4103, 45.3040],   // back south junction
    [18.4103, 45.3089],   // centre
    [18.4103, 45.3140],   // hospital
    [18.4103, 45.3180],   // north residential
    [18.4103, 45.3220],   // loop end
  ],
  // Route 2: North residential loop – hospital + north neighbourhoods
  [
    [18.4020, 45.3155],   // NW hospital approach
    [18.4060, 45.3185],   // north junction
    [18.4103, 45.3210],   // far north
    [18.4150, 45.3195],   // NE residential
    [18.4170, 45.3160],   // east north
    [18.4130, 45.3135],   // back SE
    [18.4103, 45.3130],   // south of hospital
    [18.4060, 45.3140],   // west side hospital
    [18.4020, 45.3155],   // loop end
  ],
  // Route 3: Bus major circuit – covers all city quadrants
  [
    [18.4000, 45.3095],   // W centre
    [18.3970, 45.3120],   // NW corner
    [18.3960, 45.3160],   // far NW
    [18.4020, 45.3200],   // north-NW
    [18.4103, 45.3220],   // far north
    [18.4200, 45.3195],   // NE
    [18.4270, 45.3155],   // far NE (Osijek road)
    [18.4300, 45.3095],   // east
    [18.4280, 45.3020],   // SE industrial
    [18.4200, 45.2960],   // far SE
    [18.4103, 45.2930],   // south exit
    [18.4010, 45.2960],   // SW
    [18.3940, 45.3020],   // far SW
    [18.3920, 45.3095],   // W exit
    [18.4000, 45.3095],   // loop end
  ],
  // Route 4: NW neighbourhood – Ulica V. Nazora / Antuna Mihanovića area
  [
    [18.3960, 45.3105],   // W entrance
    [18.3952, 45.3140],   // NW corner
    [18.3980, 45.3165],   // north NW
    [18.4025, 45.3160],   // north junction
    [18.4060, 45.3145],   // inner north
    [18.4060, 45.3110],   // south inner
    [18.4020, 45.3095],   // back W
    [18.3960, 45.3105],   // loop end
  ],
  // Route 5: NE quarter – Đakovačka Biskupija + road toward Osijek
  [
    [18.4140, 45.3110],   // NE centre junction
    [18.4180, 45.3130],   // NE residential
    [18.4230, 45.3140],   // outer NE
    [18.4270, 45.3125],   // Osijek road approach
    [18.4270, 45.3090],   // east road
    [18.4220, 45.3080],   // back SE
    [18.4170, 45.3082],   // east bypass
    [18.4140, 45.3090],   // east centre
    [18.4140, 45.3110],   // loop end
  ],
  // Route 6: SE industrial + south residential
  [
    [18.4140, 45.3082],   // E centre junction
    [18.4200, 45.3068],   // SE outer
    [18.4250, 45.3045],   // industrial SE
    [18.4240, 45.2990],   // far SE
    [18.4180, 45.2960],   // south industrial
    [18.4103, 45.2960],   // south residential
    [18.4060, 45.2990],   // SW south
    [18.4070, 45.3040],   // back north
    [18.4107, 45.3060],   // S centre
    [18.4140, 45.3082],   // loop end
  ],
  // Route 7: SW residential – toward Vinkovci road from west side
  [
    [18.4050, 45.3085],   // W centre junction
    [18.4000, 45.3060],   // SW junction
    [18.3960, 45.3040],   // far SW
    [18.3950, 45.2995],   // south-W
    [18.3985, 45.2965],   // SW residential south
    [18.4050, 45.2955],   // south centre-W
    [18.4103, 45.2960],   // south axis
    [18.4070, 45.3000],   // back north
    [18.4050, 45.3050],   // north recovery
    [18.4050, 45.3085],   // loop end
  ],
  // Route 8: Inner city ring – around Cathedral, Trg, Korzo
  [
    [18.4055, 45.3112],   // NW inner
    [18.4083, 45.3125],   // north inner
    [18.4120, 45.3118],   // NE inner
    [18.4150, 45.3100],   // E inner
    [18.4148, 45.3078],   // SE inner
    [18.4120, 45.3060],   // south inner E
    [18.4083, 45.3055],   // south inner
    [18.4055, 45.3068],   // SW inner
    [18.4040, 45.3089],   // W inner
    [18.4055, 45.3112],   // loop end
  ],
  // Route 9: Full outer bypass ring – entire city perimeter
  [
    [18.3932, 45.3095],   // W city exit
    [18.3940, 45.3155],   // NW outer
    [18.3970, 45.3195],   // far NW
    [18.4040, 45.3220],   // north outer W
    [18.4103, 45.3230],   // far north outer
    [18.4180, 45.3210],   // north outer E
    [18.4260, 45.3170],   // NE outer
    [18.4310, 45.3100],   // far E
    [18.4310, 45.3020],   // SE outer
    [18.4250, 45.2950],   // far SE
    [18.4150, 45.2910],   // south outer E
    [18.4103, 45.2900],   // far south
    [18.4040, 45.2915],   // south outer W
    [18.3960, 45.2970],   // SW outer
    [18.3920, 45.3040],   // far SW
    [18.3915, 45.3095],   // W outer
    [18.3932, 45.3095],   // loop end
  ],
];

// Fallback distances (metres) used only to spread cars before API responds
const EST_DIST = [5200, 6400, 2600, 12000, 2200, 3200, 4800, 4200, 3000, 16000];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt(
    Math.pow((lat2 - lat1) * 111_000, 2) +
    Math.pow((lng2 - lng1) *  78_500, 2),
  );
}

function calcBearing(lat0: number, lng0: number, lat1: number, lng1: number): number {
  const b = Math.atan2((lng1 - lng0) * 78_500, (lat1 - lat0) * 111_000) * (180 / Math.PI);
  return b < 0 ? b + 360 : b;
}

// Smallest angle (0-180°) between two compass bearings
function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Point on `route` closest to (lat, lng) - used to rejoin a car onto its
// original loop at its current physical position rather than a stale distance.
function nearestDistAlongRoute(route: RouteInfo, lat: number, lng: number): number {
  let closestIndex = 0;
  let closestDistance = Infinity;
  route.coords.forEach(([clng, clat], index) => {
    const d = mDist(lat, lng, clat, clng);
    if (d < closestDistance) {
      closestDistance = d;
      closestIndex = index;
    }
  });
  return route.cumDist[closestIndex];
}

export function buildRouteInfo(coords: [number, number][]): RouteInfo {
  const cumDist: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng0, lat0] = coords[i - 1];
    const [lng1, lat1] = coords[i];
    cumDist.push(cumDist[i - 1] + mDist(lat0, lng0, lat1, lng1));
  }
  return { coords, cumDist, totalDist: cumDist[cumDist.length - 1] };
}

function posOnRoute(ri: RouteInfo, dist: number): { lng: number; lat: number; bearing: number } {
  const d  = ((dist % ri.totalDist) + ri.totalDist) % ri.totalDist;
  let lo = 0, hi = ri.cumDist.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ri.cumDist[mid] <= d) lo = mid; else hi = mid - 1;
  }
  const cd0  = ri.cumDist[lo];
  const cd1  = ri.cumDist[lo + 1] ?? cd0 + 1;
  const t    = cd1 === cd0 ? 0 : (d - cd0) / (cd1 - cd0);
  const curr = ri.coords[lo];
  const next = ri.coords[Math.min(lo + 1, ri.coords.length - 1)];
  return {
    lng:     curr[0] + (next[0] - curr[0]) * t,
    lat:     curr[1] + (next[1] - curr[1]) * t,
    bearing: calcBearing(curr[1], curr[0], next[1], next[0]),
  };
}

function pointHitsIncident(lat: number, lng: number, incidents: TrafficIncident[], radius: number): boolean {
  return incidents.some((incident) => mDist(lat, lng, incident.lat, incident.lng) < radius);
}

function routeHitsIncident(route: RouteInfo, incident: TrafficIncident, radius = 90): boolean {
  for (let i = 0; i < route.coords.length; i++) {
    const [lng, lat] = route.coords[i];
    if (mDist(lat, lng, incident.lat, incident.lng) < radius) return true;
    if (i === 0) continue;
    const [lng0, lat0] = route.coords[i - 1];
    const segLen = mDist(lat0, lng0, lat, lng);
    const steps = Math.max(1, Math.ceil(segLen / 18));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      if (mDist(lat0 + (lat - lat0) * t, lng0 + (lng - lng0) * t, incident.lat, incident.lng) < radius) {
        return true;
      }
    }
  }
  return false;
}

export function routeHitsAnyIncident(route: RouteInfo, incidents: TrafficIncident[], radius = 90): boolean {
  return incidents.some((incident) => routeHitsIncident(route, incident, radius));
}

export function nearbyRoadVias(routes: RouteInfo[], incidents: TrafficIncident[], limit = 4): [number, number][] {
  const scored: Array<{ point: [number, number]; score: number }> = [];
  routes.forEach((route) => {
    const blocked = routeHitsAnyIncident(route, incidents, 90);
    route.coords.forEach(([lng, lat]) => {
      const distance = Math.min(
        ...incidents.map((incident) => mDist(lat, lng, incident.lat, incident.lng)),
      );
      if (distance < 450 || distance > 1800) return;
      scored.push({
        point: [lng, lat],
        score: Math.abs(distance - 900) + (blocked ? 2500 : 0),
      });
    });
  });
  scored.sort((a, b) => a.score - b.score);
  const unique: [number, number][] = [];
  for (const item of scored) {
    if (unique.some((point) => mDist(point[1], point[0], item.point[1], item.point[0]) < 220)) continue;
    unique.push(item.point);
    if (unique.length >= limit) break;
  }
  return unique;
}

function nearbyRoadVia(routes: RouteInfo[], incidents: TrafficIncident[]): [number, number] | null {
  return nearbyRoadVias(routes, incidents, 1)[0] ?? null;
}

function aheadDistance(route: RouteInfo, fromDist: number, toDist: number): number {
  return ((toDist - fromDist) % route.totalDist + route.totalDist) % route.totalDist;
}

function incidentDistanceOnRoute(route: RouteInfo, incident: TrafficIncident): number | null {
  let bestDist: number | null = null;
  let bestScore = Infinity;
  route.coords.forEach(([lng, lat], index) => {
    const score = mDist(lat, lng, incident.lat, incident.lng);
    if (score < bestScore) {
      bestScore = score;
      bestDist = route.cumDist[index];
    }
  });
  return bestScore < 180 ? bestDist : null;
}

export function getDetourDestination(
  car: SimCar,
  incidents: TrafficIncident[],
  routes: RouteInfo[] = [],
): { lng: number; lat: number } | null {
  if (!car.routeInfo || incidents.length === 0) return null;
  if (!routeHitsAnyIncident(car.routeInfo, incidents, 90)) return null;
  const route = car.routeInfo;
  const start = car.distAlongRoute;
  const step = 25;
  let seenIncident = false;
  let clearRun = 0;
  for (let travelled = 80; travelled < route.totalDist; travelled += step) {
    const pos = posOnRoute(route, start + travelled);
    const hit = pointHitsIncident(pos.lat, pos.lng, incidents, 160);
    if (hit) {
      seenIncident = true;
      clearRun = 0;
      continue;
    }
    if (seenIncident) {
      clearRun += step;
      if (clearRun >= 900) return { lng: pos.lng, lat: pos.lat };
    }
  }
  const farVia = nearbyRoadVias(routes, incidents, 1)[0];
  if (farVia) return { lng: farVia[0], lat: farVia[1] };
  const fallback = posOnRoute(route, start + 1600);
  if (pointHitsIncident(fallback.lat, fallback.lng, incidents, 160)) return null;
  return { lng: fallback.lng, lat: fallback.lat };
}

export async function fetchIncidentDetour(
  token: string,
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number,
  vias: [number, number][],
  incidents: TrafficIncident[],
): Promise<RouteInfo | null> {
  const attempts: [number, number][][] = [
    ...vias.map((via) => [[fromLng, fromLat], via, [toLng, toLat]] as [number, number][]),
    [[fromLng, fromLat], [toLng, toLat]],
  ];
  let best: RouteInfo | null = null;
  for (const waypoints of attempts) {
    try {
      const routes = await fetchDrivingRoutes(
        token,
        waypoints,
        '&alternatives=true&continue_straight=false',
        incidents,
      );
      for (const route of routes) {
        if (route.totalDist < 800) continue;
        if (routeHitsAnyIncident(route, incidents, 90)) continue;
        if (!best || route.totalDist > best.totalDist) best = route;
      }
      if (best && best.totalDist > 1100) return best;
    } catch {
      /* try next via */
    }
  }
  return best;
}

export function applyIncidentDetour(cars: SimCar[], carId: string, routeInfo: RouteInfo): SimCar[] {
  return cars.map((car) =>
    car.id === carId
      ? {
        ...car,
        state: 'rerouting' as const,
        detourRouteInfo: routeInfo,
        detourDistAlongRoute: 0,
        rerouteStartedAt: 0,
      }
      : car,
  );
}

/**
 * Rejoin every rerouting car onto its original loop once all incidents are
 * cleared. Snaps to the point nearest the car's *current* position instead of
 * jumping back to the stale pre-detour distance, which used to make cars
 * teleport backwards (and briefly vanish off-route) when a crash was cleared.
 */
export function clearAllIncidents(cars: SimCar[]): SimCar[] {
  return cars.map((car) => {
    if (car.state !== 'rerouting' || !car.routeInfo) {
      return { ...car, incidentId: null, rerouteStartedAt: 0 };
    }
    const distAlongRoute = nearestDistAlongRoute(car.routeInfo, car.lat, car.lng);
    const pos = posOnRoute(car.routeInfo, distAlongRoute);
    return {
      ...car,
      state: 'driving' as const,
      distAlongRoute,
      lat: pos.lat,
      lng: pos.lng,
      bearing: pos.bearing,
      detourRouteInfo: null,
      detourDistAlongRoute: 0,
      incidentId: null,
      rerouteStartedAt: 0,
    };
  });
}

/** Build a road-following fallback by removing the blocked part of the loop. */
function buildAvoidingLoop(route: RouteInfo, incidents: TrafficIncident[]): RouteInfo | null {
  if (incidents.length === 0) return null;
  const kept = route.coords.filter(([lng, lat]) =>
    !pointHitsIncident(lat, lng, incidents, 170),
  );
  if (kept.length < 2) return null;
  return buildRouteInfo(kept);
}

function waypointsAvoidingIncidents(
  waypoints: [number, number][],
  incidents: TrafficIncident[],
  via: [number, number] | null,
): [number, number][] {
  const filtered = waypoints.filter(([lng, lat]) =>
    !incidents.some((incident) => mDist(lat, lng, incident.lat, incident.lng) < 160),
  );
  const base = filtered.length >= 2 ? filtered : waypoints;
  if (!via) return base;
  const insertAt = Math.max(1, Math.min(base.length - 1, Math.floor(base.length / 2)));
  return [...base.slice(0, insertAt), via, ...base.slice(insertAt)];
}

async function fetchDrivingRoutes(
  token: string,
  waypoints: [number, number][],
  extraQuery = '',
  incidents: TrafficIncident[] = [],
): Promise<RouteInfo[]> {
  const coordStr = waypoints.map((waypoint) => waypoint.join(',')).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}` +
    `?geometries=geojson&overview=full${extraQuery}&access_token=${token}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json() as {
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
    message?: string;
  };
  if (json.message) throw new Error(json.message);
  return (json.routes ?? [])
    .map((candidate) => candidate.geometry?.coordinates ?? [])
    .filter((raw) => raw.length >= 2)
    .map((raw) => buildRouteInfo(raw as [number, number][]))
    .filter((route) => incidents.length === 0 || !routeHitsAnyIncident(route, incidents, 90));
}

async function fetchDrivingRoute(
  token: string,
  waypoints: [number, number][],
  extraQuery = '',
  incidents: TrafficIncident[] = [],
): Promise<RouteInfo | null> {
  const routes = await fetchDrivingRoutes(token, waypoints, extraQuery, incidents);
  return routes.sort((a, b) => b.totalDist - a.totalDist)[0] ?? null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch real road-following routes using the Mapbox Directions API.
 * Each route uses the waypoints defined in ROUTE_WAYPOINTS.
 * Returns RouteInfo[] – one per route (may mix API + fallback results).
 */
export async function fetchAllRoutes(token: string): Promise<RouteInfo[]> {
  return Promise.all(
    ROUTE_WAYPOINTS.map(async (waypoints, idx) => {
      const coordStr = waypoints.map(w => w.join(',')).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${coordStr}?geometries=geojson&overview=full&access_token=${token}`;
      try {
        const res  = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as {
          routes?: { geometry?: { coordinates?: [number,number][] } }[];
          message?: string;
        };
        if (json.message) throw new Error(json.message);  // API error
        const raw  = json.routes?.[0]?.geometry?.coordinates ?? [];
        if (raw.length >= 2) {
          console.log(`✅ Route ${idx}: got ${raw.length} road coords`);
          return buildRouteInfo(raw);
        }
        throw new Error('Empty route geometry');
      } catch (err) {
        console.warn(`⚠️ Route ${idx} API failed (${err}), using fallback`);
        return buildRouteInfo(waypoints);
      }
    }),
  );
}

/**
 * Pick a coordinate directly from a live vehicle route, far enough ahead for a
 * detour. This prevents incidents from appearing at dead ends or off-road.
 */
export function selectTrafficIncidentLocation(
  cars: SimCar[],
  existing: TrafficIncident[],
): Omit<TrafficIncident, 'id'> | null {
  const candidates = cars.filter((car) => car.state === 'driving' && car.routeInfo && car.incidentId === null);

  for (let attempt = 0; attempt < 40 && candidates.length > 0; attempt++) {
    const car = candidates[Math.floor(Math.random() * candidates.length)];
    const route = car.routeInfo!;
    const aheadDistance = 450 + Math.random() * 650;
    const targetDistance = (car.distAlongRoute + aheadDistance) % route.totalDist;
    const pointIndex = route.cumDist.findIndex((distance) => distance >= targetDistance);
    const [lng, lat] = route.coords[pointIndex === -1 ? route.coords.length - 2 : pointIndex];
    const tooCloseToExisting = existing.some((incident) => mDist(lat, lng, incident.lat, incident.lng) < 250);
    if (!tooCloseToExisting) return { lat, lng };
  }

  return null;
}

/**
 * Fetch a road-following route from a point to a parking lot using the
 * Mapbox Directions API. Falls back to a straight-line RouteInfo on error.
 */
export async function fetchParkingRoute(
  token: string,
  fromLng: number, fromLat: number,
  toLng:   number, toLat:   number,
): Promise<RouteInfo> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&access_token=${token}`;
  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as {
      routes?: { geometry?: { coordinates?: [number, number][] } }[];
      message?: string;
    };
    if (json.message) throw new Error(json.message);
    const raw = json.routes?.[0]?.geometry?.coordinates ?? [];
    if (raw.length >= 2) return buildRouteInfo(raw);
    throw new Error('Empty route');
  } catch {
    throw new Error('Parking route is not on a road');
  }
}

/** Apply a fetched parking route to a car that is seeking parking. */
export function applyParkingRoute(cars: SimCar[], carId: string, routeInfo: RouteInfo): SimCar[] {
  return cars.map(c =>
    c.id === carId ? { ...c, parkingRouteInfo: routeInfo, parkingDistAlongRoute: 0 } : c,
  );
}

/**
 * Rebuild every loaded loop so it stays on Mapbox roads and avoids all active
 * incidents. Cars keep travelling on their assigned route instead of drawing
 * one-off off-road detours.
 */
export async function rebuildRoutesAvoidingIncidents(
  token: string,
  incidents: TrafficIncident[],
  currentRoutes: RouteInfo[],
): Promise<RouteInfo[]> {
  const rebuilt = await Promise.all(ROUTE_WAYPOINTS.map(async (waypoints, idx) => {
    const current = currentRoutes[idx];
    if (incidents.length === 0) {
      try {
        return (await fetchDrivingRoute(token, waypoints)) ?? current ?? buildRouteInfo(waypoints);
      } catch {
        return current ?? buildRouteInfo(waypoints);
      }
    }

    const via = nearbyRoadVia(currentRoutes.filter(Boolean), incidents);
    const attempts: Array<[number, number][]> = [
      waypointsAvoidingIncidents(waypoints, incidents, via),
      waypointsAvoidingIncidents(waypoints, incidents, null),
      waypoints,
    ];

    for (const attempt of attempts) {
      try {
        const route = await fetchDrivingRoute(
          token,
          attempt,
          '&alternatives=true&continue_straight=false',
          incidents,
        );
        if (route) return route;
      } catch {
        /* try the next Mapbox request */
      }
    }

    if (current && !routeHitsAnyIncident(current, incidents, 120)) return current;
    return current;
  }));
  return rebuilt;
}

export function snapCarToRoute(car: SimCar): SimCar {
  if (!car.routeInfo) return car;
  const pos = posOnRoute(car.routeInfo, car.distAlongRoute);
  return { ...car, lat: pos.lat, lng: pos.lng, bearing: pos.bearing };
}

export function applyAvoidingRoutes(
  cars: SimCar[],
  routes: RouteInfo[],
  incidents: TrafficIncident[] = [],
): SimCar[] {
  if (incidents.length === 0) {
    return cars.map((car) => {
      const route = routes[car.routeId] ?? car.routeInfo;
      if (!route) return {
        ...car,
        state: car.state === 'rerouting' ? 'driving' : car.state,
        detourRouteInfo: null,
        detourDistAlongRoute: 0,
        incidentId: null,
        rerouteStartedAt: 0,
      };
      const snapped = snapCarToRoute({ ...car, routeInfo: route });
      return {
        ...snapped,
        state: 'driving',
        detourRouteInfo: null,
        detourDistAlongRoute: 0,
        incidentId: null,
        rerouteStartedAt: 0,
      };
    });
  }
  return cars.map((car) => {
    const route = routes[car.routeId] ?? car.routeInfo;
    if (!route) return car;
    if (routeHitsAnyIncident(route, incidents, 90)) return car;
    return { ...car, routeInfo: route };
  });
}

/** Attach loaded RouteInfo to cars and snap positions onto the road. */
export function applyRoutes(cars: SimCar[], routes: RouteInfo[]): SimCar[] {
  return cars.map(car => {
    const ri = routes[car.routeId];
    if (!ri) return car;
    const pos = posOnRoute(ri, car.distAlongRoute);
    return { ...car, routeInfo: ri, lat: pos.lat, lng: pos.lng, bearing: pos.bearing };
  });
}

// [id, type, color, routeId, fracOfRoute]
// Pool of 40 cars (4 per route). The animation layer renders only the first N,
// where N is derived from cityData.metrics.totalVehicles / SCALE_VEHICLES_PER_MAP_CAR.
const CAR_DEFS: [string, CarType, string, number, number][] = [
  // Route 0 – E-W main
  ['car-01', 'car',  '#3b82f6', 0, 0.00],
  ['car-02', 'car',  '#60a5fa', 0, 0.25],
  ['car-03', 'car',  '#93c5fd', 0, 0.50],
  ['car-04', 'car',  '#bfdbfe', 0, 0.75],
  // Route 1 – N-S central
  ['car-05', 'taxi', '#fbbf24', 1, 0.00],
  ['car-06', 'taxi', '#f59e0b', 1, 0.25],
  ['car-07', 'taxi', '#fcd34d', 1, 0.50],
  ['car-08', 'taxi', '#fde68a', 1, 0.75],
  // Route 2 – Centre block
  ['car-09', 'car',  '#34d399', 2, 0.00],
  ['car-10', 'car',  '#6ee7b7', 2, 0.25],
  ['car-11', 'car',  '#a7f3d0', 2, 0.50],
  ['car-12', 'car',  '#10b981', 2, 0.75],
  // Route 3 – Bus outer circuit
  ['car-13', 'bus',  '#a78bfa', 3, 0.00],
  ['car-14', 'bus',  '#8b5cf6', 3, 0.25],
  ['car-15', 'bus',  '#c4b5fd', 3, 0.50],
  ['car-16', 'bus',  '#7c3aed', 3, 0.75],
  // Route 4 – NW residential
  ['car-17', 'car',  '#f87171', 4, 0.00],
  ['car-18', 'car',  '#fca5a5', 4, 0.25],
  ['car-19', 'car',  '#ef4444', 4, 0.50],
  ['car-20', 'car',  '#fecaca', 4, 0.75],
  // Route 5 – NE quarter
  ['car-21', 'taxi', '#fb923c', 5, 0.00],
  ['car-22', 'taxi', '#fdba74', 5, 0.25],
  ['car-23', 'taxi', '#f97316', 5, 0.50],
  ['car-24', 'taxi', '#fed7aa', 5, 0.75],
  // Route 6 – SE quarter
  ['car-25', 'car',  '#a3e635', 6, 0.00],
  ['car-26', 'car',  '#bef264', 6, 0.25],
  ['car-27', 'car',  '#84cc16', 6, 0.50],
  ['car-28', 'car',  '#d9f99d', 6, 0.75],
  // Route 7 – SW quarter
  ['car-29', 'car',  '#38bdf8', 7, 0.00],
  ['car-30', 'car',  '#7dd3fc', 7, 0.25],
  ['car-31', 'car',  '#0ea5e9', 7, 0.50],
  ['car-32', 'car',  '#bae6fd', 7, 0.75],
  // Route 8 – Cathedral circuit
  ['car-33', 'taxi', '#e879f9', 8, 0.00],
  ['car-34', 'taxi', '#f0abfc', 8, 0.25],
  ['car-35', 'taxi', '#d946ef', 8, 0.50],
  ['car-36', 'taxi', '#f5d0fe', 8, 0.75],
  // Route 9 – Wide outer ring
  ['car-37', 'bus',  '#2dd4bf', 9, 0.00],
  ['car-38', 'bus',  '#5eead4', 9, 0.25],
  ['car-39', 'car',  '#99f6e4', 9, 0.50],
  ['car-40', 'car',  '#14b8a6', 9, 0.75],
];

/**
 * Scale factor: how many sensor-reported vehicles per hour correspond to
 * one visible car on the map. totalVehicles / SCALE_VEHICLES_PER_MAP_CAR = active cars.
 * e.g. 120 veh/h → 20 cars, 240 veh/h → 40 cars.
 */
export const SCALE_VEHICLES_PER_MAP_CAR = 6;

export function makeInitialCars(): SimCar[] {
  // Three vehicles per definition create visible queues on the main routes.
  let nonBusIdx = 0;
  return CAR_DEFS.flatMap(([id, type, color, routeId, frac]) => [0, 1, 2].map((copy) => {
    const isBus   = type === 'bus';
    const canPark = !isBus && (nonBusIdx++ % 10 === 0);
    return {
      id: `${id}-${copy + 1}`, type: type as CarType, color,
      routeId,
      distAlongRoute: EST_DIST[routeId] * ((frac + copy / 3) % 1),
      routeInfo: null,   // hidden until route loads
      lat: ROUTE_WAYPOINTS[routeId][0][1],
      lng: ROUTE_WAYPOINTS[routeId][0][0],
      bearing: 0,
      state: 'driving' as CarState,
      canPark,
      targetParking: null,
      parkedUntil: 0,
      parkingRouteInfo: null,
      parkingDistAlongRoute: 0,
      detourRouteInfo: null,
      detourDistAlongRoute: 0,
      incidentId: null,
      rerouteStartedAt: 0,
    };
  }));
}

// ─── Smart traffic lights ─────────────────────────────────────────────────────

export function getSmartLights(cityData: CityData): { sensorId: string; extended: boolean }[] {
  const tls = cityData.locations.filter(l => l.type === 'traffic-light');
  const tss = cityData.locations.filter(l => l.type === 'traffic');
  return tls.map(tl => ({
    sensorId: tl.id,
    extended: tss.some(ts => {
      if (mDist(tl.lat, tl.lng, ts.lat, ts.lng) > 300) return false;
      const s = cityData.traffic.find(t => t.sensorId === ts.id);
      return s?.congestionLevel === 'high';
    }),
  }));
}

const BASE_SPEED: Record<CarType, number> = { car: 13.9, taxi: 13.9, bus: 11.1 }; // m/s  (50 km/h / 40 km/h)

export function tickCars(
  cars: SimCar[],
  cityData: CityData | null,
  deltaMs: number,
  incidents: TrafficIncident[] = [],
): SimCar[] {
  if (!cityData || deltaMs <= 0) return cars;

  const delta = Math.min(deltaMs, 150);
  const now = Date.now();

  // Precompute per-tick lookups once instead of re-filtering/re-scanning the
  // full sensor list for every car, every frame - this scales with sensor
  // count (now ~74 sensors vs ~44 before), so it matters a lot more than it used to.
  const trafficSensors = cityData.locations.filter((l) => l.type === 'traffic');
  const trafficLightSensors = cityData.locations.filter((l) => l.type === 'traffic-light');
  const trafficBySensorId = new Map(cityData.traffic.map((t) => [t.sensorId, t]));
  const trafficLightBySensorId = new Map(cityData.trafficLights.map((t) => [t.sensorId, t]));

  const getCongMult = (lat: number, lng: number): number => {
    let best = 1.0;
    for (const ts of trafficSensors) {
      const d = mDist(lat, lng, ts.lat, ts.lng);
      if (d < 350) {
        const t = trafficBySensorId.get(ts.id);
        const m = t?.congestionLevel === 'high' ? 0.12
          : t?.congestionLevel === 'medium' ? 0.45
          : 1.0;
        if (m < best) best = m;
      }
    }
    return best;
  };

  const getTrafficLightMult = (lat: number, lng: number, bearing: number): number => {
    for (const light of trafficLightSensors) {
      if (mDist(lat, lng, light.lat, light.lng) > 85) continue;
      // Only stop for the light if it's ahead of us - otherwise a 2-way street's
      // opposite-direction (or a crossing street's) traffic freezes for no reason.
      const bearingToLight = calcBearing(lat, lng, light.lat, light.lng);
      if (angleDiff(bearing, bearingToLight) > 70) continue;
      const reading = trafficLightBySensorId.get(light.id);
      if (reading?.status === 'red') return 0;
      if (reading?.status === 'yellow') return 0.25;
    }
    return 1;
  };

  const getSpeedMult = (lat: number, lng: number, bearing: number) =>
    getCongMult(lat, lng) * getTrafficLightMult(lat, lng, bearing);

  // Route-vs-incident geometry (fine-grained segment stepping) is expensive
  // and identical for every car sharing the same route, so compute it once
  // per route per tick instead of once per car - this was the dominant
  // per-frame cost whenever an incident was active.
  const routeBlockedCache = new Map<number, boolean>();
  const routeIncidentDistCache = new Map<number, (number | null)[]>();

  const isRouteBlocked = (car: SimCar): boolean => {
    if (incidents.length === 0 || !car.routeInfo) return false;
    let cached = routeBlockedCache.get(car.routeId);
    if (cached === undefined) {
      cached = routeHitsAnyIncident(car.routeInfo, incidents, 90);
      routeBlockedCache.set(car.routeId, cached);
    }
    return cached;
  };

  const getDistToIncidentAhead = (car: SimCar): number | null => {
    if (incidents.length === 0 || !car.routeInfo) return null;
    let dists = routeIncidentDistCache.get(car.routeId);
    if (!dists) {
      dists = incidents.map((incident) => incidentDistanceOnRoute(car.routeInfo!, incident));
      routeIncidentDistCache.set(car.routeId, dists);
    }
    let nearest: number | null = null;
    for (const incidentDist of dists) {
      if (incidentDist === null) continue;
      const ahead = aheadDistance(car.routeInfo!, car.distAlongRoute, incidentDist);
      if (nearest === null || ahead < nearest) nearest = ahead;
    }
    return nearest;
  };

  return cars.map((car) => {
    const c = { ...car };
    if (!c.routeInfo) return c;

    if (c.state === 'parked') {
      if (now >= c.parkedUntil) {
        c.state = 'driving';
        c.targetParking = null;
        c.parkingRouteInfo = null;
        c.parkingDistAlongRoute = 0;
        const pos = posOnRoute(c.routeInfo, c.distAlongRoute);
        c.lat = pos.lat; c.lng = pos.lng; c.bearing = pos.bearing;
      }
      return c;
    }

    if (c.state === 'rerouting') {
      if (!c.detourRouteInfo) {
        if (c.rerouteStartedAt > 0 && now - c.rerouteStartedAt > 2500) {
          const fallback = buildAvoidingLoop(c.routeInfo, incidents);
          if (fallback && !routeHitsAnyIncident(fallback, incidents, 90)) {
            c.detourRouteInfo = fallback;
            c.detourDistAlongRoute = 0;
            c.rerouteStartedAt = 0;
          } else {
            c.state = 'driving';
            c.incidentId = null;
            c.rerouteStartedAt = 0;
          }
        }
        return c;
      }
      const speed = BASE_SPEED[c.type] * getSpeedMult(c.lat, c.lng, c.bearing);
      c.detourDistAlongRoute += speed * delta / 1_000;
      if (c.detourDistAlongRoute >= c.detourRouteInfo.totalDist) {
        const destination = c.detourRouteInfo.coords[c.detourRouteInfo.coords.length - 1];
        let closestIndex = 0;
        let closestDistance = Infinity;
        c.routeInfo.coords.forEach(([lng, lat], index) => {
          if (incidents.some((incident) => mDist(lat, lng, incident.lat, incident.lng) < 140)) return;
          const distance = mDist(lat, lng, destination[1], destination[0]);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        c.distAlongRoute = c.routeInfo.cumDist[closestIndex];
        c.state = 'driving';
        c.detourRouteInfo = null;
        c.detourDistAlongRoute = 0;
        c.incidentId = null;
        c.rerouteStartedAt = 0;
        const rejoin = posOnRoute(c.routeInfo, c.distAlongRoute);
        c.lat = rejoin.lat; c.lng = rejoin.lng; c.bearing = rejoin.bearing;
        return c;
      }
      const position = posOnRoute(c.detourRouteInfo, c.detourDistAlongRoute);
      c.lat = position.lat; c.lng = position.lng; c.bearing = position.bearing;
      return c;
    }

    if (c.state === 'seeking_parking' && c.targetParking) {
      if (!c.parkingRouteInfo) {
        const spd = BASE_SPEED[c.type] * getSpeedMult(c.lat, c.lng, c.bearing);
        c.distAlongRoute = (c.distAlongRoute + spd * delta / 1_000) % c.routeInfo.totalDist;
        const pos = posOnRoute(c.routeInfo, c.distAlongRoute);
        c.lat = pos.lat; c.lng = pos.lng; c.bearing = pos.bearing;
        return c;
      }
      const spd = BASE_SPEED[c.type] * getSpeedMult(c.lat, c.lng, c.bearing);
      c.parkingDistAlongRoute += spd * delta / 1_000;
      if (c.parkingDistAlongRoute >= c.parkingRouteInfo.totalDist) {
        c.state = 'parked';
        c.parkedUntil = now + 18_000 + Math.random() * 20_000;
        c.lat = c.targetParking.lat;
        c.lng = c.targetParking.lng;
        return c;
      }
      const pos = posOnRoute(c.parkingRouteInfo, c.parkingDistAlongRoute);
      c.lat = pos.lat; c.lng = pos.lng; c.bearing = pos.bearing;
      return c;
    }

    const routeBlocked = isRouteBlocked(c);
    const nearIncident = pointHitsIncident(c.lat, c.lng, incidents, 180);
    const distToIncident = getDistToIncidentAhead(c);
    if (nearIncident || (routeBlocked && distToIncident !== null && distToIncident < 1800)) {
      c.state = 'rerouting';
      c.incidentId = incidents[0]?.id ?? c.incidentId;
      if (c.rerouteStartedAt === 0) c.rerouteStartedAt = now;
      return c;
    }

    const spd = BASE_SPEED[c.type] * getSpeedMult(c.lat, c.lng, c.bearing);
    c.distAlongRoute = (c.distAlongRoute + spd * delta / 1_000) % c.routeInfo.totalDist;
    const pos = posOnRoute(c.routeInfo, c.distAlongRoute);
    c.lat = pos.lat; c.lng = pos.lng; c.bearing = pos.bearing;

    if (c.canPark && Math.random() < 0.000_08 * delta) {
      const available = cityData.locations.filter((l) => {
        if (l.type !== 'parking') return false;
        const p = cityData.parking.find((pk) => pk.sensorId === l.id);
        return p && p.availableSpaces >= 3;
      });
      if (available.length > 0) {
        let nearest = available[0];
        let minD = Infinity;
        for (const al of available) {
          const d2 = mDist(c.lat, c.lng, al.lat, al.lng);
          if (d2 < minD) { minD = d2; nearest = al; }
        }
        c.state = 'seeking_parking';
        c.targetParking = { lat: nearest.lat, lng: nearest.lng, name: nearest.name };
      }
    }
    return c;
  });
}
