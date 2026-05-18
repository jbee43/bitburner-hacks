import { NS } from "@ns";
import { HOME_HOSTNAME, HOSTS_TARGETS_FILENAME } from "@/constant";
import helper from "@/helper";
import Host from "@/interfaces/Host";

export async function main(ns: NS): Promise<void> {
    const highlight = [
        "avmnite-02h",
        "CSEC",
        "I.I.I.I",
        "run4theh111z",
        "The-Cave",
        "w0r1d_d43m0n",
    ];

    const mine: boolean = ns.args.some((arg) => (arg as string)?.toLowerCase()?.endsWith("-p"));

    const hosts: Host[] = mine
        ? helper.hosts(ns).sort((a, b) => a.maxRam - b.maxRam)
        : helper.hosts(ns);

    hosts.forEach((host: Host) => {
        if (host.hostname == HOME_HOSTNAME || (mine && host.purchasedByPlayer)) {
            ns.tprintf(
                "%s%d%s %s <-- %d cores | %s of %s used (%s)",
                " ".repeat(host.depth),
                host.depth,
                host.depth > 10 ? "}" : host.depth > 5 ? "]" : ")",
                host.hostname,
                host.cpuCores,
                ns.formatRam(host.ramUsed),
                ns.formatRam(host.maxRam),
                `${((host.ramUsed * 100) / host.maxRam).toFixed(2)}%`,
            );
        } else if (!mine && true != host.purchasedByPlayer) {
            const tags = [];
            if (host.backdoorInstalled) {
                tags.push("Backdoor");
            }
            if (true != host.hasAdminRights) {
                tags.push("Locked");
            }
            const targets = ns.read(HOSTS_TARGETS_FILENAME);
            if (targets.length) {
                const json = JSON.parse(targets);
                for (let i = 0; i < json.length; i++) {
                    if (json[i].hostname == host.hostname) {
                        tags.push(`Target #${i + 1}`);
                    }
                }
            }
            ns.tprintf(
                "%s%d%s %s <-- %s | hack LVL %d | security %d (min. %d) | %s",
                " ".repeat(host.depth),
                host.depth,
                host.depth > 10 ? "}" : host.depth > 5 ? "]" : ")",
                highlight.some((h) => h == host.hostname)
                    ? `!!! ${host.hostname} !!!`
                    : host.hostname,
                `${
                    !host.moneyMax || !host.moneyAvailable
                        ? "no money,"
                        : `$${ns.formatNumber(host.moneyAvailable ?? 0)} of $${ns.formatNumber(
                              host.moneyMax ?? 0,
                          )} (${((host.moneyAvailable * 100) / host.moneyMax).toFixed(2)}%)`
                }`,

                host.requiredHackingSkill,
                host.hackDifficulty,
                host.minDifficulty,
                `${tags.sort().join(", ")}`,
            );
        }
    });
}
