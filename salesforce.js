/*
This file contains nForce/JavaScript methods to call Apttus CPQ APIs
*/

var nforce 			= require('nforce');
var http			= require('http');

var SF_UNAME 		= 'zeus@apttusdemo.com';
var SF_PWD 			= 'apttus2016';
var CLIENT_ID 		= '3MVG9szVa2RxsqBbcjjPuGNfserDXq1SxSSFxo8zESLKKurQkBuuq_uW9pPJBIu1eptKSgmsfG_90UeMHS2Ir';
var CLIENT_SECRET 	= '1728161657457271140';
var CALLBACK_URI	= 'http://localhost:3000/oauth/_callback';

var oauth;
var quoteId;
var cartId;

var org = nforce.createConnection({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: CALLBACK_URI,
  apiVersion: 'v36.0',  		// optional, defaults to current salesforce API version
  environment: 'production',  	// optional, salesforce 'sandbox' or 'production', production default
  mode: 'single' 				// optional, 'single' or 'multi' user mode, multi default
});

org.authenticate({ username: SF_UNAME, password: SF_PWD}, function(err, resp){
  // store the oauth object for this user
  if(!err){ 
		oauth = resp;
		
		var query = "SELECT Id, Apttus_Proposal__Proposal_Name__c FROM Apttus_Proposal__Proposal__c where name =\'test Quote 3\' limit 1";
		var q = "SELECT Id, Name, CreatedDate, BillingCity FROM Account WHERE Name = \'Global Media\'";
		//querySObject(query);
		//updateSObject(q);
		var quoteName = 'maxbot quote 1';
		var opportunityId = '00641000002bdiC';
		var priceListId = 'a1f410000004jDm';
		//createQuote(quoteName,opportunityId,priceListId);
		var productId = '01t41000000SG5S';
		//getOptionGroupsForPriceListProduct(priceListId,productId);
		productId = '01t410000007cj4';
		cartId = 'a1t410000005he3';
		//addProductToCart(cartId, productId, 1);
		var bundleProductId = '01t410000007cjF';
		//addBundleProductToCart(cartId, bundleProductId, 1);
		//createQuoteAPI();
		//updatePriceForCart(cartId);
		//finalizeCart(cartId);
		//console.log('quoteId : ' + quoteId);
		//querySObject();
		//updateSObject();
		//callAPI();
		console.log('Cached Token: ' + org.oauth);
    } else {
        console.log('Error: ' + err.message);
    }
});

function querySObject(query,callback){

	org.query({ query: query }, function(err, res) {
	  if(err) return console.error(err);
	  else {
		console.log(res.records[0]);
		callback(res.records);
		}
	});
}

function updateSObject(query) {

	

	org.query({ query: query }, function(err, resp) {
	  if(err) return console.error(err);

	  if(!err && resp.records) {

		var acc = resp.records[0];
		acc.name = 'Global Media 111';
		
		org.update({ sobject: acc }, function(err, resp){
		  if(!err) console.log(acc);
		});

	  } 
	  
  });

}

function createQuote(quoteName,opportunityId,priceListId,callback) {

		console.log('quoteName : ' + quoteName);
		console.log('opportunityId : ' + opportunityId);
		console.log('priceListId : ' + priceListId);
		
        var quote = nforce.createSObject('Apttus_Proposal__Proposal__c');
        quote.set('Apttus_Proposal__Proposal_Name__c', quoteName);
        quote.set('Apttus_Proposal__Opportunity__c', opportunityId);
        quote.set('Apttus_QPConfig__PriceListId__c', priceListId);

       org.insert({ sobject: quote }, function(err, resp){
		  if(!err) {
			console.log('quote created');
			console.log(resp);
			quoteId = resp.id;
			console.log('quoteId : ' + quoteId);
			callback(quoteId);
			
		  }
		});
}

function createCart(quoteId,callback) {
	console.log('quoteId : ' + quoteId);
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/createCart/'+quoteId;
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
			 cartId = str;
			 callback(cartId);
			 
        });

  });
  
}

function createQuoteAPI() {
	
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/createQuote';
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
			 cartId = str;
        });

  });
}

function getOptionGroupsForPriceListProduct(priceListId,productId) {
	
   console.log('priceListId : ' + priceListId);
   console.log('productId : ' + productId);
   
   http.get('http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/getOptionGroupsForPriceListProduct/'+priceListId + '/'+ productId, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
        });

  });
}

function addProductToCart(cartId, productId, quantity) {
	console.log('cartId : ' + cartId);
	console.log('bundleProductId : ' + productId);
	console.log('quantity : ' + quantity);
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/addProductToCart/'+cartId +"/"+ productId +"/" + quantity;
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
        });

  });
}

function addBundleProductToCart(cartId, bundleProductId, quantity) {
	console.log('cartId : ' + cartId);
	console.log('bundleProductId : ' + bundleProductId);
	console.log('quantity : ' + quantity);
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/addBundleProductToCart/'+cartId +"/"+ bundleProductId +"/" + quantity;
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
        });

  });
}

function addOptionToBundleProduct(cartId, selectedOptionId, componentId) {
	console.log('cartId : ' + cartId);
	console.log('selectedOptionId : ' + selectedOptionId);
	console.log('componentId : ' + componentId);
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/addOptionToBundleProduct/'+cartId +"/"+ selectedOptionId +"/" + componentId;
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
        });

  });
}

function removeOptions(cartId, componentId) {
	console.log('cartId : ' + cartId);
	console.log('componentId : ' + componentId);
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/removeOptions/'+cartId +"/"+ componentId;
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
        });

  });
}

function updatePriceForCart(cartId) {
	console.log('cartId : ' + cartId);
	
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/updatePriceForCart/'+cartId;
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
        });

  });
}

function finalizeCart(cartId) {
	console.log('cartId : ' + cartId);
	
	var url = 'http://cpqwebservices.azurewebsites.net/SFServiceCall.svc/finalizeCart/'+cartId;
	http.get( url, function(res){
        var str = '';
        console.log('Response is '+res.statusCode);

        res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });

        res.on('end', function () {
             console.log(str);
        });

  });
}

exports.org = org;
exports.querySObject = querySObject;
exports.updateSObject = updateSObject;
exports.createQuote = createQuote;
exports.createCart = createCart;
exports.createQuoteAPI = createQuoteAPI;
exports.getOptionGroupsForPriceListProduct = getOptionGroupsForPriceListProduct;
exports.addBundleProductToCart = addBundleProductToCart;
exports.addOptionToBundleProduct = addOptionToBundleProduct;
exports.removeOptions = removeOptions;
exports.updatePriceForCart = updatePriceForCart;
exports.finalizeCart = finalizeCart;
