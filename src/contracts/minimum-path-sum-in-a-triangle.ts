// Minimum Path Sum in a Triangle

import { NS } from "@ns";

export default function minimumPathSumTriangle(ns: NS, arg: string) {
    const input: number[][] = JSON.parse(arg);
    ns.print(`Input ${JSON.stringify(input)}`);

    const sums = [input[0]];
    for (let row = 1; row < input.length; row++) {
        const rowSums: number[] = [];
        for (let i = 0; i < input[row].length; i++) {
            const current = input[row][i];
            if (i === 0) {
                rowSums.push(sums[row - 1][i] + current);
                continue;
            }
            if (i === input[row].length - 1) {
                rowSums.push(sums[row - 1][i - 1] + current);
                continue;
            }

            const left = sums[row - 1][i - 1];
            const right = sums[row - 1][i];
            rowSums.push(Math.min(left, right) + current);
        }
        sums.push(rowSums);
    }

    const smallestSum = Math.min(...sums[sums.length - 1]);
    ns.print(`Smallest sum is ${smallestSum}`);
    return smallestSum;
}
