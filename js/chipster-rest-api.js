/**
 *
 * Created by klemela on 8/26/15.
 */

ChipsterClient.prototype.SESSION_DB = "session-db";
ChipsterClient.prototype.SESSION_DB_EVENTS = "session-db-events";
ChipsterClient.prototype.AUTHENTICATION_SERVICE = "authentication-service";

function ChipsterClient (proxyUri, username, password) {
    this.proxyUri = proxyUri;
    this.username = username;
    this.password = password;
    this.token = null;
    this.webSocket = null;
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

ChipsterClient.prototype.getService = function (type, callback) {

    if (type == this.SESSION_DB) {
        callback(this.proxyUri + "/sessiondb/");
    }
    if (type == this.SESSION_DB_EVENTS) {
        callback(this.proxyUri.replace("http://", "ws://") + "/sessiondbevents/");
    }
    if (type == this.AUTHENTICATION_SERVICE) {
        callback(this.proxyUri + "/auth/");
    }
};

ChipsterClient.prototype.getToken = function (callback, onerror) {
    if (this.token) {
        callback(this.token);
    } else {
        this.getService(this.AUTHENTICATION_SERVICE, function (service) {
            this.httpRequest("POST", service + "tokens", null, this.username, this.password, function (xhr) {
                this.token = JSON.parse(xhr.responseText);
                this.username = null;
                this.password = null;
                callback(this.token);
            }.bind(this), onerror, "authentication service");
        }.bind(this), onerror);
    }
};

ChipsterClient.prototype.sessionStorage = function (method, path, body, callback, onerror) {
    this.getService(this.SESSION_DB, function (service) {
        this.getToken(function (token) {
            var uri = service + "sessions/" + path;
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

    this.getService(this.SESSION_DB_EVENTS, function (service) {
        this.getToken(function (token) {
            if (this.webSocket) {
                this.webSocket.close();
            }

            var uri = service + "events/" + sessionId + "?token=" + token.tokenKey;
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
                        onerror("session-db event connection", null, "closed cleanly (" + e.code + ", " + e.reason + ")", null);
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

ChipsterClient.prototype.updateSessions = function (callback, onerror) {
    this.sessionStorage("GET", "", null, callback, onerror);
};

ChipsterClient.prototype.getSession = function (sessionId, callback, onerror) {
    this.sessionStorage("GET", sessionId, null, callback, onerror);
};

ChipsterClient.prototype.postSession = function (json, callback, onerror) {
    this.sessionStorage("POST", "", json, callback, onerror);
};

ChipsterClient.prototype.sessionToPut = function (sessionId, json, callback, onerror) {
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
