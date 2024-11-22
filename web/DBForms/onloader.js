
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

//Kak se polzwa onLoader
//function Proba()
//{
		//alert('PROBA');
//}
//addOnLoad(Proba);

//krai na onloader.js

