import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Report } from '@/types';
import { Colors } from '@/constants/Colors';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  onMarkerClick: (report: Report) => void;
  onScroll?: (event: any) => void;
}

// Custom hook to update map view when center/zoom changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom]);
  
  return null;
}

export default function WebMapComponentClient({
  center,
  zoom,
  reports,
  selectedReport,
  onMarkerClick,
  onScroll
}: MapComponentProps) {
  const getCategoryColor = (category: string) => {
    return Colors[category as keyof typeof Colors];
  };

  return (
    <View style={styles.container}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={styles.map}
        zoomControl={false}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <MapUpdater center={center} zoom={zoom} />
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        {/* User location marker and radius */}
        <Circle
          center={center}
          radius={1000} // 1km radius
          pathOptions={{
            color: Colors.accent,
            fillColor: Colors.accent,
            fillOpacity: 0.1,
            weight: 1,
          }}
        />
        <Marker
          position={center}
          icon={L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                width: 24px;
                height: 24px;
                background-color: ${Colors.accent};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 0 2px ${Colors.accent}40;
              "></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        />
        
        {reports.map((report) => {
          const color = getCategoryColor(report.category);
          const isSelected = selectedReport?.id === report.id;
          
          return (
            <Marker
              key={report.id}
              position={[report.location.latitude, report.location.longitude]}
              eventHandlers={{
                click: () => onMarkerClick(report)
              }}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transform: scale(${isSelected ? 1.2 : 1});
                    transition: transform 0.2s ease-in-out;
                  ">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="${isSelected ? color : 'none'}"
                      stroke="${color}"
                      stroke-width="${isSelected ? 2.5 : 2}"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    ${isSelected ? `<div style="
                      position: absolute;
                      width: 8px;
                      height: 8px;
                      background-color: ${color};
                      border-radius: 50%;
                      top: 12px;
                    "></div>` : ''}
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })}
            >
              <Popup>
                <div style={{
                  padding: '12px',
                  minWidth: '200px',
                  maxWidth: '300px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      marginRight: '8px',
                    }} />
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#333333',
                    }}>
                      {report.title}
                    </h3>
                  </div>
                  {report.description && (
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#666666',
                      lineHeight: '1.4',
                    }}>
                      {report.description}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    height: '100%',
    width: '100%',
  },
});