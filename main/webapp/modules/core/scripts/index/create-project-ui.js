/*

Copyright 2011, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

 * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
 * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

Refine.CreateProjectUI = function(elmt) {
  var self = this;

  this._elmt = elmt;
  this._sourceSelectionUIs = [];
  this._customPanels = [];
  this._controllers = [];
  
  this._sourceSelectionElmt =
    $(DOM.loadHTML("core", "scripts/index/create-project-ui-source-selection.html")).appendTo(this._elmt);
  this._sourceSelectionElmts = DOM.bind(this._sourceSelectionElmt);
  
  this._progressPanel = this.addCustomPanel();
  this._progressPanel.html(DOM.loadHTML("core", "scripts/index/create-project-progress-panel.html"));
  
  this._errorPanel = this.addCustomPanel();
  this._errorPanel.html(DOM.loadHTML("core", "scripts/index/create-project-error-panel.html"));
  
  $('#or-create-question').text($.i18n('core-index-create/question'));
  $('#or-create-formats').text($.i18n('core-index-create/formats'));
  $('#or-create-from').text($.i18n('core-index-create/from'));
  
  $('#create-project-progress-cancel-button').text($.i18n('core-buttons/cancel'));
  $('#create-project-error-ok-button').html($.i18n('core-buttons/ok'));
  
  $.get(
    "command/core/get-importing-configuration",
    null,
    function(data) {
      Refine.importingConfig = data.config;
      self._initializeUI();
    },
    "json"
  );
};

Refine.CreateProjectUI.prototype.errorShown = false;

Refine.CreateProjectUI.controllers = [];

Refine.CreateProjectUI.prototype._initializeUI = function() {
  for (var i = 0; i < Refine.CreateProjectUI.controllers.length; i++) {
    this._controllers.push(new Refine.CreateProjectUI.controllers[i](this));
  }
};

Refine.CreateProjectUI.prototype.addSourceSelectionUI = function(sourceSelectionUI) {
  var self = this;

  var headerContainer = $('#create-project-ui-source-selection-tabs');
  var bodyContainer = $('#create-project-ui-source-selection-tab-bodies');

  sourceSelectionUI._divBody = $('<div>')
  .addClass('create-project-ui-source-selection-tab-body')
  .appendTo(bodyContainer)
  .hide();

  sourceSelectionUI._divHeader = $('<a>')
  .addClass('create-project-ui-source-selection-tab')
  .text(sourceSelectionUI.label)
  .attr('href', 'javascript:void(0);')
  .appendTo(headerContainer)
  .on('click',function() { self.selectImportSource(sourceSelectionUI.id); });

  sourceSelectionUI.ui.attachUI(sourceSelectionUI._divBody);

  this._sourceSelectionUIs.push(sourceSelectionUI);

  if (this._sourceSelectionUIs.length == 1) {
    self.selectImportSource(sourceSelectionUI.id);
  }
};

Refine.CreateProjectUI.prototype.selectImportSource = function(id) {
  for (var i = 0; i < this._sourceSelectionUIs.length; i++) {
    var sourceSelectionUI = this._sourceSelectionUIs[i];
    if (sourceSelectionUI.id == id) {
      $('.create-project-ui-source-selection-tab-body').removeClass('selected').hide();
      $('.create-project-ui-source-selection-tab').removeClass('selected');

      sourceSelectionUI._divBody.addClass('selected').show();
      sourceSelectionUI._divHeader.addClass('selected');

      sourceSelectionUI.ui.focus();

      break;
    }
  }
};

Refine.CreateProjectUI.prototype.addCustomPanel = function() {
  var div = $('<div>')
  .addClass('create-project-ui-panel')
  .appendTo(this._elmt);

  var innerDiv = $('<div>')
  .addClass('relative-frame')
  .appendTo(div);

  this._customPanels.push(div);

  return innerDiv;
};

Refine.CreateProjectUI.prototype.showCustomPanel = function(div) {
  var parent = div.parent();
  for (var i = 0; i < this._customPanels.length; i++) {
    var panel = this._customPanels[i];
    if (panel[0] === parent[0]) {
      $('.create-project-ui-panel').css('visibility', 'hidden');
      this._sourceSelectionElmt.css('visibility', 'hidden');
      panel.css('visibility', 'visible');
      break;
    }
  }
};

Refine.CreateProjectUI.prototype.showSourceSelectionPanel = function() {
  $('.create-project-ui-panel').css('visibility', 'hidden');
  this._sourceSelectionElmt.css('visibility', 'visible');
};

Refine.actionAreas.push({
  id: "create-project",
  label: $.i18n('core-index-create/create-proj'),
  uiClass: Refine.CreateProjectUI
});

Refine.CreateProjectUI.prototype.showImportProgressPanel = function(progressMessage, onCancel) {
  var self = this;

  this.showCustomPanel(this._progressPanel);

  $('#create-project-progress-message').text(progressMessage);
  $('#create-project-progress-bar-body').css("width", "0%");
  $('#create-project-progress-message-left').text($.i18n('core-index-create/starting'));
  $('#create-project-progress-message-center').empty();
  $('#create-project-progress-message-right').empty();
  $('#create-project-progress-timing').empty();

  $('#create-project-progress-cancel-button').off().on('click',onCancel);
};

Refine.CreateProjectUI.prototype.pollImportJob = function(start, jobID, timerID, checkDone, callback, onError) {
  var self = this;

  $.post(
    "command/core/get-importing-job-status?" + $.param({ "jobID": jobID }),
    null,
    function(data) {
      if (!data) {
        self.showImportJobError("Unknown error");
        window.clearInterval(timerID);
        return;
      }

      if (data.code === "error" || !("job" in data)) {
        self.showImportJobError(data.message || "Unknown error");
        window.clearInterval(timerID);
        return;
      }

      var job = data.job;
      if (job.config.state === "error") {
        // Prevent triggering multiple error dialogs
        if (!self.errorShown) {
          onError(job); // Only trigger onError if no error dialog is shown
        }
        window.clearInterval(timerID);
      } else if (checkDone(job)) {
        $('#create-project-progress-message').text($.i18n('core-index-create/done'));
        window.clearInterval(timerID);
        if (callback) {
          callback(jobID, job);
        }
      }
    },
    "json"
  );
};

Refine.CreateProjectUI.prototype.showImportJobError = function(message, stack) {
  var self = this;

  // Check if an error dialog is already displayed
  if (this.errorShown) {
    console.log("An error dialog is already displayed. Ignoring duplicate error.");
    return;
  }

  // Set the flag to indicate an error is shown
  this.errorShown = true;

  // Populate the error message and show the dialog
  $('#create-project-error-message').text(message);
  $('#create-project-error-stack').text(stack || $.i18n('core-index-create/no-details'));
  this.showCustomPanel(this._errorPanel);

  // Bind "OK" button to hide the error dialog
  $('#create-project-error-ok-button').off().on('click', function () {
    // Log for debugging to confirm the button was clicked
    console.log("OK button clicked");

    // Hide the source selection panel (assumes this function works correctly)
    self.showSourceSelectionPanel();

    // Log the current visibility and display status of the error panel
    console.log("Before hiding visibility:", $('#create-project-error-panel').css('visibility'));
    console.log("Before hiding display:", $('#create-project-error-panel').css('display'));

    // Explicitly hide the error panel using CSS
    $('#create-project-error-panel').css({
        'visibility': 'hidden',
        'display': 'none', // Ensures it doesn't take up space
        'opacity': '0'     // Smooth transition if desired
    });

    // Log the updated visibility and display status
    console.log("After hiding visibility:", $('#create-project-error-panel').css('visibility'));
    console.log("After hiding display:", $('#create-project-error-panel').css('display'));

    // Optional: Completely remove the error panel from the DOM if it's no longer needed
    // $('#create-project-error-panel').remove();
});
};

Refine.CreateProjectUI.composeErrorMessage = function(job) {
  var messages = [];
  $.each(job.config.errors, function() { 
	messages.push(this.message); 
  });
  return messages.join('\n');
};

Refine.CreateProjectUI.cancelImportingJob = function(jobID) {
  Refine.wrapCSRF(function(token) {
     $.post("command/core/cancel-importing-job?" + $.param({ "jobID": jobID }),
           {csrf_token: token});
  });
};
