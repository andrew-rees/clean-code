class PersonAndAddress {
    constructor(postcode, addressLine1, townCity, addressRole, personRelationshipId, firstName, lastName, subjectOfRequest, referrer, person) {
        this.postcode = postcode;
        this.addressLine1 = addressLine1;
        this.townCity = townCity;
        this.addressRole = addressRole;
        this.personRelationshipId = personRelationshipId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.subjectOfRequest = subjectOfRequest;
        this.referrer = referrer;
        this.person = person;
    }
    referrerExists() {
        if (this.referrer) {
            referrerExists = true
        };
    };
    subjectExists() {
        if (this.subjectOfRequest) {
            subjectExists = true
        };
    };
    hasAddressRole() {
        if (this.addressRole) {
            return true
        };
    };
    addressExists() {
        [this.addressLine1, this.townCity, this.postcode].some(function (value) {
            return value != null
        });
    };
    personExists() {
        if (this.person) {
            return true
        }
    };
    personRelationshipExists() {
        if (this.personRelationshipId) {
            return true
        };
    };
    nameExists() {
        if (this.firstName || this.lastName) {
            return true
        };
    };
};

function getValues() {

    //these are all one-ff values on the form that are either truthy or falsey
    var formFields = [
        {value: caseInformationField = "hello", name: "Case Information"},
        {value: risksField = null, name: "Risk and Protective Factors"},
        {value: adviceField = "bob", name: "Advice Provided"},
        {value: previousField = "Mary, was, a; little, lamb&", name: "Previous Advice/Referrals"},
        {value: advicePriority = 1, name: "Priority"},
        {value: outcome = null, name: "Advice Outcome"},
        {value: anonymity = "Yes", name: "Referer's Anonymity"},
    ];


    //this is a loop through a set of related objects of which there can be multiple, hence the GET annd the forEach
    var query = 'optevia_householdcompositions?$select=py3_personrolereferrer,py3_subjectofrequest,py3_tmpfirstname,py3_tmplastname,py3_addressrole,py3_towncity,py3_postcode,py3_addressline1,py3_tmpgender,py3_tmpdateofbirth,_py3_personid_value,_py3_personrelationshipvalueid_value&$filter=py3_AdviceId/optevia_adviceid eq ' + adviceId;
    webApiCall("GET", query, true, 200, function (response) {
        response.value.forEach(value => {
            var personAndAddress = new PersonAndAddress()
            personAndAddress.postcode = value.py3_postcode;
            personAndAddress.addressLine1 = value.py3_addressline1;
            personAndAddress.townCity = value.py3_towncity;
            personAndAddress.addressRole = value.py3_addressrole;
            personAndAddress.personRelationshipId = value._py3_personrelationshipvalueid_value;
            personAndAddress.firstName = value.py3_tmpfirstname;
            personAndAddress.lastName = value.py3_tmplastname;
            personAndAddress.subjectOfRequest = value.py3_subjectofrequest;
            personAndAddress.referrer = value.py3_personrolereferrer;
            personAndAddress.person = value._py3_personid_value;
            //personAndAddresses.push(personAndAddress);
            errorCalculation(personAndAddress);
            errorPersonAddressDisplay(personAndAddress, formFields);
        });
    });
};

function errorCalculation() {

    //these are calculating one-off boolean values that are made true if one of the loop's subjectExists or referrerExists = true
    personAndAddress.subjectExists();
    personAndAddress.referrerExists();

    //these are calculating boolean values for each loop
    personAndAddress.hasAddressRole();
    personAndAddress.addressExists();
    personAndAddress.personExists();
    personAndAddress.personRelationshipExists();
    personAndAddress.nameExists();
};

function errorPersonAddressDisplay() {

    var errorFieldsHLPerson = "";
    var whichAddressNoRole = "";
    var whichPersonNoRelationship = "";
    var whichPersonNotCreated = "";

    if (!referrerExists) {
        errorFieldsHLPerson += "- Add a Referrer\n"
    };
    if (!subjectExists) {
        errorFieldsHLPerson += "- Add a Subject of Request\n"
    };

    //if the Person exists and the Person Rel doesn't
    if (personAndAddress.personExists() && !(personAndAddress.personRelationshipExists())) {
        var fullName = [thisFirstName, thisLastName].filter(x => !!x).join(" ");
        var nameAndRelationship = [fullName].filter(x => !!x).join(", ");
        var fullAddress = [thisAddressLine1, thisTownCity, thisPostcode].filter(x => !!x).join(", ");
        whichPersonNoRelationship += " " + [nameAndRelationship, fullAddress].join(" ") + "\n";
    };

    //if the Address exists but without a Role
    if (personAndAddress.addressExists() && !(personAndAddress.hasAddressRole())) {
        var fullName = [thisFirstName, thisLastName].filter(x => !!x).join(" ");
        var nameAndRelationship = [fullName].filter(x => !!x).join(", ");
        var fullAddress = [thisAddressLine1, thisTownCity, thisPostcode].filter(x => !!x).join(", ");
        whichAddressNoRole += " " + [nameAndRelationship, fullAddress].join(" ") + "\n";
    };

    //If person has started to be created, but not finished
    if (!(personAndAddress.personExists()) && personAndAddress.nameExists()) {
        var fullName = [thisFirstName, thisLastName].filter(x => !!x).join(" ");
        var nameAndRelationship = [fullName].filter(x => !!x).join(", ");
        var fullAddress = [thisAddressLine1, thisTownCity, thisPostcode].filter(x => !!x).join(", ");
        whichPersonNotCreated += " " + [nameAndRelationship, fullAddress].join(" ") + "\n";
    };

    //If there are P&As with a person who has been started, but not finished, throw an error with details
    if (whichPersonNotCreated.length) {
        errorFieldsHLPerson += "- The following People haven't been created:\n" + whichPersonNotCreated;
    };

    //If there are People without a Relationship to child, throw an error with details
    //updated
    if (whichPersonNoRelationship.length) {
        errorFieldsHLPerson += "- The following Person/Addresses don't have a Person Relationship:\n" + whichPersonNoRelationship;
    };

    //If there are Addresses without an Address Role, throw an error with details
    //updated
    if (whichAddressNoRole.length) {
        errorFieldsHLPerson += "- The following Person/Addresses don't have an Address Role:\n" + whichAddressNoRole;
    };

};

function errorFormFieldDisplay() {
    var errorFieldsHLForm = "";

    for (i = 0; i < formFields.length; i++) {
        if (formFields[i].value) {
            errorFieldsHLForm += "\nPlease fill in: " + formFields[i].name + ",";
        };
    };
    if (!(outcome === 215500000 /*Referral*/ ) &&
        !(outcome === 215500011 /*Ref-CW update*/ )) {
        errorFieldsHLForm += "- Advice Outcome must be Referral or Referral - CW Update\n";
    };
};

function displayError () {
    if (errorFieldsHLForm.length || errorFieldsHLPerson.length) {
        console.log(errorFieldsHLForm + "\n" + errorFieldsHLPerson);
        alert("Please do the following before you can create a referral:\n" + errorFieldsHLForm + "\n" + errorFieldsHLPerson);
        return;
    };      
};

function adviceOpenDialog(dialogIdConfig, createReferral) {

    createReferral = (typeof createReferral === 'undefined') ? 'default' : createReferral;
    var serviceGroup = Xrm.Page.getAttribute('new_servicegroupadvice').getValue()[0].name;
    //var adviceId = Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');
    if (serviceGroup === 'Helpline') {
        if (createReferral != true) {

            //these are values that are set to true by at least 1 instance in the getValues loop
            var referrerExists = false;
            var subjectExists = false;

            getValues();
            errorFormFieldDisplay();
            displayError();

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
        };
    };
};

///////////////NSPCC FUNCTION UPDATED FOR DMFC 2843 FOR RR2/////////////////////////