import { NS } from "@ns";
import { CONTRACTS_STATS_FILENAME } from "@/constant";
import helper from "@/helper";
import Host from "@/interfaces/Host";
import log from "@/log";

interface Contract {
    filename: string;
    host: Host;
    title: string;
}

interface Solution {
    prepareInput?: (input: any) => any;
    solver: (ns: NS, input: string) => any;
    title: string;
}

import algorithmicStockTrader from "@/contracts/algorithmic-stock-trader";
import arrayJumpingGame from "@/contracts/array-jumping-game";
import arrayJumpingGame2 from "@/contracts/array-jumping-game-ii";
import compression1 from "@/contracts/compression-i-rle-compression";
import compression2 from "@/contracts/compression-ii-lz-decompression";
import compression3 from "@/contracts/compression-iii-lz-compression";
import encryption1 from "@/contracts/encryption-i-caesar-cipher";
import encryption2 from "@/contracts/encryption-ii-vigenere-cipher";
import findAllValidMathExpressions from "@/contracts/find-all-valid-math-expressions";
import findLargestPrimeFactor from "@/contracts/find-largest-prime-factor";
import generateIpAddresses from "@/contracts/generate-ip-addresses";
import hammingBinaryToInteger from "@/contracts/hammingcodes-encoded-binary-to-integer";
import hammingIntegerToBinary from "@/contracts/hammingcodes-integer-to-encoded-binary";
import mergeOverlappingIntervals from "@/contracts/merge-overlapping-intervals";
import minimumPathSumTriangle from "@/contracts/minimum-path-sum-in-a-triangle";
import properColoringOfGraph from "@/contracts/proper-2-coloring-of-a-graph";
import sanitizeParenthesesInExpression from "@/contracts/sanitize-parentheses-in-expression";
import shortestPathInGrid from "@/contracts/shortest-path-in-a-grid";
import spiralizeMatrix from "@/contracts/spiralize-matrix";
import squareRoot from "@/contracts/square-root";
import subarrayWithMaximumSum from "@/contracts/subarray-with-maximum-sum";
import totalWaysToSum from "@/contracts/total-ways-to-sum";
import uniquePathsInGrid from "@/contracts/unique-paths-in-a-grid";

const solutions: Solution[] = [
    {
        title: "Algorithmic Stock Trader I",
        solver: algorithmicStockTrader,
        prepareInput: (input: string) => [1, input],
    },
    {
        title: "Algorithmic Stock Trader II",
        solver: algorithmicStockTrader,
        prepareInput: (input: string) => [input.length, input],
    },
    {
        title: "Algorithmic Stock Trader III",
        solver: algorithmicStockTrader,
        prepareInput: (input: string) => [2, input],
    },
    { title: "Algorithmic Stock Trader IV", solver: algorithmicStockTrader },
    { title: "Array Jumping Game", solver: arrayJumpingGame },
    { title: "Array Jumping Game II", solver: arrayJumpingGame2 },
    { title: "Compression I: RLE Compression", solver: compression1 },
    { title: "Compression II: LZ Decompression", solver: compression2 },
    { title: "Compression III: LZ Compression", solver: compression3 },
    { title: "Encryption I: Caesar Cipher", solver: encryption1 },
    { title: "Encryption II: Vigenère Cipher", solver: encryption2 },
    {
        title: "Find All Valid Math Expressions",
        solver: findAllValidMathExpressions,
    },
    { title: "Find Largest Prime Factor", solver: findLargestPrimeFactor },
    { title: "Generate IP Addresses", solver: generateIpAddresses },
    {
        title: "HammingCodes: Integer to Encoded Binary",
        solver: hammingIntegerToBinary,
    },
    {
        title: "HammingCodes: Encoded Binary to Integer",
        solver: hammingBinaryToInteger,
    },
    { title: "Merge Overlapping Intervals", solver: mergeOverlappingIntervals },
    { title: "Minimum Path Sum in a Triangle", solver: minimumPathSumTriangle },
    { title: "Proper 2-Coloring of a Graph", solver: properColoringOfGraph },
    {
        title: "Sanitize Parentheses in Expression",
        solver: sanitizeParenthesesInExpression,
    },
    { title: "Shortest Path in a Grid", solver: shortestPathInGrid },
    { title: "Spiralize Matrix", solver: spiralizeMatrix },
    { title: "Square Root", solver: squareRoot },
    { title: "Subarray with Maximum Sum", solver: subarrayWithMaximumSum },
    {
        title: "Total Ways to Sum",
        solver: totalWaysToSum,
        prepareInput: (input: string) => [input, [...Array(input).keys()].filter((a) => a > 0)],
    },
    { title: "Total Ways to Sum II", solver: totalWaysToSum },
    {
        title: "Unique Paths in a Grid I",
        solver: uniquePathsInGrid,
        prepareInput: (input: any) =>
            Array(input[0])
                .fill(null)
                .map(() => Array(input[1]).fill(0)),
    },
    { title: "Unique Paths in a Grid II", solver: uniquePathsInGrid },
];

export async function main(ns: NS): Promise<void> {
    helper.init(ns);
    const failed: Contract[] = [];
    let solvedCount = 0;
    let failedCount = 0;

    const writeStats = (): void => {
        ns.write(
            CONTRACTS_STATS_FILENAME,
            JSON.stringify({ solved: solvedCount, failed: failedCount }),
            "w",
        );
    };

    /**
     * MAIN LOOP
     */
    while (true) {
        helper.hosts(ns).forEach((host) => {
            ns.ls(host.hostname)
                .filter(
                    (file) =>
                        file.endsWith(".cct") &&
                        false ==
                            failed.some(
                                (fail) =>
                                    fail.filename == file && fail.host.hostname == host.hostname,
                            ),
                )
                .forEach((file) => {
                    const title: string = ns.codingcontract.getContractType(file, host.hostname);

                    const solution: Solution | undefined = solutions.find(
                        (sol) => sol.title == title,
                    );

                    if (!solution) {
                        log.warn(ns, "No solver for: %s (%s@%s)", title, file, host.hostname);
                        return;
                    }

                    let input: any = ns.codingcontract.getData(file, host.hostname);

                    if (solution.prepareInput) {
                        input = solution.prepareInput(input);
                    }

                    const answer = solution.solver(ns, JSON.stringify(input));

                    const response: string = ns.codingcontract.attempt(answer, file, host.hostname);

                    if (response == "") {
                        log.error(ns, "%s %s@%s <-- failed", title, file, host.hostname);

                        failed.push({
                            filename: file,
                            host: host,
                            title: title,
                        });

                        failedCount++;
                        writeStats();
                    } else {
                        log.success(ns, "%s", response);
                        solvedCount++;
                        writeStats();
                    }
                });
        });

        await ns.sleep(4_000);
    }
}
