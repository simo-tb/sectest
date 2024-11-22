
function BrowserCheck() {
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
		//alert(this.version);
		if(this.ie && (this.version.indexOf('MSIE 5.0') > 0 || this.version.indexOf('MSIE 4') > 0  || this.version.indexOf('MSIE 3') > 0 ))
			alert('Molq instaliraite Internet Explorer versiq 6 !');

	this.ie4 = (this.version.indexOf('MSIE 4')>0)
	this.ie5 = (this.version.indexOf('MSIE 5')>0)
	this.min = (this.ns||this.ie)
}
var is = new BrowserCheck();
 

// dynselect.js
if(numberDynBuffers)
{
   alert('table_search.js e weche wkljchen');
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
   if(doc == null) 
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
	dynSelObj.dynBuffer = is.ns4 ? eval('document.'+dynSelObj.dynBufferName) : eval('parent.'+dynSelObj.dynBufferName);
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

	var getParams = '?uniq_query_id='+(new Date()).getTime();
	if(dynSelObj.addGetParams)
	{
		getParams += '&'+dynSelObj.addGetParams;
	}

	var newOptionIndex = dynSelObj.selectObj.options.length;
	dynSelObj.selectObj.options[newOptionIndex] = new Option("Моля изчакайте ...",""); 
	dynSelObj.selectObj.selectedIndex = newOptionIndex;
	
	//towa se Load-wa
	var ServerURL = dynSelectServerURL + getParams;

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
	   dynSelObj.dynBuffer.location = ServerURL;
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
		  document.write('<IFRAME SRC="./pub/DBForms/blank.html" NAME="'+bIdx+'"  width="1" height="1" scrolling="no" frameborder="0"></IFRAME>');
		}
	}
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
	if(this.searchFilter)
	{
		lastSearchFilter = this.searchFilter + ' AND ('+lastSearchFilter+')';
	}
	this.lastSearchFilter = lastSearchFilter;

	if(onFoundFunc)
	{
	    searchObj.onFoundCurrent = onFoundFunc;
	}
	
	searchObj.addGetParams = searchObj.searchGetParams;

  with (searchObj)
  {
	// -- Zadylzhitelni parametri
	tableName ? addGetParams += "&table_name="+escape(tableName) : alert('Nedefinirana tablica w search ' + selectName);
	//TODO - da se mahne search templateto 
	var sendPSearchTemplate;
	if(lastSearchFilter && lastSearchFilter != searchTemplate)
		sendPSearchTemplate = searchTemplate + ' AND '+ lastSearchFilter;
	else
		sendPSearchTemplate = searchTemplate;
	sendPSearchTemplate ? addGetParams += "&search_template="+escape(sendPSearchTemplate): alert('Nedefinirana shablon w search ' + selectName);

	lastSearchFilter ? addGetParams += "&search_filter="+escape(lastSearchFilter): null;//TODO da se wyrne alert-a alert('Nedefiniran filtyr za tyrsene w ' + selectName);
	defaultCondition ? addGetParams += "&default_condition="+escape(defaultCondition): null;

	resultId ? addGetParams += "&result_id="+escape(resultId): alert('Nedefinirana id na rezultata w search ' + selectName);
	resultDescr ? addGetParams += "&result_descr="+escape(resultDescr) : alert('Nedefinirana descr na rezultata w search ' + selectName);
	
	if(inpSearchString)
	{
	   addGetParams += "&search_string="+escape(inpSearchString);
	}
	else
	{
	//alert(searchString);
 	   searchString ? addGetParams += "&search_string="+escape(searchString) : null;//addGetParams += "&search_string=proba";
	}
	searchColumn ? addGetParams += "&search_column="+escape(searchColumn): null;
	searchLimit ? addGetParams += "&limit="+escape(searchLimit): null;
	searchUnlimit ? addGetParams += "&unlimit="+escape(searchUnlimit) : null;
	searchOffset ? addGetParams += "&offset="+escape(searchOffset): null;
	fieldNotRequired ? addGetParams += "&not_required_field=1": addGetParams += "&not_required_field=0";
	firstBlankOptionValue ? addGetParams += "&blank_option_value="+escape(firstBlankOptionValue): null;
	firstBlankOptionText ? addGetParams += "&blank_option_text="+escape(firstBlankOptionText): null;
	distinct ? addGetParams += "&distinct="+escape(distinct): null;
	resultChooseFirstOpiton ? addGetParams += "&result_choose_first_option="+escape(resultChooseFirstOpiton): null;

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

function SqlEsc(stringToEscape)
{
   if(!stringToEscape)
   {
	return "NULL";
   }	
   re = new RegExp('\'',"gi");
   stringToEscape = stringToEscape.replace(re,'\'\''); //udwoqwa se simwola za da ne se byrka sys razdelitelq
   
   return '\''+stringToEscape+'\'';
   
}



function stat_search()
 {
    window.status = 'Търси';
    return true;
 }
