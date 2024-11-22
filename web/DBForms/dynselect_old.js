
// dynselect.js
if(numberDynBuffers)
{
   alert('table_search.js e weche wkljchen');
}

var DEFAULT_NUMBER_DYBSELECT_BUFFERS = 10; //broi dinamichni buferi po podrazbirane
var DEFAULT_BUFFER_PREFIX = 'buffer'; //prefiks za buferite 
var DEFAULT_DYN_SELECT_SERVER_URL = 'dyn_select_server_template.html';
var DEFAULT_BLANK_PAGE = 'blank.html';
var MILLISECONDS_BETWEEN_BUFF_SEARCHES_FOR_NS4 = 700;

var numberDynBuffers=-1; //broi buferi 
var freeDynBuffers; //masiw ot bIdx ( buffer imena ) koi sa swobodnite buferi
var targetDynSelectObjs; //masiw ot obekti Select na HTML forma za koito teche dinamichno popylwane  
var dynSelectObjs = new Array();

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


//inicializirane na dynSelect elementite
function initDynSelectObjs(doc)
{
   if(doc == null) 
	doc = viewPanelDoc;
   var str = '';
   for(var j=0; j<doc.forms.length; j++)
   {
    var form = doc.forms[j];
    for(var i=0; i<form.elements.length; i++)
    {
	with(form.elements[i])
    	{
     	  if(type == 'hidden' &&
	     name == '_init_dynsel_element')
      	  {	
		var dynselect = eval("form."+value);
		if(dynselect)
		{
			if(!dynSelectObjs[value])
			{
				alert('search in "'+value+ '" is not initialized !' );
			}	
	 		dynSelectObjs[value].selectObj = dynselect;
		}
          }
	}
    }
   }
   // za da sa widimi ot wsqkyde obektite 
   if(!is.ns4)
   {
     parent.mainDynFrame.dynSelectObjs = dynSelectObjs;
   }
}

function getDynSelectObj(selectName, formName)
{
	if(!formName)
	{
	  formName = "";
	}
	var retObj;
	if(is.ns4)
	{
	  retObj = dynSelectObjs[selectName+formName];
	}
	else
	{
	  retObj = parent.mainDynFrame.dynSelectObjs[selectName+formName]
	}
	if(!retObj)
	{
	  alert("Ne e inicializiran search obekt "+selectName+formName);
	}
	return retObj;
}

function getDynSelectObjByBufferName(bufferName)
{
   	return targetDynSelectObjs[bufferName];
}

function fillDynSelect(selectName, formName)
{
	if(selectName)
	{
	  DynSelectLoader(  getDynSelectObj(selectName, formName) );
	}
	else
	{
	  DynSelectLoader(this.selectObj);
	}
}

function returnDynSelectResult(selectName, formName)
{
	var dynObj = this;
	if(selectName)
	{
	  dynObj = getDynSelectObj(selectName, formName);
	}
	
        BUI_ReturnDynSelectResult(dynObj.foundArr, dynObj.searchBuffer, dynObj.selectedIndex);
}

function dynSelect(selectName, formName)
{
	//select name - ime na select-a w koito ste se popylwa rezultata 
	//form name - ime na formata w koqto se namira select-a, nezadylzhitelen 
	//            ako e zadadeno posle trqbwa da se tyrsi SELECT-a sys form-name-a 
	if(!formName)
	{
	  formName = "";
	}
	this.selectName = selectName;
	this.selectObj = null;
	this.formName = formName;
	dynSelectObjs[formName+selectName] = this;
	this.fillDynSelect = fillDynSelect;
	this.returnDynSelectResult = returnDynSelectResult;//!!!
}



//Inicializira Dyn Select - za dinamichno popylwane na SELECT wyw HTML forma sys zapitwane do servera !

//!! wika se izwyn modula
function InitDynBuffers(numDynBuffers)
{
   if(numberDynBuffers == -1)
   {
	numberDynBuffers = numDynBuffers || DEFAULT_NUMBER_DYBSELECT_BUFFERS; //10 bufera po podrazbirane
	freeDynBuffers = new Array(numberDynBuffers);
	targetDynSelectObjs = new Array(numberDynBuffers);

	for (var i=1; i < numberDynBuffers + 1; i++)
	{
		var bIdx = DEFAULT_BUFFER_PREFIX+i;
	        //var bIdxNum = i;
		//var bIdx = DEFAULT_BUFFER_PREFIX+i;
	
	        freeDynBuffers[bIdx] = true;
		if ( is.ns4 )
		{
		  document.write('<LAYER NAME="'+bIdx+'" visibility="none"></LAYER>');
		}
		else
		{	
		  document.write('<IFRAME SRC="blank.html" NAME="'+bIdx+'"  width="1" height="1" scrolling="no" frameborder="0"></IFRAME>');
		}
	}
	if ( !is.ns4 )
	{
	   document.write('<IFRAME SRC="blank.html" NAME="mainDynFrame"  width="1" height="1" scrolling="no" frameborder="0"></IFRAME>');
	}
	
   }
   else
   {
	alert('DynSelect is already init');
   }

}

//Wzima sledwashtiq swoboden nomer na bufer za tyrsene i go zakljchwa 
//Zapomnq i obekt select w koito da se popylnqt rezultatite,
// pod imeto na bufera za tyrsene za wryshtaniq rezultat
function GetNextFreeBuffer()
{
  var i = 1;//numberDynBuffers;
   
while( i < numberDynBuffers )
  { 
	var bufIdx = DEFAULT_BUFFER_PREFIX+i;
	var bufIdxNum = i;
	if(freeDynBuffers[bufIdx])
	{
		freeDynBuffers[bufIdx] = false;
		//return bufIdx;
		return bufIdxNum;
	}
	i++;
  }
  //return DEFAULT_BUFFER_PREFIX+1;
  return 1;
}

function ReleaseBufferAfterDynSelect(bIdx)
{
	if(is.ns4)
	{
	  freeDynBuffers[bIdx]=true;
	}
	else
	{
	  var reqWindow=parent.mainDynFrame.dynSelectWindowObjs[bIdx];
	  reqWindow.freeDynBuffers[bIdx]=true;
	}
}


//zarezhda URLto na servera
function LoadDynSelectURL(targetSelect,ServerURL) 
{	
	var bIdxNum = GetNextFreeBuffer();
	var bIdx = DEFAULT_BUFFER_PREFIX+bIdxNum;
	//alert(bIdx);
	targetDynSelectObjs[bIdx] = targetSelect; //zapomnq select obekta koito trqbwa da se napylni sled tyrsene

	if ( is.ns4 )
	{
	   //netscape
	   if(!eval('document.'+bIdx))
	   {
	     alert('tyrseneto ne e inicialiirano izwikaite funkciq InitDynBuffers() w BODYto na washiq HTML');
	     freeDynBuffers[bIdx]=true;
	     return;
	   }
	 //  var BFrame = eval('document.'+bIdx);
	  // BFrame.src = ServerURL;
	// ne e kato gornite 2 komentara poradi problem w netscape pri byrzo zarezhdane wyw .src	
	   var speedSearch =  MILLISECONDS_BETWEEN_BUFF_SEARCHES_FOR_NS4*(bIdxNum-1);
	   setTimeout('document.'+bIdx+'.src=\''+ServerURL+'\'',speedSearch);
	}
	else 
	{
	   //IE and Mozilla
	 
	   if(!eval('parent.'+bIdx))
	   {
	     alert('tyrseneto ne e inicialiirano izwikaite funkciq InitDynBuffers() w BODYto na washiq HTML(moz & IE)');
	     freeDynBuffers[bIdx]=true;
	     return;
	   }

	   if(!parent.mainDynFrame)
	   {
	     alert('tyrseneto ne e nameren mainDynFrame');
	     freeDynBuffers[bIdx]=true;
	     return;
	   }

	   //Syzdawa masiw kym mainDynFrame-a za pyrwonachalno polzwane
	   if(!parent.mainDynFrame.dynSelectWindowObjs)
	   {
	     parent.mainDynFrame.dynSelectWindowObjs=new Array(30);
	   }

	   var BFrame = eval('parent.'+bIdx);
	   BFrame.document.location = ServerURL;
	   parent.mainDynFrame.dynSelectWindowObjs[bIdx]=this.window;
	//   alert(parent.mainDynFrame.dynSelectWindowObjs[bIdx]);
	 //  alert('Load bidx='+bIdx);
	}
}


// zarezhda stranica na servera opisana po shablona dyn_select_server_template.html 
//i popylwa ot neq dinamichno zadadeniq SELECTbox 

//!! wika se izwyn modula
function DynSelectLoader(targetSelect, serverURL, addGetParams)
{
	/*
	1.* targetSelect - obekt Select na formata w koqto se popylwa rezultata
	2.serverURL - kakwa stranica da se zaredi na servera, nezadylzhitelen - po podrazbirane se polzwa dyn_select_server_template.html
	3.addGetParams - dopylnitelni GET parametri kym servera, nezadylzhitelen
	*/
	var dynSelectServerURL= serverURL || DEFAULT_DYN_SELECT_SERVER_URL;
	var getParams = '?uniq_query_id='+(new Date()).getTime();
	if(addGetParams)
	{
		getParams += '&'+addGetParams;
	}
	var newOptionIndex = targetSelect.options.length;
	targetSelect.options[newOptionIndex] = new Option("Моля изчакайте ...",""); 
	targetSelect.selectedIndex = newOptionIndex;
	LoadDynSelectURL( targetSelect, dynSelectServerURL + getParams );
}


//Wryshta rezultata i popylwa dinamichno SELECTa
function BUI_ReturnDynSelectResult(foundArr, bIdx, selectedIndex )
{
//	alert('BUI_ReturnDynSelectResult executed');
   if(!selectedIndex)
   {
	selectedIndex = 0;
   }
   
   var targetSelect;
   if(is.ns4)
    {
	targetSelect = targetDynSelectObjs[bIdx];
    }
   else
    { 
	var reqWindow=parent.mainDynFrame.dynSelectWindowObjs[bIdx];
      	targetSelect = reqWindow.targetDynSelectObjs[bIdx];
    }

   ReleaseBufferAfterDynSelect(bIdx);

   for(var i=targetSelect.options.length-1; i>0; i--)
   {
	targetSelect.options[i] = null;
   }
   for(var j=0; j<foundArr.length; j++)
   {
		targetSelect.options[j] = new Option(foundArr[j].text, foundArr[j].value);
		//targetSelect.options[j].value = foundArr[j].value;
		
		//alert(targetSelect.options.length);
   }
   targetSelect.selectedIndex = selectedIndex;

   //izchistwane na weche izwedeniq rezultat
   if(is.ns4)
    {
//     	var BFrame = eval('document.'+bIdx);
//   	BFrame.src = DEFAULT_BLANK_PAGE;
    }
   else
    {
        var BFrame = eval('parent.'+bIdx);
	BFrame.document.location = DEFAULT_BLANK_PAGE;
    }

}