import Rule from "./rule";
export default class Session {

    constructor (public name: string) {
    }
    accessed: string;
    created: string;
    notes: string;
    sessionId: string;
    rules: Array<Rule>;
}
