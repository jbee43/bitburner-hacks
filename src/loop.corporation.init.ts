import { NS } from "@ns";
import helper from "@/helper";
import log from "@/log";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);
    while (true != ns.corporation.hasCorporation()) {
        const config = helper.config(ns);
        if (ns.corporation.createCorporation(config.corporation.name, true)) {
            log.success(ns, "%s <-- corporation created", config.corporation.name);
            break;
        }
        await helper.wait(ns, config.corporation.intervalMs);
    }
    const script = "loop.corporation.js";
    const threads = 1;
    while (
        ns.run(script, {
            preventDuplicates: true,
            threads: threads,
        }) < 1
    ) {
        log.error(ns, "run %s -t %d <-- failed", script, threads);
        await helper.wait(ns, helper.config(ns).corporation.intervalMs);
    }
}
