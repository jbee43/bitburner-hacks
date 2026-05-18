import { NS, CompanyName, CompanyPositionInfo, Player } from "@ns";
import { HOME_HOSTNAME } from "@/constant";
import Config from "@/interfaces/Config";
import helper from "@/helper";
import log, { Color } from "@/log";

interface JobOffer extends CompanyPositionInfo {
    company: CompanyName;
}

const jobOffers = (ns: NS, player: Player): JobOffer[] => {
    return helper
        .companiesLeft(ns, player)
        .filter(
            (company) =>
                company != "Fulcrum Technologies" ||
                ns.singularity.getCompanyRep("Fulcrum Technologies") < 400_000,
        )
        .flatMap((company) =>
            ns.singularity
                .getCompanyPositions(company)
                .map((position) => {
                    const info = ns.singularity.getCompanyPositionInfo(company, position);

                    return { ...info, company: company };
                })
                .filter(
                    (position) =>
                        position.requiredReputation <= ns.singularity.getCompanyRep(company) &&
                        position.requiredSkills.agility <= player.skills.agility &&
                        position.requiredSkills.charisma <= player.skills.charisma &&
                        position.requiredSkills.defense <= player.skills.defense &&
                        position.requiredSkills.dexterity <= player.skills.dexterity &&
                        position.requiredSkills.hacking <= player.skills.hacking &&
                        position.requiredSkills.intelligence <= player.skills.intelligence &&
                        position.requiredSkills.strength <= player.skills.strength,
                )
                .sort((a, b) => b.requiredReputation - a.requiredReputation),
        );
};

const trainLowestCombatStat = (
    ns: NS,
    player: Player,
    focus: boolean,
    threshold = 100,
): boolean => {
    const stats: { name: string; value: number }[] = [
        { name: "agi", value: player.skills.agility },
        { name: "def", value: player.skills.defense },
        { name: "dex", value: player.skills.dexterity },
        { name: "str", value: player.skills.strength },
    ];
    const lowest = stats.sort((a, b) => a.value - b.value)[0];
    if (lowest.value >= threshold) return false;
    return ns.singularity.gymWorkout(
        ns.enums.LocationName.Sector12PowerhouseGym,
        lowest.name,
        focus,
    );
};

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const tryUpgradeHome = (config: Config): void => {
        if (config.singularity.upgradeHomeCores && ns.singularity.upgradeHomeCores()) {
            log.msg(ns, Color.BrightCyan, "%s <-- CPU upgraded", HOME_HOSTNAME);
        }

        if (config.singularity.upgradeHomeRam && ns.singularity.upgradeHomeRam()) {
            log.msg(ns, Color.BrightCyan, "%s <-- RAM upgraded", HOME_HOSTNAME);
        }
    };

    /**
     * LOOP
     */
    while (true) {
        const config: Config = helper.config(ns);
        getBusy(ns, config);
        tryUpgradeHome(config);

        ns.singularity
            .checkFactionInvitations()
            .filter((faction) => Object.values(ns.enums.CityName).every((city) => city != faction))
            .forEach((faction) => {
                if (ns.singularity.joinFaction(faction)) {
                    log.msg(ns, Color.Magenta, "%s <-- join faction from invite", faction);
                }
            });

        await helper.wait(ns, config.singularity.intervalMs);
    }
}

function getBusy(ns: NS, config: Config): void {
    if (config.singularity.getBusy) {
        const player = ns.getPlayer();
        const offers = jobOffers(ns, player);

        const study = () => {
            ns.singularity.universityCourse(
                ns.enums.LocationName.Sector12RothmanUniversity,
                ns.enums.UniversityClassType.algorithms,
                config.singularity.focus,
            );
        };

        if (config.singularity.combat && player.skills.hacking > 99) {
            if (trainLowestCombatStat(ns, player, config.singularity.focus)) {
                return;
            }
        } else if (player.skills.hacking < 100) {
            study();
            return;
        }

        if (
            false != config.bladeburner.init &&
            false == ns.bladeburner.inBladeburner() &&
            player.skills.hacking > 99
        ) {
            if (trainLowestCombatStat(ns, player, config.singularity.focus)) {
                return;
            }
        }

        if (false != config.gang.init && false == ns.gang.inGang() && player.skills.hacking > 99) {
            if (config.gang.faction == "Slum Snakes") {
                if (trainLowestCombatStat(ns, player, config.singularity.focus)) {
                    return;
                }

                ns.singularity.commitCrime(ns.enums.CrimeType.homicide, config.singularity.focus);
                return;
            }
        }

        const currentWork = ns.singularity.getCurrentWork() as Record<string, any> | null;
        const currentCompany = currentWork?.companyName as CompanyName | undefined;

        let currentJob: JobOffer | undefined;

        if (currentCompany) {
            currentJob = offers.find(
                (ofr) => ofr.company == currentCompany && ofr.name == player.jobs[currentCompany],
            );
        }

        if (
            offers.length &&
            (currentJob == undefined ||
                currentJob.requiredReputation < offers[0].requiredReputation ||
                helper.inFaction(ns, currentJob.company, player)) &&
            ns.singularity.applyToCompany(offers[0].company, offers[0].field) &&
            ns.singularity.workForCompany(offers[0].company, config.singularity.focus)
        ) {
            log.msg(ns, Color.BrightMagenta, "%s/%s <-- work", offers[0].company, offers[0].name);
        }

        if (offers.length < 1) {
            if (config.singularity.combat && player.skills.hacking > 99) {
                trainLowestCombatStat(ns, player, config.singularity.focus);
                return;
            }
            study();
        }
    }
}
