import { Method } from "./method.type";
import { Relation } from "./relation.type";

export interface ConstructorConfig {
    tableName: string;
    pkName: string;
    softRemovekName?: string;
    selectModels?: Record<string, { [x: string]: unknown }>;
    includeModels?: Record<string, { [x: string]: unknown }>;
    defaultSelectModel?: string;
    requiredWhere?: object;
    relations?: Record<string, Relation>;
    methods?: Record<string, Method>;
    defaultOrdenation?: object | object[];
}
