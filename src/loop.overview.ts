import { NS, CorporationInfo, Division, GangGenInfo } from "@ns";
import { CONTRACTS_STATS_FILENAME } from "@/constant";
import Config from "@/interfaces/Config";
import helper from "@/helper";
import log from "@/log";

const places = {
    Aevum: "🌎",
    Chongqing: "🌍",
    "Sector-12": "🌎",
    "New Tokyo": "🌏",
    Ishima: "🌏",
    Volhaven: "🌍",
};

const progressBar = (percent: number, width = 8): string => {
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.round((clamped / 100) * width);
    return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
};

export async function main(ns: NS): Promise<void> {
    helper.init(ns);

    const duck = eval("document") as Document;

    const headersHook = duck?.getElementById("overview-extra-hook-0");
    const valuesHook = duck?.getElementById("overview-extra-hook-1");

    if (!headersHook || !valuesHook) {
        log.error(ns, "Didn't find overview extra hooks ?!");
        return;
    }

    let jaquim = 1; // bladeburner spinner: cycles 1-4
    const bladeburner = (config: Config, headers: string[], values: string[]): void => {
        const bb = ns.bladeburner;
        if (config.overview.bladeburner && bb.inBladeburner()) {
            const city = bb.getCity();
            const cityChaos = bb.getCityChaos(city);
            const cityCommunities = bb.getCityCommunities(city);
            const cityEstimatedPopulation = bb.getCityEstimatedPopulation(city);
            const rank = bb.getRank();
            const skillPoints = bb.getSkillPoints();
            const [currStamina, maxStamina] = bb.getStamina();

            headers.push("BLADEBURNER");
            const action = bb.getCurrentAction();
            values.push(
                `${
                    action.type == "BlackOp"
                        ? jaquim % 2 == 0
                            ? "⚔️"
                            : ""
                        : jaquim == 4
                        ? "."
                        : jaquim % 2 == 0
                        ? "/"
                        : "\\"
                } ${action.type.toLowerCase()}`,
            );

            jaquim = jaquim == 4 ? 1 : jaquim + 1;

            headers.push(" City");
            values.push(`${places[city]} ${city}`);

            headers.push("  Chaos");
            values.push(
                `${cityChaos > 50 && josefina ? "🚩" : "  "} ${ns.formatNumber(cityChaos)} ${
                    cityChaos > 50 && true != josefina ? "💥" : "💣"
                }`,
            );

            headers.push("  Communities");
            values.push(
                `${ns.formatNumber(cityCommunities)} ${
                    cityCommunities > 1 ? "🏤" : cityCommunities > 10 ? "🏨" : ""
                }`,
            );

            headers.push("  Est. Popul.");
            values.push(
                `${
                    cityEstimatedPopulation < 1_000_000_000 && josefina ? "🚩" : "  "
                } ${ns.formatNumber(cityEstimatedPopulation)} 👯`,
            );

            headers.push(" Rank");
            values.push(`${ns.formatNumber(rank)} 🏅`);

            headers.push(" Skill Points");
            values.push(`${ns.formatNumber(skillPoints)} 📓`);

            headers.push(" Stamina");
            const staminaPercent = (100 * currStamina) / maxStamina;
            values.push(
                `${staminaPercent < 50 && josefina ? "🚩" : "  "} ${
                    jaquim == 4
                        ? staminaPercent > 99
                            ? "👌"
                            : staminaPercent > 50
                            ? "🤙"
                            : "✋"
                        : "🏃"
                } ${progressBar(staminaPercent)}`,
            );

            headers.push("  Current");
            values.push(`${ns.formatNumber(currStamina)} 💨`);

            headers.push("  Maximum");
            values.push(`${ns.formatNumber(maxStamina)} 💯`);
        }
    };

    let josefina = true; // alternating toggle for alert icons and corp animation
    const corp = (config: Config, headers: string[], values: string[]): void => {
        josefina = false == josefina;
        if (config.overview.corporation && ns.corporation.hasCorporation()) {
            const corp: CorporationInfo = ns.corporation.getCorporation();

            headers.push(corp.name.toUpperCase());
            values.push(
                `${josefina ? "—" : "-"}${corp.nextState.toLowerCase()}${josefina ? "-" : "—"}`,
            );

            if (corp.dividendEarnings) {
                headers.push(" Earnings");
                values.push(`$${ns.formatNumber(corp.dividendEarnings)}/s 💵`);
            }

            headers.push(" Profit");
            const profit = corp.revenue - corp.expenses;
            values.push(`${ns.formatNumber(profit)}/s 💸`);

            if (corp.divisions.length > 1) {
                const icons: { [type: string]: string } = {
                    "Spring Water": "💧",
                    "Water Utilities": "💦",
                    Agriculture: "🌱",
                    Fishing: "🐟",
                    Mining: "⛏️",
                    Refinery: "🏭",
                    Restaurant: "🍣",
                    Tobacco: "🚬",
                    Chemical: "🧪",
                    Pharmaceutical: "💊",
                    "Computer Hardware": "💽",
                    Robotics: "🤖",
                    Software: "💿",
                    Healthcare: "💉",
                    "Real Estate": "🏢",
                };

                for (const divisionName of corp.divisions) {
                    const division: Division = ns.corporation.getDivision(divisionName);

                    const value =
                        (100 * (division.thisCycleRevenue - division.thisCycleExpenses)) / profit;

                    headers.push(`  ${divisionName}`);
                    values.push(`${value.toFixed(2)}% ${icons[divisionName]}`);
                }
            }

            headers.push(" Funds");
            values.push(`$${ns.formatNumber(corp.funds)} 💵`);

            headers.push(" Shares");
            values.push(`${ns.formatNumber(corp.numShares)} 🧮`);

            headers.push("  Owned");
            values.push(`${((100 * corp.numShares) / corp.totalShares).toFixed(2)}% 🧲`);

            headers.push("  Price");
            values.push(`$${ns.formatNumber(corp.sharePrice)} 📊`);
        }
    };

    let manel = 1; // gang section pulse animation toggle
    const gang = (config: Config, headers: string[], values: string[]): void => {
        if (config.overview.gang && ns.gang.inGang()) {
            const gangInfo: GangGenInfo = ns.gang.getGangInformation();

            headers.push(gangInfo.faction.toUpperCase());

            const count = ns.gang.getMemberNames().length;
            const max = 12;

            values.push(
                count < max
                    ? `${count}/${max} 👥`
                    : gangInfo.territoryWarfareEngaged
                    ? manel % 2 == 0
                        ? "▬▬ι════ﺤ"
                        : "▬▬ι════"
                    : gangInfo.territory == 1
                    ? jaquim == 4
                        ? "🌏"
                        : manel % 2 == 0
                        ? "🌍"
                        : "🌎"
                    : `${manel % 2 == 0 ? "zZzZz" : "ZzZzZ"} ${config.gang.clash ? "🐌" : "🐔"}`,
            );

            manel = manel < 1 ? 1 : manel - 1;

            if (gangInfo.moneyGainRate) {
                headers.push(" Income");
                values.push(`$${ns.formatNumber(gangInfo.moneyGainRate * 5)}/s 💵`);
            }

            const other: {
                [name: string]: { power: number; territory: number };
            } = ns.gang.getOtherGangInformation();

            const otherMapped = Object.keys(other)
                .filter((name) => name != gangInfo.faction)
                .map((name) => ({
                    name: name,
                    power: other[name].power,
                }));

            headers.push(" Power");
            values.push(
                `${ns.formatNumber(gangInfo.power)} ${
                    otherMapped.every((gang) => gang.power > gangInfo.power)
                        ? "🥉"
                        : otherMapped.some((gang) => gang.power > gangInfo.power)
                        ? "🥈"
                        : "🥇"
                }`,
            );

            headers.push(" Respect");
            values.push(`${ns.formatNumber(gangInfo.respect)} 👊`);

            headers.push(" Territory");
            values.push(
                `${progressBar(100 * gangInfo.territory)} ${(100 * gangInfo.territory).toFixed(
                    1,
                )}% 🌐`,
            );

            headers.push(" Wanted");
            values.push(`${((1 - gangInfo.wantedPenalty) * 100).toFixed(2)}% 🚨`);

            headers.push("  Level");
            values.push(`${ns.formatNumber(gangInfo.wantedLevel)} 👮`);

            headers.push("  Rate");
            values.push(`${ns.formatNumber(gangInfo.wantedLevelGainRate)}/s 🔥`);
        }
    };

    const hacknet = (config: Config, headers: string[], values: string[]): void => {
        if (config.overview.hacknet && ns.hacknet.numNodes() > 1) {
            headers.push("Hacknet");
            const isNode = ns.hacknet.getNodeStats(0).name.includes("node");
            values.push(
                `${isNode ? "$" : "#"}${ns.formatNumber(
                    [...Array(ns.hacknet.numNodes()).keys()]
                        .map((index) => ns.hacknet.getNodeStats(index).production)
                        .reduce((acc, curr) => acc + curr, 0),
                )}/s ${isNode ? "💵" : "💳"}`,
            );
        }
    };

    let eduardo = 2; // scripts section dash animation: cycles 0-2
    const scripts = (config: Config, headers: string[], values: string[]): void => {
        eduardo = eduardo < 1 ? 2 : eduardo - 1;
        if (config.overview.scripts) {
            headers.push("SCRIPTS");

            values.push(
                `${eduardo % 2 == 0 ? "-—-" : "—-—"}>${` `.repeat(eduardo)}${
                    config.hacking.targetMoneyPercent > 0
                        ? eduardo == 0
                            ? "💵"
                            : "$$"
                        : eduardo == 0
                        ? "💎"
                        : "XP"
                }`,
            );

            const addMoney = () => {
                headers.push(" Money");
                values.push(`$${ns.formatNumber(ns.getTotalScriptIncome()[0])}/s 💵`);
            };

            const addXp = () => {
                headers.push(" XP");
                values.push(`${ns.formatNumber(ns.getTotalScriptExpGain())}/s 💎`);
            };

            if (config.hacking.targetMoneyPercent > 0) {
                addMoney();
                addXp();
            } else {
                addXp();
                addMoney();
            }

            const hosts = helper
                .hosts(ns)
                .filter(
                    (host) =>
                        config.hacknet.useRam || false == host.hostname.startsWith("hacknet-"),
                );

            const maxRam = hosts.reduce((total, host) => total + host.maxRam, 0);

            headers.push(" RAM");
            values.push(`💻 ${ns.formatRam(maxRam)}`);

            const freePercent =
                (100 * hosts.reduce((total, host) => total + host.ramFree, 0)) / maxRam;

            headers.push("  Free");
            values.push(`${progressBar(freePercent)} ${freePercent.toFixed(1)}% 💤`);

            headers.push("  Home");
            values.push(
                `${ns.scriptRunning("init.js", "home") && josefina ? "🚩" : "  "} ${ns.formatRam(
                    ns.getServerMaxRam("home"),
                )} 🏡`,
            );
        }
    };

    /**
     * LOOP
     */
    while (true) {
        try {
            const config: Config = helper.config(ns);
            const headers: string[] = [];
            const values: string[] = [];

            const player = ns.getPlayer();

            headers.push(`@${player.location.toUpperCase()}`);
            values.push(`${places[player.city]} ${player.city.toUpperCase()}`);

            hacknet(config, headers, values);

            if (helper.config(ns).overview.entropy && player.entropy) {
                headers.push("Entropy");
                values.push(
                    `${ns.formatNumber(player.entropy)} ${
                        eduardo == 0 && josefina
                            ? "😬"
                            : player.entropy > 1
                            ? "😵"
                            : player.entropy > 0
                            ? "🥴"
                            : ""
                    }`,
                );
            }

            const karma = helper.karma(ns);
            if (helper.config(ns).overview.karma && karma) {
                headers.push("Karma");
                values.push(
                    `${ns.formatNumber(karma)} ${
                        eduardo == 2 && josefina ? "💘" : karma < 0 ? "💔" : "💝"
                    }`,
                );
            }

            if (helper.config(ns).overview.kills && player.numPeopleKilled) {
                headers.push("Kills");
                values.push(`${ns.formatNumber(player.numPeopleKilled)} 💀`);
            }

            scripts(config, headers, values);
            corp(config, headers, values);
            gang(config, headers, values);
            bladeburner(config, headers, values);

            if (config.overview.contracts) {
                try {
                    const raw = ns.read(CONTRACTS_STATS_FILENAME);
                    if (raw) {
                        const stats = JSON.parse(raw);
                        if (stats.solved || stats.failed) {
                            headers.push("CONTRACTS");
                            values.push(`${stats.solved || 0}\u2714 ${stats.failed || 0}\u2718`);
                        }
                    }
                } catch {
                    /* no stats file yet */
                }
            }

            headersHook.innerText = headers.join(" \n");
            valuesHook.innerText = values.join("\n");
        } catch (error) {
            log.error(ns, "%s", error);
        }

        await ns.sleep(1_000);
    }
}
