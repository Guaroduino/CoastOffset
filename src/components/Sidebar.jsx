import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Bookmark, 
  Eye, 
  EyeOff, 
  Settings, 
  Upload, 
  Globe, 
  Navigation,
  Info,
  Layers,
  MapPin,
  Sun,
  Moon
} from 'lucide-react';

const COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
];

export default function Sidebar({
  theme,
  handleToggleTheme,
  isCalculating,
  activeOffsets,
  handleAddOffset,
  handleDeleteOffset,
  handleToggleOffsetVisibility,
  bookmarks,
  handleSaveBookmark,
  handleLoadBookmark,
  handleDeleteBookmark,
  selectedCountry,
  handleCalculateCountryOffset,
  baseMapStyle,
  setBaseMapStyle,
  layerVisibility,
  setLayerVisibility,
  handleCustomGeoJSONUpload,
  mapInstance,
  resolution,
  setResolution
}) {
  const [activeTab, setActiveTab] = useState('offsets');
  
  // Offset Form State
  const [distance, setDistance] = useState('12');
  const [unit, setUnit] = useState('nm');
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  // Bookmark Form State
  const [bookmarkName, setBookmarkName] = useState('');
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);

  // File Upload State
  const [uploadError, setUploadError] = useState('');

  const onCreateOffset = (e) => {
    e.preventDefault();
    const distNum = parseFloat(distance);
    if (isNaN(distNum) || distNum <= 0) return;
    
    const tag = label.trim() || `${distNum} ${unit.toUpperCase()}`;
    handleAddOffset({
      distance: distNum,
      unit,
      label: tag,
      color: selectedColor,
    });
    setLabel('');
  };

  const onCreateBookmark = (e) => {
    e.preventDefault();
    if (!bookmarkName.trim()) return;
    handleSaveBookmark(bookmarkName.trim());
    setBookmarkName('');
    setIsSavingBookmark(false);
  };

  const onFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.type === 'FeatureCollection' || json.type === 'Feature') {
          handleCustomGeoJSONUpload(json, file.name);
          setUploadError('');
          setActiveTab('offsets'); // Switch to offsets or main area
        } else {
          setUploadError('Formato inválido. Debe ser Feature o FeatureCollection GeoJSON.');
        }
      } catch (err) {
        setUploadError('Error al analizar archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Helper function to dynamically class tabs
  const getTabClass = (tabId) => {
    const isActive = activeTab === tabId;
    const base = "flex-1 py-3 px-1 text-center font-semibold text-[11px] border-b-2 flex flex-col items-center gap-1 transition-all cursor-pointer";
    
    if (theme === 'dark') {
      return `${base} ${isActive 
        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
        : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-zinc-900/30'}`;
    } else {
      return `${base} ${isActive 
        ? 'border-black text-black bg-slate-50' 
        : 'border-transparent text-slate-400 hover:text-black hover:bg-slate-100/50'}`;
    }
  };

  // Helper colors classes based on theme
  const textTitleClass = theme === 'dark' ? 'text-slate-100 text-glow' : 'text-slate-900';
  const textSubTitleClass = theme === 'dark' ? 'text-indigo-400/80' : 'text-slate-550';
  const headerBgClass = theme === 'dark' ? 'border-neutral-900 bg-neutral-950/40' : 'border-slate-100 bg-slate-50/50';
  const navBgClass = theme === 'dark' ? 'border-neutral-900 bg-neutral-950/40' : 'border-slate-150 bg-slate-50/50';
  const labelClass = `block text-[10px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`;
  const inputClass = `w-full border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none ${
    theme === 'dark'
      ? 'bg-black border-neutral-900 text-white focus:border-indigo-500'
      : 'bg-white border-slate-200 text-black focus:border-black'
  }`;
  const selectClass = `w-full border rounded-lg px-2 py-2 text-sm transition-all focus:outline-none ${
    theme === 'dark'
      ? 'bg-black border-neutral-900 text-white focus:border-indigo-500'
      : 'bg-white border-slate-200 text-black focus:border-black'
  }`;
  const formBoxClass = `space-y-3 p-4 rounded-xl border ${
    theme === 'dark'
      ? 'bg-zinc-950/50 border-neutral-900'
      : 'bg-slate-50 border-slate-150'
  }`;
  const panelTitleClass = `text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`;
  const listEmptyBoxClass = `text-center py-8 border border-dashed rounded-xl ${
    theme === 'dark'
      ? 'bg-zinc-950/10 border-neutral-900'
      : 'bg-slate-50/40 border-slate-200'
  }`;
  
  // Minimalist Buttons
  const mainBtnClass = `w-full font-bold py-2 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border ${
    theme === 'dark'
      ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white hover:border-zinc-700'
      : 'bg-slate-100 border-slate-200 hover:bg-slate-250 text-black hover:border-slate-350'
  }`;
  const actionBtnClass = `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
    theme === 'dark'
      ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white'
      : 'bg-slate-100 border-slate-200 hover:bg-slate-250 text-black'
  }`;
  const cancelBtnClass = `px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 transition-colors cursor-pointer border ${
    theme === 'dark'
      ? 'border-neutral-800 text-slate-400 hover:bg-neutral-900 hover:text-slate-200'
      : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

  return (
    <aside className="w-full md:w-96 h-full glass-panel flex flex-col z-20 overflow-hidden shadow-2xl theme-transition">
      {/* Brand Header */}
      <div className={`p-5 border-b flex items-center justify-between transition-colors ${headerBgClass}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${
            theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-black/5 border-black/10 text-slate-800'
          }`}>
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className={`text-lg font-extrabold tracking-wide ${textTitleClass}`}>CoastMap PWA</h1>
            <p className={`text-[10px] font-semibold tracking-wider uppercase ${textSubTitleClass}`}>Offsets &amp; Sites Vectoriales</p>
          </div>
        </div>
        
        {/* Theme and PWA toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-zinc-950 border-neutral-900 text-yellow-400 hover:bg-zinc-900 hover:border-zinc-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`flex border-b transition-colors ${navBgClass}`}>
        <button onClick={() => setActiveTab('offsets')} className={getTabClass('offsets')}>
          <Layers className="w-4 h-4" />
          <span>Offsets</span>
        </button>
        <button onClick={() => setActiveTab('bookmarks')} className={getTabClass('bookmarks')}>
          <Bookmark className="w-4 h-4" />
          <span>Sitios</span>
        </button>
        <button onClick={() => setActiveTab('info')} className={getTabClass('info')}>
          <Info className="w-4 h-4" />
          <span>País ({selectedCountry ? '1' : '0'})</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={getTabClass('settings')}>
          <Settings className="w-4 h-4" />
          <span>Ajustes</span>
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* TAB 1: OFFSETS */}
        {activeTab === 'offsets' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Create Offset Form */}
            <div className="space-y-3">
              <h2 className={panelTitleClass}>Calcular Nuevo Offset</h2>
              <form onSubmit={onCreateOffset} className={formBoxClass}>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className={labelClass}>Distancia</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="e.g. 12"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-28">
                    <label className={labelClass}>Unidad</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className={selectClass}
                    >
                      <option value="nm">Millas Náuticas</option>
                      <option value="km">Kilómetros</option>
                      <option value="mi">Millas Terrestres</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Etiqueta / Tag (Opcional)</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Límite Territorial 12mn"
                    className={inputClass}
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className={labelClass}>Color del Trazado</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform border ${
                          selectedColor === c 
                            ? 'scale-120 ring-1 ring-offset-1 ' + (theme === 'dark' ? 'ring-slate-100 ring-offset-black' : 'ring-black ring-offset-white')
                            : 'hover:scale-110 border-black/10'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer overflow-hidden"
                    />
                  </div>
                </div>

                <button type="submit" disabled={isCalculating} className={mainBtnClass}>
                  {isCalculating ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"></div>
                      <span>Calculando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Calcular desde Costa</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List of Active Offsets */}
            <div className="space-y-3">
              <h2 className={panelTitleClass}>Offsets Guardados</h2>
              {activeOffsets.length === 0 ? (
                <div className={listEmptyBoxClass}>
                  <p className="text-xs text-slate-550">No hay offsets calculados.</p>
                  <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-indigo-400/60' : 'text-slate-400'}`}>
                    Agrega una distancia arriba para comenzar.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeOffsets.map((offset) => (
                    <div 
                      key={offset.id} 
                      className={`flex items-center justify-between border p-3 rounded-xl transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-950/30 border-neutral-900 hover:border-neutral-800'
                          : 'bg-slate-50/50 border-slate-150 hover:border-slate-250'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleOffsetVisibility(offset.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            offset.visible 
                              ? (theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900/10 border-slate-900/20 text-slate-800') 
                              : (theme === 'dark' ? 'bg-black border-neutral-900 text-slate-500' : 'bg-white border-slate-200 text-slate-400')
                          }`}
                        >
                          {offset.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <div>
                          <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{offset.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {offset.distance} {offset.unit.toUpperCase()} ({offset.distanceInKm.toFixed(1)} km)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-black/10" 
                          style={{ backgroundColor: offset.color }}
                        />
                        <button
                          onClick={() => handleDeleteOffset(offset.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            theme === 'dark' ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-650 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SITIOS DE INTERÉS (BOOKMARKS) */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className={panelTitleClass}>Sitios de Interés</h2>
                {!isSavingBookmark && (
                  <button
                    onClick={() => setIsSavingBookmark(true)}
                    className={`text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline ${
                      theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-800 hover:text-black'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Vista</span>
                  </button>
                )}
              </div>

              {isSavingBookmark && (
                <form onSubmit={onCreateBookmark} className={formBoxClass}>
                  <div>
                    <label className={labelClass}>Nombre del Sitio / Vista</label>
                    <input
                      type="text"
                      required
                      value={bookmarkName}
                      onChange={(e) => setBookmarkName(e.target.value)}
                      placeholder="e.g. Caribe Oriental"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setIsSavingBookmark(false)} className={cancelBtnClass}>
                      Cancelar
                    </button>
                    <button type="submit" className={actionBtnClass}>
                      Guardar
                    </button>
                  </div>
                </form>
              )}

              {bookmarks.length === 0 ? (
                <div className={listEmptyBoxClass}>
                  <p className="text-xs text-slate-550">No hay sitios guardados.</p>
                  <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-indigo-400/60' : 'text-slate-400'}`}>
                    Guarda tu vista y offsets actuales.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((b) => (
                    <div 
                      key={b.id} 
                      className={`flex items-center justify-between border p-3 rounded-xl transition-all group ${
                        theme === 'dark'
                          ? 'bg-zinc-950/30 border-neutral-900 hover:border-indigo-500/30'
                          : 'bg-slate-50/50 border-slate-150 hover:border-black/30'
                      }`}
                    >
                      <button
                        onClick={() => handleLoadBookmark(b)}
                        className="flex-1 text-left flex items-start gap-3 cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{b.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Zoom: {b.zoom} | {b.activeOffsetIds.length} offsets
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteBookmark(b.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          theme === 'dark' ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-650 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PAÍS SELECCIONADO (INFO) */}
        {activeTab === 'info' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-3">
              <h2 className={panelTitleClass}>Detalles del País</h2>
              
              {!selectedCountry ? (
                <div className={listEmptyBoxClass + " p-6 space-y-2"}>
                  <Globe className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
                  <p className="text-xs text-slate-550">Haz clic en el mapa sobre un país para ver su información y calcular offsets específicos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`border p-4 rounded-xl space-y-3 ${
                    theme === 'dark' ? 'bg-zinc-950/40 border-neutral-900' : 'bg-slate-50 border-slate-150'
                  }`}>
                    <div>
                      <h3 className={`text-base font-extrabold ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-900'}`}>{selectedCountry.name}</h3>
                      <p className="text-[9px] text-slate-500 tracking-wide uppercase font-bold mt-0.5">
                        Soberanía / Territorio
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded border ${theme === 'dark' ? 'bg-black/50 border-neutral-900' : 'bg-white border-slate-150'}`}>
                        <span className="block text-[8px] text-slate-500 font-bold uppercase">Código ISO</span>
                        <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{selectedCountry.isoCode || 'N/A'}</span>
                      </div>
                      <div className={`p-2 rounded border ${theme === 'dark' ? 'bg-black/50 border-neutral-900' : 'bg-white border-slate-150'}`}>
                        <span className="block text-[8px] text-slate-500 font-bold uppercase">Región</span>
                        <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{selectedCountry.region || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acciones de Offset Localizado</h4>
                    
                    <button
                      onClick={() => handleCalculateCountryOffset(12, 'nm', `Territorial 12mn (${selectedCountry.name})`)}
                      className={`w-full text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer border ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-neutral-900 hover:bg-neutral-900 text-slate-200'
                          : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span>Zona Territorial (12 mn)</span>
                      <span className="text-[10px] text-indigo-500 font-bold">22.2 km &rarr;</span>
                    </button>
                    
                    <button
                      onClick={() => handleCalculateCountryOffset(24, 'nm', `Contigua 24mn (${selectedCountry.name})`)}
                      className={`w-full text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer border ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-neutral-900 hover:bg-neutral-900 text-slate-200'
                          : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span>Zona Contigua (24 mn)</span>
                      <span className="text-[10px] text-indigo-500 font-bold">44.4 km &rarr;</span>
                    </button>

                    <button
                      onClick={() => handleCalculateCountryOffset(200, 'nm', `ZEE 200mn (${selectedCountry.name})`)}
                      className={`w-full text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-between transition-colors cursor-pointer border ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-neutral-900 hover:bg-neutral-900 text-slate-200'
                          : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span>Zona Económica Exclusiva (200 mn)</span>
                      <span className="text-[10px] text-indigo-500 font-bold">370.4 km &rarr;</span>
                    </button>
                  </div>

                  <p className="text-[9px] text-slate-500 italic leading-relaxed">
                    *El offset localizado se calcula aplicando el buffer al perímetro de este país en particular y restando su territorio firme y el de los colindantes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AJUSTES & CAPAS (SETTINGS) */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Base Maps Style */}
            <div className="space-y-3">
              <h2 className={panelTitleClass}>Estilo del Mapa Base</h2>
              <div className={`grid grid-cols-3 gap-2 p-2 border rounded-xl ${
                theme === 'dark' ? 'bg-zinc-950/30 border-neutral-900' : 'bg-slate-50 border-slate-150'
              }`}>
                <button
                  onClick={() => setBaseMapStyle('dark')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    baseMapStyle === 'dark'
                      ? (theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-slate-100 shadow-md' : 'bg-black border-black text-white shadow-md')
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Oscuro
                </button>
                <button
                  onClick={() => setBaseMapStyle('light')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    baseMapStyle === 'light'
                      ? (theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-slate-100 shadow-md' : 'bg-slate-200 border-slate-350 text-black shadow-sm')
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Claro
                </button>
                <button
                  onClick={() => setBaseMapStyle('vector')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    baseMapStyle === 'vector'
                      ? (theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-slate-100 shadow-md' : 'bg-slate-200 border-slate-350 text-black shadow-sm')
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Solo Vector
                </button>
              </div>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-3">
              <h2 className={panelTitleClass}>Resolución de Datos Base</h2>
              <div className={`border p-4 rounded-xl space-y-3 ${
                theme === 'dark' ? 'bg-zinc-950/30 border-neutral-900' : 'bg-slate-50 border-slate-150'
              }`}>
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="resolution"
                      value="low"
                      checked={resolution === 'low'}
                      onChange={() => setResolution('low')}
                      className={`w-4 h-4 mt-0.5 focus:ring-offset-slate-900 focus:ring-2 ${
                        theme === 'dark' ? 'text-indigo-600 bg-black border-neutral-800 focus:ring-indigo-500' : 'text-black bg-white border-slate-300 focus:ring-black'
                      }`}
                    />
                    <div>
                      <span className={`text-xs font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        Baja (1:110m)
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Cálculos instantáneos. Recomendado para ordenadores o móviles de gama baja. (~1 MB)
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="resolution"
                      value="detailed"
                      checked={resolution === 'detailed'}
                      onChange={() => setResolution('detailed')}
                      className={`w-4 h-4 mt-0.5 focus:ring-offset-slate-900 focus:ring-2 ${
                        theme === 'dark' ? 'text-indigo-600 bg-black border-neutral-800 focus:ring-indigo-500' : 'text-black bg-white border-slate-300 focus:ring-black'
                      }`}
                    />
                    <div>
                      <span className={`text-xs font-semibold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        Alta (1:50m)
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Líneas detalladas e islas adicionales. Requiere mayor capacidad de procesador. (~4.7 MB)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-3">
              <h2 className={panelTitleClass}>Visibilidad de Capas</h2>
              <div className={`border p-4 rounded-xl space-y-3 ${
                theme === 'dark' ? 'bg-zinc-950/30 border-neutral-900' : 'bg-slate-50 border-slate-150'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Líneas de Costa (GeoJSON)</span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.coastlines}
                    onChange={(e) => setLayerVisibility({
                      ...layerVisibility,
                      coastlines: e.target.checked
                    })}
                    className={`w-4 h-4 rounded focus:ring-offset-slate-900 focus:ring-2 ${
                      theme === 'dark' ? 'text-indigo-600 bg-black border-neutral-800 focus:ring-indigo-500' : 'text-black bg-white border-slate-300 focus:ring-black'
                    }`}
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Fronteras Internacionales (GeoJSON)</span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.borders}
                    onChange={(e) => setLayerVisibility({
                      ...layerVisibility,
                      borders: e.target.checked
                    })}
                    className={`w-4 h-4 rounded focus:ring-offset-slate-900 focus:ring-2 ${
                      theme === 'dark' ? 'text-indigo-600 bg-black border-neutral-800 focus:ring-indigo-500' : 'text-black bg-white border-slate-300 focus:ring-black'
                    }`}
                  />
                </label>
              </div>
            </div>

            {/* Custom GeoJSON Upload */}
            <div className="space-y-3">
              <h2 className={panelTitleClass}>Cargar GeoJSON Personalizado</h2>
              <div className={`border p-4 rounded-xl space-y-3 ${
                theme === 'dark' ? 'bg-zinc-950/30 border-neutral-900' : 'bg-slate-50 border-slate-150'
              }`}>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Carga tu propia línea de costa o frontera en formato GeoJSON para calcular offsets en áreas específicas o de alta resolución.
                </p>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json,.geojson"
                    onChange={onFileUpload}
                    id="file-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`w-full border border-dashed py-4 px-3 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                      theme === 'dark'
                        ? 'bg-black border-neutral-800 hover:border-neutral-700 text-slate-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span>Seleccionar Archivo GeoJSON</span>
                  </label>
                </div>
                
                {layerVisibility.customName && (
                  <div className={`text-xs p-2 rounded-lg border flex items-center justify-between font-medium ${
                    theme === 'dark' ? 'text-indigo-400 bg-indigo-500/5 border-indigo-500/20' : 'text-slate-800 bg-slate-100 border-slate-200'
                  }`}>
                    <span className="truncate">Activo: {layerVisibility.customName}</span>
                    <button 
                      onClick={() => handleCustomGeoJSONUpload(null, '')}
                      className="text-red-500 font-bold hover:underline cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}

                {uploadError && (
                  <p className="text-[10px] text-red-500 bg-red-500/5 p-2 rounded border border-red-500/20">
                    {uploadError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className={`p-4 border-t text-center text-[9px] font-semibold tracking-wide uppercase transition-colors ${
        theme === 'dark' ? 'border-neutral-900 bg-neutral-950/40 text-slate-600' : 'border-slate-100 bg-slate-50/50 text-slate-400'
      }`}>
        <p>Desarrollado por Her. Corado 2026. Venezuela</p>
        <p className="mt-0.5">Funciona 100% Offline</p>
      </div>
    </aside>
  );
}
