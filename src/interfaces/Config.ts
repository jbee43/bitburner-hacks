export default interface Config {
    slowMo: boolean;
    slowMoMultiplier: number;
    walletFreeze: boolean;
    logs: Logs;
    overview: Overview;
    backdoor: Backdoor;
    bladeburner: Bladeburner;
    corporation: Corporation;
    gang: Gang;
    grafting: Grafting;
    hacking: Hacking;
    hacknet: Hacknet;
    nuker: Nuker;
    servers: Servers;
    singularity: Singularity;
    sleeves: Sleeves;
    stanek: Stanek;
    stock: Stock;
}

interface Logs {
    context: boolean;
    debug: boolean;
    date: boolean;
    milliseconds: boolean;
    pid: boolean;
    terminal: boolean;
}

interface Overview {
    bladeburner: boolean;
    contracts: boolean;
    corporation: boolean;
    entropy: boolean;
    gang: boolean;
    hacknet: boolean;
    karma: boolean;
    kills: boolean;
    scripts: boolean;
}

interface Loop {
    init?: boolean;
    intervalMs: number;
}

interface Backdoor extends Loop {
    manualHack: boolean;
}

interface Bladeburner {
    init?: boolean;
    inciteViolence: boolean;
}

interface Corporation extends Loop {
    fundsMax: number;
    fundsPercent: number;
    name: string;
    upgradeWarehouse: boolean;
}

interface Gang extends Loop {
    ascend: boolean;
    clash: boolean;
    faction: string;
    holdTerritory: boolean;
    nationality: string;
    recruit: boolean;
    walletMax: number;
    walletPercent: number;
}

interface Grafting extends Loop {
    charisma: boolean;
    combat: boolean;
    companyRep: boolean;
    crime: boolean;
    factionRep: boolean;
    hack: boolean;
    hacknet: boolean;
    walletMax: number;
    walletPercent: number;
}

interface Hacking extends Loop {
    homeRamSpare: number;
    stanek: boolean;
    targetCount: number;
    targetMoneyPercent: number;
}

interface Hacknet extends Loop {
    hashSpend: HashSpend;
    useRam: boolean;
    walletMax: number;
    walletPercent: number;
}

interface HashSpend {
    sellForMoney: boolean;
    sellForCorpFunds: boolean;
    reduceSecurity: boolean | string;
    increaseMoney: boolean | string;
    improveStudy: boolean;
    improveGym: boolean;
    corpResearch: boolean;
    bladeburnerRank: boolean;
    bladeburnerSp: boolean;
    codingContract: boolean;
    companyFavor: boolean | string;
}

interface Nuker extends Loop {
    openAllPorts: boolean;
}

interface Servers extends Loop {
    walletMax: number;
    walletPercent: number;
}

interface Singularity extends Loop {
    combat: boolean;
    focus: boolean;
    getBusy: boolean;
    killWorldDaemon: boolean;
    nextBitnode: number;
    upgradeHomeCores: boolean;
    upgradeHomeRam: boolean;
}

interface Sleeves extends Loop {
    assign: boolean;
    augment: boolean;
    shockMax: number;
    syncMin: number;
    walletMax: number;
    walletPercent: number;
}

type Stanek = Loop;

interface Stock {
    init: boolean;
    walletMax: number;
    walletPercent: number;
}
