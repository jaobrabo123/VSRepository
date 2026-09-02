import { RepositoryBuildInstance } from "./types/repository-build-instance.type";

export function resolveDataPayloadWithRelations(
    instance: RepositoryBuildInstance,
    obj: Record<string, any>,
    relationsKeys: string[],
) {
    const relations = instance.relations;
    if (!relations) return obj;

    const dataPayload: Record<string, any> = {};
    const objKeys = Object.keys(obj);

    for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i]!;
        const field = obj[key]!;

        if (field === undefined) continue;

        if (relationsKeys.includes(key)) {
            if (field === null) continue;
            
            const relation = relations[key]!;

            if (relation.mode === "otm" || relation.mode === "mtm") {
                const dataWithPk: any[] = [];
                const dataWithoutPk: any[] = [];

                field.forEach((data: any) => {
                    if (data[relation.pk] !== undefined) {
                        dataWithPk.push(data);
                    } else {
                        dataWithoutPk.push(data);
                    }
                });

                dataPayload[key] = {
                    create: dataWithoutPk,
                    connectOrCreate: dataWithPk.map(data => ({
                        where: { [relation.pk]: data[relation.pk] },
                        create: data,
                    })),
                };
            } else {
                const relationFieldPk = field[relation.pk];
                if (relationFieldPk != null) {
                    dataPayload[key] = {
                        connectOrCreate: {
                            where: { [relation.pk]: relationFieldPk },
                            create: field,
                        },
                    };
                } else {
                    dataPayload[key] = {
                        create: field,
                    };
                }
            }
        } else {
            dataPayload[key] = field;
        }
    }

    return dataPayload;
}
