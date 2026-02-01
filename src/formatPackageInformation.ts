import type {
    Event,
    Location,
    TrackingApiResponse,
    FormattedEvent,
    FormattedTrackingInfo
} from './types.js';

/*
This file contains functions to format information from the tracking API
to make it more readable for the LLM
*/

export function formatPackageInformation(packageInfo: TrackingApiResponse): FormattedTrackingInfo {
    const weight = packageInfo.goods?.weight?.value;
    const weightUnit = packageInfo.goods?.weight?.unit;
    const dimensionsLength = packageInfo.goods?.dimensions?.length;
    const dimensions = dimensionsLength !== undefined && dimensionsLength > 0 ? packageInfo?.goods?.dimensions : null; // array of numbers
    const pieceCount = packageInfo.goods?.pieces;
    const productCode = packageInfo.productCode;

    const senderAddress = packageInfo.location?.shipper ? formatAddress(packageInfo.location?.shipper) : null;
    const receiverAddress = packageInfo.location?.consignee ? formatAddress(packageInfo.location?.consignee) : null;

    const senderName = packageInfo.location?.shipper?.companyName;
    const receiverName = packageInfo.location?.consignee?.companyName;

    const events = packageInfo.events?.map((event: Event) => formatEvent(event)) || [];

    return replaceNullsWithNoInfo({
        weight,
        weightUnit,
        dimensions,
        pieceCount,
        productCode,
        senderAddress,
        receiverAddress,
        senderName,
        receiverName,
        events
    });
}

function formatAddress(location: Location): string | null {
    if (!location?.cityName || !location?.countryName) return null;
    return `${location.cityName}, ${location.countryName}`;
}

function formatEvent(event: Event ): FormattedEvent {
    return {
        code: event.code,
        date: event.date,
        comment: event.comment,
        city: event.location.name,
    };
}

// Replace every lowercase letter followed by an uppercase letter with the lowercase letter, a space, and the uppercase letter
function camelCaseToWords(camelCase: string): string {
    return camelCase.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase());
}

// Each key that is null or undefined is replaced by the string "No info regarding <keyName>"
function replaceNullsWithNoInfo<T extends Record<string, unknown>>(
    obj: T
): { [K in keyof T]: Exclude<T[K], null | undefined> | string } {
    const result = {} as { [K in keyof T]: Exclude<T[K], null | undefined> | string };

    for (const key in obj) {
        const value = obj[key];
        if (value === null || value === undefined) {
            result[key] = `No info regarding ${camelCaseToWords(key)}`;
        } else {
            result[key] = value as Exclude<T[typeof key], null | undefined>;
        }
    }

    return result;
}
