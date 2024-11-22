
--::CRUD
CREATE TABLE jf_tables (
  id serial primary key,

  --::Schema
  schema_id text not null references tbjson_schemas,

  --::Code name
  --::@flags:name
  --::@searchable:*
  code text not null unique,

  --::UI Form name
  --::@flags:name
  --::@searchable:*
  name text not null unique,

  --::Description
  --::@searchable:*
  descr text,

  --::Table name
  --::@searchable:*
  db_obj_name text,

  --::List presentation JSON
  table_json jsonb not null

);

delete from jf_tables where schema_id = 'http://jsonschemas.telebid-pro.com/tblib/db/jf_tables';
delete from jf_forms where schema_id = 'http://jsonschemas.telebid-pro.com/tblib/db/jf_tables';
delete from tbjson_schemas where id = 'http://jsonschemas.telebid-pro.com/tbjson/draft-04-custom';
delete from tbjson_schemas where id = 'http://jsonschemas.telebid-pro.com/tblib/db/jf_tables/table_json';
delete from tbjson_schemas where id = 'http://jsonschemas.telebid-pro.com/tblib/db/jf_tables';


INSERT INTO tbjson_schemas(id, schema_json)
  VALUES ('http://jsonschemas.telebid-pro.com/tblib/db/jf_tables', $schema$

    {"id": "http://jsonschemas.telebid-pro.com/tblib/db/jf_tables", "type": "object", "title": "CRUD presentations", "$schema": "http://jsonschemas.telebid-pro.com/tbjson/draft-04-custom", "project": "tblib", "version": 0, "required": ["schema_id", "name", "db_obj_name"], "properties": {"name": {"name": true, "type": "string", "title": "UI name", "ordering": 20, "searchable": "*"}, "descr": {"type": ["null", "string"], "title": "Description", "ordering": 40, "searchable": "*"}, "code": {"type": "string", "title": "Program name", "ordering": 30, "translate": true, "searchable": "*"}, "schema_id": {"type": "string", "title": "Schema", "refCol": "id", "ordering": 10, "refTable": "tbjson_schemas", "filterSchema": {"$ref": "http://jsonschemas.telebid-pro.com/tblib/db/tbjson_schemas"}}, "db_obj_name": {"type": "string", "title": "Table name", "ordering": 50, "searchable": "*"}, "table_json": {"allOf": [{"$ref": "http://jsonschemas.telebid-pro.com/tblib/db/jf_tables/table_json"}], "title": "List presentation JSON", "ordering": 60, "type": "string"}}}

    $schema$);

INSERT INTO tbjson_schemas(id, schema_json)
  VALUES ('http://jsonschemas.telebid-pro.com/tblib/db/jf_tables/table_json', $schema$
    {"id": "http://jsonschemas.telebid-pro.com/tblib/db/jf_tables/table_json"}
  $schema$
);

INSERT INTO tbjson_schemas(id, schema_json)
  VALUES ('http://jsonschemas.telebid-pro.com/tbjson/draft-04-custom', $schema$
    {"id": "http://jsonschemas.telebid-pro.com/tbjson/draft-04-custom", "allOf": [{"type": "object", "properties": {"refCol": {"type": "string"}, "refType": {"enum": ["fkey", "reference"], "type": "string", "default": "reference"}, "refTable": {"type": "string"}, "translated": {"type": "boolean", "default": false}}, "dependencies": {"refCol": ["refTable"], "refType": ["refTable", "refCol"], "refTable": ["refCol"]}}, {"$ref": "http://json-schema.org/draft-04/schema#"}], "$schema": "http://json-schema.org/draft-04/schema", "description": "Telebid extensions to JSON Schema"}
  $schema$
);

INSERT INTO jf_tables (schema_id, code, name, descr, db_obj_name, table_json)
  VALUES ('http://jsonschemas.telebid-pro.com/tblib/db/jf_tables', 'JF::jf_tables', 'JSONForms tables', 'CRUD presentation', 'jf_tables', $table$

{"schemaId":"http://jsonschemas.telebid-pro.com/tblib/db/jf_tables","columns":{"actions": {"isActionsCol": true, "renderFn": "actions"}, "name":null,"code":null,"db_obj_name":null,"custom_col_name":{"ordering":10000,"renderFn":"renderImage","dtCol":{"data":null,"sortable":false,"title":"CUSTOM"}}}}

  $table$);

INSERT INTO jf_forms (schema_id, code, name, descr, db_obj_name, form_json)
  VALUES ('http://jsonschemas.telebid-pro.com/tblib/db/jf_tables', 'JF::jf_tables', 'JSONForms tables', 'JSONForms tables', 'jf_tables', $form$

    {"fields": null, "isStrict": false, "schemaId": "http://jsonschemas.telebid-pro.com/tblib/db/jf_tables", "jsonformVersion": "2.0"}

  $form$);
