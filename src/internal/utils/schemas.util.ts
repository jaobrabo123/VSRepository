import z from "zod";

export const stringSchema = z.string().trim().nonempty();
export const objectSchema = z.looseObject({});
export const booleanSchema = z.boolean();
export const methodSchema = z.strictObject({
    map: booleanSchema,
    selectModel: stringSchema.or(z.literal(false)).optional(),
    whereType: z.enum(["overwrite", "extending"]).optional(),
    proxyTo: stringSchema.optional(),
    pushWhere: objectSchema.optional(),
    fbMode: z.enum(["one", "list"]).optional(),
    injectOrdenation: objectSchema.or(z.array(objectSchema)).optional(),
    injectPagination: objectSchema.optional(),
});
