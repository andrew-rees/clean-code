function formatReferralDataBeforeCreate(dialogIdConfig, createReferral, clPreReferral) {

    clPreReferral = (typeof clPreReferral === 'undefined') ? 'default' : clPreReferral;

 

    Xrm.Page.data.entity.save();

    var serviceGroupName;

    var serviceGroupObj = Xrm.Page.getAttribute("new_servicegroupadvice"); //Check for Lookup Object

    if (serviceGroupObj != null) {

        var serviceGroupObjValue = serviceGroupObj.getValue();//Check for Lookup Value

        if (serviceGroupObjValue != null) {

            serviceGroupName = serviceGroupObjValue[0].name;

        }

    }

 

    //get the ID of the Advice record

    var id = Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');

   //get the option chosen for the referrer's anonymity field

    var referrerAnonymity = Xrm.Page.getAttribute("optevia_referrersanonymity").getText();

 

    if (serviceGroupName == 'Childline') {

        var riskAssessmentText = Xrm.Page.getAttribute("py3_riskassessmentrawhtml").getValue();

        var ocmContacted = Xrm.Page.getAttribute("py3_ocmcontacted").getText();

        var childsViews = Xrm.Page.getAttribute("optevia_referraldesiredourcome").getValue();

        var supervisorOutcome = Xrm.Page.getAttribute("py3_supervisoroutcome").getValue();

 

        //Check the supervisor has completed the Risk Assesment text editor and alert them if not.

        if (riskAssessmentText == null || riskAssessmentText == '') {

            if (clPreReferral !== true) {

                alert("Please fill out the Needs, Risks and Future work Assessment text box before continuing.");

                return;

            }

        }

 

        if (childsViews == null || childsViews == '') {

            if (clPreReferral !== true) {

                if (supervisorOutcome == 215500003) {

                    alert("Please fill out the Child's Views / Desired Outcome of Referral text box before continuing.");

                    return;

                }

            }

        }

 

        if (ocmContacted == 'Yes') {

            if (clPreReferral !== true) {

                var ocmName = Xrm.Page.getAttribute("optevia_2nddm_systemuserid").getValue();

                var ocmContactedDateTime = Xrm.Page.getAttribute("optevia_2nddm_whencontacted").getValue();

                //var ocmReason = Xrm.Page.getAttribute("py3_ocmreason").getValue();

                var ocmSummary = Xrm.Page.getAttribute("optevia_2nddm_summarydiscussion").getValue();

 

                if (ocmName == null || ocmContactedDateTime == null || ocmSummary == '') {

                    alert('Please complete all OCM fields before continuing.');

                    return;

                }

            }

        }

        if (clPreReferral !== true) {

 

            var riskAssessedDate = Xrm.Page.getAttribute("py3_riskassesseddate").getValue();

            var riskAssessedBy = Xrm.Page.getAttribute("py3_riskassessedby").getValue();

 

            if (riskAssessedDate == null || riskAssessedBy == null) {

                var currentDateTime = new Date();

                var setUservalue = new Array();

                setUservalue[0] = new Object();

                setUservalue[0].id = Xrm.Page.context.getUserId();

                setUservalue[0].entityType = 'systemuser';

                setUservalue[0].name = Xrm.Page.context.getUserName();

                Xrm.Page.getAttribute('py3_riskassesseddate').setSubmitMode('always');

                Xrm.Page.getAttribute('py3_riskassessedby').setSubmitMode('always');

                Xrm.Page.getAttribute("py3_riskassesseddate").setValue(currentDateTime);

                Xrm.Page.getAttribute("py3_riskassessedby").setValue(setUservalue);

                Xrm.Page.data.entity.save();

            }

        }

 

 

        //--------------------------------------------------------- CHILDLINE --------------------------------------------------------------------------//

        //query including all data to pull for the formatting

        var query = 'optevia_householdcompositions?$select=optevia_name,optevia_personrole,py3_tmpfirstname,py3_tmplastname,py3_tmpgender,py3_age,py3_tmptelephone';

        query += ',py3_agegroup,py3_tmpethnicity,py3_tmpreligion,py3_sexuality,py3_livingcircumstances,py3_lookedafterchild,py3_tmpdateofbirth,py3_significantotherconcern'

        query += ',py3_addressline1,py3_addressline2,py3_addressline3,py3_addressname,py3_country,py3_county,py3_postcode,py3_towncity,_py3_personid_value,py3_contactdetails';

        query += '&$expand=py3_PersonRelationshipValueId($select=py3_name)';

        query += '&$filter=py3_AdviceId/optevia_adviceid eq ' + id;

 

 

 

        //get all the related person and address records

        webApiCall("GET", query, true, 200, function (response) {

            var promises = [];

            //for each person and address record loop through and start formatting the data

            for (i = 0; i < response.value.length ; i++) {

                //Get related person data - needs to be a separate query in order to get the correct labels for fields like optionsets

                var currentPersonData = null

                if (response.value[i]._py3_personid_value != null) {

                    var personQuery = 'contacts(' + response.value[i]._py3_personid_value + ')?$select=fullname,firstname,lastname,birthdate,telephone1,crm_lookedafterchild';

                    personQuery += ',py3_ethnicity,address2_name,address2_composite,crm_age,py3_ethnicity,py3_religion,gendercode,crm_sexuality,py3_estimatedageyn';

                   webApiCall("GET", personQuery, false, 200, function (personResponse) {

                        currentPersonData = personResponse;

                    });

                }

 

                //------------------------------------------------------ BEGIN CALLER / CONTACT ------------------------------------------------------------//

                if (response.value[i].optevia_personrole == 215500000) {

 

                    var promise = new Promise(function (resolve, reject) {

                        //start creating the formatted HTML with the person's role and name

                        var formattedHTML = '<h3><strong>Caller and Contact</strong></h3>';

                        formattedHTML += '<p><strong>'

                        if (currentPersonData != null) {

                            if (currentPersonData.firstname != null && currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.firstname + ' ' + currentPersonData.lastname;

                            } else if (currentPersonData.firstname != null) {

                                formattedHTML += currentPersonData.firstname;

                            } else if (currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.lastname;

                            }

                        } else {

                            if (response.value[i].py3_tmpfirstname != null && response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname + ' ' + response.value[i].py3_tmplastname;

                            } else if (response.value[i].py3_tmpfirstname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname;

                            } else if (response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmplastname;

                            }

                        }

 

                        //Close the initial paragraph and begin the list items

                        formattedHTML += '</strong></p><ul>';

 

                        //------------------------BEGIN Gender formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.gendercode != null) {

                                formattedHTML += '<li>Gender: ' + currentPersonData['gendercode@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_tmpgender != null) {

                            //formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            //}

                        } else if (response.value[i].py3_tmpgender != null) {

                            formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Gender formatting--------------------------------------//

 

                        //------------------------BEGIN Age formatting--------------------------------------//

 

                        if (currentPersonData != null) {

                            if (currentPersonData.birthdate != null) {

                                var fullDateOfBirth = new Date(currentPersonData.birthdate);

                                var ageDifMs = Date.now() - fullDateOfBirth.getTime();

                                var ageDate = new Date(ageDifMs); // miliseconds from epoch

                                var age = Math.abs(ageDate.getUTCFullYear() - 1970);

                                var ageWording = '<li>Estimated Age: ';

                                if (currentPersonData.py3_estimatedageyn != 1) {

                                    ageWording = '<li>Age: ';

                                }

                                formattedHTML += ageWording + age + '</li>';

                            } //else if (response.value[i].py3_age != null) {

                            //  formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                            // }

                        }

                        else if (response.value[i].py3_age != null) {

                            formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                        }

 

                        if (response.value[i].py3_agegroup != null && currentPersonData == null) {

                            formattedHTML += '<li>Age Group: ' + response.value[i]['py3_agegroup@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Age formatting--------------------------------------//

 

                        //------------------------BEGIN DoB formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.birthdate != null) {

                                var fullDateOfBirth = new Date(currentPersonData.birthdate);

                                var actualMonth = fullDateOfBirth.getMonth() + 1;

                                if (actualMonth <= 9) {

                                    actualMonth = '0' + actualMonth;

 

                                    var formattedDateOfBirth = fullDateOfBirth.getDate() + '/' + actualMonth + '/' + fullDateOfBirth.getFullYear();

                                    formattedHTML += '<li>Date of Birth: ' + formattedDateOfBirth + '</li>';

                                }

                            } //else {

                            //formattedHTML += '<li>Date of Birth: </li>';

                            //}

                        } else if (response.value[i].py3_tmpdateofbirth != null) {

                            //formattedHTML += '<li>Date of Birth: ' + response.value[i].py3_tmpdateofbirth + '</li>';

                            var fullDateOfBirth = new Date(response.value[i].py3_tmpdateofbirth);

                            var actualMonth = fullDateOfBirth.getMonth() + 1;

                            if (actualMonth <= 9) {

                                actualMonth = '0' + actualMonth;

 

                                var formattedDateOfBirth = fullDateOfBirth.getDate() + '/' + actualMonth + '/' + fullDateOfBirth.getFullYear();

                                formattedHTML += '<li>Date of Birth: ' + formattedDateOfBirth + '</li>';

                            }

                        }

                        //else {

                        //formattedHTML += '<li>Date of Birth: </li>';

                        //}

                        //------------------------END DoB formatting--------------------------------------//

 

                        //------------------------BEGIN Address formatting--------------------------------------//

                        if (currentPersonData != null) {

                            var formattedAddress = '<li>Address: ';

                            if (currentPersonData.address2_name != null) {

                                checkAddress = true;

                                formattedAddress += currentPersonData.address2_name + ', ';

                            }

 

                            if (currentPersonData.address2_composite != null) {

                                formattedAddress += currentPersonData.address2_composite;

                                formattedHTML += formattedAddress;

                            }

                            // else {

                            //    var formattedAddress = '<li>Address: ';

                            //    var checkAddress = false;

                            //    if (response.value[i].py3_addressname != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressname + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline1 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline1 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline2 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline2 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline3 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline3 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_towncity != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_towncity + ', ';

                            //    }

 

                            //    if (response.value[i].py3_county != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_county + ', ';

                            //    }

 

                            //    if (response.value[i].py3_counrty != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_country + ', ';

                            //    }

 

                            //    if (response.value[i].py3_postcode != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_postcode + ', ';

                            //    }

 

                            //    if (checkAddress) {

                            //        formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            //    }

                            //}

                        }

                        else {

                            var formattedAddress = '<li>Address: ';

                            var checkAddress = false;

                            if (response.value[i].py3_addressname != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressname + ', ';

                            }

 

                            if (response.value[i].py3_addressline1 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline1 + ', ';

                            }

 

                            if (response.value[i].py3_addressline2 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline2 + ', ';

                            }

 

                            if (response.value[i].py3_addressline3 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline3 + ', ';

                            }

 

                            if (response.value[i].py3_towncity != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_towncity + ', ';

                            }

 

                            if (response.value[i].py3_county != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_county + ', ';

                            }

 

                            if (response.value[i].py3_counrty != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_country + ', ';

                            }

 

                            if (response.value[i].py3_postcode != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_postcode + ', ';

                            }

 

                            if (checkAddress) {

                                formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            }

                        }

                        //------------------------END Address formatting--------------------------------------//

 

                        //------------------------BEGIN Ethnicity formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.py3_ethnicity != null) {

                                formattedHTML += '<li>Ethnicity: ' + currentPersonData['py3_ethnicity@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_tmpethnicity != null) {

                            // formattedHTML += '<li>Ethnicity: ' + response.value[i]['py3_tmpethnicity@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            // }

                        }

                        else if (response.value[i].py3_tmpethnicity != null) {

                            formattedHTML += '<li>Ethnicity: ' + response.value[i]['py3_tmpethnicity@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

                        //------------------------END Ethnicity formatting--------------------------------------//

 

                        //------------------------BEGIN Sexuality formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.crm_sexuality != null) {

                                formattedHTML += '<li>Sexuality: ' + currentPersonData['crm_sexuality@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_sexuality != null) {

                            // formattedHTML += '<li>Sexuality: ' + response.value[i]['py3_sexuality@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            //}

                        } else if (response.value[i].py3_sexuality != null) {

                            formattedHTML += '<li>Sexuality: ' + response.value[i]['py3_sexuality@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Sexuality formatting--------------------------------------//

 

                        //------------------------BEGIN Religion formatting--------------------------------------//

 

                        if (currentPersonData != null) {

                            if (currentPersonData.py3_religion != null) {

                                formattedHTML += '<li>Religion: ' + currentPersonData['py3_religion@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_tmpreligion != null) {

                            //formattedHTML += '<li>Religion: ' + response.value[i]['py3_tmpreligion@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            //}

                        } else if (response.value[i].py3_tmpreligion != null) {

                            formattedHTML += '<li>Religion: ' + response.value[i]['py3_tmpreligion@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Religion formatting--------------------------------------//

 

                        //------------------------BEGIN Looked After Child formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.crm_lookedafterchild == true) {

                                formattedHTML += '<li>Looked After Child: Yes</li>';

                            } else {

                                formattedHTML += '<li>Looked After Child: No</li>';

                            }

                        } else {

                            formattedHTML += '<li>Looked After Child: ' + response.value[i]['py3_lookedafterchild@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

                        //------------------------END Looked After Child formatting--------------------------------------//

 

                        //------------------------BEGIN Living Circumstances formatting--------------------------------------//

                        if (response.value[i].py3_livingcircumstances != null) {

                            formattedHTML += '<li>Living Circumstances: ' + response.value[i]['py3_livingcircumstances@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

                        //------------------------END Living Circumstances formatting--------------------------------------//

 

                        //------------------------BEGIN Contact Details formatting--------------------------------------//

                        if (response.value[i].py3_contactdetails != null) {

                            formattedHTML += '<li>Contact Details: ' + response.value[i]['py3_contactdetails'] + '</li>';

                        }

                        //------------------------END Contact Details formatting--------------------------------------//

 

                        formattedHTML += '</ul>';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

                //------------------------------------------------------ END CALLER / CONTACT ------------------------------------------------------------//

 

                //------------------------------------------------------ BEGIN THIRD PARTY ------------------------------------------------------------//

                else if (response.value[i].optevia_personrole == 215500001) {

                    var promise = new Promise(function (resolve, reject) {

                        //start creating the formatted HTML with the person's role and name

                        var formattedHTML = '<h3><strong>Third Party</strong></h3>';

                        formattedHTML += '<p><strong>'

                        if (currentPersonData != null) {

                            if (currentPersonData.firstname != null && currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.firstname + ' ' + currentPersonData.lastname;

                            } else if (currentPersonData.firstname != null) {

                                formattedHTML += currentPersonData.firstname;

                            } else if (currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.lastname;

                            }

                        } else {

                            if (response.value[i].py3_tmpfirstname != null && response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname + ' ' + response.value[i].py3_tmplastname;

                            } else if (response.value[i].py3_tmpfirstname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname;

                            } else if (response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmplastname;

                            }

                        }

 

                        //if there is a person relationship value, add it to the formatted HTML

                        if (response.value[i].py3_PersonRelationshipValueId != null) {

                            formattedHTML += ', ' + response.value[i].py3_PersonRelationshipValueId.py3_name;

                        }

 

                        //Close the initial paragraph and begin the list items

                        formattedHTML += '</strong></p><ul>';

 

                        //------------------------BEGIN Gender formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.gendercode != null) {

                                formattedHTML += '<li>Gender: ' + currentPersonData['gendercode@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_tmpgender != null) {

                            //formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            //}

                        }

                        else if (response.value[i].py3_tmpgender != null) {

                            formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

                        //------------------------END Gender formatting--------------------------------------//

 

                        //------------------------BEGIN Age formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.birthdate != null) {

                                var fullDateOfBirth = new Date(currentPersonData.birthdate);

                                var ageDifMs = Date.now() - fullDateOfBirth.getTime();

                                var ageDate = new Date(ageDifMs); // miliseconds from epoch

                                var age = Math.abs(ageDate.getUTCFullYear() - 1970);

 

                                var ageWording = '<li>Estimated Age: ';

                                if (currentPersonData.py3_estimatedageyn != 1) {

                                    ageWording = '<li>Age: ';

                                }

                                formattedHTML += ageWording + age + '</li>';

                            } //else if (response.value[i].py3_age != null) {

                            //formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                            //}

                        }

                        else if (response.value[i].py3_age != null) {

                            formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                        }

 

                        if (response.value[i].py3_agegroup != null) {

                            formattedHTML += '<li>Age Group: ' + response.value[i]['py3_agegroup@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

                        //------------------------END Age formatting--------------------------------------//

 

                        //------------------------BEGIN DoB formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.birthdate != null) {

                                var fullDateOfBirth = new Date(currentPersonData.birthdate);

                                var actualMonth = fullDateOfBirth.getMonth() + 1;

                                if (actualMonth <= 9) {

                                    actualMonth = '0' + actualMonth;

 

                                    var formattedDateOfBirth = fullDateOfBirth.getDate() + '/' + actualMonth + '/' + fullDateOfBirth.getFullYear();

                                    formattedHTML += '<li>Date of Birth: ' + formattedDateOfBirth + '</li>';

                                }

                           } //else {

                            //formattedHTML += '<li>Date of Birth: </li>';

                            //}

                        }

                        else if (response.value[i].py3_tmpdateofbirth != null) {

                            //formattedHTML += '<li>Date of Birth: ' + response.value[i].py3_tmpdateofbirth + '</li>';

                            var fullDateOfBirth = new Date(response.value[i].py3_tmpdateofbirth);

                            var actualMonth = fullDateOfBirth.getMonth() + 1;

                            if (actualMonth <= 9) {

                                actualMonth = '0' + actualMonth;

 

                                var formattedDateOfBirth = fullDateOfBirth.getDate() + '/' + actualMonth + '/' + fullDateOfBirth.getFullYear();

                                formattedHTML += '<li>Date of Birth: ' + formattedDateOfBirth + '</li>';

                            }

                        } //else {

                        //formattedHTML += '<li>Date of Birth: </li>';

                        //}

                        //------------------------END DoB formatting--------------------------------------//

 

                        //------------------------BEGIN Address formatting--------------------------------------//

                        //Address formatting

                        if (currentPersonData != null) {

                            var formattedAddress = '<li>Address: ';

                            if (currentPersonData.address2_name != null) {

                                checkAddress = true;

                                formattedAddress += currentPersonData.address2_name + ', ';

                            }

 

                            if (currentPersonData.address2_composite != null) {

                                formattedAddress += currentPersonData.address2_composite;

                                formattedHTML += formattedAddress;

                            } //else {

                            //var formattedAddress = '<li>Address: ';

                            //var checkAddress = false;

                            //if (response.value[i].py3_addressname != null) {

                            //    checkAddress = true;

                            //    formattedAddress += response.value[i].py3_addressname + ', ';

                            //}

 

                            //if (response.value[i].py3_addressline1 != null) {

                            //    checkAddress = true;

                           //    formattedAddress += response.value[i].py3_addressline1 + ', ';

                            //}

 

                            //if (response.value[i].py3_addressline2 != null) {

                            //    checkAddress = true;

                            //    formattedAddress += response.value[i].py3_addressline2 + ', ';

                            //}

 

                            //if (response.value[i].py3_addressline3 != null) {

                            //    checkAddress = true;

                            //    formattedAddress += response.value[i].py3_addressline3 + ', ';

                            //}

 

                            //if (response.value[i].py3_towncity != null) {

                            //    checkAddress = true;

                            //    formattedAddress += response.value[i].py3_towncity + ', ';

                            //}

 

                            //if (response.value[i].py3_county != null) {

                            //    checkAddress = true;

                            //    formattedAddress += response.value[i].py3_county + ', ';

                            //}

 

                            //if (response.value[i].py3_counrty != null) {

                            //    checkAddress = true;

                            //    formattedAddress += response.value[i].py3_country + ', ';

                            //}

 

                            //if (response.value[i].py3_postcode != null) {

                            //    checkAddress = true;

                            //    formattedAddress += response.value[i].py3_postcode + ', ';

                            //}

 

                            //if (checkAddress) {

                            //    formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            //}

                            //}

                        }

                        else {

                            var formattedAddress = '<li>Address: ';

                            var checkAddress = false;

                            if (response.value[i].py3_addressname != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressname + ', ';

                            }

 

                            if (response.value[i].py3_addressline1 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline1 + ', ';

                            }

 

                            if (response.value[i].py3_addressline2 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline2 + ', ';

                            }

 

                            if (response.value[i].py3_addressline3 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline3 + ', ';

                            }

 

                            if (response.value[i].py3_towncity != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_towncity + ', ';

                            }

 

                            if (response.value[i].py3_county != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_county + ', ';

                            }

 

                            if (response.value[i].py3_counrty != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_country + ', ';

                            }

 

                            if (response.value[i].py3_postcode != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_postcode + ', ';

                            }

 

                            if (checkAddress) {

                                formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            }

                        }

                        //------------------------END Address formatting--------------------------------------//

 

                        //------------------------BEGIN Telephone number formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.telephone1 != '') {

                                formattedHTML += '<li>Phone: ' + currentPersonData.telephone1 + '</li>';

                            }

                        }

                        //    } //else {

                        //    //  formattedHTML += '<li>Phone: ' + response.value[i].py3_tmptelephone + '</li>'

                        //    // }

                        //} else {

                        //    formattedHTML += '<li>Phone: ' + response.value[i].py3_tmptelephone + '</li>'

                        //}

                        //------------------------END Telephone number formatting--------------------------------------//

 

                        //------------------------BEGIN Contact Details formatting--------------------------------------//

                        if (response.value[i].py3_contactdetails != null) {

                            formattedHTML += '<li>Contact Details: ' + response.value[i]['py3_contactdetails'] + '</li>';

                        }

                        //------------------------END Contact Details formatting--------------------------------------//

 

                        formattedHTML += '</ul>';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

                //------------------------------------------------------ END THIRD PARTY ------------------------------------------------------------//

 

                //------------------------------------------------------ BEGIN SIGNIFICANT OTHER CONCERNS ------------------------------------------------------------//

                else if (response.value[i].optevia_personrole == 215500002) {

                    var promise = new Promise(function (resolve, reject) {

                        //start creating the formatted HTML with the person's role and name

                        var formattedHTML = '<h3><strong>Significant Other Concerns</strong></h3>';

                        formattedHTML += '<p><strong>'

                        if (currentPersonData != null) {

                            if (currentPersonData.firstname != null && currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.firstname + ' ' + currentPersonData.lastname;

                            } else if (currentPersonData.firstname != null) {

                                formattedHTML += currentPersonData.firstname;

                            } else if (currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.lastname;

                            }

                        } else {

                            if (response.value[i].py3_tmpfirstname != null && response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname + ' ' + response.value[i].py3_tmplastname;

                            } else if (response.value[i].py3_tmpfirstname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname;

                            } else if (response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmplastname;

                            }

                        }

 

                        //if there is a person relationship value, add it to the formatted HTML

                        if (response.value[i].py3_PersonRelationshipValueId != null) {

                            formattedHTML += ', ' + response.value[i].py3_PersonRelationshipValueId.py3_name;

                        }

 

                        //Close the initial paragraph and begin the list items

                        formattedHTML += '</strong></p><ul>';

 

                        //------------------------BEGIN Gender formatting--------------------------------------//

 

                        if (currentPersonData != null) {

                            if (currentPersonData.gendercode != null) {

                                formattedHTML += '<li>Gender: ' + currentPersonData['gendercode@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_tmpgender != null) {

                            //formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            //}

                        } else if (response.value[i].py3_tmpgender != null) {

                            formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Gender formatting--------------------------------------//

 

                        //------------------------BEGIN Age formatting--------------------------------------//

 

                        if (currentPersonData != null) {

                            if (currentPersonData.crm_age != null) {

                                formattedHTML += '<li>Age: ' + currentPersonData.crm_age + '</li>';

                            }

                            //else if (response.value[i].py3_age != null) {

                            //  formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                            //}

                        } else if (response.value[i].py3_age != null) {

                            formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                        }

 

                        if (response.value[i].py3_agegroup != null) {

                            formattedHTML += '<li>Age Group: ' + response.value[i]['py3_agegroup@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Age formatting--------------------------------------//

 

                        //------------------------BEGIN Concern formatting--------------------------------------//

 

                        //if there is a person relationship value, add it to the formatted HTML

                        if (response.value[i].py3_significantotherconcern != null) {

                            formattedHTML += '<li>Significant Other\'s Main Concern: ' + response.value[i]['py3_significantotherconcern@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Concern formatting--------------------------------------//

 

                       //------------------------BEGIN Address formatting--------------------------------------//

 

                        //Address formatting

                        if (currentPersonData != null) {

                            var formattedAddress = '<li>Address: ';

                            if (currentPersonData.address2_name != null) {

                                checkAddress = true;

                                formattedAddress += currentPersonData.address2_name + ', ';

                            }

 

                            if (currentPersonData.address2_composite != null) {

                                formattedAddress += currentPersonData.address2_composite;

                                formattedHTML += formattedAddress;

                            } //else {

                            //    var formattedAddress = '<li>Address: ';

                            //    var checkAddress = false;

                            //    if (response.value[i].py3_addressname != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressname + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline1 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline1 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline2 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline2 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline3 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline3 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_towncity != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_towncity + ', ';

                            //    }

 

                            //    if (response.value[i].py3_county != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_county + ', ';

                            //    }

 

                            //    if (response.value[i].py3_counrty != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_country + ', ';

                            //    }

 

                            //    if (response.value[i].py3_postcode != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_postcode + ', ';

                            //    }

 

                            //    if (checkAddress) {

                            //        formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            //    }

                            //}

                        } else {

                            var formattedAddress = '<li>Address: ';

                            var checkAddress = false;

                            if (response.value[i].py3_addressname != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressname + ', ';

                            }

 

                            if (response.value[i].py3_addressline1 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline1 + ', ';

                            }

 

                            if (response.value[i].py3_addressline2 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline2 + ', ';

                            }

 

                            if (response.value[i].py3_addressline3 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline3 + ', ';

                            }

 

                            if (response.value[i].py3_towncity != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_towncity + ', ';

                            }

 

                            if (response.value[i].py3_county != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_county + ', ';

                            }

 

                            if (response.value[i].py3_counrty != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_country + ', ';

                            }

 

                            if (response.value[i].py3_postcode != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_postcode + ', ';

                            }

 

                            if (checkAddress) {

                                formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            }

                        }

 

 

                        //------------------------END Address formatting--------------------------------------//

 

                        //------------------------BEGIN Telephone number formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.telephone1 != '') {

                                formattedHTML += '<li>Phone: ' + currentPersonData.telephone1 + '</li>';

                            } else {

                                formattedHTML += '<li>Phone: </li>'

                            }

                        } else {

                            formattedHTML += '<li>Phone: </li>'

                        }

 

 

                        //------------------------END Telephone number formatting--------------------------------------//

 

                        formattedHTML += '</ul>';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

                //------------------------------------------------------ END SIGNIFICANT OTHER CONCERNS ------------------------------------------------------------//

 

                //------------------------------------------------------ BEGIN OTHER CHILDREN AT RISK ------------------------------------------------------------//

                else if (response.value[i].optevia_personrole == 215500005) {

                    var promise = new Promise(function (resolve, reject) {

                        //start creating the formatted HTML with the person's role and name

                        var formattedHTML = '<h3><strong>Other Children at Risk of Main Concerns</strong></h3>';

                        formattedHTML += '<p><strong>'

                        if (currentPersonData != null) {

                            if (currentPersonData.firstname != null && currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.firstname + ' ' + currentPersonData.lastname;

                            } else if (currentPersonData.firstname != null) {

                                formattedHTML += currentPersonData.firstname;

                            } else if (currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.lastname;

                            }

                        } else {

                            if (response.value[i].py3_tmpfirstname != null && response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname + ' ' + response.value[i].py3_tmplastname;

                            } else if (response.value[i].py3_tmpfirstname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname;

                            } else if (response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmplastname;

                            }

                        }

 

                        //if there is a person relationship value, add it to the formatted HTML

                        if (response.value[i].py3_PersonRelationshipValueId != null) {

                            formattedHTML += ', ' + response.value[i].py3_PersonRelationshipValueId.py3_name;

                        }

 

                        //Close the initial paragraph and begin the list items

                        formattedHTML += '</strong></p><ul>';

 

                        //------------------------BEGIN Gender formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.gendercode != null) {

                                formattedHTML += '<li>Gender: ' + currentPersonData['gendercode@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_tmpgender != null) {

                            //formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            //}

                        }

                        else if (response.value[i].py3_tmpgender != null) {

                            formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

                        //------------------------END Gender formatting--------------------------------------//

 

                        //------------------------BEGIN Age formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.crm_age != null) {

                                formattedHTML += '<li>Age: ' + currentPersonData.crm_age + '</li>';

                            }

                            //else if (response.value[i].py3_age != null) {

                            //formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                            //}

                        }

                        else if (response.value[i].py3_age != null) {

                            formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                        }

 

                        if (response.value[i].py3_agegroup != null) {

                            formattedHTML += '<li>Age Group: ' + response.value[i]['py3_agegroup@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

                        //------------------------END Age formatting--------------------------------------//

 

                        //------------------------BEGIN Address formatting--------------------------------------//

                        if (currentPersonData != null) {

                            var formattedAddress = '<li>Address: ';

                            if (currentPersonData.address2_name != null) {

                                checkAddress = true;

                                formattedAddress += currentPersonData.address2_name + ', ';

                            }

 

                            if (currentPersonData.address2_composite != null) {

                                formattedAddress += currentPersonData.address2_composite;

                                formattedHTML += formattedAddress;

                            } //else {

                            //    var formattedAddress = '<li>Address: ';

                            //    var checkAddress = false;

                            //    if (response.value[i].py3_addressname != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressname + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline1 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline1 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline2 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline2 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline3 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline3 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_towncity != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_towncity + ', ';

                            //    }

 

                            //    if (response.value[i].py3_county != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_county + ', ';

                            //    }

 

                            //    if (response.value[i].py3_counrty != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_country + ', ';

                            //    }

 

                            //    if (response.value[i].py3_postcode != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_postcode + ', ';

                            //    }

 

                            //    if (checkAddress) {

                            //        formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            //    }

                            //}

                        }

                        else {

                            var formattedAddress = '<li>Address: ';

                            var checkAddress = false;

                            if (response.value[i].py3_addressname != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressname + ', ';

                            }

 

                            if (response.value[i].py3_addressline1 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline1 + ', ';

                            }

 

                            if (response.value[i].py3_addressline2 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline2 + ', ';

                            }

 

                            if (response.value[i].py3_addressline3 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline3 + ', ';

                            }

 

                            if (response.value[i].py3_towncity != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_towncity + ', ';

                            }

 

                            if (response.value[i].py3_county != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_county + ', ';

                            }

 

                            if (response.value[i].py3_counrty != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_country + ', ';

                            }

 

                            if (response.value[i].py3_postcode != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_postcode + ', ';

                            }

 

                            if (checkAddress) {

                                formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            }

                        }

                        //------------------------END Address formatting--------------------------------------//

 

                        //------------------------BEGIN Telephone number formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.telephone1 != '') {

                                formattedHTML += '<li>Phone: ' + currentPersonData.telephone1 + '</li>';

                            } else {

                                formattedHTML += '<li>Phone: </li>'

                            }

                        } else {

                            formattedHTML += '<li>Phone: </li>'

                        }

                        //------------------------END Telephone number formatting--------------------------------------//

 

                        //------------------------BEGIN Contact Details formatting--------------------------------------//

                        if (response.value[i].py3_contactdetails != null) {

                            formattedHTML += '<li>Contact Details: ' + response.value[i]['py3_contactdetails'] + '</li>';

                        }

                        //------------------------END Contact Details formatting--------------------------------------//

 

                        formattedHTML += '</ul>';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

                //------------------------------------------------------ END OTHER CHILDREN AT RISK ------------------------------------------------------------//

 

                //------------------------------------------------------ BEGIN PERPETRATOR ------------------------------------------------------------//

                else if (response.value[i].optevia_personrole == 215500003) {

                    var promise = new Promise(function (resolve, reject) {

                        //start creating the formatted HTML with the person's role and name

                        var formattedHTML = '<h3><strong>Perpetrator</strong></h3>';

                        formattedHTML += '<p><strong>'

                        if (currentPersonData != null) {

                            if (currentPersonData.firstname != null && currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.firstname + ' ' + currentPersonData.lastname;

                            } else if (currentPersonData.firstname != null) {

                                formattedHTML += currentPersonData.firstname;

                            } else if (currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.lastname;

                            }

                        } else {

                            if (response.value[i].py3_tmpfirstname != null && response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname + ' ' + response.value[i].py3_tmplastname;

                            } else if (response.value[i].py3_tmpfirstname != null) {

                                formattedHTML += response.value[i].py3_tmpfirstname;

                            } else if (response.value[i].py3_tmplastname != null) {

                                formattedHTML += response.value[i].py3_tmplastname;

                            }

                        }

 

                        //if there is a person relationship value, add it to the formatted HTML

                        if (response.value[i].py3_PersonRelationshipValueId != null) {

                            formattedHTML += ', ' + response.value[i].py3_PersonRelationshipValueId.py3_name;

                        }

 

                        //Close the initial paragraph and begin the list items

                        formattedHTML += '</strong></p><ul>';

 

                        //------------------------BEGIN Gender formatting--------------------------------------//

 

                        if (currentPersonData != null) {

                            if (currentPersonData.gendercode != null) {

                                formattedHTML += '<li>Gender: ' + currentPersonData['gendercode@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            } //else if (response.value[i].py3_tmpgender != null) {

                            //formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            //}

                        } else if (response.value[i].py3_tmpgender != null) {

                            formattedHTML += '<li>Gender: ' + response.value[i]['py3_tmpgender@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Gender formatting--------------------------------------//

 

                        //------------------------BEGIN Age formatting--------------------------------------//

 

                        if (currentPersonData != null) {

                            if (currentPersonData.birthdate != null) {

                                var fullDateOfBirth = new Date(currentPersonData.birthdate);

                                var ageDifMs = Date.now() - fullDateOfBirth.getTime();

                                var ageDate = new Date(ageDifMs); // miliseconds from epoch

                                var age = Math.abs(ageDate.getUTCFullYear() - 1970);

 

                                var ageWording = '<li>Estimated Age: ';

                                if (currentPersonData.py3_estimatedageyn != 1) {

                                    ageWording = '<li>Age: ';

                                }

                                formattedHTML += ageWording + age + '</li>';

                            } //else if (response.value[i].py3_age != null) {

                            //formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                            //}

                        } else if (response.value[i].py3_age != null) {

                            formattedHTML += '<li>Age: ' + response.value[i].py3_age + '</li>';

                        }

 

                        if (response.value[i].py3_agegroup != null) {

                            formattedHTML += '<li>Age Group: ' + response.value[i]['py3_agegroup@OData.Community.Display.V1.FormattedValue'] + '</li>';

                        }

 

                        //------------------------END Age formatting--------------------------------------//

 

                        //------------------------BEGIN Address formatting--------------------------------------//

 

                        //Address formatting

                        if (currentPersonData != null) {

                            var formattedAddress = '<li>Address: ';

                            if (currentPersonData.address2_name != null) {

                                checkAddress = true;

                                formattedAddress += currentPersonData.address2_name + ', ';

                            }

 

                            if (currentPersonData.address2_composite != null) {

                                formattedAddress += currentPersonData.address2_composite;

                                formattedHTML += formattedAddress;

                            } //else {

                            //    var formattedAddress = '<li>Address: ';

                            //    var checkAddress = false;

                            //    if (response.value[i].py3_addressname != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressname + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline1 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline1 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline2 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline2 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_addressline3 != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_addressline3 + ', ';

                            //    }

 

                            //    if (response.value[i].py3_towncity != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_towncity + ', ';

                            //    }

 

                            //    if (response.value[i].py3_county != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_county + ', ';

                            //    }

 

                            //    if (response.value[i].py3_counrty != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_country + ', ';

                            //    }

 

                            //    if (response.value[i].py3_postcode != null) {

                            //        checkAddress = true;

                            //        formattedAddress += response.value[i].py3_postcode + ', ';

                            //    }

 

                            //    if (checkAddress) {

                            //        formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            //    }

                            //}

                        } else {

                            var formattedAddress = '<li>Address: ';

                            var checkAddress = false;

                            if (response.value[i].py3_addressname != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressname + ', ';

                            }

 

                            if (response.value[i].py3_addressline1 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline1 + ', ';

                            }

 

                            if (response.value[i].py3_addressline2 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline2 + ', ';

                            }

 

                            if (response.value[i].py3_addressline3 != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_addressline3 + ', ';

                            }

 

                            if (response.value[i].py3_towncity != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_towncity + ', ';

                            }

 

                            if (response.value[i].py3_county != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_county + ', ';

                            }

 

                            if (response.value[i].py3_counrty != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_country + ', ';

                            }

 

                            if (response.value[i].py3_postcode != null) {

                                checkAddress = true;

                                formattedAddress += response.value[i].py3_postcode + ', ';

                            }

 

                            if (checkAddress) {

                                formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                            }

                        }

 

 

                        //------------------------END Address formatting--------------------------------------//

 

                        //------------------------BEGIN Telephone number formatting--------------------------------------//

                        if (currentPersonData != null) {

                            if (currentPersonData.telephone1 != '') {

                                formattedHTML += '<li>Phone: ' + currentPersonData.telephone1 + '</li>';

                            } else {

                                formattedHTML += '<li>Phone: </li>'

                            }

                        } else {

                            formattedHTML += '<li>Phone: </li>'

                        }

 

 

                        //------------------------END Telephone number formatting--------------------------------------//

 

                        formattedHTML += '</ul>';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

 

                }

                //------------------------------------------------------ END PERPETRATOR ------------------------------------------------------------//

 

                //------------------------------------------------------ BEGIN WHO TOLD BEFORE ------------------------------------------------------------//

                else if (response.value[i].optevia_personrole == 215500004) {

                   var promise = new Promise(function (resolve, reject) {

                        formattedHTML = '&nbsp;';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

                //------------------------------------------------------ END WHO TOLD BEFORE ------------------------------------------------------------//

 

                //------------------------------------------------------ BEGIN ADDITIONAL ADRESSES ------------------------------------------------------------//

                else if (response.value[i].optevia_personrole == 215500006) {

                    var promise = new Promise(function (resolve, reject) {

                        formattedHTML = '&nbsp;';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

                //------------------------------------------------------ END ADDITIONAL ADRESSES ------------------------------------------------------------//

 

                //------------------------------------------------------ BEGIN EXCEPTION HANDLING ------------------------------------------------------------//

                else {

                    var promise = new Promise(function (resolve, reject) {

                        formattedHTML = '<p>Person has an unrecognised person role, please update.</p>';

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

                //------------------------------------------------------ END EXCEPTION HANDLING ------------------------------------------------------------//

            }

 

            Promise.all(promises).then(

 

                function (responses) {

                    adviceOpenDialog(dialogIdConfig, clPreReferral);

                },

 

                function (error) {

                    console.log("One or more update failed.  Please contact an administrator.");

                }

            );

        });

    } else {

        //--------------------------------------------------------- HELPLINE --------------------------------------------------------------------------//

        //query including all data to pull for the formatting

        var query = 'optevia_householdcompositions?$select=optevia_name,py3_personrelationshipdescription,py3_personrolereferrer,py3_subjectofrequest,py3_personofconcern';

        query += ',py3_addressrole,py3_addressline1,py3_addressline2,py3_addressline3,py3_addressname,py3_country,py3_county,py3_postcode,py3_towncity,_py3_personid_value';

        query += '&$expand=py3_PersonRelationshipValueId($select=py3_name)';

        query += '&$filter=py3_AdviceId/optevia_adviceid eq ' + id;

 

        //get all the related person and address records

        webApiCall("GET", query, true, 200, function (response) {

            var promises = [];

 

            //for each person and address record loop through and start formatting the data

            for (i = 0; i < response.value.length; i++) {

                //Get related person data - needs to be a separate query in order to get the correct labels for fields like optionsets

                currentPersonData = null;

                if (response.value[i]._py3_personid_value != null) {

                    var personQuery = 'contacts(' + response.value[i]._py3_personid_value + ')?$select=fullname,firstname,lastname,birthdate,crm_age,telephone1,emailaddress1,py3_ethnicity,gendercode';

                    personQuery += ',py3_preferredlanguage_globaloption,py3_estimatedageyn,nspcc_doyouconsideryourselftohaveadisabilty,crm_disability_autistic,crm_disability_behaviouremotionalsocial';

                    personQuery += ',crm_disability_deafness,crm_disability_hardofhearing,crm_disability_healthneedsphysical,crm_disability_physicalimpairment,crm_disability_learningdifficultymildmoderate';

                    personQuery += ',crm_disability_severeprofoundlearningdiff,crm_disability_learningdifficultyother,crm_disability_mentalhealthneeds,crm_disability_speechlanguagecommunication';

                    personQuery += ',crm_disability_visualimpairment,crm_disability_other,py3_othercontactdetails,py3_socialmediawebaddress,middlename,crm_name_alternativesurname';

                    webApiCall("GET", personQuery, false, 200, function (personResponse) {

                        currentPersonData = personResponse;

                    });

                }

 

                if (response.value[i].py3_personrolereferrer == true && referrerAnonymity == 'Anonymous to Agency') {

 

                   var promise = new Promise(function (resolve, reject) {

                        //HL Anonymous Referrer Text

                        var configQuery = "py3_configurations?$select=py3_name,py3_value&$filter=contains(py3_name, 'HL Anonymous Referrer Text')"

 

                        webApiCall("GET", configQuery, false, 200, function (configResponse) {

                            formattedHTML = configResponse.value[0].py3_value;

                            var parameters = {};

                            parameters["py3_htmldescription"] = formattedHTML;

                            var jsonPayload = JSON.stringify(parameters);

                            var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                            webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                                resolve(postResponse);

                            }, jsonPayload);

                        });

                    });

                    promises.push(promise);

 

                } else if (response.value[i].py3_personrolereferrer == true && referrerAnonymity == 'No details provided') {

 

                    var promise = new Promise(function (resolve, reject) {

                        //HL Anonymous Referrer Text

                        var configQuery = "py3_configurations?$select=py3_name,py3_value&$filter=contains(py3_name, 'HL Referral No Details Text')"

 

                        webApiCall("GET", configQuery, false, 200, function (configResponse) {

                            formattedHTML = configResponse.value[0].py3_value;

                            var parameters = {};

                            parameters["py3_htmldescription"] = formattedHTML;

                            var jsonPayload = JSON.stringify(parameters);

                            var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                            webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                                resolve(postResponse);

                            }, jsonPayload);

                        });

                    });

                    promises.push(promise);

 

                } else {

                    //create a promise in order to wait for all of the async PATCH requests to complete before creating the referral

                    var promise = new Promise(function (resolve, reject) {

                        //start creating the formatted HTML with the person's name

                        var formattedHTML = '<p><strong>'

                        if (currentPersonData != null) {

                            if (currentPersonData.firstname != null && currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.firstname + ' ' + currentPersonData.lastname;

                            } else if (currentPersonData.firstname != null) {

                                formattedHTML += currentPersonData.firstname;

                            } else if (currentPersonData.lastname != null) {

                                formattedHTML += currentPersonData.lastname;

                            }

                        }

 

 

                        //if there is a person relationship value, add it to the formatted HTML

                        if (response.value[i].py3_PersonRelationshipValueId != null) {

                            formattedHTML += ', ' + response.value[i].py3_PersonRelationshipValueId.py3_name;

                        }

 

                        //if there is a person relationship description, add it to the formatted HTML

                        if (response.value[i].py3_personrelationshipdescription != null) {

                            formattedHTML += ', ' + response.value[i].py3_personrelationshipdescription;

                        }

 

                        //  Format the text relating to the roles: Referrer, Subject of Request and Person of Concern

                        var roleFlags = 0;

                        var roles = [];

 

                        if (response.value[i].py3_personrolereferrer == true) {

                            roleFlags++;

                            roles.push('Referrer');

                        }

 

                        if (response.value[i].py3_subjectofrequest == true) {

                            roleFlags++;

                            roles.push('Subject of Request');

                        }

 

                        if (response.value[i].py3_personofconcern == true) {

                            roleFlags++;

                            roles.push('Person of Concern');

                        }

 

                        if (roleFlags == 1) {

                            formattedHTML += ', ' + roles[0];

                        }

 

                        if (roleFlags == 2) {

                            formattedHTML += ', ' + roles[0] + ' and ' + roles[1];

                        }

 

                        if (roleFlags == 3) {

                            formattedHTML += ', ' + roles[0] + ', ' + roles[1] + ' and ' + roles[2];

                        }

                        //---------------------END role formatting--------------------------------------//

 

                        //Other address formatting

                        //If there is no title for this P&A record, it is likely that the address role will be appropriate. Check for no other title, then enter the address role

                        if (currentPersonData == undefined && response.value[i].py3_PersonRelationshipValueId == null && response.value[i].py3_personrelationshipdescription == null

                            && response.value[i].py3_personrolereferrer != true && response.value[i].py3_subjectofrequest != true && response.value[i].py3_personofconcern != true

                            && response.value[i].py3_addressrole != null) {

                            formattedHTML += response.value[i]['py3_addressrole@OData.Community.Display.V1.FormattedValue'];

                        }

                        //---------------------END other address formatting--------------------------------------//

 

                        //Close the initial paragraph and begin the list items

                        formattedHTML += '</strong></p><ul>';

 

                        //Formatting for any other names

                        if (currentPersonData != null) {

                            if (currentPersonData.middlename) {

                                formattedHTML += '<li>Other Name(s): ' + currentPersonData.middlename + '</li>';

                            }

 

                            if (currentPersonData.crm_name_alternativesurname != null) {

                                formattedHTML += '<li>Other Surname(s): ' + currentPersonData.crm_name_alternativesurname + '</li>';

                            }

                        }

                        //------------------------END formatting for any other names--------------------------------------//

 

                        //Age and DOB formatting

                        if (currentPersonData != null) {

                            if (currentPersonData.birthdate != null) {

                                if (currentPersonData['py3_estimatedageyn'] == true) {

                                    var fullDateOfBirth = new Date(currentPersonData.birthdate);

                                    var ageDifMs = Date.now() - fullDateOfBirth.getTime();

                                    var ageDate = new Date(ageDifMs); // miliseconds from epoch

                                    var age = Math.abs(ageDate.getUTCFullYear() - 1970);

 

                                    var ageWording = '<li>Estimated Age: ';

                                    if (currentPersonData.py3_estimatedageyn != 1) {

                                        ageWording = '<li>Age: ';

                                    }

                                    formattedHTML += ageWording + age + '</li>';

                                } else {

                                    var fullDateOfBirth = new Date(currentPersonData.birthdate);

                                    var ageDifMs = Date.now() - fullDateOfBirth.getTime();

                                    var ageDate = new Date(ageDifMs); // miliseconds from epoch

                                    var age = Math.abs(ageDate.getUTCFullYear() - 1970);

                                    var actualMonth = fullDateOfBirth.getMonth() + 1;

                                    if (actualMonth <= 9) {

                                        actualMonth = '0' + actualMonth;

                                    }

                                    var formattedDateOfBirth = fullDateOfBirth.getDate() + '/' + actualMonth + '/' + fullDateOfBirth.getFullYear();

                                    formattedHTML += '<li>Date of Birth: ' + formattedDateOfBirth + ' (Age, ' + age + ')</li>';

                                }

                            } else {

                                formattedHTML += '<li>Estimated Age: Unknown</li>';

                            }

                        }

                        //------------------------END Age and DOB formatting--------------------------------------//

 

                        //Address formatting

                        var formattedAddress = '<li>Address: '

                        if (response.value[i].py3_addressrole == 215500006) {

                            formattedAddress = '<li>Previous Address: '

                        }

 

                        var checkAddress = false;

                        if (response.value[i].py3_addressname != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_addressname + ', ';

                        }

 

                        if (response.value[i].py3_addressline1 != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_addressline1 + ', ';

                        }

 

                        if (response.value[i].py3_addressline2 != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_addressline2 + ', ';

                        }

 

                        if (response.value[i].py3_addressline3 != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_addressline3 + ', ';

                        }

 

                        if (response.value[i].py3_towncity != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_towncity + ', ';

                        }

 

                        if (response.value[i].py3_county != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_county + ', ';

                        }

 

                        if (response.value[i].py3_counrty != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_country + ', ';

                        }

 

                        if (response.value[i].py3_postcode != null) {

                            checkAddress = true;

                            formattedAddress += response.value[i].py3_postcode + ', ';

                        }

 

                        if (checkAddress) {

                            formattedHTML += formattedAddress.substring(0, formattedAddress.length - 2) + '</li>';

                        }

                        //-----------------------END Address formatting---------------------------------------------//

 

                        //Contact details formatting

                        if (currentPersonData != null) {

                            if (currentPersonData.telephone1) {

                                formattedHTML += '<li>Phone: ' + currentPersonData.telephone1 + '</li>';

                            }

 

                            if (currentPersonData.emailaddress1 != null) {

                                formattedHTML += '<li>Email: ' + currentPersonData.emailaddress1 + '</li>';

                            }

 

                            if (currentPersonData.py3_othercontactdetails != null) {

                                formattedHTML += '<li>Other Contact Details: ' + currentPersonData.py3_othercontactdetails + '</li>';

                            }

 

                            if (currentPersonData.py3_socialmediawebaddress != null) {

                                formattedHTML += '<li>Social Media / Web Address: ' + currentPersonData.py3_socialmediawebaddress + '</li>';

                            }

                        }

                        //-----------------------END contact details formatting --------------------------------------//

 

                        //Gender formatting

                        if (currentPersonData != null) {

                            if (currentPersonData.gendercode != null) {

                                formattedHTML += '<li>Gender: ' + currentPersonData['gendercode@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            }

                        }

                        //-----------------------END Gender formatting --------------------------------------//

 

                        //Ethnicity and Language formatting

                        if (currentPersonData != null) {

                            if (currentPersonData.py3_ethnicity != null) {

                                formattedHTML += '<li>Ethnicity: ' + currentPersonData['py3_ethnicity@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            }

 

                            if (currentPersonData.py3_preferredlanguage_globaloption != null) {

                                formattedHTML += '<li>Preferred Language: ' + currentPersonData['py3_preferredlanguage_globaloption@OData.Community.Display.V1.FormattedValue'] + '</li>';

                            }

 

                        }

                        //------------------------END Ethnicity and Language formatting-------------------------------//

 

                        //Disability formatting

                        if (currentPersonData != null) {

                            if (currentPersonData.nspcc_doyouconsideryourselftohaveadisabilty) {

                                var formattedDisabilities = '<li>Disability/ies: ';

                                var disabilities = 0;

                                if (currentPersonData.crm_disability_autistic) {

                                    formattedDisabilities += 'Autistic Spectrum Condition/Disorder; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_behaviouremotionalsocial) {

                                    formattedDisabilities += 'Emotional and Social Development Needs; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_deafness) {

                                    formattedDisabilities += 'Deaf; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_hardofhearing) {

                                    formattedDisabilities += 'Hard of Hearing; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_healthneedsphysical) {

                                    formattedDisabilities += 'Health Needs (Physical); ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_physicalimpairment) {

                                    formattedDisabilities += 'Physical Impairment; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_learningdifficultymildmoderate) {

                                    formattedDisabilities += 'Learning Difficulties - Mild/Moderate; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_severeprofoundlearningdiff) {

                                    formattedDisabilities += 'Learning Difficulties - Severe/Profound; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_learningdifficultyother) {

                                    formattedDisabilities += 'Learning Difficulties - Specific; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_mentalhealthneeds) {

                                    formattedDisabilities += 'Mental Illness; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_speechlanguagecommunication) {

                                    formattedDisabilities += 'Speech, Language and Communication Needs; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_visualimpairment) {

                                    formattedDisabilities += 'Visual Impairment; ';

                                    disabilities++;

                                }

                                if (currentPersonData.crm_disability_other) {

                                    formattedDisabilities += 'Other Disability; ';

                                    disabilities++;

                                }

                                if (disabilities >= 1) {

                                    formattedDisabilities.substring(0, formattedDisabilities.length - 2);

                                    formattedDisabilities += '</li>';

                                    formattedHTML += formattedDisabilities;

                                }

                            }

                        }

                        //------------------------END Disability formatting -------------------------------//

 

                        formattedHTML += '</ul>';

 

                        var parameters = {};

                        parameters["py3_htmldescription"] = formattedHTML;

                        var jsonPayload = JSON.stringify(parameters);

                        var postQuery = 'optevia_householdcompositions(' + response.value[i].optevia_householdcompositionid + ')';

                        webApiCall("PATCH", postQuery, true, 204, function (postResponse) {

                            resolve(postResponse);

                        }, jsonPayload);

                    });

                    promises.push(promise);

                }

            }

 

            Promise.all(promises).then(

 

                function (responses) {

                    adviceOpenDialog(dialogIdConfig, clPreReferral);

                },

 

                function (error) {

                    console.log("One or more update failed.  Please contact an administrator.");

                }

 

            );

 

        });

    }

}