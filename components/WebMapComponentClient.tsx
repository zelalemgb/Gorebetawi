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
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Minimalist user location with elegant radius */}
        <Circle
          center={center}
          radius={300}
          pathOptions={{
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.08,
            weight: 1.5,
            opacity: 0.6,
            dashArray: '2, 4'
          }}
        />
        <Marker
          position={center}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 14px;
                height: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 3px 12px rgba(102, 126, 234, 0.4);
                animation: gentlePulse 3s ease-in-out infinite;
              "></div>
              <style>
                @keyframes gentlePulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.1); opacity: 0.8; }
                }
              </style>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '8px 12px' }}>
              <h3 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#2d3748',
                letterSpacing: '0.3px'
              }}>
                Your Location
              </h3>
            </div>
          </Popup>
        </Marker>
        
        {/* Elegant minimalist report markers */}
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
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transform: scale(${isSelected ? 1.15 : 1});
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: ${opacity};
                    filter: ${isSelected ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'none'};
                  ">
                    ${isSponsored ? `
                      <div style="
                        position: absolute; 
                        width: 44px;
                        height: 44px;
                        border: 1.5px solid #667eea;
                        border-radius: 50%;
                        opacity: 0.5;
                        animation: sponsoredGlow 4s ease-in-out infinite;
                      "></div>
                    ` : ''}
                    
                    ${(isOngoing || isFresh) && !isExpired ? `
                      <div style="
                        position: absolute;
                        width: 42px;
                        height: 42px;
                        background-color: ${color};
                        border-radius: 50%;
                        opacity: 0.15;
                        animation: ${isOngoing ? 'gentleRipple' : 'subtlePing'} ${isOngoing ? '4s' : '3s'} infinite;
                      "></div>
                    ` : ''}
                    
                    <div style="
                      width: 30px;
                      height: 30px;
                      background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
                      border: 2.5px solid white;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 13px;
                      box-shadow: 0 3px 8px rgba(0,0,0,0.12);
                      position: relative;
                      z-index: 2;
                      transition: all 0.2s ease;
                    ">
                      ${icon}
                    </div>
                    
                    ${report.confirmations > 0 ? `
                      <div style="
                        position: absolute;
                        top: -3px;
                        right: -3px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 10px;
                        min-width: 18px;
                        height: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        font-weight: 600;
                        border: 2px solid white;
                        z-index: 3;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                      ">
                        ${report.confirmations}
                      </div>
                    ` : ''}
                    
                    ${report.status === 'confirmed' ? `
                      <div style="
                        position: absolute;
                        bottom: -2px;
                        right: 2px;
                        width: 12px;
                        height: 12px;
                        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                        border: 2px solid white;
                        border-radius: 50%;
                        z-index: 3;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                      "></div>
                    ` : ''}
                    
                    ${report.status === 'resolved' ? `
                      <div style="
                        position: absolute;
                        bottom: -2px;
                        right: 2px;
                        width: 12px;
                        height: 12px;
                        background: linear-gradient(135deg, #68d391 0%, #48bb78 100%);
                        border: 2px solid white;
                        border-radius: 50%;
                        z-index: 3;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                      "></div>
                    ` : ''}
                  </div>
                  
                  <style>
                    @keyframes gentleRipple {
                      0%, 100% { transform: scale(1); opacity: 0.15; }
                      50% { transform: scale(1.08); opacity: 0.08; }
                    }
                    @keyframes subtlePing {
                      0% { transform: scale(1); opacity: 0.15; }
                      100% { transform: scale(1.2); opacity: 0; }
                    }
                    @keyframes sponsoredGlow {
                      0%, 100% { opacity: 0.5; transform: scale(1); }
                      50% { opacity: 0.3; transform: scale(1.02); }
                    }
                  </style>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              })}
            >
              <Popup>
                <div style={{
                  padding: '12px 16px',
                  minWidth: '200px',
                  maxWidth: '250px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      fontSize: '15px',
                      marginRight: '8px',
                    }}>
                      {icon}
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#2d3748',
                      letterSpacing: '0.2px',
                    }}>
                      {report.title}
                    </h3>
                    {isSponsored && (
                      <div style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontSize: '9px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                      }}>
                        SPONSORED
                      </div>
                    )}
                  </div>
                  {report.description && (
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '13px',
                      color: '#4a5568',
                      lineHeight: '1.4',
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
                        height: '90px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    />
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: '#718096',
                    fontWeight: '500',
                  }}>
                    <span>{report.confirmations} confirmations</span>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: color,
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '600',
                      letterSpacing: '0.3px',
                    }}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                  {isFresh && (
                    <div style={{
                      marginTop: '8px',
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textAlign: 'center',
                      letterSpacing: '0.3px',
                    }}>
                      🔥 FRESH REPORT
                    </div>
                  )}
                  {report.metadata?.priceDetails && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      backgroundColor: '#f7fafc',
                      borderRadius: '8px',
                      fontSize: '11px',
                      border: '1px solid #e2e8f0',
                    }}>
                      <strong style={{ color: '#2d3748' }}>{report.metadata.priceDetails.itemName}:</strong> 
                      <span style={{ color: '#4a5568' }}> {report.metadata.priceDetails.price} birr/{report.metadata.priceDetails.unitOfMeasure}</span>
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