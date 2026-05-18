import { NS } from "@ns";
import {
    HOME_HOSTNAME,
    PROGRAM_BRUTESSH,
    PROGRAM_FTPCRACK,
    PROGRAM_HTTPWORM,
    PROGRAM_NUKE,
    PROGRAM_RELAYSMTP,
    PROGRAM_SQLINJECT,
} from "@/constant";
import helper from "@/helper";
import Host from "@/interfaces/Host";
import log from "@/log";

interface Attack {
    execute: (hostname: string) => void;
    program: string;
    shouldExecute: (host: Host) => boolean;
}

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const locked = (host: Host): boolean =>
        (host.numOpenPortsRequired ?? 0) - (host.openPortCount ?? 0) > 0;

    const targetHosts = (): Host[] =>
        helper
            .hosts(ns)
            .filter(
                (host) =>
                    host.hostname != HOME_HOSTNAME &&
                    (helper.config(ns).nuker.openAllPorts || locked(host)) &&
                    true != host.purchasedByPlayer,
            );

    const attacks: Attack[] = [
        {
            execute: ns.ftpcrack,
            program: PROGRAM_FTPCRACK,
            shouldExecute: (host: Host) =>
                (locked(host) || helper.config(ns).nuker.openAllPorts) && true != host.ftpPortOpen,
        },
        {
            execute: ns.httpworm,
            program: PROGRAM_HTTPWORM,
            shouldExecute: (host: Host) =>
                (locked(host) || helper.config(ns).nuker.openAllPorts) && true != host.httpPortOpen,
        },
        {
            execute: ns.relaysmtp,
            program: PROGRAM_RELAYSMTP,
            shouldExecute: (host: Host) =>
                (locked(host) || helper.config(ns).nuker.openAllPorts) && true != host.smtpPortOpen,
        },
        {
            execute: ns.sqlinject,
            program: PROGRAM_SQLINJECT,
            shouldExecute: (host: Host) =>
                (locked(host) || helper.config(ns).nuker.openAllPorts) && true != host.sqlPortOpen,
        },
        {
            execute: ns.brutessh,
            program: PROGRAM_BRUTESSH,
            shouldExecute: (host: Host) =>
                (locked(host) || helper.config(ns).nuker.openAllPorts) && true != host.sshPortOpen,
        },
        {
            execute: ns.nuke,
            program: PROGRAM_NUKE,
            shouldExecute: (host: Host) => false == locked(host) && true != host.hasAdminRights,
        },
    ];

    /**
     * MAIN LOOP
     */
    while (true) {
        // just to log
        const attacked: { [program: string]: string[] } = {};

        targetHosts().forEach((host: Host) => {
            attacks.forEach((attack) => {
                if (attack.shouldExecute(host) && ns.fileExists(attack.program)) {
                    attack.execute(host.hostname);
                    attacked[attack.program] ??= [];
                    attacked[attack.program].push(host.hostname);
                }
            });
        });

        Object.keys(attacked).forEach((program) => {
            log.info(
                ns,
                "%s x%d --> %s",
                program,
                attacked[program].length,
                attacked[program].sort().join(", "),
            );
        });

        await helper.wait(ns, helper.config(ns).nuker.intervalMs);
    }
}
