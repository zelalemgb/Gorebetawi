import { useState, useEffect, useCallback } from 'react';

interface TrailPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  type: 'view' | 'report' | 'confirm';
}

export function useUserTrail() {
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  
  const addTrailPoint = useCallback((
    latitude: number,
    longitude: number,
    type: TrailPoint['type'] = 'view'
  ) => {
    const newPoint: TrailPoint = {
      id: `${Date.now()}_${Math.random()}`,
      latitude,
      longitude,
      timestamp: Date.now(),
      type,
    };
    
    setTrailPoints(prev => {
      // Keep only last 50 points and remove points older than 4 hours
      const fourHoursAgo = Date.now() - 14400000;
      const filtered = prev.filter(point => point.timestamp > fourHoursAgo);
      
      return [...filtered, newPoint].slice(-50);
    });
  }, []);
  
  const addViewPoint = useCallback((latitude: number, longitude: number) => {
    addTrailPoint(latitude, longitude, 'view');
  }, [addTrailPoint]);
  
  const addReportPoint = useCallback((latitude: number, longitude: number) => {
    addTrailPoint(latitude, longitude, 'report');
  }, [addTrailPoint]);
  
  const addConfirmPoint = useCallback((latitude: number, longitude: number) => {
    addTrailPoint(latitude, longitude, 'confirm');
  }, [addTrailPoint]);
  
  const clearTrail = useCallback(() => {
    setTrailPoints([]);
  }, []);
  
  return {
    trailPoints,
    addViewPoint,
    addReportPoint,
    addConfirmPoint,
    clearTrail,
  };
}