// Sanitize Parentheses in Expression

import { NS } from "@ns";

function generateVariants(str: string, char: string) {
    const variants = new Set<string>();
    const matchStr = new RegExp(`\\${char}`, `g`);
    const matches = [...str.matchAll(matchStr)];
    for (const match of matches) {
        variants.add(`${str.slice(0, match.index)}${str.slice((match.index as number) + 1)}`);
    }
    return variants;
}

export default function sanitizeParenthesesInExpression(ns: NS, arg: string) {
    const input: string = JSON.parse(arg).replace(/^\)+/, ``).replace(/\(+$/, ``);
    ns.print(`Input: ${input}`);

    // fix Closes
    let opens = 0;
    const heads = [];

    const firstChar = input.charAt(0);
    if (firstChar === "(") opens++;
    heads.push(firstChar);

    for (let i = 1; i < input.length; i++) {
        const char = input.charAt(i);

        if (char === `)` && opens <= 0) {
            const newHeads = new Set<string>();
            for (const head of heads) {
                generateVariants(`${head}${char}`, char).forEach((v) => newHeads.add(v));
            }
            heads.splice(0, heads.length, ...newHeads);
            continue;
        }

        if (char === `)`) opens--;
        if (char === `(`) opens++;

        heads.splice(0, heads.length, ...heads.map((h) => `${h}${char}`));
    }

    const answers = [];

    // fix Opens
    for (const head of heads) {
        let closes = 0;
        const tails = [];

        const lastChar = head.charAt(head.length - 1);
        if (lastChar === ")") closes++;
        tails.push(lastChar);

        for (let i = head.length - 2; i >= 0; i--) {
            const char = head.charAt(i);

            if (char === `(` && closes <= 0) {
                const newTails = new Set<string>();
                for (const tail of tails) {
                    generateVariants(`${char}${tail}`, char).forEach((v) => newTails.add(v));
                }
                tails.splice(0, tails.length, ...newTails);
                continue;
            }

            if (char === `(`) closes--;
            if (char === `)`) closes++;

            tails.splice(0, tails.length, ...tails.map((t) => `${char}${t}`));
        }

        answers.push(...tails);
    }

    ns.print(`Sanitized expressions: ${JSON.stringify(answers)}`);
    return answers;
}
