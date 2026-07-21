export class DynamicMethodMetadata {
    constructor(
        public readonly propertyKey: string | symbol,
        public readonly map: boolean,
        public readonly proxyTo?: string,
        public readonly whereType?: "overwrite" | "extending",
        public readonly pushWhere?: object,
        public readonly fbMode?: "one" | "list",
        public readonly injectOrdenation?: object,
        public readonly injectPagination?: object,
    ) {}
}
