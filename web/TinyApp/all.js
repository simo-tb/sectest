
//////////////////////////
/// submit, zastita za dwoen click na submit button
/// usage: <input type=submit> ---> <input type=button onclick="doSubmit(this)">
//////////////////////////
var submitFlags = new Array();
var formNameCount = 1;
function doSubmit(butt)
{
    if(butt.form.name.length == 0) butt.form.name = 'form' + formNameCount++;

    if(submitFlags[ butt.form ]) { return; }

    submitFlags[ butt.form ] = true;
    butt.value = '***' + butt.value + '***';
    butt.form.submit();
}

/////////////////////////////
/////////////////////////////



var jsmanip;
var components = new Array();
var viewPanelDoc;

function initapp()
{
	viewPanelDoc = document;

    if( $("#dbf-submit-btn").length ) {
        $("#dbf-submit-btn").removeAttr("disabled");
    }
}

function sb(msg)
{
	window.status = msg;
	return true;
}



// include fl.js
// include dynselect.js
// include table_search.js


var fl_insert_clicked = false;

function stat_edit()
 {
    window.status = 'Редакция';
    return true;
 }
function stat_del()
 {
    window.status = 'Изтриване';
    return true;
 }

function stat_print()
 {
    window.status = 'Печат';
    return true;
 }

function stat_portrait()
 {
    window.status = 'Форматиране \'портрет\'';
    return true;
 }

function stat_portraitoff()
 {
    window.status = 'Изход от форматирането';
    return true;
 }

function stat_printoff()
 {
    window.status = 'Изход от печат';
    return true;
 }


function flShowOnSubmit(form)
{
   return true;
}


function flShowGetChecked(form, pk_name)
{
   var checkArray;
   if(typeof(form._fl_ch.length) == 'undefined')
    {
	// ne e masiv
	checkArray = new Array();
        checkArray[0] = form._fl_ch;
    }
   else
    {
	// masiv
        checkArray = form._fl_ch;
    }

   var ret_str = '';

   for(var i=0; i<checkArray.length; i++)
    if(checkArray[i].type == 'hidden' ||
       checkArray[i].checked)
        ret_str += '&' + pk_name + '=' + checkArray[i].value;

   return ret_str;
}


function cacheFormParams(doc)
{
    //return "&__tt=1";
    if(!doc) {
        doc = viewPanelDoc;
    }

    if(!viewPanelDoc) {
    	return;
    }

    var str = '';
    for(var j=0; j<doc.forms.length; j++) // dump-i se samo 1 forma,za da ne se smeswat
    {
        var form = doc.forms[j];
        for(var i=0; i<form.elements.length; i++)
        {
            var el = form.elements[i];
            with(form.elements[i])
            {
                if( // type != 'hidden' &&
                        type != 'submit' &&
                        type != 'button' &&
                        type != 'reset'  &&
                        name != ''  )
                {
	            	if(	false
                		|| jQuery(el).hasClass('json-forms-input')
                		|| jQuery(el).data('tb-jf-form-hidden')
                		|| jQuery(el).closest('.tb-jf-node').length
                		|| jQuery(el).closest('.json-forms-container').length
                		) {
                		continue;
                	}
                    //alert(name);
                    if(type == 'radio')
                    {
                        if(checked)
                            str += '&' + name + '=' + encodeURIComponent(value);
                    }
                    else
                    {
                        str += '&' + name + '=';
                        if(type.indexOf('select') != -1)
                        {
                            // select box (one&multiple)
                            if(selectedIndex >= 0)
                            {
                                str += encodeURIComponent(options[selectedIndex].value);
                                if(type == 'select-multiple')
                                    for(var opt=selectedIndex+1; opt<options.length; opt++)
                                        if(options[opt].selected)
                                        {
                                            str += '&' + name + '=' + encodeURIComponent(options[opt].value);
                                        }
                            }
                        }
                        else
                            if(type == 'checkbox')
                            {
                                if(checked)
                                    str += encodeURIComponent(value);
                            }
                            else
                                if(value != '')
                                    str += encodeURIComponent(value);
                    }
                }
            }
        }
    }
    //alert(str)
    return str;
}


// onloader.js
var onLoaderArr = new Array();

function funcObj(func, funcParam)
{
		this.functionExec = func;
		// SORY che taka e napraweno za parametyra ama ne beshe planuwano da ima
		// ... a potrqbwa
		this.functionParam = funcParam;
}

function addOnLoad(func)
{
	onLoaderArr.push( new funcObj(func) );
}

function callOnLoad()
{
	for (var i=0; i<onLoaderArr.length; i++)
        {
		onLoaderArr[i].functionExec(onLoaderArr[i].functionParam);
	}
}

//krai na onloader.js

// dynselect.js
if(numberDynBuffers)
{
//alert('table_search.js e weche wkljchen');
}

var DEFAULT_NUMBER_DYNSELECT_BUFFERS = 10; //broi dinamichni buferi po podrazbirane
var DEFAULT_BUFFER_PREFIX = 'buffer'; //prefiks za buferite
var DEFAULT_DYN_SELECT_SERVER_URL = 'dyn_select_server_template.html';
var DEFAULT_BLANK_PAGE = './pub/DBForms/blank.html';
var DEFAULT_DOCUMENT = 'document'; //kyde po podrazbirane se namirat formite

var MILLISECONDS_BETWEEN_BUFF_SEARCHES_FOR_NS4 = 700;
var MAX_SIMULTANEOUS_DYNFILL_FOR_NS4 = 4; //maksimalen broi tyrseniq koito se puskat ednowremenno na NS4
var is_dyn_select_init = false;
var ns4_count_parallel_search = new Array();

var numberDynBuffers=0; //broi buferi

// popylwa se pri inicializaciq
var defaultFormName;

//indeksa e bufferName
var dynSelectsInProgress; //masiw ot obekti DynSelect za koito teche dinamichno popylwane

// indeksa e ime na select-a w koito ste se popylwat rezuktatite
var dynSelectObjs = new Array();  //dynSelectObekti


function BrowserCheck()
{
	var b = navigator.appName
	if (b=="Netscape") this.b = "ns"
	else if (b=="Microsoft Internet Explorer") this.b = "ie"
	else this.b = b
	this.version = navigator.appVersion
	this.v = parseInt(this.version)
	this.ns = (this.b=="ns" && this.v>=4)
	this.ns4 = (this.b=="ns" && this.v==4)
	this.ns5 = (this.b=="ns" && this.v==5)
	this.ie = (this.b=="ie" && this.v>=4)
	if(this.ie && (this.version.indexOf('MSIE 5.0') > 0 || this.version.indexOf('MSIE 4') > 0  || this.version.indexOf('MSIE 3') > 0 ))
			alert('Molq instaliraite Internet Explorer versiq 6 !');

	this.ie4 = (this.version.indexOf('MSIE 4')>0)
	this.ie5 = (this.version.indexOf('MSIE 5')>0)
	this.min = (this.ns||this.ie )
}

is = new BrowserCheck();

/*------------------Obhozhdane na wsichki formi --------------*/
// obhozhda wsichki dokumenti i zapiswa form-ite
/*------------------------------------------------------------*/


var formObjs = new Array();  //form Obeki, indeksirat se po ime
var formObjsByID = new Array();  //form Obeki, indeksirat se po nomer

function takeDocumentFormObjs(doc, formPath)
{
   if(!doc )
	doc = document;

   for(var j=0; j<doc.forms.length; j++)
   {
       formObjs[ doc.forms[j].name ] = doc.forms[j];
	//alert('formPath='+formPath+'  formName='+doc.forms[j].name);
       formObjsByID.push(doc.forms[j]);
   }
}



function takeFormObjs(nestref)
{
	if (is.ns4)
	{

		var ref;
		if (nestref) ref = eval('document.'+nestref+'.document')
		else {nestref = ''; ref = document;takeDocumentFormObjs();}
		for (var i=0; i<ref.layers.length; i++)
                 {

			takeDocumentFormObjs(ref.layers[i].document, ref.layers[i].name);

			if (ref.layers[i].document.layers.length > 0)
			{
                               takeFormObjs((nestref=='')? ref.layers[i].name : nestref+'.document.'+ref.layers[i].name)
			}
		}
	}
	else
	{
	   takeDocumentFormObjs();
	}
}



//inicializirane na dynSelect elementite
//wika se onLoad na document-a
function initDynSelectObjs()
{
	takeFormObjs();
   //namira se forma po podrazbirane
   var defaultFormObj = formObjsByID[0];
   if(defaultFormObj)
   {
      	defaultFormName = defaultFormObj.name;
   }
   else
   {
	//Nqma formi
 	return;//defaultFormName = "document.form";
   }

   for (var dObjKey in dynSelectObjs)
     {
	var dynSelObj = dynSelectObjs[dObjKey];

     //Obshta inicializaciq za dynselectite
	dynSelObj.dynBufferName = DEFAULT_BUFFER_PREFIX + dynSelObj.dynSelectIdx;
  // NEW
  dynSelObj.dynBuffer = window.parent[ dynSelObj.dynBufferName ];
  // OLD
	// dynSelObj.dynBuffer = is.ns4 ? eval('document.'+dynSelObj.dynBufferName) : eval('parent.'+dynSelObj.dynBufferName);
	if(dynSelObj.formName)
	{
	     dynSelObj.formObj = formObjs[dynSelObj.formName];
	     if(!dynSelObj.formObj)
	     {
		alert('Pri tyrseneto w \''+dynSelObj.selectName+'\' ne e namerena forma \''+ dynSelObj.formName+'\'');
	     }
	     dynSelObj.selectObj = eval('dynSelObj.formObj.'+dynSelObj.selectName);
	}
	else
	{
	   dynSelObj.formName = defaultFormName;
	   dynSelObj.formObj = defaultFormObj;
	   if(!dynSelObj.formObj)
	     {
		alert('Tyrseneto ne e namerilo forma po podrazbirane');
	     }

	   dynSelObj.dynSelectName = dynSelObj.formName + dynSelObj.selectName;
	   dynSelObj.selectObj = eval('defaultFormObj.'+dynSelObj.selectName);

	   dynSelectObjs[dObjKey] = null;
	   dynSelectObjs[ dynSelObj.dynSelectName ] = dynSelObj;
	}
     // Krai na obshta inicializaciq

	//Specifichna inicializaciq za wseki dynselect
	if(dynSelObj.initDynSelect)
	{
	  dynSelObj.initDynSelect();
	}
     }
   is_dyn_select_init = true;
   return;
}


//!!! Konstruktor na klasa dynSelect !!!
function DynSelect(selectName, formName, initFunction, formDocument)
{
	//select name - ime na select-a w koito ste se popylwa rezultata
	//form name (nezadylzhitelen)- ime na formata w koqto se namira select-a,
	//            ako ne e zadadeno se podrazbira pyrwata forma w document
	//Member Data
	if(!selectName)
	{
	   return;
	}
	//*Form Data
	this.selectName = selectName;
	this.selectObj = null;

	if(!formDocument)
	{
	   formDocument = DEFAULT_DOCUMENT;
	}
	if(formName)
	{
	   var re = /\./;
	   if(formName.match(re))
	   {
	      alert('Form Name ne trqbwa da sydyrzha tochki :'+ formName);
	   }
	   this.formName = formName;
	}
	else
	{
	  formName = ""; // za da se slepq
	}

	//* For DynSelect
	this.dynSelectName = formName+selectName;
	this.dynSelectIdx = numberDynBuffers++;

	//** DynSelectInit
	this.initDynSelect = initFunction;

	// Masiw s dynSelect Obektite
	dynSelectObjs[this.dynSelectName] = this;

	// Member functions
	this.fillDynSelect = fillDynSelect;
	this.returnDynSelectResult = returnDynSelectResult;
}

//wzima inicializiran dynSelect obekt
function getDynSelectObj(selectName, formName)
{
	if(!formName)
	{
	  formName = defaultFormName;
	}
	//alert(dynSelectObjs.length);
	if(!dynSelectObjs[formName+selectName])
	{
	  alert("Ne e inicializiran search obekt: "+formName+selectName);
	  return null;
	}

	return dynSelectObjs[formName+selectName];
}

//dali syshtestwywa Obekta
function existsDynSelectObj(selectName, formName)
{
	if(!formName)
	{
	  formName = defaultFormName;
	}
	if(dynSelectObjs[formName+selectName])
	{
	  return true;
	}
	return false;
}

//Wzima dynSelect obekt po koito w momenta se tyrsi
function getDynSelectObjByBufferName(bufferName)
{
	return dynSelectsInProgress[bufferName];
}


//Popylwane na dynSelect ot servera
function fillDynSelect(selectName, formName)
{
	if(!is_dyn_select_init)
	{
	   alert('Inicializiraite tyrseneto w onLoad');
	   return;
	}
	var dynSelObj = this;
	if(selectName)
	{
	  dynSelObj = getDynSelectObj(selectName, formName) ;
	}

	//!!  alert(dynSelObj.selectObj);

	var dynSelectServerURL= dynSelObj.serverURL || DEFAULT_DYN_SELECT_SERVER_URL;

	var getParams = 'uniq_query_id='+(new Date()).getTime();
	if(dynSelObj.addGetParams)
	{
		getParams += '&'+dynSelObj.addGetParams;
	}

	var newOptionIndex = dynSelObj.selectObj.options.length;
	dynSelObj.selectObj.options[newOptionIndex] = new Option("Searching...","");
	dynSelObj.selectObj.selectedIndex = newOptionIndex;
	//towa se Load-wa
	var ServerURL = dynSelectServerURL + '?'+getParams;

	//zapomnq select obekta koito trqbwa da se napylni sled tyrsene
	dynSelectsInProgress[ dynSelObj.dynBufferName ] = dynSelObj;

	if ( is.ns4 )
	{
	   //netscape

	   ns4_count_parallel_search.push("1");
	   var speedSearch =  MILLISECONDS_BETWEEN_BUFF_SEARCHES_FOR_NS4*(ns4_count_parallel_search.length-1);
	   //alert(speedSearch);
	   setTimeout('dynSelectObjs[\''+dynSelObj.dynSelectName+'\'].dynBuffer.src=\''+ServerURL+'\'',speedSearch);
	   setTimeout('ns4_count_parallel_search.pop()', MILLISECONDS_BETWEEN_BUFF_SEARCHES_FOR_NS4*MAX_SIMULTANEOUS_DYNFILL_FOR_NS4);
	}
	else
	{

	   //IE and Mozilla
	   //alert(dynSelObj.dynBuffer.location);
	   //ServerURL = 'search.pl';
	   //aler(ServerURL);
     var searchPostFormObj = dynSelObj.dynBuffer.document.forms[0];
	   if(searchPostFormObj && searchPostFormObj.search_params)
	   {
		 //alert(getParams);

	      //var re = new RegExp('\&',"gi");
		  //var escGetParams = getParams.replace(re,'PPP');
		  searchPostFormObj.search_params.value = getParams;
		  //alert(getParams);
	      searchPostFormObj.action = ServerURL;
		  //alert('Predi submit');

	      searchPostFormObj.submit();
		  //alert('Sled submit');
	   }
	   else
	   {
	      dynSelObj.dynBuffer.location = ServerURL;
	   }
	}

}


// Kopira opciite na Select ot srcArr w targetArr
//   kato predwaritelno nulira targetArr

function copySelectOptionsArr(targetArr, srcArr)
{
   for(var i=targetArr.length-1; i>0; i--)
   {
	targetArr[i] = null;
   }
   for(var j = 0 ; j < srcArr.length; j++)
   {
	targetArr[j] = new Option(srcArr[j].text, srcArr[j].value);
   }
}

function returnDynSelectResult(selectName, formName)
{
	var dynSelObj = this;
	if(selectName)
	{
	  dynSelObj = getDynSelectObj(selectName, formName);
	}

	if(!dynSelObj.resultSelectedIndex)
   	{
	  dynSelObj.resultSelectedIndex = 0;
   	}

  	var targetSelect = dynSelObj.selectObj;

   	copySelectOptionsArr(targetSelect.options, dynSelObj.foundArr);
   	targetSelect.selectedIndex = dynSelObj.resultSelectedIndex;

   	if(is.ns4)
    	 {
	   // alert(ns4_count_parallel_search.length);
	//  var BFrame = eval('document.'+bIdx);
	    //dynSelObj.dynBuffer.src = DEFAULT_BLANK_PAGE;
    	 }
   	else
    	 {
            dynSelObj.dynBuffer.location = DEFAULT_BLANK_PAGE;
    	 }
}




//Inicializira Dyn Select - za dinamichno popylwane na SELECT wyw HTML forma sys zapitwane do servera !

//!! wika se izwyn modula
function InitDynBuffers()
{
   numberDynBuffers = numberDynBuffers || DEFAULT_NUMBER_DYNSELECT_BUFFERS; //10 bufera po podrazbirane
   dynSelectsInProgress = new Array(numberDynBuffers);

	for (var i=0; i < numberDynBuffers + 1; i++)
	{
		var bIdx = DEFAULT_BUFFER_PREFIX+i;
		if ( is.ns4 )
		{
		  document.write('<LAYER NAME="'+bIdx+'" visibility="none"></LAYER>');
		}
		else
		{
      var iframe = document.createElement('iframe');
      iframe.src = './pub/DBForms/blank.html';
      iframe.name = bIdx;
      iframe.width = 1;
      iframe.height = 1;
      iframe.scrolling = 'no';
      iframe.frameborder = 0;
      iframe.style.position = 'absolute';

      document.body.appendChild(iframe);

      // the old way, no idea why document.write() works in the old template...
      // console.log(document);
      // document.write('<IFRAME SRC="./pub/DBForms/blank.html" NAME="'+bIdx+'"  width="1" height="1" scrolling="no" frameborder="0"></IFRAME>');
		}
	}
}



// cp1251: escapwa kato postawq po edin %XX za wseki simwol>0x80 (a ne dwa [utf-8] %XX%XX ili [unicode] %uXXXX)
//
function encodeURIComponentCP1251(s)
{
   var a,b,d;

   var hexStr = '';

   for (var i=0; i < s.length; i++) {

      d = s.charCodeAt(i);

	if(d < 0x80 && s[i] >= 'A' && s[i] <= 'z')
  	 {
           hexStr += s[i];
           continue;
	 }

	if(d > 0xff)
	{
	  d -= 848;
	  if(d < 0 || d > 0xff) continue;
      }

      a = d % 16;

      b = (d - a)/16;

      hexStr += '%' + "0123456789ABCDEF".charAt(b) + "0123456789ABCDEF".charAt(a);
   }
   return hexStr;
}




// krai na dynselect.js



//table_search.js
//REQUIRES dynselect.js
var DEFAULT_SERVER_URL = 'search.pl';

function InitSearchBuffers()
{
   InitDynBuffers();
}

function initTableSearchObjs()
{
	//alert('initTableSearchObjs');
      initDynSelectObjs();
}

function initTableSearch()
{
	//alert('initTableSearch');
	if(this.initSearchFunction)
	{
	   this.initSearchFunction();
	}
}

function getSearchObj(selectName, formName)
{
	return getDynSelectObj(selectName, formName);
}

function existsSearchObj(selectName, formName)
{
	return existsDynSelectObj(selectName, formName);
}

function getSearchObjByBufferName(bufferName)
{
	return getDynSelectObjByBufferName(bufferName);
}

//izwikwa se pri potyrswane
//predi da se sglobqt hiddens
function onSearch()
{
	//alert(this.searchStringSelectBox);
	if(this.searchStringSelectBox)
	{
		//alert(this.searchStringSelectBox);
		this.searchString = this.searchStringSelectBox.options[this.searchStringSelectBox.selectedIndex].value;
	}
	else
	{	//alert(this.searchStringTextBox);
		if(this.searchStringTextBox)
		{
			//Escape-wa se TEXT box-a ot regexp
			//this.searchString = SqlRegExpEsc(this.searchStringTextBox.value);
			this.searchString = this.searchStringTextBox.value;
		}
	}
	//alert(this.searchString);
	if(this.searchColumnSelect)
	{
	   this.searchColumn = this.searchColumnSelect.options[ this.searchColumnSelect.selectedIndex ].value;
	}

	return this.searchTemplate;
}

function TableSearch(selectName, formName, tableName, resultId, resultDescr, initFunction)
{
	this.base = DynSelect;
	this.base(selectName, formName, initTableSearch);

	// Member Data

	// * DB Params
	this.tableName = tableName;
	this.resultId = resultId;
	this.resultDescr = resultDescr;
	this.searchTemplate = 'TRUE';
	this.searchFilter = null;
	this.lastSearchFilter = null;
	this.defaultCondition = null;

	this.searchString = null;
	this.searchStringTextBox = null;
	this.searchStringSelectBox = null;

	this.searchColumn = null;
	this.searchColumnSelect = null;

	this.searchLimit = null;
	this.searchUnlimit = false;
	this.searchOffset = null;
	this.fieldNotRequired = null;
	this.firstBlankOptionValue = null;
	this.firstBlankOptionText = null;
	this.distinct = null;
	this.resultChooseFirstOpiton = null;
	this.addGetParams = null;
	this.searchGetParams = null;

	this.serverURL = DEFAULT_SERVER_URL;

	//** TableSearch Init
	this.initSearchFunction = initFunction;

	// Member functions
	this.search = search;
	this.returnResult = returnResult;

	this.onSearchDefault = onSearch;

	this.onFound = null;

}

TableSearch.prototype = new DynSelect;

function search(selectName, formName, inpSearchString, onSearchFunc, onFoundFunc)
{
	var searchObj = this;
	if(selectName)
	{
	  searchObj = getSearchObj(selectName, formName) ;
	}
	if(!searchObj)
	{
           //alert('Ne e nameren searchObekt '+ selectName);
	   return;
	}
	if(onSearchFunc)
	{
		searchObj.onSearchCurrent = onSearchFunc;
	}

	var lastSearchFilter;

	if(searchObj.onSearchCurrent)
	{
	    lastSearchFilter = searchObj.onSearchCurrent();
	    searchObj.onSearchCurrent = null; //samo za tekushtoto tyrsene - i se izchistwa
	}
	else
	{
	   if(searchObj.onSearch)
	   {
	      lastSearchFilter = searchObj.onSearch();
	   }
	   else
	   {
	      lastSearchFilter = searchObj.onSearchDefault();
	   }
	}

	if(!lastSearchFilter)
	{
	   lastSearchFilter = " TRUE ";
	}
	if(searchObj.searchFilter)
	{
		lastSearchFilter = searchObj.searchFilter + ' AND ('+lastSearchFilter+')';
	}
	searchObj.lastSearchFilter = lastSearchFilter;

	if(onFoundFunc)
	{
	    searchObj.onFoundCurrent = onFoundFunc;
	}

	searchObj.addGetParams = searchObj.searchGetParams;

  with (searchObj)
  {
	// -- Zadylzhitelni parametri
	tableName ? addGetParams += "&table_name="+encodeURIComponent(tableName) : alert('Nedefinirana tablica w search ' + selectName);
	//TODO - da se mahne search templateto
	var sendPSearchTemplate;
	if(lastSearchFilter)
		sendPSearchTemplate = (searchTemplate ? searchTemplate : ' TRUE ') + ' AND '+ lastSearchFilter;
	else
		sendPSearchTemplate = searchTemplate;
	sendPSearchTemplate ? addGetParams += "&search_template="+encodeURIComponent(sendPSearchTemplate): alert('Nedefinirana shablon w search ' + selectName);

	lastSearchFilter ? addGetParams += "&search_filter="+encodeURIComponent(lastSearchFilter): null;//TODO da se wyrne alert-a alert('Nedefiniran filtyr za tyrsene w ' + selectName);
	defaultCondition ? addGetParams += "&default_condition="+encodeURIComponent(defaultCondition): null;

	resultId ? addGetParams += "&result_id="+encodeURIComponent(resultId): alert('Nedefinirana id na rezultata w search ' + selectName);
	resultDescr ? addGetParams += "&result_descr="+encodeURIComponent(resultDescr) : alert('Nedefinirana descr na rezultata w search ' + selectName);

	if(inpSearchString)
	{
	   addGetParams += "&search_string="+encodeURIComponent(inpSearchString);
	}
	else
	{
	//alert(searchString);
 	   searchString ? addGetParams += "&search_string="+encodeURIComponent(searchString) : null;//addGetParams += "&search_string=proba";
	}
	searchColumn ? addGetParams += "&search_column="+encodeURIComponent(searchColumn): null;
	searchLimit ? addGetParams += "&limit="+encodeURIComponent(searchLimit): null;
	searchUnlimit ? addGetParams += "&unlimit="+encodeURIComponent(searchUnlimit) : null;
	searchOffset ? addGetParams += "&offset="+encodeURIComponent(searchOffset): null;
	fieldNotRequired ? addGetParams += "&no_required_field=1": addGetParams += "&no_required_field=0";
	firstBlankOptionValue ? addGetParams += "&blank_option_value="+encodeURIComponent(firstBlankOptionValue): null;
	firstBlankOptionText ? addGetParams += "&blank_option_text="+encodeURIComponent(firstBlankOptionText): null;
	distinct ? addGetParams += "&distinct="+encodeURIComponent(distinct): null;
	resultChooseFirstOpiton ? addGetParams += "&result_choose_first_option="+encodeURIComponent(resultChooseFirstOpiton): null;
	searchOrdering ? addGetParams += "&result_ordering="+encodeURIComponent(searchOrdering): null;

  }
	searchObj.fillDynSelect();
}

function returnResult(selectName, formName)
{
	var searchObj = this;
	if(selectName)
	{
	  searchObj = getSearchObj(selectName, formName) ;
	}
	if(!searchObj)
	{
           //alert('Ne e nameren searchObekt '+ selectName);
	   return;
	}
	searchObj.returnDynSelectResult();
	if(searchObj.onFoundCurrent)
	{
	   searchObj.onFoundCurrent();
	   searchObj.onFoundCurrent=null;
	}
	else
	{
		if(searchObj.onFound)
		{
			searchObj.onFound();
		}
	}
}


function SqlQuote(stringToQuote, dontAddApp)
{
   if(!stringToQuote)
   {
        return "NULL";
   }
   var re = new RegExp('\'',"gi");
   stringToQuote = stringToQuote.replace(re,'\'\''); //udwoqwa se simwola za dane se byrka sys razdelitelq

   if(dontAddApp)
        return stringToQuote;

   return '\''+stringToQuote+'\'';

}
function SqlRegExpEsc(stringToEsc)
{
   if(!stringToEsc)
	return '';

   var re = new RegExp('([^A-Za-z0-9_])',"g");
   var escapedString = '';
   for(var i=0;i < stringToEsc.length;i++)
   {
      var symbol = stringToEsc[i];
      if(symbol.search(re) == -1)
      {
         // ne matchwa 're' znachi imame bukwa ili cifra
         escapedString += symbol;
      }
      else
      {
         //matchwa 're' znachi imame specialen simwol
         escapedString += '\\\\'+symbol;
      }
   }
   return escapedString;

}

function SqlEsc(stringToEscape)
{
   if(!stringToEscape)
   {
        return "NULL";
   }
   var re = new RegExp('\'',"gi");
   stringToEscape = stringToEscape.replace(re,'\'\''); //udwoqwa se simwola za dane se byrka sys razdelitelq

   //if(dontAddApp)
    //    return stringToEscape;

   return '\''+stringToEscape+'\'';


}


function stat_search()
 {
    window.status = 'Търси';
    return true;
 }


//krai na table_search.js

function DOMObj(name)
{
  var doc = document;

  if (doc.getElementById)
  {
  	this.obj = doc.getElementById(name);
	this.style = doc.getElementById(name).style;
  }
  else if (doc.all)
  {
	this.obj = doc.all[name];
	this.style = doc.all[name].style;
  }
  else if (doc.layers)
  {
   	this.obj = doc.layers[name];
   	this.style = doc.layers[name];
  }
}

function collapseTGRP(id)
{
      var r = new DOMObj(id);
      if(r.style.display == 'none')
      {
        r.style.display = '';
      }
      else
      {
        r.style.display = 'none';
      }
}

function submitResult(formSelector)
{
    var rv = true;
    if ( $(formSelector).find(".json-forms-input").length > 0 )
    {
        $(formSelector).find( ".json-forms-input" ).each(function(){
            var childrenObj = this.id;
            try {
                var extractResult = window[childrenObj].extract();
            }
            catch(e){
                console.log(e);
                return rv=false;
            }
            if(extractResult)
            {
                rv = true;
//            return false;
            }
                else
            {
                return rv = false;
            }

        });
    }
    else
    {
        rv = true;
    }
    console.log("SubmitResult return value: ",rv);
    return rv;
}


