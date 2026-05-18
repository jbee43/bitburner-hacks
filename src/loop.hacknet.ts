import { NS, NodeStats } from "@ns";
import Config from "@/interfaces/Config";
import helper from "@/helper";
import log, { Type } from "@/log";

interface Upgrade {
    cost: number;
    gain: number;
    type: string;
}

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const NodeCountLimitReached = (): boolean => ns.hacknet.maxNumNodes() == ns.hacknet.numNodes();

    const nodesIndexes = (): number[] => [...Array(ns.hacknet.numNodes()).keys()];

    const upgradableNodesExist = (): boolean =>
        nodesIndexes().some(
            (index) =>
                Number.isFinite(ns.hacknet.getCoreUpgradeCost(index, 1)) ||
                Number.isFinite(ns.hacknet.getLevelUpgradeCost(index, 1)) ||
                Number.isFinite(ns.hacknet.getRamUpgradeCost(index, 1)),
        );

    const canSpend = (config: Config, cost: number): boolean =>
        helper.canSpend(
            config,
            cost,
            ns.getServerMoneyAvailable("home"),
            config.hacknet.walletMax,
            config.hacknet.walletPercent,
        );

    const shortName = (stats: NodeStats): string => stats.name.replace("hacknet-", "");

    const makeUpgrade = (cost: number, index: number, type: string): boolean => {
        const stat = (stats: NodeStats): number | undefined =>
            type == "cache"
                ? stats.cache
                : type == "cpu"
                ? stats.cores
                : type == "lvl"
                ? stats.level
                : type == "ram"
                ? stats.ram
                : undefined;

        let stats: NodeStats = ns.hacknet.getNodeStats(index);
        const previousStat = stat(stats);

        const success: boolean =
            type == "cache"
                ? ns.hacknet.upgradeCache(index, 1)
                : type == "cpu"
                ? ns.hacknet.upgradeCore(index, 1)
                : type == "lvl"
                ? ns.hacknet.upgradeLevel(index, 1)
                : type == "ram"
                ? ns.hacknet.upgradeRam(index, 1)
                : false;

        stats = ns.hacknet.getNodeStats(index);
        const currentStat = stat(stats);

        if (previousStat == undefined || currentStat == undefined) {
            return false;
        }

        const isRam: boolean = type == "ram";

        log.msg(
            ns,
            success ? Type.Debug : Type.Error,
            "%s upgrade %s %s --> %s, -%s",
            shortName(stats),
            type.toUpperCase(),
            isRam ? ns.formatRam(previousStat) : previousStat,
            isRam ? ns.formatRam(currentStat) : currentStat,
            helper.formatMoney(ns, cost),
        );

        return success;
    };

    const tryBuyNodes = (config: Config): void => {
        let buyCost: number;

        while (canSpend(config, (buyCost = ns.hacknet.getPurchaseNodeCost()))) {
            const index: number = ns.hacknet.purchaseNode();

            if (index < 0) {
                log.error(ns, "<-- failed purchase node for $%s", ns.formatNumber(buyCost));
                break;
            }

            const stats: NodeStats = ns.hacknet.getNodeStats(index);

            log.info(
                ns,
                "%s purchase --> +%d CPU, +%s RAM, -%s",
                shortName(stats),
                stats.cores,
                ns.formatRam(stats.ram),
                helper.formatMoney(ns, buyCost),
            );
        }
    };

    const trySpendHash = (name: string, target: string | undefined = undefined): void => {
        let cost: number;
        let costTotal = 0;
        let count = 0;

        while ((cost = ns.hacknet.hashCost(name, 1)) <= ns.hacknet.numHashes()) {
            if (ns.hacknet.spendHashes(name, target, 1)) {
                costTotal += cost;
                count++;
            } else {
                break;
            }
        }

        if (costTotal) {
            log.info(
                ns,
                "spent hashes #%s --> %s x%d%s%s",
                ns.formatNumber(costTotal),
                name,
                count,
                name == "Sell for Money" ? ` +$${ns.formatNumber(count * 1_000_000)}` : "",
                target ? ` ${target}` : "",
            );
        }
    };

    const trySpendHashes = (config: Config): void => {
        if (true != areServers(ns) || ns.hacknet.numHashes() < 1) {
            return;
        }

        if (config.hacknet.hashSpend.sellForCorpFunds) {
            trySpendHash("Sell for Corporation Funds");
        }

        const reduce =
            typeof config.hacknet.hashSpend.reduceSecurity == "string"
                ? (config.hacknet.hashSpend.reduceSecurity as string)
                : null;

        if (config.hacknet.hashSpend.reduceSecurity == true || reduce?.length) {
            const target: string | undefined =
                reduce ?? helper.hosts(ns, true).find((host) => host.minDifficulty! > 1)?.hostname;

            if (target) {
                trySpendHash("Reduce Minimum Security", target);
            }
        }

        const increase =
            typeof config.hacknet.hashSpend.increaseMoney == "string"
                ? (config.hacknet.hashSpend.increaseMoney as string)
                : null;

        if (config.hacknet.hashSpend.increaseMoney == true || increase?.length) {
            const target: string | undefined =
                increase ??
                helper.hosts(ns, true).find((host) => host.moneyMax! < 10_000_000_000_000)
                    ?.hostname;

            trySpendHash("Increase Maximum Money", target);
        }

        if (config.hacknet.hashSpend.improveStudy) {
            trySpendHash("Improve Studying");
        }

        if (config.hacknet.hashSpend.improveGym) {
            trySpendHash("Improve Gym Training");
        }

        if (config.hacknet.hashSpend.corpResearch) {
            trySpendHash("Exchange for Corporation Research");
        }

        if (config.hacknet.hashSpend.bladeburnerRank) {
            trySpendHash("Exchange for Bladeburner Rank");
        }

        if (config.hacknet.hashSpend.bladeburnerSp) {
            trySpendHash("Exchange for Bladeburner SP");
        }

        if (config.hacknet.hashSpend.codingContract) {
            trySpendHash("Generate Coding Contract");
        }

        const favor =
            typeof config.hacknet.hashSpend.companyFavor == "string"
                ? (config.hacknet.hashSpend.companyFavor as string)
                : null;

        if (config.hacknet.hashSpend.companyFavor == true || favor?.length) {
            const comps = helper.companiesLeft(ns, ns.getPlayer());
            if (comps.length || favor?.length) {
                const comp = favor ?? comps.find((c) => ns.singularity.getCompanyFavor(c) < 150);
                if (comp) {
                    trySpendHash("Company Favor", comp);
                }
            }
        }

        if (
            config.hacknet.hashSpend.sellForMoney ||
            ns.hacknet.numHashes() >= ns.hacknet.hashCapacity() * 0.9
        ) {
            trySpendHash("Sell for Money");
        }
    };

    const upgrades = (config: Config, index: number): Upgrade[] => {
        const types = config.hacknet.useRam
            ? config.hacking.targetMoneyPercent == 0
                ? ["ram"]
                : ["ram", "cpu"]
            : ["cpu", "ram", "lvl"];

        if (areServers(ns) && ns.hacknet.numHashes() >= ns.hacknet.hashCapacity() * 0.5) {
            types.push("cache");
        }

        const stats: NodeStats = ns.hacknet.getNodeStats(index);

        return types
            .map((type) => ({
                cost:
                    type == "cache"
                        ? ns.hacknet.getCacheUpgradeCost(index, 1)
                        : type == "cpu"
                        ? ns.hacknet.getCoreUpgradeCost(index, 1)
                        : type == "lvl"
                        ? ns.hacknet.getLevelUpgradeCost(index, 1)
                        : type == "ram"
                        ? ns.hacknet.getRamUpgradeCost(index, 1)
                        : Infinity,
                gain:
                    type == "cache"
                        ? 0
                        : type == "cpu"
                        ? calculateGainRate(
                              ns,
                              stats.level,
                              stats.ramUsed,
                              stats.ram,
                              stats.cores + 1,
                          ) -
                          calculateGainRate(ns, stats.level, stats.ramUsed, stats.ram, stats.cores)
                        : type == "lvl"
                        ? calculateGainRate(
                              ns,
                              stats.level + 1,
                              stats.ramUsed,
                              stats.ram,
                              stats.cores,
                          ) -
                          calculateGainRate(ns, stats.level, stats.ramUsed, stats.ram, stats.cores)
                        : type == "ram"
                        ? calculateGainRate(
                              ns,
                              stats.level,
                              stats.ramUsed,
                              stats.ram * 2,
                              stats.cores,
                          ) -
                          calculateGainRate(ns, stats.level, stats.ramUsed, stats.ram, stats.cores)
                        : -1,
                type: type,
            }))
            .sort((a, b) => b.gain - a.gain);
    };

    const tryUpgradeNodes = (config: Config): void => {
        if (ns.hacknet.numNodes() < 1) {
            return;
        }

        for (const index of nodesIndexes().sort((a, b) => {
            const statsA: NodeStats = ns.hacknet.getNodeStats(a);
            const statsB: NodeStats = ns.hacknet.getNodeStats(b);
            return (
                calculateGainRate(ns, statsB.level, statsB.ramUsed, statsB.ram, statsB.cores) -
                calculateGainRate(ns, statsA.level, statsA.ramUsed, statsA.ram, statsA.cores)
            );
        })) {
            let upgrade: Upgrade | undefined;
            const upgraded: Upgrade[] = [];
            while (
                (upgrade = upgrades(config, index).find((upgrade) =>
                    canSpend(config, upgrade.cost),
                ))
            ) {
                if (makeUpgrade(upgrade.cost, index, upgrade.type)) {
                    upgraded.push(upgrade);
                    continue;
                }
                break;
            }
            if (upgraded.length) {
                log.info(
                    ns,
                    "upgrade %s %s --> -$%s",
                    shortName(ns.hacknet.getNodeStats(index)),
                    [
                        ...new Set(
                            upgraded.map(
                                (upg) =>
                                    `${upg.type.toUpperCase()}x${
                                        upgraded.filter((u) => u.type == upg.type).length
                                    }`,
                            ),
                        ),
                    ]
                        .sort()
                        .join(", "),
                    ns.formatNumber(
                        upgraded.map((upg) => upg.cost).reduce((acc, curr) => acc + curr, 0),
                    ),
                );
            }
        }
    };

    /**
     * LOOP
     */
    while (false == NodeCountLimitReached() || upgradableNodesExist()) {
        const config: Config = helper.config(ns);
        trySpendHashes(config);
        tryBuyNodes(config);
        tryUpgradeNodes(config);
        await helper.wait(ns, config.hacknet.intervalMs);
    }

    log.success(ns, "Hacknet maxed out x%d <-- done", ns.hacknet.maxNumNodes());
}

function areServers(ns: NS): boolean {
    return ns.hacknet.numNodes() > 0 && ns.hacknet.getNodeStats(0).name.includes("-server-");
}

function calculateHashGainRate(
    level: number,
    ramUsed: number,
    maxRam: number,
    cores: number,
    mult: number, // hacknet production modifier (augs)
    bitnodeMult: number,
): number {
    const baseGain = 0.001 * level;
    const ramMultiplier = Math.pow(1.07, Math.log2(maxRam));
    const coreMultiplier = 1 + (cores - 1) / 5;
    const ramRatio = 1 - ramUsed / maxRam;

    return baseGain * ramMultiplier * coreMultiplier * ramRatio * mult * bitnodeMult;
}

function calculateMoneyGainRate(
    level: number,
    ram: number,
    cores: number,
    mult: number, // hacknet production modifier (augs)
    bitnodeMult: number,
): number {
    const levelMult = level * 1.5;
    const ramMult = Math.pow(1.035, ram - 1);
    const coresMult = (cores + 5) / 6;
    return levelMult * ramMult * coresMult * mult * bitnodeMult;
}

function calculateGainRate(
    ns: NS,
    level: number,
    ramUsed: number | undefined,
    maxRam: number,
    cores: number,
): number {
    const playerMult = ns.getPlayer().mults.hacknet_node_money ?? 1;
    const bitnodeMult = ns.getBitNodeMultipliers().HacknetNodeMoney;
    return areServers(ns)
        ? calculateHashGainRate(level, ramUsed ?? 0, maxRam, cores, playerMult, bitnodeMult)
        : calculateMoneyGainRate(level, maxRam, cores, playerMult, bitnodeMult);
}
