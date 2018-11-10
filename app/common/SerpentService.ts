import { BitNumber } from './BitNumber';

export class SerpentService {
    s = [
        [3, 8, 15, 1, 10, 6, 5, 11, 14, 13, 4, 2, 7, 0, 9, 12],
        [15, 12, 2, 7, 9, 0, 5, 10, 1, 11, 14, 8, 6, 13, 3, 4],
        [8, 6, 7, 9, 3, 12, 10, 15, 13, 1, 14, 4, 0, 11, 5, 2],
        [0, 15, 11, 8, 12, 9, 6, 3, 13, 1, 2, 4, 10, 7, 5, 14],
        [1, 15, 8, 3, 12, 0, 11, 6, 2, 5, 4, 10, 9, 14, 7, 13],
        [15, 5, 2, 11, 4, 10, 9, 12, 0, 3, 14, 8, 13, 6, 7, 1],
        [7, 2, 12, 5, 8, 4, 6, 11, 14, 9, 1, 15, 13, 3, 10, 0],
        [1, 13, 15, 0, 14, 8, 2, 11, 7, 4, 12, 10, 9, 3, 5, 6],
    ];
    sInv = [
        [13, 3, 11, 0, 10, 6, 5, 12, 1, 14, 4, 7, 15, 9, 8, 2],
        [5, 8, 2, 14, 15, 6, 12, 3, 11, 4, 7, 9, 1, 13, 10, 0],
        [12, 9, 15, 4, 11, 14, 1, 2, 0, 3, 6, 13, 5, 8, 10, 7],
        [0, 9, 10, 7, 11, 14, 6, 13, 3, 5, 12, 2, 4, 8, 15, 1],
        [5, 0, 8, 3, 10, 9, 7, 14, 2, 12, 11, 6, 4, 15, 13, 1],
        [8, 15, 2, 9, 4, 1, 13, 14, 11, 6, 5, 3, 7, 12, 10, 0],
        [15, 10, 1, 13, 5, 3, 6, 0, 4, 9, 14, 7, 2, 12, 8, 11],
        [3, 0, 6, 13, 9, 14, 15, 8, 5, 12, 11, 7, 10, 1, 4, 2],
    ];

    goldSech = new BitNumber(32);

    constructor() {
        this.goldSech.setBitPart(0, [
            1,
            0,
            0,
            1,
            1,
            1,
            1,
            0,
            0,
            0,
            1,
            1,
            0,
            1,
            1,
            1,
            0,
            1,
            1,
            1,
            1,
            0,
            0,
            1,
            1,
            0,
            1,
            1,
            1,
            0,
            0,
            1,
        ]);
    }

    // 128 bit data block
    // key should have 256 bit length
    chipherText(text: BitNumber, key: BitNumber) {
        const K = this.getSubKeys(key, this.s);
        let b = [] as BitNumber[];
        b[0] = text;
        for (let i = 0; i < 31; i++) {
            let x0 = new BitNumber(32);
            let x1 = new BitNumber(32);
            let x2 = new BitNumber(32);
            let x3 = new BitNumber(32);

            let arr = b[i].xor(K[i]).toSimpleBitArray();
            x0.setBitPart(0, arr.slice(0, 32));
            x1.setBitPart(32, arr.slice(32, 64));
            x2.setBitPart(64, arr.slice(64, 96));
            x3.setBitPart(96, arr.slice(96, 128));

            arr = this.getSRes(x0, x1, x2, x3, i,  this.s).toSimpleBitArray();
            b[i].setBitPart(0, arr);
            b[i + 1] = this.effectiveSerpent(b[i]);
        }
        let x0 = new BitNumber(32);
        let x1 = new BitNumber(32);
        let x2 = new BitNumber(32);
        let x3 = new BitNumber(32);

        let arr = b[31].xor(K[31]).toSimpleBitArray();
        x0.setBitPart(0, arr.slice(0, 32));
        x1.setBitPart(32, arr.slice(32, 64));
        x2.setBitPart(64, arr.slice(64, 96));
        x3.setBitPart(96, arr.slice(96, 128));
        b[32] = this.getSRes(x0, x1, x2, x3, 7, this.s).xor(K[32]);
        return b[32];
    }

    chipherTextInv(text: BitNumber, key: BitNumber) {
        let x0 = new BitNumber(32);
        let x1 = new BitNumber(32);
        let x2 = new BitNumber(32);
        let x3 = new BitNumber(32);
        let b = [] as BitNumber[];
        b[32] = text;

        const K = this.getSubKeys(key, this.sInv);
        let arr = b[32].xor(K[32]).toSimpleBitArray();
        x0.setBitPart(0, arr.slice(0, 32));
        x1.setBitPart(32, arr.slice(32, 64));
        x2.setBitPart(64, arr.slice(64, 96));
        x3.setBitPart(96, arr.slice(96, 128));
        b[31] = this.getSRes(x0,x1,x2,x3, 7, this.sInv).xor(K[31]);
        for (let i = 31; i > 0; i--) {

            b[i - 1] = this.effectiveSerpentInv(b[i]);
            x0.setBitPart(0, b[i-1].toSimpleBitArray().slice(0, 32));
            x1.setBitPart(32, b[i-1].toSimpleBitArray().slice(32, 64));
            x2.setBitPart(64, b[i-1].toSimpleBitArray().slice(64, 96));
            x3.setBitPart(96, b[i-1].toSimpleBitArray().slice(96, 128));
            arr = this.getSRes(x0, x1, x2, x3, i,  this.sInv).xor(K[i]).toSimpleBitArray();
            x0.setBitPart(0, arr.slice(0, 32));
            x1.setBitPart(0, arr.slice(32, 64));
            x2.setBitPart(0, arr.slice(64, 96));
            x3.setBitPart(0, arr.slice(96, 128));
            b[i - 1].setBitPart(0, x0.toSimpleBitArray());
            b[i - 1].setBitPart(32, x1.toSimpleBitArray());
            b[i - 1].setBitPart(64, x2.toSimpleBitArray());
            b[i - 1].setBitPart(96, x3.toSimpleBitArray());

        }

        return b[0];
    }

    effectiveSerpent(b: BitNumber) {
        const resultB = new BitNumber(128);

        let x0 = new BitNumber(32);
        let x1 = new BitNumber(32);
        let x2 = new BitNumber(32);
        let x3 = new BitNumber(32);

        let arr = b.toSimpleBitArray();
        x0.setBitPart(0, arr.slice(0, 32));
        x1.setBitPart(0, arr.slice(32, 64));
        x2.setBitPart(0, arr.slice(64, 96));
        x3.setBitPart(0, arr.slice(96, 128));

        x0 = x0.cycleLeftSdvig(13);
        x2 = x2.cycleLeftSdvig(3);
        x1 = x1.xor(x0).xor(x2);
        x3 = x3.xor(x2).xor(x0.leftSdvig(3));
        x1 = x1.cycleLeftSdvig(1);
        x3 = x3.cycleLeftSdvig(7);
        x0 = x0.xor(x1).xor(x3);
        x2 = x2.xor(x3).xor(x1.leftSdvig(7));
        x0 = x0.cycleLeftSdvig(5);
        x2 = x2.cycleLeftSdvig(22);

        const resultArr = [
            ...x0.toSimpleBitArray(),
            ...x1.toSimpleBitArray(),
            ...x2.toSimpleBitArray(),
            ...x3.toSimpleBitArray(),
        ];
        resultB.setBitPart(0, resultArr);
        return resultB;
    }

    effectiveSerpentInv(b: BitNumber) {
        const resultB = new BitNumber(128);

        let x0 = new BitNumber(32);
        let x1 = new BitNumber(32);
        let x2 = new BitNumber(32);
        let x3 = new BitNumber(32);

        let arr = b.toSimpleBitArray();
        x0.setBitPart(0, arr.slice(0, 32));
        x1.setBitPart(32, arr.slice(32, 64));
        x2.setBitPart(64, arr.slice(64, 96));
        x3.setBitPart(96, arr.slice(96, 128));


        // STart
        x2 = x2.cycleRightSdvig(22);
        x0 = x0.cycleRightSdvig(5);
        x2 = x2.xor(x3).xor(x1.leftSdvig(7));
        x0 = x0.xor(x1).xor(x3);
        x3 = x3.cycleRightSdvig(7);
        x1 = x1.cycleRightSdvig(1);
        x3 = x3.xor(x2).xor(x0.leftSdvig(3));
        x1 = x1.xor(x0).xor(x2);
        x2 = x2.cycleRightSdvig(3);
        x0 = x0.cycleRightSdvig(13);

        const resultArr = [
            ...x0.toSimpleBitArray(),
            ...x1.toSimpleBitArray(),
            ...x2.toSimpleBitArray(),
            ...x3.toSimpleBitArray(),
        ];
        resultB.setBitPart(0, resultArr);
        return resultB;
    }

    getSubKeys(key: BitNumber, sTable: number [][]) {
        const w = [] as BitNumber[];
        for (let obIt = -8; obIt < 0; obIt++) {
            w[obIt] = key.getBitPart((obIt + 8) * 32, 32);
        }

        for (let i = 0; i < 132; i++) {
            // w[i] = ;
            const wIMinus8 = w[i - 8];
            const wIMinus5 = w[i - 5];
            const wIMinus3 = w[i - 3];
            const wIMinus1 = w[i - 1];
            w[i] = this.getWMiddleKey(wIMinus8, wIMinus5, wIMinus3, wIMinus1, i);
        }

        const K = [] as BitNumber[];
        // S-tables
        let currentSNumb = 3;
        for (let i = 0, t = 0; i < 132; i += 4, t++) {
            K[t] = this.getSRes(w[i], w[i + 1], w[i + 2], w[i + 3], currentSNumb, sTable);
            currentSNumb -= 1;
            if (currentSNumb < 0) {
                currentSNumb = 7;
            }
        }

        return K;
    }

    private getWMiddleKey(
        wIMinus8: BitNumber,
        wIMinus5: BitNumber,
        wIMinus3: BitNumber,
        wIMinus1: BitNumber,
        i: number,
    ) {
        return wIMinus8
            .xor(wIMinus5)
            .xor(wIMinus3)
            .xor(wIMinus1)
            .xor(this.goldSech)
            .xor(BitNumber.fromInt(i))
            .cycleLeftSdvig(11);
    }

    getSRes(w1: BitNumber, w2: BitNumber, w3: BitNumber, w4: BitNumber, i: number, sTable: number[][]) {
        const inputArr = w1
            .toSimpleBitArray()
            .concat(w2.toSimpleBitArray())
            .concat(w3.toSimpleBitArray())
            .concat(w4.toSimpleBitArray());

        const prec = 4;

        const resArr = [] as (0 | 1)[];

        for (let j = 0; j < 32; j++) {
            const numb = parseInt(
                [inputArr[j * prec + 0], inputArr[j * prec + 1], inputArr[j * prec + 2], inputArr[j * prec + 3]].join(
                    '',
                ),
                2,
            );

            const resultBits = BitNumber.fromInt(sTable[i % 8][numb], 4);
            resArr[j * prec + 0] = resultBits.getBit(0);
            resArr[j * prec + 1] = resultBits.getBit(1);
            resArr[j * prec + 2] = resultBits.getBit(2);
            resArr[j * prec + 3] = resultBits.getBit(3);
        }

        const resultK = new BitNumber(128);
        resultK.setBitPart(0, resArr);
        return resultK;
    }


}
