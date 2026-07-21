import { SeeMode } from "./see-mode.type";

export interface MethodOptions {
    db?: any;
    selectModel?: string | false;
    includeModel?: string;
    include?: object;
    see: SeeMode;
}
