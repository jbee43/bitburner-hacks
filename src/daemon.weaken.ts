import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const milliseconds: number = ns.args[0] as number;
    const hostname: string = ns.args[1] as string;

    while (true) {
        await ns.sleep(milliseconds);
        await ns.weaken(hostname);

        if (milliseconds < 0) {
            break;
        }
    }
}
