import z from "zod";
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

export class VSRepoValidator<T, K, O extends VSRepoOrmTypes = VSRepoOrmTypes> {
    // * Setado depois pelo VSRepository, pois no momento em que validateConstructorOptions
    // * roda (validação das próprias options do construtor, incluindo o logLevel) o logger
    // * ainda não existe.
    private logger?: VSLogger;

    setLogger(logger: VSLogger): void {
        this.logger = logger;
    }

    private failValidation(
        issue: z.core.$ZodIssue | undefined,
        type: VSRepoErrorType,
    ): never {
        const path = issue?.path.length ? issue.path.join(".") : "options";
        const message = `${path}: ${issue?.message}`;

        this.logger?.logError(`Validation failed (${type}): ${message}`);

        throw new VSRepoError(message, type);
    }

    private readonly constructorOptionsSchema = z.object({
        // * Usando any ao invés de instanceof para não ter erro de referencia
        adapter: z.any(),
        pkName: z.string(),
        hooks: z
            .record(
                z.string(),
                z.object({ before: z.function().optional(), after: z.function().optional() }),
            )
            .optional(),
        softRemoveKey: z.string().optional(),
        logLevel: z.enum(VSLogLevel).optional(),
        logSlowThresholdMs: z.number().positive().optional(),
        defaultOrdering: orderingSchema.optional(),
    });

    validateConstructorOptions(options: unknown): VSRepoOptions<T, K> {
        const optionsParsed = this.constructorOptionsSchema.safeParse(options);

        if (!optionsParsed.success) {
            this.failValidation(optionsParsed.error.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return optionsParsed.data as unknown as VSRepoOptions<T, K>;
    }

    private readonly methodOptionsSchema = z.strictObject({
        db: z.looseObject({}).optional(),
        see: z.enum(["active", "removed", "all"]).optional(),
        relations: z.looseObject({}).optional(),
        select: z.looseObject({}).optional(),
    });

    validateMethodOptions(options?: unknown): MethodOptions<T, O> {
        const optionsParsed = this.methodOptionsSchema.safeParse(options ?? {});

        if (!optionsParsed.success) {
            this.failValidation(optionsParsed.error.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return optionsParsed.data as unknown as MethodOptions<T>;
    }

    private readonly getAllMethodOptionsSchema = this.methodOptionsSchema.safeExtend({
        order: orderingSchema.optional(),
        pagination: z
            .object({ limit: z.number().optional(), offset: z.number().optional() })
            .optional(),
    });

    validateGetAllMethodOptions(options?: unknown): MethodOptions<T, O> & {
        pagination?: Pagination;
        order?: Ordering<T>;
    } {
        const optionsParsed = this.getAllMethodOptionsSchema.safeParse(options ?? {});

        if (!optionsParsed.success) {
            this.failValidation(optionsParsed.error.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return optionsParsed.data as unknown as MethodOptions<T>;
    }

    private queryArgSchema = z.strictObject({
        args: z.array(z.any()).optional(),
        db: z.looseObject({}).optional(),
    });

    validateQueryMethodArg(arg?: unknown): QueryMethodArg<any> {
        const argParsed = this.queryArgSchema.safeParse(arg ?? {});

        if (!argParsed.success) {
            this.failValidation(argParsed.error.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return argParsed.data;
    }

    private transactionOptionsSchema = z.object({
        timeoutMs: z.number().optional(),
        isolationLevel: z.enum(TransactionIsolationLevel).optional(),
    });

    validateTransactionOptions(options: unknown): VSRepoTransactionOptions {
        const optionsParsed = this.transactionOptionsSchema.safeParse(options ?? {});

        if (!optionsParsed.success) {
            this.failValidation(optionsParsed.error.issues[0], VSRepoErrorType.VALIDATOR);
        }

        return optionsParsed.data;
    }
}
