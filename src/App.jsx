import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import { calculateCoastlineOffset, calculateCoastlineOffsetProgressive, convertToKm } from './utils/geo';
import { Menu, X, Check, AlertCircle } from 'lucide-react';

export default function App() {
  // GeoJSON Layers State
  const [countriesData, setCountriesData] = useState(null);
  const [coastlinesData, setCoastlinesData] = useState(null);
  const [customGeoJSON, setCustomGeoJSON] = useState(null);
  
  // App Logic State
  const [activeOffsets, setActiveOffsets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [calcProgress, setCalcProgress] = useState(0);
  const [resolution, setResolution] = useState(() => {
    return localStorage.getItem('coastmap_resolution') || 'low';
  });
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('coastmap_theme') || 'dark';
  });

  // UI State
  const [baseMapStyle, setBaseMapStyle] = useState('dark');
  const [layerVisibility, setLayerVisibility] = useState({
    coastlines: true,
    borders: true,
    custom: true,
    customName: ''
  });
  const [mapCenter, setMapCenter] = useState([25, -15]);
  const [mapZoom, setMapZoom] = useState(3);
  const [mapInstance, setMapInstance] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Status/Toast Message State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Load world datasets based on active resolution with loading state and Promise.all
  useEffect(() => {
    setIsLoadingData(true);
    setCountriesData(null); // Clear old data to unmount Leaflet layers and prevent stale rendering
    setCoastlinesData(null); // Clear old data to unmount Leaflet layers and prevent stale rendering
    
    const countriesPath = resolution === 'low' ? './data/countries_low.json' : './data/countries_detailed.json';
    const coastlinesPath = resolution === 'low' ? './data/coastlines_low.json' : './data/coastlines_detailed.json';

    Promise.all([
      fetch(countriesPath).then(res => {
        if (!res.ok) throw new Error('Error al cargar fronteras');
        return res.json();
      }),
      fetch(coastlinesPath).then(res => {
        if (!res.ok) throw new Error('Error al cargar líneas de costa');
        return res.json();
      })
    ])
    .then(([countries, coastlines]) => {
      setCountriesData(countries);
      setCoastlinesData(coastlines);
      
      // Update rawFeature of selected country to match the new resolution geometry
      if (selectedCountry) {
        const updatedFeature = countries.features.find(f => 
          (f.properties.name === selectedCountry.name || 
           f.properties.NAME === selectedCountry.name)
        );
        if (updatedFeature) {
          setSelectedCountry(prev => ({
            ...prev,
            rawFeature: updatedFeature
          }));
        }
      }
      
      showToast(`Resolución ${resolution === 'low' ? 'Baja (1:110m)' : 'Alta (1:50m)'} cargada con éxito.`, 'success');
    })
    .catch(err => {
      console.error('Error al cargar capas base:', err);
      showToast('Error cargando las capas geográficas base.', 'error');
    })
    .finally(() => {
      setIsLoadingData(false);
    });
  }, [resolution]);

  // 2. Load Persisted State from LocalStorage
  useEffect(() => {
    const savedOffsets = localStorage.getItem('coastmap_offsets');
    if (savedOffsets) {
      try {
        setActiveOffsets(JSON.parse(savedOffsets));
      } catch (e) {
        console.error('Failed to parse saved offsets:', e);
      }
    }

    const savedBookmarks = localStorage.getItem('coastmap_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error('Failed to parse saved bookmarks:', e);
      }
    }

    const savedStyle = localStorage.getItem('coastmap_base_style');
    if (savedStyle) {
      setBaseMapStyle(savedStyle);
    }
  }, []);

  // Save changes to localStorage helper
  const persistOffsets = (offsets) => {
    setActiveOffsets(offsets);
    try {
      localStorage.setItem('coastmap_offsets', JSON.stringify(offsets));
    } catch (e) {
      console.warn("Storage quota exceeded. Could not save to localStorage.");
      showToast('Error al persistir localmente: espacio insuficiente.', 'error');
    }
  };

  const persistBookmarks = (bmarks) => {
    setBookmarks(bmarks);
    try {
      localStorage.setItem('coastmap_bookmarks', JSON.stringify(bmarks));
    } catch (e) {
      console.warn("Storage quota exceeded. Could not save to localStorage.");
      showToast('Error al persistir localmente: espacio insuficiente.', 'error');
    }
  };

  const persistBaseStyle = (style) => {
    setBaseMapStyle(style);
    localStorage.setItem('coastmap_base_style', style);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('coastmap_theme', nextTheme);
    
    // Automatically match map style to theme if not in vector mode
    if (baseMapStyle !== 'vector') {
      persistBaseStyle(nextTheme);
    }
  };

  // Map moves updates
  const handleMapMove = useCallback((center, zoom) => {
    setMapCenter([center.lat, center.lng]);
    setMapZoom(zoom);
  }, []);

  // 3. Add global offset
  const handleAddOffset = ({ distance, unit, label, color }) => {
    if (!coastlinesData || !countriesData) {
      showToast('Cargando datos geográficos base... Inténtalo de nuevo en unos segundos.', 'error');
      return;
    }

    setIsCalculating(true);
    setCalcProgress(0);
    showToast('Calculando offset global hacia el mar...', 'info');

    // Run progressive calculation asynchronously
    calculateCoastlineOffsetProgressive(
      coastlinesData,
      countriesData,
      distance,
      unit,
      true,
      (progress) => {
        setCalcProgress(progress);
      },
      (geom) => {
        const newOffset = {
          id: Math.random().toString(36).substring(2, 9),
          distance,
          unit,
          distanceInKm: convertToKm(distance, unit),
          label,
          color,
          visible: true,
          geometry: geom
        };

        persistOffsets([newOffset, ...activeOffsets]);
        showToast(`Offset de ${distance} ${unit.toUpperCase()} calculado con éxito.`);
        setIsCalculating(false);
      },
      (err) => {
        console.error('Error calculando offset global:', err);
        showToast('Error al calcular el offset geográfico.', 'error');
        setIsCalculating(false);
      }
    );
  };

  // 4. Add localized offset for selected country
  const handleCalculateCountryOffset = (distance, unit, customLabel) => {
    if (!selectedCountry || !countriesData) return;

    setIsCalculating(true);
    setCalcProgress(0);
    showToast(`Calculando offset para ${selectedCountry.name}...`, 'info');

    // Run progressive calculation
    calculateCoastlineOffsetProgressive(
      selectedCountry.rawFeature,
      countriesData,
      distance,
      unit,
      true,
      (progress) => {
        setCalcProgress(progress);
      },
      (geom) => {
        const newOffset = {
          id: Math.random().toString(36).substring(2, 9),
          distance,
          unit,
          distanceInKm: convertToKm(distance, unit),
          label: customLabel,
          color: '#f59e0b', // Default yellow accent for country specific
          visible: true,
          geometry: geom
        };

        persistOffsets([newOffset, ...activeOffsets]);
        showToast(`Offset localizado para ${selectedCountry.name} calculado.`);
        setMobileSidebarOpen(false); // Close sidebar on mobile to show result
        setIsCalculating(false);
      },
      (err) => {
        console.error('Error calculando offset localizado:', err);
        showToast('Error al calcular el offset localizado.', 'error');
        setIsCalculating(false);
      }
    );
  };

  // 5. Delete offset
  const handleDeleteOffset = (id) => {
    const updated = activeOffsets.filter(o => o.id !== id);
    persistOffsets(updated);
    showToast('Offset eliminado.');
  };

  // 6. Toggle visibility of offset
  const handleToggleOffsetVisibility = (id) => {
    const updated = activeOffsets.map(o => 
      o.id === id ? { ...o, visible: !o.visible } : o
    );
    persistOffsets(updated);
  };

  // 7. Save bookmark
  const handleSaveBookmark = (name) => {
    const newBookmark = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      center: mapCenter,
      zoom: mapZoom,
      activeOffsetIds: activeOffsets.filter(o => o.visible).map(o => o.id),
      baseMapStyle
    };

    persistBookmarks([newBookmark, ...bookmarks]);
    showToast(`Vista "${name}" guardada.`);
  };

  // 8. Load bookmark
  const handleLoadBookmark = (b) => {
    setMapCenter(b.center);
    setMapZoom(b.zoom);
    setBaseMapStyle(b.baseMapStyle);
    
    // Restore offset visibility matching bookmark config
    const restored = activeOffsets.map(o => ({
      ...o,
      visible: b.activeOffsetIds.includes(o.id)
    }));
    persistOffsets(restored);
    
    showToast(`Cargada vista: ${b.name}`);
    setMobileSidebarOpen(false); // Close sidebar on mobile
  };

  // 9. Delete bookmark
  const handleDeleteBookmark = (id) => {
    const updated = bookmarks.filter(b => b.id !== id);
    persistBookmarks(updated);
    showToast('Sitio de interés eliminado.');
  };

  // 10. Custom GeoJSON upload
  const handleCustomGeoJSONUpload = (geojson, fileName) => {
    setCustomGeoJSON(geojson);
    setLayerVisibility({
      ...layerVisibility,
      custom: geojson !== null,
      customName: fileName
    });
    if (geojson) {
      showToast(`Archivo "${fileName}" cargado correctamente.`);
    } else {
      showToast('Capa personalizada removida.');
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden relative theme-${theme} ${theme === 'dark' ? 'bg-black text-slate-100' : 'bg-white text-black'} theme-transition`}>
      
      {/* Desktop & Mobile Sidebar Wrapper */}
      <div className={`
        absolute md:relative inset-y-0 left-0 z-30 transition-transform duration-300 md:translate-x-0
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        h-full
      `}>
        <Sidebar
          theme={theme}
          handleToggleTheme={handleToggleTheme}
          isCalculating={isCalculating}
          activeOffsets={activeOffsets}
          handleAddOffset={handleAddOffset}
          handleDeleteOffset={handleDeleteOffset}
          handleToggleOffsetVisibility={handleToggleOffsetVisibility}
          bookmarks={bookmarks}
          handleSaveBookmark={handleSaveBookmark}
          handleLoadBookmark={handleLoadBookmark}
          handleDeleteBookmark={handleDeleteBookmark}
          selectedCountry={selectedCountry}
          handleCalculateCountryOffset={handleCalculateCountryOffset}
          baseMapStyle={baseMapStyle}
          setBaseMapStyle={persistBaseStyle}
          layerVisibility={layerVisibility}
          setLayerVisibility={setLayerVisibility}
          handleCustomGeoJSONUpload={handleCustomGeoJSONUpload}
          mapInstance={mapInstance}
          resolution={resolution}
          setResolution={(res) => {
            setResolution(res);
            localStorage.setItem('coastmap_resolution', res);
          }}
          isLoadingData={isLoadingData}
        />
      </div>

      {/* Main Map View Area */}
      <main className="flex-1 h-full w-full relative flex flex-col">
        {/* Floating Header for Mobile / Sidebar toggle */}
        <header className="absolute top-4 left-4 z-20 pointer-events-auto md:hidden">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className={`p-3 backdrop-blur border rounded-xl shadow-xl transition-colors ${
              theme === 'dark'
                ? 'bg-neutral-900/90 border-neutral-800 text-slate-100 hover:bg-neutral-800'
                : 'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Selected Country Details Floating Overlay (Desktop) */}
        {selectedCountry && !mobileSidebarOpen && (
          <div className={`absolute top-4 right-4 z-20 pointer-events-auto max-w-sm w-80 glass-panel p-4 rounded-xl shadow-2xl animate-slideDown hidden md:block ${
            theme === 'dark'
              ? 'bg-black/90 border-neutral-900 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-900'}`}>{selectedCountry.name}</h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  País Seleccionado
                </p>
              </div>
              <button 
                onClick={() => setSelectedCountry(null)}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark' ? 'text-slate-500 hover:text-slate-350 hover:bg-neutral-850' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-3 text-xs space-y-2">
              <div className={`flex justify-between border-b pb-1.5 ${theme === 'dark' ? 'border-neutral-900 text-slate-400' : 'border-slate-105 text-slate-500'}`}>
                <span>ISO</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{selectedCountry.isoCode}</span>
              </div>
              <div className={`flex justify-between border-b pb-1.5 ${theme === 'dark' ? 'border-neutral-900 text-slate-400' : 'border-slate-105 text-slate-500'}`}>
                <span>Continente/Región</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{selectedCountry.region}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <button
                onClick={() => handleCalculateCountryOffset(12, 'nm', `12mn (${selectedCountry.name})`)}
                className={`w-full font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer text-center border ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-neutral-800 text-slate-200 hover:bg-neutral-900'
                    : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                }`}
              >
                Calcular Offset Territorial (12 mn)
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Minimalist Loading Overlay for geometry calculations */}
        {isCalculating && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-30 flex items-center justify-center pointer-events-auto transition-all animate-fadeIn">
            <div className={`p-6 rounded-2xl border shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs ${
              theme === 'dark' 
                ? 'bg-black/95 border-neutral-900 text-slate-100 shadow-black' 
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300'
            }`}>
              <div className="relative flex items-center justify-center w-12 h-12">
                <div className="absolute w-12 h-12 rounded-full border-4 border-indigo-500/20 animate-ping"></div>
                <div className="absolute w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">Calculando Offset</h4>
                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-1">
                  Procesando: {calcProgress}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Loading Overlay for base geographic datasets */}
        {isLoadingData && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] z-30 flex items-center justify-center pointer-events-none transition-all">
            <div className={`p-4 rounded-xl border shadow-xl flex items-center gap-3 ${
              theme === 'dark' 
                ? 'bg-black/90 border-neutral-900 text-slate-100 shadow-black' 
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200'
            }`}>
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              <span className="text-xs font-bold tracking-wide">
                Cargando mapa base ({resolution === 'low' ? 'Baja (1:110m)' : 'Alta (1:50m)'})...
              </span>
            </div>
          </div>
        )}

        <MapView
          theme={theme}
          countriesData={countriesData}
          coastlinesData={coastlinesData}
          customGeoJSON={customGeoJSON}
          activeOffsets={activeOffsets}
          bookmarks={bookmarks}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          baseMapStyle={baseMapStyle}
          layerVisibility={layerVisibility}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          setMapInstance={setMapInstance}
          onMapMove={handleMapMove}
          resolution={resolution}
        />
      </main>

      {/* Mobile Sidebar overlay backdrop */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className={`absolute inset-0 backdrop-blur-sm z-25 md:hidden ${
            theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/40'
          }`}
        />
      )}

      {/* Floating Status Notification / Toast */}
      {toast && (
        <div className={`
          absolute bottom-6 right-6 z-40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border transition-all duration-300 transform translate-y-0
          ${theme === 'dark'
            ? 'bg-neutral-950 border-neutral-900 text-slate-100 shadow-black'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'}
        `}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
          ) : (
            <Check className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
