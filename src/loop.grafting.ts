import { NS } from "@ns";
import Config from "@/interfaces/Config";
import helper from "@/helper";
import log, { Type } from "@/log";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const canSpend = (config: Config, cost: number): boolean =>
        helper.canSpend(
            config,
            cost,
            ns.getServerMoneyAvailable("home"),
            config.grafting.walletMax,
            config.grafting.walletPercent,
        );

    /**
     * LOOP
     */
    while (true) {
        const config = helper.config(ns);

        if (true != ns.singularity.isBusy()) {
            for (const aug of ns.grafting
                .getGraftableAugmentations()
                .sort(
                    (a, b) =>
                        ns.grafting.getAugmentationGraftTime(a) -
                        ns.grafting.getAugmentationGraftTime(b),
                )) {
                const price = ns.grafting.getAugmentationGraftPrice(aug);

                if (canSpend(config, price)) {
                    const stats = ns.singularity.getAugmentationStats(aug);

                    if (
                        (config.grafting.charisma && (stats.charisma || stats.charisma_exp)) ||
                        (config.grafting.combat &&
                            (stats.agility ||
                                stats.agility_exp ||
                                stats.defense ||
                                stats.defense_exp ||
                                stats.dexterity ||
                                stats.dexterity_exp ||
                                stats.strength ||
                                stats.strength_exp)) ||
                        (config.grafting.companyRep && stats.company_rep) ||
                        (config.grafting.crime && (stats.crime_money || stats.crime_success)) ||
                        (config.grafting.factionRep && stats.faction_rep) ||
                        (config.grafting.hack &&
                            (stats.hacking ||
                                stats.hacking_chance ||
                                stats.hacking_exp ||
                                stats.hacking_grow ||
                                stats.hacking_money ||
                                stats.hacking_speed)) ||
                        (config.grafting.hacknet &&
                            (stats.hacknet_node_core_cost ||
                                stats.hacknet_node_level_cost ||
                                stats.hacknet_node_money ||
                                stats.hacknet_node_purchase_cost ||
                                stats.hacknet_node_ram_cost))
                    ) {
                        if (config.singularity.getBusy) {
                            log.warn(ns, "Can't graft %s: getBusy is ON", aug);
                            continue;
                        }

                        const grafting =
                            ns.singularity.travelToCity(ns.enums.CityName.NewTokyo) &&
                            ns.grafting.graftAugmentation(aug, false);

                        log.msg(
                            ns,
                            grafting ? Type.Success : Type.Error,
                            "%s <-- -$%s",
                            aug,
                            ns.formatNumber(price),
                        );
                    }
                }
            }
        }

        await helper.wait(ns, config.grafting.intervalMs);
    }
}
