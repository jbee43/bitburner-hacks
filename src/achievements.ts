import { NS } from "@ns";
import log, { Type } from "@/log";

export async function main(ns: NS): Promise<void> {
    if (await ns.prompt("Unlock all achievements?")) {
        const file = "achievements.txt";
        const url =
            "https://raw.githubusercontent.com/bitburner-official/bitburner-src/stable/src/Achievements/AchievementData.json";

        log.info(ns, "Download %s <-- %s", file, url);

        if (false == (await ns.wget(url, file))) {
            log.error(ns, "List download failed");
            return;
        }

        const achievements = Object.keys(JSON.parse(ns.read(file)).achievements);

        // avoid RAM cost with eval
        const doc = eval("document");

        if (doc.achievements.length == achievements.length) {
            log.info(ns, "%d achievements <-- already unlocked all", achievements.length);
            return;
        }

        const achievementsLocked = achievements.filter(
            (achievement) => false == doc.achievements.includes(achievement),
        );

        log.info(
            ns,
            "%d achievements <-- unlocking %d",
            achievements.length,
            achievementsLocked.length,
        );

        achievementsLocked
            .sort() // just for log
            .forEach((achievement) => {
                doc.achievements.push(achievement);
                log.success(ns, "Unlocked %s", achievement);
            });

        log.msg(ns, ns.rm(file) ? Type.Info : Type.Warn, "%s --> *poof*", file);

        log.success(ns, "All %d achievements unlocked <-- done", achievements.length);
    }
}
