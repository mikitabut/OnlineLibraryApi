export class BitNumber {
    private bytes: (0 | 1)[];

    constructor(countOfBits = 64, optionalParams: { initBit?: 0 | 1; initValue?: BitNumber } = { initBit: 0 }) {
        this.bytes = [];
        if (optionalParams.initValue == null) {
            for (let i = 0; i < countOfBits; i++) {
                this.bytes.push(optionalParams.initBit);
            }
        } else {
            const newBitLength = optionalParams.initValue.getBitLength();
            if (newBitLength > countOfBits) {
                this.setBitPart(
                    newBitLength - optionalParams.initValue.getBitLength(),
                    optionalParams.initValue.toSimpleBitArray(),
                );
            } else {
                this.bytes = optionalParams.initValue.toSimpleBitArray();
            }
        }
    }

    setBit(position: number, newBit: 0 | 1) {
        this.bytes[position] = newBit;
    }

    getBit(position: number) {
        return this.bytes[position];
    }

    setBitPart(fromPos: number, newBits: (0 | 1)[]) {
        for (let i = 0; i < Math.min(newBits.length, this.bytes.length - fromPos); i++) {
            this.bytes[i + fromPos] = newBits[i];
        }
    }

    getBitPart(startPos: number, bits: number) {
        const firstParamObj = new BitNumber(bits);
        for (let i = 0; i < bits; i++) {
            firstParamObj.bytes[i] = this.bytes[startPos + i];
        }

        return firstParamObj;
    }

    appendNumber(appendBytes: (0 | 1)[]) {
        const resultBytesArr = new BitNumber(this.bytes.length);
        const numberOfBits = Math.min(this.bytes.length, appendBytes.length);

        let carry = 0;
        for (let i = this.bytes.length - 1; i > this.bytes.length - 1 - numberOfBits; i--) {
            const bit = appendBytes[i] + this.bytes[i] + carry;
            if (bit / 2 === 1) {
                carry = 1;
            }
            resultBytesArr[i] = bit % 2;
        }
        if (carry !== 0) {
            const oldValue = this.bytes.length;
            this.bytes = new BitNumber(this.bytes.length * 2, {
                initValue: resultBytesArr,
            }).toSimpleBitArray();
            this.setBit(oldValue - 1, 1);
        }
    }

    toSimpleBitArray() {
        return this.bytes.slice();
    }

    toString() {
        return this.bytes.join('');
    }

    getBitLength() {
        return this.bytes.length;
    }

    xor(firstParam: BitNumber) {
        const firstParamObj = new BitNumber(firstParam.getBitLength(), { initValue: firstParam });
        const resultObj = new BitNumber(firstParam.getBitLength(), { initBit: 0 });

        for (let i = 0; i < firstParam.getBitLength(); i++) {
            resultObj.bytes[i] = (firstParamObj.bytes[i] ^ this.bytes[i]) as 0 | 1;
        }

        return resultObj;
    }

    leftSdvig(bits: number) {
        const resultObj = new BitNumber(this.bytes.length, { initValue: this });

        while (bits !== 0) {
            resultObj.bytes.shift();
            resultObj.bytes.push(0);
            bits--;
        }

        return resultObj;
    }
    rightSdvig(bits: number) {
        const resultObj = new BitNumber(this.bytes.length, { initValue: this });

        while (bits !== 0) {
            resultObj.bytes.pop();
            resultObj.bytes.unshift(0);
            bits--;
        }
        return resultObj;
    }
    cycleLeftSdvig(bits: number) {
        const resultObj = new BitNumber(this.bytes.length, { initValue: this });

        while (bits !== 0) {
            const carryel = resultObj.bytes.shift();
            resultObj.bytes.push(carryel);
            bits--;
        }

        return resultObj;
    }
    cycleRightSdvig(bits: number) {
        const resultObj = new BitNumber(this.bytes.length, { initValue: this });

        while (bits !== 0) {
            const carryel = resultObj.bytes.pop();
            resultObj.bytes.unshift(carryel);
            bits--;
        }

        return resultObj;
    }

    // Implement simple from int converter for task purposes
    static fromInt(numb: number, countBits = 32) {
        const resultBitNumb = new BitNumber(countBits);
        const bits = new Number(numb)
            .toString(2)
            .split('')
            .map(value => parseInt(value, 10));
        while (bits.length < countBits) {
            bits.unshift(0);
        }
        resultBitNumb.setBitPart(0, bits as (0 | 1)[]);
        return resultBitNumb;
    }

    static tests(): boolean[] {
        const resultTestArr = [] as boolean[];
        const someValue1 = '100010011000'
            .split('')
            .filter(value => value === '0' || value === '1')
            .map(value => parseInt(value, 10));
        const someValue2 = '111100010011'
            .split('')
            .filter(value => value === '0' || value === '1')
            .map(value => parseInt(value, 10) as any);
        const value1 = new BitNumber(12);
        const value2 = new BitNumber(12);

        value1.setBitPart(0, someValue1 as (0 | 1)[]);
        value2.setBitPart(0, someValue2 as (0 | 1)[]);

        // start tests
        let testStarted = true;
        for (let i = 0; i < value1.bytes.length; i++) {
            if (value1.bytes[i] !== someValue1[i]) {
                resultTestArr.push(false);
                testStarted = false;
                break;
            }
        }
        if (testStarted) {
            resultTestArr.push(true);
        }
        //test end
        // start test
        testStarted = true;
        const test2XorArr = new BitNumber(12);
        test2XorArr.setBitPart(0, [0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1]);

        const testedValue = value1.xor(value2);
        for (let i = 0; i < value1.bytes.length; i++) {
            if (testedValue.bytes[i] !== test2XorArr.bytes[i]) {
                resultTestArr.push(false);
                testStarted = false;
                break;
            }
        }
        if (testStarted) {
            resultTestArr.push(true);
        }
        //test end
        // start test
        testStarted = true;
        const testParseValue = new BitNumber(4);
        testParseValue.setBitPart(0, [0, 1, 1, 0]);

        const testedParseValue = BitNumber.fromInt(6, 4);
        for (let i = 0; i < 4; i++) {
            if (testedParseValue.bytes[i] !== testParseValue.bytes[i]) {
                resultTestArr.push(false);
                testStarted = false;
                break;
            }
        }
        if (testStarted) {
            resultTestArr.push(true);
        }
        //test end
        // start test
        testStarted = true;
        const testSdvigValue = new BitNumber(4);
        const expectedValue = new BitNumber(4);
        expectedValue.setBitPart(0, [1,0,0,0]);
        testSdvigValue.setBitPart(0, [0, 1, 1, 0]);

        const testedSdvigValue = testSdvigValue.leftSdvig(2);
        for (let i = 0; i < 4; i++) {
            if (testedSdvigValue.bytes[i] !== expectedValue.bytes[i]) {
                resultTestArr.push(false);
                testStarted = false;
                break;
            }
        }
        if (testStarted) {
            resultTestArr.push(true);
        }
        //test end

        return resultTestArr;
    }
}
