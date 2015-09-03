/**
 * Created by klemela on 8/26/15.
 */

ChipsterClient.prototype.SESSION_STORAGE = "session-storage";
ChipsterClient.prototype.AUTHENTICATION_SERVICE = "authentication-service";

function ChipsterClient (serviceLocatorUri, username, password) {
    this.serviceLocatorUri = serviceLocatorUri;
    this.username = username;
    this.password = password;
    this.token = null;
    this.eventSource = null;
    this.serviceCache = {};
}

ChipsterClient.prototype.httpRequest = function (method, uri, body, username, password, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 300) {
            callback(xhr);
        }
    };
    if (username) {
        xhr.withCredentials = "true";
    }
    xhr.open(method, uri, true); // true for asynchronous
    //xmlHttp.open("POST", theUrl, true, username, password); // doesn't work in firefox
    if (username) {
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password));
    }
    if (body) {
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    }
    xhr.send(body);
};

ChipsterClient.prototype.getServices = function (type, callback) {
    if (this.serviceCache[type]) {
        callback(this.serviceCache[type]);
    } else {
        this.httpRequest("GET", this.serviceLocatorUri + "/services", null, null, null, function (response) {
            var services = JSON.parse(response.responseText);
            var filtered = services.filter(function (service) {
                return service.role === type;
            });
            this.serviceCache[type] = filtered;
            callback(filtered);
        }.bind(this));
    }
};

ChipsterClient.prototype.getToken = function (callback) {
    console.log(this.token + typeof this.token);
    if (this.token) {
        callback(this.token);
    } else {
        this.getServices(this.AUTHENTICATION_SERVICE, function (auths) {
            //TODO try others auths if this fails
            var uri = auths[0].uri;
            this.httpRequest("POST", uri + "tokens", null, this.username, this.password, function (xhr) {
                this.token = JSON.parse(xhr.responseText);
                this.username = null;
                this.password = null;
                callback(this.token);
            }.bind(this));
        }.bind(this));
    }
};

ChipsterClient.prototype.sessionStorage = function (method, path, body, callback) {
    this.getServices(this.SESSION_STORAGE, function (services) {
        this.getToken(function (token) {
            //TODO try others if this fails
            var uri = services[0].uri + "sessions/" + path;
            this.httpRequest(method, uri, body, "token", token.tokenKey, function (xhr) {
                this.handleResponse(method, xhr, callback);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

ChipsterClient.prototype.getLocation = function (xhr) {
    return xhr.getResponseHeader("location");
};

ChipsterClient.prototype.basename = function (str) {
    return str.substr(str.lastIndexOf("/") + 1);
};

ChipsterClient.prototype.handleResponse = function (method, xhr, callback) {
    if (callback) {
        switch (method) {
            case "GET":
                callback(JSON.parse(xhr.responseText));
                break;
            case "POST":
                callback(this.basename(this.getLocation(xhr)));
                break;
            default:
                callback(xhr);
        }
    }
};

// Events

ChipsterClient.prototype.setSessionEventListener = function (sessionId, callback) {
    if (!!window.EventSource) {
        this.getToken(function (token) {
            if (this.eventSource) {
                this.eventSource.close();
            }
            this.eventSource = new EventSource("http://localhost:8080/sessionstorage/sessions/" + sessionId + "/events?token=" + token.tokenKey);
            this.eventSource.addEventListener("SessionEvent", function (e) {
                var event = JSON.parse(e.data);
                callback(event);
            });
            this.eventSource.addEventListener("open", function (e) {
                //console.log("Event connection is open");
            });
            this.eventSource.addEventListener("error", function (e) {
                if (e.readyState === EventSource.CLOSED) {
                    console.log("Event connection closed");
                } else {
                    // There seeems to be no more information what kind of
                    // error happened
                    console.log("Event connection error");
                }
            }.bind(this));
        }.bind(this));
    } else {
        throw "EventSourceNotAvailable";
    }
};

ChipsterClient.prototype.closeSessionEventListener = function () {
    if (!!window.EventSource) {
        if (this.eventSource) {
            this.eventSource.close();
        }
    } else {
        throw "EventSourceNotAvailable";
    }
};

// Sessions

ChipsterClient.prototype.getSessions = function (callback) {
    this.sessionStorage("GET", "", null, callback);
};

ChipsterClient.prototype.getSession = function (sessionId, callback) {
    this.sessionStorage("GET", sessionId, null, callback);
};

ChipsterClient.prototype.postSession = function (json, callback) {
    this.sessionStorage("POST", "", json, callback);
};

ChipsterClient.prototype.putSession = function (sessionId, json, callback) {
    this.sessionStorage("PUT", sessionId, json, callback);
};

ChipsterClient.prototype.deleteSession = function (sessionId, callback) {
    this.sessionStorage("DELETE", sessionId, null, callback);
};

// Datasets

ChipsterClient.prototype.getDatasets = function (sessionId, callback) {
    this.sessionStorage("GET", sessionId + "/datasets", null, callback);
};

ChipsterClient.prototype.getDataset = function (sessionId, datasetId, callback) {
    this.sessionStorage("GET", sessionId + "/datasets/" + datasetId, null, callback);
};

ChipsterClient.prototype.postDataset = function (sessionId, json, callback) {
    this.sessionStorage("POST", sessionId + "/datasets/", json, callback);
};

ChipsterClient.prototype.putDataset = function (sessionId, datasetId, json, callback) {
    this.sessionStorage("PUT", sessionId + "/datasets/" + datasetId, json, callback);
};

ChipsterClient.prototype.deleteDataset = function (sessionId, datasetId, callback) {
    this.sessionStorage("DELETE", sessionId + "/datasets/" + datasetId, null, callback);
};

// Jobs

ChipsterClient.prototype.getJobs = function (sessionId, callback) {
    this.sessionStorage("GET", sessionId + "/jobs/", null, callback);
};

ChipsterClient.prototype.getJob = function (sessionId, jobId, callback) {
    this.sessionStorage("GET", sessionId + "/jobs/" + jobId, null, callback);
};

ChipsterClient.prototype.postJob = function (sessionId, json, callback) {
    this.sessionStorage("POST", sessionId + "/jobs/", json, callback);
};

ChipsterClient.prototype.putJob = function (sessionId, jobId, json, callback) {
    this.sessionStorage("PUT", sessionId + "/jobs/" + jobId, json, callback);
};

ChipsterClient.prototype.deleteJob = function (sessionId, jobId, callback) {
    this.sessionStorage("DELETE", sessionId + "/jobs/" + jobId, null, callback);
};
