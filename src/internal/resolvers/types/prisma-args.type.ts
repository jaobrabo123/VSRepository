export interface PrismaArgs {
    where?: object;
    select?: object;
    data?: object;
    create?: object;
    update?: object;
    orderBy?: object | object[];
    skip?: number;
    take?: number;
    cursor?: object;
    skipDuplicates?: boolean;
}
