import * as v from "valibot";
import { VSRepoOptions } from "../../types/vsrepo/vsrepo-options.type";
import { VSLogLevel } from "../enums/vs-log-level.enum";
import { VSRepoError } from "../../errors/VSRepoError";
import orderingSchema from "./schemas/ordering.schema";
import { MethodOptions } from "../../types/utils/methods-options.type";
import { QueryMethodArg } from "../../types/utils/query-method-arg.type";
import { VSRepoErrorType } from "../enums/vsrepo-errortype.enum";
import { VSRepoTransactionOptions } from "../../types/vsrepo/vsrepo-transaction-options.type";
import { TransactionIsolationLevel } from "../enums/transaction-isolation-level.enum";
import { VSRepoOrmTypes } from "../../types/vsrepo/vsrepo-orm-types.type";
import { Pagination } from "../../types/utils/pagination.type";
import { Ordering } from "../../types/utils/ordering.type";
import { VSLogger } from "../utils/vs-logger.util";
import paginationSchema from "./schemas/pagination.schema";

export class VSRepoValidator<T, K, O extends VSRepoOrmTypes = VSRepoOrmTypes> {
    // * Setado depois pelo VSRepository, pois no momento em que validateConstructorOptions
    // * roda (validação das próprias options do construtor, incluindo o logLevel) o logger ainda não existe.
    private logger?: VSLogger;

    setLogger(logger: VSLogger): void {
        this.logger = logger;
    }

    private failValidation(issue: v.GenericIssue | undefined, type: VSRepoErrorType): never {
        const path = issue?.path?.length ? issue.path.map(p => String(p.key)).join(".") : "options";
        const message = `${path}: ${issue?.message ?? "validation failed"}`;

        this.logger?.logError(`Validation failed (${type}): ${message}`);

        throw new VSRepoError(message, type);
    }

    private readonly constructorOptionsSchema = v.object({
        // * Usando any ao invés de instanceof para não ter erro de referencia
        adapter: v.any(),
        pkName: v.string(),
        softRemoveKey: v.optional(v.string()),
        logLevel: v.optional(v.enum(VSLogLevel)),
        logSlowThresholdMs: v.optional(v.pipe(v.number(), v.gtValue(0))),
        defaultOrdering: v.optional(orderingSchema),
    });

    validateConstructorOptions(options: unknown): VSRepoOptions<T, K> {
        const parsed = v.safeParse(this.constructorOptionsSchema, options);

        if (!parsed.success) {
            this.failValidation(parsed.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return parsed.output as unknown as VSRepoOptions<T, K>;
    }

    private readonly methodOptionsSchema = v.object({
        db: v.optional(v.looseObject({})),
        see: v.optional(v.picklist(["active", "removed", "all"])),
        relations: v.optional(v.looseObject({})),
        select: v.optional(v.looseObject({})),
    });

    validateMethodOptions(options?: unknown): MethodOptions<T, O> {
        const parsed = v.safeParse(this.methodOptionsSchema, options ?? {});

        if (!parsed.success) {
            this.failValidation(parsed.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return parsed.output as unknown as MethodOptions<T>;
    }

    private readonly getAllMethodOptionsSchema = v.object({
        ...this.methodOptionsSchema.entries,
        order: v.optional(orderingSchema),
        pagination: v.optional(paginationSchema),
    });

    validateGetAllMethodOptions(options?: unknown): MethodOptions<T, O> & {
        pagination?: Pagination;
        order?: Ordering<T>;
    } {
        const parsed = v.safeParse(this.getAllMethodOptionsSchema, options ?? {});

        if (!parsed.success) {
            this.failValidation(parsed.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return parsed.output as unknown as MethodOptions<T>;
    }

    private queryArgSchema = v.object({
        args: v.optional(v.array(v.any())),
        db: v.optional(v.looseObject({})),
    });

    validateQueryMethodArg(arg?: unknown): QueryMethodArg<any> {
        const parsed = v.safeParse(this.queryArgSchema, arg ?? {});

        if (!parsed.success) {
            this.failValidation(parsed.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return parsed.output as QueryMethodArg<any>;
    }

    private transactionOptionsSchema = v.object({
        timeoutMs: v.optional(v.number()),
        isolationLevel: v.optional(v.enum(TransactionIsolationLevel)),
    });

    validateTransactionOptions(options: unknown): VSRepoTransactionOptions {
        const parsed = v.safeParse(this.transactionOptionsSchema, options ?? {});

        if (!parsed.success) {
            this.failValidation(parsed.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return parsed.output as VSRepoTransactionOptions;
    }
}
