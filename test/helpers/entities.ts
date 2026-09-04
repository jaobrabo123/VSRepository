// Entidades usadas nos testes do core. A v2 é ORM-agnostic, então essas
// entidades são tipos "puros" TypeScript — não vêm do Prisma Client gerado
// (esse acoplamento só existe do lado do adapter, ver `VSRepoPrisma7Adapter`).
// Os campos seguem o mesmo `schema.prisma` de exemplo usado no restante do
// projeto (`prisma/schema.prisma`), para manter os cenários reconhecíveis.

export enum UserType {
    ADMIN = "ADMIN",
    COMMON = "COMMON",
}

export type Address = {
    id: string;
    city: string;
    state: string;
    country: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type Product = {
    id: string;
    name: string;
    description: string | null;
    price: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
};

export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    userType: UserType;
    active: boolean;
    likesVSRepo: boolean;
    balance: number;
    bonusPoints: number | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    address?: Address | null;
    products?: Product[];
};

export function buildUser(overrides: Partial<User> = {}): User {
    return {
        id: "user-1",
        name: "João",
        email: "joao@email.com",
        password: "hashed-password",
        userType: UserType.COMMON,
        active: true,
        likesVSRepo: true,
        balance: 100,
        bonusPoints: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        ...overrides,
    };
}
