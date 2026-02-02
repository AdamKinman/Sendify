/*
This file contains TypeScript type definitions for types used throughout the project
*/


export type ShipmentApiResponse = {
    countryCode: string;
    transportMode: string;
    id: string;
}

export type Location = {
    companyName?: string;
    cityName?: string;
    countryName?: string;
}

export type Event = {
    code: string;
    date: string;
    comment: string;
    location: { name: string };
}

export type TrackingApiResponse = {
    goods?: {
        weight?: {
            value: number;
            unit: string;
        };
        dimensions?: number[];
        pieces?: number;
    };
    productCode?: string;
    location?: {
        shipper?: Location;
        consignee?: Location;
    };
    events?: Event[];
}

export type FormattedEvent = {
    code: string;
    date: string;
    comment: string;
    city: string;
}


//  "| string" is used instead of "| null" to match the "No info regarding ..." strings in formatted output
export type FormattedTrackingInfo = {
    weight: number | string;
    weightUnit: string | string;
    dimensions: number[] | string;
    pieceCount: number | string;
    productCode: string | string;
    senderAddress: string | string;
    receiverAddress: string | string;
    senderName: string | string;
    receiverName: string | string;
    events: FormattedEvent[] | string;
}