import { VSRepoPrettyWhere } from "../vsrepo/vsrepo-pretty-where.type";
import { VSRepoUglyWhere } from "../vsrepo/vsrepo-ugly-where.type";

export interface DynamicMethodWhereOps {
    uglyWheres: VSRepoUglyWhere[];
    prettyWheres: VSRepoPrettyWhere[];
}
