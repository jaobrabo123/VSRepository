import * as v from "valibot";

// * Validação simplificada para não dar problema em ORMs com especifidades
export default v.looseObject({
    AND: v.optional(v.union([v.looseObject({}), v.array(v.looseObject({}))])),
    OR: v.optional(v.union([v.looseObject({}), v.array(v.looseObject({}))])),
    NOT: v.optional(v.union([v.looseObject({}), v.array(v.looseObject({}))])),
});
