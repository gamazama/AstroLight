import type { StoreSet, StoreGet } from '../appStore';
import { fetchPlanetaryPath } from '../../utils/jplHorizons';

export const createJplActions = (set: StoreSet, get: StoreGet) => ({
  fetchJplPaths: async () => {
    const { planetsToRender, startDate, endDate, jplPrecision, jplFetchSelection, jplTargetType } = get();
    if (!endDate) {
      get().actions.showNotification('**Error**: An end date must be set to fetch paths.');
      return;
    }
    if (jplFetchSelection.length === 0) {
      get().actions.showNotification('**Info**: No planets selected to fetch.');
      return;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Set status to fetching for selected planets
    const initialStatus: Record<string, 'idle' | 'fetching' | 'success' | 'error'> = { ...get().jplFetchStatus };
    jplFetchSelection.forEach(pName => initialStatus[pName] = 'fetching');
    set({ jplFetchStatus: initialStatus });
    get().actions.showNotification(`Fetching paths for **${jplFetchSelection.length} planets**...`);

    for (const planetName of jplFetchSelection) {
        const planet = planetsToRender.find(p => p.name === planetName);
        if (!planet) {
            set(state => ({ jplFetchStatus: { ...state.jplFetchStatus, [planetName]: 'error' } }));
            continue;
        }

        const planetData = get().actions.getCelestialBody(planet.name);
        
        let jplIdToUse = planetData?.jplId;
        if (jplTargetType === 'planet_center') {
            // For major planets, use the specific planet center ID if available
            if (planetData?.jplIdPlanetCenter) {
                jplIdToUse = planetData.jplIdPlanetCenter;
            } 
            // For minor bodies, their main jplId is already the body ID, so we don't need to change anything.
        }

        if (!planetData || !jplIdToUse) {
            set(state => ({ jplFetchStatus: { ...state.jplFetchStatus, [planet.name]: 'error' } }));
            continue; // Skip to the next planet
        }

        try {
            const fetchPlanetData = { ...planetData, jplId: jplIdToUse };
            const { parsedData, rawData, stepInDays } = await fetchPlanetaryPath(fetchPlanetData, startDateStr, endDateStr, jplPrecision);
            set(state => ({
                highPrecisionPaths: {
                    ...state.highPrecisionPaths,
                    [planet.name]: { data: parsedData, rawData, startDate: startDateStr, stepInDays }
                },
                jplFetchStatus: { ...state.jplFetchStatus, [planet.name]: 'success' }
            }));
        } catch (error) {
            if (import.meta.env.DEV) console.error(`Failed to fetch JPL data for ${planet.name}:`, error);
            get().actions.showNotification(`**${planet.name} Fetch Error**: ${error instanceof Error ? error.message : 'Unknown error'}`, 5000);
            set(state => ({ jplFetchStatus: { ...state.jplFetchStatus, [planet.name]: 'error' } }));
        }
        
        // Add a delay to be respectful of the API's rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const finalStatus = get().jplFetchStatus;
    const errorCount = Object.values(finalStatus).filter(s => s === 'error').length;
    if (errorCount > 0) {
        get().actions.showNotification(`**JPL Fetch Complete** with ${errorCount} error(s).`);
    } else {
        get().actions.showNotification('All **JPL paths** fetched successfully!');
    }
  },
  clearJplPaths: () => {
    set({ highPrecisionPaths: {}, jplFetchStatus: {} });
    get().actions.showNotification('Cleared all **JPL path data**.');
  },
});