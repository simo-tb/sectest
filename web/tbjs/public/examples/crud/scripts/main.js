window.onload = function () {
	var w = window;

	w.GENERATED_ITEMS = 110;
	w.ITEMS_PER_PAGE_POSSIBILITIES = [5, 10, 25, 50];

	var randomDate = (function() {
		var start = new Date('1900-01-01').getTime();
		var end = new Date('2030-01-01').getTime();

		return function randomDate() {
			return new Date(start + Math.random() * (end - start)).toISOString();
		}
	})();

	var buildData = function() {
		var data = [];

		for(var i = 0; i < GENERATED_ITEMS; i++) {
			data.push({
				id: i + 1,
				date: randomDate(),
				amount: _.random(1000),
				jsonField: {
					age: _.random(1000, 100000),
					isTeen: !!(_.random(2) % 2),
					colors: [ 'red', 'green', 'blue' ],
					name: {
						first: 'Sezir',
						last: 'Abububaba'
					}

				},
			})
		}

		return data;
	}




	var config = {
		"element": '#crud',
		"itemsPerPagePossibilities": ITEMS_PER_PAGE_POSSIBILITIES,
		"schemas": {
			"http://jsonschema.ctrgs.com/people": {
				"$schema": "http://json-schema.org/draft-04/schema#",
				"id": "http://jsonschema.ctrgs.com/people/",
				"type": "object",
				"properties": {
					"id": {
						"id": "id", // mark as PK
						"type": "integer"
					},
					"first_name": {
						"id": "first_name",
						"type": "string"
					},
					"last_name": {
						"id": "last_name",
						"type": "string"
					},
					"nick_name": {
						"id": "nick_name",
						"type": "string"
					},
					"face_descr_json": {
						"id": "face_descr_json",
						"$ref": "http://jsonschema.ctrgs.com/people/face_descr"
					},
					"city_id": {
						"id": "city_id",
						"type": "integer",
						"tbFkTable": "city",
						"tbFkField": "id"
					},
					"city": {
						"id": "city",
						"$ref": "http://jsonschema.ctrgs.com/cities"
					}
				},
				"required": [
					"first_name",
					"last_name"
				]
			},

			"http://jsonschema.ctrgs.com/cities": {
				"$schema": "http://json-schema.org/draft-04/schema#",
				"id": "http://jsonschema.ctrgs.com/cities/",
				"type": "object",
				"properties": {
					"name": {
						"id": "name",
						"type": "string"
					},
					"region": {
						"id": "region",
						"type": "string"
					},
					"post_code": {
						"id": "postcode",
						"type": "string"
					}
				},
				"required": [
					"name",
					"region",
					"post_code"
				]
			},

			"http://jsonschema.ctrgs.com/people/face_descr": {
				"$schema": "http://json-schema.org/draft-04/schema#",
				"id": "http://jsonschema.ctrgs.com/people/face_descr/",
				"type": "object",
				"properties": {
					"eyes": {
						"id": "eyes",
						"type": "object",
						"properties": {
							"color": {
								"id": "eyes/color",
								"type": "string"
							},
							"size": {
								"id": "eyes/size",
								"type": "string"
							},
							"isAsian": {
								"id": "eyes/isAsian",
								"type": "boolean"
							}
						},
						"required": [
							"color",
							"size",
							"isAsian"
						]
					},
					"skinColor": {
						"id": "skinColor",
						"type": "string"
					}
				},
				"required": [
					"eyes",
					"skinColor"
				]
			},
		},
		"forms": {
			"people": [
				{
					"key": "first_name",
				},
				{
					"key": "last_name",
				},
				{
					"key": "nick_name",
					"priority": 1
				},
				{
					"key": "face_descr",
				},
				{
					"key": "city"
				}
			],
			"cities": [
				{
					"key": "name",

				},
				{
					"key": "region",
				},
				{
					"key": "post_code",
				},
			],
			"people_json_face_descr": [
				{
					"key": "eyes.color",
				},
				{
					"key": "eyes.size ",
					"is_primary": false
				},
				{
					"keys": "eyes.isAsian",
				},
				{
					key: "skinColor",
				}
			],
		},
		row_controls: [
			"edit",
			"delete",
			"preview",
			{
				"action": function() {

				},
				text: "Hello world!",
				template: "<button class=\"btn btn-class\">{{ text | translate }}</button>"
			}
		],
		filters: [
			{
				key: "first_name"
			},
			{
				key: "city",
			}
		],






		itemsPerPage: 3,
		headers: [
			{
				key: 'id',
				sortable: false,
				title: '#',
				formatter: 'number',
			},
			{
				key: 'amount',
				sortable: true,
				title: 'Amount',
				formatter: 'currency',
				formatterSettings: {
					code: 'USD',
				},
			},
			{
				key: 'date',
				sortable: true,
				title: 'date',
				formatter: 'date',
				formatterSettings: {
					templateStr: '{{ value | date : "YY-MM-DD" }}'
				},
			},
			{
				key: 'jsonField',
				sortable: false,
				title: 'JSON Field',
				formatter: 'json',
				formatterSettings: {
					templateStr: `
					{{ titles.age }} {{ value.age | number }},
					{{ titles.name.first }} {{ value.name.first }},
					{{ titles.colors }}: {{# value.colors }} <span style="background: {{ . }}"> {{ . }} </span> {{/value.colors}}
					{{ title.neshto | default : '111111' }}
					`,
					cellClassNames: '',
				},
			},
		],
	};


	var data = buildData();
	var crud = TB.CRUD( config, data );

	window.crud = crud;

	// crud.render();


	function randomNumber(limit, integer) {
		var random = Math.random() * (limit || 100000);
		return (integer) ? parseInt(random, 10) : random;
	};

	function randomTrue() {
		return Math.random() > 0.5;
	}
};
