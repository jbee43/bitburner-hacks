// Square Root

import { NS } from "@ns";

export default function squareRoot(ns: NS, arg: string) {
    const input: number = JSON.parse(arg);
    ns.print(`Input: ${input}`);

    const n = BigInt(input);

    if (n < 0n) return -1;
    if (n < 2n) return Number(n);

    let x = n;
    let y = (x + 1n) / 2n;

    while (y < x) {
        x = y;
        y = (x + n / x) / 2n;
    }

    if (x * x !== n) {
        ns.print(`${input} is not a perfect square`);
        return -1;
    }

    ns.print(`Square root of ${input} is ${x}`);
    return Number(x);
}
