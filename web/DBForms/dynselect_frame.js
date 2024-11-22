
var dynSelectWindowObjs = new Array(30); //masiw ot obekti prozorci w koito se e izwyrshilo tyrseneto po daden bufer buferi

function addWindowRequestedDynSelectByBName(bName, windowRequestedDynSelect)
{
	dynSelectWindowObjs[bName]=windowRequestedDynSelect;
}

function getWindowRequestedDynSelectByBName(bName)
{
	return dynSelectWindowObjs[bName];
}