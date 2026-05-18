import { NS } from "@ns";
import helper from "@/helper";
import { HOME_HOSTNAME } from "@/constant";
import Host from "@/interfaces/Host";
import log, { Type } from "@/log";

export async function main(ns: NS): Promise<void> {
    const extensions: string[] = (ns.args[0] as string)?.split(",") ?? ["js", "txt"];

    const keep: string[] = (ns.args[1] as string)?.split(",") ?? [
        "cleanup.js",
        "helper.js",
        "log.js",
    ];

    if (
        await ns.prompt(
            `Remove all ${extensions.join(", ")} files${
                keep.length > 0 ? ` except ${keep.join(", ")}` : ""
            } from all hosts with admin rights?`,
        )
    ) {
        const error: string[] = [];
        const hosts: Host[] = helper.hosts(ns);
        let total = 0;

        const clean = (file: string, host: Host): void => {
            const cleaned: boolean = ns.rm(file);

            log.msg(ns, cleaned ? Type.Info : Type.Error, "%s %s --> *poof*", host.hostname, file);

            if (true != cleaned) {
                error.push(`${host.hostname} ${file}`);
            }

            total++;
        };

        hosts
            .sort((a, _b) => (a.hostname == HOME_HOSTNAME ? 1 : -1))
            .filter((host: Host) => host.hasAdminRights)
            .forEach((host: Host) => {
                ns.ls(host.hostname)
                    .filter(
                        (file: string) =>
                            extensions.some((extension: string) => file.endsWith(extension)) &&
                            keep.every(
                                (keepFile: string) => keepFile.toLowerCase() != file.toLowerCase(),
                            ),
                    )
                    .forEach((file) => clean(file, host));
            });

        log.msg(
            ns,
            error ? Type.Error : Type.Info,
            "%d/%d files cleaned <-- %s",
            total - error.length,
            total,
            error.length ? `error: ${error.join(", ")}` : "done",
        );
    }
}
