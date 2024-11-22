;(function(window){
'use strict';
var TB = window.TB || {};
window.TB = TB;
;(function(window){
'use strict';
var TB = window.TB || {};
window.TB = TB;
/**
 * TB.CRUD plugin
 * @constructor
 * @memberof TB
 * @alias TB.CRUD
 * @param {Object} settings init settings for the plugin
 * @param {Integer} [settings.itemsPerPage=10] how many items to be shown per page; 0 to disable pagination
 * @param {Array[FilterDescr]} [settings.filters=[]] Array of objects, describing the filters
 * @param {Boolean} [varname] [description]
 */
function CRUD( settings, data ) {
	if ( !( this instanceof CRUD ) ) {
		return new CRUD( settings, data );
	}

	/**
	 * Settings
	 * @type {Object}
	 */
	this.s = settings;
	/** @todo delete this */
	this.s.itemsPerPagePossibilities = [10, 20, 50, 100];
	/**
	 * Passed data
	 * @type {Array}
	 */
	this.data = data;
	/**
	 * Jquery reference of plugin container
	 * @type {jQuery}
	 */
	this.$el = $( this.s.element );


	this.dataHub = new TB.CRUD.DataHub({
		settings: settings,
		data: data,
	});


	this.$el.html(TB.Template.render( this.templates.body ), {
		itemsPerPagePossibilities: this.s.itemsPerPagePossibilities,
	});

	this.$el.on('click', '.tb-crud-sortable', (e) => {
		let $target = $(e.target);
		let column = $target.data('tb-crud-column');

		this.dataHub.toggleSort(column);
	});




	return;






	/**
	 * Container element
	 */
	this.el = document.querySelector( this.s.element );
	/**
	 * Data of rows that is currently visible
	 * @type {Array}
	 */
	this.activeData = null;
	/**
	 * Current page number, starts from 0
	 */
	this.currentPage = 0;
	/**
	 * Maximum page number
	 * @type {[type]}
	 */
	this.maxPage = ( _.isArray( this.data ) )
		? Math.ceil( this.data.length / this.s.itemsPerPage )
		: null;

	/**
	 *
	 */
	this.hasRowControls = !_.isEmpty(this.s.rowControls);

	// this.pager = new TB.CRUD.Pager({
	// 	el: this.el,
	// 	maxPageNumber: this.maxPage,
	// });

	// this.pager
	// 	.on('pagechange', (pageNumber) => {
	// 		this.renderBody(pageNumber)
	// 	})
	// 	.on('itemsperpagechange', (e) => {
	// 		this.dataHub.setItemsPerPage( e.itemsPerPage );
	// 	});







			this.dataHub
			.on('tb.crud.removesort', function(e) {
				$('[data-tb-crud-column=' + e.columnName + ']')
					.removeClass('tb-crud-sort-asc')
					.removeClass('tb-crud-sort-desc');
			})
			.on('tb.crud.togglesort', function(e) {
				$('[data-tb-crud-column=' + e.columnName + ']')
					.toggleClass('tb-crud-sort-asc', e.asc)
					.toggleClass('tb-crud-sort-desc', e.desc);
			})


		this.$el.on('click', '.tb-crud-sortable', (e) => {
			let $target = $(e.target);
			let column = $target.data('tb-crud-column');

			this.dataHub.toggleSort(column);
		})
}


CRUD.prototype = {

	tempaltes: {

		table: `\
<table class="table table-striped" style="width: auto">
	<thead>
		<tr>
			<th></th>
		</tr>
	<thead>
</table>
`,

		dlgDeleteRecord: `\
<dialog id="tb-crud-dlg-confirm-delete">
  <form method="dialog">
    <p>
      Are you sure you want to delete this record?
    </p>
    <p class="text-right">
      <button type="submit" value="yes" id="tb-crud-dlg-confirm-delete-btn-confirm" class="btn btn-danger">Confirm deletion</button>
      <button type="submit" value="cancel" id="tb-crud-dlg-confirm-delete-btn-cancel" class="btn btn-warning">Cancel</button>
    </p>
  </form>
</dialog>`,

	dlgPreviewJson: `\
<dialog id="tb-crud-dlg-json-preview">
  <form method="dialog">
    <div class="tb-crud-json-readonly"></div>
    <p class="text-right">
      <button type="submit" value="cancel" id="tb-crud-dlg-confirm-delete-btn-cancel" class="btn btn-warning">Cancel</button>
    </p>
  </form>
</dialog>`,
<<<<<<< .mine

body: `\
<div class="tb-crud-filters"></div>
<table class="tb-crud-table">
	<thead class="tb-crud-table-head">
		<tr>
			<th class="tb-crud-table-title">{{ title | default : ' ' }}</th>
		</tr>
		<tr></tr>
	</thead>
	<tbody class="tb-crud-table-body"></tbody>
	<tfoot class="tb-crud-table-foot">
		<tr></tr>
	</tfoot>
</table>
<div class="tb-crud-footer">
	<div class="tb-crud-pager">
		<button class="tb-crud-pager-first-page">&laquo;</button>
		<button class="tb-crud-pager-prev-page">&lsaquo;</button>

		<span>
			page <input type="text" size="1" value="1" class="tb-crud-pager-input-page" /> of
			<span class="tb-crud-pager-total-pages"></span>
		</span>

		<button class="tb-crud-pager-next-page">&rsaquo;</button>
		<button class="tb-crud-pager-last-page">&raquo;</button>
		<select class="tb-crud-pager-items-per-page">

		</select>

		<span class="tb-crud-pager-items">
			{{ 'Rows' | translate }} <span class="tb-crud-pager-items-start"></span>-<span class="tb-crud-pager-items-end"></span> {{ 'of' | translate}} <span class="tb-crud-pager-items-total"></span>
		</span>
	</div>
</div>
`
=======
>>>>>>> .r9899
	},


	_renderDialogs: function() {
		let dialogHtml = '';

		dialogHtml += TB.Template.render(this.templates.dlgDeleteRecord);
		dialogHtml += TB.Template.render(this.templates.dlgPreviewJson);

		this.$el.append(dialogHtml);
	},




	_prepareActiveDataPage: function() {
		let startItemIndex = (this.pager.currentPageNumber - 1)  * this.s.itemsPerPage;
		let endItemIndex = Math.min( startItemIndex + this.s.itemsPerPage, this.data.length );

		this.activeData = [];

		for( let i = startItemIndex; i < endItemIndex; i++ ) {
			let rowData = this.data[ i ];

			this.activeData.push( rowData );
		}
	},

	_buildTableHeader: function() {
		let html = '';

		html += '<thead>';
		html += '<tr>';

		for (let i = 0, l = this.s.headers.length; i < l; i++) {
			let header = this.s.headers[i];
			let attrHash = {
				'data-tb-crud-column': header.key,
				'class': [],
			};
			let attrs = '';
			let contentStr;

			// Prepare header content
			if ( header.thHeaderTmpl ) {
				// TODO implement please
				throw new Error('Not implemented yet');
			} else {
				contentStr = header.title;
			}

			if(header.sortable) {
				attrHash.class.push('tb-crud-sortable')
			}

			// Prepare header attributes
			for ( let attr in attrHash ) {
				let attrVal = ( _.isArray( attrHash[ attr ] ) ) ? attrHash[ attr ].join( ' ' ) : attrHash[ attr ];

				attrs += ` ${ attr }="${ attrVal }"`;
			}


			html += `<th ${ attrs }>${ contentStr }</th>`;
		};

		if(this.hasRowControls) {
			html += '<th>Controls</th>'
		}

		html += '</tr>';
		html += '</thead>';

		return html;
	},


	_buildTableRow: function( rowData ) {
		let html = '';

		html += '<tr>';

		for ( let i = 0, l = this.s.headers.length; i < l; i++ ) {
			let header = this.s.headers[ i ];
			let data = rowData[ header.key ];
			let cellFormatter = new this.formatters[ header.formatter ]( data, rowData, header.formatterSettings );

			html += cellFormatter.render();
		}

		if(this.hasRowControls) {
			html += new TB.CRUD.ControlsCell().render();
		}

		html += '</tr>';

		return html;
	},


	_buildTableBody: function( data ) {
		let html = '';

		html += '<tbody>';

		for ( let i = 0, l = data.length; i < l; i++ ) {
			let rowData = data[ i ];

			html += this._buildTableRow( rowData );
		}

		html += '</tbody>';

		return html;
	},


	_buildTable: function( data ) {
		let html = '';

		html += '<table class="table table-striped" style="width: auto">'
		html += this._buildTableHeader();
		html += this._buildTableBody( data );
		html += '</table>'

		return html;
	},

	render: function(pageNumber) {
		this._prepareActiveDataPage(pageNumber);

		let html = this._buildTable( this.activeData );

		// this.el.innerHTML = html;
	},

	renderBody: function(pageNumber) {
		this._prepareActiveDataPage(pageNumber);

		let tableBody = this._buildTableBody( this.activeData );

		$(this.el).find('tbody').replaceWith(tableBody);

	},

};

CRUD.DataHub = function(settings) {
	TB.Dispatcher.call( this );

	this.s = settings.settings;
	this.headers = {};
	this.data = settings.data || null;
	this.activeData = [];
	this.currentlySortedColumnName = null;
	this.currentPageNumber = null;
	this.itemsPerPage = null;
	this.maxPage = null;


	for (let i = 0, l = this.s.headers.length; i < l; i++) {
		let header = this.s.headers[i];

		ASSERT.hasPropertyOfTbType(header, 'key', 'string');

		this.headers[header.key] = {
			sortAsc: false,
			sortDesc: false,
		};
	}

};

CRUD.DataHub.prototype = {

	_prepareActiveDataPage: function() {
		let startItemIndex = (this.currentPageNumber - 1)  * this.itemsPerPage;
		let endItemIndex = Math.min( startItemIndex + this.itemsPerPage, this.data.length );

		this.activeData = [];

		for( let i = startItemIndex; i < endItemIndex; i++ ) {
			let rowData = this.data[ i ];

			this.activeData.push( rowData );
		}
	},


	toggleSort: function(columnName) {
		let sortAsc = this.headers[columnName].sortAsc;
		let sortDesc = this.headers[columnName].sortDesc;

		this.removeSort(this.currentlySortedColumnName);
		this.currentlySortedColumnName = columnName;

		if(sortAsc === sortDesc) {
			this.headers[columnName].sortAsc = true;
			this.headers[columnName].sortDesc = false;
		} else {
			this.headers[columnName].sortAsc = sortDesc;
			this.headers[columnName].sortDesc = sortAsc;
		}

		this.dispatch('tb.crud.togglesort', {
			columnName: columnName,
			asc: this.headers[columnName].sortAsc,
			desc: this.headers[columnName].sortDesc,
		} );
	},

	removeSort: function(columnName) {
		if(!columnName) {
			return;
		}

		this.headers[columnName].sortAsc = false;
		this.headers[columnName].sortDesc = false;

		this.dispatch('tb.crud.removesort', { columnName: columnName, });
	},

	setItemsPerPage: function(itemsPerPage) {
		this.itemsPerPage = itemsPerPage;

		this.dispatch('activedatachange', { activeData: this.activeData, });
	},

	setPage: function(pageNumber) {
		this.itemsPerPage = itemsPerPage;

	},

	get: function() {
		// @todo implement
		// filter={foo: 1}
		// sortBy=<column>
		// sortOrder=desc|asc
		// view=<viewName>
		// page=<pageNumber>
		// itemsPerPage=<itemsPerPage>
		// ./crud-api?jsonrpc_json={...}
		// {
		// 		"view": "promotions",
		// 		"sortBy": "voucher_number",
		// 		"descending": 1,
		// 		"page": 11,
		// 		"itemsPerPage": 10,
		// 		"filter": {
		// 			"voucher_number": {"min": 100000, "max": 200000}
		// 		}
		// }
		// OUT: {
		// 	rows: [],
		// 	hasMore: true,
		// 	totalItems: null,
		// }
	},




};

TB.classExtend( CRUD.DataHub, TB.Dispatcher );



CRUD.Pager = function(s) {
	TB.Dispatcher.call( this );

	this.s = s;
	this.itemsPerPage = this.s.itemsPerPage;

	let $html = $(this.templates.body);
	let currentPageNumber = this.s.currentPageNumber || 0;

	if(this.s.maxPageNumber > 0) {
		currentPageNumber = 1;
	}

	this.$inputPage = $html.find('.tb-crud-pager-input-page');
	this.$firstPage = $html.find('.tb-crud-pager-first-page');
	this.$prevPage = $html.find('.tb-crud-pager-prev-page');
	this.$nextPage = $html.find('.tb-crud-pager-next-page');
	this.$lastPage = $html.find('.tb-crud-pager-last-page');
	this.$totalPages = $html.find('.tb-crud-pager-total-pages');
	this.$itemsPerPage = $html.find('.tb-crud-pager-items-per-page');

	Object.defineProperty( this, 'currentPageNumber', {

		get: function() {
			return currentPageNumber;
		},

		set: function(newPageNumber) {
			newPageNumber = _.limitToRange( newPageNumber, 1, this.s.maxPageNumber || Infinity );
			currentPageNumber = newPageNumber;

			this.pageChangeCallback();

			return currentPageNumber;
		},

	});

	this.$firstPage.on('click', (e) => {
		this.pageGoto(1);
	});

	this.$prevPage.on('click', (e) => {
		this.pageBackward();
	});

	this.$nextPage.on('click', (e) => {
		this.pageForward();
	});

	this.$lastPage.on('click', (e) => {
		this.pageGoto(this.s.maxPageNumber);
	});

	this.$inputPage.on('change', (e) => {
		this.pageGoto(this.$inputPage.val());
		this.$inputPage.val(this.currentPageNumber);
	});

	this.$itemsPerPage.on('change', (e) => {
		this.itemsPerPage = parseInt(e.target.value);
		this.dispatch('itemsperpagechange', {
					itemsPerPage: this.itemsPerPage,
				});
	});

	this.$totalPages.text( this.s.maxPageNumber );

	$html.insertAfter(this.s.el);
};

CRUD.Pager.prototype = {

	templates: {
		body: `<div class="tb-crud-pager">
			<button class="tb-crud-pager-first-page">&laquo;</button>
			<button class="tb-crud-pager-prev-page">&lsaquo;</button>

			<span>
				page <input type="text" size="1" value="1" class="tb-crud-pager-input-page" /> of
				<span class="tb-crud-pager-total-pages"></span> 
			</span>

			<button class="tb-crud-pager-next-page">&rsaquo;</button>
			<button class="tb-crud-pager-last-page">&raquo;</button>

			<select class="tb-crud-pager-items-per-page">
				<option value="5">5</option>
				<option value="10">10</option>
				<option value="25">25</option>
				<option value="50">50</option>
				<option value="100">100</option>
			</select>
		</div>`,
	},

	pageChangeCallback: function() {
		this.$inputPage
			.val(this.currentPageNumber)
			.prop('disabled', !this.currentPageNumber);

		let disableStart = (this.currentPageNumber === 0) || (this.currentPageNumber === 1);
		let disableEnd = (this.currentPageNumber === 0) || (this.currentPageNumber === this.s.maxPageNumber);

		this.$firstPage.prop('disabled', disableStart);
		this.$prevPage.prop('disabled', disableStart);
		this.$nextPage.prop('disabled', disableEnd);
		this.$lastPage.prop('disabled', disableEnd);

		this.dispatch( 'pagechange', [ this.currentPageNumber ] );
	},

	pageForward: function() {
		this.currentPageNumber += 1;
		this.dispatch( 'pageforward', [ this.currentPageNumber ] );
	},

	pageBackward: function() {
		this.currentPageNumber -= 1;
		this.dispatch( 'pagebackward', [ this.currentPageNumber ] );
	},

	pageGoto: function( newPageNumber ) {
		this.currentPageNumber = newPageNumber;
		this.dispatch( 'pagegoto', [ this.currentPageNumber ] );
	},

};
TB.classExtend( CRUD.Pager, TB.Dispatcher );


CRUD.TextCell = function( cellData, rowData, settings ) {
	this.getCellData = function() {
		return cellData;
	};

	this.getRowData = () => {
		return rowData;
	};

	settings = settings || {};

	this.getSettings = function() {
		return settings;
	};

	this.templateStr = settings.templateStr || null;
	this.classNames = ['tb-crud-text'];
};

CRUD.TextCell.prototype = {

	stringifyClassNames: function() {
		return this.classNames.join( ' ' );
	},

	render: function() {
		return `<td class="${ this.stringifyClassNames() }">${ this.renderContent() }</td>`;  // bye
	},

	renderContent: function() {
		if( this.templateStr ) {
			return TB.Template.render( this.templateStr, {
				value: this.getCellData(),
				values: {},
				titles: {},
			})
		} else {
			return this.getCellData();
		}
	},

};

CRUD.NumberCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames = ['tb-crud-numeric', 'text-right'];
	this.templateStr = '{{ value | number }}';
};

CRUD.LinkCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames.push( 'tb-crud-cell-uri' );
	this.templateStr = '{{ value | link }}';
};

CRUD.EmailCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames.push( 'tb-crud-cell-email' );
	this.templateStr = '{{ value | email }}';
};

CRUD.CurrencyCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames = ['tb-crud-currency', 'text-right'];
	this.templateStr = `{{ value | currency : '${ settings.code }' }}`;
};

CRUD.CheckboxCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames = ['tb-crud-boolean', 'text-center'];
	this.templateStr = '{{ value | checkbox }}';
};

CRUD.DateCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames = ['tb-crud-date'];
	this.templateStr = '{{ value | date }}';
};

CRUD.TimeCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames = ['tb-crud-date'];
	this.templateStr = '{{ value | time }}';
};

CRUD.DateTimeCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );
	this.classNames = ['tb-crud-date'];
	this.templateStr = '{{ value | datetime }}';
};

CRUD.JSONCell = function( cellData, rowData, settings ) {
	CRUD.TextCell.call( this, cellData, rowData, settings );

	this.renderContent = function() {
		let html = TB.Template.render( settings.templateStr, {
			value: cellData,
			values: rowData,
			titles: {
				age: 'Възраст',
				name: {
					first: 'Първо име'
				},
				colors: "Цвят"
			}
		} );

		html += '<a class="tb-crud-cell-json-all">all</a>';

		return html;
	}
};

CRUD.ControlsCell = function(cellData, rowData, settings) {
	CRUD.TextCell.call( this, cellData, settings );
	this.classNames = ['tb-crud-cell-controls'];
	this.templateStr = `
		<button class="btn btn-sm btn-primary">Edit</button>
		<button class="btn btn-sm btn-danger">Delete</button>
	`;
};



TB.classExtend( CRUD.LinkCell, CRUD.TextCell );
TB.classExtend( CRUD.EmailCell, CRUD.TextCell );
TB.classExtend( CRUD.NumberCell, CRUD.TextCell );
TB.classExtend( CRUD.CurrencyCell, CRUD.TextCell );
TB.classExtend( CRUD.CheckboxCell, CRUD.TextCell );
TB.classExtend( CRUD.DateCell, CRUD.TextCell );
TB.classExtend( CRUD.TimeCell, CRUD.TextCell );
TB.classExtend( CRUD.DateTimeCell, CRUD.TextCell );
TB.classExtend( CRUD.JSONCell, CRUD.TextCell );
TB.classExtend( CRUD.ControlsCell, CRUD.TextCell );




CRUD.prototype.formatters = {
	text: CRUD.TextCell,
	number: CRUD.NumberCell,
	currency: CRUD.CurrencyCell,
	date: CRUD.DateCell,
	datetime: CRUD.DateTimeCell,
	time: CRUD.TimeCell,
	link: CRUD.LinkCell,
	email: CRUD.EmailCell,
	checkbox: CRUD.CheckboxCell,
	json: CRUD.JSONCell,
};



TB.CRUD = CRUD;

/**
 * method=get_records;page=1;limit=20
 * method=get_record;id=2
 * method=delete_record;id=2
 * method=update_record;id=2;record={}
 * method=create_record;record={}
 */


/**
 * Object describing a single filter
 * @typedef {Object} FilterDescr
 * @property {String} key the unique name of the property
 * @property {('string'|'integer'|'number'|'boolean'|'radio'|'select'|'date'|'datetime'|'time')} type type of the input field
 * @property {*} default default value of the input field
 * @property {Boolean} [range=false] if set to true, there are two filter values: mininum|since|from and maximum|until|to
 * @property {Boolean} [primary=true] if set to false, the field will not show by default, but only when the filter menu is expanded
 * @example
 * var filterDescr = {
 * 	key: 'invoicePeriod',
 * 	type: 'date',
 * 	default: ['2015-01-01', '2015-10-15'],
 * 	range: true,
 * 	primary: true
 * };
 */


/**
 * Object describing a single header
 * @typedef {Object} HeaderDescr
 * @property {String} key the unique name of the row property, which column will display
 * @property {String|Object} type display type of the column values
 * @property {Boolean} sortable if set to true, column is sortable
 * @property {Boolean} [primary=true] if set to false, column is hidden by default
 */


_.mixin( {

	limitToRange: function ( number, min, max) {
		// By default min is 0, so if there are only two arguments, use the second as maximum value
		if ( _.isUndefined( max ) ) {
			max = +min;
			min = 0;
		}

		// Ensure working with numbers
		number = +number;
		max = +max;
		min = +min;

		// If minimum is greater than maximum, there is an error
		if ( min > max ) {
			throw new Error('Minimum is less than maximum');
		}

		if ( number > max ) {
			return max;
		} else if ( number < min ) {
			return min;
		} else {
			return number;
		}
	},



});

})( typeof window === "undefined" ? this : window );


`\
<div class="tb-crud-filters"></div>
<table class="tb-crud-table">
	<thead class="tb-crud-table-head">
		<tr>
			<th class="tb-crud-table-title">{{ title }}</th>
		</tr>
		<tr></tr>
	</thead>
	<tbody class="tb-crud-table-body"></tbody>
	<tfoot class="tb-crud-table-foot">
		<tr></tr>
	</tfoot>
</table>
<div class="tb-crud-footer">
	<div class="tb-crud-pager">
		<button class="tb-crud-pager-first-page">&laquo;</button>
		<button class="tb-crud-pager-prev-page">&lsaquo;</button>

		<span>
			page <input type="text" size="1" value="1" class="tb-crud-pager-input-page" /> of
			<span class="tb-crud-pager-total-pages"></span>
		</span>

		<button class="tb-crud-pager-next-page">&rsaquo;</button>
		<button class="tb-crud-pager-last-page">&raquo;</button>
		<select class="tb-crud-pager-items-per-page">
			{{@ itemsPerPagePossibilities }}<option value="{{.}}">{{.}}</option>{{/ itemsPerPagePossibilities }}
		</select>

		<span class="tb-crud-pager-items">
			{{ 'Rows' | translate }} <span class="tb-crud-pager-items-start"></span>-<span class="tb-crud-pager-items-end"></span> {{ 'of' | translate}} <span class="tb-crud-pager-items-total"></span>
		</span>
	</div>
</div>

`



`
#/<VIEW_NAME>/<VIEW_MODE>/<RECORD_ID>/<ACTION>

#/vouchers_vw/new
#/vouchers_vw/123/read
#/vouchers_vw/123/update
#/vouchers_vw/123/delete

?filters={}
?sort=column1,asc,column2,desc,column3,asc
?expanded=1
`
})( typeof window === "undefined" ? this : window );
