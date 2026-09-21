import * as v from "valibot";

export default v.object({
    limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
    offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
});
