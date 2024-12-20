import crypto from 'crypto';

export function signRequest(apiSecret: string, timestamp: number, verb: string, path: string, body: string = '') {
    return crypto
        .createHmac("sha512", apiSecret)
        .update(timestamp.toString())
        .update(verb.toUpperCase())
        .update(path)
        .update(body)
        .digest("hex");
}

export function getHeaders(apiKey: string, apiSecret: string, timestamp: number, verb: string, path: string, body: string = '') {
    return {
        "Content-type": "application/json; charset=UTF-8",
        "X-VALR-API-KEY": `${apiKey}`,
        "X-VALR-SIGNATURE": `${signRequest(apiSecret, timestamp, verb, path, body)}`,
        "X-VALR-TIMESTAMP": `${timestamp}`
    };
}
