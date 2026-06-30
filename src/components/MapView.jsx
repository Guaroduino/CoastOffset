import React, { useEffect, useRef, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Popup, 
  Marker, 
  useMap,
  ScaleControl
} from 'react-leaflet';
import L from 'leaflet';

// Clean Leaflet marker bug using DivIcon with glowing ring matching active theme
const createCustomMarker = (color = '#6366f1', theme = 'dark') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-6 h-6 rounded-full opacity-35 animate-ping" style="background-color: ${color}"></div>
        <div class="w-3.5 h-3.5 rounded-full border-2 ${theme === 'dark' ? 'border-black' : 'border-white'} shadow-lg" style="background-color: ${color}"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Map controller to coordinate center/zoom updates and capture map instance
function MapController({ center, zoom, setMapInstance, onMapMove }) {
  const map = useMap();

  useEffect(() => {
    if (setMapInstance) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);

  // Hook Leaflet view changes
  useEffect(() => {
    const handleMoveEnd = () => {
      onMapMove(map.getCenter(), map.getZoom());
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onMapMove]);

  // React to programmatic center/zoom updates (e.g. bookmarks)
  useEffect(() => {
    if (center && zoom) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      
      // Only fly if there's a real difference to avoid infinite loops
      const dist = currentCenter.distanceTo(L.latLng(center[0], center[1]));
      if (dist > 100 || currentZoom !== zoom) {
        map.setView(center, zoom, { animate: true, duration: 1.5 });
      }
    }
  }, [center, zoom, map]);

  return null;
}

export default function MapView({
  theme,
  countriesData,
  coastlinesData,
  customGeoJSON,
  activeOffsets,
  bookmarks,
  selectedCountry,
  onSelectCountry,
  baseMapStyle,
  layerVisibility,
  mapCenter,
  mapZoom,
  setMapInstance,
  onMapMove,
  resolution
}) {
  const countriesLayerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [hoveredCountryName, setHoveredCountryName] = useState('');

  // Re-style countries when selectedCountry, theme, or baseMapStyle changes
  useEffect(() => {
    if (countriesLayerRef.current) {
      countriesLayerRef.current.eachLayer((layer) => {
        const feat = layer.feature;
        const isSelected = selectedCountry && 
          (feat.properties.name === selectedCountry.name || 
           feat.properties.NAME === selectedCountry.name);
        
        layer.setStyle(getCountryStyleForFeature(feat, isSelected));
      });
    }
  }, [selectedCountry, baseMapStyle, theme]);

  // Unified country style resolver
  const getCountryStyleForFeature = (feature, isSelected) => {
    if (theme === 'light') {
      return {
        fillColor: isSelected ? '#cbd5e1' : '#ffffff',
        fillOpacity: isSelected 
          ? 0.4 
          : (baseMapStyle === 'vector' ? 1.0 : 0.05),
        color: isSelected ? '#000000' : '#d4d4d4',
        weight: isSelected ? 2 : 0.8,
        dashArray: '3, 4',
      };
    } else {
      // Dark Theme
      return {
        fillColor: isSelected ? '#262626' : '#000000',
        fillOpacity: isSelected 
          ? 0.4 
          : (baseMapStyle === 'vector' ? 1.0 : 0.05),
        color: isSelected ? '#ffffff' : '#262626',
        weight: isSelected ? 2 : 0.8,
        dashArray: '3, 4',
      };
    }
  };

  const countryStyle = (feature) => {
    const isSelected = selectedCountry && 
      (feature.properties.name === selectedCountry.name || 
       feature.properties.NAME === selectedCountry.name);

    return getCountryStyleForFeature(feature, isSelected);
  };

  // Coastline styling
  const coastlineStyle = {
    color: theme === 'light' ? '#000000' : '#38bdf8', // stark black lines in light mode, sky blue in dark
    weight: theme === 'light' ? 1.5 : 1.2,
    fill: false
  };

  // Custom GeoJSON styling
  const customLayerStyle = {
    color: theme === 'light' ? '#ea580c' : '#ec4899', // Orange in light, pink in dark
    weight: 2,
    fillColor: theme === 'light' ? '#ea580c' : '#ec4899',
    fillOpacity: 0.1
  };

  // Handle events on country polygon
  const onEachCountry = (feature, layer) => {
    layer.on({
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        const props = feature.properties;
        onSelectCountry({
          name: props.name || props.NAME || 'Desconocido',
          isoCode: props.iso_a3 || props.ISO_A3 || props.iso_a2 || 'N/A',
          region: props.subregion || props.SUBREGION || props.continent || 'N/A',
          rawFeature: feature // Save raw geometry to run localized buffer
        });
      },
      mouseover: (e) => {
        const l = e.target;
        setHoveredCountryName(feature.properties.name || feature.properties.NAME || '');
        
        // Hover styling
        l.setStyle({
          fillColor: theme === 'light' ? '#e5e5e5' : '#171717',
          fillOpacity: baseMapStyle === 'vector' ? 1.0 : 0.3
        });
      },
      mouseout: (e) => {
        const l = e.target;
        setHoveredCountryName('');
        // Restore styling
        const isSelected = selectedCountry && 
          (feature.properties.name === selectedCountry.name || 
           feature.properties.NAME === selectedCountry.name);
        
        l.setStyle(getCountryStyleForFeature(feature, isSelected));
      }
    });
  };

  // Base map Tile URL based on style
  const getTileUrl = () => {
    if (baseMapStyle === 'light') {
      return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
    // Default to dark theme
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  return (
    <div 
      className={`relative flex-1 h-full w-full overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-black' : 'bg-white'
      }`} 
      ref={mapContainerRef}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={true}
        className="w-full h-full"
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={0.8}
      >
        <MapController 
          center={mapCenter} 
          zoom={mapZoom} 
          setMapInstance={setMapInstance}
          onMapMove={onMapMove}
        />

        {/* Tile base layer (hidden if Vector-Only mode is selected) */}
        {baseMapStyle !== 'vector' && (
          <TileLayer
            url={getTileUrl()}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        )}

        {/* Global country borders */}
        {layerVisibility.borders && countriesData && (
          <GeoJSON
            key={`countries-${baseMapStyle}-${theme}-${resolution}`}
            data={countriesData}
            style={countryStyle}
            onEachFeature={onEachCountry}
            ref={countriesLayerRef}
          />
        )}

        {/* Global coastlines */}
        {layerVisibility.coastlines && coastlinesData && (
          <GeoJSON
            key={`coastlines-${theme}-${resolution}`}
            data={coastlinesData}
            style={coastlineStyle}
          />
        )}

        {/* Custom GeoJSON layer upload */}
        {layerVisibility.custom && customGeoJSON && (
          <GeoJSON
            key={`custom-${theme}`}
            data={customGeoJSON}
            style={customLayerStyle}
          />
        )}

        {/* Calculated Coastal Offsets */}
        {activeOffsets.map((offset) => {
          if (!offset.visible || !offset.geometry) return null;
          return (
            <GeoJSON
              key={offset.id}
              data={offset.geometry}
              style={{
                color: offset.color,
                weight: theme === 'light' ? 2 : 1.5,
                dashArray: '4, 4',
                fillColor: offset.color,
                fillOpacity: theme === 'light' ? 0.12 : 0.15,
              }}
            >
              <Popup>
                <div className={`p-2 space-y-1 ${theme === 'dark' ? 'text-slate-105' : 'text-slate-900'}`}>
                  <span className="block font-extrabold text-xs" style={{ color: offset.color }}>
                    {offset.label}
                  </span>
                  <div className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <p>Distancia: <span className={`font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-950'}`}>{offset.distance} {offset.unit.toUpperCase()}</span></p>
                    <p>Equivalente: <span className={`font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-950'}`}>{offset.distanceInKm.toFixed(2)} km</span></p>
                  </div>
                </div>
              </Popup>
            </GeoJSON>
          );
        })}

        {/* Saved bookmarks as glowing map pins */}
        {bookmarks.map((b) => (
          <Marker
            key={b.id}
            position={b.center}
            icon={createCustomMarker(
              activeOffsets.some(o => b.activeOffsetIds.includes(o.id)) ? '#6366f1' : '#737373',
              theme
            )}
          >
            <Popup>
              <div className={`p-2 space-y-1 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                <span className="block font-extrabold text-xs text-indigo-500">{b.name}</span>
                <span className={`block text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Vista guardada con {b.activeOffsetIds.length} offsets.
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        <ScaleControl position="bottomright" imperial={false} />
      </MapContainer>

      {/* Floating coordinates and status bar */}
      <div className="absolute bottom-5 left-5 z-20 pointer-events-none space-y-2">
        {hoveredCountryName && (
          <div className={`backdrop-blur border px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg tracking-wide uppercase ${
            theme === 'dark' 
              ? 'bg-black/85 border-neutral-900 text-slate-200' 
              : 'bg-white/95 border-slate-200 text-black'
          }`}>
            {hoveredCountryName}
          </div>
        )}
      </div>
    </div>
  );
}
