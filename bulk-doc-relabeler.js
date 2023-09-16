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

  const DOCUMENT_LIST = [
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2019_07_07_5",
      newDocName: "PHONE NOTE",
      newDate: "07/07/2019",
      newLabel: "Patient Correspondence",
    },
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2019_07_07_6",
      newDocName: "PHONE NOTE",
      newDate: "07/07/2019",
      newLabel: "Patient Correspondence",
    }, // NO MATCH
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2016_07_13_28",
      newDocName: "WWE 2016",
      newDate: "07/13/2016",
      newLabel: "Physician Established Patient Note",
    },
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2016_07_13_28",
      newDocName: "WWE 2016",
      newDate: "07/13/2016",
      newLabel: "Physician Established Patient Note",
    },
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2016_07_13_28",
      newDocName: "WWE 2016",
      newDate: "07/13/2016",
      newLabel: "Physician Established Patient Note",
    },
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2016_07_13_28",
      newDocName: "WWE 2016",
      newDate: "07/13/2016",
      newLabel: "Physician Established Patient Note",
    },
    {
      oldDocName: "ANDREAWRIGHT_Encounter_2016_07_13_28",
      newDocName: "WWE 2016",
      newDate: "07/13/2016",
      newLabel: "Physician Established Patient Note",
    },
    // {
    //   oldDocName: "ANDREAWRIGHT_Encounter_2019_07_07_6",
    //   newDocName: "PHONE NOTE",
    //   newDate: "07/07/2019",
    //   newLabel: "Patient Correspondence",
    // }, // NO MATCH
  ];

  createButtonAndAddToPage();

  /* *****************************************************************************
  asyncTimeout
  ******************************************************************************/
  function asyncTimeout(timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }

  /* *****************************************************************************
  createButtonAndAddToPage
  ******************************************************************************/
  async function createButtonAndAddToPage() {
    const bulkRenameBtn = document.createElement("button");
    bulkRenameBtn.name = "singleFileNameButton";
    bulkRenameBtn.innerHTML = "Rename Single File";
    bulkRenameBtn.setAttribute(
      "style",
      "position: absolute; bottom: 64px; left: 15px; z-index: 5001;"
    );
    document.body.appendChild(bulkRenameBtn);

    //ADD CLICK EVENT LISTENER
    bulkRenameBtn.addEventListener("click", openAndEditAllDocs);
  }

  /* *****************************************************************************
  openAndEditAllDocs
  ******************************************************************************/
  async function openAndEditAllDocs() {
    for (let index = 0; index < DOCUMENT_LIST.length; index++) {
      await openDocAndEditDetails(DOCUMENT_LIST[index]);
    }
  }

  /* *****************************************************************************
  openDocAndEditDetails
  ******************************************************************************/
  async function openDocAndEditDetails(documentDetails) {
    //FIND oldDocName
    const oldDocName = documentDetails.oldDocName;
    //FIND EDIT BUTTON OF oldDocName
    // GET ALL ROWS
    const wholeRow = document.querySelectorAll('[role="row"]');

    // GET ALL EDIT BUTTONS
    const editDownloadViewBtns = document.querySelectorAll(
      ".edit-button.right-align"
    );

    const editBtns = [];
    for (let i = 0; i < editDownloadViewBtns.length; i++) {
      if (i % 3 === 0) {
        editBtns.push(editDownloadViewBtns[i]);
      }
    }

    const docNameArray = [];
    for (let i = 0; i < wholeRow.length; i++) {
      const singleRow = wholeRow[i]; // single row in table of documents
      const docName = singleRow.getElementsByClassName("document-name")[0]; // reads text of name in row
      let docInnerName = docName && docName.innerText;
      docNameArray.push(docInnerName);
    }

    let nameFound = false;

    //FOR EACH ROW; MATCH OLD DOC NAME TO KAREO NAME AND CLICK EDIT BUTTON
    for (let i = 0; i < wholeRow.length; i++) {
      const row = wholeRow[i]; // single row in table of documents
      const documentName = row.getElementsByClassName("document-name")[0]; // reads text of name in row

      let innerName = documentName && documentName.innerText;

      if (oldDocName === innerName) {
        nameFound = true;
        editBtns[i].click(); // click edit button for row
        await asyncTimeout(1500);
        continue;
      }
    } // end for loop

    if (!nameFound) {
      return;
    }

    await editDocDetails(documentDetails);
    await asyncTimeout(1500);

    // save and close modal
    const saveBtn = document.getElementById("cancel");
    saveBtn.click();
  }

  /* *****************************************************************************
  editDocDetails
  ******************************************************************************/
  function editDocDetails(documentDetails) {
    //EDIT DOCUMENT NAME
    const docForm = document.getElementById("document");
    const docName = docForm.name;
    docName.value = documentDetails.newDocName;

    //EDIT DOCUMENT LABEL
    const documentLabelInput = document.getElementsByTagName("select")[7];

    //FIND LIST OF LABEL OPTIONS
    const newLabel = documentDetails.newLabel;
    const labelOptions = document.getElementById("category.id").options;

    //LOOP THROUGH LIST OF OPTIONS; IF INNERTEXT MATCHES NEWLABEL VARIABLE;
    const myOption = Array.from(labelOptions).find(
      (labelOption) => labelOption.innerText === newLabel
    );

    // REPLACE LABEL WITH NEW LABEL VARIABLE
    documentLabelInput.value = myOption.value; // works

    //EDIT DOCUMENT STATUS
    let newStatus = "Processed";
    let statusInput = document.getElementsByTagName("select")[8];
    let statusOptions = document
      .getElementById("documentStatus")
      .getElementsByTagName("option");
    let myStatusOption = Array.from(statusOptions).find(
      (statusOption) => statusOption.innerText === newStatus
    );
    statusInput.value = myStatusOption.value;

    //EDIT DOCUMENT DATE
    const dateInput = document.getElementsByName("documentDate")[1];
    dateInput.value = documentDetails.newDate;
  } // END editDocDetails function
})(); // end script
