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
  }) => api.post<Ride>('/rides/request', data),

  getRide: (id: string) =>
    api.get<Ride>(`/rides/${id}`),

  listMyRides: () =>
    api.get<Ride[]>('/rides/mine'),

  cancelRide: (id: string, reason?: string) =>
    api.post(`/rides/${id}/cancel`, { reason }),

  rateRide: (id: string, rating: number, comment?: string) =>
    api.post(`/rides/${id}/rate`, { rating, comment }),

  registerDriver: (data: {
    licensePlate: string;
    vehicleModel: string;
    vehicleColor?: string;
    vehicleYear?: number;
    documentUrl?: string;
  }) => api.post<Driver>('/rides/driver/register', data),

  getDriverProfile: () =>
    api.get<Driver>('/rides/driver/me'),

  setDriverStatus: (status: 'ONLINE' | 'OFFLINE') =>
    api.patch('/rides/driver/status', { status }),

  acceptRide: (rideId: string) =>
    api.post(`/rides/${rideId}/accept`),

  updateRideStatus: (rideId: string, status: string) =>
    api.patch(`/rides/${rideId}/status`, { status }),

  listAvailableRides: () =>
    api.get<Ride[]>('/rides/driver/nearby'),
};
