import crypto from 'crypto';

/*
This file exports the solveCaptcha function which takes a captcha-puzzle header string
and returns the string to use in the Captcha-Solution header
*/

/*
The API uses a proof-of-work captcha system:
1. First request returns 429 with a "captcha-puzzle" header
2. The puzzle contains base64 encoded JWTs with puzzle data
3. Solution involves finding a nonce where double SHA-256 hash is below target
4. Send solution in "Captcha-Solution" header with retry request
*/
    
// Convert number to 8-byte Int8Array
function numberToBytes(num: number): Int8Array {
    const bytes = new Int8Array(8);
    for (let i = 0; i < bytes.length; i++) {
        const byte = num & 0xff;
        bytes[i] = byte > 127 ? byte - 256 : byte; // Convert to signed
        num = Math.floor((num - (num & 0xff)) / 256);
    }
    return bytes;
}

// Concatenate puzzle (32 bytes) with nonce (8 bytes)
function concat(puzzle: Int8Array, nonce: Int8Array): Int8Array {
    const result = new Int8Array(40);
    for (let i = 0; i < 32; i++) {
        result[i] = puzzle[i]!;
    }
    for (let i = 32; i < 40; i++) {
        result[i] = nonce[i - 32]!;
    }
    return result;
}

// Convert Uint8Array to BigInt
function bytesToBigInt(bytes: Uint8Array): bigint {
    let result = BigInt(0);
    for (let i = bytes.length - 1; i >= 0; i--) {
        result = result * BigInt(256);
        result += BigInt(bytes[i]!);
    }
    return result;
}

// Double SHA-256 hash
async function doubleHash(data: Int8Array): Promise<Uint8Array> {
    // Convert Int8Array to Uint8Array for crypto
    const uint8Data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const hash1 = crypto.createHash('sha256').update(uint8Data).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    return new Uint8Array(hash2);
}

// Calculate target value from puzzle difficulty
// Target = puzzle[14] * 2^(8*(puzzle[13]-3))
function calculateTarget(puzzle: Int8Array): bigint {
    const shift = BigInt(8 * (puzzle[13]! - 3));
    let power = BigInt(2);
    for (let i = 1; i < shift; i++) {
        power *= BigInt(2);
    }
    const p14 = puzzle[14]!;
    return BigInt(p14 < 0 ? p14 + 256 : p14) * power;
}

// Find nonce where hash < target
async function findSolution(puzzle: Int8Array, target: bigint): Promise<string> {
    let nonce = 0;
    const maxIterations = 10000000; // Safety limit
    
    while (nonce < maxIterations) {
        const nonceBytes = numberToBytes(nonce);
        const data = concat(puzzle, nonceBytes);
        const hash = await doubleHash(data);
        const hashValue = bytesToBigInt(hash);
        
        if (hashValue < target) {
            // Convert to base64 solution
            const uint8Nonce = new Uint8Array(nonceBytes.buffer);
            return Buffer.from(uint8Nonce).toString('base64');
        }
        nonce++;
    }
    
    throw new Error('Failed to find solution within iteration limit');
}

// Solve a single puzzle JWT
async function solvePuzzle(jwtString: string): Promise<{ jwt: string; solution: string }> {
    // Parse JWT payload
    const [, payload] = jwtString.split('.');
    if (!payload) throw new Error('Invalid JWT format');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    // Decode puzzle bytes
    const puzzleBase64 = decoded.puzzle;
    const puzzleBuffer = Buffer.from(puzzleBase64, 'base64');
    const puzzle = new Int8Array(puzzleBuffer);
    // Calculate target and find solution
    const target = calculateTarget(puzzle);
    const solution = await findSolution(puzzle, target);
    return {
        jwt: jwtString,
        solution: solution
    };
}

// Parse and solve all puzzles from the captcha-puzzle header
async function solveCaptcha(captchaPuzzleHeader: string): Promise<string> {
    // Decode the base64 header
    const decoded = Buffer.from(captchaPuzzleHeader, 'base64').toString();
    const jwts = decoded.split(',');
    const solutions = await Promise.all(jwts.map((jwt: string) => solvePuzzle(jwt)));
    // Return base64 encoded JSON solution
    return Buffer.from(JSON.stringify(solutions)).toString('base64');
}

export { solveCaptcha };