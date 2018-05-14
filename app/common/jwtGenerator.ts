import * as bcrypt from 'bcrypt';
import * as moment from 'moment';

export interface Jwt {
    token: string;
    name?: string;
    time?: string;
}

export abstract class JwtGenerator {
    public static getRandomToken(name: string) {
        return bcrypt.hash(name, 4).then(jwt => {
            return {
                token: jwt,
                name,
                time: moment()
                    .valueOf()
                    .toString(),
            };
        });
    }
}
