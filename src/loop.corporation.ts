import { NS, Warehouse } from "@ns";
import helper from "@/helper";
import log, { Color } from "@/log";
import Config from "@/interfaces/Config";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const canSpend = (config: Config, cost: number): boolean =>
        helper.canSpend(
            config,
            cost,
            ns.corporation.getCorporation().funds,
            config.corporation.fundsMax,
            config.corporation.fundsPercent,
        );

    const tryUnlock = (config: Config, name: string): boolean => {
        if (ns.corporation.hasUnlock(name)) {
            return true;
        }

        const cost = ns.corporation.getUnlockCost(name);

        if (canSpend(config, cost)) {
            ns.corporation.purchaseUnlock(name);
            log.msg(ns, Color.Magenta, "%s unlocked --> -$%s", name, ns.formatNumber(cost));

            return true;
        }

        return false;
    };

    let first = true;
    let warehouseUpgrade: string[] = [];

    /**
     * MAIN LOOP
     */
    while (true) {
        const config: Config = helper.config(ns);

        if (true != tryUnlock(config, "Office API")) {
            if (first) {
                first = false;
                log.warn(ns, "Office API <-- required, waiting for funds");
            }

            await helper.wait(ns, config.corporation.intervalMs);
            continue;
        }

        const divisions = ns.corporation.getCorporation().divisions;
        const farms = "Farms";

        if (false == divisions.includes(farms)) {
            ns.corporation.expandIndustry("Agriculture", farms);

            Object.values(ns.enums.CityName).forEach((city) => {
                ns.corporation.expandCity(farms, city);
                ns.corporation.purchaseWarehouse(farms, city);

                ns.corporation.hireEmployee(farms, city, "Operations");
                ns.corporation.hireEmployee(farms, city, "Engineer");
                ns.corporation.hireEmployee(farms, city, "Business");

                ns.corporation.hireAdVert(farms);
                ns.corporation.sellMaterial(farms, city, "Food", "MAX", "MP");
                ns.corporation.sellMaterial(farms, city, "Plants", "MAX", "MP");

                if (tryUnlock(config, "Smart Supply")) {
                    ns.corporation.setSmartSupply(farms, city, true);
                }

                ns.corporation.upgradeWarehouse(farms, city, 2);
            });
        }

        for (const division of divisions.map((dvs) => ns.corporation.getDivision(dvs))) {
            for (const office of division.cities.map((city) =>
                ns.corporation.getOffice(division.name, city),
            )) {
                if (division.name == farms) {
                    [
                        "FocusWires",
                        "Neural Accelerators",
                        "Speech Processor Implants",
                        "Nuoptimal Nootropic Injector Implants",
                        "Smart Factories",
                    ].forEach((upgrade) => {
                        if (ns.corporation.getUpgradeLevel(upgrade) < 2) {
                            ns.corporation.levelUpgrade(upgrade);
                        }
                    });

                    if (office.size < 9) {
                        ns.corporation.upgradeOfficeSize(farms, office.city, 3);
                        ns.corporation.hireEmployee(
                            farms,
                            office.city,
                            office.size == 3
                                ? "Intern"
                                : office.size == 4
                                ? "Management"
                                : "Research & Development",
                        );
                    }

                    ["Smart Factories", "Smart Storage"].forEach((upgrade) => {
                        if (ns.corporation.getUpgradeLevel(upgrade) < 10) {
                            ns.corporation.levelUpgrade(upgrade);
                        }
                    });
                }

                const perEmployee = 500_000;

                if (office.avgEnergy < 95 && canSpend(config, office.numEmployees * perEmployee)) {
                    const success = ns.corporation.buyTea(division.name, office.city);

                    if (success) {
                        log.msg(
                            ns,
                            Color.Magenta,
                            "%s/%s <-- tea for %d -$%s",
                            division.name,
                            office.city,
                            office.numEmployees,
                            ns.formatNumber(office.numEmployees * perEmployee),
                        );
                    }
                }

                if (office.avgMorale < 95 && canSpend(config, office.numEmployees * perEmployee)) {
                    const success = ns.corporation.throwParty(
                        division.name,
                        office.city,
                        perEmployee,
                    );

                    if (success) {
                        log.msg(
                            ns,
                            Color.Magenta,
                            "%s/%s <-- party for %d -$%s",
                            division.name,
                            office.city,
                            office.numEmployees,
                            ns.formatNumber(office.numEmployees * perEmployee),
                        );
                    }
                }

                if (config.corporation.upgradeWarehouse && tryUnlock(config, "Warehouse API")) {
                    const warehouse: Warehouse = ns.corporation.getWarehouse(
                        division.name,
                        office.city,
                    );

                    if (warehouse.sizeUsed / warehouse.size > 0.9) {
                        const cost = ns.corporation.getUpgradeWarehouseCost(
                            division.name,
                            office.city,
                        );

                        if (canSpend(config, cost)) {
                            if (
                                warehouseUpgrade.filter(
                                    (upgrade) => upgrade == `${division.name} ${office.city}`,
                                ).length == 2
                            ) {
                                warehouseUpgrade = warehouseUpgrade.filter(
                                    (upgrade) => upgrade != `${division.name} ${office.city}`,
                                );

                                ns.corporation.upgradeWarehouse(division.name, office.city);

                                const diff =
                                    ns.corporation.getWarehouse(division.name, office.city).size -
                                    warehouse.size;

                                log.msg(
                                    ns,
                                    Color.Cyan,
                                    "%s/%s upgrade warehouse --> +%s %s, -$%s",
                                    division.name,
                                    office.city,
                                    `${((100 * diff) / warehouse.size).toFixed(2)}%`,
                                    ns.formatNumber(diff),
                                    ns.formatNumber(cost),
                                );
                            } else {
                                warehouseUpgrade.push(`${division.name} ${office.city}`);
                            }
                        }
                    }
                }
            }
        }

        await helper.wait(ns, config.corporation.intervalMs);
    }
}
