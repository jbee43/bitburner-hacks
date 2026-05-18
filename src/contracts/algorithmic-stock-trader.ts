// Algorithmic Stock Trader I
// Algorithmic Stock Trader II
// Algorithmic Stock Trader III
// Algorithmic Stock Trader IV

// https://github.com/devmount/bitburner-contract-solver/blob/bbade7eb9bb0bda329ba1961c31c29f8c3defae8/app.js#L235

import { NS } from "@ns";

export default function algorithmicStockTrader(ns: NS, arg: string) {
    const input: [number, number[]] = JSON.parse(arg);
    ns.print(`Input: ${JSON.stringify(input)}`);

    const maxTransactions = input[0];
    const prices = input[1];

    if (prices.length < 2) {
        ns.print(`Not enough prices to transact. Maximum profit is 0.`);
        return 0;
    }

    if (maxTransactions > prices.length / 2) {
        let sum = 0;
        for (let day = 1; day < prices.length; day++) {
            sum += Math.max(prices[day] - prices[day - 1], 0);
        }
        ns.print(`More transactions available than can be used. Maximum profit is ${sum}.`);
        return sum;
    }

    const rele = Array<number>(maxTransactions + 1).fill(0);
    const hold = Array<number>(maxTransactions + 1).fill(Number.MIN_SAFE_INTEGER);

    for (let day = 0; day < prices.length; day++) {
        const price = prices[day];
        for (let i = maxTransactions; i > 0; i--) {
            rele[i] = Math.max(rele[i], hold[i] + price);
            hold[i] = Math.max(hold[i], rele[i - 1] - price);
        }
    }

    const profit = rele[maxTransactions];
    ns.print(`Maximum profit is ${profit}`);
    return profit;
}
