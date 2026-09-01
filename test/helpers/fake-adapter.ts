// Helper que cria um `VSRepoAdapter` falso (métodos mockados com `jest.fn()`),
// no mesmo espírito do `fakePrisma` usado em `error-handling.test.ts` na v1 de
// VSRepository — mas adaptado para a v2, cuja `VSRepository` não fala mais
// diretamente com o Prisma: ela delega tudo para um `VSRepoAdapter`.
//
// Isso segue também o padrão usado em `VSRepoPrisma7Adapter` (repo irmão que
// implementa esse contrato para o Prisma 7): lá, o adapter é testado com um
// "Prisma Client" falso; aqui, testamos o `VSRepository`/decorators core com
// um "adapter" falso, verificando QUAIS métodos do adapter são chamados e
// COM QUAIS argumentos, sem precisar de um banco ou ORM real.

import { VSRepoAdapter } from "../../src/VSRepoAdapter";

/**
 * Cria um `VSRepoAdapter<T>` falso com todos os métodos do contrato
 * mockados via `jest.fn()`. Nenhum método tem um retorno padrão configurado
 * (exceto os que precisam de um formato mínimo, como `runInTransaction`) —
 * configure o retorno desejado em cada teste com `mockResolvedValueOnce`/
 * `mockReturnValueOnce`.
 */
export function createFakeAdapter<T = any>(): jest.Mocked<VSRepoAdapter<T>> {
    const adapter: jest.Mocked<VSRepoAdapter<T>> = {
        runInTransaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(adapter.getDbClient())),
        getDbClient: jest.fn(() => ({})),
        query: jest.fn(),
        findOne: jest.fn(),
        findOneOrThrow: jest.fn(),
        findMany: jest.fn(),
        save: jest.fn(),
        saveMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        deleteManyReturning: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        updateManyReturning: jest.fn(),
        count: jest.fn(),
        exists: jest.fn(),
        merge: jest.fn(),
        upsert: jest.fn(),
    } as unknown as jest.Mocked<VSRepoAdapter<T>>;

    return adapter;
}
