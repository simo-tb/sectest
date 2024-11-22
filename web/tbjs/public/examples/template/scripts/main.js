'use strict';

var examples = [

	{
		title: 'Simple example',
		tmpl: `Hello {{ name }}!`,
		data: {
			name: "Telebid",
		},
	},

	{
		title: 'More complex example',
		tmpl: `Hello {{ guest }}. My name is {{ name.first }} {{ name.last }}.{{# canHearTheSecret }} I want to tell you a little secret - {{ theSecret }}! {{/ canHearTheSecret }}{{^ canHearTheSecret }} Let me introduce myself. {{/ canHearTheSecret }}{{# myself }} Things I enjoy: {{@ hobbies }} {{ . }}, {{/ hobbies }} {{/ myself }}`,
		data: {
			guest: 'my friend',
			name: {
				first: 'Ivan',
				last: 'Ivanov',
			},
			canHearTheSecret: true,
			theSecret: 'Kosyo is sitting next to me',
			myself: {
				hobbies: ['trekking', 'roadcycling', 'programming'],
			}
		}
	},

	{
		title: 'Filters example',
		tmpl: `datetime: {{ date | datetime }}
date: {{ date | date }}
time: {{ date | time }}
number: {{ number | number }}
currency:{{ money1 | currency : 'USD' }}, {{ money2 | currency : currencyCode }}
checkbox: {{ iNeedThem | checkbox }}
link: {{{ url | link }}}
link: {{{ url | link : proplayer }}}
email: {{{ contact | email }}}
email: {{{ contact | email : name }}}
`,
		data: {
			date: new Date().toISOString(),
			money1: _.random(1000, 1000000),
			money2: _.random(1000, 1000000),
			number: _.random(1000, 1000000),
			currencyCode: 'EUR',
			iNeedThem: !!(_.random(10) % 2 ),
			url: 'https://www.google.bg/webhp?ie=UTF-8#q=ana%20ivanovic',
			contact: 'ivan.ivanov@telebid-pro.com',
			name: 'Ivan Ivanov',
			proplayer: 'Ana Ivanovic',
		},
	},

	{
		title: 'Check condition',
		tmpl: `Today is:
{{# weather.isGood }} sunny {{/ weather.isGood }}{{^ weather.isGood }} foggy {{/ weather.isGood }}`,
		data: {
			weather: {
				isGood: false,
			}
		}
	},

	{
		title: 'Missing key',
		tmpl: `This is missing key: {{ foo.bar | default : 'default value' }}`,
		data: {
			foo: null,
		},
	},

	{
		title: 'Loop trough array',
		tmpl: `Primary colors are: <ul>{{@ colors }}<li style="color: {{.}}">{{.}}</li>{{/ colors }}</ul>`,
		data: {
			colors: ['red', 'green', 'blue'],
		}
	},

	{
		title: 'Switch context',
		tmpl: `The first two numbers are {{# outer.inner }}{{ a }} and {{ b }} {{/ outer.inner }}`,
		data: {
			outer: {
				inner: {
					a: 1,
					b: 2
				}
			}
		}
	},

	{
		title: 'Do not html escape example',
		tmpl: `Escaped:
{{ html }}
Unescaped:
{{{ html }}}`,
		data: {
			html: '<span style="color: red;">This is red text!</span>'
		}
	}

];


var html = '';

_.forEach(examples, (example, id) => {
	let startTime = new Date();
	let resultStr;
	try {
		resultStr = TB.Template.render(example.tmpl, example.data);
	} catch(e) {
		resultStr = e;
	}
	let renderTime = new Date() - startTime;
	let data = JSON.stringify(example.data, null, 2);
	let lines = Math.floor(Math.max(example.tmpl.split("\n").length, data.split("\n").length, 4) * 1.2);


	html += `
			<h3>
				${ id + 1 }. ${ example.title }
				<button class="btn btn-primary" onclick="recompileTmpl(${ id })">Recompile</button>
			</h3>
			<div class="row">
				<h4 class="col-md-4">Template</h4>
				<h4 class="col-md-4">Data</h4>
				<h4 class="col-md-4">Result (<span id="time-${ id }">${ renderTime }</span> ms)</h4>
			</div>
			<div class="row">
				<div class="col-md-4">
					<textarea id="tmpl-${ id }" rows="${ lines }" class="form-control">${ example.tmpl }</textarea>
				</div>
				<div class="col-md-4">
					<textarea id="data-${ id }" rows="${ lines }" class="form-control">${ data }</textarea>
				</div>
				<div class="col-md-4">
					<pre id="result-${ id }">${ resultStr }</pre>
				</div>
			</div>
	`;
});


function recompileTmpl(id) {
	let data = {};
	try{ data = JSON.parse( document.querySelector(`#data-${ id }`).value ) } catch(e) { alert(`Bad JSON string on item with id ${ id + 1 }`) };

	let tmpl = document.querySelector(`#tmpl-${ id }`).value || '';
	let resultPre = document.querySelector(`#result-${ id }`);
	let timeSpan = document.querySelector(`#time-${ id }`);
	let startTime = new Date();
	let resultStr;
	try {
		resultStr = TB.Template.render(tmpl, data);
	} catch(e) {
		resultStr = e;
	}
	timeSpan.innerHTML = new Date() - startTime;
	resultPre.innerHTML = resultStr;
}


document.querySelector('#content').innerHTML = html;
