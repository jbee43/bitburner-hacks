import { NS } from "@ns";
import helper from "@/helper";
import log, { Color } from "@/log";
import Config from "@/interfaces/Config";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const canSpend = (config: Config, cost: number): boolean =>
        helper.canSpend(
            config,
            cost,
            ns.getServerMoneyAvailable("home"),
            config.sleeves.walletMax,
            config.sleeves.walletPercent,
        );

    /**
     * LOOP
     */
    while (true) {
        const config: Config = helper.config(ns);

        for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
            const sleeve = ns.sleeve.getSleeve(i);

            if (config.sleeves.assign) {
                if (sleeve.shock > config.sleeves.shockMax) {
                    ns.sleeve.setToShockRecovery(i);
                } else if (sleeve.sync < config.sleeves.syncMin) {
                    ns.sleeve.setToSynchronize(i);
                } else if (config.gang.init && true != ns.gang.inGang()) {
                    if (sleeve.skills.strength < 25) {
                        ns.sleeve.setToGymWorkout(
                            i,
                            ns.enums.LocationName.Sector12PowerhouseGym,
                            "str",
                        );
                    } else if (sleeve.skills.defense < 25) {
                        ns.sleeve.setToGymWorkout(
                            i,
                            ns.enums.LocationName.Sector12PowerhouseGym,
                            "def",
                        );
                    } else if (sleeve.skills.dexterity < 7) {
                        ns.sleeve.setToGymWorkout(
                            i,
                            ns.enums.LocationName.Sector12PowerhouseGym,
                            "dex",
                        );
                    } else if (sleeve.skills.agility < 7) {
                        ns.sleeve.setToGymWorkout(
                            i,
                            ns.enums.LocationName.Sector12PowerhouseGym,
                            "agi",
                        );
                    } else {
                        ns.sleeve.setToCommitCrime(i, "Homicide");
                    }
                } else {
                    let working = false;

                    const company = helper
                        .companiesLeft(ns, ns.getPlayer())
                        .find((comp) =>
                            [...Array(ns.sleeve.getNumSleeves()).keys()].every(
                                (idx) =>
                                    (ns.sleeve.getTask(idx) as Record<string, any>)?.companyName !=
                                    comp,
                            ),
                        );

                    if (company) {
                        ns.sleeve.setToCompanyWork(i, company);
                        working = true;
                    }

                    if (true != working) {
                        ns.sleeve.setToUniversityCourse(
                            i,
                            ns.enums.LocationName.Sector12RothmanUniversity,
                            ns.enums.UniversityClassType.algorithms,
                        );
                    }
                }
            }

            if (config.sleeves.augment && sleeve.shock == 0) {
                ns.sleeve
                    .getSleevePurchasableAugs(i)
                    .map((aug) => ({
                        ...aug,
                        stats: ns.singularity.getAugmentationStats(aug.name),
                    }))
                    .filter((aug) => {
                        return (
                            canSpend(config, aug.cost) &&
                            (aug.stats.agility ||
                                aug.stats.agility_exp ||
                                aug.stats.crime_money ||
                                aug.stats.crime_success ||
                                aug.stats.defense ||
                                aug.stats.defense_exp ||
                                aug.stats.dexterity ||
                                aug.stats.dexterity_exp ||
                                aug.stats.strength ||
                                aug.stats.strength_exp ||
                                true != config.gang.init ||
                                ns.gang.inGang() ||
                                aug.stats.hacking ||
                                aug.stats.hacking_chance ||
                                aug.stats.hacking_exp ||
                                aug.stats.hacking_grow ||
                                aug.stats.hacking_money ||
                                aug.stats.hacking_speed)
                        );
                    })
                    .sort((a, b) => b.cost - a.cost)
                    .forEach((aug) => {
                        if (ns.sleeve.purchaseSleeveAug(i, aug.name)) {
                            log.msg(
                                ns,
                                Color.Cyan,
                                "%d <-- %s -$%s",
                                i,
                                aug.name,
                                ns.formatNumber(aug.cost),
                            );
                        }
                    });
            }
        }

        await helper.wait(ns, config.sleeves.intervalMs);
    }
}
