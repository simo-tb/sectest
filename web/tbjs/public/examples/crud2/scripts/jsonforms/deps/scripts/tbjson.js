tbjson = {};

(function(w) {
  plv8Require('Ajv');

  var ajv = new Ajv({
    verbose: true,
    loadSchema: tbjsonLoadSchema
  });
  var ajv2tb = new Ajv2tb(ajv);


  /**
   * Prints JSON in human readable form
   * @arguments jsonObj {Object} JSON object to print
   * @return {String} stringified object
   **/
  function tbjsonPrettyPrint(jsonObj) {
    return JSON.stringify(jsonObj, null, '\t');
  }


  /**
   *
   **/
  function tbjsonLoadSchema(schemaId, cb) {
    schema = tbjsonGetSchema(schemaId);
  }


  /**
   * Extract foreign keys from schema
   **/
    function tbjsonExtractSchemaForeignKeys(schema, pathArr, result) {
        var newPathArr;
        pathArr = pathArr || [];
        result = result || [];

        if(schema.properties) {
            for(var key in schema.properties) {
                newPathArr = pathArr.concat(key);
                tbjsonExtractSchemaForeignKeys(schema.properties[key], newPathArr, result);
            }
        } else if(schema.items) {
            newPathArr = pathArr.concat('[]');
            tbjsonExtractSchemaForeignKeys(schema.items, newPathArr, result);
        } else {
            var refTable = schema['refTable'];
            var refField = schema['refField'];
            var refType = schema['refType'];

            if(refTable && refField) {
                result.push({
                    refTable: refTable,
                    refCol: refField,
                    refType: refType,
                    pathArr: pathArr,
                    dataType: schema['type']
                });

            } else if (refTable || refField) { //TODO refType
                throw new Error('[tbjson.extractSchemaForeignKeys] Required ref* params not set: refTable = "' + refTable + '"; refField = "' + refField + '"');
            }
        }

	    return result;
    }


  /**
  * Gets NEW and OLD row and returns object only with the keys that have changed and their new value
  * @param {Object} OLD old row values
  * @param {Object} NEW new row values
  * @param {Array} checkCols which cols to check for changes
  * @return {Object} only changed fields with NEW values
  **/
  function tbjsonOldnewDiff(OLD, NEW, checkCols) {
    var result = [];

    if(checkCols instanceof Array) {
      checkCols = Object.keys(OLD);
    }

    for(var i = 0, l = checkCols.length; i < l; i++) {
      var key = checCols[i];

      if(OLD[key] !== NEW[key]) {
        result.push(key);
      }
    }

    return result;
  }

  function tbjsonRemoveSchema(url) {
    ajv.removeSchema(url);
  }


  function tbjsonMountSchema(schema) {
    if(typeof schema) {
      var rows = plv8.execute('SELECT * FROM tbjson_schemas WHERE id = $1', [schemaId]);

      if(rows.length !== 1) {
        throw new Error('[tbjson.tbjsonGetSchemaById] Expected exactly one schema with id "' + schemaId + '", but ' + rows.length + ' found');
      }

      ajv.compile(rows[0].schema_json);
    } else {
      ajv.compile(schema);
    }
    return rows[0];
  }

  /**
   *
   */
  function tbjsonAssertValidJsonFKeysPerRow(tableName, row) {
    var rowsFKeys = plv8.execute('SELECT * FROM tbjson_fkeys WHERE fk_table = $1 ', [tableName]);

    for(var i = 0, l = rowsFKeys.length; i < l; i++) {
      var rowFKey = rowsFKeys[i];
      var fkValue = tbjsonGet(JSON.parse(row[rowFKey.fk_col]), rowFKey.fk_path);

      if(fkValue === null && rowFKey.is_nullable === true) {
          continue;
      }

      if(fkValue instanceof Array)
      {
        for(var k = 0; k < fkValue.length; k++) {
          tbjsonCheckRefValue(rowFKey.ref_table, rowFKey.ref_col, fkValue[k]);
        }
      }
      else
      {
         tbjsonCheckRefValue(rowFKey.ref_table, rowFKey.ref_col, fkValue);
      }
//      var sql = '\
//        SELECT 1 AS count \
//        FROM ' + plv8QuoteIdent(rowFKey.ref_table) + ' \
//        WHERE ' + plv8QuoteIdent(rowFKey.ref_col) + '=' + plv8Quote(fkValue) + ' \
//        LIMIT 1 FOR NO KEY UPDATE \
//      ';
//
//      var countValues = plv8.execute(sql);
//
//      if(countValues.length !== 1) {
//        throw new Error('[fkey] Referenced value ' + fkValue + ' does not exist in table "' + rowFKey.ref_table + '" colulmn "' + rowFKey.ref_col + '" as primary key');
//      }
    }
  }

  function tbjsonCheckRefValue(ref_table, ref_col, fkValue) {
       var sql = '\
        SELECT 1 AS count \
        FROM ' + plv8QuoteIdent(ref_table) + ' \
        WHERE ' + plv8QuoteIdent(ref_col) + '=' + plv8Quote(fkValue) + ' \
        LIMIT 1 FOR NO KEY UPDATE \
      ';

      var countValues = plv8.execute(sql);

      if(countValues.length !== 1) {
        throw new Error('[fkey] Referenced value ' + fkValue + ' does not exist in table "' + ref_table + '" colulmn "' + ref_col + '" as primary key');
      }
  }

  /**
   *
   **/
  function tbjsonAssertValidAgaistJsonSchemaPerRow(tableName, row) {
    var schemaRows = plv8.execute('SELECT * FROM tbjson_schema_cols WHERE table_name = $1', [tableName]);

    for(var i = 0, l = schemaRows.length; i < l; i++) {
      var schemaRow = schemaRows[i];
      var validateMessage = tbjsonValidate(schemaRow.schema_id, row[schemaRow.col_name]);

      if(validateMessage !== true) {
          throw new Error('[schema] Given json value is not valid against "' + schemaRow.schema_id + '"' + validateMessage);
      }
    }
  }

  function tbjsonValidate(schemaId, jsonData) {
    log(NOTICE, 'tbjson::tbjsonValidate(schemaId, jsonData): ', schemaId, '; ', jsonData);

    var schema = tbjsonGetSchema(schemaId);
    var valid = ajv2tb.validate(schema, JSON.parse(jsonData));

    if(valid !== true) {
      return valid.validationErrors[0];
    }

    return valid;
  };

  function tbjsonGetSchema(schemaId) {
    var schema = ajv.getSchema(schemaId);

    if(schema) {
      schema = schema.schema;
    } else {
      var schemaRows = plv8.execute('SELECT * FROM tbjson_schemas WHERE id = $1', [schemaId]);

      if(schemaRows.length !== 1) {
        throw new Error('Unable to find specified schema with id = "' + schemaId + '"');
      }

      schema = schemaRows[0].schema_json;
      schema = JSON.parse(schema);
    }

    ajv.compileAsync(schema, function(err, validate) {
      if(err) {
        throw new Error(err);
      }
    });

    return schema;
  }

  function tbjsonGetSchemaWithDefinitions(schemaId) {
    var schema = tbjsonGetSchema(schemaId);
    var definitions = {};
    var ajv1 = new Ajv({
      loadSchema: function(schemaId, cb) {
        definitions[schemaId] = tbjsonGetSchema(schemaId);
        cb(null, definitions[schemaId]);
      },
    });

    ajv1.compileAsync(schema, function(err, validate) {
      if(err) {
        throw new Error(err);
      }
    });

    if(typeof schema.definitions === 'object') {
      for(var defId in schema.definitions) {
        definitions[defId] = schema.definitions[defId];
      }
    }

    schema.definitions = definitions;

    return schema;
  }


  /**
   * Validate if given schema is valid JSON schema v4/5
   * @return {Boolean} schema is valid?
   **/
  function tbjsonValidateSchema(schema) {
    return ajv.validateSchema(schema);
  }


  /**
   * Get property value by path
   * @param  {Object} obj          object to search in
   * @param  {(String|Array)} path         path to search; if string, properties are using "." (dot) delimiter
   * @param  {*} defaultValue default value if undefined
   * @return {*}              found value
   * @example
   * var obj = { foo: { bar: 5, qux: undefined } };
   * TB.get( obj, 'foo.bar', null ); // 5
   * TB.get( obj, 'foo.baz' ); // undefined
   * TB.get( obj, 'foo.qux', null ); // null
   * TB.get( obj, 'foo.baz.qux', null ); // null
   * TB.get( obj, ['foo', 'bar'] ); // 5
   */
  function tbjsonGet( obj, path, defaultValue ) {
    var pathArr = ( typeof path === 'string' ) ? path.split( '.' ) : path;

    return pathArr.reduce( function( prev, curr ) {
        if(curr == "[]") {
            return prev;
        }

        if(prev instanceof Array) {
            var arr = [];

            for(var i = 0; i < prev.length; i++) {
                arr.push(prev[i][curr]);
            }

            return arr;
        }

        if(prev && prev[curr] !== undefined) {
            return prev[curr];
        } else {
            return defaultValue;
        }
        //return ( prev && prev[curr] !== undefined ) ? prev[curr] : defaultValue;
    }, obj );
  };

  function tbjsonError(namespace, e) {
    var msg = '';

    msg += '[tbjson]';
    msg += '[' + e.message + ']';

    if(e instanceof Error) {
      throw new Error(msg + e.message);
    } else {
      // Set trigger data
      if(typeof TG_NAME !== undefined) {
        e.trigger = {
          NEW: NEW,
          OLD: OLD,
          TG_NAME: TG_NAME,
          TG_WHEN: TG_WHEN,
          TG_LEVEL: TG_LEVEL,
          TG_OP: TG_OP,
          TG_RELID: TG_RELID,
          TG_TABLE_NAME: TG_TABLE_NAME,
          TG_TABLE_SCHEMA: TG_TABLE_SCHEMA,
          TG_ARGV: TG_ARGV,
        };
      }

      msg += '[JSON]';
      msg += JSON.stringify(e);
      msg += '[/JSON]';
    }
  }

  tbjson = {
    prettyPrint: tbjsonPrettyPrint,
    extractSchemaForeignKeys: tbjsonExtractSchemaForeignKeys,
    mountSchema: tbjsonMountSchema,
    removeSchema: tbjsonRemoveSchema,
    validateSchema: tbjsonValidateSchema,
    validate: tbjsonValidate,
    get: tbjsonGet,
    getSchema: tbjsonGetSchema,
    getSchemaWithDefinitions: tbjsonGetSchemaWithDefinitions,
    assertValidAgaistJsonSchemaPerRow: tbjsonAssertValidAgaistJsonSchemaPerRow,
    assertValidJsonFKeysPerRow: tbjsonAssertValidJsonFKeysPerRow,
    Error: tbjsonError,
  };
})();
