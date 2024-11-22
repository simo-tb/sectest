var chai = require('chai');
var expect = chai.expect;
var TB = require('../../dist/js/tb.core.js').TB;

describe('Testing file `TB.core.js` in tbjs', function() {
	it('TB namespace must be defined', function() {
		expect(TB).to.exist;
		expect(TB).to.be.an('object');
	});



	describe('TB.getUniqueId must return unique id', function() {
		it('TB.getUniqueId must return different every time called', function() {
			expect(TB.getUniqueId()).to.not.equal(TB.getUniqueId());
			expect(TB.getUniqueId('test')).to.not.equal(TB.getUniqueId('test'));
		});

		it('TB.getUniqueId must prepend value with given string', function() {
			var prepended = TB.getUniqueId('test');

			expect(prepended).to.match(/^test/);
		});

	});



	describe('TB.isArrayLike must check if value looks like array', function() {
		it('must accept array', function() {
			expect(TB.isArrayLike([])).to.be.ok;
			expect(TB.isArrayLike(['a', 'b'])).to.be.ok;
			expect(TB.isArrayLike(new Array())).to.be.ok;
			expect(TB.isArrayLike(new Array(100))).to.be.ok;
		});

		it('must accept array like object', function() {
			expect(TB.isArrayLike({
				length: 0
			})).to.be.ok;
			expect(TB.isArrayLike({
				length: 100
			})).to.be.ok;
		});

		it('must accept string', function() {
			expect(TB.isArrayLike('string')).to.be.ok;
			expect(TB.isArrayLike('')).to.be.ok;
		});

		it('must accept arguments object', function() {
			expect(TB.isArrayLike(arguments)).to.be.ok;
		});

		it('must not accept object without length property', function() {
			expect(TB.isArrayLike({})).to.not.be.ok;
		});

		it('must not accept null', function() {
			expect(TB.isArrayLike(null)).to.not.be.ok;
		});

		it('must not accept undefined', function() {
			expect(TB.isArrayLike(undefined)).to.not.be.ok;
		});

		it('must not accept boolean', function() {
			expect(TB.isArrayLike(false)).to.not.be.ok;
			expect(TB.isArrayLike(true)).to.not.be.ok;
		});

		it('must not accept number', function() {
			expect(TB.isArrayLike(555)).to.not.be.ok;
			expect(TB.isArrayLike(NaN)).to.not.be.ok;
			expect(TB.isArrayLike(Infinity)).to.not.be.ok;
		});
	});



	describe('TB.toArray must convert value to array ', function() {
		it('must convert arguments to array', function() {
			var args;
			(function(one, two) {
				args = arguments;
			})(1, 'string');
			expect(TB.toArray(args)).to.deep.equal([1, 'string']);
		});

		it('must convert array to array', function() {
			var arr = [1, 'string'];
			expect(TB.toArray(arr)).to.deep.equal(arr);
		});

		it('must convert null to array', function() {
			expect(TB.toArray(null)).to.be.an('array');
		});

		it('must convert undefined to array', function() {
			expect(TB.toArray(undefined)).to.be.an('array');
		});

		it('must convert array like object to array', function() {
			expect(TB.toArray({
				0: 'look',
				2: 55,
				length: 3
			})).to.deep.equal(['look', undefined, 55]);
			expect(TB.toArray({
				"0": 'look',
				"2": 55,
				length: 3
			})).to.deep.equal(['look', undefined, 55]);
			expect(TB.toArray({
				"0": 'look',
				1: true,
				length: 2
			})).to.deep.equal(['look', true]);
		});

		it('must convert string to array', function() {
			expect(TB.toArray('string')).to.deep.equal('string'.split(''));
		});

		it('must convert object to array of it\'s values', function() {
			expect(TB.toArray({
				as: 'val',
				bas: 'val2',
			}).sort()).to.deep.equal(['val', 'val2'].sort());
		});

		it('must throw exception when converting boolean', function() {
			expect(function() {
				TB.toArray(true)
			}).to.throw(TypeError);
			expect(function() {
				TB.toArray(false)
			}).to.throw(TypeError);
		});

		it('must throw exception when converting number', function() {
			expect(function() {
				TB.toArray(555)
			}).to.throw(TypeError);
		});
	});


	describe('TB.toPx should append px', function() {
		it('must return number with "px" appended', function() {
			expect(TB.toPx(10)).to.equal('10px');
		});
	});


	describe('TB.get should return value by path', function() {
		var obj = { foo: { bar: 5, qux: undefined, baz: [1, 2, 3, 4] } };

		it('get path by string path', function() {
			expect(TB.get( obj, 'foo.bar', null )).to.equal(5);
			expect(TB.get( obj, 'foo.bar1', null )).to.be(undefined);
			expect(TB.get( obj, 'foo.qux', 'default' )).to.equal('default');
			expect(TB.get( obj, 'foo.baz.0' )).to.equal(1);
			expect(TB.get( obj, 'foo.baz.100' )).to.equal(undefined);
			expect(TB.get( obj, 'foo.baz.100' ), 'default').to.equal('default');
			expect(TB.get( obj, 'foo.baz.qux' )).to.equal(undefined);
		});

		it('must return value by array given path', function() {
			expect(TB.get( obj, ['foo', 'bar'] )).to.equal(5);
			expect(TB.get( obj, ['foo', 'bar', 'baz'], 'default')).to.equal('default');
		});
	});


	describe('TB.isDate must return true if value is instance of Date', function() {
		it('must accept instance of Date', function() {
			expect(TB.isDate(new Date())).to.be.ok;
		});

		it('must not accept string or number', function() {
			expect(TB.isDate('2015-05-04')).to.be.not.ok;
			expect(TB.isDate(new Date() + 0)).to.be.not.ok;
		});
	});

	describe('TB.isArray must return true if value is array', function() {
		it('TB.isArray must return true if array', function() {
			expect(TB.isArray([])).to.be.ok;
			expect(TB.isArray(new Array(10))).to.be.ok;
			expect(TB.isArray(arguments)).to.be.not.ok;
			expect(TB.isArray('')).to.be.not.ok;
			expect(TB.isArray({
				length: 0
			})).to.be.not.ok;
		});



	});

});
