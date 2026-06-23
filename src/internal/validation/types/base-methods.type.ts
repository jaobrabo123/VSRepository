export interface BaseMethodConfig {
    active: boolean;
    ignoreRequiredWhere: boolean;
}

export interface BaseMethodConfigWithSelect extends BaseMethodConfig {
    defaultSelect?: string | false;
}

export interface BaseMethods {
    get: BaseMethodConfigWithSelect;
    getOrThrow: BaseMethodConfigWithSelect;
    getAll: BaseMethodConfigWithSelect;
    remove: BaseMethodConfigWithSelect;
    save: BaseMethodConfigWithSelect;
    patch: BaseMethodConfigWithSelect;
    removeList: BaseMethodConfig;
    total: BaseMethodConfig;
    has: BaseMethodConfig;
    merge: BaseMethodConfigWithSelect;
    getList: BaseMethodConfigWithSelect;
    saveList: BaseMethodConfigWithSelect;
    softRemove: BaseMethodConfigWithSelect;
    restore: BaseMethodConfigWithSelect;
    softRemoveList: BaseMethodConfigWithSelect;
    restoreList: BaseMethodConfigWithSelect;
    patchList: BaseMethodConfigWithSelect;
}
