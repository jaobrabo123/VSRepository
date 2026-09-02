import { VSRepository } from "../../../VSRepository";
import { BaseMethodFunction, BaseMethodObjFunction, BaseMethodObjListFunction, BaseMethodPkFunction, BaseMethodPkListFunction, BaseMethodPkObjFunction, BaseMethodPkObjTuplesFunction } from "./base-method-function.type";

export interface RepositoryBuildInstance extends VSRepository {
    prisma?: any;

    get?: BaseMethodPkFunction; //*
    getOrThrow?: BaseMethodPkFunction; //*
    getAll?: BaseMethodFunction; //*
    remove?: BaseMethodPkFunction; //*
    save?: BaseMethodObjFunction; //*
    patch?: BaseMethodPkObjFunction;
    removeList?: BaseMethodPkListFunction; //*
    total?: BaseMethodFunction; //*
    has?: BaseMethodPkFunction; //*
    merge?: BaseMethodPkObjFunction; //*
    getList?: BaseMethodPkListFunction; //*
    saveList?: BaseMethodObjListFunction;
    softRemove?: BaseMethodPkFunction; //*
    restore?: BaseMethodPkFunction; //*
    softRemoveList?: BaseMethodPkListFunction; //*
    restoreList?: BaseMethodPkObjTuplesFunction; //*
    patchList?: BaseMethodPkObjTuplesFunction;
}