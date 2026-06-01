import { api } from './api';

export interface Driver {
  id: string;
  vehicleModel: string;
  vehicleColor?: string | null;
  licensePlate: string;
  status: string;
  currentLat?: number | null;
  currentLng?: number | null;
  ratingAvg: number;
  ratingCount: number;
  user: { profile: { displayName: string; avatarUrl?: string | null } };
}

export interface Ride {
  id: string;
  status: string;
  originLabel: string;
  destinationLabel: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  passengerRating?: number | null;
  driverRating?: number | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  driver?: Driver | null;
  passenger?: { profile: { displayName: string; avatarUrl?: string | null } };
  locations?: { lat: number; lng: number; recordedAt: string }[];
}

// Maps a target ride status to the backend's dedicated transition route.
const RIDE_STATUS_ROUTE: Record<string, string> = {
  DRIVER_ARRIVED: 'arrived',
  IN_PROGRESS: 'start',
  COMPLETED: 'complete',
};

export const ridesApi = {
  requestRide: (data: {
    originLabel: string;
    destinationLabel: string;
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    distanceMeters?: number;
    notes?: string;
  }) => api.post<Ride>('/rides', data),

  getRide: (id: string) =>
    api.get<Ride>(`/rides/${id}`),

  listMyRides: () =>
    api.get<Ride[]>('/rides/my'),

  cancelRide: (id: string, reason?: string) =>
    api.delete(`/rides/${id}`, { data: { reason } }),

  rateRide: (id: string, rating: number, comment?: string) =>
    api.post(`/rides/${id}/rating`, { rating, comment }),

  registerDriver: (data: {
    licensePlate: string;
    vehicleModel: string;
    vehicleColor?: string;
    vehicleYear?: number;
    documentUrl?: string;
  }) => api.post<Driver>('/rides/drivers', data),

  getDriverProfile: () =>
    api.get<Driver>('/rides/drivers/me'),

  setDriverStatus: (status: 'ONLINE' | 'OFFLINE') =>
    api.patch('/rides/drivers/me/status', { status }),

  acceptRide: (rideId: string) =>
    api.post(`/rides/${rideId}/accept`),

  updateRideStatus: (rideId: string, status: string) => {
    const route = RIDE_STATUS_ROUTE[status];
    if (!route) {
      return Promise.reject(new Error(`Unsupported ride status transition: ${status}`));
    }
    return api.patch(`/rides/${rideId}/${route}`);
  },

  listAvailableRides: () =>
    api.get<Ride[]>('/rides/drivers/available'),
};
