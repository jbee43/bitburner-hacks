// Compression I: RLE Compression

import { NS } from "@ns";

export default function compression1(ns: NS, arg: string) {
    const input: string = JSON.parse(arg);
    ns.print(`Input: ${input}`);

    let answer = ``;
    for (let i = 0; i < input.length; i) {
        const char = input[i];
        let count = 1;
        while (i + count < input.length && count < 9 && input[i + count] == char) {
            count++;
        }

        answer += `${count}${char}`;
        i += count;
    }

    ns.print(`Output: ${answer}`);
    return answer;
}
