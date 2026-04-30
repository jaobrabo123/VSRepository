export class VSRepoError extends Error {
    constructor(message, type){
        super(message);
        this.name = this.constructor.name;
        this.type = type;
    }
}

export class VSRepoConfigError extends VSRepoError {
    constructor(message){
        super(message, "VSREPO_CONFIG");
    }
}

export class VSRepoBuildError extends VSRepoError {
    constructor(message){
        super(message, "VSREPO_BUILD");
    }
}

export class VSRepoExtendError extends VSRepoError {
    constructor(message){
        super(message, "VSREPO_EXTEND");
    }
}

export class VSRepoRuntimeError extends VSRepoError {
    constructor(message){
        super(message, "VSREPO_RUNTIME");
    }
}

export class VSRepository {

    vsrepocache;
    tableName;
    pkName;
    selectModels;
    relations;
    requiredWhere;
    methods;

    constructor(config) {
        if(typeof config !== 'object' || config === null){
            throw new VSRepoConfigError(`[VSRepository] (config) 'config' must be a valid object.`);
        }
        if(typeof config.tableName !== 'string') {
            throw new VSRepoConfigError(`[VSRepository] (config) 'tableName' must be a valid string.`);
        }
        if(typeof config.pkName !== 'string') {
            throw new VSRepoConfigError(`[VSRepository] (config) 'pkName' must be a valid string.`);
        }
        if(config.selectModels !== undefined && typeof config.selectModels !== 'object' || config.selectModels === null) {
            throw new VSRepoConfigError(`[VSRepository] (config) 'selectModels' must be a valid object.`);
        }
        if(config.defaultSelectModel !== undefined) {
            if(!config.selectModels) {
                throw new VSRepoConfigError(`[VSRepository] (config) 'defaultSelectModel' can only be passed with 'selectModels'.`);
            }
            if(typeof config.defaultSelectModel !== 'string') {
                throw new VSRepoConfigError(`[VSRepository] (config) 'defaultSelectModel' must be a valid string.`);
            }
            if(!Object.keys(config.selectModels).includes(config.defaultSelectModel)){
                throw new VSRepoConfigError(`[VSRepository] (config) Invalid 'defaultSelectModel': ${config.defaultSelectModel}`);
            }
        }
        if(config.relations !== undefined) {
            const relations = config.relations;
            if(typeof relations !== 'object' || relations === null){
                throw new VSRepoConfigError(`[VSRepository] (config) 'relations' must be a valid object.`);
            }

            for (const key of Object.keys(relations)) {
                const relation = relations[key];
                if(typeof relation.pk !== 'string'){
                    throw new VSRepoConfigError(`[VSRepository] (config) The property 'pk' of relation '${key}' must be a string.`);
                }
                if(typeof relation.mode !== 'string'){
                    throw new VSRepoConfigError(`[VSRepository] (config) The property 'mode' of relation '${key}' must be 'otm', 'mtm', 'mto' or 'oto'.`);
                }
                if(typeof relation.restriction !== 'string'){
                    throw new VSRepoConfigError(`[VSRepository] (config) The property 'restriction' of relation '${key}' must be 'set' or 'add'.`);
                }
            }
        }
        if(config.requiredWhere !== undefined && typeof config.requiredWhere !== 'object' || config.requiredWhere === null) {
            throw new VSRepoConfigError(`[VSRepository] (config) 'requiredWhere' must be a valid object.`);
        }
        if(config.methods !== undefined) {
            if(typeof config.methods !== 'object' || config.methods === null){
                throw new VSRepoConfigError(`[VSRepository] (config) 'methods' must be a valid object.`);
            } else {
                for (const [key, value] of Object.entries(config.methods)) {

                    if(value.whereType !== undefined && !['extending', 'overwrite'].includes(value.whereType)){
                        throw new VSRepoConfigError(`[VSRepository] (config) Invalid 'whereType' on ${key}: ${value.whereType}`);
                    }

                    if(value.selectModel !== undefined && (!config.selectModels || !Object.keys(config.selectModels).includes(value.selectModel))){
                        throw new VSRepoConfigError(`[VSRepository] (config) Invalid 'selectModel' on ${key}: ${value.selectModel}`);
                    }

                }
            }
        }

        this.vsrepocache = new Map();
        this.tableName = config.tableName;
        this.pkName = config.pkName;
        this.selectModels = config.selectModels;
        this.defaultSelectModel = config.defaultSelectModel;
        this.relations = config.relations;
        this.requiredWhere = config.requiredWhere;
        this.methods = config.methods ?? {};
    }

    extend(extensionFunc) {
        if(typeof extensionFunc !== 'function'){
            throw new VSRepoExtendError(`[VSRepository] (extend) 'extensionFunc' must be a valid funcion.`);
        }
        const extension = extensionFunc(this);
        if(typeof extension !== 'object' || extension === null){
            throw new VSRepoExtendError(`[VSRepository] (extend) The return of the 'extensionFunc' must be a valid object.`)
        }
        return Object.assign(Object.create(this), extension);
    }

    build(prisma, config = {}) {
        const showWorking = config.showWorking;

        if(typeof config !== 'object' || config === null) {
            throw new VSRepoBuildError(`[VSRepository] (build) 'config' must be a valid object.`);
        }
        if(config.freeze === undefined) {
            config.freeze = true;
        }

        const relationsKeys = this.relations ? Object.keys(this.relations) : [];

        const methods = this.methods;
        const repositoryKeysToMap = Object.keys(methods);

        if(showWorking) {
            console.log(`[VSRepository] (build) Keys to map:`, JSON.stringify(repositoryKeysToMap, null, 2));
        }

        for (let keyToMap of repositoryKeysToMap) {
            
            let onlyBaseWheres = false;
            let ignoreWhere = false;
            let ignoreOrderByAndPagination = true;
            let ignoreSelect = false;
            let keyToMapReplaced;
            let argsCount = 0;
            let method;
            let dataIndex;
            let updateIndex;
            let createIndex;
            let originalKey = keyToMap;
            keyToMap = methods[originalKey].proxyTo ?? keyToMap;
            let existsMode = false;
            let skipDuplicates;
            let ignoreSkipDuplicates = true;
            let whereIndex
            const whereParams = [];
            const otherParams = [];

            if(keyToMap.startsWith('findUniqueBy')) {
                keyToMapReplaced = keyToMap.replace('findUniqueBy', '');
                method = 'findUnique';
            } else if(keyToMap.startsWith('findFirstBy')) {
                keyToMapReplaced = keyToMap.replace('findFirstBy', '')
                ignoreOrderByAndPagination = false;
                method = 'findFirst';
            } else if(keyToMap.startsWith('findFirst')) {
                keyToMapReplaced = keyToMap.replace('findFirst', '');
                ignoreOrderByAndPagination = false;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'findFirst';
            } else if(keyToMap.startsWith('countBy')) {
                keyToMapReplaced = keyToMap.replace('countBy', '');
                ignoreOrderByAndPagination = false;
                ignoreSelect = true;
                method = 'count';
            } else if(keyToMap.startsWith('count')) {
                keyToMapReplaced = keyToMap.replace('count', '');
                ignoreOrderByAndPagination = false;
                ignoreSelect = true;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'count';
            } else if(keyToMap.startsWith('existsBy')) {
                keyToMapReplaced = keyToMap.replace('existsBy', '');
                ignoreSelect = true;
                existsMode = true;
                method = 'findFirst';
            } else if(keyToMap.startsWith('findManyBy')) {
                keyToMapReplaced = keyToMap.replace('findManyBy', '');
                ignoreOrderByAndPagination = false;
                method = 'findMany';
            } else if(keyToMap.startsWith('findMany')) {
                keyToMapReplaced = keyToMap.replace('findMany', '');
                ignoreOrderByAndPagination = false;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'findMany';
            } else if(keyToMap.startsWith('createManyAndReturn')) {
                keyToMapReplaced = keyToMap.replace('createManyAndReturn', '')
                ignoreWhere = true;
                ignoreSkipDuplicates = false;
                method = 'createManyAndReturn';
                dataIndex = 0;
                otherParams.push('data');
                argsCount++;
            } else if(keyToMap.startsWith('createMany')) {
                keyToMapReplaced = keyToMap.replace('createMany', '')
                ignoreWhere = true;
                ignoreSelect = true;
                ignoreSkipDuplicates = false;
                method = 'createMany';
                dataIndex = 0;
                otherParams.push('data');
                argsCount++;
            } else if(keyToMap.startsWith('create')) {
                keyToMapReplaced = keyToMap.replace('create', '')
                ignoreWhere = true;
                method = 'create';
                dataIndex = 0
                otherParams.push('data');
                argsCount++;
            } else if(keyToMap.startsWith('updateManyAndReturnBy')) {
                keyToMapReplaced = keyToMap.replace('updateManyAndReturnBy', '')
                method = 'updateManyAndReturn';
                dataIndex = -2;
                otherParams.push('data');
                argsCount++;
            } else if(keyToMap.startsWith('updateManyBy')) {
                keyToMapReplaced = keyToMap.replace('updateManyBy', '')
                ignoreSelect = true;
                method = 'updateMany';
                dataIndex = -2;
                otherParams.push('data');
                argsCount++;
            } else if(keyToMap.startsWith('updateBy')) {
                keyToMapReplaced = keyToMap.replace('updateBy', '')
                method = 'update';
                dataIndex = -2;
                otherParams.push('data');
                argsCount++;
            } else if(keyToMap.startsWith('upsertBy')) {
                keyToMapReplaced = keyToMap.replace('upsertBy', '')
                method = 'upsert';
                createIndex = -2;
                updateIndex = -3;
                otherParams.push('update');
                otherParams.push('create');
                argsCount += 2;
            } else if(keyToMap.startsWith('deleteManyBy')) {
                keyToMapReplaced = keyToMap.replace('deleteManyBy', '')
                ignoreSelect = true;
                method = 'deleteMany';
            } else if(keyToMap.startsWith('deleteBy')) {
                keyToMapReplaced = keyToMap.replace('deleteBy', '')
                method = 'delete';
            } else if(keyToMap.startsWith('findWhere')) {
                keyToMapReplaced = keyToMap.replace('findWhere', '');
                ignoreOrderByAndPagination = false;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'findFirst';
                whereIndex = 0;
                otherParams.push('where');
                argsCount += 1;
            } else if(keyToMap.startsWith('findListWhere')) {
                keyToMapReplaced = keyToMap.replace('findListWhere', '');
                ignoreOrderByAndPagination = false;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'findMany';
                whereIndex = 0;
                otherParams.push('where');
                argsCount += 1;
            } else if(keyToMap.startsWith('findBy')) {
                keyToMapReplaced = keyToMap.replace('findBy', '');
                ignoreOrderByAndPagination = false;
                method = methods[originalKey].fbMode === 'one' ? 'findFirst' : 'findMany';
            } else {
                throw new VSRepoBuildError(`[VSRepository] (build) Unknown method: ${keyToMap}.`);
            }


            if(!ignoreSkipDuplicates) {
                if(keyToMapReplaced.endsWith('SkipDuplicates')) {
                    keyToMapReplaced = keyToMapReplaced.replace('SkipDuplicates', '');
                    skipDuplicates = true;
                }
            }

            let orderPosition;
            let paginationPosition;

            if(!ignoreOrderByAndPagination) {

                if(keyToMapReplaced.endsWith('PaginatedAndOrdered')) {
                    orderPosition = -2;
                    paginationPosition = -3;

                    otherParams.push('pagination');
                    otherParams.push('order');
                    
                    keyToMapReplaced = keyToMapReplaced.replace('PaginatedAndOrdered', '')

                    argsCount+=2
                } else if(keyToMapReplaced.endsWith('OrderedAndPaginated')) {
                    orderPosition = -3;
                    paginationPosition = -2;

                    otherParams.push('order');
                    otherParams.push('pagination');
                    
                    keyToMapReplaced = keyToMapReplaced.replace('OrderedAndPaginated', '')

                    argsCount+=2
                } else if(keyToMapReplaced.endsWith('Paginated')) {
                    paginationPosition = -2;

                    otherParams.push('pagination');
                    
                    keyToMapReplaced = keyToMapReplaced.replace('Paginated', '')

                    argsCount++
                } else if(keyToMapReplaced.endsWith('Ordered')) {
                    orderPosition = -2;

                    otherParams.push('order');
                    
                    keyToMapReplaced = keyToMapReplaced.replace('Ordered', '')

                    argsCount++
                }

            }

            const whereArgs = [];
            let whereType = methods[originalKey].whereType ?? 'extending';
            let pushWhere = methods[originalKey].pushWhere;
            let whereResolved;

            if(!ignoreWhere) {

                function buildWhere(keySplitedAnd) {

                    const buildedWhere = {}

                    if(keySplitedAnd.includes('Insensitive')){
                        buildedWhere.properties = {}
                        buildedWhere.properties.mode = 'insensitive';
                        keySplitedAnd = keySplitedAnd.replace('Insensitive', '')
                    }

                    if(keySplitedAnd.includes('NotStartsWith')){
                        buildedWhere.pushProperty = 'not.startsWith';
                        keySplitedAnd = keySplitedAnd.replace('NotStartsWith', '')
                    } else if(keySplitedAnd.includes('StartsWith')){
                        buildedWhere.pushProperty = 'startsWith';
                        keySplitedAnd = keySplitedAnd.replace('StartsWith', '')
                    } else if(keySplitedAnd.includes('NotEndsWith')){
                        buildedWhere.pushProperty = 'not.endsWith';
                        keySplitedAnd = keySplitedAnd.replace('NotEndsWith', '')
                    } else if(keySplitedAnd.includes('EndsWith')){
                        buildedWhere.pushProperty = 'endsWith';
                        keySplitedAnd = keySplitedAnd.replace('EndsWith', '')
                    } else if(keySplitedAnd.includes('NotContains')){
                        buildedWhere.pushProperty = 'not.contains';
                        keySplitedAnd = keySplitedAnd.replace('NotContains', '')
                    } else if(keySplitedAnd.includes('Contains')){
                        buildedWhere.pushProperty = 'contains';
                        keySplitedAnd = keySplitedAnd.replace('Contains', '')
                    } else if(keySplitedAnd.includes('LessThanEqual')){
                        buildedWhere.pushProperty = 'lte';
                        keySplitedAnd = keySplitedAnd.replace('LessThanEqual', '')
                    } else if(keySplitedAnd.includes('LessThan')){
                        buildedWhere.pushProperty = 'lt';
                        keySplitedAnd = keySplitedAnd.replace('LessThan', '')
                    } else if(keySplitedAnd.includes('GreaterThanEqual')){
                        buildedWhere.pushProperty = 'gte';
                        keySplitedAnd = keySplitedAnd.replace('GreaterThanEqual', '')
                    } else if(keySplitedAnd.includes('GreaterThan')){
                        buildedWhere.pushProperty = 'gt';
                        keySplitedAnd = keySplitedAnd.replace('GreaterThan', '')
                    } else if(keySplitedAnd.includes('NotIn')){
                        buildedWhere.pushProperty = 'notIn';
                        keySplitedAnd = keySplitedAnd.replace('NotIn', '')
                    } else if(keySplitedAnd.includes('In')){
                        buildedWhere.pushProperty = 'in';
                        keySplitedAnd = keySplitedAnd.replace('In', '')
                    } else if(keySplitedAnd.includes('Not')){
                        buildedWhere.pushProperty = 'not';
                        keySplitedAnd = keySplitedAnd.replace('Not', '')
                    } else {
                        buildedWhere.pushProperty = '$$$';
                    }

                    keySplitedAnd = keySplitedAnd[0].toLowerCase() + keySplitedAnd.slice(1, keySplitedAnd.length)

                    buildedWhere.name = keySplitedAnd;

                    return buildedWhere;

                }
                
                let ANDMode = false
                let keysSplitedAND = keyToMapReplaced.split("AND");
                if(keysSplitedAND.length > 1) {
                    ANDMode = true;
                }
                
                keysSplitedAND.forEach((keySplitedAND, idx)=>{

                    let orMode = false;
                    let keysSplitedOr = idx === 0 ? keySplitedAND.split('Or') : [keySplitedAND];
                    if(keysSplitedOr.length > 1){
                        orMode = true;
                    }

                    for (let i = 0; i < keysSplitedOr.length; i++) {

                        const keysSplitedAnd = keysSplitedOr[i].split('And')

                        for (const keySplitedAnd of keysSplitedAnd) {
                            
                            const buildedWhere = buildWhere(keySplitedAnd);

                            if(!orMode) {
                                if(idx === 1 && ANDMode){
                                    buildedWhere.name = `AND.${i}idx.${buildedWhere.name}`;
                                }
                                whereArgs.push(buildedWhere);
                            } else {
                                buildedWhere.name = `OR.${i}idx.${buildedWhere.name}`;
                                whereArgs.push(buildedWhere);
                            }

                            if(showWorking) {
                                console.log(`[VSRepository] (build) Where object builded to ${keyToMap}:\n`, JSON.stringify(buildedWhere, null, 2));
                            }

                            argsCount++
                        }

                    }

                });

                whereResolved = whereArgs.map(arg=>{
                    let context = [];
                    let otherProps

                    let argName = arg.name;
                    const agrNameSplitedOr = argName.split('OR.')
                    if(agrNameSplitedOr.length > 1) {
                        const agrNameSplitedOrIdx = agrNameSplitedOr[1].split('idx.')
                        context.push('OR')
                        context.push(Number(agrNameSplitedOrIdx[0]))
                        argName = agrNameSplitedOrIdx[1]
                    } else {
                        const agrNameSplitedAND = argName.split('AND.');
                        if(agrNameSplitedAND.length > 1) {
                            const agrNameSplitedANDIdx = agrNameSplitedAND[1].split('idx.')
                            context.push('AND')
                            context.push(Number(agrNameSplitedANDIdx[0]))
                            argName = agrNameSplitedANDIdx[1];
                        }
                    }

                    context.push(argName)
                    if(arg.pushProperty !== '$$$'){
                        const pushProperty = arg.pushProperty;
                        const pushPropertySplitedNot = pushProperty.split('not.');
                        if(pushPropertySplitedNot.length > 1) {
                            context.push('not')
                            context.push(pushPropertySplitedNot[1])
                        } else {
                            context.push(pushProperty);
                        }
                    }

                    if(arg.properties !== undefined) {
                        const propertiesKeys = Object.keys(arg.properties);
                        otherProps = {}
                        for (let i = 0; i < propertiesKeys.length; i++) {
                            const key = propertiesKeys[i]
                            otherProps[key] = arg.properties[key]
                        }
                        if(arg.pushProperty === '$$$'){
                            context.push('equals');
                        }
                    }

                    whereParams.push(argName);
                    return { context, otherProps, argName };
                });
                if(showWorking) {
                    console.log(`[VSRepository] (build) Where object resolved to ${keyToMap}:\n`, JSON.stringify(whereResolved, null, 2));
                }
            }

            let select;
            if(!ignoreSelect) {

                const providedSelectModel = methods[originalKey].selectModel;

                if(providedSelectModel) {
                    select = this.selectModels[providedSelectModel];
                } else if(this.defaultSelectModel) {
                    select = this.selectModels[this.defaultSelectModel];
                }

            }
            if(existsMode) {
                select = { [this.pkName]: true };
            }

            this.vsrepocache.set(originalKey, (args, optionsSelectModel) => {
                const prismaArgs = {};

                if(select) {
                    prismaArgs.select = optionsSelectModel && !existsMode ? this.selectModels[optionsSelectModel] : select;
                }

                if(orderPosition !== undefined) {
                    prismaArgs.orderBy = args.at(orderPosition);
                }
                if(paginationPosition !== undefined) {
                    const paginate = args.at(paginationPosition);
                    prismaArgs.skip = paginate.skip;
                    prismaArgs.take = paginate.take;
                    prismaArgs.cursor = paginate.cursor;
                }

                if(skipDuplicates!==undefined){
                    prismaArgs.skipDuplicates = skipDuplicates;
                }

                const assignWhere = (where) => {
                    if(whereType==='extending' && this.requiredWhere) {
                        let safeRequiredWhere = structuredClone(this.requiredWhere);
                        if(where.OR && safeRequiredWhere.OR) safeRequiredWhere.OR = safeRequiredWhere.OR.concat(where.OR)
                        if(where.AND && safeRequiredWhere.AND) safeRequiredWhere.AND = safeRequiredWhere.AND.concat(where.AND)
                        Object.assign(where, safeRequiredWhere);
                    }
                    if(pushWhere !== undefined) {
                        let safePushWhere = structuredClone(pushWhere);
                        if(where.OR && safePushWhere.OR) safePushWhere.OR = safePushWhere.OR.concat(where.OR)
                        if(where.AND && safePushWhere.AND) safePushWhere.AND = safePushWhere.AND.concat(where.AND)
                        Object.assign(where, safePushWhere);
                    }
                }

                if(!ignoreWhere) {

                    const where = {};
                    let OR;
                    let AND;
                    
                    for (let j = 0; j < whereResolved.length; j++) {
                        let path = {}
                        let current = path
                        let ormode = false;
                        let andmode = false;
                        let modeIdx;
                        const currentWhereRslvd = whereResolved[j];
                        const context = currentWhereRslvd.context
                        const contextLength = context.length;
                        const contextLengthM1 = contextLength-1;
                        for (let i = 0; i < contextLength; i++) {
                            if(i<contextLengthM1){
                                if(context[i]==='OR'){
                                    ormode = true;
                                } else if(context[i]==='AND'){
                                    andmode = true;
                                } else if(typeof context[i] === 'number'){
                                    modeIdx = context[i];
                                } else {
                                    if(!current[context[i]]) current[context[i]] = {};
                                    current = current[context[i]];
                                }
                            } else {
                                current[context[i]] = args[j];
                            }
                        }

                        if (ormode) {
                            if(!OR) OR = [];
                            if(!OR[modeIdx]) OR[modeIdx] = {}
                            if(currentWhereRslvd.otherProps !== undefined) {
                                Object.assign(path[currentWhereRslvd.argName], currentWhereRslvd.otherProps)
                            }
                            Object.assign(OR[modeIdx], path)
                        } else if(andmode) {
                            if(!AND) AND = [];
                            if(!AND[modeIdx]) AND[modeIdx] = {}
                            if(currentWhereRslvd.otherProps !== undefined) {
                                Object.assign(path[currentWhereRslvd.argName], currentWhereRslvd.otherProps)
                            }
                            Object.assign(AND[modeIdx], path)
                        } else {
                            if(currentWhereRslvd.otherProps !== undefined) {
                                Object.assign(path[currentWhereRslvd.argName], currentWhereRslvd.otherProps)
                            }
                            Object.assign(where, path);
                        }
                    }

                    if(OR) where.OR = OR;
                    if(AND) where.AND = AND;
                    
                    assignWhere(where);
                    
                    prismaArgs.where = where;
                } else if(onlyBaseWheres) {
                    const where = whereIndex !== undefined ? args.at(whereIndex) : {};

                    assignWhere(where);

                    prismaArgs.where = where;
                }

                if(dataIndex !== undefined) {
                    prismaArgs.data = args.at(dataIndex);
                }
                if(updateIndex !== undefined) {
                    prismaArgs.update = args.at(updateIndex);
                }
                if(createIndex !== undefined) {
                    prismaArgs.create = args.at(createIndex);
                }

                return prismaArgs;
            }) 

            this[originalKey] = async (...args) => {
                
                let db = prisma;
                let optionsSelectModel;
                if(args.length < argsCount) {
                    const missingParams = whereParams.concat(otherParams).slice(args.length);
                    throw new VSRepoRuntimeError(`[VSRepository] (runtime) Missing parameters: ${missingParams.join(', ')}`);
                } else if(args.length > argsCount) {
                    const optionsArg = args[args.length - 1]
                    db = optionsArg.db;
                    optionsSelectModel = optionsArg.selectModel
                } else {
                    args.push('1')
                }

                const prismaArgs = this.vsrepocache.get(originalKey)(args, optionsSelectModel);

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (runtime) Executing ${method} on ${this.tableName}.`);
                    console.log(`[VSRepository] (runtime) Built arguments to ${method} on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }

                try {
                    const result = await db[this.tableName][method](prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (runtime) Executed ${method} on ${this.tableName} (took: ${duration}ms).`);
                    }

                    if(existsMode) {
                        return !!result;
                    }
                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (runtime) Fatal error when executing ${method} on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
                
            }

        }

        if(config.baseMethods?.get?.active !== false) {
            this.get = async(pk, options = {}) => {
                let db;
                if(options?.db) db = options.db;
                else db = prisma;

                const prismaArgs = {};

                const where = { [this.pkName]: pk };
                if(this.requiredWhere && !config.baseMethods?.get?.ignoreRequiredWhere) {
                    Object.assign(where, this.requiredWhere);
                }
                prismaArgs.where = where;

                let selectModelKey = options?.selectModel ?? config.baseMethods?.get?.defaultSelect ?? this.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = this.selectModels[selectModelKey];
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (runtime) Executing get on ${this.tableName}.`);
                    console.log(`[VSRepository] (runtime) Built arguments to get on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }

                try {
                    const result = await db[this.tableName].findUnique(prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (runtime) Executed get on ${this.tableName} (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (runtime) Fatal error when trying to get on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.remove?.active !== false) {
            this.remove = async (pk, options = {}) => {
                let db;
                if(options?.db) db = options.db;
                else db = prisma;

                const prismaArgs = {};

                const where = { [this.pkName]: pk };
                if(this.requiredWhere && !config.baseMethods?.remove?.ignoreRequiredWhere) {
                    Object.assign(where, this.requiredWhere);
                }
                prismaArgs.where = where;

                let selectModelKey = options?.selectModel ?? config.baseMethods?.remove?.defaultSelect ?? this.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = this.selectModels[selectModelKey];
                }
                
                let start;
                if(showWorking){
                    console.log(`[VSRepository] (runtime) Executing remove on ${this.tableName}.`);
                    console.log(`[VSRepository] (runtime) Built arguments to remove on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }
                try {
                    const result = await db[this.tableName].delete(prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (runtime) Executed remove on ${this.tableName} (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (runtime) Fatal error when trying to remove on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.save?.active !== false) {
            this.save = async (obj, options = {}) => {
                let db;
                if(options?.db) db = options.db;
                else db = prisma;

                const prismaArgs = {};

                let selectModelKey = options?.selectModel ?? config.baseMethods?.save?.defaultSelect ?? this.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = this.selectModels[selectModelKey];
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (runtime) Executing save on ${this.tableName}.`);
                    start = performance.now();
                }

                try {
                    let result;
                    if(obj[this.pkName] !== undefined){
                        prismaArgs.create = {};
                        prismaArgs.update = {};

                        const keys = Object.keys(obj);
                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            const field = obj[key];

                            if(field === undefined) continue;

                            if(relationsKeys.includes(key)){
                                const relation = this.relations[key];
                                const relationMode = relation.mode;
                                const relationRestriction = relation.restriction;
                                const relationPk = relation.pk;

                                if(relationMode === 'oto' || relationMode === 'mto') {
                                    if(field === null) {
                                        if(relationMode === 'oto' && relationRestriction === 'set') {
                                            prismaArgs.update[key] = { delete: true };
                                        } else if(relationMode === 'mto' && relation.nullAble) {
                                            prismaArgs.update[key] = { disconnect: true };
                                        }
                                    } else if (field !== undefined) {
                                        const relationFieldPk = field[relationPk];
                                        if(relationFieldPk){
                                            const connectOrCreate = {
                                                where: { [relationPk]: relationFieldPk },
                                                create: field
                                            };

                                            prismaArgs.create[key] = { connectOrCreate };

                                            if(relationRestriction === 'add') {
                                                prismaArgs.update[key] = { connectOrCreate };
                                            } else {
                                                const update = {...field};
                                                delete update[relationPk];

                                                prismaArgs.update[key] = {
                                                    upsert: {
                                                        where: { [relationPk]: relationFieldPk },
                                                        create: field,
                                                        update: update
                                                    }
                                                };
                                            }
                                        } else {
                                            prismaArgs.create[key] = { create: field };
                                            prismaArgs.update[key] = { create: field };
                                        }
                                    }
                                } else if(Array.isArray(field)) {
                                    const dataWithPk = field.filter(data=>data[relationPk]!==undefined);
                                    const dataWithoutPk = field.filter(data=>data[relationPk]===undefined);

                                    const connectOrCreate = dataWithPk.map(data=>({
                                        where: { [relationPk]: data[relationPk] },
                                        create: data
                                    }));

                                    prismaArgs.create[key] = {
                                        create: dataWithoutPk,
                                        connectOrCreate
                                    };

                                    if(relationRestriction === 'add') {
                                        if(relationMode === 'mtm') {
                                            prismaArgs.update[key] = {
                                                create: dataWithoutPk,
                                                connectOrCreate
                                            }
                                        } else {
                                            prismaArgs.update[key] = {
                                                create: dataWithoutPk,
                                                upsert: dataWithPk.map(data=>{
                                                    const update = { ...data };
                                                    delete update[relationPk];
                                                    return {
                                                        where: { [relationPk]: data[relationPk] },
                                                        create: data, update
                                                    }
                                                })
                                            }
                                        }
                                    } else {
                                        if(relationMode === 'mtm') {
                                            prismaArgs.update[key] = {
                                                set: [],
                                                create: dataWithoutPk,
                                                connectOrCreate
                                            }
                                        } else {
                                            prismaArgs.update[key] = {
                                                deleteMany: { [relationPk]: { notIn: dataWithPk.map(data=>data[relationPk]) } },
                                                create: dataWithoutPk,
                                                upsert: dataWithPk.map(data=>{
                                                    const update = { ...data };
                                                    delete update[relationPk];
                                                    return {
                                                        where: { [relationPk]: data[relationPk] },
                                                        create: data, update
                                                    }
                                                })
                                            }
                                        }
                                    }
                                }
                            } else {
                                prismaArgs.create[key] = field;
                                if(key !== this.pkName) {
                                    prismaArgs.update[key] = field;
                                }
                            }
                        }

                        const where = { [this.pkName]: obj[this.pkName] };
                        if(this.requiredWhere && !config.baseMethods?.save?.ignoreRequiredWhere) {
                            Object.assign(where, this.requiredWhere);
                        }
                        prismaArgs.where = where;

                        if(showWorking) {
                            console.log(`[VSRepository] (runtime) Built arguments to save on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                        }

                        result = await db[this.tableName].upsert(prismaArgs);
                    } else {
                        prismaArgs.data = {};

                        const keys = Object.keys(obj);
                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            const field = obj[key];

                            if(field == null) continue;

                            if(relationsKeys.includes(key)){
                                const relation = this.relations[key];
                                const relationMode = relation.mode;
                                const relationPk = relation.pk;

                                if(relationMode === 'otm' || relationMode === 'mtm') {
                                    const dataWithPk = field.filter(data=>data[relationPk]!==undefined);
                                    const dataWithoutPk = field.filter(data=>data[relationPk]===undefined);

                                    prismaArgs.data[key] = {
                                        create: dataWithoutPk,
                                        connectOrCreate: dataWithPk.map(data=>({
                                            where: { [relationPk]: data[relationPk] },
                                            create: data
                                        }))
                                    }
                                } else {
                                    const relationFieldPk = field[relationPk];
                                    if(relationFieldPk !== undefined) {
                                        prismaArgs.data[key] = {
                                            connectOrCreate: {
                                                where: { [relationPk]: relationFieldPk },
                                                create: field
                                            }
                                        }
                                    } else {
                                        prismaArgs.data[key] = {
                                            create: field
                                        }
                                    }
                                }
                            } else {
                                prismaArgs.data[key] = field;
                            }
                        }

                        if(showWorking) {
                            console.log(`[VSRepository] (runtime) Built arguments to save on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                        }

                        result = await db[this.tableName].create(prismaArgs);
                    }

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (runtime) Executed save on ${this.tableName} (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (runtime) Fatal error when trying to save on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }

        if(config.freeze) Object.freeze(this)
        return this;
    }

}

export const setupVSRepo = () => (config) => new VSRepository(config);
