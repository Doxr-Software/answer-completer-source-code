/* 

This message goes out to the general public: 

Original source code comes from:

http:[forwardslash][forwardslash]github[dot]com[forwardslash]ading2210[forwardslash]edpuzzle-answers[forwardslash]

original source code by ading2210

Modified source code is in this file. Licensed under the GNU GPL v3.

> This message goes out to ading2210:
> look man I gave you credits and stuff 
> yes the script is going to be used in proprietary software but the segment that comes from your repo has been open sourced and credited
> I followed the GNU license like the main repo said but i feel like yur the type of person to dmca it anyways
> if you DMCA I will fight you in court
> source and stuff has been disclosed in the actual proprietary 

*/

function http_get(url, callback, headers = [], method = "GET", content = null) {
    var request = new XMLHttpRequest();
    request.addEventListener("load", callback);
    request.open(method, url, true);
  
    if (window.__EDPUZZLE_DATA__ && window.__EDPUZZLE_DATA__.token) {
      headers.push(["authorization", window.__EDPUZZLE_DATA__.token]);
    }
    for (const header of headers) {
      request.setRequestHeader(header[0], header[1]);
    }
    request.send(content);
  }
  
  function getCSRF() {
    var csrfURL = "https://edpuzzle.com/api/v3/csrf";
    http_get(csrfURL, function(){
      var data = JSON.parse(this.responseText);
      var csrf = data.CSRFToken;
      console.log("csrf: " + csrf)
      getAttempt(csrf, document.assignment);
    });
  }
  
  function getAttempt(csrf, assignment) {
    var id = assignment.teacherAssignments[0]._id;
    var attemptURL = "https://edpuzzle.com/api/v3/assignments/"+id+"/attempt";
    http_get(attemptURL, function(){
      var data = JSON.parse(this.responseText);
      skipVideo(csrf, data);
    });
  }
  
  function skipVideo(csrf, attempt) {
    var id = attempt._id;
    var teacher_assignment_id = attempt.teacherAssignmentId;
    var referrer = "https://edpuzzle.com/assignments/"+teacher_assignment_id+"/watch";;
    var url2 = "https://edpuzzle.com/api/v4/media_attempts/"+id+"/watch";
  
    var content = {"timeIntervalNumber": 10};
    var headers = [
      ['accept', 'application/json, text/plain, */*'],
      ['accept_language', 'en-US,en;q=0.9'],
      ['content-type', 'application/json'],
      ['x-csrf-token', csrf],
      ['x-edpuzzle-referrer', referrer],
      ['x-edpuzzle-web-version', window.__EDPUZZLE_DATA__.version]
    ];
    
    http_get(url2, function(){
      var attemptId = attempt._id;
      var filteredQuestions = [];
      
      for (let i=0; i< document.questions.length; i++) {
        let question = document.questions[i];
        if (question.type != "multiple-choice") {continue;}
        
        if (filteredQuestions.length == 0) {
          filteredQuestions.push([question]);
        }
        else if (filteredQuestions[filteredQuestions.length-1][0].time == question.time) {
          filteredQuestions[filteredQuestions.length-1].push(question);
        }
        else {
          filteredQuestions.push([question]);
        }
      }
      
      if (filteredQuestions.length > 0) {
        var total = filteredQuestions.length;
        postAnswers(csrf, document.assignment, filteredQuestions, attemptId, total);
      }
    }, headers, "POST", JSON.stringify(content));
  }
  
  function postAnswers(csrf, assignment, remainingQuestions, attemptId, total) {
    var id = assignment.teacherAssignments[0]._id;
    var referrer = "https://edpuzzle.com/assignments/"+id+"/watch";
    var answersURL = "https://edpuzzle.com/api/v3/attempts/"+attemptId+"/answers";
  
    var content = {answers: []};
    var now = new Date().toISOString();
    var questionsPart = remainingQuestions.shift();
    for (let i=0; i<questionsPart.length; i++) {
      let question = questionsPart[i];
      let correctChoices = [];
      for (let j=0; j<question.choices.length; j++) {
        let choice = question.choices[j];
        if (choice.isCorrect) {
          correctChoices.push(choice._id)
        }
      }
      content.answers.push({
        "questionId": question._id,
        "choices": correctChoices,
        "type": "multiple-choice",
      });
    }
    
    var headers = [
      ['accept', 'application/json, text/plain, */*'],
      ['accept_language', 'en-US,en;q=0.9'],
      ['content-type', 'application/json'],
      ['x-csrf-token', csrf],
      ['x-edpuzzle-referrer', referrer],
      ['x-edpuzzle-web-version', window.__EDPUZZLE_DATA__.version]
    ];
    http_get(answersURL, function() {
      if (remainingQuestions.length == 0) {
        window.location.reload();
      }
      else {
        postAnswers(csrf, assignment, remainingQuestions, attemptId, total);
      }
    }, headers, "POST", JSON.stringify(content));
  }
  
  var assignment_id = window.location.href.split("/")[4];
  if (typeof assignment_id === "undefined") {
    alert("Error: Could not infer the assignment ID. Are you on the correct URL?");
  }
  var url1 = "https://edpuzzle.com/api/v3/assignments/"+assignment_id;
  
  http_get(url1, function(){
    var assignment = JSON.parse(this.responseText);
    if ((""+this.status)[0] == "2") {
      document.assignment = assignment;
      console.log(document.assignment)
      var media_id = assignment.teacherAssignments[0].contentId;
  
      var url2 = `https://edpuzzle.com/api/v3/media/${media_id}`;
    
      fetch(url2, {credentials: "omit"})
        .then(response => response.json())
        .then(data => {
              console.log("grabbed questions successfully")
              document.questions = data.questions;
              getCSRF();
        })
    }
  }, ["Content-Type", "application/json"]);
  