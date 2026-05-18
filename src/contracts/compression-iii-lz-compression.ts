// Compression III: LZ Compression

import { NS } from "@ns";

function shorter(a: string, b: string): string {
    return a.length <= b.length ? a : b;
}

export default function compression3(ns: NS, arg: string) {
    const input: string = JSON.parse(arg);
    ns.print(`Input: ${input}`);

    const n = input.length;
    const UNREACHABLE = "x".repeat(n * 3);

    // dp[i][t] = shortest compressed string to encode input[0..i)
    // t=0: last chunk was literal (odd-positioned), t=1: last chunk was backref (even-positioned)
    const dp: string[][] = Array.from({ length: n + 1 }, () => [UNREACHABLE, UNREACHABLE]);

    dp[0][0] = "";

    for (let i = 0; i < n; i++) {
        // From literal state (t=0): next chunk is a backreference (t=1)
        if (dp[i][0] !== UNREACHABLE) {
            // Backreference of length 0 (empty chunk, just switch type)
            dp[i][1] = shorter(dp[i][1], dp[i][0] + "0");

            // Backreference with length 1-9 and offset 1-9
            for (let len = 1; len <= Math.min(9, n - i); len++) {
                for (let off = 1; off <= Math.min(9, i); off++) {
                    let matches = true;
                    for (let j = 0; j < len; j++) {
                        if (input[i + j] !== input[i - off + (j % off)]) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        const candidate = dp[i][0] + `${len}${off}`;
                        dp[i + len][1] = shorter(dp[i + len][1], candidate);
                    }
                }
            }
        }

        // From backreference state (t=1): next chunk is a literal (t=0)
        if (dp[i][1] !== UNREACHABLE) {
            // Literal of length 0 (empty chunk, just switch type)
            dp[i][0] = shorter(dp[i][0], dp[i][1] + "0");

            // Literal of length 1-9
            for (let len = 1; len <= Math.min(9, n - i); len++) {
                const chunk = input.substring(i, i + len);
                const candidate = dp[i][1] + `${len}${chunk}`;
                dp[i + len][0] = shorter(dp[i + len][0], candidate);
            }
        }
    }

    const answer = shorter(dp[n][0], dp[n][1]);

    ns.print(`Output: ${answer}`);
    return answer;
}
