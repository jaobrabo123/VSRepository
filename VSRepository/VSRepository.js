/*
* BEM VINDO AO CÓDIGO DO VSREPOSITORY!!!
* Esse código foi totalmente desenvolvido apenas por João Pedro Azevedo
* O código não tá muito organizado, dá pra melhorar muito, mas já ta funcionando bunitin
*/

// * Exportando classes de erro
export * from "./VSRepoError.js";

// * Importando classes de erro
import { VSRepoBuildError, VSRepoExtendError, VSRepoRuntimeError } from "./VSRepoError.js";
import { mergeWheres, validateBuildConfig, validateConfig } from "./VSRepoUtils.js";

// * Essa é a classe pincipal, é a partir dela que serão criados os objetos dos repositories
export class VSRepository {

    // * O vsrepocache é um Map que serve para cachear onde os argumentos dos métodos gerados dinamicamente devem ser injetados, retornando todos os argumentos do Prisma já organizados
    vsrepocache;
    // * tableName serve para saber qual o nome da tabela que deverá ser injetado na função do prisma q será chamada
    tableName;
    // * Nome da primary key da tabela para o get, o remove e o save funcionarem corretamente
    pkName;
    // * Aqui são os modelos de select que poderão ser usados no seu repository
    selectModels;
    // * Aqui é onde você define qual é o modelo principal que deve ser injetado nos métodos, porém você pode escolher outro ao criar ou ao chamar o método (OBS: se o defaultSelectModel não for fornecido e não passar um model no método o select será undefined e o prisma retornará as colunas padrão)
    defaultSelectModel;
    relations;
    requiredWhere;
    methods;

    constructor(config) {
        config = validateConfig(config);

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
            throw new VSRepoExtendError(`[VSRepository] (${this.tableName}: extend) 'extensionFunc' must be a valid funcion.`);
        }
        const extension = extensionFunc(this);
        if(typeof extension !== 'object' || extension === null){
            throw new VSRepoExtendError(`[VSRepository] (${this.tableName}: extend) The return of the 'extensionFunc' must be a valid object.`)
        }

        const extended = Object.assign(Object.create(this), extension);

        if(Object.isFrozen(this)) {
            Object.freeze(extended);
        }

        return extended;
    }

    build(prisma, config = { freeze: true, showWorking: false }) {
        if(typeof prisma !== 'object' || prisma === null) {
            throw new VSRepoBuildError(`[VSRepository] (${this.tableName}: build) 'prisma' must be a valid Prisma Client.`);
        }

        const buildInstance = Object.create(this);

        config = validateBuildConfig(config, buildInstance);

        const showWorking = config.showWorking;

        const relationsKeys = buildInstance.relations ? Object.keys(buildInstance.relations) : [];

        const methods = buildInstance.methods;
        const repositoryKeysToMap = Object.keys(methods);

        if(showWorking) {
            console.log(`[VSRepository] (${buildInstance.tableName}: build) Keys to map:`, JSON.stringify(repositoryKeysToMap, null, 2));
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
            let whereIndex;
            let prismaArgsIndex;
            const whereParams = [];
            const otherParams = [];

            if(keyToMap === 'aggregate') {
                keyToMapReplaced = keyToMap.replace('aggregate', '')
                ignoreSelect = true;
                ignoreWhere = true;
                method = 'aggregate';
                prismaArgsIndex = 0;
                otherParams.push('prismaArgs');
                argsCount++;
            } else if(keyToMap === 'groupBy') {
                keyToMapReplaced = keyToMap.replace('groupBy', '')
                ignoreSelect = true;
                ignoreWhere = true;
                method = 'groupBy';
                prismaArgsIndex = 0;
                otherParams.push('prismaArgs');
                argsCount++;
            } else if(keyToMap.startsWith('findUniqueOrThrowBy')) {
                keyToMapReplaced = keyToMap.replace('findUniqueOrThrowBy', '');
                method = 'findUniqueOrThrow';
            } else if(keyToMap.startsWith('findUniqueBy')) {
                keyToMapReplaced = keyToMap.replace('findUniqueBy', '');
                method = 'findUnique';
            } else if(keyToMap.startsWith('findFirstOrThrowBy')) {
                keyToMapReplaced = keyToMap.replace('findFirstOrThrowBy', '')
                ignoreOrderByAndPagination = false;
                method = 'findFirstOrThrow';
            } else if(keyToMap.startsWith('findFirstOrThrow')) {
                keyToMapReplaced = keyToMap.replace('findFirstOrThrow', '');
                ignoreOrderByAndPagination = false;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'findFirstOrThrow';
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
            } else if(keyToMap.startsWith('countWhere')) {
                keyToMapReplaced = keyToMap.replace('countWhere', '');
                ignoreOrderByAndPagination = false;
                ignoreWhere = true;
                onlyBaseWheres = true;
                ignoreSelect = true;
                method = 'count';
                whereIndex = 0;
                otherParams.push('where');
                argsCount += 1;
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
            } else if(keyToMap.startsWith('existsWhere')) {
                keyToMapReplaced = keyToMap.replace('existsWhere', '');
                ignoreSelect = true;
                existsMode = true;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'findFirst';
                whereIndex = 0;
                otherParams.push('where');
                argsCount += 1;
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
            } else if(keyToMap.startsWith('updateManyAndReturnWhere')) {
                keyToMapReplaced = keyToMap.replace('updateManyAndReturnWhere', '')
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'updateManyAndReturn';
                dataIndex = -2;
                whereIndex = 0;
                otherParams.push('where', 'data');
                argsCount += 2;
            } else if(keyToMap.startsWith('updateManyBy')) {
                keyToMapReplaced = keyToMap.replace('updateManyBy', '')
                ignoreSelect = true;
                method = 'updateMany';
                dataIndex = -2;
                otherParams.push('data');
                argsCount++;
            } else if(keyToMap.startsWith('updateManyWhere')) {
                keyToMapReplaced = keyToMap.replace('updateManyWhere', '')
                ignoreSelect = true;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'updateMany';
                dataIndex = -2;
                whereIndex = 0;
                otherParams.push('where', 'data');
                argsCount += 2;
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
            } else if(keyToMap.startsWith('deleteManyWhere')) {
                keyToMapReplaced = keyToMap.replace('deleteManyWhere', '')
                ignoreSelect = true;
                ignoreWhere = true;
                onlyBaseWheres = true;
                method = 'deleteMany';
                whereIndex = 0;
                otherParams.push('where');
                argsCount += 1;
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
            } else if(keyToMap.startsWith('findOneWhere')) {
                keyToMapReplaced = keyToMap.replace('findOneWhere', '');
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
            } else if(keyToMap.startsWith('findOneBy')) {
                keyToMapReplaced = keyToMap.replace('findOneBy', '');
                ignoreOrderByAndPagination = false;
                method = 'findFirst';
            } else {
                throw new VSRepoBuildError(`[VSRepository] (${buildInstance.tableName}: build) Unknown method: ${keyToMap}.`);
            }


            if(!ignoreSkipDuplicates) {
                if(keyToMapReplaced.endsWith('SkipDuplicates')) {
                    keyToMapReplaced = keyToMapReplaced.replace('SkipDuplicates', '');
                    skipDuplicates = true;
                }
            }

            let orderPosition;
            let paginationPosition;
            let injectOrdenation;
            let injectPagination;

            if(!ignoreOrderByAndPagination) {
                injectOrdenation = methods[originalKey].injectOrdenation;
                injectPagination = methods[originalKey].injectPagination;

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
                    let nullMode;

                    if(keySplitedAnd.includes('IsNull')){
                        buildedWhere.pushProperty = '$$$';
                        buildedWhere.autoInjectVal = null;
                        nullMode = 'is';
                        keySplitedAnd = keySplitedAnd.replace('IsNull', '')
                    } else if(keySplitedAnd.includes('IsNotNull')){
                        buildedWhere.pushProperty = 'not';
                        buildedWhere.autoInjectVal = null;
                        nullMode = 'not';
                        keySplitedAnd = keySplitedAnd.replace('IsNotNull', '')
                    } else if(keySplitedAnd.includes('IsTrue')){
                        buildedWhere.pushProperty = '$$$';
                        buildedWhere.autoInjectVal = true;
                        keySplitedAnd = keySplitedAnd.replace('IsTrue', '')
                    } else if(keySplitedAnd.includes('IsFalse')){
                        buildedWhere.pushProperty = '$$$';
                        buildedWhere.autoInjectVal = false;
                        keySplitedAnd = keySplitedAnd.replace('IsFalse', '')
                    } else {
                        if(keySplitedAnd.includes('Insensitive')){
                            buildedWhere.properties = {}
                            buildedWhere.properties.mode = 'insensitive';
                            keySplitedAnd = keySplitedAnd.replace('Insensitive', '')
                        }
                        if(keySplitedAnd.includes('Optional')){
                            keySplitedAnd = keySplitedAnd.replace('Optional', '');
                        }

                        if(keySplitedAnd.includes('NotBetween')){
                            buildedWhere.pushProperty = 'not';
                            buildedWhere.betweenMode = true;
                            keySplitedAnd = keySplitedAnd.replace('NotBetween', '')
                        } else if(keySplitedAnd.includes('Between')){
                            buildedWhere.pushProperty = '$$$';
                            buildedWhere.betweenMode = true;
                            keySplitedAnd = keySplitedAnd.replace('Between', '')
                        } else if(keySplitedAnd.includes('NotStartsWith')){
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
                    }

                    function uncaptalize(text) {
                        return text[0].toLowerCase() + text.slice(1, text.length);
                    }

                    if(keySplitedAnd.includes('Without')){
                        const keySplitedConector = keySplitedAnd.split('Without');
                        const specificField = keySplitedConector[1];
                        if(!specificField) {
                            if (nullMode) {
                                buildedWhere.pushProperty = nullMode === 'not' ? 'is' : 'isNot';
                            } else {
                                buildedWhere.pushProperty = 'isNot';
                                buildedWhere.autoInjectVal = {};
                            }
                        } else {
                            buildedWhere.pushProperty = `isNot.${uncaptalize(specificField)}${buildedWhere.pushProperty === '$$$' ? '' : `.${buildedWhere.pushProperty}`}`;
                        }
                        keySplitedAnd = keySplitedConector[0];
                    } else if(keySplitedAnd.includes('With')){
                        const keySplitedConector = keySplitedAnd.split('With');
                        const specificField = keySplitedConector[1];
                        if(!specificField) {
                            if (nullMode) {
                                buildedWhere.pushProperty = nullMode === 'not' ? 'isNot' : 'is';
                            } else {
                                buildedWhere.pushProperty = 'is';
                                buildedWhere.autoInjectVal = {};
                            }
                        } else {
                            buildedWhere.pushProperty = `is.${uncaptalize(specificField)}${buildedWhere.pushProperty === '$$$' ? '' : `.${buildedWhere.pushProperty}`}`;
                        }
                        keySplitedAnd = keySplitedConector[0];
                    } else if(keySplitedAnd.includes('Some')){
                        const keySplitedConector = keySplitedAnd.split('Some');
                        const specificField = keySplitedConector[1];
                        if(!specificField) {
                            buildedWhere.pushProperty = 'some';
                            buildedWhere.autoInjectVal = {};
                        } else {
                            buildedWhere.pushProperty = `some.${uncaptalize(specificField)}${buildedWhere.pushProperty === '$$$' ? '' : `.${buildedWhere.pushProperty}`}`;
                        }
                        keySplitedAnd = keySplitedConector[0];
                    } else if(keySplitedAnd.includes('Every')){
                        const keySplitedConector = keySplitedAnd.split('Every');
                        const specificField = keySplitedConector[1];
                        if(!specificField) {
                            buildedWhere.pushProperty = 'every';
                            buildedWhere.autoInjectVal = {};
                        } else {
                            buildedWhere.pushProperty = `every.${uncaptalize(specificField)}${buildedWhere.pushProperty === '$$$' ? '' : `.${buildedWhere.pushProperty}`}`;
                        }
                        keySplitedAnd = keySplitedConector[0];
                    } else if(keySplitedAnd.includes('None')){
                        const keySplitedConector = keySplitedAnd.split('None');
                        const specificField = keySplitedConector[1];
                        if(!specificField) {
                            buildedWhere.pushProperty = 'none';
                            buildedWhere.autoInjectVal = {};
                        } else {
                            buildedWhere.pushProperty = `none.${uncaptalize(specificField)}${buildedWhere.pushProperty === '$$$' ? '' : `.${buildedWhere.pushProperty}`}`;
                        }
                        keySplitedAnd = keySplitedConector[0];
                    }

                    keySplitedAnd = uncaptalize(keySplitedAnd);

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

                        if(keysSplitedOr[i]==='') continue;

                        const keysSplitedAnd = keysSplitedOr[i].split('And')

                        for (const keySplitedAnd of keysSplitedAnd) {

                            if(keySplitedAnd==='') continue;
                            
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

                            if(buildedWhere.autoInjectVal === undefined) argsCount++;
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
                        const pushPropertySplitedDot = pushProperty.split('.');

                        pushPropertySplitedDot.forEach(prop=>context.push(prop));
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
                    return { context, otherProps, argName, autoVal: arg.autoInjectVal, betweenMode: arg.betweenMode };
                });
                if(showWorking) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: build) Where object resolved to ${keyToMap}:\n`, JSON.stringify(whereResolved, null, 2));
                }
            }

            let select;
            if(!ignoreSelect) {

                const providedSelectModel = methods[originalKey].selectModel;

                if(providedSelectModel) {
                    select = buildInstance.selectModels[providedSelectModel];
                } else if(buildInstance.defaultSelectModel && providedSelectModel !== false) {
                    select = buildInstance.selectModels[buildInstance.defaultSelectModel];
                }

            }
            if(existsMode) {
                select = { [buildInstance.pkName]: true };
            }

            buildInstance.vsrepocache.set(originalKey, (args, optionsSelectModel) => {
                if (prismaArgsIndex !== undefined) return args.at(prismaArgsIndex);

                const prismaArgs = {};

                if(!ignoreSelect) {
                    prismaArgs.select = existsMode || optionsSelectModel === undefined ?
                        select :
                        optionsSelectModel === false ?
                            undefined :
                            buildInstance.selectModels[optionsSelectModel];
                }

                if(orderPosition !== undefined) {
                    prismaArgs.orderBy = args.at(orderPosition);
                } else if(injectOrdenation !== undefined) {
                    prismaArgs.orderBy = injectOrdenation;
                }

                if(paginationPosition !== undefined) {
                    const paginate = args.at(paginationPosition);
                    prismaArgs.skip = paginate.skip;
                    prismaArgs.take = paginate.take;
                    prismaArgs.cursor = paginate.cursor;
                } else if(injectPagination !== undefined) {
                    prismaArgs.skip = injectPagination.skip;
                    prismaArgs.take = injectPagination.take;
                    prismaArgs.cursor = injectPagination.cursor;
                }

                if(skipDuplicates!==undefined){
                    prismaArgs.skipDuplicates = skipDuplicates;
                }

                const assignWhere = (where) => {
                    if(whereType==='extending' && buildInstance.requiredWhere) {
                        let safeRequiredWhere = structuredClone(buildInstance.requiredWhere);
                        mergeWheres(where, safeRequiredWhere);
                    }
                    if(pushWhere !== undefined) {
                        let safePushWhere = structuredClone(pushWhere);
                        mergeWheres(where, safePushWhere);
                    }
                }

                if(!ignoreWhere) {

                    const where = {};
                    let OR;
                    let AND;
                    
                    let adjust = 0;
                    for (let j = 0; j < whereResolved.length; j++) {
                        let path = {}
                        let current = path
                        let ormode = false;
                        let andmode = false;
                        let modeIdx;
                        const currentWhereRslvd  = whereResolved[j];
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
                                if(currentWhereRslvd.autoVal !== undefined) {
                                    current[context[i]] = currentWhereRslvd.autoVal;
                                    adjust++
                                } else if (currentWhereRslvd.betweenMode && args[j - adjust] !== undefined) {
                                    current[context[i]] = {};
                                    current[context[i]]["gte"] = args[j - adjust][0];
                                    current[context[i]]["lte"] = args[j - adjust][1];
                                } else {
                                    current[context[i]] = args[j - adjust];
                                }
                            }
                        }

                        if(currentWhereRslvd.otherProps !== undefined) {
                            Object.assign(path[currentWhereRslvd.argName], currentWhereRslvd.otherProps)
                        }
                        if (ormode) {
                            if(!OR) OR = [];
                            if(!OR[modeIdx]) OR[modeIdx] = {}
                            Object.assign(OR[modeIdx], path)
                        } else if(andmode) {
                            if(!AND) AND = [];
                            if(!AND[modeIdx]) AND[modeIdx] = {}
                            Object.assign(AND[modeIdx], path)
                        } else {
                            Object.assign(where, path);
                        }
                    }

                    if(OR) where.OR = OR.filter(x=>x!==undefined);
                    if(AND) where.AND = AND.filter(x=>x!==undefined);
                    
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

            buildInstance[originalKey] = async (...args) => {
                
                let db = prisma;
                let optionsSelectModel;
                if(args.length < argsCount) {
                    const missingParams = whereParams.concat(otherParams).slice(args.length);
                    throw new VSRepoRuntimeError(`[VSRepository] (${buildInstance.tableName}: runtime) Missing parameters: ${missingParams.join(', ')}`);
                } else if(args.length > argsCount) {
                    const optionsArg = args[args.length - 1];
                    db = optionsArg.db ?? db;
                    optionsSelectModel = optionsArg.selectModel;
                } else {
                    args.push('1')
                }

                const prismaArgs = buildInstance.vsrepocache.get(originalKey)(args, optionsSelectModel);

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing ${method}.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to ${method}:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }

                try {
                    const result = await db[buildInstance.tableName][method](prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed ${method} (took: ${duration}ms).`);
                    }

                    if(existsMode) {
                        return !!result;
                    }
                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when executing ${method}:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
                
            }

        }

        if(config.baseMethods?.get?.active !== false) {
            buildInstance.get = async(pk, options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};

                const where = { [buildInstance.pkName]: pk };
                if(buildInstance.requiredWhere && !config.baseMethods?.get?.ignoreRequiredWhere) {
                    Object.assign(where, buildInstance.requiredWhere);
                }
                prismaArgs.where = where;

                let selectModelKey = options?.selectModel ?? config.baseMethods?.get?.defaultSelect ?? buildInstance.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = buildInstance.selectModels[selectModelKey];
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing get.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to get:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }

                try {
                    const result = await db[buildInstance.tableName].findUnique(prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed get (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to get:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.getOrThrow?.active !== false) {
            buildInstance.getOrThrow = async(pk, options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};

                const where = { [buildInstance.pkName]: pk };
                if(buildInstance.requiredWhere && !config.baseMethods?.getOrThrow?.ignoreRequiredWhere) {
                    Object.assign(where, buildInstance.requiredWhere);
                }
                prismaArgs.where = where;

                let selectModelKey = options?.selectModel ?? config.baseMethods?.getOrThrow?.defaultSelect ?? buildInstance.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = buildInstance.selectModels[selectModelKey];
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing getOrThrow.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to getOrThrow:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }

                try {
                    const result = await db[buildInstance.tableName].findUniqueOrThrow(prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed getOrThrow (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to getOrThrow:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.remove?.active !== false) {
            buildInstance.remove = async (pk, options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};

                const where = { [buildInstance.pkName]: pk };
                if(buildInstance.requiredWhere && !config.baseMethods?.remove?.ignoreRequiredWhere) {
                    Object.assign(where, buildInstance.requiredWhere);
                }
                prismaArgs.where = where;

                let selectModelKey = options?.selectModel ?? config.baseMethods?.remove?.defaultSelect ?? buildInstance.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = buildInstance.selectModels[selectModelKey];
                }
                
                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing remove.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to remove:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }
                try {
                    const result = await db[buildInstance.tableName].delete(prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed remove (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to remove:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.save?.active !== false) {
            buildInstance.save = async (obj, options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};

                let selectModelKey = options?.selectModel ?? config.baseMethods?.save?.defaultSelect ?? buildInstance.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = buildInstance.selectModels[selectModelKey];
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing save.`);
                    start = performance.now();
                }

                try {
                    let result;
                    if(obj[buildInstance.pkName] !== undefined){
                        prismaArgs.create = {};
                        prismaArgs.update = {};

                        const keys = Object.keys(obj);
                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            const field = obj[key];

                            if(field === undefined) continue;

                            if(relationsKeys.includes(key)){
                                const relation = buildInstance.relations[key];
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
                                        if(relationFieldPk != null){
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
                                            prismaArgs.update[key] = relationRestriction === 'add' ?
                                                { create: field } :
                                                { upsert: { create: field, update: field } };
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
                                if(key !== buildInstance.pkName) {
                                    prismaArgs.update[key] = field;
                                }
                            }
                        }

                        const where = { [buildInstance.pkName]: obj[buildInstance.pkName] };
                        if(buildInstance.requiredWhere && !config.baseMethods?.save?.ignoreRequiredWhere) {
                            Object.assign(where, buildInstance.requiredWhere);
                        }
                        prismaArgs.where = where;

                        if(showWorking) {
                            console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to save:\n`, JSON.stringify(prismaArgs, null, 2));
                        }

                        result = await db[buildInstance.tableName].upsert(prismaArgs);
                    } else {
                        prismaArgs.data = {};

                        const keys = Object.keys(obj);
                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            const field = obj[key];

                            if(field == null) continue;

                            if(relationsKeys.includes(key)){
                                const relation = buildInstance.relations[key];
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
                                    if(relationFieldPk != null) {
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
                            console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to save:\n`, JSON.stringify(prismaArgs, null, 2));
                        }

                        result = await db[buildInstance.tableName].create(prismaArgs);
                    }

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed save (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to save:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            } 
        }
        if(config.baseMethods?.removeList?.active !== false) {
            buildInstance.removeList = async (pks, options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};
                
                const where = { [buildInstance.pkName]: { in: pks } };
                if(buildInstance.requiredWhere && !config.baseMethods?.removeList?.ignoreRequiredWhere) {
                    Object.assign(where, buildInstance.requiredWhere);
                }
                prismaArgs.where = where;

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing removeList.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to removeList:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }
                try {
                    const result = await db[buildInstance.tableName].deleteMany(prismaArgs);
                    if(showWorking) {
                        const end = performance.now();
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed removeList (took: ${(end - start).toFixed(2)}ms).`);
                    }
                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to removeList:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.getAll?.active !== false) {
            buildInstance.getAll = async (options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};

                if(buildInstance.requiredWhere && !config.baseMethods?.getAll?.ignoreRequiredWhere) {
                    prismaArgs.where = { ...buildInstance.requiredWhere };
                }

                let selectModelKey = options?.selectModel ?? config.baseMethods?.getAll?.defaultSelect ?? buildInstance.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = buildInstance.selectModels[selectModelKey];
                }

                if(options.pagination) {
                    prismaArgs.skip = options.pagination.skip;
                    prismaArgs.take = options.pagination.take;
                    prismaArgs.cursor = options.pagination.cursor;
                }
                if(options.order) {
                    prismaArgs.orderBy = options.order;
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing getAll.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to getAll:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }
                try {
                    const result = await db[buildInstance.tableName].findMany(prismaArgs);
                    if(showWorking) {
                        const end = performance.now();
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed getAll (took: ${(end - start).toFixed(2)}ms).`);
                    }
                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to getAll:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.total?.active !== false) {
            buildInstance.total = async (options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};

                if(buildInstance.requiredWhere && !config.baseMethods?.total?.ignoreRequiredWhere) {
                    prismaArgs.where = { ...buildInstance.requiredWhere };
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing total.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to total:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }
                try {
                    const result = await db[buildInstance.tableName].count(prismaArgs);
                    if(showWorking) {
                        const end = performance.now();
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed total (took: ${(end - start).toFixed(2)}ms).`);
                    }
                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to total:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.has?.active !== false) {
            buildInstance.has = async (pk, options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};
                
                const where = { [buildInstance.pkName]: pk };
                if(buildInstance.requiredWhere && !config.baseMethods?.has?.ignoreRequiredWhere) {
                    Object.assign(where, buildInstance.requiredWhere);
                }
                prismaArgs.where = where;
                prismaArgs.select = { [buildInstance.pkName]: true };

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing has.`);
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to has:\n`, JSON.stringify(prismaArgs, null, 2));
                    start = performance.now();
                }
                try {
                    const result = await db[buildInstance.tableName].findUnique(prismaArgs);
                    if(showWorking) {
                        const end = performance.now();
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed has (took: ${(end - start).toFixed(2)}ms).`);
                    }
                    return !!result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to has:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            }
        }
        if(config.baseMethods?.patch?.active !== false) {
            buildInstance.patch = async (pk, obj, options = {}) => {
                let db = options?.db ?? prisma;
                const prismaArgs = {};

                let selectModelKey = options?.selectModel ?? config.baseMethods?.patch?.defaultSelect ?? buildInstance.defaultSelectModel;
                if(selectModelKey){
                    prismaArgs.select = buildInstance.selectModels[selectModelKey];
                }

                let start;
                if(showWorking){
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executing patch.`);
                    start = performance.now();
                }

                try {
                    let result;
                    prismaArgs.data = {};

                    const keys = Object.keys(obj);
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        const field = obj[key];

                        if(field === undefined) continue;

                        if(relationsKeys.includes(key)){
                            const relation = buildInstance.relations[key];
                            const relationMode = relation.mode;
                            const relationRestriction = relation.restriction;
                            const relationPk = relation.pk;

                            if(relationMode === 'oto' || relationMode === 'mto') {
                                if(field === null) {
                                    if(relationMode === 'oto' && relationRestriction === 'set') {
                                        prismaArgs.data[key] = { delete: true };
                                    } else if(relationMode === 'mto' && relation.nullAble) {
                                        prismaArgs.data[key] = { disconnect: true };
                                    }
                                } else if (field !== undefined) {
                                    const relationFieldPk = field[relationPk];
                                    if(relationFieldPk != null){
                                        const connectOrCreate = {
                                            where: { [relationPk]: relationFieldPk },
                                            create: field
                                        };

                                        if(relationRestriction === 'add') {
                                            prismaArgs.data[key] = { connectOrCreate };
                                        } else {
                                            const update = {...field};
                                            delete update[relationPk];

                                            prismaArgs.data[key] = {
                                                upsert: {
                                                    where: { [relationPk]: relationFieldPk },
                                                    create: field,
                                                    update: update
                                                }
                                            };
                                        }
                                    } else {
                                        prismaArgs.data[key] = relationRestriction === 'add' ?
                                            { create: field } :
                                            { upsert: { create: field, update: field } };
                                    }
                                }
                            } else if(Array.isArray(field)) {
                                const dataWithPk = field.filter(data=>data[relationPk]!==undefined);
                                const dataWithoutPk = field.filter(data=>data[relationPk]===undefined);

                                const connectOrCreate = dataWithPk.map(data=>({
                                    where: { [relationPk]: data[relationPk] },
                                    create: data
                                }));

                                if(relationRestriction === 'add') {
                                    if(relationMode === 'mtm') {
                                        prismaArgs.data[key] = {
                                            create: dataWithoutPk,
                                            connectOrCreate
                                        }
                                    } else {
                                        prismaArgs.data[key] = {
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
                                        prismaArgs.data[key] = {
                                            set: [],
                                            create: dataWithoutPk,
                                            connectOrCreate
                                        }
                                    } else {
                                        prismaArgs.data[key] = {
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
                            if (key !== buildInstance.pkName) {
                                prismaArgs.data[key] = field;
                            }
                        }
                    }

                    const where = { [buildInstance.pkName]: pk };
                    if(buildInstance.requiredWhere && !config.baseMethods?.patch?.ignoreRequiredWhere) {
                        Object.assign(where, buildInstance.requiredWhere);
                    }
                    prismaArgs.where = where;

                    if(showWorking) {
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Built arguments to patch:\n`, JSON.stringify(prismaArgs, null, 2));
                    }

                    result = await db[buildInstance.tableName].update(prismaArgs);

                    if(showWorking) {
                        const end = performance.now();
                        const duration = (end - start).toFixed(2);
                        console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Executed patch (took: ${duration}ms).`);
                    }

                    return result;
                } catch (err) {
                    console.log(`[VSRepository] (${buildInstance.tableName}: runtime) Fatal error when trying to patch:\n`, JSON.stringify({ prismaArgs }, null, 2));
                    throw err;
                }
            } 
        }

        buildInstance.prisma = prisma;

        if(config.freeze) Object.freeze(buildInstance);
        return buildInstance;
    }

}

export const setupVSRepo = () => (config) => new VSRepository(config);
