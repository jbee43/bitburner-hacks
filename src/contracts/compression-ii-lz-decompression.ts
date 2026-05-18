// Compression II: LZ Decompression

import { NS } from "@ns";

export default function compression2(ns: NS, arg: string) {
    const input: string = JSON.parse(arg);
    ns.print(`Input: ${input}`);

    let answer = ``;

    let i = 0;
    while (i < input.length) {
        // type 1
        let length = parseInt(input[i]);
        i++;
        if (length > 0) {
            const data = input.substring(i, i + length);
            answer += data;
            i += length;
        }

        if (i >= input.length) break;

        // type 2
        length = parseInt(input[i]);
        i++;
        if (length > 0) {
            const offset = parseInt(input[i]);
            i++;

            for (let j = 0; j < length; j++) {
                answer += answer[answer.length - offset];
            }
        }
    }

    ns.print(`Output: ${answer}`);
    return answer;
}
