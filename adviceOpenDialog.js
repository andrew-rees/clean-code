///////////////NSPCC FUNCTION UPDATED FOR DMFC 2843 FOR RR2/////////////////////////

function adviceOpenDialog(dialogIdConfig, createReferral) {

    createReferral = (typeof createReferral === 'undefined') ? 'default' : createReferral;
    //get the service group value
    var serviceGroup = Xrm.Page.getAttribute('new_servicegroupadvice').getValue()[0].name;

    //get Advice ID
    var adviceId = Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');
    //start of Helpline checks - checking on some html fields, Advice Outcome and certain values of related P&A records
    if (serviceGroup === 'Helpline') {
        if (createReferral != true) {
            var errorFieldsHL = "";
            //Check four html text fields have data
            if (Xrm.Page.getAttribute("py3_caseinformationrawhtml").getValue() === null) {
                errorFieldsHL = errorFieldsHL + "- Fill in Case Information\n"
            };
            if (Xrm.Page.getAttribute("py3_riskandprotectivefactors").getValue() === null) {
                errorFieldsHL = errorFieldsHL + "- Fill in Risks and Protective Factors\n"
            };
            if (Xrm.Page.getAttribute("py3_adviceprovidedrawhtml").getValue() === null) {
                errorFieldsHL = errorFieldsHL + "- Fill in Advice Provided\n"
            };
            if (Xrm.Page.getAttribute("py3_previousreferralsrawhtml").getValue() === null) {
                errorFieldsHL = errorFieldsHL + "- Fill in Previous Advice/Referrals\n"
            };

            //Advice Priority must have value (fixes a bug)
            if (Xrm.Page.getAttribute("py3_advicepriority").getValue() === null) {
                errorFieldsHL = errorFieldsHL + "- Choose an Advice Priority\n"
            };

            //Advice Outcome = Referral or Referral CW Update
            var outcome = Xrm.Page.getAttribute("py3_adviceoutcome").getValue();
            if (!(outcome === 215500000 /*Referral*/ ) &&
                !(outcome === 215500011 /*Ref-CW update*/ )) {
                errorFieldsHL = errorFieldsHL + "- Advice Outcome must be Referral or Referral - CW Update\n";
            };

            //Check Referrer's Anonymity has a value
            if (Xrm.Page.getAttribute("optevia_referrersanonymity").getValue() === null) {
                errorFieldsHL = errorFieldsHL + "- Choose Referrer's Anonymity option\n"
            };

            //API gets information from P&A to check, including first and last name, and address, and relationship to child
            var query = 'optevia_householdcompositions?$select=py3_personrolereferrer,py3_subjectofrequest,py3_tmpfirstname,py3_tmplastname,py3_addressrole,py3_towncity,py3_postcode,py3_addressline1,py3_tmpgender,py3_tmpdateofbirth,_py3_personid_value,_py3_personrelationshipvalueid_value&$filter=py3_AdviceId/optevia_adviceid eq ' + adviceId
            webApiCall("GET", query, true, 200, function (response) {
                var referrerExists = false;
                var subjectExists = false;
                var whichAddressNoRole = "";
                var whichPersonNoRelationship = "";
                var whichPersonNotCreated = "";

                function isTrue(value) {
                    return value != null
                }

                response.value.forEach(value => {
                    //define the values that will be looked at and checks values/truthy/falsey
                    var thisPostcode = value.py3_postcode;
                    var thisAddressLine1 = value.py3_addressline1;
                    var thisTownCity = value.py3_towncity;
                    var addressExists = [thisAddressLine1, thisTownCity, thisPostcode].some(isTrue);
                    var hasAddressRole = !!value.py3_addressrole;

                    var personExists = value._py3_personid_value;
                    var thisPersonRelationshipId = value._py3_personrelationshipvalueid_value;
                    var thisFirstName = value.py3_tmpfirstname;
                    var thisLastName = value.py3_tmplastname;

                    //Start the checks
                    if (value.py3_subjectofrequest === true) {
                        subjectExists = true
                    };
                    if (value.py3_personrolereferrer === true) {
                        referrerExists = true
                    };

                    //if the Person exists and the Person Rel doesn't
                    if (personExists && !thisPersonRelationshipId) {
                        var fullName = [thisFirstName, thisLastName].filter(x => !!x).join(" ");
                        var nameAndRelationship = [fullName].filter(x => !!x).join(", ");
                        var fullAddress = [thisAddressLine1, thisTownCity, thisPostcode].filter(x => !!x).join(", ");
                        whichPersonNoRelationship += " " + [nameAndRelationship, fullAddress].join(" ") + "\n";
                    };

                    //if the Address exists but without a Role
                    if (addressExists && !hasAddressRole) {
                        var fullName = [thisFirstName, thisLastName].filter(x => !!x).join(" ");
                        var nameAndRelationship = [fullName].filter(x => !!x).join(", ");
                        var fullAddress = [thisAddressLine1, thisTownCity, thisPostcode].filter(x => !!x).join(", ");
                        whichAddressNoRole += " " + [nameAndRelationship, fullAddress].join(" ") + "\n";
                    };


                    //If person has started to be created, but not finished
                    if (!personExists && (thisFirstName || thisLastName)) {
                        var fullName = [thisFirstName, thisLastName].filter(x => !!x).join(" ");
                        var nameAndRelationship = [fullName].filter(x => !!x).join(", ");
                        var fullAddress = [thisAddressLine1, thisTownCity, thisPostcode].filter(x => !!x).join(", ");
                        whichPersonNotCreated += " " + [nameAndRelationship, fullAddress].join(" ") + "\n";
                    };
                });

                //If there is no Referrer, throw an error
                if (referrerExists === false) {
                    errorFieldsHL = errorFieldsHL + "- Add a Referrer\n"
                };

                //If there is no Subject of Request, throw an error
                if (subjectExists === false) {
                    errorFieldsHL = errorFieldsHL + "- Add a Subject of Request\n"
                };

                //If there are P&As with a person who has been started, but not finished, throw an error with details
                if (whichPersonNotCreated.length) {
                    errorFieldsHL += "- The following People haven't been created:\n" + whichPersonNotCreated;
                };

                //If there are People without a Relationship to child, throw an error with details
                //updated
                if (whichPersonNoRelationship.length) {
                    errorFieldsHL += "- The following Person/Addresses don't have a Person Relationship:\n" + whichPersonNoRelationship;
                };

                //If there are Addresses without an Address Role, throw an error with details
                //updated
                if (whichAddressNoRole.length) {
                    errorFieldsHL += "- The following Person/Addresses don't have an Address Role:\n" + whichAddressNoRole;
                };

                if (errorFieldsHL.length) {
                    console.log(errorFieldsHL);
                    alert("Please do the following before you can create a referral:\n" + errorFieldsHL);
                    return;
                };        

                //Get the ID of the current record and remove the curly brackets "{" and "}"
                var objectId = Xrm.Page.data.entity.getId();
                //Get the entity name
                var entityName = Xrm.Page.data.entity.getEntityName();
                //Set up query to get the diaglog ID from the configuration entity
                var webApiQuery = "py3_configurations?$select=py3_value&$filter=contains(py3_name,'" + dialogIdConfig + "')&$top=1";
                webApiCall('GET', webApiQuery, true, 200, function (response) {
                    //Get the dialog ID and then call the function in the helper file
                    var dialogId = response.value[0]['py3_value'];
                    openDialogProcess(dialogId, entityName, objectId);
                });
            });
        };
    };
};

///////////////NSPCC FUNCTION UPDATED FOR DMFC 2843 FOR RR2/////////////////////////