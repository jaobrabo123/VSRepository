// * Essa é a classe de erro base, pode ser usada em debug para saber se um erro lançado veio do VSRepository
export class VSRepoError extends Error {
    constructor(message, type){
        super(message);
        this.name = this.constructor.name;
        this.type = type; // * Tipo do erro para debug
    }
}

// * Dessa em diante são classes de erros específicas que estendem da base para saber em qual estágio do VSRepository foi lançado o erro, não vou detalhar cada uma pq o nome é auto explicativo
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