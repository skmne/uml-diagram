// Data Structures for UML Diagrams
// This file contains different project structures that can be used

// Java Spring Boot Project Structure
export const javaSpringBootStructure = {	
	nodes:[
		{"name":"fflib_IDomainConstructor","id":"fflib_IDomainConstructor","x":439,"y":79},
		{"name":"fflib_ISObjectSelector","id":"fflib_ISObjectSelector","x":177,"y":79},
		{"name":"fflib_IObjects","id":"fflib_IObjects","x":441,"y":241},
		{"name":"fflib_StringBuilder","id":"fflib_StringBuilder","x":727,"y":401},
		{"name":"GenerateDataTests","id":"GenerateDataTests","x":1014,"y":81},
		{"name":"fflib_SObjectDomain","id":"fflib_SObjectDomain","x":725,"y":240},
		{"name":"fflib_ISObjectDomain","id":"fflib_ISObjectDomain","x":1014,"y":240},
		{"name":"fflib_IDomain","id":"fflib_IDomain","x":179,"y":828},
		{"name":"GenerateData","id":"GenerateData","x":177,"y":539},
		{"name":"IApexClass","id":"IApexClass","x":178,"y":671},
		{"name":"fflib_SecurityUtils","id":"fflib_SecurityUtils","x":176,"y":398},
		{"name":"fflib_IDomainFactory","id":"fflib_IDomainFactory","x":724,"y":82},
		{"name":"fflib_IUnitOfWorkFactory","id":"fflib_IUnitOfWorkFactory","x":177,"y":239}
	],
	links: [
		{
			source: "fflib_IDomainConstructor",
			target: "fflib_ISObjectSelector",
			type: "Directed Association",
		},
		{
			source: "fflib_ISObjectSelector",
			target: "fflib_IObjects",
			type: "Realization",
		},
		{
			source: "fflib_IObjects",
			target: "fflib_IDomainConstructor",
			type: "Directed Association",
		},
		{
			source: "fflib_IDomainConstructor",
			target: "fflib_IObjects",
			type: "Directed Association",
		},
		{
			source: "fflib_IUnitOfWorkFactory",
			target: "fflib_ISObjectSelector",
			type: "Inheritance",
		},
		{
			source: "fflib_IUnitOfWorkFactory",
			target: "fflib_SecurityUtils",
			type: "Inheritance",
		},
		{
			source: "fflib_SecurityUtils",
			target: "GenerateData",
			type: "Inheritance",
		},
		{
			source: "GenerateData",
			target: "IApexClass",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "fflib_IDomainFactory",
			target: "fflib_SObjectDomain",
			type: "Inheritance",
		},
		{
			source: "fflib_SObjectDomain",
			target: "fflib_StringBuilder",
			type: "Inheritance",
		},
		{
			source: "fflib_ISObjectDomain",
			target: "GenerateDataTests",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
		{
			source: "IApexClass",
			target: "fflib_IDomain",
			type: "Inheritance",
		},
	],
};

export const javaProjectData = javaSpringBootStructure;