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
    const buffered = turf.buffer(coastlineGeoJSON, distanceInKm, { units: 'kilometers' });

    if (!clipToSea || !landGeoJSON) {
      return buffered;
    }

    // 2. Pre-calculate bounding boxes for land features to optimize spatial lookups
    const landFeatures = landGeoJSON.type === 'FeatureCollection' 
      ? landGeoJSON.features 
      : [landGeoJSON];
      
    const landPolygons = landFeatures.filter(f => 
      f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    );

    const landBboxes = landPolygons.map(f => ({
      feature: f,
      bbox: turf.bbox(f)
    }));

    // Helper to check if two bounding boxes [minLng, minLat, maxLng, maxLat] intersect
    const bboxIntersects = (box1, box2) => {
      return !(box1[2] < box2[0] || // box1 maxLng < box2 minLng
               box1[0] > box2[2] || // box1 minLng > box2 maxLng
               box1[3] < box2[1] || // box1 maxLat < box2 minLat
               box1[1] > box2[3]);  // box1 minLat > box2 maxLat
    };

    // 3. Subtract land features using spatial filtering
    const resultFeatures = [];
    const bufferedFeatures = buffered.type === 'FeatureCollection' ? buffered.features : [buffered];

    for (const bufFeature of bufferedFeatures) {
      if (!bufFeature.geometry) continue;

      const bufBbox = turf.bbox(bufFeature);

      // Find only land features that spatially intersect the bounding box of this buffer feature
      const intersectingLand = [];
      for (const item of landBboxes) {
        if (bboxIntersects(bufBbox, item.bbox)) {
          intersectingLand.push(item.feature);
        }
      }

      if (intersectingLand.length === 0) {
        // No land intersects this buffer segment, keep it as is (instant win)
        resultFeatures.push(bufFeature);
        continue;
      }

      // Create a localized land mask by unioning ONLY the few intersecting land polygons
      let localLandMask = null;
      try {
        if (intersectingLand.length === 1) {
          localLandMask = intersectingLand[0];
        } else {
          localLandMask = turf.union(turf.featureCollection(intersectingLand));
        }
      } catch (unionError) {
        console.warn("Failed to union local land polygons, using first one as fallback:", unionError);
        localLandMask = intersectingLand[0];
      }

      if (!localLandMask) {
        resultFeatures.push(bufFeature);
        continue;
      }

      try {
        // Subtract only the localized land mask from this specific buffer feature
        const diff = turf.difference(turf.featureCollection([bufFeature, localLandMask]));
        if (diff) {
          diff.properties = { ...bufFeature.properties };
          resultFeatures.push(diff);
        }
      } catch (diffError) {
        console.warn("Turf difference failed for local feature, keeping raw buffer:", diffError);
        resultFeatures.push(bufFeature);
      }
    }

    return turf.featureCollection(resultFeatures);
  } catch (error) {
    console.error("Geospatial calculation error:", error);
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
