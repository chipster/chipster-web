/**
 *
 * Created by klemela on 8/26/15.
 */

ChipsterClient.prototype.SESSION_DB = "session-db";
ChipsterClient.prototype.SESSION_DB_EVENTS = "session-db-events";
ChipsterClient.prototype.AUTHENTICATION_SERVICE = "authentication-service";

function ChipsterClient (serviceLocatorUri, username, password) {
    this.serviceLocatorUri = serviceLocatorUri;
    this.username = username;
    this.password = password;
    this.token = null;
    this.webSocket = null;
    this.serviceCache = {};
}

ChipsterClient.prototype.httpRequest = function (method, uri, body, username, password, callback, onerror, name) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                callback(xhr);
            } else {
                if (onerror) {
                    onerror(name, xhr.status, xhr.statusText, method, uri);
                }
            }
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

ChipsterClient.prototype.getServices = function (type, callback, onerror) {
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
        }.bind(this), onerror, "service locator");
    }
};

ChipsterClient.prototype.getToken = function (callback, onerror) {
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
            }.bind(this), onerror, "authentication service");
        }.bind(this), onerror);
    }
};

ChipsterClient.prototype.sessionStorage = function (method, path, body, callback, onerror) {
    this.getServices(this.SESSION_DB, function (services) {
        this.getToken(function (token) {
            //TODO try others if this fails
            var uri = services[0].uri + "sessions/" + path;
            this.httpRequest(method, uri, body, "token", token.tokenKey, function (xhr) {
                this.handleResponse(method, xhr, callback);
            }.bind(this), onerror, "session-db");
        }.bind(this), onerror);
    }.bind(this), onerror);
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

ChipsterClient.prototype.setSessionEventListener = function (sessionId, callback, onerror, onopen) {

    this.getServices(this.SESSION_DB_EVENTS, function (services) {
        this.getToken(function (token) {
            if (this.webSocket) {
                this.webSocket.close();
            }

            //TODO try others if this fails
            var uri = services[0].uri + "events/" + sessionId + "?token=" + token.tokenKey;
            this.webSocket = new WebSocket(uri);
            this.webSocket.onopen = function () {
                if (onopen) {
                    onopen();
                }
            };
            this.webSocket.onerror = function (e) {
                console.log("websocket error " + JSON.stringify(e));
                if (onerror) {
                    // There doesn't seeem to be any information of what kind of
                    // error happened
                    onerror("session-db event connection", null, "error", null);
                }
            }.bind(this);
            this.webSocket.onclose = function (e) {
                if (onerror) {
                    if (e.wasClean) {
                        onerror("session-db is", null, "shutting down (" + e.code + ", " + e.reason + ")", null);
                    } else {
                        onerror("session-db event connection", null, "closed (" + e.code + ", " + e.reason + ")", null);
                    }
                }
            }.bind(this);

            this.webSocket.onmessage = function (e) {
                var event = JSON.parse(e.data);
                callback(event);
            };

        }.bind(this));
    }.bind(this));
};

ChipsterClient.prototype.closeSessionEventListener = function () {
    if (this.webSocket) {
        this.webSocket.close();
    }
};

// Sessions

ChipsterClient.prototype.getSessions = function (callback, onerror) {
    this.sessionStorage("GET", "", null, callback, onerror);
};

ChipsterClient.prototype.getSession = function (sessionId, callback, onerror) {
    this.sessionStorage("GET", sessionId, null, callback, onerror);
};

ChipsterClient.prototype.postSession = function (json, callback, onerror) {
    this.sessionStorage("POST", "", json, callback, onerror);
};

ChipsterClient.prototype.putSession = function (sessionId, json, callback, onerror) {
    this.sessionStorage("PUT", sessionId, json, callback, onerror);
};

ChipsterClient.prototype.deleteSession = function (sessionId, callback, onerror) {
    this.sessionStorage("DELETE", sessionId, null, callback, onerror);
};

// Datasets

ChipsterClient.prototype.getDatasets = function (sessionId, callback, onerror) {
    this.sessionStorage("GET", sessionId + "/datasets", null, callback, onerror);
};

ChipsterClient.prototype.getDataset = function (sessionId, datasetId, callback, onerror) {
    this.sessionStorage("GET", sessionId + "/datasets/" + datasetId, null, callback, onerror);
};

ChipsterClient.prototype.postDataset = function (sessionId, json, callback, onerror) {
    this.sessionStorage("POST", sessionId + "/datasets/", json, callback, onerror);
};

ChipsterClient.prototype.putDataset = function (sessionId, datasetId, json, callback, onerror) {
    this.sessionStorage("PUT", sessionId + "/datasets/" + datasetId, json, callback, onerror);
};

ChipsterClient.prototype.deleteDataset = function (sessionId, datasetId, callback, onerror) {
    this.sessionStorage("DELETE", sessionId + "/datasets/" + datasetId, null, callback, onerror);
};

// Jobs

ChipsterClient.prototype.getJobs = function (sessionId, callback, onerror) {
    this.sessionStorage("GET", sessionId + "/jobs/", null, callback, onerror);
};

ChipsterClient.prototype.getJob = function (sessionId, jobId, callback, onerror) {
    this.sessionStorage("GET", sessionId + "/jobs/" + jobId, null, callback, onerror);
};

ChipsterClient.prototype.postJob = function (sessionId, json, callback, onerror) {
    this.sessionStorage("POST", sessionId + "/jobs/", json, callback, onerror);
};

ChipsterClient.prototype.putJob = function (sessionId, jobId, json, callback, onerror) {
    this.sessionStorage("PUT", sessionId + "/jobs/" + jobId, json, callback, onerror);
};

ChipsterClient.prototype.deleteJob = function (sessionId, jobId, callback, onerror) {
    this.sessionStorage("DELETE", sessionId + "/jobs/" + jobId, null, callback, onerror);
};
