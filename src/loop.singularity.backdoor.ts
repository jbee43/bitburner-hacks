import { NS } from "@ns";
import { HOME_HOSTNAME, WORLD_DAEMON } from "@/constant";
import helper from "@/helper";
import Host from "@/interfaces/Host";
import log, { Color } from "@/log";

interface Faction {
    hostname: string;
    name: string;
}

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    ns.atExit(() => {
        connect(HOME_HOSTNAME);
        log.warn(ns, "%s <-- exit", ns.getScriptName());
    });

    const connect = (hostname: string): void => {
        if (true != ns.singularity.connect(hostname)) {
            log.error(ns, "%s <-- connect failed", hostname);
        }
    };

    const factions: Faction[] = [
        {
            hostname: "fulcrumassets",
            name: "Fulcrum Secret Technologies",
        },
        {
            hostname: "CSEC",
            name: "CyberSec",
        },
        {
            hostname: "avmnite-02h",
            name: "NiteSec",
        },
        {
            hostname: "I.I.I.I",
            name: "The Black Hand",
        },
        {
            hostname: "run4theh111z",
            name: "BitRunners",
        },
    ];

    const targetHosts = (hackOnly: boolean): Host[] => {
        const factionsHostnames: string[] = factions.map((faction) => faction.hostname);

        return helper
            .hosts(ns)
            .filter(
                (host: Host) =>
                    host.hasAdminRights &&
                    (hackOnly || true != host.backdoorInstalled) &&
                    host.hostname != HOME_HOSTNAME &&
                    true != host.purchasedByPlayer &&
                    !!host.requiredHackingSkill &&
                    host.requiredHackingSkill <= ns.getHackingLevel(),
            )
            .sort((a, b) =>
                hackOnly
                    ? b.requiredHackingSkill! - a.requiredHackingSkill!
                    : factionsHostnames.includes(a.hostname) || a.hostname == WORLD_DAEMON
                    ? -1
                    : a.requiredHackingSkill! - b.requiredHackingSkill!,
            );
    };

    const getPath = (hostname: string): string[] => {
        const path: string[] = [hostname];
        do {
            path.unshift(ns.scan(path[0])[0]);
        } while (ns.scan(path[0])[0] != HOME_HOSTNAME);
        return path;
    };

    /**
     * LOOP
     */
    while (true) {
        for (const host of targetHosts(false)) {
            if (host.hostname == WORLD_DAEMON) {
                if (
                    helper.config(ns).singularity.killWorldDaemon &&
                    helper.config(ns).singularity.nextBitnode
                ) {
                    ns.singularity.destroyW0r1dD43m0n(
                        helper.config(ns).singularity.nextBitnode,
                        "init.js",
                    );
                }

                if (
                    true != helper.config(ns).singularity.killWorldDaemon &&
                    true != (await ns.prompt(`${WORLD_DAEMON} found, backdoor?`))
                ) {
                    ns.exit();
                }
            }

            const path: string[] = getPath(host.hostname);
            connect(HOME_HOSTNAME);
            path.forEach((hostname: string) => connect(hostname));

            log.msg(ns, Color.Magenta, "%s %s backdoor... (x.x )", host.hostname, host.ip);

            await ns.singularity.installBackdoor();

            const faction: Faction | undefined = factions.find(
                (fct) => fct.hostname == path[path.length - 1],
            );

            if (faction) {
                if (faction.hostname == "fulcrumassets") {
                    log.msg(
                        ns,
                        Color.Magenta,
                        "%s %s manual hack for faction join... (x.x )",
                        [HOME_HOSTNAME].concat(path).join(" --> "),
                        host.ip,
                    );
                    await ns.singularity.manualHack();
                }

                const joined: boolean = ns.singularity.joinFaction(faction.name);

                if (joined) {
                    log.msg(ns, Color.Magenta, "%s <-- join faction (x.x )", faction.name);
                }
            }

            connect(HOME_HOSTNAME);
        }

        if (helper.config(ns).backdoor.manualHack) {
            const hosts: Host[] = targetHosts(true);

            if (hosts.length) {
                const path: string[] = getPath(hosts[0].hostname);
                connect(HOME_HOSTNAME);
                path.forEach((hostname: string) => connect(hostname));

                log.debug(
                    ns,
                    "%s %s manual hack for XP... (x.x )",
                    [HOME_HOSTNAME].concat(path).join(" --> "),
                    hosts[0].ip,
                );

                await ns.singularity.manualHack();
                connect(HOME_HOSTNAME);
            }
        }

        await helper.wait(ns, helper.config(ns).backdoor.intervalMs);
    }
}
