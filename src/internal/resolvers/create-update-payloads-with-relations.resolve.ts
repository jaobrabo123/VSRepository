import { RepositoryBuildInstance } from "./types/repository-build-instance.type";

export function resolveCreateUpdatePayloadsWithRelations(
    instance: RepositoryBuildInstance,
    obj: Record<string, any>,
    relationsKeys: string[],
): {
    createPayload: Record<string, any>;
    updatePayload: Record<string, any>;
} {
    const relations = instance.relations;
    if (!relations) {
        const objUpdate = { ...obj };
        delete objUpdate[instance.pkName];

        return {
            createPayload: obj,
            updatePayload: objUpdate,
        };
    }

    const createPayload: Record<string, any> = {};
    const updatePayload: Record<string, any> = {};

    const objKeys = Object.keys(obj);

    for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i]!;
        const field = obj[key]!;

        if (field === undefined) continue;

        if (relationsKeys.includes(key)) {
            const relation = relations[key]!;

            if (relation.mode === "oto" || relation.mode === "mto") {
                if (field === null) {
                    if (relation.mode === "oto" && relation.restriction === "set") {
                        updatePayload[key] = { delete: true };
                    } else if (relation.mode === "mto" && relation.nullAble) {
                        updatePayload[key] = { disconnect: true };
                    }
                } else if (field !== undefined) {
                    const relationFieldPk = field[relation.pk];
                    if (relationFieldPk != null) {
                        const connectOrCreate = {
                            where: { [relation.pk]: relationFieldPk },
                            create: field,
                        };

                        createPayload[key] = { connectOrCreate };

                        if (relation.restriction === "add") {
                            updatePayload[key] = { connectOrCreate };
                        } else {
                            const update = { ...field };
                            delete update[relation.pk];

                            updatePayload[key] = {
                                upsert: {
                                    where: { [relation.pk]: relationFieldPk },
                                    create: field,
                                    update: update,
                                },
                            };
                        }
                    } else {
                        createPayload[key] = { create: field };
                        updatePayload[key] =
                            relation.restriction === "add"
                                ? { create: field }
                                : { upsert: { create: field, update: field } };
                    }
                }
            } else {
                const fieldAnyArray = field as any[];

                const dataWithPk: any[] = [];
                const dataWithoutPk: any[] = [];

                fieldAnyArray.forEach((data: any) => {
                    if (data[relation.pk] !== undefined) {
                        dataWithPk.push(data);
                    } else {
                        dataWithoutPk.push(data);
                    }
                });

                const connectOrCreate = dataWithPk.map(data => ({
                    where: { [relation.pk]: data[relation.pk] },
                    create: data,
                }));

                createPayload[key] = {
                    create: dataWithoutPk,
                    connectOrCreate,
                };

                if (relation.restriction === "add") {
                    if (relation.mode === "mtm") {
                        updatePayload[key] = {
                            create: dataWithoutPk,
                            connectOrCreate,
                        };
                    } else {
                        updatePayload[key] = {
                            create: dataWithoutPk,
                            upsert: dataWithPk.map(data => {
                                const update = { ...data };
                                delete update[relation.pk];
                                return {
                                    where: { [relation.pk]: data[relation.pk] },
                                    create: data,
                                    update,
                                };
                            }),
                        };
                    }
                } else {
                    if (relation.mode === "mtm") {
                        updatePayload[key] = {
                            set: [],
                            create: dataWithoutPk,
                            connectOrCreate,
                        };
                    } else {
                        updatePayload[key] = {
                            deleteMany: {
                                [relation.pk]: { notIn: dataWithPk.map(data => data[relation.pk]) },
                            },
                            create: dataWithoutPk,
                            upsert: dataWithPk.map(data => {
                                const update = { ...data };
                                delete update[relation.pk];
                                return {
                                    where: { [relation.pk]: data[relation.pk] },
                                    create: data,
                                    update,
                                };
                            }),
                        };
                    }
                }
            }
        } else {
            createPayload[key] = field;
            if (key !== instance.pkName) {
                updatePayload[key] = field;
            }
        }
    }

    return { createPayload, updatePayload };
}
