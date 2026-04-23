export class VSRepository {

    tableName;
    showWorking = false;
    pkName;
    vsrepocache = new Map();

    build(prisma, config = {}) {
        const className = this.constructor.name;

        if(typeof config !== 'object' || config === null) {
            throw new Error(`[VSRepository] (${className}: build) Config must be a valid object: ${keyToMap}.`);
        }
        if(config.freeze === undefined) {
            config.freeze = true;
        }

        const whereTypes = ['extending', 'overwrite'];

        const repositoryKeys = Object.keys(this);

        const [repositoryKeysToMap, repositoryUnmappedKeys] = repositoryKeys.reduce((acc, key)=>{
            if(['tableName', 'selectModels', 'requiredWhere', 'showWorking', 'get', 'remove', 'save'].includes(key) || typeof this[key] !== 'object' || this[key] === null || !this[key].map) {
                acc[1].push(key)
            } else {
                acc[0].push(key)
            }
            return acc
        }, [[],[]]);

        if(this.showWorking) {
            console.log(`[VSRepository] (${className}: build) Keys to map:`, JSON.stringify(repositoryKeysToMap, null, 2))
            console.log(`[VSRepository] (${className}: build) Keys to ignore:`, JSON.stringify(repositoryUnmappedKeys, null, 2))
        }

        for (let keyToMap of repositoryKeysToMap) {
            
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
            keyToMap = this[originalKey].proxyTo ?? keyToMap;
            let existsMode = false;
            let skipDuplicates;
            let ignoreSkipDuplicates = true;
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
            } else {
                throw new Error(`[VSRepository] (${className}: build) Unknown method: ${keyToMap}.`);
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
            let whereType;
            let pushWhere;
            let whereResolved;

            if(!ignoreWhere) {

                whereType = this[originalKey].whereType ?? 'extending';
                if(!whereTypes.includes(whereType)){
                    throw new Error(`[VSRepository] (${className}: build) Invalid whereType: ${whereType}`);
                }

                pushWhere = this[originalKey].pushWhere;

                let orMode = false;
                let keysSplitedOr = keyToMapReplaced.split('Or');
                if(keysSplitedOr.length > 1){
                    orMode = true;
                }

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

                for (let i = 0; i < keysSplitedOr.length; i++) {

                    const keysSplitedAnd = keysSplitedOr[i].split('And')

                    for (const keySplitedAnd of keysSplitedAnd) {
                        
                        const buildedWhere = buildWhere(keySplitedAnd);

                        if(!orMode) {
                            whereArgs.push(buildedWhere)
                        } else {
                            buildedWhere.name = `OR.${i}idx.${buildedWhere.name}`;
                            whereArgs.push(buildedWhere)
                        }

                        if(this.showWorking) {
                            console.log(`[VSRepository] (${className}: build) Where object builded to ${keyToMap}:\n`, JSON.stringify(buildedWhere, null, 2));
                        }

                        argsCount++
                    }

                }

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
                        otherProps = {}
                        for (const key in arg.properties) {
                            otherProps[key] = arg.properties[key]
                        }
                    }

                    whereParams.push(argName);
                    
                    return { context, otherProps };
                });
                if(this.showWorking) {
                    console.log(`[VSRepository] (${className}: build) Where object resolved to ${keyToMap}:\n`, JSON.stringify(whereResolved, null, 2));
                }
            }

            let select;
            if(!ignoreSelect) {

                const providedSelectModel = this[originalKey].selectModel;

                if(providedSelectModel) {
                    if(!this.selectModels || !Object.keys(this.selectModels).includes(providedSelectModel)){
                        throw new Error(`[VSRepository] (${className}: build) Invalid selectModel: ${providedSelectModel}`);
                    }
                    select = this.selectModels[providedSelectModel];
                } else if(this.defaultSelectModel) {
                    if(!Object.keys(this.selectModels).includes(this.defaultSelectModel)){
                        throw new Error(`[VSRepository] (${className}: build) Invalid defaultSelectModel: ${this.defaultSelectModel}`);
                    }
                    select = this.selectModels[this.defaultSelectModel];
                }

            }
            if(existsMode) {
                select = { [this.pkName]: true };
            }

            this.vsrepocache.set(originalKey, (args) => {
                const prismaArgs = {};

                if(select) {
                    prismaArgs.select = select;
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

                if(!ignoreWhere) {

                    const where = {};
                    let OR;
                    
                    for (let j = 0; j < whereResolved.length; j++) {
                        let path = {}
                        let current = path
                        let ormode = false;
                        let oridx;
                        const context = whereResolved[j].context
                        const contextLength = context.length;
                        const contextLengthM1 = contextLength-1;
                        for (let i = 0; i < contextLength; i++) {
                            if(i<contextLengthM1){
                                if(context[i]==='OR'){
                                    ormode = true;
                                } else if(typeof context[i] === 'number'){
                                    oridx = context[i];
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
                            if(!OR[oridx]) OR[oridx] = {}
                            Object.assign(OR[oridx], path)
                        } else {
                            Object.assign(where, path);
                        }
                    }

                    if(OR) where.OR = OR;
                    if(pushWhere !== undefined) {
                        let safePushWhere = { ...pushWhere };
                        if(where.OR && safePushWhere.OR) safePushWhere.OR = safePushWhere.OR.concat(where.OR)
                        Object.assign(where, safePushWhere);
                    }
                    if(whereType==='extending') {
                        let requiredWhere = { ...this.requiredWhere };
                        if(where.OR && requiredWhere.OR) requiredWhere.OR = requiredWhere.OR.concat(where.OR)
                        Object.assign(where, requiredWhere);
                    }
                    
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
                if(args.length < argsCount) {
                    const missingParams = whereParams.concat(otherParams).slice(args.length);
                    throw new Error(`[VSRepository] (${className}: runtime) Missing parameters: ${missingParams.join(', ')}`);
                } else if(args.length > argsCount) {
                    db = args[args.length - 1];
                } else {
                    args.push('1')
                }

                const prismaArgs = this.vsrepocache.get(originalKey)(args);

                let start;
                if(this.showWorking){
                    console.log(`[VSRepository] (${className}: runtime) Executing ${method} on ${this.tableName}.`);
                    console.log(`[VSRepository] (${className}: runtime) Built arguments to ${method} on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }

                try {
                    const result = await db[this.tableName][method](prismaArgs);

                    if(this.showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${className}: runtime) Executed ${method} on ${this.tableName} (took: ${duration}ms).`);
                    }

                    if(existsMode) {
                        return !!result;
                    }
                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${className}: runtime) Fatal error when executing ${method} on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
                
            }

        }

        if(config.baseMethods?.get !== false) {
            this.get = async(pk, db) => {
                if(db===undefined) db = prisma;

                const prismaArgs = {};

                const where = { [this.pkName]: pk };
                if(this.requiredWhere) {
                    Object.assign(where, this.requiredWhere);
                }
                prismaArgs.where = where;

                if(this.defaultSelectModel) {
                    prismaArgs.select = this.selectModels[this.defaultSelectModel];
                }

                let start;
                if(this.showWorking){
                    console.log(`[VSRepository] (${className}: runtime) Executing get on ${this.tableName}.`);
                    console.log(`[VSRepository] (${className}: runtime) Built arguments to get on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }

                try {
                    const result = await db[this.tableName].findUniqueOrThrow(prismaArgs);

                    if(this.showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${className}: runtime) Executed get on ${this.tableName} (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${className}: runtime) Fatal error when trying to get on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.remove !== false) {
            this.remove = async (pk, db) => {
                if(db===undefined) db = prisma;

                const prismaArgs = {};

                const where = { [this.pkName]: pk };
                if(this.requiredWhere) {
                    Object.assign(where, this.requiredWhere);
                }
                prismaArgs.where = where;

                if(this.defaultSelectModel) {
                    prismaArgs.select = this.selectModels[this.defaultSelectModel];
                }
                
                let start;
                if(this.showWorking){
                    console.log(`[VSRepository] (${className}: runtime) Executing remove on ${this.tableName}.`);
                    console.log(`[VSRepository] (${className}: runtime) Built arguments to remove on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }
                try {
                    const result = await db[this.tableName].delete(prismaArgs);

                    if(this.showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${className}: runtime) Executed remove on ${this.tableName} (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${className}: runtime) Fatal error when trying to remove on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.save !== false) {
            this.save = async (obj, db) => {
                if(db===undefined) db = prisma;

                const prismaArgs = {};
                if(this.defaultSelectModel) {
                    prismaArgs.select = this.selectModels[this.defaultSelectModel];
                }

                let start;
                if(this.showWorking){
                    console.log(`[VSRepository] (${className}: runtime) Executing save on ${this.tableName}.`);
                    start = performance.now();
                }

                try {
                    let result;
                    if(obj[this.pkName] !== undefined){
                        const update = {...obj};
                        delete update[this.pkName]

                        prismaArgs.create = obj;
                        prismaArgs.update = update;

                        const where = { [this.pkName]: obj[this.pkName] };
                        if(this.requiredWhere) {
                            Object.assign(where, this.requiredWhere);
                        }
                        prismaArgs.where = where;

                        if(this.showWorking) {
                            console.log(`[VSRepository] (${className}: runtime) Built arguments to save on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                        }

                        result = await db[this.tableName].upsert(prismaArgs);
                    } else {
                        prismaArgs.data = obj;

                        if(this.showWorking) {
                            console.log(`[VSRepository] (${className}: runtime) Built arguments to save on ${this.tableName}:\n`, JSON.stringify(prismaArgs, null, 2));
                        }

                        result = await db[this.tableName].create(prismaArgs);
                    }

                    if(this.showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${className}: runtime) Executed save on ${this.tableName} (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${className}: runtime) Fatal error when trying to save on ${this.tableName}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }

        if(config.freeze) Object.freeze(this)
        return this;
    }

}
