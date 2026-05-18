// Subarray with Maximum Sum

import { NS } from "@ns";

export default function subarrayWithMaximumSum(ns: NS, arg: string) {
    const input: number[] = JSON.parse(arg);
    ns.print(`Input: ${JSON.stringify(input)}`);

    let maxCurrent = input[0];
    let maxGlobal = input[0];

    for (let i = 1; i < input.length; i++) {
        maxCurrent = Math.max(input[i], maxCurrent + input[i]);
        maxGlobal = Math.max(maxGlobal, maxCurrent);
    }

    ns.print(`Maximum subarray sum is ${maxGlobal}`);
    return maxGlobal;
}
