import { Server } from "@ns";

export default interface Host extends Server {
    depth: number;
    links: string[];
    ramFree: number;
}
