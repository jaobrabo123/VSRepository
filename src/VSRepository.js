import prisma from "./db.js";

export class VSRepository {

    tableName;

    build() {
        const whereTypes = ['extending', 'overwrite'];

        const repositoryKeys = Object.keys(this);
        console.log(repositoryKeys);

        const [repositoryKeysToMap, repositoryUnmappedKeys] = repositoryKeys.reduce((acc, key)=>{
            if(['tableName', 'selectModels', 'requiredWhere'].includes(key)) {
                acc[1].push(key)
            } else {
                acc[0].push(key)
            }
            return acc
        }, [[],[]]);

        console.log('repositoryKeysToMap', repositoryKeysToMap)
        console.log('repositoryUnmappedKeys', repositoryUnmappedKeys)

        function generatePrismaArgs(keyToMap, ...args) {
            
        }

        for (let keyToMap of repositoryKeysToMap) {
            if(typeof this[keyToMap] !== 'object' || this[keyToMap] === null || !this[keyToMap].map) {
                continue
            } else {

                let ignoreWhere = false;
                let ignoreOrderByAndPagination = true;
                let ignoreSelect = false;
                let keyToMapReplaced;
                let argsCount = 0;
                let method;
                let dataIndex;
                let updateIndex;

                console.log('this', this)

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
                } else if(keyToMap.startsWith('updateManyAndReturn')) {
                    keyToMapReplaced = keyToMap.replace('updateManyAndReturn', '')
                    method = 'updateManyAndReturn';
                    dataIndex = -2;
                    argsCount++;
                } else if(keyToMap.startsWith('updateMany')) {
                    keyToMapReplaced = keyToMap.replace('updateMany', '')
                    ignoreSelect = true;
                    method = 'updateMany';
                    dataIndex = -2;
                    argsCount++;
                } else if(keyToMap.startsWith('update')) {
                    keyToMapReplaced = keyToMap.replace('update', '')
                    method = 'update';
                    dataIndex = -2;
                    argsCount++;
                } else if(keyToMap.startsWith('upsert')) {
                    keyToMapReplaced = keyToMap.replace('upsert', '')
                    method = 'upsert';
                    dataIndex = -2;
                    updateIndex = -3;
                    argsCount += 2;
                } else if(keyToMap.startsWith('deleteMany')) {
                    keyToMapReplaced = keyToMap.replace('deleteMany', '')
                    ignoreSelect = true;
                    method = 'deleteMany';
                } else if(keyToMap.startsWith('delete')) {
                    keyToMapReplaced = keyToMap.replace('delete', '')
                    method = 'delete';
                } else {
                    throw new Error("Método não conhecido pelo VSRepository.")
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

                    whereType = this[keyToMap].whereType ?? 'extending';
                    if(!whereTypes.includes(whereType)){
                        throw new Error("whereType inválido.");
                    }

                    const keysSplited = keyToMapReplaced.split('And')
                    console.log(keysSplited)

                    for (let keySplited of keysSplited) {
                        
                        const buildedWhere = {}

                        if(keySplited.includes('Insensitive')){
                            buildedWhere.properties = {}
                            buildedWhere.properties.mode = 'insensitive';
                            keySplited = keySplited.replace('Insensitive', '')
                        }

                        if(keySplited.includes('StartsWith')){
                            buildedWhere.pushProperty = 'startsWith';
                            keySplited = keySplited.replace('StartsWith', '')
                        } else if(keySplited.includes('NotStartsWith')){
                            buildedWhere.pushProperty = 'not.startsWith';
                            keySplited = keySplited.replace('NotStartsWith', '')
                        } else if(keySplited.includes('EndsWith')){
                            buildedWhere.pushProperty = 'endsWith';
                            keySplited = keySplited.replace('EndsWith', '')
                        } else if(keySplited.includes('NotEndsWith')){
                            buildedWhere.pushProperty = 'not.endsWith';
                            keySplited = keySplited.replace('NotEndsWith', '')
                        } else if(keySplited.includes('Contains')){
                            buildedWhere.pushProperty = 'contains';
                            keySplited = keySplited.replace('Contains', '')
                        } else if(keySplited.includes('NotContains')){
                            buildedWhere.pushProperty = 'not.contains';
                            keySplited = keySplited.replace('NotContains', '')
                        } else if(keySplited.includes('LessThanEqual')){
                            buildedWhere.pushProperty = 'lte';
                            keySplited = keySplited.replace('LessThanEqual', '')
                        } else if(keySplited.includes('LessThan')){
                            buildedWhere.pushProperty = 'lt';
                            keySplited = keySplited.replace('LessThan', '')
                        } else if(keySplited.includes('GreaterThanEqual')){
                            buildedWhere.pushProperty = 'gte';
                            keySplited = keySplited.replace('GreaterThanEqual', '')
                        } else if(keySplited.includes('GreaterThan')){
                            buildedWhere.pushProperty = 'gt';
                            keySplited = keySplited.replace('GreaterThan', '')
                        } else if(keySplited.includes('Not')){
                            buildedWhere.pushProperty = 'not';
                            keySplited = keySplited.replace('Not', '')
                        } else {
                            buildedWhere.pushProperty = '$$$';
                        }

                        keySplited = keySplited[0].toLowerCase() + keySplited.slice(1, keySplited.length)

                        buildedWhere.name = keySplited;

                        console.log(buildedWhere)

                        whereArgs.push(buildedWhere)

                        argsCount++
                    }
                }

                if(!ignoreSelect) {

                    let select;

                    const providedSelectModel = this[keyToMap].selectModel;

                    if(providedSelectModel) {
                        if(!this.selectModels || !Object.keys(this.selectModels).includes(providedSelectModel)){
                            throw new Error("Select model inválido: " + providedSelectModel)
                        }
                        select = this.selectModels[providedSelectModel];
                    }

                    prismaArgs.select = select;

                }

                this[keyToMap] = async (...args) => {
                    
                    let db = prisma;
                    if(args.length < argsCount) {
                        throw new Error("Parametros faltando")
                    } else if(args.length > argsCount) {
                        db = args.at(-1);
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

                        const where = whereArgs.reduce((acc, arg, idx)=> {
                            acc[arg.name] = {}
                            if(arg.pushProperty === '$$$') {
                                acc[arg.name] = args[idx]
                            } else {
                                const pushProperty = arg.pushProperty;
                                const pushPropertySplited = pushProperty.split('.');
                                if(pushPropertySplited.length > 1) {
                                    acc[arg.name][pushPropertySplited[0]] = {}
                                    acc[arg.name][pushPropertySplited[0]][pushPropertySplited[1]] = args[idx]
                                } else {
                                    acc[arg.name][pushProperty] = args[idx]
                                }
                                for (const key in arg.properties) {
                                    acc[arg.name][key] = arg.properties[key]
                                }
                            }
                            return acc;
                        }, {});

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

                    console.log(argsCount)

                    return await db[this.tableName][method](prismaArgs)
                }

            }
        }

    }

}

