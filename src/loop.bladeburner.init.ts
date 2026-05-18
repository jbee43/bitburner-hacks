import { NS } from "@ns";
import helper from "@/helper";
import log from "@/log";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);
    while (true != ns.bladeburner.inBladeburner()) {
        if (ns.bladeburner.joinBladeburnerDivision()) {
            log.success(ns, "<-- joined");
            break;
        }
        await ns.sleep(4_000);
    }
    const script = "loop.bladeburner.js";
    const threads = 1;
    while (
        ns.run(script, {
            preventDuplicates: true,
            threads: threads,
        }) < 1
    ) {
        log.error(ns, "run %s -t %d <-- failed", script, threads);
        await ns.sleep(4_000);
    }
}
