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

export interface RouteMapProps {
  route: RouteResponse | null;
  isLoading: boolean;
}

export interface RouteFormProps {
  onCalculate: (start: string, end: string) => void;
  isLoading: boolean;
  currentRoute: RouteResponse | null; // Added currentRoute
  transportMode: string; // Added transportMode
}

export interface ResultsProps {
  route: RouteResponse | null;
  isLoading: boolean;
} 