import { NS } from "@ns";
import { HOME_HOSTNAME, HOSTS_TARGETS_FILENAME } from "@/constant";
import helper from "@/helper";
import Host from "@/interfaces/Host";
import log, { Type } from "@/log";
import Config from "@/interfaces/Config";

interface Script {
    args: (string | number | boolean)[];
    file: string;
    grow?: boolean;
    hack?: boolean;
    ram: number;
    threads: number;
    weaken?: boolean;
}

export async function main(ns: NS) {
    helper.init(ns);

    const rateTarget = (ns: NS, target: Host): number => {
        if (helper.config(ns).hacking.targetMoneyPercent > 0) {
            const hackTime = ns.getHackTime(target.hostname);
            return (
                (ns.hackAnalyze(target.hostname) *
                    target.moneyMax! *
                    target.serverGrowth! *
                    ns.hackAnalyzeChance(target.hostname)) /
                hackTime
            );
        }
        return target.requiredHackingSkill
            ? (ns.getHackingLevel() - target.requiredHackingSkill) / ns.getHackingLevel()
            : 0;
    };

    const isHacknet = (host: Host): boolean => host.hostname.startsWith("hacknet-");

    const getTargets = (ns: NS, hosts: Host[]): Host[] => {
        const targets: Host[] = hosts
            .filter(
                (host: Host) =>
                    host.hasAdminRights &&
                    host.hostname != HOME_HOSTNAME &&
                    true != isHacknet(host) &&
                    !!host.moneyMax &&
                    host.moneyMax > 0 &&
                    true != host.purchasedByPlayer &&
                    !!host.requiredHackingSkill &&
                    host.requiredHackingSkill <= ns.getHackingLevel() / 2,
            )
            .sort((a, b) => rateTarget(ns, b) - rateTarget(ns, a));

        ns.write(HOSTS_TARGETS_FILENAME, helper.jsonStringify(targets), "w");

        return targets;
    };

    const hack = (ns: NS, target: Host): Script => {
        const analyze: number = ns.fileExists("Formulas.exe")
            ? ns.formulas.hacking.hackPercent(target, ns.getPlayer())
            : ns.hackAnalyze(target.hostname);

        return {
            args: [-1, target.hostname],
            file: "daemon.hack.js",
            hack: true,
            ram: 1.7,
            threads:
                analyze > 0
                    ? Math.ceil(helper.config(ns).hacking.targetMoneyPercent / 100 / analyze)
                    : 0,
        };
    };

    const grow = (ns: NS, host: Host, target: Host): Script => {
        const threads = ns.fileExists("Formulas.exe")
            ? ns.formulas.hacking.growThreads(
                  target,
                  ns.getPlayer(),
                  target.moneyMax!,
                  host.cpuCores,
              )
            : Math.ceil(
                  ns.growthAnalyze(
                      target.hostname,
                      target.moneyMax! /
                          (target.moneyAvailable && target.moneyAvailable > 0
                              ? target.moneyAvailable
                              : 0.01),
                      host.cpuCores,
                  ),
              );

        return {
            args: [-1, target.hostname],
            file: "daemon.grow.js",
            grow: true,
            ram: 1.75,
            threads: threads,
        };
    };

    const stanek = (host: Host): Script => {
        return {
            args: [],
            file: "daemon.stanek.js",
            ram: 7,
            threads: Math.floor(host.maxRam / 7),
        };
    };

    const weaken = (ns: NS, host: Host, target: Host): Script => {
        const script: Script = {
            args: [-1, target.hostname],
            file: "daemon.weaken.js",
            ram: 1.75,
            threads: 1,
            weaken: true,
        };

        while (
            ns.weakenAnalyze(script.threads, host.cpuCores) <
            target.hackDifficulty! - target.minDifficulty!
        ) {
            script.threads++;
        }

        return script;
    };

    const copy = (ns: NS, files: string[], hostname: string): boolean => {
        const copy: boolean = ns.scp(files, hostname);

        if (true != copy) {
            log.error(ns, "%s <-- %s copy", hostname, files.join(", "));
        }

        return copy;
    };

    let hacking: string[] = [];
    let growing: string[] = [];
    let useStanek = false; // alternates per cycle for fair RAM sharing
    /**
     * LOOP
     */
    while (true) {
        const allHosts: Host[] = helper.hosts(ns);
        const config: Config = helper.config(ns);

        const targets = getTargets(ns, allHosts).slice(0, config.hacking.targetCount);

        const hosts: Host[] = allHosts
            .filter(
                (host) =>
                    host.hasAdminRights &&
                    host.maxRam &&
                    host.ramFree &&
                    (config.hacknet.useRam || false == isHacknet(host)),
            )
            .sort((a, b) => b.ramFree - a.ramFree);

        useStanek = false == useStanek;

        for (const target of targets) {
            let full = false;

            for (const host of hosts) {
                const forceWeaken: boolean =
                    (full && hacking.includes(target.hostname)) ||
                    growing.includes(target.hostname) ||
                    config.hacking.targetMoneyPercent <= 0;

                const stanekScript: Script = stanek(host);

                const script: Script =
                    host.maxRam >= stanekScript.ram && config.hacking.stanek && useStanek
                        ? stanekScript
                        : forceWeaken || target.hackDifficulty! > target.minDifficulty!
                        ? weaken(ns, host, target)
                        : target.moneyMax! > target.moneyAvailable!
                        ? grow(ns, host, target)
                        : hack(ns, target);

                const hostThreads = Math.floor(
                    (host.ramFree -
                        (host.hostname == HOME_HOSTNAME ? config.hacking.homeRamSpare : 0)) /
                        script.ram,
                );

                const threads: number = forceWeaken
                    ? hostThreads
                    : Math.min(script.threads, hostThreads);

                if (threads < 1 || true != copy(ns, [script.file], host.hostname)) {
                    continue;
                }

                const pid: number = ns.exec(
                    script.file,
                    host.hostname,
                    { ramOverride: script.ram, threads: threads },
                    ...script.args,
                );

                log.msg(
                    ns,
                    pid > 0 ? Type.Debug : Type.Error,
                    "%s %s -t %d %s <-- PID %d",
                    host.hostname,
                    script.file,
                    threads,
                    script.args.join(" "),
                    pid,
                );

                if (pid > 0) {
                    full = threads == script.threads;
                    host.ramFree -= script.ram * threads;

                    if (script.hack) {
                        target.hackDifficulty! += ns.hackAnalyzeSecurity(threads, target.hostname);

                        hacking.push(target.hostname);

                        growing = growing.filter((hostname) => hostname != target.hostname);
                    } else if (script.grow) {
                        target.hackDifficulty! += ns.growthAnalyzeSecurity(
                            threads,
                            target.hostname,
                            host.cpuCores,
                        );

                        hacking = hacking.filter((hostname) => hostname != target.hostname);

                        growing.push(target.hostname);
                    } else if (script.weaken) {
                        target.hackDifficulty! -= ns.weakenAnalyze(threads, host.cpuCores);

                        hacking = hacking.filter((hostname) => hostname != target.hostname);

                        growing = growing.filter((hostname) => hostname != target.hostname);
                    }
                }
            }
        }

        await helper.wait(ns, config.hacking.intervalMs);
    }
}
