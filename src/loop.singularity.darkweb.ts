import { NS, Singularity } from "@ns";
import helper from "@/helper";
import {
    PROGRAM_BRUTESSH,
    PROGRAM_FTPCRACK,
    PROGRAM_HTTPWORM,
    PROGRAM_NUKE,
    PROGRAM_RELAYSMTP,
    PROGRAM_SQLINJECT,
} from "@/constant";
import log from "@/log";

const importantPrograms = [
    PROGRAM_SQLINJECT,
    PROGRAM_HTTPWORM,
    PROGRAM_RELAYSMTP,
    PROGRAM_FTPCRACK,
    PROGRAM_BRUTESSH,
    PROGRAM_NUKE,
];

interface Program {
    cost: number;
    name: string;
}

export async function main(ns: NS): Promise<void> {
    helper.init(ns);
    const sg: Singularity = ns.singularity;

    while (true != sg.purchaseTor()) {
        await ns.sleep(1_000);
    }

    const programsToBuy = (): Program[] =>
        sg
            .getDarkwebPrograms()
            .filter((name) => true != ns.fileExists(name))
            .map((name) => ({
                cost: sg.getDarkwebProgramCost(name),
                name: name,
            }))
            .sort((a, b) => a.cost - b.cost)
            .sort((a, _) => (importantPrograms.includes(a.name) ? -1 : 1));

    const tryBuy = (program: Program) => {
        const purchased = ns.singularity.purchaseProgram(program.name);

        if (purchased) {
            log.info(ns, "%s purchase --> -$%s", program.name, ns.formatNumber(program.cost));
        }
    };

    let programsLeft: Program[];

    /**
     * MAIN LOOP
     */
    while ((programsLeft = programsToBuy()).length) {
        if (true != helper.config(ns).walletFreeze) {
            programsLeft.forEach((program) => tryBuy(program));
        }
        await ns.sleep(1_000);
    }

    const programs = ns.singularity.getDarkwebPrograms();

    log.success(ns, "all %d programs <-- owned", programs.length);

    log.debug(ns, "%s", programs.sort().join(", "));
}
