import * as turf from '@turf/turf';

/**
 * Converts a distance from a given unit to kilometers.
 * Supports: 'km' (kilometers), 'mi' (miles), 'nm' (nautical miles)
 */
export const convertToKm = (distance, unit) => {
  const val = parseFloat(distance);
  if (isNaN(val)) return 0;
  
  switch (unit) {
    case 'nm': // Nautical Miles
      return val * 1.852;
    case 'mi': // Statute Miles
      return val * 1.60934;
    case 'km':
    default:
      return val;
  }
};

/**
 * Converts a distance from kilometers to other units for display.
 */
export const convertFromKm = (distanceInKm, targetUnit) => {
  switch (targetUnit) {
    case 'nm':
      return distanceInKm / 1.852;
    case 'mi':
      return distanceInKm / 1.60934;
    case 'km':
    default:
      return distanceInKm;
  }
};

/**
 * Calculates a buffer offset from a coastline GeoJSON, optionally clipping out the land.
 * 
 * @param {Object} coastlineGeoJSON - Coastline LineString GeoJSON
 * @param {Object} landGeoJSON - Land Polygons GeoJSON (for clipping)
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ('km', 'mi', 'nm')
 * @param {boolean} clipToSea - Whether to subtract land to only show offset in sea
 * @returns {Object} - GeoJSON FeatureCollection containing the offset polygon(s)
 */
export const calculateCoastlineOffset = (coastlineGeoJSON, landGeoJSON, distance, unit, clipToSea = true) => {
  if (!coastlineGeoJSON) {
    return { type: 'FeatureCollection', features: [] };
  }

  try {
    const distanceInKm = convertToKm(distance, unit);
    if (distanceInKm <= 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    // 1. Buffer the coastline
    // turf.buffer works on FeatureCollections, Features, and raw Geometries
    const buffered = turf.buffer(coastlineGeoJSON, distanceInKm, { units: 'kilometers' });

    if (!clipToSea || !landGeoJSON) {
      return buffered;
    }

    // 2. Prepare the land geometry for clipping
    // We union the land polygons to create a single clip mask
    let landMask = null;
    try {
      if (landGeoJSON.type === 'FeatureCollection') {
        // Turf v7 union takes a FeatureCollection of Polygons/MultiPolygons
        // Let's filter out any non-polygon features just in case
        const polygonFeatures = landGeoJSON.features.filter(f => 
          f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        );
        
        if (polygonFeatures.length > 0) {
          landMask = turf.union(turf.featureCollection(polygonFeatures));
        }
      } else if (landGeoJSON.type === 'Feature' && (landGeoJSON.geometry.type === 'Polygon' || landGeoJSON.geometry.type === 'MultiPolygon')) {
        landMask = landGeoJSON;
      }
    } catch (unionError) {
      console.warn("Failed to union land polygons, using raw features list for clipping:", unionError);
    }

    // If we couldn't create a unioned mask, fallback to returning the raw buffer
    if (!landMask) {
      return buffered;
    }

    // 3. Subtract land mask from the buffered coastline
    const resultFeatures = [];
    const bufferedFeatures = buffered.type === 'FeatureCollection' ? buffered.features : [buffered];

    for (const bufFeature of bufferedFeatures) {
      if (!bufFeature.geometry) continue;

      try {
        // Turf v7 difference: difference(featureCollection([source, clip]))
        const diff = turf.difference(turf.featureCollection([bufFeature, landMask]));
        if (diff) {
          // Keep the original properties (distance, unit, tag, etc.)
          diff.properties = { ...bufFeature.properties };
          resultFeatures.push(diff);
        }
      } catch (diffError) {
        console.warn("Turf difference failed for feature, using raw buffer feature:", diffError);
        resultFeatures.push(bufFeature);
      }
    }

    return turf.featureCollection(resultFeatures);
  } catch (error) {
    console.error("Geospatial calculation error:", error);
    // In case of complete failure, try to return at least the raw buffer
    try {
      const distanceInKm = convertToKm(distance, unit);
      return turf.buffer(coastlineGeoJSON, distanceInKm, { units: 'kilometers' });
    } catch (e) {
      return { type: 'FeatureCollection', features: [] };
    }
  }
};

/**
 * Calculates the bounding box of a GeoJSON object.
 * Useful for flying the map view to a specific bookmark or feature.
 */
export const getGeoJSONBounds = (geojson) => {
  try {
    const bbox = turf.bbox(geojson); // [minLng, minLat, maxLng, maxLat]
    return [
      [bbox[1], bbox[0]], // [minLat, minLng]
      [bbox[3], bbox[2]]  // [maxLat, maxLng]
    ];
  } catch (error) {
    console.error("Error calculating bounds:", error);
    return null;
  }
};
