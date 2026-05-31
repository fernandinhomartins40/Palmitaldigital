import { api } from './api';

export interface Driver {
  id: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  status: string;
  lat?: number | null;
  lng?: number | null;
  user: { profile: { displayName: string; avatarUrl?: string | null } };
}

export interface Ride {
  id: string;
  status: string;
  originAddress: string;
  destinationAddress: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  pixQrCode?: string | null;
  createdAt: string;
  updatedAt: string;
  driver?: Driver | null;
  passenger?: { profile: { displayName: string; avatarUrl?: string | null } };
  rating?: number | null;
  ratingComment?: string | null;
}

export const ridesApi = {
  requestRide: (data: {
    originAddress: string;
    destinationAddress: string;
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }) => api.post<Ride>('/rides/request', data),

  getRide: (id: string) =>
    api.get<Ride>(`/rides/${id}`),

  listMyRides: () =>
    api.get<Ride[]>('/rides/mine'),

  cancelRide: (id: string) =>
    api.post(`/rides/${id}/cancel`),

  rateRide: (id: string, rating: number, comment?: string) =>
    api.post(`/rides/${id}/rate`, { rating, comment }),

  registerDriver: (data: {
    vehicleModel: string;
    vehiclePlate: string;
    vehicleColor: string;
    licenseNumber: string;
    pixKey: string;
    pixKeyType: string;
  }) => api.post<Driver>('/rides/driver/register', data),

  getDriverProfile: () =>
    api.get<Driver>('/rides/driver/me'),

  setDriverStatus: (status: 'ONLINE' | 'OFFLINE') =>
    api.patch('/rides/driver/status', { status }),

  driverListRides: () =>
    api.get<Ride[]>('/rides/driver/rides'),

  acceptRide: (rideId: string) =>
    api.post(`/rides/${rideId}/accept`),

  updateRideStatus: (rideId: string, status: string) =>
    api.patch(`/rides/${rideId}/status`, { status }),

  getNearbyRides: () =>
    api.get<Ride[]>('/rides/driver/nearby'),
};
