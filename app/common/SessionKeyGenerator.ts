import { BitNumber } from './BitNumber';

export abstract class SessionKeyGenerator {
    sessionKey;

    public static getSessionKey(bits = 256) {
        const bytes = new BitNumber(bits, { initBit: 0 });

        for (let i = 1; i < bits; i++) {
            bytes.setBit(i, Math.round(Math.random()) as 0 | 1);
        }
        bytes.setBit(0, 1);
    }
}
