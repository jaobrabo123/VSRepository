import { PrettyWhere } from "./pretty-where.type";
import { UglyWhere } from "./ugly-where.type";

export interface DynamicMethodWhereOps {
    uglyWheres: UglyWhere[];
    prettyWheres: PrettyWhere[];
    whereType: "overwrite" | "extending";
    pushWhere?: object;
}
