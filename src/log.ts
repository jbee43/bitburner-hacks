import { NS } from "@ns";
import Config from "@/interfaces/Config";
import helper from "@/helper";

/**
 * ! no RAM costs here !
 */

export enum Color {
    Default = "\u001b[0m",
    Black = "\u001b[30m",
    White = "\u001b[37m",
    Red = "\u001b[31m",
    Green = "\u001b[32m",
    Blue = "\u001b[34m",
    Cyan = "\u001b[36m",
    Magenta = "\u001b[35m",
    Yellow = "\u001b[33m",
    BrightBlack = "\u001b[30;1m",
    BrightWhite = "\u001b[37;1m",
    BrightRed = "\u001b[31;1m",
    BrightGreen = "\u001b[32;1m",
    BrightBlue = "\u001b[34;1m",
    BrightCyan = "\u001b[36;1m",
    BrightMagenta = "\u001b[35;1m",
    BrightYellow = "\u001b[33;1m",
}

export enum Type {
    Debug = Color.Default,
    Error = Color.Red,
    Info = Color.White,
    Success = Color.Green,
    Warn = Color.Yellow,
}

export default class log {
    public static msg(ns: NS, colorOrType: Color | Type, format: string, ...args: any[]): void {
        const config: Config = helper.config(ns);
        if ((colorOrType as Type) == Type.Debug && true != config.logs.debug) {
            return;
        }

        const split: string[] | null =
            config.logs.context && false != config.logs.terminal
                ? ns.getScriptName().split(".")
                : null;

        const context: string | null = split
            ? split
                  .map((str, idx) => (idx > 0 && idx < split.length - 1 ? str.toUpperCase() : str))
                  .join(".")
                  .replace("loop.", "")
                  .replace(".js", "")
                  .replace(".", "/")
            : null;

        const formatted = `${colorOrType}${helper.timestamp(
            config.logs.date,
            config.logs.milliseconds,
        )}${context ? ` ${context} ` : ""}${config.logs.pid ? `${ns.pid} ` : ""}${format}`;

        if (config.logs.terminal) {
            ns.tprintf(formatted, ...args);
        } else {
            ns.printf(formatted, ...args);
        }
    }

    public static debug(ns: NS, format: string, ...args: any[]) {
        this.msg(ns, Type.Debug, format, ...args);
    }

    public static error(ns: NS, format: string, ...args: any[]) {
        this.msg(ns, Type.Error, format, ...args);
    }

    public static info(ns: NS, format: string, ...args: any[]) {
        this.msg(ns, Type.Info, format, ...args);
    }

    public static success(ns: NS, format: string, ...args: any[]) {
        this.msg(ns, Type.Success, format, ...args);
    }

    public static warn(ns: NS, format: string, ...args: any[]) {
        this.msg(ns, Type.Warn, format, ...args);
    }
}
