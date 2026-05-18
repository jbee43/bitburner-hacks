// Generate IP Addresses

import { NS } from "@ns";

export default function generateIpAddresses(ns: NS, arg: string) {
    const input: string = JSON.parse(arg);
    ns.print(`Input: ${input}`);

    const addresses = [];
    for (let len1 = 1; len1 <= 3; len1++) {
        const octet1 = Number.parseInt(input.slice(0, len1));
        if (octet1.toString().length !== len1) continue;
        if (octet1 > 255) continue;
        ns.print(`o1: ${octet1}`);

        for (let len2 = 1; len2 <= 3; len2++) {
            const octet2 = Number.parseInt(input.slice(len1, len1 + len2));
            if (octet2.toString().length !== len2) continue;
            if (octet2 > 255) continue;
            ns.print(`o2: ${octet2}`);

            for (let len3 = 1; len3 <= 3; len3++) {
                const octet3 = Number.parseInt(input.slice(len1 + len2, len1 + len2 + len3));
                if (octet3.toString().length !== len3) continue;
                if (octet3 > 255) continue;
                ns.print(`o3: ${octet3}`);

                for (let len4 = 1; len4 <= 3; len4++) {
                    if (len1 + len2 + len3 + len4 !== input.length) continue;

                    const octet4 = Number.parseInt(input.slice(len1 + len2 + len3));
                    if (octet4.toString().length !== len4) continue;
                    if (octet4 > 255) continue;
                    ns.print(`o4: ${octet4}`);

                    addresses.push(`${octet1}.${octet2}.${octet3}.${octet4}`);
                }
            }
        }
    }

    // shouldn't need to .toString() here, but v2.1.0 has a bug
    ns.print(`IP Addresses: ${JSON.stringify(addresses.toString())}`);
    return addresses;
}
