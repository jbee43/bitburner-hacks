// Encryption II: Vigenère Cipher

import { NS } from "@ns";

export default function encryption2(ns: NS, arg: string) {
    const input: [string, string] = JSON.parse(arg);
    const str = input[0];
    const keyword = input[1];
    ns.print(`Input: ${str}`);
    ns.print(`Keyword: ${keyword}`);

    let fullkeyword = keyword;
    for (let i = fullkeyword.length; i < str.length; i++) {
        fullkeyword += keyword[i % keyword.length];
    }

    ns.print(`Full Keyword: ${fullkeyword}`);

    const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`;

    let answer = ``;
    for (let i = 0; i < str.length; i++) {
        const shift = chars.indexOf(str[i]);
        const end = (chars.indexOf(fullkeyword[i]) + shift) % chars.length;

        answer += chars[end];
    }

    ns.print(`Output: ${answer}`);
    return answer;
}
