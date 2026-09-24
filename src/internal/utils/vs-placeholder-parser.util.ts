import { VSRepoError } from "../../errors/VSRepoError";
import { VSRepoErrorType } from "../enums/vsrepo-error-type.enum";
import { VSSql } from "./vs-sql.util";

export class VSPlaceholdersParser {
    /**
     * Parses a raw SQL string written with VSRepository's own agnostic,
     * positional placeholders — `?1`, `?2`, ... (1-based, Spring Data JPA style)
     * — into a `VSSql` fragment, so it compiles through `adapter.getPlaceholder()`
     * exactly like any other `VSSql`. Enabled via `vsPlaceholders: true` in the
     * `VSRepository` constructor options.
     *
     * The same index may appear more than once (`?1 ... ?1`) to reuse the same
     * argument — each *occurrence* becomes its own placeholder/value pair in the
     * compiled output (duplicating the value in `args` rather than trying to
     * reference a single bound parameter twice), since not every adapter
     * supports referencing one bound parameter more than once.
     *
     * @internal
     */
    static parse(query: string, args: readonly unknown[] = []): VSSql {
        const placeholderPattern = /\?(\d+)/g;

        const chunks: string[] = [];
        const values: unknown[] = [];

        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = placeholderPattern.exec(query)) !== null) {
            const position = Number(match[1]);

            if (!Number.isInteger(position) || position < 1 || position > args.length) {
                throw new VSRepoError(
                    `Invalid 'vsPlaceholders' reference '?${match[1]}' in query — expected a number between 1 and ${args.length} (the length of 'args').`,
                    VSRepoErrorType.VALIDATOR,
                );
            }

            chunks.push(query.slice(lastIndex, match.index));
            values.push(args[position - 1]);
            lastIndex = match.index + match[0].length;
        }

        chunks.push(query.slice(lastIndex));

        // `VSSql.sql` only ever reads `strings` by index (`strings[0]`, `strings[i + 1]`)
        // and never touches `.raw`, so a plain string array built at runtime works
        // the same as a real tagged-template `TemplateStringsArray` here.
        return VSSql.sql(chunks as unknown as TemplateStringsArray, ...values);
    }
}
