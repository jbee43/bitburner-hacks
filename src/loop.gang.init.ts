import { NS } from "@ns";
import helper from "@/helper";
import log from "@/log";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);
    while (true != ns.gang.inGang()) {
        const config = helper.config(ns);
        if (ns.gang.createGang(config.gang.faction)) {
            log.success(ns, "%s <-- gang created", config.gang.faction);
            break;
        }
        await helper.wait(ns, config.gang.intervalMs);
    }
    const script = "loop.gang.js";
    const threads = 1;
    while (
        ns.run(script, {
            preventDuplicates: true,
            threads: threads,
        }) < 1
    ) {
        log.error(ns, "run %s -t %d <-- failed", script, threads);
        await helper.wait(ns, helper.config(ns).gang.intervalMs);
    }
}
