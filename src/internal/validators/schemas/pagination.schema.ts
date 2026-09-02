import * as v from "valibot";

export default v.object({
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
});
