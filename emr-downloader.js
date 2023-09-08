// ==UserScript==
// @name         EMR migration
// @namespace    ibrunner
// @version      0.4
// @description  select user info for export
// @author       Ian Brunner
// @match        https://portal.care360.com/*
// @grant        none

/*
 ** Installation:
 ** - Install "Tampermonkey" browser extension
 ** - Select "Create New Script" from Tampermonkey menu
 ** - A new tab will open, Paste code into script and save (ctrl+s)
 ** - Refresh Care360 page to see updates
 **
 ** Updating:
 ** - Select "Dashboard" from Tampermonkey menu, a new tab will open
 ** - Click "EMR migration" in the "name" column of the "scripts" table
 ** - Paste code into script and save (ctrl+s)
 ** - Refresh Care360 page to see updates
 **
 ** Usage:
 **  Shortcuts:
 **    - CTRL+ALT+G: export all accounts from patient list
 **    - CTRL+/: export currently selected patient
 **    - CTRL+Space: interrupt save delay and load next patient
 **  Updating Patient List:
 **    - Paste Ids below between brackets of "patientIds" variable
 **    - note: ids must be in quotes and separated by commas
 **
 **  Release Notes:
 **    0.4
 **      - re-run errors after completion
 **      - display errors in copyable format
 **    0.3
 **      - paginate to correct result
 **      - search for ID in results table when there are multiple results
 **      - updated hotkeys
 **    0.2
 **      - skip patients with no data
 **      - close user modal before searching
 **      - interrupt save delay
 **    0.1
 **      - initial release
 **      - export lists and individual users
 */

// ==/UserScript==
const patientIds = ["11"];

(function () {
  "use strict";
  console.log("EMR migration userscript running");
  // let isWorking = false;
  const somePatientId = "2557";
  const saveDelay = 30000;

  let errorPatients = [];

  function closeModal() {
    const closeButton = document.querySelectorAll(
      'img[data-ta="closeXIcon"]'
    )[0];
    closeButton && closeButton.click();
  }

  async function interruptableTimeout(callback) {
    console.log("interruptableTimeout");

    return new Promise((resolve, reject) => {
      var timer = setInterval(callback(clearAndResolve), 100);

      function clearAndResolve() {
        clearInterval(timer);
        resolve();
      }

      function clearAndReject() {
        clearInterval(timer);
        reject();
      }

      var timeout = setTimeout(clearAndReject, 20000);

      // key combo to reject and skip step
      function interrupt(e) {
        console.log("interrupt");
        if (e.ctrlKey && e.keyCode == 68) {
          document.removeEventListener("keydown", interrupt, false);
          clearTimeout(timeout);
          clearAndReject();
        }
      }
      document.addEventListener("keydown", interrupt, false);
    });
  }

  async function exportPatients(patientIds) {
    for (var i = 0; i < patientIds.length; i++) {
      console.log("=======================");
      console.log("patientId:", patientIds[i]);
      console.log("=======================");
      try {
        await exportPatient(patientIds[i]);
      } catch (error) {
        errorPatients.push(patientIds[i]);
        console.error("error on patient", patientIds[i]);
      }
    }
    console.log("done");

    if (errorPatients[0]) {
      const errorList = errorPatients
        .map((patient) => `"${patient}"`)
        .toString();
      showErrorModal(errorPatients);
      errorPatients = [];
    } else {
      alert("finished");
    }
  }

  function showErrorModal(errorPatients) {
    const errorList = errorPatients.map((patient) => `"${patient}"`).toString();

    function handleContinueButton() {
      console.log("continue click");
      exportPatients(errorPatients);
      document.getElementById("error-modal").remove();
    }

    function handleCloseButton() {
      console.log("close click");
      document.getElementById("error-modal").remove();
    }

    let modal = document.createElement("div");
    modal.setAttribute("id", "error-modal");
    modal.setAttribute(
      "style",
      "position: absolute; z-index: 1000; width: 100%; height: 100%; top: 0; background-color: rgba(0,0,0,0.3); display: flex; justify-content: center;"
    );

    let modalErrors = document.createElement("div");
    modalErrors.innerHTML = `finished with errors: ${errorList}`;

    let continueButton = document.createElement("button");
    continueButton.setAttribute("id", "rerun-errors-button");
    continueButton.innerHTML = "Re-run error list";

    let closeButton = document.createElement("button");
    closeButton.setAttribute("id", "errors-close-button");
    closeButton.innerHTML = "Cancel";

    let modalContent = document.createElement("div");
    modalContent.setAttribute("id", "error-modal-content");
    modalContent.setAttribute(
      "style",
      "border: 2px solid #0B4D2A; box-shadow: 4px 4px 10px #2a2a2a; width: 20%; padding: 20px; height: fit-content; margin-top: 50px; background-color: #FFF"
    );

    modalContent.appendChild(modalErrors);
    modalContent.appendChild(continueButton);
    modalContent.appendChild(document.createTextNode(" or "));
    modalContent.appendChild(closeButton);

    modal.appendChild(modalContent);

    // add modal
    document.getElementsByTagName("body")[0].appendChild(modal);
    document
      .getElementById("rerun-errors-button")
      .addEventListener("click", handleContinueButton, false);
    document
      .getElementById("errors-close-button")
      .addEventListener("click", handleCloseButton, false);
  }

  async function getPatient(patientId) {
    console.log("getPatient");
    // search patient
    async function searchPatient(patientId) {
      return new Promise((resolve) => {
        // close modal if it's open
        closeModal();

        // search for patient
        document.getElementById("advanceSearchLink").click();

        // wait for advanced search modal
        setTimeout(function () {
          const patientIdInput = document.getElementById("inputPatientId");
          // console.log("patientIdInput", patientIdInput);
          patientIdInput.value = patientId;
          document.getElementById("searchButton").click();
          resolve();
        }, 100);
      });
    }

    // get users results table, click link
    async function getUserResult(patientId) {
      // console.log("getUserResult");

      return new Promise((resolve, reject) => {
        var timer = setInterval(getEl, 100);
        function getEl() {
          const searchResultsTable = document.getElementById(
            "patientSearchResultsTable"
          );
          const tableRows =
            searchResultsTable && searchResultsTable.getElementsByTagName("tr");
          const errorDivs = document.getElementsByClassName("errorText");

          if (errorDivs[0]) {
            console.log("error");
            console.error("Patient not found:", patientId);
            clearInterval(timer);
            reject();
          }

          if (searchResultsTable && tableRows && tableRows.length > 1) {
            //find correct page
            const pageLabel = document.getElementById("PageLabel");
            if (pageLabel) {
              const pageLabelTextContent = pageLabel.textContent;
              const numResultsString =
                pageLabelTextContent.split(" ")[
                  pageLabelTextContent.split(" ").length - 1
                ];
              const numResults = parseInt(
                numResultsString.replace(/\,/g, ""),
                10
              );
              const numPages = Math.ceil(parseInt(numResults, 10) / 10);

              for (var p = 0; p < numPages; p++) {
                //find correct row
                for (var r = 0; r < tableRows.length; r++) {
                  const row = tableRows[r];
                  const rowCols = row.getElementsByTagName("td");
                  if (rowCols && rowCols.length > 4) {
                    const id = rowCols[3].textContent;
                    if (id === patientId) {
                      const resultRowLinks =
                        row.getElementsByClassName("detailsLink");
                      const resultRowLink = resultRowLinks && resultRowLinks[0];

                      if (resultRowLink) {
                        resultRowLink.click();
                        clearInterval(timer);
                        resolve();
                        return;
                      }
                    }
                  }
                }
                // go to next page
                const nextPageButton = document
                  .getElementById("NextPage")
                  .getElementsByTagName("img")[0];
                nextPageButton.click();
              }
            }
          }
        }
      });
    }

    // get patient page
    async function getPatientPage() {
      console.log("getPatientPage");

      return new Promise((resolve, reject) => {
        var timer = setInterval(getEl, 100);

        function clearAndResolve() {
          clearInterval(timer);
          resolve();
        }

        function clearAndReject() {
          clearInterval(timer);
          reject();
        }

        var timeout = setTimeout(clearAndReject, 20000);

        // key combo to reject and skip step
        function interrupt(e) {
          console.log("interrupt");
          if (e.ctrlKey && e.keyCode == 68) {
            document.removeEventListener("keydown", interrupt, false);
            clearTimeout(timeout);
            clearAndReject();
          }
        }
        document.addEventListener("keydown", interrupt, false);
        function getEl() {
          const patientName = document.getElementById("patientName");
          if (patientName) {
            document.removeEventListener("keydown", interrupt, false);
            clearAndResolve();
          }
        }
      });
    }

    await searchPatient(patientId);
    await getUserResult(patientId);
    await getPatientPage();
  }

  // select all patient data for export
  async function selectPatientData() {
    console.log("selectPatientData");

    async function openExportModal() {
      console.log("openExportModal");
      return new Promise((resolve) => {
        const exportButton = document
          .getElementById("care360ToolBar")
          .getElementsByTagName("li")[3]
          .getElementsByTagName("img")[0];
        exportButton.click();
        var timer = setInterval(getEl, 100);
        function getEl() {
          const attachmentPickerForm = document.getElementById(
            "AttachmentPickerForm"
          );
          if (attachmentPickerForm) {
            const attachmentPickerTabs =
              attachmentPickerForm.getElementsByClassName(
                "attachmentPickerTab"
              );

            if (attachmentPickerTabs && attachmentPickerTabs[0]) {
              clearInterval(timer);
              resolve();
            }
          }

          const consentButton = document.querySelectorAll(
            'button[data-ta="exportCCDViewImpl_continueButton"]'
          );
          if (consentButton && consentButton[0]) {
            consentButton[0].click();
          }
        }
      });
    }

    async function selectAllTabData() {
      console.log("selectAllTabData");
      const attachmentPickerForm = document.getElementById(
        "AttachmentPickerForm"
      );
      const attachmentPickerTabs = attachmentPickerForm.getElementsByClassName(
        "attachmentPickerTab"
      )[0];
      const tabs = attachmentPickerTabs
        .getElementsByTagName("ul")[0]
        .getElementsByTagName("li");
      if (tabs && tabs.length) {
        for (var i = 0; i < tabs.length; i++) {
          const tab = tabs[i].getElementsByTagName("div")[0];
          selectTabData(tab);
        }
      }
    }

    async function selectTabData(tab) {
      tab.click();

      const table = document
        .getElementsByClassName("attachmentPickerTab")[0]
        .getElementsByTagName("table")[0];

      if (!table) {
        return null;
      }
      const checkBoxes = table.querySelectorAll('input[type="checkbox"]');

      if (checkBoxes && checkBoxes[0]) {
        for (var i = 0; i < checkBoxes.length; i++) {
          const checkBox = checkBoxes[i];
          checkBox.checked = true;
        }
      }
    }

    async function selectReason() {
      console.log("select reason");
      const reasonSelect = document.getElementById(
        "reasonForDisclosureListBox"
      );
      reasonSelect.value = "26";
    }

    async function enterPassword() {
      console.log("enter password");
      const pw = "Friday!13";
      document.getElementById("pwText").value = pw;
      document.getElementById("reEnterPwText").value = pw;
    }

    try {
      // await interruptableTimeout(async resolveAndClear => {
      // return new Promise(resolve => {
      await openExportModal();
      await selectAllTabData();
      await selectReason();
      await enterPassword();
      // resolveAndClear();
      // resolve();
      // });
      // });
    } catch (error) {
      console.log("selectPatientData catch");
      console.error(error);
    }
    await save();
  }

  async function save() {
    console.log("save");

    return new Promise((resolve, reject) => {
      const interruptSaveDelay = (e) => {
        if (e.ctrlKey && e.keyCode == 32) {
          console.log("interruptSaveDelay");
          document.removeEventListener("keydown", interruptSaveDelay, false);
          resolve();
        }
      };
      const saveButton = document.querySelectorAll(
        'button[data-ta="saveButton"]'
      )[0];
      saveButton.click();
      // check for continue modal
      setTimeout(function () {
        const continueButton = document.querySelectorAll(
          'button[data-ta="continueButton"]'
        );
        if (continueButton && continueButton[0]) {
          continueButton[0].click();
        }
      }, 100);

      // check for no patient data
      const saveErrorEl = document.getElementById("errorList");
      const saveErrorUl =
        saveErrorEl && saveErrorEl.getElementsByTagName("ul")[0];
      const saveErrorLi =
        saveErrorUl && saveErrorUl.getElementsByTagName("li")[0];
      const noDataErrorText =
        "No patient data available or selected to export.";
      if (saveErrorLi && saveErrorLi.textContent === noDataErrorText) {
        // close modal and reject
        closeModal();
        reject();
        return;
      }

      // key combo to resolve and skip delay
      document.addEventListener("keydown", interruptSaveDelay, false);

      // delay to allow files to save
      setTimeout(function () {
        document.removeEventListener("keydown", interruptSaveDelay, false);
        resolve();
      }, saveDelay);
    });
  }

  async function exportPatient(patientId) {
    await getPatient(patientId);
    await selectPatientData();
  }

  // hot key to initialize
  function docKeyDown(e) {
    // CTRL+ALT+G: export all accounts from patient list
    if (e.ctrlKey && e.altKey && e.keyCode == 71) {
      exportPatients(patientIds);
      // CTRL+/: export currently selected patient
    } else if (e.ctrlKey && e.keyCode == 191) {
      selectPatientData();
    }
    // } else if(e.ctrlKey && e.keyCode == 72){
    //    exportPatient(somePatientId);
  }

  document.addEventListener("keydown", docKeyDown, false);
})();
