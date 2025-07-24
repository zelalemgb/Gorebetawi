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
  highlightedReports?: Report[];
  filteredCategories?: ReportCategory[];
  onMarkerClick: (report: Report) => void;
  onScroll?: (event: any) => void;
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
  highlightedReports = [],
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
        
        {/* Clean tile layer with better street visibility */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Minimalist user location with elegant radius */}
        {/* User presence area - 500m radius */}
        <Circle
          center={center}
          radius={500}
          pathOptions={{
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.06,
            weight: 1.5,
            opacity: 0.4,
            dashArray: '3, 6'
          }}
        />
        
        {/* Inner glow circle */}
        <Circle
          center={center}
          radius={150}
          pathOptions={{
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.12,
            weight: 0,
            opacity: 0
          }}
        />
        
        <Marker
          position={center}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="user-location-container">
                <!-- Outer pulsing glow -->
                <div class="user-glow-ring"></div>
                
                <!-- Middle soft ring -->
                <div class="user-soft-ring"></div>
                
                <!-- Inner core dot -->
                <div class="user-core-dot"></div>
              </div>
              
              <style>
                .user-location-container {
                  position: relative;
                  width: 32px;
                  height: 32px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                
                .user-glow-ring {
                  position: absolute;
                  width: 32px;
                  height: 32px;
                  background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, rgba(102, 126, 234, 0.1) 50%, transparent 70%);
                  border-radius: 50%;
                  animation: userGlow 4s ease-in-out infinite;
                }
                
                .user-soft-ring {
                  position: absolute;
                  width: 20px;
                  height: 20px;
                  background: rgba(102, 126, 234, 0.15);
                  border: 1px solid rgba(102, 126, 234, 0.3);
                  border-radius: 50%;
                  animation: userSoftPulse 3s ease-in-out infinite;
                }
                
                .user-core-dot {
                  position: absolute;
                  width: 12px;
                  height: 12px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                  z-index: 3;
                }
                
                @keyframes userGlow {
                  0%, 100% { 
                    transform: scale(1); 
                    opacity: 0.6; 
                  }
                  50% { 
                    transform: scale(1.2); 
                    opacity: 0.3; 
                  }
                }
                
                @keyframes userSoftPulse {
                  0%, 100% { 
                    transform: scale(1); 
                    opacity: 0.4; 
                  }
                  50% { 
                    transform: scale(1.1); 
                    opacity: 0.6; 
                  }
                }
              </style>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })}
        >
          <Popup>
            <div style={{ 
              textAlign: 'center', 
              padding: '12px 16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              <h3 style={{ 
                margin: '0 0 6px 0', 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#2d3748',
                letterSpacing: '0.3px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                📍 Your Location
              </h3>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#718096',
                fontWeight: '500'
              }}>
                Reports within 500m radius
              </p>
            </div>
          </Popup>
        </Marker>
        
        {/* Elegant minimalist report markers */}
        {reports.map((report) => {
          const color = getCategoryColor(report.category);
          const icon = getCategoryIcon(report.category);
          const isSelected = selectedReport?.id === report.id;
          const isHighlighted = highlightedReports.some(hr => hr.id === report.id);
          const isFresh = Date.now() - report.timestamp < 7200000; // < 2 hours
          const isOngoing = report.metadata?.duration === 'ongoing';
          const isExpired = report.expiresAt ? Date.now() > report.expiresAt : false;
          const isSponsored = report.isSponsored;
          const isVerified = report.status === 'confirmed';
          
          // Hide filtered out reports completely
          const isFiltered = filteredCategories && filteredCategories.length > 0 && !filteredCategories.includes(report.category as any);
          if (isFiltered) return null;
          
          const opacity = isExpired ? 0.5 : (isHighlighted ? 1 : 1);
          
          // Enhanced animations for important pins
          const shouldAnimate = isFresh || isOngoing || isSponsored || isVerified;
          const animationType = isSponsored ? 'sponsored' : 
                              (isFresh ? 'fresh' : 
                              (isOngoing ? 'ongoing' : 'verified'));
          
          return (
            <Marker
              key={report.id}
              position={[report.location.latitude, report.location.longitude]}
              icon={L.divIcon({
                className: `clean-report-marker marker-${report.id}`,
                html: `
                  <div onclick="window.handleMarkerClick && window.handleMarkerClick('${report.id}')" style="
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transform: scale(${isSelected ? 1.2 : (isHighlighted ? 1.15 : 1)});
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: ${opacity};
                    filter: ${isSelected ? 'drop-shadow(0 6px 16px rgba(102, 126, 234, 0.3))' : 
                             (isHighlighted ? 'drop-shadow(0 4px 12px rgba(102, 126, 234, 0.25))' : 'none')};
                    cursor: pointer;
                  ">
                    
                    <!-- Highlight ring for trend-related reports -->
                    ${isHighlighted ? `
                      <div style="
                        position: absolute;
                        width: 44px;
                        height: 44px;
                        border: 2px solid #667eea;
                        border-radius: 50%;
                        opacity: 0.6;
                        animation: highlightPulse 2s ease-in-out infinite;
                      "></div>
                    ` : ''}
                    
                    <!-- Enhanced animations for important pins -->
                    ${isSponsored ? `
                      <div style="
                        position: absolute; 
                        width: 48px;
                        height: 48px;
                        border: 2px dashed #667eea;
                        border-radius: 50%;
                        opacity: 0.6;
                        animation: sponsoredOrbit 4s linear infinite;
                      "></div>
                    ` : ''}
                    
                    ${shouldAnimate && !isExpired ? `
                      <div style="
                        position: absolute;
                        width: ${isFresh ? '50px' : '44px'};
                        height: ${isFresh ? '50px' : '44px'};
                        background-color: ${color};
                        border-radius: 50%;
                        opacity: ${isFresh ? '0.2' : '0.15'};
                        animation: ${isFresh ? 'freshPing' : (isOngoing ? 'ongoingRipple' : 'verifiedGlow')} ${isFresh ? '2s' : '3s'} infinite;
                      "></div>
                    ` : ''}
                    
                    <!-- Enhanced pin body with gradient -->
                    <div style="
                      width: 30px;
                      height: 30px;
                      background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%);
                      border: 3px solid white;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 13px;
                      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2), 0 2px 6px rgba(0,0,0,0.1);
                      position: relative;
                      z-index: 2;
                      transition: all 0.2s ease;
                      ${isFresh ? 'animation: pinPulse 2s ease-in-out infinite;' : ''}
                    ">
                      ${icon}
                    </div>
                    
                    <!-- Enhanced confirmation badge -->
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
                        box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
                        ${isVerified ? 'animation: confirmationGlow 2s ease-in-out infinite;' : ''}
                      ">
                        ${report.confirmations}
                      </div>
                    ` : ''}
                    
                    <!-- Enhanced status indicators -->
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
                        box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
                        animation: statusGlow 3s ease-in-out infinite;
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
                        box-shadow: 0 2px 4px rgba(104, 211, 145, 0.3);
                      "></div>
                    ` : ''}
                    
                    <!-- Fresh report indicator -->
                    ${isFresh ? `
                      <div style="
                        position: absolute;
                        top: -6px;
                        left: -6px;
                        width: 8px;
                        height: 8px;
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                        border: 1px solid white;
                        border-radius: 50%;
                        z-index: 4;
                        animation: freshIndicator 1.5s ease-in-out infinite;
                        box-shadow: 0 1px 3px rgba(255, 107, 107, 0.4);
                      "></div>
                    ` : ''}
                  </div>
                  
                  <!-- Enhanced CSS animations -->
                  <style>
                    @keyframes freshPing {
                      0% { transform: scale(1); opacity: 0.2; }
                      50% { transform: scale(1.15); opacity: 0.1; }
                      100% { transform: scale(1.3); opacity: 0; }
                    }
                    @keyframes ongoingRipple {
                      0%, 100% { transform: scale(1); opacity: 0.15; }
                      50% { transform: scale(1.1); opacity: 0.08; }
                    }
                    @keyframes verifiedGlow {
                      0%, 100% { transform: scale(1); opacity: 0.1; }
                      50% { transform: scale(1.05); opacity: 0.05; }
                    }
                    @keyframes sponsoredOrbit {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes pinPulse {
                      0%, 100% { transform: scale(1); }
                      50% { transform: scale(1.05); }
                    }
                    @keyframes confirmationGlow {
                      0%, 100% { box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3); }
                      50% { box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5); }
                    }
                    @keyframes statusGlow {
                      0%, 100% { box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3); }
                      50% { box-shadow: 0 3px 8px rgba(72, 187, 120, 0.5); }
                    }
                    @keyframes freshIndicator {
                      0%, 100% { transform: scale(1); opacity: 1; }
                      50% { transform: scale(1.2); opacity: 0.7; }
                    }
                    @keyframes highlightPulse {
                      0%, 100% { transform: scale(1); opacity: 0.6; }
                      50% { transform: scale(1.05); opacity: 0.8; }
                    }
                  </style>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              })}
              eventHandlers={{
                click: () => onMarkerClick(report)
              }}
            >
              <Popup>
                <div style={{ maxWidth: '200px' }}>
                  <strong>{report.title}</strong>
                  {report.description && (
                    <p style={{ margin: '4px 0' }}>{report.description}</p>
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