import { NS } from "@ns";
import helper from "@/helper";
import log, { Type } from "@/log";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const c = "\u001b[36;1m";
    const r = "\u001b[0m";
    ns.tprintf(`${c} _     _ _   _                                ${r}`);
    ns.tprintf(`${c}| |__ (_) |_| |__  _   _ _ __ _ __   ___ _ __ ${r}`);
    ns.tprintf(`${c}| '_ \\| | __| '_ \\| | | | '__| '_ \\ / _ \\ '__|${r}`);
    ns.tprintf(`${c}| |_) | | |_| |_) | |_| | |  | | | |  __/ |   ${r}`);
    ns.tprintf(`${c}|_.__/|_|\\__|_.__/ \\__,_|_|  |_| |_|\\___|_|   ${r}`);
    ns.tprintf(`${c}             [ automation suite ]               ${r}`);

    const scripts: { [name: string]: boolean } = {
        scan: true,
        overview: true,
        nuker: false != helper.config(ns).nuker.init,
        singularity: false != helper.config(ns).singularity.init,
        "singularity.backdoor":
            false != helper.config(ns).singularity.init && false != helper.config(ns).backdoor.init,
        "singularity.darkweb": false != helper.config(ns).singularity.init,
        servers: false != helper.config(ns).servers.init && ns.getPurchasedServerLimit() > 0,
        hacknet: false != helper.config(ns).hacknet.init,
        "gang.init": false != helper.config(ns).gang.init,
        "corporation.init": false != helper.config(ns).corporation.init,
        "bladeburner.init": false != helper.config(ns).bladeburner.init,
        contracts: true,
        sleeves: false != helper.config(ns).sleeves.init,
        grafting: false != helper.config(ns).grafting.init,
        hacking: false != helper.config(ns).hacking.init,
    };

    let first = true;

    const names: string[] = Object.keys(scripts).filter((key) => scripts[key]);
    const running: string[] = [];

    const anyLeft = () => running.length < names.length;
    const getFullName = (name: string) => `loop.${name}.js`;

    while (anyLeft()) {
        for (const name of names.filter((name) => false == running.includes(name))) {
            const fullName = getFullName(name);
            const ram = ns.getScriptRam(fullName);

            const pid = ns.run(fullName, {
                preventDuplicates: true,
                threads: 1,
            });

            if (pid > 0) {
                running.push(name);
                log.info(ns, "run %s --> PID %d, -%s", fullName, pid, ns.formatRam(ram));
            }

            await ns.sleep(400);
        }

        if (first && anyLeft()) {
            log.msg(
                ns,
                Type.Warn,
                "Waiting for RAM --> will keep trying to run %d script(s): %s",
                names.length - running.length,
                names.filter((name) => true != running.includes(name)).join(", "),
            );
        }

        first = false;
        await ns.sleep(1_000);
    }

    log.success(
        ns,
        "%d script(s) running <-- initialization complete: %s",
        names.length,
        running.map((name) => getFullName(name)).join(", "),
    );
}
