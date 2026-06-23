import { RepositoryBuildInstance } from "./types/repository-build-instance.type";

export function resolveSelect(
    instance: RepositoryBuildInstance,
    provided?: string | false,
    pushed?: string | false,
) {
    const selectModelKey = provided ?? pushed ?? instance.defaultSelectModel;

    return selectModelKey ? instance.selectModels?.[selectModelKey] : undefined;
}
