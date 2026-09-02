export interface PrettyWhere {
    context: (string | number)[];
    argName: string;
    autoVal?: boolean | {} | null;
    otherProps?: Record<string, unknown>;
    betweenMode?: boolean;
}
