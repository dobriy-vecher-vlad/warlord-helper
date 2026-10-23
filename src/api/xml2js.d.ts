export default class X2JS {
	constructor(config?: Record<string, unknown>);
	xml_str2json(xml: string): any;
	json2xml_str(json: unknown): string;
}
