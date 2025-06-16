import React, { useEffect, useState } from 'react';
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
  filteredCategories?: string[];
}

// Custom hook to update map view when center/zoom changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  
  return null;
}

export default function WebMapComponentClient({
  center,
  zoom,
  reports,
  selectedReport,
  onMarkerClick,
  onScroll,
  filteredCategories = []
}: MapComponentProps) {
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      light: '#FDD835',
      water: '#2196F3',
      fuel: '#43A047',
      price: '#FF9800',
      traffic: '#F44336',
      infrastructure: '#9E9E9E',
      environment: '#4CAF50',
      safety: '#E53935'
    };
    return categoryColors[category] || Colors.accent;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      light: '💡',
      water: '💧',
      fuel: '⛽',
      price: '🛒',
      traffic: '🚦',
      infrastructure: '🛠️',
      environment: '🌿',
      safety: '⚠️'
    };
    return icons[category] || '📍';
  };

  // Filter reports based on selected categories
  const visibleReports = filteredCategories.length > 0 
    ? reports.filter(report => filteredCategories.includes(report.category))
    : reports;

  return (
    <View style={styles.container}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={styles.map}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <MapUpdater center={center} zoom={zoom} />
        
        {/* Clean tile layer with better street visibility */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* User location marker with subtle radius */}
        <Circle
          center={center}
          radius={500} // Reduced radius for less visual clutter
          pathOptions={{
            color: Colors.accent,
            fillColor: Colors.accent,
            fillOpacity: 0.05, // Much more subtle
            weight: 1,
            dashArray: '3, 3'
          }}
        />
        <Marker
          position={center}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 16px;
                height: 16px;
                background-color: ${Colors.accent};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '4px' }}>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: 'bold' }}>
                Your Location
              </h3>
            </div>
          </Popup>
        </Marker>
        
        {/* Clean report markers */}
        {visibleReports.map((report) => {
          const color = getCategoryColor(report.category);
          const icon = getCategoryIcon(report.category);
          const isSelected = selectedReport?.id === report.id;
          const isFresh = Date.now() - report.timestamp < 3600000; // < 1 hour
          const isOngoing = report.metadata?.duration === 'ongoing';
          const isExpired = report.expiresAt ? Date.now() > report.expiresAt : false;
          const isSponsored = report.isSponsored;
          
          // Determine opacity for filtered reports
          const isFiltered = filteredCategories.length > 0 && !filteredCategories.includes(report.category);
          const opacity = isFiltered ? 0.3 : (isExpired ? 0.5 : 1);
          
          return (
            <Marker
              key={report.id}
              position={[report.location.latitude, report.location.longitude]}
              eventHandlers={{
                click: () => onMarkerClick(report)
              }}
              icon={L.divIcon({
                className: 'clean-report-marker',
                html: `
                  <div style="
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transform: scale(${isSelected ? 1.2 : 1});
                    transition: transform 0.2s ease-in-out;
                    opacity: ${opacity};
                  ">
                    ${isSponsored ? `
                      <div style="
                        position: absolute;
                        width: 40px;
                        height: 40px;
                        border: 1px solid ${Colors.accent};
                        border-radius: 50%;
                        opacity: 0.4;
                      "></div>
                    ` : ''}
                    
                    ${(isOngoing || isFresh) && !isExpired ? `
                      <div style="
                        position: absolute;
                        width: 36px;
                        height: 36px;
                        background-color: ${color};
                        border-radius: 50%;
                        opacity: 0.2;
                        animation: ${isOngoing ? 'pulse' : 'ping'} ${isOngoing ? '3s' : '2s'} infinite;
                      "></div>
                    ` : ''}
                    
                    <div style="
                      width: 28px;
                      height: 28px;
                      background-color: ${color};
                      border: 2px solid white;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 14px;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                      position: relative;
                      z-index: 2;
                    ">
                      ${icon}
                    </div>
                    
                    ${report.confirmations > 0 ? `
                      <div style="
                        position: absolute;
                        top: -2px;
                        right: -2px;
                        background-color: ${Colors.accent};
                        color: white;
                        border-radius: 8px;
                        min-width: 16px;
                        height: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 10px;
                        font-weight: bold;
                        border: 1px solid white;
                        z-index: 3;
                      ">
                        ${report.confirmations}
                      </div>
                    ` : ''}
                    
                    ${report.status === 'confirmed' ? `
                      <div style="
                        position: absolute;
                        bottom: -1px;
                        right: 1px;
                        width: 10px;
                        height: 10px;
                        background-color: ${Colors.success};
                        border: 1px solid white;
                        border-radius: 50%;
                        z-index: 3;
                      "></div>
                    ` : ''}
                    
                    ${report.status === 'resolved' ? `
                      <div style="
                        position: absolute;
                        bottom: -1px;
                        right: 1px;
                        width: 10px;
                        height: 10px;
                        background-color: #4CAF50;
                        border: 1px solid white;
                        border-radius: 50%;
                        z-index: 3;
                      "></div>
                    ` : ''}
                  </div>
                  
                  <style>
                    @keyframes pulse {
                      0%, 100% { transform: scale(1); opacity: 0.2; }
                      50% { transform: scale(1.1); opacity: 0.1; }
                    }
                    @keyframes ping {
                      0% { transform: scale(1); opacity: 0.2; }
                      100% { transform: scale(1.3); opacity: 0; }
                    }
                  </style>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })}
            >
              <Popup>
                <div style={{
                  padding: '8px',
                  minWidth: '180px',
                  maxWidth: '250px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}>
                    <div style={{
                      fontSize: '16px',
                      marginRight: '6px',
                    }}>
                      {icon}
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#333333',
                    }}>
                      {report.title}
                    </h3>
                    {isSponsored && (
                      <div style={{
                        marginLeft: '6px',
                        padding: '1px 4px',
                        backgroundColor: Colors.accent,
                        color: 'white',
                        fontSize: '8px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                      }}>
                        SPONSORED
                      </div>
                    )}
                  </div>
                  {report.description && (
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: '12px',
                      color: '#666666',
                      lineHeight: '1.3',
                    }}>
                      {report.description}
                    </p>
                  )}
                  {report.imageUrl && (
                    <img 
                      src={report.imageUrl} 
                      alt="Report" 
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginBottom: '6px'
                      }}
                    />
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#888',
                  }}>
                    <span>{report.confirmations} confirmations</span>
                    <span style={{
                      padding: '1px 4px',
                      backgroundColor: color,
                      color: 'white',
                      borderRadius: '3px',
                      fontSize: '8px',
                      fontWeight: 'bold',
                    }}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                  {isFresh && (
                    <div style={{
                      marginTop: '6px',
                      padding: '2px 6px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                      🔥 FRESH REPORT
                    </div>
                  )}
                  {report.metadata?.priceDetails && (
                    <div style={{
                      marginTop: '6px',
                      padding: '4px 6px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      fontSize: '10px',
                    }}>
                      <strong>{report.metadata.priceDetails.itemName}:</strong> {report.metadata.priceDetails.price} birr/{report.metadata.priceDetails.unitOfMeasure}
                    </div>
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