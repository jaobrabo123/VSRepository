export interface Relation {
    mode: "otm" | "mtm" | "mto" | "oto";
    restriction: "set" | "add";
    pk: string;
    nullable?: boolean;
    nullAble?: boolean;
}
