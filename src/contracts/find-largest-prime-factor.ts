// Find Largest Prime Factor

import { NS } from "@ns";

export default function findLargestPrimeFactor(ns: NS, arg: string) {
    const input: number = JSON.parse(arg);
    ns.print(`Input: ${input}`);

    let answer = input;
    for (let i = 2; i < input / 2; i++) {
        const candidate = input / i;
        if (input % i === 0) {
            let prime = true;
            for (let j = 2; j < candidate / 2; j++) {
                if (candidate % j === 0) {
                    prime = false;
                    break;
                }
            }

            if (prime) {
                answer = candidate;
                break;
            }
        }
    }

    ns.print(`Maximum prime factor is ${answer}`);
    return answer;
}
