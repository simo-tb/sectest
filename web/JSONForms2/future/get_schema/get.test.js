var chai = require('chai');
var expect = chai.expect;
var SchemaResolver = require('./get');

/* eslint-disable comma-dangle */
/* eslint-env mocha */

var schema = {
  type: 'object',
  properties: {
    foo: {
      type: 'object',
      properties: {
        bar: {
          type: 'integer'
        },
        arr: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              baz: {
                type: 'string'
              }
            }
          }
        }
      },
    },
  }
};

describe('getByPointer', function () {
  describe('simple getByPointer without $refs', function () {
    var p = new SchemaResolver(schema);

    it('should get first level of the object', function () {
      expect(p.getByPointer('/foo')).be.equal(schema.properties.foo).and.not.be.undefined;
    });

    it('should get second level of the object', function () {
      expect(p.getByPointer('/foo/bar')).be.equal(schema.properties.foo.properties.bar).and.not.be.undefined;
    });

    it('should get array schema by index', function () {
      expect(p.getByPointer('/foo/arr/55')).be.equal(schema.properties.foo.properties.arr.items).and.not.be.undefined;
    });

    it('should get array schema by index', function () {
      expect(p.getByPointer('/foo/arr/55/baz')).be.equal(schema.properties.foo.properties.arr.items.properties.baz).and.not.be.undefined;
    });

    it('should not get second level of the object with wrong key', function () {
      expect(p.getByPointer('/foo/bar1')).be.undefined;
    });

    it('should not get array schema when given string instead of integer', function () {
      expect(p.getByPointer('/foo/arr/asdasd')).be.undefined;
    });

    it('should not get third level of the object with wrong key', function () {
      expect(p.getByPointer('/foo/quz/baz/foo')).be.undefined;
    });
  });

  describe('getByPointer with $refs in the same schema', function () {
    var schema = {
      type: 'object',
      definitions: {
        bar: {
          type: 'object',
          properties: {
            baz: { type: 'string', title: '#/definitions/baz' },
          },
        },
        barProxy: { $ref: '#/definitions/bar', },
        self: { $ref: '#/definitions/self' },
        loop1: { $ref: '#/definitions/loop2', },
        loop2: { $ref: '#/definitions/loop3', },
        loop3: { $ref: '#/definitions/loop1', },
        toSelf: { $ref: '#/definitions/self', },
        toLoop: { $ref: '#/definitions/loop1', },
        allowedLoop: {
          type: 'text',
          properties: {
            baz: { $ref: '#/definitions/allowedLoop', },
          }
        },
      },
      properties: {
        foo: { $ref: '#/definitions/bar', },
        qux: {
          type: 'object',
          properties: {
            max: { $ref: '#/definitions/bar', }
          }
        },
        proxy: { $ref: '#/definitions/barProxy', },
        self: { $ref: '#/definitions/self', },
        loop: { $ref: '#/definitions/loop1', },
        toSelf: { $ref: '#/definitions/toSelf', },
        toLoop: { $ref: '#/definitions/toLoop', },
        allowedLoop: { $ref: '#/definitions/allowedLoop', },
      }
    };
    var p = new SchemaResolver(schema);

    it('should resolve reference to definitions', function () {
      expect(p.getByPointer('/foo')).be.equal(schema.definitions.bar);
    });

    it('should resolve inner $ref object', function () {
      expect(p.getByPointer('/qux/max/baz')).be.equal(schema.definitions.bar.properties.baz);
    });

    it('should resolve proxy $ref object', function () {
      expect(p.getByPointer('/proxy/baz')).be.equal(schema.definitions.bar.properties.baz);
    });

    it('should not throw when schema has properties which reference to itself', function () {
      expect(() => p.getByPointer('/allowedLoop')).not.to.throw('reference loop');
    });

    it('should throw when schema references to itself', function () {
      expect(() => p.getByPointer('/self')).to.throw('reference loop');
    });

    it('should throw when schema references to other schema causing loop', function () {
      expect(() => p.getByPointer('/loop')).to.throw('reference loop');
    });

    it('should throw when schema references to other schema which references to itself', function () {
      expect(() => p.getByPointer('/toSelf')).to.throw('reference loop');
    });

    it('should throw when schema references to other schema which references to a loop', function () {
      expect(() => p.getByPointer('/toLoop')).to.throw('reference loop');
    });
  });

  describe('getByPointer with $ref URL to foreign schema in definitions', function () {
    var schema = {
      type: 'object',
      $$refSchemas: {
        'http://test.com/path/to/schema2': {
          type: 'object',
          properties: {
            qux: { type: 'string' },
          },
        },
      },
      definitions: {
        'http://test.com/path/to/schema10': {
          type: 'object',
          properties: {
            bar: { type: 'null', },
          },
        },
        'http://test.com/path/to/schema10#/properties/path/properties/to/properties/field': {
          type: 'null',
        },
        quux: {
          $ref: 'http://test.com/path/to/schema10',
        },
      },
      properties: {
        foo: { $ref: 'http://test.com/path/to/schema10', },
        bar: { $ref: 'http://test.com/path/to/schema10#/properties/path/properties/to/properties/field', },
        baz: { $ref: 'quux', },
      }
    };
    var p = new SchemaResolver(schema);

    it('should resolve $ref URL to `definitions` prop', function () {
      expect(p.getByPointer('/foo/bar')).be.equal(schema.definitions['http://test.com/path/to/schema10'].properties.bar);
    });

    it('should resolve $ref URL having hash (#/path/to/sth) to `definitions` prop', function () {
      expect(p.getByPointer('/bar')).be.equal(schema.definitions['http://test.com/path/to/schema10#/properties/path/properties/to/properties/field']);
    });

    it('should resolve $ref to definitions and then by $ref URL to `definitions` prop', function () {
      expect(p.getByPointer('/baz/bar')).be.equal(schema.definitions['http://test.com/path/to/schema10'].properties.bar);
    });

    // TODO test loops
  });

  describe('getByPointer with $ref URL to foreign schema in definitions', function () {
    var schema = {
      type: 'object',
      $$refSchemas: {
        'http://test.com/path/to/schema20': {
          type: 'object',
          properties: {
            bar: { type: 'string' },
            path: {
              type: 'object',
              properties: {
                to: {
                  type: 'object',
                  properties: {
                    field: { type: 'null', },
                  },
                },
              },
            },
          },
        },
        'http://test.com/path/to/schema21': {
          type: 'object',
          properties: {
            qux: { $ref: 'http://test.com/path/to/schema20#/properties/path', },
          },
        },
      },
      definitions: {},
      properties: {
        foo: { $ref: 'http://test.com/path/to/schema20', },
        bar: { $ref: 'http://test.com/path/to/schema20#/properties/path/properties/to', },
        baz: { $ref: 'http://test.com/path/to/schema21', },
      }
    };

    var p = new SchemaResolver(schema);

    it('should resolve $ref to `$$refSchemas` prop', function () {
      expect(p.getByPointer('/foo/bar')).be.equal(schema.$$refSchemas['http://test.com/path/to/schema20'].properties.bar);
    });

    it('should resolve $ref URL having hash (#/path/to/sth) to `$$refSchemas` prop', function () {
      expect(p.getByPointer('/bar/field')).be.equal(schema.$$refSchemas['http://test.com/path/to/schema20'].properties.path.properties.to.properties.field);
    });

    it('should resolve $ref URL to `$$refSchemas` prop which has another $ref', function () {
      expect(p.getByPointer('/baz/qux/to/field')).be.equal(schema.$$refSchemas['http://test.com/path/to/schema20'].properties.path.properties.to.properties.field);
    });
  });
});

describe('getByPointer with $ref URL to foreign schema in definitions', function () {

});
