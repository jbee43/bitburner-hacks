// Encryption I: Caesar Cipher

import { NS } from "@ns";

export default function encryption1(ns: NS, arg: string) {
    const input: [string, number] = JSON.parse(arg);
    const str = input[0];
    const shift = input[1];
    ns.print(`Input: ${str}`);
    ns.print(`Shift: ${shift}`);

    const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`;

    const rightShift = chars.length - shift;

    let answer = ``;
    for (let i = 0; i < str.length; i++) {
        const start = chars.indexOf(str[i]);
        if (start < 0) {
            answer += str[i];
            continue;
        }
        const end = (start + rightShift) % chars.length;

        answer += chars[end];
    }

    ns.print(`Input: ${str}, Output: ${answer}`);
    return answer;
}
