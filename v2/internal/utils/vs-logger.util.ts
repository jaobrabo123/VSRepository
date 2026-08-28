import { VSLogLevel } from "../enums/vs-log-level.enum";
import { PerformData } from "../../types/utils/perform-data.type";

export class VSLogger {
    constructor(
        private readonly logLevel: VSLogLevel,
        private readonly loggerName: string,
    ) {}

    getLogLevel(): VSLogLevel {
        return this.logLevel;
    }

    private stringfy(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }

    private log(level: VSLogLevel, text: string, obj?: any): void {
        if (this.logLevel > level) return;

        const args = [text];
        if (obj) {
            args.push("\n" + this.stringfy(obj));
        }
        console.log(...args);
    }

    logWarn(text: string, obj?: any): void {
        this.log(VSLogLevel.WARN, `[${this.loggerName}] WARN: ${text}`, obj);
    }

    logDebug(text: string, obj?: any): void {
        this.log(VSLogLevel.DEBUG, `[${this.loggerName}] DEBUG: ${text}`, obj);
    }

    startPerformLog(operation: string): PerformData | undefined {
        if (this.logLevel > VSLogLevel.DEBUG) return;

        this.logDebug(`Starting to ${operation}...`);

        return {
            operation,
            start: performance.now(),
        };
    }

    endPerformLog(data: PerformData | undefined): void {
        if (!data) return;

        const end = performance.now();
        const timeTook = (end - data.start).toFixed(2);

        this.logDebug(`Took ${timeTook}ms to ${data.operation}`);
    }
}
