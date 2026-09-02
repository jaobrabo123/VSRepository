import * as v from "valibot";

const recordSchema = v.record(v.string(), v.picklist(["asc", "desc", "ASC", "DESC"]));
export default v.union([recordSchema, v.array(recordSchema)]);
