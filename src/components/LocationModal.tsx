'use client';

import React from 'react';
import { GoogleMapPicker } from './GoogleMapPicker';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocationName: string;
  onSelectLocation: (coords: { lat: number; lng: number }, name: string) => void;
  initialCoords?: { lat: number; lng: number };
}

export function LocationModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialCoords,
}: LocationModalProps) {
  return (
    <GoogleMapPicker
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={(coords, address) => onSelectLocation(coords, address)}
      initialCoords={initialCoords}
      title="Where are you?"
      subtitle="Search or move the map to pin your delivery location"
      confirmLabel="Confirm My Location"
    />
  );
}
