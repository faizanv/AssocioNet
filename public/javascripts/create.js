var associoCreate = angular.module('associoCreate', []);

function mainController($http) {
  this.formData = {};

  function activate() {
    $http.post('/create').success(function (data) {
      console.log(data);
    });
  }

  this.addMove = function() {
    console.log("Add move!");
  }
  
  this.deleteMove = function() {
    console.log("Delete move!");
  }

  activate();
}

associoCreate.controller('mainController', ['$http', mainController]);