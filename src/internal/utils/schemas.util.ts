import z from "zod";

export const stringSchema = z.string().trim().nonempty();
export const objectSchema = z.looseObject({});
export const booleanSchema = z.boolean();
