
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
		//alert("ts value ="+this.searchStringSelectBox.options[this.searchStringSelectBox.selectedIndex].value);
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
	//alert("Inp SearchString = "+inpSearchString);
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
	tableName ? addGetParams += "&"+"table_name="+encodeURIComponentWin1251(tableName) : alert('Nedefinirana tablica w search ' + selectName);
	//TODO - da se mahne search templateto 
	var sendPSearchTemplate;
	if(lastSearchFilter && lastSearchFilter != searchTemplate)
		sendPSearchTemplate = (searchTemplate ? searchTemplate : ' TRUE ') + ' AND '+ lastSearchFilter;
	else
		sendPSearchTemplate = searchTemplate;
	sendPSearchTemplate ? addGetParams += "&"+"search_template="+encodeURIComponentWin1251(sendPSearchTemplate): alert('Nedefinirana shablon w search ' + selectName);

	lastSearchFilter ? addGetParams += "&"+"search_filter="+encodeURIComponentWin1251(lastSearchFilter): null;//TODO da se wyrne alert-a alert('Nedefiniran filtyr za tyrsene w ' + selectName);
	defaultCondition ? addGetParams += "&"+"default_condition="+encodeURIComponentWin1251(defaultCondition): null;

	resultId ? addGetParams += "&"+"result_id="+encodeURIComponentWin1251(resultId): alert('Nedefinirana id na rezultata w search ' + selectName);
	resultDescr ? (addGetParams += "&"+"result_descr="+encodeURIComponentWin1251(resultDescr)) : alert('Nedefinirana descr na rezultata w search ' + selectName);
	//alert("REesult Descr :" + resultDescr);
	if(inpSearchString)
	{
	   addGetParams += "&"+"search_string="+encodeURIComponentWin1251(inpSearchString);
	}
	else
	{
	//alert("SEARCH STRING = "+searchString);
 	   searchString ? addGetParams += "&"+"search_string="+encodeURIComponentWin1251(searchString) : null;//addGetParams += "&"+"search_string=proba";
	}
	searchColumn ? addGetParams += "&"+"search_column="+encodeURIComponentWin1251(searchColumn): null;
	searchLimit ? addGetParams += "&"+"limit="+encodeURIComponentWin1251(searchLimit): null;
	searchUnlimit ? addGetParams += "&"+"unlimit="+encodeURIComponentWin1251(searchUnlimit) : null;
	searchOffset ? addGetParams += "&"+"offset="+encodeURIComponentWin1251(searchOffset): null;
	//addGetParams += "&"+"boza=1";
	fieldNotRequired ? addGetParams += "&"+"no_required_field=1": addGetParams += "&"+"no_required_field=0";
	firstBlankOptionValue ? addGetParams += "&"+"blank_option_value="+encodeURIComponentWin1251(firstBlankOptionValue): null;
	firstBlankOptionText ? addGetParams += "&"+"blank_option_text="+encodeURIComponentWin1251(firstBlankOptionText): null;
	distinct ? addGetParams += "&"+"distinct="+encodeURIComponentWin1251(distinct): null;
	resultChooseFirstOpiton ? addGetParams += "&"+"result_choose_first_option="+encodeURIComponentWin1251(resultChooseFirstOpiton): null;
	
	//alert("GetParams : "+ addGetParams);
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

   //re = new RegExp('\*\(\)\.\{\}\?\\\^\$\+',"gi");
   //stringToEscape = stringToEscape.replace(re,'$1');
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


