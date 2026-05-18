import { NS } from "@ns";
import helper from "@/helper";
import Host from "@/interfaces/Host";
import log, { Type } from "@/log";
import Config from "@/interfaces/Config";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const purchasedServerCount = (): number => ns.getPurchasedServers().length;
    const purchasedServerLimit = (): number => ns.getPurchasedServerLimit();

    const purchasedServerLimitReached = (): boolean =>
        purchasedServerCount() == purchasedServerLimit();

    const upgradableHosts = (ram: number): Partial<Host>[] =>
        ns
            .getPurchasedServers()
            .map((hostname) => ({
                hostname: hostname,
                maxRam: ns.getServerMaxRam(hostname),
            }))
            .filter((host) => ram > host.maxRam)
            .sort((a, b) => a.maxRam - b.maxRam);

    const rams: number[] = [...Array(Math.log(ns.getPurchasedServerMaxRam()) / Math.log(2)).keys()]
        .reverse()
        .map((key) => Math.pow(2, key + 1));

    const canSpend = (config: Config, cost: number): boolean =>
        helper.canSpend(
            config,
            cost,
            ns.getServerMoneyAvailable("home"),
            helper.config(ns).servers.walletMax,
            helper.config(ns).servers.walletPercent,
        );

    const createHostname = (): string => {
        return `S${((purchasedServerCount() + 1) >>> 0).toString(2).padStart(5, "0")}`;
    };

    let limitReached: boolean;

    /**
     * MAIN LOOP
     */
    while (
        true != (limitReached = purchasedServerLimitReached()) ||
        upgradableHosts(rams[0]).length
    ) {
        const config: Config = helper.config(ns);
        for (const ram of rams) {
            if (true != limitReached) {
                const buyCost: number = ns.getPurchasedServerCost(ram);

                if (canSpend(config, buyCost)) {
                    const hostname = ns.purchaseServer(createHostname(), ram);

                    log.msg(
                        ns,
                        hostname.length ? Type.Info : Type.Error,
                        "purchase %s --> +%d CPU, +%s RAM, -%s",
                        hostname.length ? hostname : "failed",
                        hostname.length ? 1 : 0,
                        hostname.length ? ns.formatRam(ram) : 0,
                        hostname.length ? helper.formatMoney(ns, buyCost) : 0,
                    );

                    if (hostname.length) {
                        break;
                    }
                }
            }

            for (const host of upgradableHosts(ram)) {
                const upgradeCost: number = ns.getPurchasedServerUpgradeCost(host.hostname!, ram);

                if (canSpend(config, upgradeCost)) {
                    const success: boolean = ns.upgradePurchasedServer(host.hostname!, ram);

                    log.msg(
                        ns,
                        success ? Type.Info : Type.Error,
                        "upgrade RAM %s %s --> %s, +%s -%s",
                        host.hostname,
                        ns.formatRam(host.maxRam!),
                        ns.formatRam(ram),
                        ns.formatRam(ram - host.maxRam!),
                        helper.formatMoney(ns, upgradeCost),
                    );

                    if (success) {
                        break;
                    }
                }
            }
        }

        await helper.wait(ns, config.servers.intervalMs);
    }

    log.msg(
        ns,
        purchasedServerLimit() == 0 ? Type.Warn : Type.Success,
        purchasedServerLimit() == 0
            ? "This BitNode doesn't allow server purchase"
            : "All %d purchased servers maxed out <-- done",
        purchasedServerLimit(),
    );
}
