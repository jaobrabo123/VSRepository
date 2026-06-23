import { PrettyWhere } from "./pretty-where.type";
import { UglyWhere } from "./ugly-where.type";

export interface DinamicMethodWhereOps {
    uglyWheres: UglyWhere[];
    prettyWheres: PrettyWhere[];
    whereType: "overwrite" | "extending";
    pushWhere?: object;
}
