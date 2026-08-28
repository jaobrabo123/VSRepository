import { Prisma, PrismaClient } from "@vsrepo/prisma/types";
import { VSRepoWhere } from "../../types/vsrepo/vsrepo-where.type";
import { VSRepoAdapter } from "../../VSRepoAdapter";
import { AdapterMethodOptions } from "../../types/adapter/adapter-method-options.type";
import { CountResult } from "../../types/utils/count-result.type";
import { DeepPartial } from "../../types/utils/deep-partial.type";
import { parsePrismaWhere } from "./parsers/where.parser";
import { parsePrismaInclude } from "./parsers/include.parser";
import { parsePrismaSelect } from "./parsers/select.parser";
import { AdapterQueryOptions } from "../../types/adapter/adapter-query-options.type";

export class VSRepoPrisma7Adapter<T> extends VSRepoAdapter<T> {
    
    private readonly prismaRepository: { findFirst: (arg: any) => Promise<any> };

    constructor(
        private readonly prisma: PrismaClient,
        private readonly tableName: string,
    ) {
        super();
        this.prismaRepository = (prisma as any)[this.tableName];
    }

    getDbClient(): PrismaClient {
        return this.prisma;
    }

    public async runInTransaction<R>(
        fn: (tx: Prisma.TransactionClient) => Promise<R>,
        options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
    ): Promise<R> {
        return this.prisma.$transaction(fn, options);
    }

    public findOne(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<T | null> {
        const prismaWhere = parsePrismaWhere<T>(where);
        const prismaSelect = options?.select && parsePrismaSelect(options.select);
        const prismaInclude = prismaSelect
            ? undefined
            : options?.relations && parsePrismaInclude(options.relations);
        const prismaOrderBy = options?.order;
        const prismaSkip = options?.pagination?.offset;
        const prismaTake = options?.pagination?.limit;

        const prismaArgs = {
            where: prismaWhere,
            include: prismaInclude,
            skip: prismaSkip,
            take: prismaTake,
            orderBy: prismaOrderBy,
            select: prismaSelect,
        };

        console.log(prismaArgs);

        return this.prismaRepository.findFirst(prismaArgs);
    }

    public findOneOrThrow(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public findMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<T[]> {
        throw new Error("Method not implemented.");
    }

    public save(obj: DeepPartial<T>, options?: AdapterMethodOptions<T> | undefined): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public saveMany(
        objs: DeepPartial<T>[],
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]> {
        throw new Error("Method not implemented.");
    }

    public delete(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public deleteMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<CountResult> {
        throw new Error("Method not implemented.");
    }

    public deleteManyReturning(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<T[]> {
        throw new Error("Method not implemented.");
    }

    public update(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public updateMany(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<CountResult> {
        throw new Error("Method not implemented.");
    }

    public updateManyReturning(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<T[]> {
        throw new Error("Method not implemented.");
    }

    public count(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public exists(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> | undefined,
    ): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    public query<T = any>(query: string, options?: AdapterQueryOptions): Promise<T> {
        throw new Error("Method not implemented.");
    }
    public create(objs: DeepPartial<T>, options?: AdapterMethodOptions<T> | undefined): Promise<T> {
        throw new Error("Method not implemented.");
    }
    public createMany(objs: DeepPartial<T>[], options?: (AdapterMethodOptions<T> & { ignoreConflicts?: boolean; }) | undefined): Promise<CountResult> {
        throw new Error("Method not implemented.");
    }
    public merge<K>(where: VSRepoWhere<T>, obj: DeepPartial<T>, options?: AdapterMethodOptions<T> | undefined): Promise<K & T> {
        throw new Error("Method not implemented.");
    }
    public upsert(where: VSRepoWhere<T>, create: DeepPartial<T>, update: DeepPartial<T>, options?: AdapterMethodOptions<T> | undefined): Promise<T> {
        throw new Error("Method not implemented.");
    }
}

// type User = UserGetPayload<{ include: { address: true; products: true } }>;

// const where = parseVSRepoWhere<User>({
//     id: crypto.randomUUID(),
//     active: true,
//     createdAt: { between: [new Date(), new Date()] },
//     address: {
//         _with: {
//             city: {
//                 startsWith: "tal",
//                 ignoreCase: true,
//             },
//         },
//     },
//     products: {
//         _some: {
//             createdAt: { gt: new Date() },
//         },
//     },
// });

// async function test() {
//     const a = await prisma.user.findMany({ where });
//     console.log(JSON.stringify(where, null, 2));
//     console.log(a);
// }
// test();
