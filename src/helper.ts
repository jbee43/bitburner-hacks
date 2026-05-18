import { NS, CompanyName, Player } from "@ns";
import Config from "@/interfaces/Config";
import Host from "@/interfaces/Host";
import { CONFIG_FILENAME, HOSTS_FILENAME, HOSTS_TARGETS_FILENAME } from "@/constant";

/**
 * ! no RAM costs here !
 */

export default class helper {
    private static _prevConfig: Config | null = null;

    public static canSpend(
        config: Config,
        cost: number,
        money: number,
        moneyMax: number,
        moneyPercent: number,
    ): boolean {
        return (
            true != config.walletFreeze &&
            cost > 0 &&
            (moneyMax < 0 || moneyMax >= cost) &&
            (moneyPercent / 100) * money >= cost
        );
    }

    public static companiesLeft(ns: NS, player: Player): CompanyName[] {
        return [
            ns.enums.CompanyName.BachmanAndAssociates,
            ns.enums.CompanyName.OmniTekIncorporated,
            ns.enums.CompanyName.NWO,
            ns.enums.CompanyName.ECorp,
            ns.enums.CompanyName.ClarkeIncorporated,
            ns.enums.CompanyName.FulcrumTechnologies,
            // These companies' factions have alternate join paths (gang, backdoor, etc.)
            // ns.enums.CompanyName.MegaCorp,
            // ns.enums.CompanyName.KuaiGongInternational,
            // ns.enums.CompanyName.FourSigma,
            // ns.enums.CompanyName.BladeIndustries,
        ].filter((company) => false == this.inFaction(ns, company, player));
    }

    public static config(ns: NS): Config {
        try {
            const config: Config = JSON.parse(ns.read(CONFIG_FILENAME));
            this._prevConfig = config;
            return config;
        } catch (error) {
            if (this._prevConfig) {
                ns.tprintf("ERROR Failed JSON parse %s <-- using previous", CONFIG_FILENAME);
                return this._prevConfig;
            }
            throw error;
        }
    }

    public static duration(ms: number) {
        const portions: string[] = [];

        const msInHour = 1000 * 60 * 60;
        const hours = Math.trunc(ms / msInHour);
        if (hours > 0) {
            portions.push(hours + "h");
            ms = ms - hours * msInHour;
        }

        const msInMinute = 1000 * 60;
        const minutes = Math.trunc(ms / msInMinute);
        if (minutes > 0) {
            portions.push(minutes + "m");
            ms = ms - minutes * msInMinute;
        }

        const seconds = Math.trunc(ms / 1000);
        if (seconds > 0) {
            portions.push(seconds + "s");
        }

        return portions.join(" ");
    }

    public static formatMoney(ns: NS, value: number): string {
        return `$${ns.formatNumber(value)}`;
    }

    public static formatPercent(ns: NS, value: number, total: number): string {
        return `${((value * 100) / total).toFixed(2)}%`;
    }

    public static hosts(ns: NS, targets = false): Host[] {
        try {
            return JSON.parse(ns.read(targets ? HOSTS_TARGETS_FILENAME : HOSTS_FILENAME));
        } catch (error) {
            ns.tprintf("\u001b[33m%s <-- failed to load/parse: %s", HOSTS_FILENAME, error);
            return [];
        }
    }

    public static inFaction(ns: NS, faction: string, player: Player): boolean {
        return player.factions.includes(
            faction == ns.enums.CompanyName.FulcrumTechnologies
                ? "Fulcrum Secret Technologies"
                : faction,
        );
    }

    public static init(ns: NS): void {
        const name = ns.getScriptName();
        ns.tprintf("\u001b[37;1mSTART --> %s", name);
        ns.atExit(() => ns.tprintf("\u001b[33;1m%s <-- EXIT", name));
    }

    public static jsonStringify(data: any): string {
        return JSON.stringify(data, null, 2);
    }

    public static karma(_ns: NS): number {
        return eval("_ns.heart.break()") as number;
    }

    /**
     * Both inclusive
     */
    public static randInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    public static randStr({
        avoidConsecutives,
        digits,
        length,
        lowercase,
        symbols,
        uppercase,
    }: {
        avoidConsecutives: boolean;
        digits: boolean;
        length: number;
        lowercase: boolean;
        symbols: boolean;
        uppercase: boolean;
    }): string {
        const lower = "abcdefghijklmnopqrstuvwxyz";

        const charSet = `${digits ? "0123456789" : ""}${lowercase ? lower : ""}${
            symbols ? "@\"!@£$%^&*()#€\\/{[]}'=?»«+*`´~^,;.:-_" : ""
        }${uppercase ? lower.toUpperCase() : ""}`;

        function getChar() {
            return charSet.charAt(Math.floor(Math.random() * charSet.length));
        }

        let result = getChar();

        for (let i = 1; i < length; i++) {
            let char;

            do {
                char = getChar();

                if (false == avoidConsecutives || char != result[i - 1]) {
                    result = `${result}${char}`;
                }
            } while (avoidConsecutives && char == result[i - 1]);
        }

        return result;
    }

    public static timestamp(date: boolean, milliseconds: boolean): string {
        const split = new Date()
            .toISOString()
            .split(milliseconds ? "Z" : ".")[0]
            .split("T");
        return date ? split.join(" ") : split[1];
    }

    public static async wait(ns: NS, intervalMs: number): Promise<void> {
        let interval = intervalMs;

        if (interval < 1_000) {
            ns.tprintf("\u001b[33m%s <-- intervalMs too low: %d", ns.getScriptName(), intervalMs);

            interval = 1_000;
        }

        const config = this.config(ns);
        await ns.sleep(interval * (true == config.slowMo ? config.slowMoMultiplier : 1));
    }
}
