import { VSRepoConfigError } from "./VSRepoError.js";

export class FieldValidator {
    constructor(throws) {
        this.throws = throws;
    }

    validate(
        field,
        fieldName,
        mustBe,
        undefinedAble,
        nullAble,
        customReason
    ) {
        if (field === undefined) {
            if (undefinedAble) return;
            throw this.instanceError(fieldName, customReason ?? "cannot be undefined");
        }

        if (field === null) {
            if (nullAble) return;
            throw this.instanceError(fieldName, customReason ?? "cannot be null");
        }

        const condition = typeof mustBe === "function" ? !mustBe(field) : typeof field !== mustBe;

        if(condition) {
            throw this.instanceError(fieldName, customReason ?? `must be a valid ${mustBe}`);
        };
    }

    instanceError(fieldName, reason) {
        const error = new this.throws("");
        error.message = `[VSRepository] (${error.type}) '${fieldName}' ${reason}.`;
        return error;
    }
}

export function validateConfig(config) {
    const validator = new FieldValidator(VSRepoConfigError);

    validator.validate(config, "config", "object");
    validator.validate(config.tableName, "tableName", "string");
    validator.validate(config.pkName, "pkName", "string");
    validator.validate(config.selectModels, "selectModels", "object", true);

    if(config.defaultSelectModel !== undefined) {
        validator.validate(config.defaultSelectModel, "defaultSelectModel", "string");

        validator.validate(config.defaultSelectModel, "defaultSelectModel", (field) => {
            return !!(config.selectModels && Object.keys(config.selectModels).includes(config.defaultSelectModel))
        }, false, false, "must be a valid key of 'selectModels'");
    }

    if(config.relations !== undefined) {
        validator.validate(config.relations, "relations", "object");

        for (const key of Object.keys(config.relations)) {
            const relation = config.relations[key];

            validator.validate(relation.pk, "pk", "string", false, false, `of relation '${key}' must be a string`);
            validator.validate(relation.mode, "mode", (field) => ['otm', 'mtm', 'mto', 'oto'].includes(field), false, false, `of relation '${key}' must be 'otm', 'mtm', 'mto' or 'oto'`);
            validator.validate(relation.restriction, "restriction", (field) => ['set', 'add'].includes(field), false, false, `of relation '${key}' must be 'set' or 'add'`);
        }
    }

    validator.validate(config.requiredWhere, "requiredWhere", "object", true);

    if(config.methods !== undefined) {
        validator.validate(config.methods, "methods", "object");

        for (const [key, value] of Object.entries(config.methods)) {
            validator.validate(value.map, "map", "boolean", false, false, `on ${key} must be a valid boolean`);
            validator.validate(value.whereType, "whereType", (field) => ['extending', 'overwrite'].includes(field), true, false, `on ${key} must be 'extending' or 'overwrite'`);
            validator.validate(value.selectModel, "selectModel", (field) => !!(field === false || (config.selectModels && Object.keys(config.selectModels).includes(field))), true, false, `on ${key} must be a valid key of 'selectModels'`);
            validator.validate(value.proxyTo, "proxyTo", "string", true, false, `on ${key} must be a valid string`);
            validator.validate(value.fbMode, "fbMode", (field) => ['one', 'list'].includes(field), true, false, `on ${key} must be 'one' or 'list'`);
            validator.validate(value.pushWhere, "pushWhere", "object", true, false, `on ${key} must be a valid object`);
            validator.validate(value.injectOrdenation, "injectOrdenation", "object", true, false, `on ${key} must be a valid object or array`);
            validator.validate(value.injectPagination, "injectPagination", "object", true, false, `on ${key} must be a valid object`);
        }
    }
}