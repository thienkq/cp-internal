"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerClient = exports.createBrowserClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "createBrowserClient", { enumerable: true, get: function () { return client_1.createClient; } });
var server_1 = require("./server");
Object.defineProperty(exports, "createServerClient", { enumerable: true, get: function () { return server_1.createServerClient; } });
