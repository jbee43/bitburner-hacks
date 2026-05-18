import { NS, GangGenInfo, GangMemberAscension, GangMemberInfo } from "@ns";
import helper from "@/helper";
import log, { Color, Type } from "@/log";
import Config from "@/interfaces/Config";

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const createMemberName = async (config: Config, retry = 0): Promise<string> => {
        try {
            const file = "temp.txt";
            const nationalities = [
                "AU",
                "BR",
                "CA",
                "CH",
                "DE",
                "DK",
                "ES",
                "FI",
                "FR",
                "GB",
                "IE",
                "IN",
                "IR",
                "MX",
                "NL",
                "NO",
                "NZ",
                "RS",
                "TR",
                "UA",
                "US",
            ];
            let nationality: string | undefined = nationalities.find(
                (nat) => nat == config.gang.nationality.toUpperCase(),
            );
            if (nationality == undefined) {
                nationality = ns.gang.getGangInformation().isHacking ? "ES" : "BR";
                log.warn(
                    ns,
                    "Must be one of %s <-- using default nationality %s",
                    nationalities.join(", "),
                    nationality,
                );
            }
            const url = `https://randomuser.me/api?inc=name&nat=${nationality}`;
            if (false == (await ns.wget(url, file))) {
                throw `GET ${url} failed`;
            }

            const json = JSON.parse(ns.read(file));
            ns.rm(file);
            const name = `${json.results[0].name.first} ${json.results[0].name.last}`;
            return name;
        } catch (error) {
            if (retry++ < 3) {
                await ns.sleep(2_000 * retry);
                return await createMemberName(config, retry);
            }

            log.warn(ns, "%s", typeof error == "string" ? error : JSON.stringify(error, null, 2));

            return `G${helper.randStr({
                avoidConsecutives: true,
                digits: true,
                length: 5,
                lowercase: false,
                symbols: false,
                uppercase: false,
            })}`;
        }
    };

    const canSpend = (config: Config, cost: number): boolean =>
        helper.canSpend(
            config,
            cost,
            ns.getServerMoneyAvailable("home"),
            config.gang.walletMax,
            config.gang.walletPercent,
        );

    const recruit = async (config: Config, gangInfo: GangGenInfo): Promise<void> => {
        if (true != ns.gang.canRecruitMember() || false == config.gang.recruit) {
            return;
        }

        const newMemberName: string = await createMemberName(config);
        const recruited: boolean = ns.gang.recruitMember(newMemberName);

        if (recruited) {
            ns.gang.setMemberTask(
                newMemberName,
                `Train ${gangInfo.isHacking ? "Hacking" : "Combat"}`,
            );
        }

        log.msg(
            ns,
            recruited ? Color.Magenta : Type.Error,
            "%s <-- %s",
            newMemberName,
            recruited ? "recruited" : "recruit failed",
        );
    };

    const ascend = async (config: Config, gangInfo: GangGenInfo) => {
        if (false == config.gang.ascend) {
            return;
        }

        for (const memberName of ns.gang.getMemberNames()) {
            const memberInfo: GangMemberInfo = ns.gang.getMemberInformation(memberName);

            let ascensionInfo: GangMemberAscension | undefined =
                ns.gang.getAscensionResult(memberName);

            if (ascensionInfo) {
                if (
                    (gangInfo.isHacking ? ascensionInfo.hack : ascensionInfo.str) >=
                    Math.max(
                        1.6 +
                            (1 -
                                (gangInfo.isHacking
                                    ? memberInfo.hack_asc_mult
                                    : memberInfo.str_asc_mult)) /
                                58,
                        1.1,
                    )
                ) {
                    ascensionInfo = ns.gang.ascendMember(memberName);
                    log.msg(
                        ns,
                        ascensionInfo ? Color.Magenta : Type.Error,
                        "%s <-- ascended",
                        memberName,
                    );
                }
            }
        }
    };

    const upgrade = async (config: Config, gangInfo: GangGenInfo) => {
        const names = ns.gang.getMemberNames();
        const equipmentList = gangInfo.isHacking ? getHackingEquipment(ns) : getCombatEquipment(ns);

        for (const memberName of names) {
            const memberInfo: GangMemberInfo = ns.gang.getMemberInformation(memberName);

            for (const equipment of equipmentList.filter(
                (eqp) =>
                    false == memberInfo.augmentations.includes(eqp) &&
                    false == memberInfo.upgrades.includes(eqp),
            )) {
                const cost: number = ns.gang.getEquipmentCost(equipment);

                if (canSpend(config, cost)) {
                    const purchased: boolean = ns.gang.purchaseEquipment(memberName, equipment);

                    log.msg(
                        ns,
                        purchased ? Color.Cyan : Type.Error,
                        "%s <-- %s -$%s",
                        memberName,
                        equipment,
                        purchased ? ns.formatNumber(cost) : 0,
                    );
                }
            }
        }
    };

    const assign = async (config: Config) => {
        const membersNames = ns.gang.getMemberNames();
        const gangInfo = ns.gang.getGangInformation();
        let warfareCounter = 0;

        for (const memberName of membersNames) {
            const memberInfo: GangMemberInfo = ns.gang.getMemberInformation(memberName);

            if (memberInfo.str < 500) {
                ns.gang.setMemberTask(
                    memberName,
                    gangInfo.isHacking ? "Train Hacking" : "Train Combat",
                );
            } else if (gangInfo.wantedPenalty < 0.5) {
                ns.gang.setMemberTask(
                    memberName,
                    gangInfo.isHacking ? "Ethical Hacking" : "Vigilante Justice",
                );
            } else if (membersNames.length < 12) {
                ns.gang.setMemberTask(
                    memberName,
                    gangInfo.isHacking ? "Cyberterrorism" : "Terrorism",
                );
            } else if (
                config.gang.clash &&
                clashChance(ns).some((s) => s < 0.8) &&
                gangInfo.territory < 1 &&
                warfareCounter < 6
            ) {
                ns.gang.setMemberTask(memberName, "Territory Warfare");
                warfareCounter++;
            } else {
                ns.gang.setMemberTask(
                    memberName,
                    gangInfo.isHacking ? "Money Laundering" : "Human Trafficking",
                );
            }
        }
    };

    let config: Config;

    /**
     * LOOP
     */
    while (
        (config = helper.config(ns)).gang.holdTerritory ||
        ns.gang.getGangInformation().territory < 1
    ) {
        const gangInfo = ns.gang.getGangInformation();
        await recruit(config, gangInfo);
        await ascend(config, gangInfo);
        await upgrade(config, gangInfo);
        await assign(config);

        ns.gang.setTerritoryWarfare(config.gang.clash ? territoryWarfare(ns) : false);

        await helper.wait(ns, config.gang.intervalMs);
    }

    log.success(ns, "%s territory <-- done", "100%");
}

function clashChance(ns: NS) {
    return Array.from(getOtherGangs(ns), ([faction]) => ns.gang.getChanceToWinClash(faction));
}

function fightForTerritory(ns: NS) {
    let averageWinChance = 0;
    for (const [faction, info] of getOtherGangs(ns))
        averageWinChance += info.territory * ns.gang.getChanceToWinClash(faction);
    return averageWinChance / (1 - ns.gang.getGangInformation().territory) >= 0.7;
}

function getCombatEquipment(ns: NS): string[] {
    const allEquipment = ns.gang.getEquipmentNames();
    const strAndDefEquipment = allEquipment
        .filter(
            (equipment) =>
                ns.gang.getEquipmentStats(equipment).str ||
                ns.gang.getEquipmentStats(equipment).def,
        )
        .sort((a, b) => ns.gang.getEquipmentCost(b) - ns.gang.getEquipmentCost(a));
    const dexAndAgiEquipment = allEquipment
        .filter(
            (equipment) =>
                ns.gang.getEquipmentStats(equipment).dex ||
                ns.gang.getEquipmentStats(equipment).agi,
        )
        .sort((a, b) => ns.gang.getEquipmentCost(b) - ns.gang.getEquipmentCost(a));
    const chaAndHackEquipment = allEquipment
        .filter(
            (equipment) =>
                ns.gang.getEquipmentStats(equipment).cha ||
                ns.gang.getEquipmentStats(equipment).hack,
        )
        .sort((a, b) => ns.gang.getEquipmentCost(b) - ns.gang.getEquipmentCost(a));
    return [...new Set([...strAndDefEquipment, ...dexAndAgiEquipment, ...chaAndHackEquipment])];
}

function getHackingEquipment(ns: NS): string[] {
    const allEquipment = ns.gang.getEquipmentNames();
    const hackEquipment = allEquipment
        .filter((equipment) => ns.gang.getEquipmentStats(equipment).hack)
        .sort((a, b) => ns.gang.getEquipmentCost(b) - ns.gang.getEquipmentCost(a));
    const chaEquipment = allEquipment
        .filter((equipment) => ns.gang.getEquipmentStats(equipment).cha)
        .sort((a, b) => ns.gang.getEquipmentCost(b) - ns.gang.getEquipmentCost(a));
    return [...new Set([...hackEquipment, ...chaEquipment])];
}

function getGangName(ns: NS) {
    return ns.gang.getGangInformation().faction;
}

function getOtherGangs(ns: NS) {
    return Object.entries(ns.gang.getOtherGangInformation()).filter(
        ([faction]) => faction !== getGangName(ns),
    );
}

function territoryWarfare(ns: NS) {
    return ns.gang.getGangInformation().territory < 1 - 1e-10 && fightForTerritory(ns);
}
