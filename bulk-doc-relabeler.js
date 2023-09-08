// ==UserScript==
// @name         Bulk Document Relabel v1.0
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Bulk open patient chart in new window for uploading lab results
// @author       You
// @match        https://app.kareo.com/EhrWebApp/patients/viewDocuments/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Your code here...
  console.log("Bulk Relabel Script Running");

  // Add button
  const bulkRenameBtn = document.createElement("button");
  bulkRenameBtn.name = "singleFileNameButton";
  bulkRenameBtn.innerHTML = "Rename Single File";
  bulkRenameBtn.setAttribute(
    "style",
    "position: absolute; bottom: 64px; left: 15px; z-index: 5001;"
  );
  document.body.appendChild(bulkRenameBtn);

  const documentList = [
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2019_07_07_5",
      newDocName: "PHONE NOTE",
      newDate: "07/07/2019",
      newLabel: "Patient Correspondence",
    },
    // {
    //   oldDocName: "ANDREAWRIGHT_Encounter_2016_07_13_28",
    //   newDocName: "WWE 2016",
    //   newDate: "07/13/2016",
    //   newLabel: "Physician Established Patient Note",
    // },
  ];

  bulkRenameBtn.addEventListener("click", (event) => {
    // for each object in array, run editDoc details function
    //documentList.forEach((element) => myTimeout );
    for (let i = 0; i < documentList.length; i++) {
      openDocAndEditDetails(documentList[i]);
      console.log(documentList[i]);
    }
  });

  const openDocAndEditDetails = (documentDetails) => {
    //FIND oldDocName
    const oldDocName = documentDetails.oldDocName;
    //console.log(oldDocName);
    //FIND EDIT BUTTON OF oldDocName
    // GET ALL ROWS
    const wholeRow = document.querySelectorAll('[role="row"]');
    //console.log(wholeRow) // RETURNS LIST OF EVERY ROW STARTING WITH DATE
    //console.log('wholeRow:', wholeRow) // RETURNS all rows

    // GET ALL EDIT BUTTONS
    const editDownloadViewBtns = document.querySelectorAll(
      ".edit-button.right-align"
    );
    const editBtns = [];
    for (let i = 0; i < editDownloadViewBtns.length; i++) {
      if (i % 3 === 0) {
        editBtns.push(editDownloadViewBtns[i]);
      } // end if
    } // end for loop
    //console.log(editBtns);

    //FOR EACH ROW; MATCH OLD DOC NAME TO KAREO NAME AND CLICK EDIT BUTTON
    for (let i = 0; i < wholeRow.length; i++) {
      const row = wholeRow[i]; // single row in table of documents
      const documentName = row.getElementsByClassName("document-name")[0]; // reads text of name in row
      //console.log('documentName: ', documentName.innerText);
      let innerName = documentName && documentName.innerText;
      //console.log('inner name: ', innerName);

      if (oldDocName === innerName) {
        // if row has correct name
        //console.log(editBtns[i]);

        editBtns[i].click(); // click edit button for row
      } // end if
    } // end for loop

    setTimeout(() => editDocDetails(documentDetails), 1000);
  };

  const editDocDetails = (documentDetails) => {
    //EDIT DOCUMENT NAME
    const docForm = document.getElementById("document");
    console.log("docForm", docForm);
    const docName = docForm.name;
    docName.value = documentDetails.newDocName;
    //const documentNameInput = document.getElementsByTagName('input')[38]
    //console.log("documentNameInput: ", documentNameInput)

    //EDIT DOCUMENT LABEL
    const documentLabelInput = document.getElementsByTagName("select")[7];
    console.log("documentLabelInput: ", documentLabelInput);

    //FIND LIST OF LABEL OPTIONS
    const newLabel = documentDetails.newLabel;
    console.log(newLabel);
    const labelOptions = document.getElementById("category.id").options;
    console.log(labelOptions);
    //LOOP THROUGH LIST OF OPTIONS; IF INNERTEXT MATCHES NEWLABEL VARIABLE;
    const myOption = Array.from(labelOptions).find(
      (labelOption) => labelOption.innerText === newLabel
    );
    console.log(myOption);
    // REPLACE LABEL WITH NEW LABEL VARIABLE
    documentLabelInput.value = myOption.value; // works

    //EDIT DOCUMENT STATUS
    let newStatus = "Processed";
    let statusInput = document.getElementsByTagName("select")[8];
    //console.log(statusInput)
    let statusOptions = document
      .getElementById("documentStatus")
      .getElementsByTagName("option");
    //console.log(statusOptions)
    let myStatusOption = Array.from(statusOptions).find(
      (statusOption) => statusOption.innerText === newStatus
    );
    statusInput.value = myStatusOption.value;

    //EDIT DOCUMENT DATE
    const dateInput = document.getElementsByName("documentDate")[1];
    //console.log(dateInput)
    dateInput.value = documentDetails.newDate;

    //CLICK SAVE
    setTimeout(() => {
      const saveBtn = document.getElementById("cancel");
      //console.log(saveBtn)
      saveBtn.click();
    }, 1000);
  }; // END editDocDetails function
})();
