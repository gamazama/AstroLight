import type { CelestialBodyData, Vector3D } from '../types';
import type { PlanetaryData, FetchResult } from '../types/jpl';
import { lerp } from './mathUtils';

// Helper function to parse the raw text response from JPL HORIZONS
const parseHorizonsResponse = (responseText: string): PlanetaryData => {
  const data: PlanetaryData = [];
  
  // Find the start and end of the ephemeris data
  const startIndex = responseText.indexOf('$$SOE');
  const endIndex = responseText.indexOf('$$EOE');

  if (startIndex === -1 || endIndex === -1) {
    // Check for a specific error message from the API
    if (responseText.includes("No matches found")) {
        throw new Error("JPL HORIZONS could not find data for the request. The body may not exist in the database for the dates specified.");
    }
    throw new Error('Could not find ephemeris data in the JPL HORIZONS response. The selected date range may be invalid for this celestial body.');
  }

  // Extract the CSV data block
  const dataBlock = responseText.substring(startIndex + 5, endIndex).trim();
  const lines = dataBlock.split('\n');

  for (const line of lines) {
    const fields = line.split(',').map(field => field.trim());
    
    // Expected format: JDTDB, Calendar Date, X, Y, Z ...
    if (fields.length >= 5) {
      const x = parseFloat(fields[2]);
      const y = parseFloat(fields[3]);
      const z = parseFloat(fields[4]);

      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        data.push({ x, y, z });
      }
    }
  }

  if (data.length === 0) {
      throw new Error('No valid coordinate data was parsed from the JPL HORIZONS response.');
  }

  return data;
};

// Internal helper to calculate step size, not exported.
const _calculateStepSize = (startDate: Date, endDate: Date, planetPeriod: number, precision: number): string => {
    const durationInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    if (durationInDays <= 0) {
        return '1d'; // Default for invalid range
    }
    
    const MAX_STEPS = Math.round(lerp(500, 10000, (precision - 1) / 9));

    // For very short durations, we can use minutes or hours.
    if (durationInDays < 1) {
        const durationInMinutes = durationInDays * 24 * 60;
        const stepInMinutes = Math.max(1, Math.floor(durationInMinutes / MAX_STEPS));
        return `${stepInMinutes}m`;
    }
    if (durationInDays < 30) {
         const durationInHours = durationInDays * 24;
         const stepInHours = Math.max(1, Math.floor(durationInHours / MAX_STEPS));
         return `${stepInHours}h`;
    }

    // For stars or bodies with no period, base step on duration.
    if (planetPeriod <= 0) {
        const stepInDays = Math.max(1, Math.ceil(durationInDays / MAX_STEPS));
        return `${stepInDays}d`;
    }

    const pointsPerOrbit = Math.round(lerp(30, 360, (precision - 1) / 9));
    const idealStepInDays = Math.max(1, planetPeriod / pointsPerOrbit);
    const numSteps = durationInDays / idealStepInDays;

    if (numSteps > MAX_STEPS) {
        const requiredStepSize = Math.ceil(durationInDays / MAX_STEPS);
        return `${requiredStepSize}d`;
    }
    
    return `${Math.max(1, Math.round(idealStepInDays))}d`;
};

// Determines an appropriate step size for the API call to avoid requesting too much data.
export const getStepSize = (startDate: Date, endDate: Date, planetPeriod: number, precision: number): string => {
    return _calculateStepSize(startDate, endDate, planetPeriod, precision);
};

export const getStepSizeInfo = (startDate: Date, endDate: Date): { fine: string, coarse: string } => {
    // We don't have a specific planet here, so use an average period like Earth's for a representative calculation.
    const representativePeriod = 365.25; 
    return {
        fine: _calculateStepSize(startDate, endDate, representativePeriod, 10), // Max precision
        coarse: _calculateStepSize(startDate, endDate, representativePeriod, 1), // Min precision
    };
};


export const getStepSizeInDays = (step: string): number => {
    const value = parseFloat(step);
    if (step.endsWith('d')) return value;
    if (step.endsWith('y')) return value * 365.25;
    if (step.endsWith('m')) return value / (24 * 60);
    if (step.endsWith('h')) return value / 24;
    return value; // Assume days if no unit
};

export const fetchPlanetaryPath = async (
  planetData: CelestialBodyData,
  startDateStr: string,
  endDateStr: string,
  precision: number,
): Promise<FetchResult> => {
    if (!planetData || !planetData.jplId) {
      throw new Error(`Planet information or JPL ID for ${planetData.name} not found.`);
    }
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
        throw new Error('Invalid date range. Please ensure the end date is after the start date.');
    }

    const stepSizeStr = getStepSize(start, end, planetData.period, precision);

    // Construct the URL for the JPL HORIZONS API
    const params = new URLSearchParams({
        format: 'text',
        COMMAND: `'${planetData.jplId}'`,
        OBJ_DATA: 'NO',
        MAKE_EPHEM: 'YES',
        EPHEM_TYPE: 'VECTORS',
        CENTER: `'@sun'`,
        START_TIME: `'${startDateStr}'`,
        STOP_TIME: `'${endDateStr}'`,
        STEP_SIZE: `'${stepSizeStr}'`,
        VEC_TABLE: '1', // For X, Y, Z position components only
        CSV_FORMAT: 'YES',
        REF_PLANE: 'ECLIPTIC',
        REF_SYSTEM: 'J2000',
        OUT_UNITS: 'AU-D'
    });

    const jplUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;

    // We are using a CORS proxy to bypass browser security restrictions that prevent
    // direct client-side requests to the JPL HORIZONS API. In a production app,
    // a dedicated backend proxy would be a more robust solution.
    const proxyUrl = 'https://corsproxy.io/?';
    const url = proxyUrl + jplUrl;

    try {
        const response = await fetch(url);
        
        const responseText = await response.text();

        if (!response.ok) {
            if (import.meta.env.DEV) console.error("JPL HORIZONS API Error Response:", responseText);
            throw new Error(`Failed to fetch data from JPL HORIZONS (Status: ${response.status}). The API may be unavailable or the request may be invalid.`);
        }
        
        const parsedData = parseHorizonsResponse(responseText);
        const stepInDays = getStepSizeInDays(stepSizeStr);
        return { parsedData, rawData: responseText, stepInDays };

    } catch (error) {
        if (import.meta.env.DEV) console.error("Error fetching or parsing planetary path:", error);
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                 throw new Error('A network error occurred. Please check your internet connection and the CORS proxy status.');
            }
            throw error; // Re-throw original error for more specific messages
        }
        throw new Error('An unknown error occurred while communicating with JPL HORIZONS.');
    }
};