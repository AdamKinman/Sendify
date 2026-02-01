import { solveCaptcha } from './captchaSolver.js';
import type { ShipmentApiResponse, TrackingApiResponse } from './types.js';

/*
This module exports the function fetchTracking, which fetches tracking information
from the DB Schenker APIs after automatically solving the captcha puzzles
*/


// Fecthes from the provided URL after automatically solving captcha if needed
async function makeRequestWithCaptcha(url: string, headers: Record<string, string> = {}, maxAttempts: number = 5, failedAttempts: number = 0):
    Promise<Record<string, any>> {
    try {
        const response1 = await fetch(url, { headers });

        if (response1.status === 429) {
            const puzzleHeader = response1.headers.get('captcha-puzzle');
            
            if (!puzzleHeader) {
                throw new Error('Rate limited but no captcha puzzle provided');
            }        
            const solution = await solveCaptcha(puzzleHeader);
            // Retry with solution
            const response2 = await fetch(url, {
                headers: {
                    ...headers,
                    'Captcha-Solution': solution
                }
            });
            if (!response2.ok) {
                throw new Error(`API request failed: ${response2.status} ${response2.statusText}`);
            }
            return await response2.json();
        }
        if (!response1.ok) {
            throw new Error(`API request failed: ${response1.status} ${response1.statusText}`);
        }
        return await response1.json();
    } catch (error) {
        if (failedAttempts < maxAttempts) {
            console.warn(`Request failed, retrying... (${failedAttempts + 1}/${maxAttempts})`);
            return await makeRequestWithCaptcha(url, headers, maxAttempts, failedAttempts + 1);
        } else {
            throw new Error(`Request failed after ${maxAttempts} attempts: ${error}`);
        }
    }
}

// Uses the shipment API to get info about the shipment (necessary for tracking API call)
async function getShipmentInfo(refNumber: string): Promise<ShipmentApiResponse> {
    const url = `https://www.dbschenker.com/nges-portal/api/public/tracking-public/shipments?query=${refNumber}`;
    const data = await makeRequestWithCaptcha(url);
    const sttNumber = await data.result?.[0]?.stt;
    if(!sttNumber) throw new Error('Shipment not found');
    const countryCode = (sttNumber[0]+sttNumber[1]).toLowerCase();
    const transportMode = data.result?.[0]?.transportMode?.toLowerCase() || 'land';
    const id = data.result?.[0]?.id;
    return {
        id,
        countryCode,
        transportMode,
    };
}

// Fetches tracking information from the tracking API
// RefNumber can be in either STT or number format
async function fetchTracking(refNumber: string): Promise<TrackingApiResponse> {
    const { countryCode, transportMode, id } = await getShipmentInfo(refNumber);

    const baseUrl = 'https://www.dbschenker.com/nges-portal/api/public/tracking-public/shipments';
    const url = `${baseUrl}/${transportMode}/${countryCode}/${id}`;
    return await makeRequestWithCaptcha(url);
}

export { fetchTracking };