export interface UglyWhere {
    pushProperty: string;
    autoInjectVal?: boolean | {} | null;
    properties?: {
        mode?: string;
    };
    betweenMode?: boolean;
    name: string;
}
