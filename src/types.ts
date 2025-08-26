export interface RouteRequest {
  start: string;
  end: string;
}

export interface RouteResponse {
  distance: number; // in miles
  duration: number; // in minutes
  route: {
    coordinates: [number, number][];
    summary: string;
    startAddress: string;
    endAddress: string;
    geometry?: {
      encoded?: string;
      encoded_polyline?: string;
      coordinates?: [number, number][];
      type?: string;
    };
  };
  cost: {
    fuel: number;
    ticket?: number; // for ferries and planes
  };
  transportMode: 'car' | 'ferry' | 'plane'; // Added transportMode
}

export interface SavedRoute { // New interface for saved routes
  id: string;
  name: string;
  startAddress: string;
  endAddress: string;
  distance: number;
  duration: number;
  fuelCost: number; // Now includes fuelCost
  transportMode: 'car' | 'ferry' | 'plane'; // Added transportMode
  createdAt: string;
}

export interface SavedRouteComparison {
  id: string;
  name: string;
  startAddress: string;
  endAddress: string;
  routes: {
    car: RouteResponse | null;
    ferry: RouteResponse | null;
    plane: RouteResponse | null;
  };
  ferryDirection: boolean; // true = left, false = right
  curveSize: number; // Controls the width of the ferry curve
  createdAt: string;
}

export interface RouteMapProps {
  routes: {
    car: RouteResponse | null;
    ferry: RouteResponse | null;
    plane: RouteResponse | null;
  } | null;
  isLoading: boolean;
  ferryDirection: boolean;
  setFerryDirection: (direction: boolean) => void;
  curveSize: number;
  setCurveSize: (size: number) => void;
  useMetric: boolean;
  setUseMetric: (useMetric: boolean) => void;
}

export interface RouteFormProps {
  onCalculate: (start: string, end: string) => void;
  isLoading: boolean;
  startInput: string;
  setStartInput: (value: string) => void;
  endInput: string;
  setEndInput: (value: string) => void;
}

export interface ResultsProps {
  routes: {
    car: RouteResponse | null;
    ferry: RouteResponse | null;
    plane: RouteResponse | null;
  } | null;
  isLoading: boolean;
  onRouteSaved?: () => void;
  ferryDirection: boolean;
  curveSize: number;
  useMetric: boolean;
  setUseMetric: (useMetric: boolean) => void;
} 