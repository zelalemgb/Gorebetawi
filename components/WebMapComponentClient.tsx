import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polygon } from 'react-leaflet';
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

// Addis Ababa landmarks and services data
const LANDMARKS = [
  {
    id: 'meskel-square',
    name: 'Meskel Square',
    type: 'landmark',
    position: [9.0084, 38.7648] as [number, number],
    icon: '🏛️',
    minZoom: 12
  },
  {
    id: 'bole-airport',
    name: 'Bole International Airport',
    type: 'landmark',
    position: [8.9806, 38.7992] as [number, number],
    icon: '✈️',
    minZoom: 11
  },
  {
    id: 'stadium',
    name: 'Addis Ababa Stadium',
    type: 'landmark',
    position: [9.0184, 38.7578] as [number, number],
    icon: '🏟️',
    minZoom: 13
  },
  {
    id: 'unity-park',
    name: 'Unity Park',
    type: 'landmark',
    position: [9.0370, 38.7578] as [number, number],
    icon: '🌳',
    minZoom: 13
  },
  {
    id: 'national-palace',
    name: 'National Palace',
    type: 'landmark',
    position: [9.0370, 38.7578] as [number, number],
    icon: '🏛️',
    minZoom: 12
  }
];

const LOCAL_SERVICES = [
  // Bole area services
  {
    id: 'bole-medhanialem',
    name: 'Bole Medhanialem Church',
    type: 'religious',
    position: [8.9906, 38.7678] as [number, number],
    icon: '⛪',
    minZoom: 14
  },
  {
    id: 'bole-hospital',
    name: 'Bole Hospital',
    type: 'hospital',
    position: [8.9856, 38.7728] as [number, number],
    icon: '🏥',
    minZoom: 14
  },
  {
    id: 'edna-mall',
    name: 'Edna Mall',
    type: 'shopping',
    position: [8.9956, 38.7628] as [number, number],
    icon: '🛒',
    minZoom: 14
  },
  {
    id: 'bole-school',
    name: 'Bole Primary School',
    type: 'school',
    position: [8.9806, 38.7578] as [number, number],
    icon: '🏫',
    minZoom: 14
  },
  // Kazanchis area
  {
    id: 'kazanchis-market',
    name: 'Kazanchis Market',
    type: 'market',
    position: [9.0284, 38.7478] as [number, number],
    icon: '🛒',
    minZoom: 14
  },
  {
    id: 'kazanchis-clinic',
    name: 'Kazanchis Health Center',
    type: 'clinic',
    position: [9.0234, 38.7528] as [number, number],
    icon: '🏥',
    minZoom: 14
  },
  // Piassa area
  {
    id: 'piassa-market',
    name: 'Piassa Market',
    type: 'market',
    position: [9.0384, 38.7378] as [number, number],
    icon: '🛒',
    minZoom: 14
  },
  {
    id: 'st-george-cathedral',
    name: 'St. George Cathedral',
    type: 'religious',
    position: [9.0334, 38.7428] as [number, number],
    icon: '⛪',
    minZoom: 14
  }
];

const INTERSECTIONS = [
  {
    id: '5-kilo',
    name: '5 Kilo',
    position: [9.0084, 38.7648] as [number, number],
    minZoom: 13
  },
  {
    id: 'bole-brass',
    name: 'Bole Brass',
    position: [8.9906, 38.7678] as [number, number],
    minZoom: 14
  },
  {
    id: 'stadium-roundabout',
    name: 'Stadium Roundabout',
    position: [9.0184, 38.7578] as [number, number],
    minZoom: 13
  },
  {
    id: 'kazanchis-intersection',
    name: 'Kazanchis',
    position: [9.0284, 38.7478] as [number, number],
    minZoom: 13
  }
];

const NEIGHBORHOODS = [
  {
    id: 'bole',
    name: 'Bole',
    bounds: [
      [8.975, 38.750],
      [9.005, 38.750],
      [9.005, 38.785],
      [8.975, 38.785]
    ] as [number, number][],
    color: 'rgba(63, 81, 181, 0.08)',
    minZoom: 12
  },
  {
    id: 'kazanchis',
    name: 'Kazanchis',
    bounds: [
      [9.015, 38.735],
      [9.045, 38.735],
      [9.045, 38.760],
      [9.015, 38.760]
    ] as [number, number][],
    color: 'rgba(67, 160, 71, 0.08)',
    minZoom: 12
  },
  {
    id: 'piassa',
    name: 'Piassa',
    bounds: [
      [9.025, 38.725],
      [9.055, 38.725],
      [9.055, 38.750],
      [9.025, 38.750]
    ] as [number, number][],
    color: 'rgba(255, 152, 0, 0.08)',
    minZoom: 12
  }
];

// Custom hook to update map view when center/zoom changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  
  return null;
}

// Component to handle zoom-based visibility
function ZoomBasedOverlays({ zoom }: { zoom: number }) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(zoom);

  useEffect(() => {
    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  return (
    <>
      {/* Neighborhood zones */}
      {NEIGHBORHOODS.filter(n => currentZoom >= n.minZoom).map(neighborhood => (
        <Polygon
          key={neighborhood.id}
          positions={neighborhood.bounds}
          pathOptions={{
            fillColor: neighborhood.color,
            fillOpacity: 0.3,
            color: neighborhood.color,
            weight: 1,
            opacity: 0.6
          }}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {neighborhood.name}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Neighborhood
              </p>
            </div>
          </Popup>
        </Polygon>
      ))}

      {/* Landmarks */}
      {LANDMARKS.filter(l => currentZoom >= l.minZoom).map(landmark => (
        <Marker
          key={landmark.id}
          position={landmark.position}
          icon={L.divIcon({
            className: 'landmark-marker',
            html: `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateY(-50%);
              ">
                <div style="
                  font-size: 24px;
                  margin-bottom: 4px;
                  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                ">
                  ${landmark.icon}
                </div>
                <div style="
                  background: rgba(255, 255, 255, 0.95);
                  padding: 4px 8px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                  color: #333;
                  white-space: nowrap;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                  border: 1px solid rgba(0,0,0,0.1);
                ">
                  ${landmark.name}
                </div>
              </div>
            `,
            iconSize: [120, 60],
            iconAnchor: [60, 30],
          })}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {landmark.icon}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {landmark.name}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Landmark
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Local Services */}
      {LOCAL_SERVICES.filter(s => currentZoom >= s.minZoom).map(service => (
        <Marker
          key={service.id}
          position={service.position}
          icon={L.divIcon({
            className: 'service-marker',
            html: `
              <div style="
                font-size: 16px;
                opacity: 0.7;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
                transform: translateY(-50%);
              ">
                ${service.icon}
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>
                {service.icon}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                {service.name}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                {service.type}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Intersections */}
      {INTERSECTIONS.filter(i => currentZoom >= i.minZoom).map(intersection => (
        <Marker
          key={intersection.id}
          position={intersection.position}
          icon={L.divIcon({
            className: 'intersection-marker',
            html: `
              <div style="
                background: rgba(255, 255, 255, 0.9);
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 600;
                color: #444;
                border: 1px solid rgba(0,0,0,0.2);
                box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                white-space: nowrap;
                transform: translateY(-50%);
              ">
                ${intersection.name}
              </div>
            `,
            iconSize: [80, 20],
            iconAnchor: [40, 10],
          })}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                {intersection.name}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Major Intersection
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
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
        
        {/* Enhanced tile layer with better street visibility */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Zoom-based overlays */}
        <ZoomBasedOverlays zoom={zoom} />
        
        {/* User location marker and radius */}
        <Circle
          center={center}
          radius={1000} // 1km radius
          pathOptions={{
            color: Colors.accent,
            fillColor: Colors.accent,
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5'
          }}
        />
        <Marker
          position={center}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background-color: ${Colors.accent};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 0 3px ${Colors.accent}40, 0 2px 8px rgba(0,0,0,0.2);
                animation: pulse 2s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0% { box-shadow: 0 0 0 3px ${Colors.accent}40, 0 2px 8px rgba(0,0,0,0.2); }
                  50% { box-shadow: 0 0 0 8px ${Colors.accent}20, 0 2px 8px rgba(0,0,0,0.2); }
                  100% { box-shadow: 0 0 0 3px ${Colors.accent}40, 0 2px 8px rgba(0,0,0,0.2); }
                }
              </style>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                Your Location
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                Current position
              </p>
            </div>
          </Popup>
        </Marker>
        
        {/* Report markers with advanced animations */}
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
          const opacity = isFiltered ? 0.4 : (isExpired ? 0.6 : 1);
          
          return (
            <Marker
              key={report.id}
              position={[report.location.latitude, report.location.longitude]}
              eventHandlers={{
                click: () => onMarkerClick(report)
              }}
              icon={L.divIcon({
                className: 'animated-report-marker',
                html: `
                  <div style="
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transform: scale(${isSelected ? 1.3 : 1});
                    transition: transform 0.2s ease-in-out;
                    opacity: ${opacity};
                  ">
                    ${isSponsored ? `
                      <div style="
                        position: absolute;
                        width: 48px;
                        height: 48px;
                        border: 2px dashed ${Colors.accent};
                        border-radius: 50%;
                        animation: rotate 4s linear infinite;
                        opacity: 0.6;
                      "></div>
                    ` : ''}
                    
                    ${(isOngoing || isFresh) ? `
                      <div style="
                        position: absolute;
                        width: 40px;
                        height: 40px;
                        background-color: ${color};
                        border-radius: 50%;
                        opacity: 0.3;
                        animation: ${isOngoing ? 'pulse' : 'ping'} ${isOngoing ? '2s' : '1s'} infinite;
                      "></div>
                    ` : ''}
                    
                    <div style="
                      width: 32px;
                      height: 32px;
                      background-color: ${color};
                      border: 3px solid white;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 16px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      position: relative;
                      z-index: 2;
                    ">
                      ${icon}
                    </div>
                    
                    ${report.confirmations > 0 ? `
                      <div style="
                        position: absolute;
                        top: -4px;
                        right: -4px;
                        background-color: ${Colors.accent};
                        color: white;
                        border-radius: 10px;
                        min-width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: bold;
                        border: 2px solid white;
                        z-index: 3;
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
                        background-color: ${Colors.success};
                        border: 2px solid white;
                        border-radius: 50%;
                        z-index: 3;
                      "></div>
                    ` : ''}
                    
                    ${report.status === 'resolved' ? `
                      <div style="
                        position: absolute;
                        bottom: -2px;
                        right: 2px;
                        width: 12px;
                        height: 12px;
                        background-color: #4CAF50;
                        border: 2px solid white;
                        border-radius: 50%;
                        z-index: 3;
                      "></div>
                    ` : ''}
                  </div>
                  
                  <style>
                    @keyframes pulse {
                      0%, 100% { transform: scale(1); opacity: 0.3; }
                      50% { transform: scale(1.2); opacity: 0.1; }
                    }
                    @keyframes ping {
                      0% { transform: scale(1); opacity: 0.3; }
                      100% { transform: scale(1.5); opacity: 0; }
                    }
                    @keyframes rotate {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  </style>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
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
                      fontSize: '18px',
                      marginRight: '8px',
                    }}>
                      {icon}
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#333333',
                    }}>
                      {report.title}
                    </h3>
                    {isSponsored && (
                      <div style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        backgroundColor: Colors.accent,
                        color: 'white',
                        fontSize: '10px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                      }}>
                        SPONSORED
                      </div>
                    )}
                  </div>
                  {report.description && (
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      color: '#666666',
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
                        height: '120px',
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
                    fontSize: '12px',
                    color: '#888',
                  }}>
                    <span>{report.confirmations} confirmations</span>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: color,
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                  {isFresh && (
                    <div style={{
                      marginTop: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                      🔥 FRESH REPORT
                    </div>
                  )}
                  {report.metadata?.priceDetails && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      fontSize: '12px',
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