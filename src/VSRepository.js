const VSRepositoryCache = {};

export class VSRepository {

    tableName;
    prisma;
    showWorking = false;

    constructor(prisma) {
        this.prisma = prisma;
    }

    build() {
        const className = this.constructor.name;

        const whereTypes = ['extending', 'overwrite'];

        const repositoryKeys = Object.keys(this);

        const [repositoryKeysToMap, repositoryUnmappedKeys] = repositoryKeys.reduce((acc, key)=>{
            if(['tableName', 'selectModels', 'requiredWhere', 'prisma', 'showWorking'].includes(key) || typeof this[key] !== 'object' || this[key] === null || !this[key].map) {
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

            // console.log('this', this)

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
            } else if(keyToMap.startsWith('existsBy')) {
                keyToMapReplaced = keyToMap.replace('existsBy', '');
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
                method = 'createManyAndReturn';
                dataIndex = 0
                argsCount++;
            } else if(keyToMap.startsWith('createMany')) {
                keyToMapReplaced = keyToMap.replace('createMany', '')
                ignoreWhere = true;
                ignoreSelect = true;
                method = 'createMany';
                dataIndex = 0
                argsCount++;
            } else if(keyToMap.startsWith('create')) {
                keyToMapReplaced = keyToMap.replace('create', '')
                ignoreWhere = true;
                method = 'create';
                dataIndex = 0
                argsCount++;
            } else if(keyToMap.startsWith('updateManyAndReturnBy')) {
                keyToMapReplaced = keyToMap.replace('updateManyAndReturnBy', '')
                method = 'updateManyAndReturn';
                dataIndex = -2;
                argsCount++;
            } else if(keyToMap.startsWith('updateManyBy')) {
                keyToMapReplaced = keyToMap.replace('updateManyBy', '')
                ignoreSelect = true;
                method = 'updateMany';
                dataIndex = -2;
                argsCount++;
            } else if(keyToMap.startsWith('updateBy')) {
                keyToMapReplaced = keyToMap.replace('updateBy', '')
                method = 'update';
                dataIndex = -2;
                argsCount++;
            } else if(keyToMap.startsWith('upsertBy')) {
                keyToMapReplaced = keyToMap.replace('upsertBy', '')
                method = 'upsert';
                createIndex = -2;
                updateIndex = -3;
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


            const prismaArgs = {}

            let orderPosition;
            let paginationPosition;

            if(!ignoreOrderByAndPagination) {

                if(keyToMapReplaced.endsWith('PaginatedAndOrdered')) {
                    orderPosition = -2;
                    paginationPosition = -3;
                    
                    keyToMapReplaced = keyToMapReplaced.replace('PaginatedAndOrdered', '')

                    argsCount+=2
                } else if(keyToMapReplaced.endsWith('OrderedAndPaginated')) {
                    orderPosition = -3;
                    paginationPosition = -2;
                    
                    keyToMapReplaced = keyToMapReplaced.replace('OrderedAndPaginated', '')

                    argsCount+=2
                } else if(keyToMapReplaced.endsWith('Paginated')) {
                    paginationPosition = -2;
                    
                    keyToMapReplaced = keyToMapReplaced.replace('Paginated', '')

                    argsCount++
                } else if(keyToMapReplaced.endsWith('Ordered')) {
                    orderPosition = -2;
                    
                    keyToMapReplaced = keyToMapReplaced.replace('Ordered', '')

                    argsCount++
                }

            }

            const whereArgs = [];
            let whereType;

            if(!ignoreWhere) {

                whereType = this[originalKey].whereType ?? 'extending';
                if(!whereTypes.includes(whereType)){
                    throw new Error(`[VSRepository] (${className}: build) Invalid whereType: ${whereType}`);
                }

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
                    // console.log(keysSplitedAnd)

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

                if(!VSRepositoryCache[className]) {
                    VSRepositoryCache[className] = {};
                }

                VSRepositoryCache[className][keyToMap] = (args)=>{
                    return whereArgs.reduce((acc, arg, idx)=> {
                        let orIndex;
                        let argName = arg.name;
                        const agrNameSplitedOr = argName.split('OR.')
                        if(agrNameSplitedOr.length > 1) {
                            const agrNameSplitedOrIdx = agrNameSplitedOr[1].split('idx.')
                            orIndex = Number(agrNameSplitedOrIdx[0])
                            argName = agrNameSplitedOrIdx[1]
                        }
                        // console.log('argName', argName)

                        const preAcc = {}
                        preAcc[argName] = {}
                        if(arg.pushProperty === '$$$') {
                            preAcc[argName] = args[idx]
                        } else {
                            const pushProperty = arg.pushProperty;
                            const pushPropertySplitedNot = pushProperty.split('not.');
                            if(pushPropertySplitedNot.length > 1) {
                                preAcc[argName].not = {};
                                preAcc[argName].not[pushPropertySplitedNot[1]] = args[idx]
                            } else {
                                preAcc[argName][pushProperty] = args[idx]
                            }
                            for (const key in arg.properties) {
                                preAcc[argName][key] = arg.properties[key]
                            }
                        }
                        if(orIndex!==undefined) {
                            // console.log(preAcc)
                            if(!preAcc.OR){
                                preAcc.OR = [];
                            }
                            if(acc.OR){
                                preAcc.OR = [...acc.OR]
                            }
                            // console.log(preAcc)
                            if(!preAcc.OR[orIndex]) {
                                preAcc.OR[orIndex] = {};
                            }
                            // console.log(preAcc)
                            preAcc.OR[orIndex][argName] = preAcc[argName];
                            delete preAcc[argName];
                            // console.log(preAcc)
                        }
                        return {
                            ...acc,
                            ...preAcc
                        };
                    }, {});
                }

            }

            let select;
            if(!ignoreSelect) {

                const providedSelectModel = this[originalKey].selectModel;

                if(providedSelectModel) {
                    if(!this.selectModels || !Object.keys(this.selectModels).includes(providedSelectModel)){
                        throw new Error(`[VSRepository] (${className}: build) Invalid selectModel: ${providedSelectModel}`)
                    }
                    select = this.selectModels[providedSelectModel];
                }

            }

            this[originalKey] = async (...args) => {

                const prismaArgs = {};

                if(select) {
                    prismaArgs.select = select;
                }
                
                let db = this.prisma;
                if(args.length < argsCount) {
                    throw new Error(`[VSRepository] (${className}: runtime) Missing parameters.`);
                } else if(args.length > argsCount) {
                    db = args.at(-1);
                } else {
                    args.push('1')
                }

                if(orderPosition !== undefined) {
                    prismaArgs.orderBy = args.at(orderPosition)
                }
                if(paginationPosition !== undefined) {
                    const paginate = args.at(paginationPosition);
                    prismaArgs.skip = paginate.skip;
                    prismaArgs.take = paginate.take;
                }

                if(!ignoreWhere) {

                    const where = VSRepositoryCache[className][keyToMap](args);

                    prismaArgs.where = {
                        ...where,
                        ...(whereType==='extending' ? {
                            ...this.requiredWhere
                        }:{})
                    };

                }

                if(dataIndex !== undefined) {
                    prismaArgs.data = args[dataIndex];
                }
                if(updateIndex !== undefined) {
                    prismaArgs.update = args[updateIndex];
                }
                if(createIndex !== undefined) {
                    prismaArgs.create = args[createIndex];
                }

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
        return this;
    }

}
