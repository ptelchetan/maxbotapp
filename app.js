"use strict";

var restify = require('restify');
var builder = require('botbuilder');
var calling = require('botbuilder-calling');
var salesforce  = require('./salesforce');
var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=6bce4284-450b-47f7-acdc-003c95c92f4f&subscription-key=9ceaa7a6ab9d4f11851bd28c80521d71'
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Serve a static web page
//server.get(/.*/, restify.serveStatic({
//    'directory': '.',
//    'default': 'index.html'
//}));

  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Create call bot	

var callConnector = new calling.CallConnector({
    callbackUrl: 'https://apttusmax.azurewebsites.net/api/calls',
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});


// Chat Bot
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
bot.dialog('/', intents);


// Call Bot
var callBot = new calling.UniversalCallBot(callConnector);
server.post('/api/calls', callConnector.listen());

//BOT META 
//endConversation
bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });


//botContactIntro
bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me. My name is Max, I am your Quote-to-Cash digital assistant. I look forward to working with you.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

var cartId;
var quoteId;
var proposalName;
var saveCartId = function(ln){
  console.log('my cartId is : ' + ln);
  cartId = ln;
  
};
var saveProposalName = function(ln){
  console.log('my cartId is : ' + ln);
  proposalName = ln;
  
};
var callCreateCart = function(ln){
  console.log('my quote is : ' + ln);
  salesforce.createCart(ln,saveCartId);
  quoteId = ln;
  var query = "SELECT Id, Apttus_Proposal__Proposal_Name__c FROM Apttus_Proposal__Proposal__c where id = \'" + quoteId + "\'";
  salesforce.querySObject(query,saveProposalName);
  
};

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});

// Create Quote Script
intents.matches('CreateQuote', [
    function (session) {
        
            builder.Prompts.text(session, "Enter quote name.");
		
    },
    function (session, results) {
        
        builder.Prompts.text(session, "Creating quote...");
		var opportunityId = '00641000002bdiCAAQ';
		var priceListId = 'a1f410000004jDmAAI';
		salesforce.createQuote(results.response,opportunityId,priceListId,callCreateCart);
		console.log('created quote id : ' + quoteId);
    },
	function (session, results) {
        console.log('created quote id : ' + quoteId);
		session.send("Your created quote is  '%s'", proposalName);
        
    },
    function (session, args, results, next) {
		console.log(results);
        if (results.response) {
			session.dialogData.quote.quotename = results.response;
			console.log('quote name : ' + results.response);
        }
        //var accountName = builder.EntityRecognizer.findEntity(args.entities, 'Account');
        if (!session.dialogData.quote.quotename) {
			
			
			
		}else {
			next();
        }
    },
    function (session, args, results, next) {
        if (results.response) {
            session.dialogData.quote.created = results.response;
        }
        //var associatedOpportunity = builder.EntityRecognizer.findEntity(args.entities, 'Opportunity');
        if (!session.dialogData.quote.created) {
            builder.Prompts.text(session, "Your quote %s has been created", quoteId);
        } else {
            next();
        }
    },
    function (session, args, results, next) {
        if (results.response) {
            session.dialogData.quote.opportunity = results.response;
        } 
        var recentQuotes = builder.EntityRecognizer.findEntity(args.entities, 'recentQuotes');  
        if (!recentQuotes) {
            builder.Prompts.text(session, "Great, have you done any recent quotes that are similar to this?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
        session.dialogData.quote.recentQuoteName = results.response;
        }
        if (!session.dialogData.quote.quoteChanges) {
        builder.Prompts.text(session, "Thank you, I found Quote Q-000768 ABB-Learjet60. Is this correct?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
        session.dialogData.quote.quoteChanges = results.response;
        session.send("Ok, I have clone that quote. Here are the details:");
			
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Q-000824"+" Alcatel Lucent – Learjet 60")
                    .items([
                        builder.ReceiptItem.create(session, "$1,575,750.00", "Learjet60").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Balticjet_Aircompany.jpg/300px-Balticjet_Aircompany.jpg")),

                    ])
                    .facts([
                        builder.Fact.create(session, "Alcatel", "Account Name"),
                        builder.Fact.create(session, "Diego Francis", "Primary Contact"),
                        builder.Fact.create(session, "35%", "Discount")
                    ])
                    .total("$1,024,238.00")
            ]);
        session.send(msg);
        }
        if (!session.dialogData.quote.quoteChangeDetails) {
        builder.Prompts.text(session, "Would you like to make any changes?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
        session.dialogData.quote.quoteChangeDetails = results.response;
        }
        if (!session.dialogData.quote.additionalQuoteChanges) {
        builder.Prompts.text(session, "Would you like to change the products or alter the discount?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
        session.dialogData.quote.additionalQuoteChanges = results.response;
        }
        if (!session.dialogData.quote.confirmedChanges) {
        builder.Prompts.text(session, "Ok, I have changed the discount to 15%, which requires 3 levels of approval." + '\n' + "For similar customers a discount between 20% and 25% has been most successful, with a 65% conversion rate. That range only requires one level of approval." + '\n' + "Would you like to change the discount?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
        session.dialogData.quote.confirmedChanges = results.response;
        session.send("Ok, I have changed the discount. Here are the details:");
        // Send a receipt with images
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Q-000824"+" Alcatel Lucent – 800K")
                    .items([
                        builder.ReceiptItem.create(session, "$1,575,750.00", "Learjet 60").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Balticjet_Aircompany.jpg/300px-Balticjet_Aircompany.jpg"))
                    ])
                    .facts([
                        builder.Fact.create(session, "Alcatel", "Account Name"),
                        builder.Fact.create(session, "Diego Francis", "Primary Contact"),
                        builder.Fact.create(session, "20%", "Discount")
                    ])
                    .total("$1,024,238.00")
            ]);
        session.send(msg);
        }
        if (!session.dialogData.quote.quoteApproval) {
        builder.Prompts.text(session, "Would you like to make any other changes?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
        session.dialogData.quote.quoteApproval = results.response;
        }
        if (!session.dialogData.quote.quoteSubmitted) {
        builder.Prompts.text(session, "Ok, should I submit for discount approval to Mike Matherson?");
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
        session.dialogData.quote.quoteSubmitted = results.response;
        }
        if (!session.dialogData.quote.additionalQuoteActions) {
        session.send("Your quote has been submitted for approval.");
        builder.Prompts.text(session, "Can I do something else for you?");
        } else {
            next();
        }
    },
    function (session, results) {
    if (results.response) {
    session.dialogData.quote.additionalQuoteActions = results.response;
    session.endConversation("Good Bye");
        }
    },
]);


// CLM Script
intents.matches('CreateAgreement', [
    function (session, args, next) {
        session.dialogData.agreement = args || {};
        if (!session.dialogData.agreement.username) {
            builder.Prompts.text(session, "What's your name?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.agreement.username = results.response;
        }
        if (!session.dialogData.agreement.agreementType) {
            builder.Prompts.choice(session, "What type of contract would you like to create?", ["Consulting Agreement", "Customer Service Agreement", "Master Publishing Agreeement", "Master Service & Support Agreement", "Non-Disclosure Agreement"]);
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.agreement.agreementType = results.response.entity;
        }
        if (!session.dialogData.agreement.accountName) {
            builder.Prompts.text(session, "Ok, which account is this for?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.agreement.accountName = results.response;
        }
        if (!session.dialogData.agreement.accountPrimary) {
            builder.Prompts.text(session, "I found General Electric Aviation North America, is that correct?");
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.accountPrimary = results.response;
        }
        if (!session.dialogData.agreement.primaryContact) {
            builder.Prompts.text(session, "Ok the primary contact is Robin Hurley, correct?");
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.primaryContact = results.response;
        }
        if (!session.dialogData.agreement.accountContact) {
            var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.ThumbnailCard(session)
                    .title("John Lewis")
                    .text("SVP Sales")
                    .images([
                        builder.CardImage.create(session, "https://www.engsfinance.com/wp-content/uploads/2016/02/Greg-Clemens-Western-Regional-Sales-Manager-v2-682x1024.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "LinkedIn"),
                        builder.CardAction.imBack(session, "John Lewis", "Select")
                    ]),
                new builder.ThumbnailCard(session)
                    .title("Terry Shade")
                    .text("CIO")
                    .images([
                        builder.CardImage.create(session, "https://media.licdn.com/mpr/mpr/shrinknp_400_400/AAEAAQAAAAAAAAK7AAAAJDYyYzBhMjQ1LTI0YzctNDUyYi1hZjVlLWMzYjUzMWI4OThlOA.png")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "LinkedIn"),
                        builder.CardAction.imBack(session, "Terry Shade", "Select")
                    ]),
                new builder.ThumbnailCard(session)
                    .title("Diego Francis")
                    .text("RVP Enterprise - West")
                    .images([
                        builder.CardImage.create(session, "https://lh3.googleusercontent.com/-DEa-o3DvYo8/AAAAAAAAAAI/AAAAAAAAAAA/-PPEgt6KQ2Y/photo.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "LinkedIn"),
                        builder.CardAction.imBack(session, "Diego Francis", "Select")
                    ]),
            ]);
            session.send(msg);
        }
        if (!session.dialogData.agreement.generateAgreement) {
        builder.Prompts.text(session, "I found these other contacts associated with GE");
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.accountContact = results.response.entity;
        }
        if (!session.dialogData.agreement.startDate) {
            builder.Prompts.time(session, "What is the Start Date?");
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.startDate = results.response;
        }
        if (!session.dialogData.agreement.contractTerm) {
             builder.Prompts.choice(session,"Ok, the start date is today. What is the Term of the contract?", ["5 years","3 years","2 years","1 year"]);
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.contractTerm = results.response.entity;
        }
        if (!session.dialogData.agreement.contractOptions) {
            builder.Prompts.choice(session,"The term is 3 years and the End Date is 9/6/2019 , what SLA Option would you like?",["No penalties and holdbacks","2.5% of penalties and holdbacks","5% of penalties and holdbacks","7.5% of penalties and holdbacks","10% of penalties and holdbacks"]);
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.contractOptions = results.response.entity;
        }
        if (!session.dialogData.agreement.warrantiesClause) {
        builder.Prompts.choice(session, "OK, what Warranties clause:", ["Basic warranties + standard disclaimer","Basic warranties + extended warranties","Basic + extended + supplemental warranties","Limited, extended and/or supplemental warranties","Warranties or deliverables that are unreasonable in scope"]);
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.warrantiesClause = results.response.entity;
        }
        if (!session.dialogData.agreement.paymentTerms) {
        builder.Prompts.choice(session, "OK, Basic warranties + standard disclaimer, what Payment Terms:", ["30 days","45 days","60 days","75 days","90 days"]);
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.paymentTerms = results.entity;
        }
        if (!session.dialogData.agreement.indemnificationClause) {
         builder.Prompts.choice(session, "Ok, what Indemnification clause:", ["IP infringement indemnity only", "IP infringement, death, personal injury indemnities only", "IP infringement, death, personal injury indemnities plus others","IP ownership, data privacy, death, personal injury only","Any indemnity obligations without control defense, costs"]);
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.indemnificationClause = results.response.entity;
        }
        if (!session.dialogData.agreement.allClausesFinal) {
        builder.Prompts.text(session, "Those are all the required terms and conditions. Would you like to update any other fields?");
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.send("Got it... I have created your Agreement!");
            session.dialogData.agreement.allClausesFinal = results.response;
            var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("GE MSA")
                    .subtitle("General Electric Aviation North America")
                    .text("Start Date: 9/5/2016" + " " + "End Date: 9/4/2018")
                    .images([
                        builder.CardImage.create(session, "http://www.pitt.edu/~erh78/images/geaviation.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Generate"),
                        builder.CardAction.imBack(session, "sendForReview", "Send for Review")
                    ])
            ]);
        session.send(msg);
        }
        if (!session.dialogData.agreement.generateAgreement) {
        builder.Prompts.text(session, "Would you like to generate this agreement?");
        } else {
            next();
        }
    },
    function(session, results, next) {
        if (results.response) {
            session.dialogData.agreement.generateAgreement = results.response;
        }
        if (!session.dialogData.agreement.sendForReview) {
        session.sendTyping();
        session.send("You agreement has been generated");
        builder.Prompts.text(session, "Would you like to send for review to Diego Francis?");
        } else {
            next();
        }
    },
    function(session, results, next) { 
        if (results.response) {
            session.dialogData.agreement.sendForReview = results.response;
        }
        if (!session.dialogData.agreement.additionalActions) {
        session.send("I have emailed this agreement to dfrancis@geaviation.com.");
        builder.Prompts.text(session, "Is there something else I can help you with?");
        } else {
            next();
        }
    },
    function (session, results) {
    if (results.response){
    session.endConversation("Good Bye");
        }
    },
]);


// Meeting follow up
intents.matches('MeetingFollowUpEntry', [
    function (session, args, results, next) {
        session.dialogData.meetingStatus = results.response;
        var meetingStatus = builder.EntityRecognizer.findEntity(args.entities, 'meetingStatus');
        if (!meetingStatus) {
            builder.Prompts.text(session, "How did the meeting go?");
        } else {
            next({ response: meetingStatus.entity });
        } 
    },
    function (session, args, results, next) {
        session.dialogData.updateMeeting = results.response;
        var updateMeeting = builder.EntityRecognizer.findEntity(args.entities, 'updateMeeting');
        if (!updateMeeting) {
            builder.Prompts.choice(session, "What would you like to update?", ["Opportunity", "Notes", "Quote"]);
        } else {
            next({ response: updateMeeting.entity })
        }
    },
    // If Statement for each response: What field on the x would you like to update: Choice
    function (session, args, results, next) {
        session.dialogData.updatedMeeting = results.response;
        var updatedMeeting = builder.EntityRecognizer.findEntity(args.entities, 'updatedMeeting');
        if (!updatedMeeting) {
            builder.Prompts.text(session, "What should we update on the" + results.response);
        } else {
            next({ response: updatedMeeting.entity })
        }
    },
    function (session, results) {
        session.dialogData.type = results.response.entity;
        session.send("Got it... I have updated your system.");
        session.endDialog();
    }
]);

// Show recent quotes
intents.matches('ShowRecentQuotes', [
    function (session, args, next) {
        session.dialogData.recentQuote = args || {};
        if (!session.dialogData.recentQuote.username) {
        builder.Prompts.text(session, "Hello... my name is MAX. What's your name?");
    } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
        session.userData.name = results.response;
        }
        if (!session.dialogData.recentQuote.similarCompany) {
        builder.Prompts.text(session, "Is there a company in particular you are referring to?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.send("Here are the most recent quotes I have found:")
            var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                    .title("Q-00002132")
                    .text("Total: 1,500,000.00")
                    .images([
                        builder.CardImage.create(session, "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRaYTPNF-zQCUApufTsF5qp4ecl3qs49kRYQ34weTf-7l7y7hLK")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Clone"),
                        builder.CardAction.imBack(session, "Q-00002132", "Change")
                    ]),
                new builder.HeroCard(session)
                    .title("Q-00002110")
                    .text("Total: 1,750,000.00")
                    .images([
                        builder.CardImage.create(session, "https://www.thedisruptory.com/wp-content/uploads/2015/06/Logo-Kuka.png")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Clone"),
                        builder.CardAction.imBack(session, "Q-00002110", "Change")
                    ]),
                new builder.HeroCard(session)
                    .title("Q-00002119")
                    .text("Total: 2,200,000.00")
                    .images([
                        builder.CardImage.create(session, "https://pbs.twimg.com/profile_images/443379763747368960/WZPiSCcA.jpeg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Clone"),
                        builder.CardAction.imBack(session, "Q-00002119", "Change")
                    ])
            ]);
            session.send(msg);
        }
        if (!session.dialogData.agreement.generateAgreement) {
        builder.Prompts.text(session, "Please select which quote");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.recentQuote.selectedQuote = results.response.entity;
        }
        if (!session.dialogData.similarQuote.presentedQuote) {
            builder.Prompts.text(session, "Would you like to present this quote?");
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
        session.dialogData.similarQuote.presentedQuote = results.response;
        session.send("Got it... I have presented your quote! ");
        session.endDialog();
    }
    }
]);


// ADD PRODUCTS TIES TO THE AddProducts INTENT IN LUIS NLP AND THE PRODUCT THAT IS CURRENTLY UNDER GAZE - FocusedObjectMessageSender.cs PICKS UP ProductId
// DIALOG GATHERS PARAMATERS: Quantity, SellingTerm, StartDate, EndDate
intents.matches('AddProducts', [
    function (session, args, results, next) {
        session.dialogData.quantity = results.response;
        var matchQuant;
        var entityQuant = builder.EntityRecognizer.findEntity(args.entities, 'Quantity');
        if (entityQuant) {
            matchQuant = builder.EntityRecognizer.findBestMatch(tasks, entityQuant.entity);
        }
        if (!matchQuant) {
            builder.Prompts.number(session, "How many would you like to add to the cart?");
        } else {
            next({ response: matchQuant})
        }
    },
    function (session, args, results, next) {
        session.dialogData.sellingTerm = results.response;
        var sellingTerm = builder.EntityRecognizer.findEntity(args.entities, 'SellingTerm');
        if (!sellingTerm) { 
            builder.Prompts.number(session, "What is the selling term?");
        } else {
            next({ response: sellingTerm.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.startDate = results.response;
    var startDate = builder.EntityRecognizer.findEntity(args.entities, 'StartDate');
    if (!startDate) {
        builder.Prompts.time(session, "What is the start date?");
    } else {
        next({ response: startDate.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.endDate = results.response;
    var endDate = builder.EntityRecognizer.findEntity(args.entities, 'EndDate');
    if (!endDate) {
        builder.Prompts.time(session, "What is the end date?");
    } else {
        next({ response: endDate.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.confirmation = results.response;
    builder.Prompts.choice(session, "Do you want to finalize the Cart", ["Finalize", "Add More Products"]);
    },
    function (session, results) {
    session.dialogData.nameAgain = results.response.entity;
    session.send("Got it... I have configured your quote! ");
    session.endDialog();
    }
]);


// ADD OPTIONS TIES TO THE AddOptions INTENT IN LUIS NLP AND THE OPTION THAT IS CURRENTLY UNDER GAZE - FocusedObjectMessageSender.cs PICKS UP ComponentID and ComponentProductId
// DIALOG GATHERS PARAMATERS: Quantity, SellingTerm, StartDate, EndDate
intents.matches('AddOptions', [
    function (session, args, results, next) {
        session.dialogData.quantity = results.response;
        var matchQuant;
        var entityQuant = builder.EntityRecognizer.findEntity(args.entities, 'Quantity');
        if (entityQuant) {
            matchQuant = builder.EntityRecognizer.findBestMatch(tasks, entityQuant.entity);
        }
        if (!matchQuant) {
            builder.Prompts.number(session, "How many would you like to add to the cart?");
        } else {
            next({ response: matchQuant})
        }
    },
    function (session, args, results, next) {
        session.dialogData.sellingTerm = results.response;
        var sellingTerm = builder.EntityRecognizer.findEntity(args.entities, 'SellingTerm');
        if (!sellingTerm) { 
            builder.Prompts.number(session, "What is the selling term?");
        } else {
            next({ response: sellingTerm.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.startDate = results.response;
    var startDate = builder.EntityRecognizer.findEntity(args.entities, 'StartDate');
    if (!startDate) {
        builder.Prompts.time(session, "What is the start date?");
    } else {
        next({ response: startDate.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.endDate = results.response;
    var endDate = builder.EntityRecognizer.findEntity(args.entities, 'EndDate');
    if (!endDate) {
        builder.Prompts.time(session, "What is the end date?");
    } else {
        next({ response: endDate.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.confirmation = results.response;
    builder.Prompts.choice(session, "Do you want to finalize the Cart", ["Finalize", "Add More Products"]);
    },
    function (session, results) {
    session.dialogData.nameAgain = results.response.entity;
    session.send("Got it... I have configured your quote! ");
    session.endDialog();
    }
]);



//TODO : PICK UP SelectedProduct and SelectedOptions

intents.matches('AddBundle', [
    function (session, args, results, next) {
        session.dialogData.quantity = results.response;
        var matchQuant;
        var entityQuant = builder.EntityRecognizer.findEntity(args.entities, 'Quantity');
        if (entityQuant) {
            matchQuant = builder.EntityRecognizer.findBestMatch(tasks, entityQuant.entity);
        }
        if (!matchQuant) {
            builder.Prompts.number(session, "How many would you like to add to the cart?");
        } else {
            next({ response: matchQuant})
        }
    },
    function (session, args, results, next) {
        session.dialogData.sellingTerm = results.response;
        var sellingTerm = builder.EntityRecognizer.findEntity(args.entities, 'SellingTerm');
        if (!sellingTerm) { 
            builder.Prompts.number(session, "What is the selling term?");
        } else {
            next({ response: sellingTerm.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.startDate = results.response;
    var startDate = builder.EntityRecognizer.findEntity(args.entities, 'StartDate');
    if (!startDate) {
        builder.Prompts.time(session, "What is the Start Date?");
    } else {
        next({ response: startDate.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.endDate = results.response;
    var endDate = builder.EntityRecognizer.findEntity(args.entities, 'EndDate');
    if (!endDate) {
        builder.Prompts.time(session, "What is the End Date?");
    } else {
        next({ response: endDate.entity })
        }
    },
    function (session, args, results, next) {
    session.dialogData.confirmation = results.response;
    builder.Prompts.choice(session, "Do you want to finalize the Cart", ["Finalize", "Add More Products"]);
    },
    function (session, results) {
    session.dialogData.nameAgain = results.response.entity;
    session.send("Got it... I have configured your quote! ");
    session.endDialog();
    }
]);