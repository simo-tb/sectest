const fs = require('fs');
const http = require('http');
const url = require('url');
const qs = require('querystring');
const multiparty = require('multiparty');
const _ = require('lodash');

const port = 3000;

const foreignKeyBasic = {
  schema: {
    id: "http://jschemas.tbpro.com/tblib/jf/playground/5-foreign-key-basic",
    type: "object",
    properties: {
      test123: {
        type: "object",
        title: "Wrapper object around the fkey",
        properties: {
          referencing_field_normal_select: {
            type: ["number", "null"],

            title: "Humans",
            refCol: "id",
            refColTitle: "nameOfColumnThatNeedToBeVisualised",
            refTable: "table_name",
            filterSchema: {
              $ref: "#/definitions/people"
            },
          }
        }
      }
    },
    definitions: {
      people: {
        id: "http://jsonschemas.telebid-pro.com/tblib/db/jf_tables",
        type: "object",
        title: "CRUD presentations",
        $schema: "http://jsonschemas.telebid-pro.com/tbjson/draft-04-custom",
        project: "tblib",
        version: 0,
        required: [
          "schema_id",
          "name",
          "db_obj_name"
        ],
        properties: {
          code: {
            type: "boolean",
            title: "Program name",
            ordering: 30,
            translate: true,
            searchBy: "*"
          },
          name: {
            name: true,
            type: "string",
            title: "UI name",
            ordering: 20,
            searchBy: "*"
          },
          descr: {
            type: [
              "null",
              "string"
            ],
            title: "Description",
            ordering: 40,
            searchBy: "*"
          },
          schema_id: {
            type: "string",
            title: "Schema",
            refCol: "id",
            ordering: 10,
            refTable: "tbjson_schemas",
            filterSchema: {
              $ref: "http://jsonschemas.telebid-pro.com/tblib/db/tbjson_schemas"
            }
          },
          table_json: {
            type: "string",
            title: "List presentation JSON",
            ordering: 60
          },
          db_obj_name: {
            type: "string",
            title: "Table name",
            ordering: 50,
            type: "number",
            searchBy: "*"
          }
        }
      }
    }
  },
  form: {
    $schemaId: "http://jschemas.tbpro.com/tblib/jf/playground/5-foreign-key-basic",
    jsonformVersion: "2.0",
    fields: [
      {
        title: "Humans without Template",
        key: "test123/referencing_field_normal_select",
        type: "select",
        initialTitle: 'MOMO',
      },
    ]
  },
  content: {
    test123 : {
      referencing_field_normal_select: 200,
    }
  }
}

const foreignKeyFull = {
  schema: {
    id: "http://jschemas.tbpro.com/tblib/jf/playground/5-foreign-key-basic",
    type: "object",
    properties: {
      referencing_field_fancy_select: {
        type: "number",

        refCol: "id",
        refColTitle: "nameOfColumnThatNeedToBeVisualised",
        refTable: "table_name",
        filterSchema: {
          $ref: "#/definitions/people"
        },

        // enum: [1, 2],
      },
      referencing_field_normal_select: {
        type: "number",

        refCol: "id",
        refColTitle: "nameOfColumnThatNeedToBeVisualised",
        refTable: "table_name",
        filterSchema: {
          $ref: "#/definitions/people"
        },

        // enum: [10, 20, 15],
        // enumNames: ['Ivan', 'Petkan', 'Dragan'],
      },
      referencing_field_fancy_select_with_default: {
        type: "number",

        refCol: "id",
        refColTitle: "nameOfColumnThatNeedToBeVisualised",
        refTable: "table_name",
        filterSchema: {
          $ref: "#/definitions/people"
        },

        enum: [10, 20, 15],
      },
    },
    definitions: {
      people: {
        id: "http://jsonschemas.telebid-pro.com/tblib/db/jf_tables",
        type: "object",
        title: "CRUD presentations",
        $schema: "http://jsonschemas.telebid-pro.com/tbjson/draft-04-custom",
        project: "tblib",
        version: 0,
        required: [
          "schema_id",
          "name",
          "db_obj_name"
        ],
        properties: {
          code: {
            type: "boolean",
            title: "Program name",
            ordering: 30,
            translate: true,
            searchBy: "*"
          },
          name: {
            name: true,
            type: "string",
            title: "UI name",
            ordering: 20,
            searchBy: "*"
          },
          descr: {
            type: [
              "null",
              "string"
            ],
            title: "Description",
            ordering: 40,
            searchBy: "*"
          },
          schema_id: {
            type: "string",
            title: "Schema",
            refCol: "id",
            ordering: 10,
            refTable: "tbjson_schemas",
            filterSchema: {
              $ref: "http://jsonschemas.telebid-pro.com/tblib/db/tbjson_schemas"
            }
          },
          table_json: {
            type: "string",
            title: "List presentation JSON",
            ordering: 60
          },
          db_obj_name: {
            type: "string",
            title: "Table name",
            ordering: 50,
            type: "number",
            searchBy: "*"
          }
        }
      }
    }
  },
  form: {
    $schemaId: "http://jschemas.tbpro.com/tblib/jf/playground/5-foreign-key-basic",
    jsonformVersion: "2.0",
    templateData: {
      referencing_field_fancy_select_with_default: [
        {"id": 10,"nameOfColumnThatNeedToBeVisualised":"Dragan10","extraDataToBeVisualised":"Pernik"},
        {"id": 15,"nameOfColumnThatNeedToBeVisualised":"Dragan11","extraDataToBeVisualised":"Pernik"},
        {"id": 20,"nameOfColumnThatNeedToBeVisualised":"Dragan12","extraDataToBeVisualised":"Pernik"},
      ]
    },
    fields: [
      {
        key: "referencing_field_fancy_select",
        title: "Humans with Template",
        type: "selecttemplate",
        pluginOptions: {
          "maxItems": 1,
          "optionTemplate": "<div><div>Column Name: <b>{{nameOfColumnThatNeedToBeVisualised}}</b></div><div>location: {{extraDataToBeVisualised}}</div> </div>",
          "valueField": "id",
          "searchField": "nameOfColumnThatNeedToBeVisualised"
        },
      },
      {
        key: "referencing_field_fancy_select_with_default",
        title: "Humans with Template and Default",
        type: "selecttemplate",
        pluginOptions: {
          "maxItems": 1,
          "optionTemplate": "<div><div>Column Name: <b>{{nameOfColumnThatNeedToBeVisualised}}</b></div><div>location: {{extraDataToBeVisualised}}</div> </div>",
          "valueField": "id",
          "searchField": "nameOfColumnThatNeedToBeVisualised"
        },
      },
      {
        key: "referencing_field_normal_select",
        title: "Humans without Template",
        type: "select",
      },
    ]
  },
  content: {
    referencing_field_fancy_select_with_default: 20,
    filtersArray0: {
      value: 200,
    }
  }
};

const inputTextBasic = {
  "schema": {
    "id": "http://jschemas.tbpro.com/tblib/jf/playground/1-input-text-basic",
    "type": "object",
    "properties": {
      "mo~od": {
        "type": "number",
        "title": "Mood of the day",
        "description": "Describe how you feel in short",
      },
      "ttt": {
        "type": "object",
        "title": "test",
        "properties": {
          "momo": {
            "type": ["number", "null"],
            "title": "test-inner",
          }
        }
      },
      "ttt2": {
        "type": ["array", "null"],
        "title": "test2 - strings",
        "items": {
          "title": "tmux object wrapper",
          "type": ["string", "null"],
        }
      },
      "ttt3": {
        "type": ["array", "null"],
        "title": "test2 - objects",
        "items": {
          "title": "tmux object wrapper - objects",
          "type": ["object", "null"],
          "properties": {
            "tmux2": {
              "type": "number",
              "title": "TMUX - number"
            },
            "tmux": {
              "type": "string",
              "title": "TMUX - string"
            }
          }
        }
      },
      "ttt5": {
        "type": ["object", "null"],
        "title": "TEST 5",
        "properties": {
          "ttt4": {
              "type": ["array", "null"],
            "title": "test2 - objects",
            "items": {
              "title": "tmux object wrapper - objects",
              "type": ["object", "null"],
              "properties": {
                "tmux2": {
                  "type": "number",
                  "title": "TMUX - number"
                },
                "tmux": {
                  "type": "string",
                  "title": "TMUX - string"
                }
              }
            }
          }
        }
      }
    },
    "required": [
      "mo~od"
    ]
  },
  "form": {
    "isStrict": false,
    "liveValidation": true,
    "$schemaId": "http://jschemas.tbpro.com/tblib/jf/playground/1-input-text-basic",
    "jsonformVersion": "2.0",
    "fields": [
      {
        "key": "mo~od",
        "prepend": "I feel",
        "append": "today",
        "htmlClass": "usermood",
        "placeholder": "incredibly and admirably great",
        "enableReset": true,
        "enableUndo": true,
        "enableRedo": true
      },
      {
        "key": "ttt",
        "type": "fieldset",
      },
      {
        "key": "ttt2",
      },
      {
        "key": "ttt3",
      },
      {
        "key": "ttt5",
      },
      {
        "type": "submit",
        "title": "Submit"
      }
    ]
  },
  "content": {
    "$schemaId": "http://jschemas.tbpro.com/tblib/jf/playground/1-input-text-basic",
    "mo~od": 2
  }
};

const base64FileUpload = {
  "schema": {
    "id": "http://jschemas.tbpro.com/tblib/jf/playground/100-file",
    "type": "object",
    "properties": {
      "avatar": {
        "type": "string",
        "title": "My awesome avatar",
        "description": "Well I don't look that bad in real",
        "fileMimeTypes": ["image/png", "image/jpg", "image/jpeg", "image/gif"],
        "fileMaxSize": 200000000,
        "maxLength": 200000000,
      }
    },
    "required": [
      "avatar"
    ]
  },
  "form": {
    "isStrict": false,
    "$schemaId": "http://jschemas.tbpro.com/tblib/jf/playground/100-file",
    "jsonformVersion": "2.0",
    "fields": [
      {
        "key": "avatar",
        "type": "base64file"
      },
      {
        "type": "submit",
        "title": "Submit"
      }
    ]
  },
  "content": {
    "$schemaId": "http://jschemas.tbpro.com/tblib/jf/playground/100-file",
    "avatar": "data:image/jpeg;base64,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"
  }
};

const no_key_form = {
  "IS_LOAD_FORM_OVERRIDEN": 0,
  "sp": "U2FsdGVkX1-LDkcUIUUta6D1KAyaTQ8X_lh2Ed21ffvqEwU9TkqB1PDbSfn3QsDEfKMzFUxo1LBY1O_-82pZjUlIJIyLF6BHNlN-uFhYcuftJMPT2WQWAtAuNWqJQJ4ogTOjv68JZYrq2lfGw5b_DJhF3Io0qTaqAPgStGEhmxSeV1gPoO62ZObbe4Mi0zuDNGkY_0_4TiARmUgj3pB9HnV-j9yWx40z2dZ--64IC077ubJsbvWF6Bd67qaRALgPjjoyFeRSGgn1s03gqzHh-H8mlrsy19jDB8sLZq5DJXkr9D_DRBTqh1HftoPxUmQBh-hB47E-K9Yo8SsJWZ-YYwTX3XbJjRF3QbCgxtgQHaTltW_wpyGLCddZN-kQfPGnE_R4xG0tMwNWUlMKKsBrM3YRo9D7zuvEJ_gNMnA0GwS5-1zehJBzP0vbAzw0eyFcExMlGjfIwdo3jiYI4XX3AJXQurakp_XxFPLhRLRY3BiSg_A8IJLBox7rOL8Lj16IjFSFn45KldZOkmWWaWsg8Pebo4rDCDF4iSthuSXUVbxm4K0iP0NWA10PQc374XZeNJ8OpPwmFjXWRYyeiRZzIB7cW6aUzNHBcjwAvZHvt7upaLfXWkGZrWLMHOHqhdXqMrZwMTRHY4nIJfzNjeLAzA5QgClYl-T0K2BbKEbjUHeFGVbmcPW1XXWBT74m5V6EL502SCYJHgKwDTe4tJIuOmdSNG6Vl81aOJD5KacTt0pE2FmWvEYk6F6tFrwaY5Zc4bRWbpsHAgdD_0Je5xS7imVa4CbacqenlyTYISgJr_pnOIWbXjN-iONXeU_KoQ0m-gPsn-1Gy31yo3O6-B0nqEK7jvc9-1RybhcUCxPmkHd44j3LQ6hxT6Rmo_uehezVGbhOKHoX4waMfhawSrxwOkCkf2GRY0G2K0gLvpy2Xo4bnsAoSoJcnjiGwHmzehzolpjhmC_A7Z5_ZibOoka-9PVVmiFOvNM67IW5lUIXqHu4xlptzCRnZuVphnCB6pOdPuGqaRAus_g",
  "IS_BEFORE_SAVE_CONTENT_OVERRIDEN": 1,
  "schema": {
    "type": "object",
    "$schema": "http://jsonschemas.telebid-pro.com/tbjson/schemas/jsonschema_custom04",
    "definitions": {
      "http://jsonschemas.telebid-pro.com/tbjson/schemas/jsonschema_custom04": {
        "definitions": {
          "simpleTypes": {
            "enum": [
              "array",
              "boolean",
              "integer",
              "null",
              "number",
              "object",
              "string"
            ]
          },
          "stringArray": {
            "items": {
              "type": "string"
            },
            "uniqueItems": true,
            "minItems": 1,
            "type": "array"
          },
          "positiveIntegerDefault0": {
            "allOf": [
              {
                "$ref": "#/definitions/positiveInteger"
              },
              {
                "default": 0
              }
            ]
          },
          "schemaArray": {
            "items": {
              "$ref": "#"
            },
            "minItems": 1,
            "type": "array"
          },
          "positiveInteger": {
            "type": "integer",
            "minimum": 0
          }
        },
        "default": {},
        "id": "http://jsonschemas.telebid-pro.com/tbjson/schemas/jsonschema_custom04",
        "description": "Core schema meta-schema",
        "properties": {
          "default": {},
          "description": {
            "type": "string"
          },
          "definitions": {
            "type": "object",
            "additionalProperties": {
              "$ref": "#"
            },
            "default": {}
          },
          "translated": {
            "type": "boolean",
            "default": false
          },
          "fileMimeTypes": {
            "$ref": "#/definitions/stringArray"
          },
          "minItems": {
            "$ref": "#/definitions/positiveIntegerDefault0"
          },
          "multipleOf": {
            "minimum": 0,
            "type": "number",
            "exclusiveMinimum": true
          },
          "not": {
            "$ref": "#"
          },
          "isUIHidden": {
            "type": "boolean",
            "default": false
          },
          "additionalProperties": {
            "default": {},
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "$ref": "#"
              }
            ]
          },
          "uniqueItems": {
            "type": "boolean",
            "default": false
          },
          "minProperties": {
            "$ref": "#/definitions/positiveIntegerDefault0"
          },
          "minLength": {
            "$ref": "#/definitions/positiveIntegerDefault0"
          },
          "minimum": {
            "type": "number"
          },
          "maxItems": {
            "$ref": "#/definitions/positiveInteger"
          },
          "pattern": {
            "format": "regex",
            "type": "string"
          },
          "refTable": {
            "type": "string"
          },
          "properties": {
            "default": {},
            "additionalProperties": {
              "$ref": "#"
            },
            "type": "object"
          },
          "fileMaxSize": {
            "$ref": "#/definitions/positiveInteger"
          },
          "maximum": {
            "type": "number"
          },
          "enum": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true
          },
          "refCol": {
            "type": "string"
          },
          "items": {
            "default": {},
            "anyOf": [
              {
                "$ref": "#"
              },
              {
                "$ref": "#/definitions/schemaArray"
              }
            ]
          },
          "anyOf": {
            "$ref": "#/definitions/schemaArray"
          },
          "exclusiveMaximum": {
            "default": false,
            "type": "boolean"
          },
          "refType": {
            "enum": [
              "fkey",
              "relation",
              "reference"
            ],
            "type": "string"
          },
          "allOf": {
            "$ref": "#/definitions/schemaArray"
          },
          "isMultilanguage": {
            "type": "boolean",
            "default": false
          },
          "exclusiveMinimum": {
            "default": false,
            "type": "boolean"
          },
          "maxLength": {
            "$ref": "#/definitions/positiveInteger"
          },
          "required": {
            "$ref": "#/definitions/stringArray"
          },
          "additionalItems": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "$ref": "#"
              }
            ],
            "default": {}
          },
          "id": {
            "type": "string",
            "format": "uri"
          },
          "dependencies": {
            "additionalProperties": {
              "anyOf": [
                {
                  "$ref": "#"
                },
                {
                  "$ref": "#/definitions/stringArray"
                }
              ]
            },
            "type": "object"
          },
          "maxProperties": {
            "$ref": "#/definitions/positiveInteger"
          },
          "refNameCol": {
            "type": "string"
          },
          "oneOf": {
            "$ref": "#/definitions/schemaArray"
          },
          "title": {
            "type": "string"
          },
          "type": {
            "anyOf": [
              {
                "$ref": "#/definitions/simpleTypes"
              },
              {
                "minItems": 1,
                "type": "array",
                "uniqueItems": true,
                "items": {
                  "$ref": "#/definitions/simpleTypes"
                }
              }
            ]
          },
          "$schema": {
            "format": "uri",
            "type": "string"
          },
          "patternProperties": {
            "type": "object",
            "default": {},
            "additionalProperties": {
              "$ref": "#"
            }
          }
        },
        "dependencies": {
          "refTable": [
            "refCol"
          ],
          "refCol": [
            "refTable"
          ],
          "refType": [
            "refTable",
            "refCol"
          ],
          "refNameCol": [
            "refTable",
            "refCol"
          ],
          "exclusiveMaximum": [
            "maximum"
          ],
          "exclusiveMinimum": [
            "minimum"
          ]
        },
        "type": "object",
        "$schema": "http://json-schema.org/draft-04/schema"
      }
    },
    "id": "http://jsonschemas.telebid-pro.com/jpserver/db/promo_systems/display_settings_json?v=1",
    "properties": {
      "displays": {
        "title": "Displays",
        "type": "array",
        "items": {
          "title": "Display Settings",
          "type": "object",
          "properties": {
            "has_decimal_point": {
              "title": "Decimal Point",
              "type": "boolean",
              "default": true
            },
            "name": {
              "type": "string",
              "title": "Name",
              "default": "New Display"
            },
            "is_public": {
              "title": "Public",
              "type": "boolean",
              "default": false
            },
            "identifier": {
              "type": [
                "string",
                "null"
              ],
              "title": "Identifier",
              "readOnly": true
            },
            "idx": {
              "readOnly": true,
              "type": [
                "integer",
                "null"
              ],
              "title": "idx"
            },
            "display_denom_mode": {
              "refTable": "fusion_signages_display_denom_modes",
              "refType": "fkey",
              "enum": [
                0,
                1,
                2
              ],
              "refCol": "id",
              "enumNames": [
                "as is",
                "x100",
                "x100+cents"
              ],
              "title": "Denom mode",
              "type": "number"
            },
            "number": {
              "type": [
                "integer",
                "null"
              ],
              "title": "Number",
              "readOnly": true
            }
          }
        }
      }
    }
  },
  "formName": "jpweb::promo_systems::display_settings_json::v1",
  "IS_LOAD_CONTENT_OVERRIDEN": 1,
  "status": {
    "status": "ok"
  },
  "locales": [
    {
      "iso639_2": "ang",
      "plural_form": 1,
      "locale": "en_GB",
      "lang_name": "English GB",
      "nplurals": 2,
      "notes": "(n != 1)"
    }
  ],
  "translations": null,
  "content": {
    "$schemaId": "http://jsonschemas.telebid-pro.com/jpserver/db/promo_systems/display_settings_json?v=1",
    "displays": [
      {
        "number": 20014,
        "idx": 20324,
        "display_denom_mode": 0,
        "is_public": true,
        "identifier": "6aa9142c75aa09a45ddab693c55e37a7:EUR",
        "name": "Display For RGS Demo site (dev html/flash)",
        "has_decimal_point": true
      },
      {
        "name": "New Display 200",
        "has_decimal_point": true,
        "identifier": "Display For New Display 200",
        "is_public": false,
        "display_denom_mode": 0,
        "idx": 20420,
        "number": 20125
      }
    ]
  },
  "form": {
    "fields": [
      {
        "type": "tabarray",
        "key": "displays",
        "items": {
          "title": "New Display",
          "type": "section",
          "items": [
            {
              "key": "displays[]/idx",
              "type": "hidden"
            },
            {
              "valueInLegend": true,
              "key": "displays[]/name"
            },
            {
              "key": "displays[]/number",
              "disabled": true
            },
            {
              "key": "displays[]/identifier",
              "disabled": true
            },
            {
              "key": "displays[]/is_public"
            },
            {
              "key": "displays[]/has_decimal_point"
            },
            {
              "key": "displays[]/display_denom_mode"
            }
          ],
          "legend": "{{value}}"
        },
      }
    ],
    "$schemaId": "http://jsonschemas.telebid-pro.com/jpserver/db/promo_systems/display_settings_json?v=1",
    "jsonformVersion": "2.0",
    "strictNumberTypes": false
  }
};

const fileUpload = {
  "schema": {
    "id": "http://jschemas.tbpro.com/tblib/jf/playground/14-fileRequest",
    "type": "object",
    "properties": {
      "massive": {
        "type": "array",
        "title": "arra",
        "items": {
          "title": "test",
          "type": "object",
          "properties": {
            "files": {
              "type": ["string", "null", "array"],
              "title": "File to upload2",
              "format": "file",
              "items": {
                "type": "string"
              },
              "isMultiple": true,
            }
          }
        }
      },
    }
  },
  "form": {
    "$schemaId": "http://jschemas.tbpro.com/tblib/jf/playground/14-fileRequest",
    "jsonformVersion": "2.0",
    "fields": [
      {
        "key": "massive",
      },
      {
        "type": "submit",
        "title": "Submit"
      }
    ]
  }
};



var a = true;
const requestHandler = (request, response) => {
  response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'});

  try {
    if (request.method === 'OPTIONS') {
      console.info('Got an OPTIONS request!');
      console.info(request.headers);
      response.writeHead(200, {'Content-Type': '*'});
      response.end();
    }

    if (request.method === 'GET') {
      var myThing = url.parse(request.url)
        .query
        .split('&')[1]
        .split('=')[1];
      
      var myObj = JSON.parse(decodeURIComponent(myThing));
      if (myObj.method === 'jsonform_fkey_search') {

        console.info('got data from the request!');
        console.info('=================================================');
        console.info();
        console.info('refCol: ', myObj.params.refCol);
        console.info('refTable: ', myObj.params.refTable);
        console.info('filterSchemaId: ', myObj.params.filterSchemaId);
        console.info('pathToField: ', myObj.params.pathToField);
        console.info('Filters: ', myObj.params.filters);
        console.info('=================================================');

        if (a) {
          var jsonStringy = JSON.stringify(
            {
              result: [
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan10', id: 01, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan11', id: 02, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan12', id: 03, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan13', id: 05, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan14', id: 04, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan15', id: 06, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan16', id: 07, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan17', id: 08, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan18', id: 09, test123: 'ivan' } },
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan19', id: 10, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan21', id: 11, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan22', id: 12, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Dragan23', id: 13, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan10', id: 14, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan11', id: 15, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan12', id: 16, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan13', id: 17, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan14', id: 18, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan15', id: 19, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan16', id: 20, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan17', id: 21, test123: 'ivan' } },
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan18', id: 31, test123: 'ivan' } },
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan19', id: 32, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan21', id: 33, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan22', id: 38, test123: 'ivan' } }, 
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'Fragan23', id: 39, test123: 'ivan' } },
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'None', id: '', test123: 'ivan' } },
              ]
            }
          );
          response.write(jsonStringy);
          console.info('================================================');
          console.info('Sending: ', jsonStringy);
          console.info('================================================');

        } else {
          response.write(JSON.stringify(
            {
              result: [
                { refFieldName : 'id', refFieldTitleName: 'title', data: { title: 'No results found!', id: '', test123: 'ivan' } }, 
              ]
            }
          ));
          console.info('================================================');
          console.info('Sending: ', 'nothing!');
          console.info('================================================');

        }
        a = !a;

        response.end();
        return;
      }

      var obj;

      /* The reqyestFile contorlka */
      // response.write('{"result":{"schema":{"id":"http://jschemas.tbpro.com/tblib/jf/playground/14-fileRequest","type":"object","properties":{"massive":{"type":"array","title":"arra","items":{"title":"test","type":"object","properties":{"files":{"type":["string","null","array"],"title":"File to upload2","format":"file","items":{"type":"string"},"isMultiple":true}}}}}},"form":{"schemaId":"http://jschemas.tbpro.com/tblib/jf/playground/14-fileRequest","jsonformVersion":"2.0","fields":[{"key":"massive"},{"type":"submit","title":"Submit"}]}}}');
      // Table object advanced kontrolka
      // response.write('{ "result":{"schema":{"id":"http://jschemas.tbpro.com/tblib/jf/playground/8-table-object-advanced","type":"object","properties":{"range_values":{"type":"object","title":"meta af","additionalProperties":{"type":"object","title":"meta af2","properties":{"fee_name":{"type":["string","null"],"title":"fixed"},"range10":{"type":"object","title":"meta af3","properties":{"fixed":{"type":["number","null"],"title":"fixed"},"perc":{"type":["number","null"],"title":"fixed"}}}}}}}},"form":{"required":false,"$schemaId":"http://jschemas.tbpro.com/tblib/jf/playground/8-table-object-advanced","jsonformVersion":"2.0","fields":[{"title":"EUR fees","type":"tableobject","key":"range_values","items":{"type":"tablerow","items":[{"title":"Id of row","type":"helptext","key":"range_values{}","content":"<p>alert(\'hi\');</p>My good tool {{objKey}}"},{"title":"Fee Name","key":"range_values{}/fee_name"},{"title":"Range 400.01 - 500 (Amount)","key":"range_values{}/range10/fixed"},{"title":"Range 400.01 - 500 (%)","key":"range_values{}/range10/perc"}]}},{"title":"Submit","type":"submit"}]},"content":{"$schemaId":"http://jschemas.tbpro.com/tblib/jf/playground/8-table-object-advanced","_JSONFORMS_CONTENT_VERSION":"2.0","range_values":{"property1":{"fee_name":"Такса Получаване","range10":{"fixed":10,"perc":10},"ordering":200.1}}}}}');

      // Casual kontrolka
      // obj = inputTextBasic;

      // File inside the JSON
      // obj = base64FileUpload;

      // FKey kontrolka
      // obj = foreignKeyFull;
      
      // velislav kontrolka - no key in there
      // obj = no_key_form;

      // no base64 upload file 
      obj = foreignKeyBasic;


      var result = {
        result: obj
      };

      response.write(JSON.stringify(result));
      response.end(); 
    }

    if (request.method === 'POST') {
      var form = new multiparty.Form();
      var body = '';

      if (request.headers['content-type'].includes('multipart/form-data')) {
        
        form.parse(request, function (err, fields, files) {
          console.info('==============');
          console.info("Error: ", err);
          console.info('==============');
          console.info(files);
          console.info('==============');
          console.info(JSON.stringify(JSON.parse(decodeURIComponent(fields.data[0].split('&')[1].split('=')[1])).params.content));
          console.info('==============');
          console.info(fields);
          console.info('==============');

          for (var key in files) {

            var filesInArray = files[key];
            for (var i = 0; i < filesInArray.length; i++) {
              var currFile = filesInArray[i];

              console.info("CURRENT FILE: ", JSON.stringify(currFile));
              console.info("CURRENT FILEPATH: ", JSON.stringify(currFile.path));
              console.info("CURRENT FILEName: ", JSON.stringify(currFile.originalFilename));
              console.info("CURRENT File size: ", JSON.stringify(currFile.size));

              console.info('Moving file from ' + currFile.path + ' to ' + '/home/momo/Desktop/uploads/' + currFile.originalFilename);
              fs.copyFile(currFile.path, '/home/momo/Desktop/uploads/' + currFile.originalFilename, (err) => {
                console.info("Some error occured? ", JSON.stringify(err));
              });

              console.info('==============');
            }

          } 

          var obj = {};
          obj.result = JSON.parse(decodeURIComponent(fields.data[0].split('&')[1].split('=')[1])).params.content;
          response.write(JSON.stringify(obj));
          response.end();
        });

      } else {
        request.on('data', function (data) {
          body += data;
        });

        request.on('end', function () {
          var post = qs.parse(body);
          var obj = {};
          obj.result = JSON.parse(post.payload_jsonrpc).params.content;


          // obj.result['mo~od'] = 100;
          // obj.result = _.merge(obj.result, {
          //     random: 200, gud: 300, ttt: {momo: 300}, 
          //     ttt2: ["test", "test2", "test3"], 
          //     ttt3: [{tmux: "test", tmux2: 100}, {tmux: "test2", tmux2: 200}, {tmux: "test3", tmux2:300}],
          //     ttt5: { ttt4: [{tmux: "test", tmux2: 100}, {tmux: "test2", tmux2: 200}, {tmux: "test3", tmux2:300}]}
          // }); 

          console.log(JSON.stringify(obj));


          // test of the velislav rerender of jf on submit

          // obj.result['displays'][0]['display_denom_mode'] = 2;

          // obj.result['displays'][0]['idx'] = 200;
          // obj.result['displays'][0]['number'] = 20012;
          // obj.result['displays'][0]['identifier'] = "NIOINI200";

          // obj.result['displays'][1]['idx'] = 220;
          // obj.result['displays'][1]['number'] = 20012
          // obj.result['displays'][1]['identifier'] = "NIOINI";

          var result = {
            // test of the server-side validation on client-side input fields

            // error: {  
            //   message: "Error", 
            //   code: "000",
            //   data: {
            //     status : {
            //       status: 'ui_error',
            //       message: "Error", 
            //       code: "000",
            //     },
            //     details: {
            //       validation_errors: [
            //         {
            //           'table_name': 'brands',
            //           'msg_tmpl': undefined,
            //           'title_path': '',
            //           'col_name': 'settings_json',
            //           'msg_tmpl_data': undefined,
            //           'error_type': 'TbPeerError',
            //           'code': '1900',
            //           'status': undefined,
            //           'data_path': '.displays[0].number',
            //           'msg': 'Application error!',
            //           'wrong_data': 200
            //         },
            //         {
            //           'title_path': '',
            //           'table_name': 'brands',
            //           'msg_tmpl': undefined,
            //           'status': undefined,
            //           'msg': 'Application error!',
            //           'wrong_data': 'MOMO',
            //           'data_path': '.displays[0].is_public',
            //           'error_type': 'TbPeerError',
            //           'code': '1900',
            //           'msg_tmpl_data': undefined,
            //           'col_name': 'settings_json'
            //         }
            //       ]
            //     }
            //   }
            // },
            result: {
              // status: {
              //   status: 'ui_error',
              //   msg: "Error", 
              //   code: "000",
              // },
              content: obj.result,
            },
            jsonrpc: "2.0",
          };

          response.write(JSON.stringify(result));
          response.end();
        });
      }
    }
  }
  catch (err) {
    console.log(200, err);
  }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});
