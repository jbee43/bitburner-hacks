import { NS } from "@ns";
import helper from "@/helper";
import log, { Color, Type } from "@/log";
import Config from "@/interfaces/Config";

interface Task {
    chance: number[];
    countRemaining: number;
    name: string;
    type: string;
}

export async function main(ns: NS): Promise<void> {
    helper.init(ns);
    const bb = ns.bladeburner;

    const ensureAction = (type: string, name: string): number => {
        const curr = bb.getCurrentAction();

        if (true != (curr.type == type && curr.name == name)) {
            const time = bb.getActionTime(type, name);
            const started = bb.startAction(type, name);

            log.msg(
                ns,
                started ? Color.Magenta : Type.Error,
                "%s: %s --> %s",
                type,
                name,
                started ? helper.duration(time) : "",
            );

            return started ? time : 0;
        }

        return 0;
    };

    const tryIt = (chance: number[]): boolean => {
        return chance[0] > 0.55 && chance[1] > 0.75;
    };

    let wait = 0;

    /**
     * LOOP
     */
    while (true) {
        if (wait > 0) {
            await ns.sleep(wait);
            wait = 0;
            continue;
        }

        await bb.nextUpdate();

        const config: Config = helper.config(ns);

        const [currStamina, maxStamina] = bb.getStamina();

        const skillsMax = [
            {
                name: "Cloak",
                max: 25,
            },
            {
                name: "Hyperdrive",
                max: 20,
            },
            {
                name: "Short Circuit",
                max: 25,
            },
            {
                name: "Tracer",
                max: 25,
            },
        ];

        for (const skill of bb
            .getSkillNames()
            .filter(
                (skillName) =>
                    skillName != "Cybers Edge" &&
                    skillName != "Datamancer" &&
                    skillName != "Hands of Midas",
            )
            .map((skillName) => ({
                level: bb.getSkillLevel(skillName),
                name: skillName,
            }))
            .filter((skill) => {
                const skillMax = skillsMax.find((sm) => sm.name == skill.name);

                return (
                    (undefined == skillMax || skill.level < skillMax.max) &&
                    (skill.name != "Overclock" ||
                        bb.getActionEstimatedSuccessChance("Operation", "Assassination")[1] >= 0.9)
                );
            })
            .sort((a, b) => a.level - b.level)) {
            const count = 1;
            const cost = bb.getSkillUpgradeCost(skill.name, count);

            if (cost <= bb.getSkillPoints()) {
                const upgraded = bb.upgradeSkill(skill.name, count);

                log.msg(
                    ns,
                    upgraded ? Color.BrightCyan : Type.Error,
                    "%d --> %d %s -%s SP",
                    skill.level,
                    upgraded ? skill.level + count : 0,
                    skill.name,
                    upgraded ? ns.formatNumber(cost) : 0,
                );
            }
        }

        let currCity = bb.getCity();
        const bestCity = Object.values(ns.enums.CityName).sort(
            (a, b) => bb.getCityEstimatedPopulation(b) - bb.getCityEstimatedPopulation(a),
        )[0];

        if (currCity != bestCity) {
            const switched = bb.switchCity(bestCity);
            log.msg(
                ns,
                switched ? Color.BrightWhite : Type.Error,
                "%s --> %s travel",
                currCity,
                bestCity,
            );
            if (switched) {
                currCity = bestCity;
            }
        }

        if (
            true != ns.singularity.getOwnedAugmentations(false).includes("The Blade's Simulacrum")
        ) {
            continue;
        }

        const player = ns.getPlayer();

        if (player.hp.current / player.hp.max < 0.4) {
            ns.singularity.hospitalize();
        }

        if (currStamina / maxStamina < 0.51) {
            wait = ensureAction("General", "Hyperbolic Regeneration Chamber");
            continue;
        }

        if (bb.getCityChaos(currCity) > 49) {
            wait = ensureAction("General", "Diplomacy");
            continue;
        }

        const nextBlackOp = bb.getNextBlackOp();

        if (
            !!nextBlackOp &&
            nextBlackOp.rank <= bb.getRank() &&
            tryIt(bb.getActionEstimatedSuccessChance("BlackOp", nextBlackOp.name))
        ) {
            wait = ensureAction("BlackOp", nextBlackOp.name);
            continue;
        }

        if (null == nextBlackOp && config.singularity.killWorldDaemon) {
            ns.singularity.destroyW0r1dD43m0n(config.singularity.nextBitnode, "init.js");
        }

        if (config.bladeburner.inciteViolence) {
            wait = ensureAction("General", "Incite Violence");
            continue;
        }

        const tasks: Task[] = bb
            .getOperationNames()
            .filter((operation) => operation != "Raid") // high pop. hit
            .map((operation) => ({ name: operation, type: "Operation" }))
            .concat(
                bb.getContractNames().map((contract) => ({
                    name: contract,
                    type: "Contract",
                })),
            )
            .map((action) => ({
                chance: bb.getActionEstimatedSuccessChance(action.type, action.name),
                countRemaining: bb.getActionCountRemaining(action.type, action.name),
                name: action.name,
                rankRate:
                    bb.getActionRepGain(
                        action.type,
                        action.name,
                        bb.getActionCurrentLevel(action.type, action.name),
                    ) / bb.getActionTime(action.type, action.name),
                type: action.type,
            }))
            .filter((action) => tryIt(action.chance) && action.countRemaining > 0)
            .sort((a, b) => b.rankRate - a.rankRate);

        if (tasks.length) {
            wait = ensureAction(tasks[0].type, tasks[0].name);
            continue;
        }

        wait = ensureAction(
            "General",
            player.skills.agility < 100 ||
                player.skills.defense < 100 ||
                player.skills.dexterity < 100 ||
                player.skills.strength < 100
                ? "Training"
                : "Field Analysis",
        );
    }
}
