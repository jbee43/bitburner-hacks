import { NS, Server } from "@ns";
import helper from "@/helper";
import Host from "@/interfaces/Host";
import { HOME_HOSTNAME, HOSTS_FILENAME } from "@/constant";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    /**
     * LOOP
     */
    while (true) {
        const currentHosts: Host[] = scan(ns);
        ns.write(HOSTS_FILENAME, helper.jsonStringify(currentHosts), "w");
        await ns.sleep(1_000);
    }
}

function scan(ns: NS, depth = 0, hosts: Host[] = [], parent = HOME_HOSTNAME): Host[] {
    const server: Server = ns.getServer(parent);

    hosts.push({
        ...server,
        depth: depth,
        links: ns.scan(parent),
        ramFree: server.maxRam - server.ramUsed,
    });

    hosts[hosts.length - 1].links
        .filter((link) => hosts.every((host) => host.hostname != link))
        .forEach((link) => {
            scan(ns, depth + 1, hosts, link);
        });

    return hosts;
}
