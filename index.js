const axios = require('axios')

function neonCRM (auth) {
  this.sessionId = null;
  this.auth = auth || {apiKey: null, orgId: null}
  this._baseURL = 'https://api.neoncrm.com/neonws/services/api/'
}

// create methods on the prototype

neonCRM.prototype.api = function (req) {
  return axios.post(this._baseURL + req.method, req.parameters)
}

neonCRM.prototype.setSession = function (sessionId) {
  this.sessionId = sessionId
}

neonCRM.prototype.getSession = function () {
  return this.sessionId
}
// parseListRequest

// login
neonCRM.prototype.login = function () {
  let self = this
  return new Promise(function (resolve, reject) {
    if(self.auth.orgId && self.auth.apiKey) {
      let req = {
        method: 'common/login',
        parameters: '&login.apiKey=' + self.auth.apiKey + '&login.orgid=' + self.auth.orgId
      }
      self.api(req)
        .then(function (response) {
          if(response.data.loginResponse.operationResult === 'SUCCESS') {
            self.setSession(response.data.loginResponse.userSessionId)
            resolve(response.data.loginResponse.responseMessage)
          }
          else {
            reject(response.data.loginResponse.errors)
          }
        })
        .catch(function (error) {
          reject(error);
        })
    }
    else {
      reject('Incomplete credentials');
    }
  })
}
// go
// search
neonCRM.prototype.search = function (req) {
  let standard = '',
    custom = '',
    criteria = '',
    paging = '',
    self = this

  return new Promise(function (resolve, reject) {
    if(req.hasOwnProperty('method') && req.method !== '') {
      // build our parameter strings

      // what standard fields will we display?
      if (req.hasOwnProperty('columns') && req.columns.hasOwnProperty('standardFields')) {
        req.columns.standardFields.forEach(function (field) {
          standard += '&outputfields.idnamepair.id=&outputfields.idnamepair.name=' + field.replace(' ', '%20')
        })
      }
      // what custom fields will we display?
      if (req.hasOwnProperty('columns') && req.columns.hasOwnProperty('customFields')) {
        req.columns.customFields.forEach(function (field) {
          standard += '&outputfields.idnamepair.name=&outputfields.idnamepair.id=' + field.replace(' ', '%20')
        })
      }
      // what criteria will we apply?
      if (req.hasOwnProperty('criteria')) {
        req.criteria.forEach(function (criterion) {
          criteria += '&searches.search.key=' + criterion[0] + '&searches.search.searchOperator=' + criterion[1] + '&searches.search.value=' + criterion[2]
        })
        criteria = (criteria) ? criteria.replace(' ', '%20') : null;
      }
      // paging && sorting
      if (req.hasOwnProperty('page')) {
        // paging
        if (req.page.hasOwnProperty('currentPage')) {
          paging += '&page.currentPage=' + req.page.currentPage
        }
        if (req.page.hasOwnProperty('pageSize')) {
          paging += '&page.pageSize=' + req.page.pageSize
        }
        // sorting
        if (req.page.hasOwnProperty('sortColumn')) {
          paging += '&page.sortColumn=' + req.page.sortColumn
        }
        if (req.page.hasOwnProperty('sortDirection')) {
          paging += '&page.sortDirection=' + req.page.sortDirection
        }
      }

      req.parameters = 'responseType=json&userSessionId=' + self.getSession() + criteria + standard + custom + paging
      
      self.api(req)
        .then(function (response) {
          var data = response.data[req.method.split('/')[1] + 'Response']
          if(data.operationResult === 'SUCCESS') {
            resolve(data)
          }
          else {
            reject(data.errors)
          }
        })
        .catch(function (error) {
          reject(error);
          console.log(error)
        })

    }
    else {
      reject('No mthod supplied')
    }
  })
}

module.exports = neonCRM
