import z from "zod";

export default z
    .record(z.string(), z.enum(["asc", "desc", "ASC", "DESC"]))
    .or(z.array(z.record(z.string(), z.enum(["asc", "desc", "ASC", "DESC"]))));
