(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
        typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) {
    'use strict';

    function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError';
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError';
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError';
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError';
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError';
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError';
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v.replace(/\+/g, " ")) }), {});

        let body;
        // If req stream has ended body has been parsed
        if (req.readableEnded) {
            body = req.body;
        } else {
            body = await parseBody(req);
        }

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => String(record[prop] ?? '').toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }

            if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAPNnpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHja7ZpZdiS7DUT/uQovgSQ4LofjOd6Bl+8LZqpULbWm7vdnqyRVKQeCBAKBAFNm/eff2/yLr2hzMSHmkmpKlq9QQ/WND8VeX+38djac3+cr3af4+5fj5nHCc0h4l+vP8nJicdxzeN7Hxz1O43h8Gmi0+0T/9cT09/jlNuAeBs+XuMuAvQ2YeQ8k/jrhwj2Re3mplvy8hH3PKPr7SLl+jP6KkmL2OeErPnmbQ9q8Rmb0c2ynxafzO+eET7mC65JPjrM95exN2jmmlYLnophSTKLDZH+GGAwWM0cyt3C8nsHWWeG4Z/Tio7cHQiZ2M7JK8X6JE3t++2v5oj9O2nlvfApc50SkGQ5FDnm5B2PezJ8Bw1PUPvl6cYv5G788u8V82y/lPTgfn4CC+e2JN+Ds5T4ubzCVHu8M9JsTLr65QR5m/LPhvh6G/S8zcs75XzxZXn/2nmXvda2uhURs051x51bzMgwXdmIl57bEK/MT+ZzPq/IqJPEA+dMO23kNV50HH9sFN41rbrvlJu/DDeaoMci8ez+AjB4rkn31QxQxQV9u+yxVphRgM8CZSDDiH3Nxx2499oYrWJ6OS71jMCD5+ct8dcF3XptMNupie4XXXQH26nCmoZHT31xGQNy+4xaPg19ejy/zFFghgvG4ubDAZvs1RI/uFVtyACBcF3m/0sjlqVHzByUB25HJOCEENjmJLjkL2LNzQXwhQI2Ze7K0EwEXo59M0geRRGwKOMI292R3rvXRX8fhbuJDRkomNlUawQohgp8cChhqUWKIMZKxscQamyEBScaU0knM1E6WxUxO5pJrbkVKKLGkkksptbTqq1AjYiWLa6m1tobNFkyLjbsbV7TWfZceeuyp51567W0AnxFG1EweZdTRpp8yIayZZp5l1tmWI6fFrLDiSiuvsupqG6xt2WFHOCXvsutuj6jdUX33+kHU3B01fyKl1+VH1Diasw50hnDKM1FjRsR8cEQ8awQAtNeY2eJC8Bo5jZmtnqyInklGjc10thmXCGFYzsftHrF7jdy342bw9Vdx89+JnNHQ/QOR82bJm7j9JmqnGo8TsSsL1adWyD7Or9J8aTjbXx/+9v3/A/1vDUS9tHOXtLaM6JoBquRHJFHdaNU5oF9rKVSjYNewoFNsW032cqqCCx/yljA2cOy7+7zJ0biaicv1TcrWXSDXVT3SpkldUqqPIJj8p9oeWVs4upKL3ZHgpNzYnTRv5EeTYXpahYRgfC+L/FyxBphCmPLK3W1Zu1QZljTMJe5AIqmOyl0qlaFCCJbaPAIMWXzurWAMXiB1fGDtc+ld0ZU12k5cQq4v7+AB2x3qLlQ3hyU/uWdzzgUTKfXSputZRtp97hZ3z4EE36WE7WtjbqMtMr912oRp47HloZDlywxJ+uyzmrW91OivysrM1Mt1rZbrrmXm2jZrYWVuF9xZVB22jM4ccdaE0kh5jIrnzBy5w6U92yZzS1wrEao2ZPnE0tL0eRIpW1dOWuZ1WlLTqm7IdCESsV5RxjQ1/KWC/y/fPxoINmQZI8Cli9oOU+MJYgrv006VQbRGC2Ug8TYzrdtUHNjnfVc6/oN8r7tywa81XHdZN1QBUhfgzRLzmPCxu1G4sjlRvmF4R/mCYdUoF2BYNMq4AjD2GkMGhEt7PAJfKrH1kHmj8eukyLb1oCGW/WdAtx0cURYqtcGnNlAqods6UnaRpY3LY8GFbPeSrjKmsvhKnWTtdYKhRW3TImUqObdpGZgv3ltrdPwwtD+l1FD/htxAwjdUzhtIkWNVy+wBUmDtphwgVemd8jV1miFXWTpumqiqvnNuArCrFMbLPexJYpABbamrLiztZEIeYPasgVbnz9/NZxe4p/B+FV3zGt79B9S0Jc0Lu+YH4FXsAsa2YnRIAb2thQmGc17WdNd9cx4+y4P89EiVRKB+CvRkiPTwM7Ts+aZ5aV0C4zGoqyOGJv3yGMJaHXajKbOGkm40Ychlkw6c6hZ4s+SDJpsmncwmm8ChEmBWspX8MkFB+kzF1ZlgoGWiwzY6w4AIPDOcJxV3rtUnabEgoNBB4MbNm8GlluVIpsboaKl0YR8kGnXZH3JQZrH2MDxxRrHFUduh+CvQszakraM9XNo7rEVjt8VpbSOnSyD5dwLfVI4+Sl+DCZc5zU6zhrXnRhZqUowkruyZupZEm/dA2uVTroDg1nfdJMBua9yCJ8QPtGw2rkzlYLik5SBzUGSoOqBMJvwTe92eGgOVx8/T39TP0r/PYgfkP1IEyGVhYHXyJiVPU0skB3dGqle6OZuwj/Hw5c2gV5nEM6TYaAryq3CRXsj1088XNwt0qcliqNc6bfW+TttRydKpeJOUWTmmUiwJKzpr6hkVzzLrVs+s66xEiCwOzfg5IRgwQgFgrriRlg6WQS/nGyRUNDjulWsUbO8qu/lWaWeFe8QTs0puzrxXH1H0b91KgDm2dkdrpkpx8Ks2zZu4K1GHPpDxPdCL0RH0SZZrGX8hRKTA+oUPzQ+I0K1C16ZSK6TR28HUdlnfpzMsIvd4TR7iuSe/+pn8vief46IQULRGcHvRVUyn9aYeoHbGhEbct+vEuzIxhxJrgk1oyo3AFA7eSSSNI/Vxl0eLMCrJ/j1QH0ybj0C9VCn9BtXbz6Kd10b8QKtpTnecbnKHWZxcK2OiKCuViBHqrzM2T1uFlGJlMKFKRF1Zy6wMqQYtgKYc4PFoGv2dX2ixqGaoFDhjzRmp4fsygFZr3t0GmBqeqbcBFpvsMVCNajVWcLRaPBhRKc4RCCUGZphKJdisKdRjDKdaNbZfwM5BulzzCvyv0AsAlu8HOAdIXAuMAg0mWa0+0vgrODoHlm7Y7rXUHmm9r2RTLpXwOfOaT6iZdASpqOIXfiABLwQkrSPFXQgAMHjYyEVrOBESVgS4g4AxcXyiPwBiCF6g2XTPk0hqn4D67rbQVFv0Lam6Vfmvq90B3WgV+peoNRb702/tesrImcBCvIEaGoI/8YpKa1XmDNr1aGUwjDETBa3VkOLYVLGKeWQcd+WaUlsMdTdUg3TcUPvdT20ftDW4+injyAarDRVVRgc906sNTo1cu7LkDGewjkQ35Z7l4Htnx9MCkbenKiNMsif+5BNVnA6op3gZVZtjIAacNia+00w1ZutIibTMOJ7IISctvEQGDxEYDUSxUiH4R4kkH86dMywCqVJ2XpzkUYUgW3mDPmz0HLW6w9daRn7abZmo4QR5i/A21r4oEvCC31oajm5CR1yBZcIfN7rmgxM9qZBhXh3C6NR9dCS1PTMJ30c4fEcwkq0IXdphpB9eg4x1zycsof4t6C4jyS68eW7OonpSEYCzb5dWjQH3H5fWq2SH41O4LahPrSJA77KqpJYwH6pdxDfDIgxLR9GptCKMoiHETrJ0wFSR3Sk7yI97KdBVSHXeS5FBnYKIz1JU6VhdCkfHIP42o0V6aqgg00JtZfdK6hPeojtXvgfnE/VX0p0+fqxp2/nDfvBuHgeo7ppkrr/MyU1dT73n5B/qi76+lzMnVnHRJDeZOyj3XXdQrrtOUPQunDqgDlz+iuS3QDafITkJd050L0Hi2kiRBX52pIVso0ZpW1YQsT2VRgtxm9iiqU2qXyZ0OdvZy0J1gFotZFEuGrnt3iiiXvECX+UcWBqpPlgLRkdN7cpl8PxDjWseAu1bPdCjBSrQeVD2RHE7bRhMb1Qd3VHVXVNBewZ3Wm7avbifhB+4LNQrmp0WxiCNkm7dd7mV39SnokrvfzIr+oDSFq1D76MZchw6Vl4Z67CL01I6ZiX/VEqfM1azjaSkKqC+kx67tqTg5ntLii5b96TAA3wMTx2NvqsyyUajYQHJ1qkpmzHQITXDUZRGTYtNw9uLSndMmI9tfMdEeRgwWHB7NlosyivZPlvT5KIOc+GefU9UhA4MmKFXmhAuJRFVWHRJySbREImpQysz4g3uJckihD7P84nWtLo7oR4tr8IKdSBXYvYaZnm3ffhh9nyWPDa+zQfzdULsFlr/khrMb7hhAroOKSZgxbUzqdiVIhQc+iZaTbpesLXSbIfbjwXTf8AjbnV6kTpD4ZsMdXMK45G1NRiMdh/bLb6oXX+4rWHen9BW+xJDV1N+i6HTlKdLDMnVkx8tdHryus3VlCOXXKlDIiuOkimXnmzmrtbGqmAHL1TVXU73PX5nx3xhSO3QKtBqbd31iQHHBNXXrYIXHVyQqDGIcc6qHEcz2ieN+radKS9br/cGzC0G7g0YFQPGdqs7MI6pOt2BgYtt/4MNW8NJ3VT5es/izZZFd9yIfwY1lUubGSSnPiWWzDpAN+sExNptEoBx74q8bAzdFu6NocvC2RgK2WR7doZodiZ6OgoUrBoWIBM2xtMHXUX3GGktr5RtwPZ9tTWfleFP3iEc2hTar6IC1Y55ktYKQtXTsKkfgQ+al0aXBCh2dlCxdBtLtc8QJ4WUKIX+jlRR/TN9pXpNA1bUC7LaYUzJvxr6rh2Q7ellILBd0PcFF5F6uArA6ODZdjQYosZpf7lbu5kNFfbGUUY5C2p7esLhhjw94Miqk+8tDPgTVXX23iliu782KzsaVdexRSq4NORtmY3erV/NFsJU9S7naPXmPGLYvuy5USQA2pcb4z/fYafpPj0t5HEeD1y7W/Z+PHA2t8L1eGCCeFS/Ph04Hafu+Uf8ly2tjUNDQnNUIOqVLrBLIwxK67p3fP7LaX/LjnlniCYv6jNK0ce5YrPud1Gc6LQWg+sumIt2hCCVG3e8e5tsLAL2qWekqp1nKPKqKIJcmxO3oljxVa1TXVDVWmxQ/lhHHnYNP9UDrtFdwekRKCueDRSRAYoo0nEssbG3znTTDahVUXyDj+afeEhn3w/UyY0fSv5b8ZuSmaDVrURYmBrf0ZgIMOGuGFNG3FH45iA7VFzUnj/odcwHzY72OnQEhByP3PtKWxh/Q+/hkl9x5lEic5ojDGgEzcSpnJEwY2y6ZN0RiyMBhZQ35AigLvK/dt9fn9ZJXaHUpf9Y4IxtBSkanMxxP6xb/pC/I1D1icMLDcmjZlj9L61LoIyLxKGRjUcUtOiFju4YqimZ3K0odbd1Usaa7gPp/77IJRuOmxAmqhrWXAPOftoY0P/BsgifTmC2ChOlRSbIMBjjm3bQIeahGwQamM9wHqy19zaTCZr/AtjdNfWMu8SZAAAA13pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHjaPU9LjkMhDNtzijlCyMd5HKflgdRdF72/xmFGJSIEx9ihvd6f2X5qdWizy9WH3+KM7xrRp2iw6hLARIfnSKsqoRKGSEXA0YuZVxOx+QcnMMBKJR2bMdNUDraxWJ2ciQuDDPKgNDA8kakNOwMLriTRO2Alk3okJsUiidC9Ex9HbNUMWJz28uQIzhhNxQduKhdkujHiSJVTCt133eqpJX/6MDXh7nrXydzNq9tssr14NXuwFXaoh/CPiLRfLvxMyj3GtTgAAAGFaUNDUElDQyBwcm9maWxlAAB4nH2RPUjDQBzFX1NFKfUD7CDikKE6WRAVESepYhEslLZCqw4ml35Bk4YkxcVRcC04+LFYdXBx1tXBVRAEP0Dc3JwUXaTE/yWFFjEeHPfj3b3H3TtAqJeZanaMA6pmGclYVMxkV8WuVwjoRQCz6JeYqcdTi2l4jq97+Ph6F+FZ3uf+HD1KzmSATySeY7phEW8QT29aOud94hArSgrxOfGYQRckfuS67PIb54LDAs8MGenkPHGIWCy0sdzGrGioxFPEYUXVKF/IuKxw3uKslquseU/+wmBOW0lxneYwYlhCHAmIkFFFCWVYiNCqkWIiSftRD/+Q40+QSyZXCYwcC6hAheT4wf/gd7dmfnLCTQpGgc4X2/4YAbp2gUbNtr+PbbtxAvifgSut5a/UgZlP0mstLXwE9G0DF9ctTd4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html@1.3.0?module';\nimport { until } from 'https://unpkg.com/lit-html@1.3.0/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k, v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        // Restore session records for any seeded users that include an `accessToken`.
        // This ensures seeded tokens remain valid across server restarts for the
        // development server (avoids confusing 403s when sessions are stored in-memory).
        try {
            const seededUsers = protectedStorage.get('users') || [];
            for (const u of seededUsers) {
                if (u && u.accessToken) {
                    // If a session with this accessToken already exists, skip
                    const existing = protectedStorage.query('sessions', { accessToken: u.accessToken })[0];
                    if (existing) continue;

                    // Create a session entry and set its accessToken to the seeded value
                    let s = protectedStorage.add('sessions', { userId: u._id });
                    s = protectedStorage.set('sessions', s._id, Object.assign({ accessToken: u.accessToken }, s));
                }
            }
        } catch (err) {
            // non-fatal - if protectedStorage doesn't have users/sessions yet, ignore
            console.error('Failed to restore seeded sessions:', err && err.message);
        }

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                const source = seedData[collectionName];

                // Support seed data as either an object keyed by id or as an array
                // of records. When it's an array, prefer the record's own `_id` or
                // `id` as the storage key so seeded ids are preserved. Otherwise
                // fall back to generating a uuid.
                if (Array.isArray(source)) {
                    for (let item of source) {
                        if (!item) continue;
                        const key = item._id || item.id || uuid$2();
                        // store a shallow copy without the duplicated _id key in value
                        const stored = Object.assign({}, item);
                        delete stored._id;
                        collection.set(key, stored);
                    }
                } else {
                    for (let recordId in source) {
                        if (source.hasOwnProperty(recordId)) {
                            collection.set(recordId, source[recordId]);
                        }
                    }
                }

                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
        function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (value === null) {
            return null;
        }
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                console.log('Incoming auth token:', userToken ? (userToken.length > 12 ? userToken.slice(0, 8) + '...' : userToken) : '<none>');
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    console.log('Found session for token, sessionId=', session._id, 'userId=', session.userId);
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    } else {
                        console.log('Session referenced missing user:', session.userId);
                    }
                } else {
                    console.log('No session found for token; trying seeded user fallback');
                    try {
                        const seeded = context.protectedStorage.query('users', { accessToken: userToken })[0];
                        if (seeded) {
                            console.log('Authorized (seed) as ' + seeded[identity]);
                            user = seeded;
                        } else {
                            console.log('No seeded user matched token');
                        }
                    } catch (e) {
                        console.error('Seeded user fallback error:', e && e.message);
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        // const session = saveSession(result._id);
                        // result.accessToken = session.accessToken;

                        let session = saveSession(result._id);

                        if (result.accessToken) {
                            try {
                                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken: result.accessToken }, session));
                                result.accessToken = result.accessToken;
                            } catch (e) {
                                result.accessToken = session.accessToken;
                            }
                        } else {
                            result.accessToken = session.accessToken;
                        }

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };

            // const isAdmin = request.headers.hasOwnProperty('x-admin');
            const isAdmin = request.headers.hasOwnProperty('x-admin') ||
                (context.user && (
                    context.user.isAdmin === true ||
                    (Array.isArray(context.user.roles) && context.user.roles.includes('Admin')) ||
                    context.user.role === 'Admin'
                ));

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
        users: {
            "35c62d76-8152-4626-8712-eeb96381bea8": {
                email: "admin@abv.bg",
                name: "Admin Adminov",
                hashedPassword: "fac7060c3e17e6f151f247eacb2cd5ae80b8c36aedb8764e18a41bbdc16aa302",
                _createdOn: 1764517832604,
                _id: "35c62d76-8152-4626-8712-eeb96381bea8",
                accessToken: "85b6184e7373cd81c5eefcd45f4c751ef77f68a107e3c1dcac421e7be0ef8d52",
                isAdmin: true,
            },
            "847ec027-f659-4086-8032-5173e2f9c93a": {
                email: "user@abv.bg",
                username: "User Userov",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1",
                _createdOn: 1764518035123,
                _id: "847ec027-f659-4086-8032-5173e2f9c93a",
                accessToken: "d6f3e5b8f4f0e1e4f3e6e8f7c9d8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0",
                isAdmin: false
            },
            "60f0cf0b-34b0-4abd-9769-8c42f830dffc": {
                email: "peter@abv.bg",
                username: "Peter Petrov",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1",
                _createdOn: 1764520005123,
                _id: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                accessToken: "a1b2c3d4e5f60718273645566778899aabbccddeeff00112233445566778899",
                isAdmin: false
            },
            "5a7d1234-9af0-4b30-9e21-b38484f6c1ab": {
                email: "mitko@abv.bg",
                username: "Mitko Mitev",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1",
                _createdOn: 1764975000000,
                _id: "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                accessToken: "b7c3e4d5f6a718293a4b5c6d7e8f90112233445566778899aabbccddeeff0011",
                isAdmin: false,
            },
            "9e3c6a2d-8bf0-4c91-92f4-1234567890ab": {
                email: "elena@abv.bg",
                username: "Elena Stoyanova",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1",
                _createdOn: 1764976000000,
                _id: "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                accessToken: "1111111111111111111111111111111111111111111111111111111111111111",
                isAdmin: false
            },
            "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456": {
                email: "ivan@abv.bg",
                username: "Ivan Ivanov",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1",
                _createdOn: 1764977000000,
                _id: "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                accessToken: "2222222222222222222222222222222222222222222222222222222222222222",
                isAdmin: false
            },
        },
        sessions: {
        }
    };
    var seedData = {
        "settings": {
            home: {
                pickOfMonth: "101b4a2f-fd3d-4552-a2de-026a73cf8e5e",
                pickOfMonthReview: `There are stories, dear reader, and then there are myths.....

There are myths, dear reader, and there are Legends...Legends that transcend time and space and leave a forever impact.

THIS. MUST. BE.`,
                staffRecommendations: [
                    "fcd39f63-7e0b-423c-8aec-1838b29a162e",
                    "17935d4a-9ca4-478d-bdf5-86a3906d41a9",
                    "952d7634-53b9-48c6-ab9b-3f7ef52c39e1"
                ]
            }
        },
        books: [
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Empire of Silence",
                "series": "The Sun Eater",
                "numberInSeries": 1,
                "author": "Christopher Ruocchio",
                "genre": "Science Fiction",
                "pages": 753,
                "year": 2018,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1523897945i/36454667.jpg",
                "_createdOn": 1764599686201,
                "tags": [
                    "adult",
                    "sci-fantasy",
                    "space-opera"
                ],
                "description": "Hadrian Marlowe, a man revered as a hero and despised as a murderer, chronicles his tale in the galaxy-spanning debut of the Sun Eater series, merging the best of space opera and epic fantasy.\n\nIt was not his war.\nOn the wrong planet, at the right time, for the best reasons, Hadrian Marlowe started down a path that could only end in fire. The galaxy remembers him as a the man who burned every last alien Cielcin from the sky. They remember him as a the devil who destroyed a sun, casually annihilating four billion human lives—even the Emperor himself—against Imperial orders.\nBut Hadrian was not a hero. He was not a monster. He was not even a soldier.\nFleeing his father and a future as a torturer, Hadrian finds himself stranded on a strange, backwater world. Forced to fight as a gladiator and into the intrigues of a foreign planetary court, he will find himself fight a war he did not start, for an Empire he does not love, against an enemy he will never understand.",
                "_id": "82107d6e-81c6-4f34-81e3-e9dcb97984bc"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Howling Dark",
                "series": "The Sun Eater",
                "numberInSeries": 2,
                "author": "Christopher Ruocchio",
                "genre": "Science Fiction",
                "pages": 688,
                "year": 2019,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1563298830i/42298449.jpg",
                "_createdOn": 1764599686202,
                "tags": [
                    "adult",
                    "sci-fantasy",
                    "space-opera"
                ],
                "description": "The second novel of the galaxy-spanning Sun Eater series merges the best of space opera and epic fantasy, as Hadrian Marlowe continues down a path that can only end in fire.\n\nHadrian Marlowe is lost.\n\nFor half a century, he has searched the farther suns for the lost planet of Vorgossos, hoping to find a way to contact the elusive alien Cielcin. He has not succeeded, and for years has wandered among the barbarian Normans as captain of a band of mercenaries.\n\nDetermined to make peace and bring an end to nearly four hundred years of war, Hadrian must venture beyond the security of the Sollan Empire and among the Extrasolarians who dwell between the stars. There, he will face not only the aliens he has come to offer peace, but contend with creatures that once were human, with traitors in his midst, and with a meeting that will bring him face to face with no less than the oldest enemy of mankind.\n\nIf he succeeds, he will usher in a peace unlike any in recorded history. If he fails...the galaxy will burn.",
                "_id": "00cea304-fff3-4b3f-b015-ddd4a03fa871"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Demon in White",
                "series": "The Sun Eater",
                "numberInSeries": 3,
                "author": "Christopher Ruocchio",
                "genre": "Science Fiction",
                "pages": 784,
                "year": 2020,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1574314340i/48906413.jpg",
                "_createdOn": 1764599686203,
                "tags": [
                    "adult",
                    "sci-fantasy",
                    "space-opera"
                ],
                "description": "For almost a hundred years, Hadrian Marlowe has served the Empire in its war against the Cielcin, a vicious alien race bent on humanity’s destruction. Rumors of a new king amongst the Cielcin have reached the Imperial throne. This one is not like the others. It does not raid borderworld territories, preferring precise, strategic attacks on the humans’ Empire.\n\nTo make matters worse, a cult of personality has formed around Hadrian, spurred on by legends of his having defied death itself. Men call him Halfmortal. Hadrian’s rise to prominence proves dangerous to himself and his team, as pressures within the Imperial government distrust or resent his new influence.\n\nCaught in the middle, Hadrian must contend with enemies before him—and behind.\n\nAnd above it all, there is the mystery of the Quiet. Hadrian did defy death. He did return. But the keys to the only place in the universe where Hadrian might find the answers he seeks lie in the hands of the Emperor himself....",
                "_id": "5321337c-6c3e-4515-b034-fd905a39bb68"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Kingdoms of Death",
                "series": "The Sun Eater",
                "numberInSeries": 4,
                "author": "Christopher Ruocchio",
                "genre": "Science Fiction",
                "pages": 544,
                "year": 2022,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1634104594i/58420375.jpg",
                "_createdOn": 1764599686204,
                "tags": [
                    "adult",
                    "sci-fantasy",
                    "space-opera"
                ],
                "description": "The fourth novel of the galaxy-spanning Sun Eater series merges the best of space opera and epic fantasy, as Hadrian Marlowe continues down a path that can only end in fire.\n\nHadrian Marlowe is trapped.\n\nFor nearly a century, he has been a guest of the Emperor, forced into the role of advisor, a prisoner of his own legend. But the war is changing. Mankind is losing.\n\nThe Cielcin are spilling into human space from the fringes, picking their targets with cunning precision. The Great Prince Syriani Dorayaica is uniting their clans, forging them into an army and threat the likes of which mankind has never seen.\n\nAnd the Empire stands alone.\n\nNow the Emperor has no choice but to give Hadrian Marlowe—once his favorite knight—one more impossible task: journey across the galaxy to the Lothrian Commonwealth and convince them to join the war. But not all is as it seems, and Hadrian’s journey will take him far beyond the Empire, beyond the Commonwealth, impossibly deep behind enemy lines.",
                "_id": "a73b1436-bbcf-4227-862a-def1b2226926"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Ashes of Man",
                "series": "The Sun Eater",
                "numberInSeries": 5,
                "author": "Christopher Ruocchio",
                "genre": "Science Fiction",
                "pages": 544,
                "year": 2022,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1644986472i/60427253.jpg",
                "_createdOn": 1764599686205,
                "tags": [
                    "adult",
                    "sci-fantasy",
                    "space-opera"
                ],
                "description": "The fifth novel of the galaxy-spanning Sun Eater series merges the best of space opera and epic fantasy, as Hadrian Marlowe continues down a path that can only end in fire.\n\nThe galaxy is burning.\n\nWith the Cielcin united under one banner, the Sollan Empire stands alone after the betrayal of the Commonwealth. The Prophet-King of the Cielcin has sent its armies to burn the worlds of men, and worse, there are rumors...whispers that Hadrian Marlowe is dead, killed in the fighting.\n\nBut it is not so. Hadrian survived with the help of the witch, Valka, and together they escaped the net of the enemy having learned a terrible truth: the gods that the Cielcin worship are real and will not rest until the universe is dark and cold.\n\nWhat is more, the Emperor himself is in danger. The Prophet-King has learned to track his movements as he travels along the borders of Imperial space. Now the Cielcin legions are closing in, their swords poised to strike off the head of all mankind.",
                "_id": "c78eeb93-6288-4486-989e-25092333a642"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Disquiet Gods",
                "series": "The Sun Eater",
                "numberInSeries": 6,
                "author": "Christopher Ruocchio",
                "genre": "Science Fiction",
                "pages": 704,
                "year": 2024,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1690034659i/176443792.jpg",
                "_createdOn": 1764599686206,
                "tags": [
                    "adult",
                    "sci-fantasy",
                    "space-opera"
                ],
                "description": "The sixth novel of the galaxy-spanning Sun Eater series merges the best of space opera and epic fantasy, as Hadrian Marlowe continues down a path that can only end in fire.\n\nThe end is nigh.\n\nIt has been nearly two hundred years since Hadrian Marlowe assaulted the person of the Emperor and walked away from war. From his Empire. His duty. From the will and service of the eldritch being known only as the Quiet. The galaxy lies in the grip of a terrible plague, and worse, the Cielcin have overrun the realms of men.\n\nA messenger has come to Jadd, bearing a summons from the Sollan Emperor for the one-time hero. A summons, a pardon, and a plea. HAPSIS, the Emperor’s secret first-contact intelligence organization, has located one of the dreadful Watchers, the immense, powerful beings worshipped by the Pale Cielcin.\n\nCalled out of retirement and exile, the old hero—accompanied by his daughter, Cassandra—must race across the galaxy and against time to accomplish one last, impossible\n\nTo kill a god.",
                "_id": "52d44f5c-6c18-4375-9f36-5f0c279eaff8"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Shadows Upon Time",
                "series": "The Sun Eater",
                "numberInSeries": 7,
                "author": "Christopher Ruocchio",
                "genre": "Science Fiction",
                "pages": 928,
                "year": 2025,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1740399833i/222685709.jpg",
                "_createdOn": 1764599686207,
                "tags": [
                    "adult",
                    "sci-fantasy",
                    "space-opera"
                ],
                "description": "The seventh and final novel of the galaxy-spanning series merges the best of space opera and epic fantasy, as Hadrian Marlowe at last lights the greatest fire humanity has ever seen\n\nAmbitious universe-building combines with intimate character portraits for storytelling on a truly epic scale—for fans of Orson Scott Card, Adrian Tchaikovsky, Patrick Rothfuss, and Jack Campbell\n\nThe trumpet sounds.\n\nThe end has come at last. After his victory at Vorgossos, Hadrian Marlowe finds himself a fugitive, on the run not only from the Extrasolarians, but from his own people, the Sollan Empire he betrayed—and who betrayed him. Hidden safely beyond the borders of human space, Hadrian awaits the arrival of the one ally he has left: the Jaddian Prince Kaim-Olorin du Otranto.\n\nWhat's more, the inhuman Cielcin have vanished, unseen for more than one hundred years. The armies of men have grown complacent, but Hadrian knows the truth: the Cielcin are gathering their strength, preparing for their final assault against the heart of all mankind.\n\nOnly Hadrian possesses the power to stem the tide: an ancient war machine, forged by the daimon machines at the dawn of time. The mighty Demiurge. With it, Hadrian must face not just the Cielcin horde, but their Prophet-King, and the dark gods it serves—the very gods who shaped the universe itself.\n\nThis must be.",
                "_id": "101b4a2f-fd3d-4552-a2de-026a73cf8e5e"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Red Rising",
                "series": "Red Rising Saga",
                "numberInSeries": 1,
                "author": "Pierce Brown",
                "genre": "Science Fiction",
                "pages": 382,
                "year": 2014,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1761311924i/15839976.jpg",
                "_createdOn": 1764599686208,
                "tags": [
                    "adult",
                    "dystopia",
                    "space-opera"
                ],
                "description": "Darrow is a Red, a member of the lowest caste in the color-coded society of the future. Like his fellow Reds, he works all day, believing that he and his people are making the surface of Mars livable for future generations. Yet he toils willingly, trusting that his blood and sweat will one day result in a better world for his children.\n\nBut Darrow and his kind have been betrayed. Soon he discovers that humanity reached the surface generations ago. Vast cities and lush wilds spread across the planet. Darrow—and Reds like him—are nothing more than slaves to a decadent ruling class.\n\nInspired by a longing for justice, and driven by the memory of lost love, Darrow sacrifices everything to infiltrate the legendary Institute, a proving ground for the dominant Gold caste, where the next generation of humanity’s overlords struggle for power. He will be forced to compete for his life and the very future of civilization against the best and most brutal of Society’s ruling class. There, he will stop at nothing to bring down his enemies . . . even if it means he has to become one of them to do so.",
                "_id": "2aff9c38-d4ab-481b-87d0-20c114a46a67"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Golden Son",
                "series": "Red Rising Saga",
                "numberInSeries": 2,
                "author": "Pierce Brown",
                "genre": "Science Fiction",
                "pages": 447,
                "year": 2015,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1394684475i/18966819.jpg",
                "_createdOn": 1764599686209,
                "tags": [
                    "adult",
                    "dystopia",
                    "space-opera"
                ],
                "description": "As a Red, Darrow grew up working the mines deep beneath the surface of Mars, enduring backbreaking labor while dreaming of the better future he was building for his descendants. But the Society he faithfully served was built on lies. Darrow’s kind have been betrayed and denied by their elitist masters, the Golds—and their only path to liberation is revolution. And so Darrow sacrifices himself in the name of the greater good for which Eo, his true love and inspiration, laid down her own life. He becomes a Gold, infiltrating their privileged realm so that he can destroy it from within.\n\nA lamb among wolves in a cruel world, Darrow finds friendship, respect, and even love—but also the wrath of powerful rivals. To wage and win the war that will change humankind’s destiny, Darrow must confront the treachery arrayed against him, overcome his all-too-human desire for retribution—and strive not for violent revolt but a hopeful rebirth. Though the road ahead is fraught with danger and deceit, Darrow must choose to follow Eo’s principles of love and justice to free his people.\n\nHe must live for more.",
                "_id": "0fcfc589-7de4-4227-99e2-d444c8354b6c"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Morning Star",
                "series": "Red Rising Saga",
                "numberInSeries": 3,
                "author": "Pierce Brown",
                "genre": "Science Fiction",
                "pages": 525,
                "year": 2016,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1461354277i/18966806.jpg",
                "_createdOn": 1764599686210,
                "tags": [
                    "adult",
                    "dystopia",
                    "space-opera"
                ],
                "description": "Darrow would have lived in peace, but his enemies brought him war. The Gold overlords demanded his obedience, hanged his wife, and enslaved his people. But Darrow is determined to fight back. Risking everything to transform himself and breach Gold society, Darrow has battled to survive the cutthroat rivalries that breed Society’s mightiest warriors, climbed the ranks, and waited patiently to unleash the revolution that will tear the hierarchy apart from within.\n\nFinally, the time has come.\n\nBut devotion to honor and hunger for vengeance run deep on both sides. Darrow and his comrades-in-arms face powerful enemies without scruple or mercy. Among them are some Darrow once considered friends. To win, Darrow will need to inspire those shackled in darkness to break their chains, unmake the world their cruel masters have built, and claim a destiny too long denied—and too glorious to surrender.",
                "_id": "4032affc-615e-4e41-9eb5-6f9517d4d9c9"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Iron Gold",
                "series": "Red Rising Saga",
                "numberInSeries": 4,
                "author": "Pierce Brown",
                "genre": "Science Fiction",
                "pages": 602,
                "year": 2018,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1716325988i/33257757.jpg",
                "_createdOn": 1764599686211,
                "tags": [
                    "adult",
                    "dystopia",
                    "space-opera"
                ],
                "description": "They call him father, liberator, warlord, Reaper. But he feels a boy as he falls toward the pale blue planet, his armor red, his army vast, his heart heavy. It is the tenth year of war and the thirty-second of his life.\n\nA decade ago, Darrow was the hero of the revolution he believed would break the chains of the Society. But the Rising has shattered everything: Instead of peace and freedom, it has brought endless war. Now he must risk everything he has fought for on one last desperate mission. Darrow still believes he can save everyone, but can he save himself?\n\nAnd throughout the worlds, other destinies entwine with Darrow’s to change his fate forever:\n\nA young Red girl flees tragedy in her refugee camp and achieves for herself a new life she could never have imagined.\n\nAn ex-soldier broken by grief is forced to steal the most valuable thing in the galaxy—or pay with his life.\n\nAnd Lysander au Lune, the heir in exile to the sovereign, wanders the stars with his mentor, Cassius, haunted by the loss of the world that Darrow transformed, and dreaming of what will rise from its ashes.\n\nRed Rising was the story of the end of one universe, and Iron Gold is the story of the creation of a new one. Witness the beginning of a stunning new saga of tragedy and triumph from masterly New York Times bestselling author Pierce Brown.",
                "_id": "6aa9a204-67f3-4a97-9f66-15f999539e79"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Dark Age",
                "series": "Red Rising Saga",
                "numberInSeries": 5,
                "author": "Pierce Brown",
                "genre": "Science Fiction",
                "pages": 758,
                "year": 2019,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1525464420i/29226553.jpg",
                "_createdOn": 1764599686212,
                "tags": [
                    "adult",
                    "grimdark",
                    "space-opera"
                ],
                "description": "For a decade Darrow led a revolution against the corrupt color-coded Society. Now, outlawed by the very Republic he founded, he wages a rogue war on Mercury in hopes that he can still salvage the dream of Eo. But as he leaves death and destruction in his wake, is he still the hero who broke the chains? Or will another legend rise to take his place?\n\nLysander au Lune, the heir in exile, has returned to the Core. Determined to bring peace back to mankind at the edge of his sword, he must overcome or unite the treacherous Gold families of the Core and face down Darrow over the skies of war-torn Mercury.\n\nBut theirs are not the only fates hanging in the balance.\n\nOn Luna, Mustang, Sovereign of the Republic, campaigns to unite the Republic behind her husband. Beset by political and criminal enemies, can she outwit her opponents in time to save him?\n\nOnce a Red refugee, young Lyria now stands accused of treason, and her only hope is a desperate escape with unlikely new allies.\n\nAbducted by a new threat to the Republic, Pax and Electra, the children of Darrow and Sevro, must trust in Ephraim, a thief, for their salvation—and Ephraim must look to them for his chance at redemption.\n\nAs alliances shift, break, and re-form—and power is seized, lost, and reclaimed—every player is at risk in a game of conquest that could turn the Rising into a new Dark Age.\n\nThe #1 New York Times bestselling author of Morning Star returns to the Red Rising universe with the thrilling sequel to Iron Gold.",
                "_id": "fcd39f63-7e0b-423c-8aec-1838b29a162e"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Light Bringer",
                "series": "Red Rising Saga",
                "numberInSeries": 6,
                "author": "Pierce Brown",
                "genre": "Science Fiction",
                "pages": 682,
                "year": 2023,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1667655583i/29227774.jpg",
                "_createdOn": 1764599686213,
                "tags": [
                    "adult",
                    "dystopia",
                    "space-opera"
                ],
                "description": "Darrow returns as Pierce Brown’s New York Times bestselling Red Rising series continues in the thrilling sequel to Dark Age.\n\n“The measure of a man is not the fear he sows in his enemies. It is the hope he gives his friends.”—Virginia au Augustus\n\nThe Reaper is a legend, more myth than man: the savior of worlds, the leader of the Rising, the breaker of chains.\n\nBut the Reaper is also Darrow, born of the red soil of Mars: a husband, a father, a friend.\n\nThe worlds once needed the Reaper. But now they need Darrow. Because after the dark age will come a new age: of light, of victory, of hope.",
                "_id": "2d172481-4848-47fe-bf71-9c1e51b98773"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Red God",
                "series": "Red Rising Saga",
                "numberInSeries": 7,
                "author": "Pierce Brown",
                "genre": "Science Fiction",
                "year": 2026,
                "tags": [
                    "adult",
                    "dystopia",
                    "space-opera"
                ],
                "description": "Planned final volume of the saga, promising to conclude Darrow’s story and the fate of the fractured Society in one last, system-spanning conflict.",
                "_id": "f9a471df-5c1e-4a72-b467-0726400778b7"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Empire of the Vampire",
                "series": "Empire of the Vampire",
                "numberInSeries": 1,
                "author": "Jay Kristoff",
                "genre": "Fantasy",
                "pages": 725,
                "year": 2021,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1611438107i/43728380.jpg",
                "_createdOn": 1764599686214,
                "tags": [
                    "adult",
                    "dark-fantasy",
                    "vampires"
                ],
                "description": "From holy cup comes holy light;\nThe faithful hands sets world aright.\nAnd in the Seven Martyrs’ sight,\nMere man shall end this endless night.\n\nIt has been twenty-seven long years since the last sunrise. For nearly three decades, vampires have waged war against humanity; building their eternal empire even as they tear down our own. Now, only a few tiny sparks of light endure in a sea of darkness.\n\nGabriel de León is a silversaint: a member of a holy brotherhood dedicated to defending realm and church from the creatures of the night. But even the Silver Order couldn’t stem the tide once daylight failed us, and now, only Gabriel remains.\n\nImprisoned by the very monsters he vowed to destroy, the last silversaint is forced to tell his story. A story of legendary battles and forbidden love, of faith lost and friendships won, of the Wars of the Blood and the Forever King and the quest for humanity’s last remaining hope:\n\nThe Holy Grail.",
                "_id": "c16329f7-a90c-4228-835d-77a14d69bf64"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Empire of the Damned",
                "series": "Empire of the Vampire",
                "numberInSeries": 2,
                "author": "Jay Kristoff",
                "genre": "Fantasy",
                "pages": 646,
                "year": 2024,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1709245057i/209320632.jpg",
                "_createdOn": 1764599686215,
                "tags": [
                    "adult",
                    "dark-fantasy",
                    "vampires"
                ],
                "description": "Gabriel de León has saved the Holy Grail from death, but his chance to end the endless night is lost.\n\nAfter turning his back on his silversaint brothers once and for all, Gabriel and the Grail set out to learn the truth of how Daysdeath might finally be undone.\n\nBut the last silversaint faces peril, within and without. Pursued by children of the Forever King, drawn into wars and webs centuries in the weaving, and ravaged by his own rising bloodlust, Gabriel may not survive to see the truth of the Grail revealed.",
                "_id": "736c0499-72c6-4a16-89df-f761f23376f8"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Empire of the Dawn",
                "series": "Empire of the Vampire",
                "numberInSeries": 3,
                "author": "Jay Kristoff",
                "genre": "Fantasy",
                "pages": 800,
                "year": 2025,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1743512828i/228188208.jpg",
                "_createdOn": 1764599686216,
                "tags": [
                    "adult",
                    "dark-fantasy",
                    "vampires"
                ],
                "description": "From holy cup comes holy light;\nThe faithful hands sets world aright.\nAnd in the Seven Martyrs’ sight,\nMere man shall end this endless night.\n\nGabriel de León has lost his family, his faith, and the last hope of ending the endless night—his surrogate daughter, Dior. With no thought left but vengeance, he and a band of loyal brothers journey into the war-torn heart of Elidaen to claim the life of the Forever King.\n\nUnbeknownst to the Last Silversaint, the Grail still lives—speeding towards the besieged capital of Augustin in the frail hope of ending Daysdeath. But deadly treachery awaits within the halls of power, and the Forever King’s legions march ever closer. Gabriel and Dior will be drawn into a final battle that will shape the very fate of the Empire, but as the sun sets for what may the last time, there will be no one left for them to trust.\n\nNot even each other",
                "_id": "17935d4a-9ca4-478d-bdf5-86a3906d41a9"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Black Company",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 1,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 319,
                "year": 1984,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1431815019i/25550470.jpg",
                "_createdOn": 1764599686217,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "Some feel the Lady, newly risen from centuries in thrall, stands between humankind and evil. Some feel she is evil itself.\n\nThe hard-bitten men of the Black Company take their pay and do what they must, burying their doubts with their dead.\n\nUntil the prophecy: The White Rose has been reborn, somewhere, to embody good once more.\n\nThere must be a way for the Black Company to find her.",
                "_id": "952d7634-53b9-48c6-ab9b-3f7ef52c39e1"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Shadows Linger",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 2,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 287,
                "year": 1984,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1407410290i/19368525.jpg",
                "_createdOn": 1764599686218,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "Mercenary soldiers in the service of the Lady, the Black Company stands against the rebels of the White Rose. They are tough men, proud of honoring their contracts. The Lady is evil, but so, too, are those who falsely profess to follow the White Rose, reincarnation of a centuries-dead heroine. Yet now some of the Company have discovered that the mute girl they rescued and sheltered is truly the White Rose reborn. Now there may be a path to the light, even for such as they. If they can survive it.\nAt the publisher's request, this title is being sold without Digital Rights Management software (DRM) applied.",
                "_id": "10df412d-84ef-49ea-a625-4d356bb5a49e"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The White Rose",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 3,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 317,
                "year": 1985,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1327901074i/400906.jpg",
                "_createdOn": 1764599686219,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "She is the last hope of good in the war against the evil sorceress known as the Lady. From a secret base on the Plains of Fear, where even the Lady hesitates to go, the Black Company, once in service to the Lady, now fights to bring victory to the White Rose. But now an even greater evil threatens the world. All the great battles that have gone before will seem a skirmishes when the Dominator rises from the grave.",
                "_id": "332553b9-7470-4c55-9c25-0ff29ce8ec3b"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Shadow Games",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 4,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 311,
                "year": 1989,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1389666582i/113540.jpg",
                "_createdOn": 1764599686220,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "After the devastating battle at the Tower of Charm, Croaker leads the greatly diminished Black Company south, in search of the lost Annals. The Annals will be returned to Khatovar, eight thousand miles away, a city that may exists only in legend...the origin of the first Free Companies.\n\nEvery step of the way the Company is hounded by shadowy figured and carrion-eating crows. As they march every southward, through bug infested jungle, rivers dense with bloodthirsty pirates, and cities, dead and living, haunted by the passage of the Company north, their numbers grow until they are thousands strong.\n\nBut always they are watched--by the Shadowmasters--a deadly new enemy: twisted creature that deal in darkness and death: powerful, shadowy creatures bent on smothering the world in their foul embrace. This is the first round in a deadly game, a game that the Black Company cannot hope to win.",
                "_id": "52b9869a-2bb0-4628-814e-b246b24e09c1"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Dreams of Steel",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 5,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 346,
                "year": 1990,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1389666584i/400900.jpg",
                "_createdOn": 1764599686221,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "Croaker has fallen and, following the Company's disastrous defeat at Dejagore, Lady is one of the few survivors--determined to avenge the Company and herself against the Shadowmasters, no matter what the cost.\n\nBut in assembling a new fighting force from the dregs and rabble of Taglios, she finds herself offered help by a mysterious, ancient cult of murder--competent, reliable, and apparently committed to her goals.\n\nMeanwhile, far away, Shadowmasters conspire against one another and the world, weaving dark spells that reach into the heart of Taglios. And in a hidden grove, a familiar figure slowly awakens to find himself the captive of an animated, headless corpse.\n\nMercilessly cutting through Taglian intrigues, Lady appears to be growing stronger every day. All that disturbs her are the dreams which afflict her by night--dreams of carnage, of destruction, of universal death, unceasing...",
                "_id": "04528d54-20fc-4a07-9981-1ce37e627124"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Bleak Seasons",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 6,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 316,
                "year": 1996,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1389586789i/400911.jpg",
                "_createdOn": 1764599686222,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "\"Let me tell you who I am, on the chance that these scribblings do survive....I am Murgen, Standard bearer of the Black Company, though I bear the shame of having lost that standard in battle. I am keeping these Annals because Croaker is dead. One-Eye won't, and hardly anyone else can read or write. I will be your guide for however long it takes the Shadowlanders to force our present predicament to its inevitable end...\" So writes Murgen, seasoned veteran of the Black Company. The Company has taken the fortress of Stormgard from the evil Shadowlanders, lords of darkness from the far reaches of the earth. Now the waiting begins.\n\nExhausted from the siege, beset by sorcery, and vastly outnumbered, the Company have risked their souls as well as their lives to hold their prize. But this is the end of an age, and great forces are at work. The ancient race known as the Nyueng Bao swear that ancient gods are stirring. the Company's commander has gone mad and flirts with the forces of darkness. Only Murgen, touched by a spell that has set his soul adrift in time, begins at last to comprehend the dark design that has made pawns of men and god alike.",
                "_id": "adbe7b18-df5d-4cc3-b082-04331edcdbbc"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "She Is the Darkness",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 7,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 470,
                "year": 1997,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1390686957i/400897.jpg",
                "_createdOn": 1764599686223,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "The wind whines and howls with bitter breath. Lightning snarls and barks. Rage is an animate force upon the plain of glittering stone. Even shadows are afraid.\n\nAt the heart of the plain stands a vast grey stronghold, unknown, older than any written memory. One ancient tower has collapsed across the fissure. From the heart of the fastness comes a great deep slow breath like that of a slumbering world-heart, cracking the olden silence.\n\nDeath is eternity. Eternity is stone. Stone is silence.\n\nStone cannot speak but stone remembers.\n\nSo begins the next movement of Glittering Stone....\n\nThe tale again comes to us from the pen of Murgen, Annalist and Standard Bearer of the Black Company, whose developing powers of travel through space and time give him a perspective like no other.\n\nLed by the wily commander, Croaker, and the Lady, the Company is working for the Taglian government, but neither the Company nor the Taglians are overflowing with trust for each other. Arrayed against both is a similarly tenuous alliance of sorcerers, including the diabolical Soulcatcher, the psychotic Howler, and a four-year-old child who may be the most powerful of all.",
                "_id": "17a1fb8a-9bc6-4c68-8072-5d86f8bb826e"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Water Sleeps",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 8,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 470,
                "year": 1999,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1404655797i/349470.jpg",
                "_createdOn": 1764599686224,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "Regrouping in Taglios, the surviving members of the Black Company are determined to free their fellow warriors held in stasis beneath the glittering plain. Journey there under terrible conditions, they arrive just in time for a magical conflagration in which the bones of the world will be revealed, the history of the Company unveiled, and new world gained and lost...all at a terrible price.",
                "_id": "604f90c0-1313-46ec-b85b-9a5d3c9b7cb6"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Soldiers Live",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 9,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 566,
                "year": 2000,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1388305400i/400899.jpg",
                "_createdOn": 1764599686225,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "When sorcerers and demigods go to war, those wars are fought by mercenaries, \"dog soldiers,\" grunts in the trenches. And the stories of those soldiers are the stories of Glen Cook's hugely popular \"Black Company\" novels. If the Joseph Heller of Catch-22 were to tell the story of The Lord of the Rings, it might read like the Black Company books. There is nothing else in fantasy like them.\n\nNow, at last, Cook brings the \"Glittering Stone\" cycle within the Black Company series to an end . . . but an end with many other tales left to tell. As Soldiers Live opens, Croaker is military dictator of all the Taglias, and no Black Company member has died in battle for four years. Croaker figures it can't last. He's right.\n\nFor, of course, many of the Company's old adversaries are still around. Narayan Singh and his adopted daughter--actually the offspring of Croaker and the Lady--hope to bring about the apocalyptic Year of the Skulls. Other old enemies like Shadowcatcher, Longshadow, and Howler are also ready to do the Company harm. And much of the Company is still recovering from the fifteen years many of them spent in a stasis field.\n\nThen a report arrives of an evil spirit, a forvalaka, that has taken over one of their old enemies. It attacks them at a shadowgate--setting off a chain of events that will bring the Company to the edge of apocalypse and, as usual, several steps beyond.\n\nGlen Cook is the leading modern writer of epic fantasy noir, and Soldiers Live is Cook at his best. None of his legion of fans will want to miss it.",
                "_id": "fa31207b-93c4-4449-94bd-bd9f9b6225bf"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Lies Weeping",
                "series": "The Chronicles of the Black Company",
                "numberInSeries": 10,
                "author": "Glen Cook",
                "genre": "Fantasy",
                "pages": 384,
                "year": 2025,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1735546293i/222376544.jpg",
                "_createdOn": 1764599686226,
                "tags": [
                    "adult",
                    "grimdark",
                    "military-fantasy"
                ],
                "description": "From the godfather of Grimdark himself, LIES WEEPING is the first book in a brand new arc of Glen Cook's groundbreaking Chronicles of the Black Company series!\n\nThe Black Company has retreated across the plain of glittering stone, toward a shadow gate that would let them trade the dangers of the plain for the questionable safety of the Company’s one-time haven on Hsien, a region in the world known as the Land of Unknown Shadows.\n\nIn Hsien, the company returns to their former base, An Abode of Ravens, where the Lady ages backwards in a return to force, shaking off the thrall, one breath at a time. Meanwhile, Croaker, ascended to godlike status as the Steadfast Guardian, has been left behind in the Nameless Fortress.\n\nIn their adopted father’s stead, Arkana and Shukrat have taken up the role of annalist for the Black Company. At first, life in Hsien appears quiet, even boring, but it is quickly apparent that strange goings on are more than what they seem, and it's up to them to discover the truth hidden in the shadows of this strange land.",
                "_id": "0ea35733-6a32-4146-aed4-d1dd01631417"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Gardens of the Moon",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 1,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 666,
                "year": 1999,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1548497031i/55399.jpg",
                "_createdOn": 1764599686227,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "Vast legions of gods, mages, humans, dragons and all manner of creatures play out the fate of the Malazan Empire in this first book in a major epic fantasy series from Steven Erikson.\n\nThe Malazan Empire simmers with discontent, bled dry by interminable warfare, bitter infighting and bloody confrontations with the formidable Anomander Rake and his Tiste Andii, ancient and implacable sorcerers. Even the imperial legions, long inured to the bloodshed, yearn for some respite. Yet Empress Laseen's rule remains absolute, enforced by her dread Claw assassins.\n\nFor Sergeant Whiskeyjack and his squad of Bridgeburners, and for Tattersail, surviving cadre mage of the Second Legion, the aftermath of the siege of Pale should have been a time to mourn the many dead. But Darujhistan, last of the Free Cities of Genabackis, yet holds out. It is to this ancient citadel that Laseen turns her predatory gaze.\n\nHowever, it would appear that the Empire is not alone in this great game. Sinister, shadowbound forces are gathering as the gods themselves prepare to play their hand...\n\nConceived and written on a panoramic scale, Gardens of the Moon is epic fantasy of the highest order--an enthralling adventure by an outstanding new voice.",
                "_id": "277dfec1-7cea-4eab-9aa2-5456eb68eb6f"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Deadhouse Gates",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 2,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 604,
                "year": 2000,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1385272744i/55401.jpg",
                "_createdOn": 1764599686228,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "In the vast dominion of Seven Cities, in the Holy Desert Raraku, the seer Sha'ik and her followers prepare for the long-prophesied uprising known as the Whirlwind. Unprecedented in size and savagery, this maelstrom of fanaticism and bloodlust will embroil the Malazan Empire in one of the bloodiest conflicts it has ever known, shaping destinies and giving birth to legends . . .\n\nSet in a brilliantly realized world ravaged by dark, uncontrollable magic, Deadhouse Gates is a novel of war, intrigue and betrayal confirms Steven Eirkson as a storyteller of breathtaking skill, imagination and originality--a new master of epic fantasy.",
                "_id": "23405fcb-79df-49d7-a605-74e8a0a35de4"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Memories of Ice",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 3,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 925,
                "year": 2001,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1548497075i/175983.jpg",
                "_createdOn": 1764599686229,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "Marking the return of many characters from Gardens of the Moon and introducing a host of remarkable new players, Memories of Ice is both a momentous new chapter in Steven Erikson's magnificent epic fantasy and a triumph of storytelling. The ravaged continent of Genabackis has given birth to a terrifying new the Pannion Domin. Like a tide of corrupted blood, it seethes across the land, devouring all. In its path stands an uneasy Onearm's army and Whiskeyjack's Bridgeburners alongside their enemies of old--the forces of the Warlord Caladan Brood, Anomander Rake and his Tiste Andii mages, and the Rhivi people of the plains. But ancient undead clans are also gathering; the T'lan Imass have risen. For it would seem something altogether darker and more malign threatens this world. Rumors abound that the Crippled God is now unchained and intent on a terrible revenge.",
                "_id": "1eb22952-67f8-467b-b1c8-1fe291d50381"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "House of Chains",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 4,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 709,
                "year": 2002,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1548490548i/55398.jpg",
                "_createdOn": 1764599686230,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "In Northern Genabackis, a raiding party of tribal warriors descends from the mountains into the southern flat lands. Their intention is to wreak havoc among the despised lowlanders. But for the one named Karsa Orlong it marks the beginning of what will prove an extraordinary destiny.\n\nSome years later, it is the aftermath of the Chain of Dogs. Coltaine, revered commander of the Malazan 7th Army is dead. And now Tavore, elder sister of Ganoes Paran and Adjunct to the Empress, has arrived in the last remaining Malazan stronghold of the Seven Cities to take charge. Untested and new to command, she must hone a small army of twelve thousand soldiers, mostly raw recruits, into a viable fighting force and lead them into battle against the massed hordes of Sha'ik's Whirlwind. Her only hope lies in resurrecting the shattered faith of the few remaining survivors from Coltaine's legendary march, veterans one and all.\n\nIn distant Raraku, in the heart of the Holy Desert, the seer Sha'ik waits with her rebel army. But waiting is never easy. Her disparate collection of warlords - tribal chiefs, High Mages, a renegade Malazan Fist and his sorceror - is locked in a vicious power struggle that threatens to tear the rebellion apart from within. And Sha'ik herself suffers, haunted by the private knowledge of her nemesis, Tavore... her own sister.\n\nSo begins this pivotal new chapter in Steven Erikson's MALAZAN BOOK OF THE FALLEN - an epic novel of war, intrigue, magic and betrayal from a writer regarded as one of the most original, imaginative and exciting storytellers in fantasy today.",
                "_id": "528376b3-a72d-4ad4-b7c1-fcacb9e26de0"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Midnight Tides",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 5,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 960,
                "year": 2004,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1366996057i/345299.jpg",
                "_createdOn": 1764599686231,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "After decades of warfare, the five tribes of the Tiste Edur are united under the implacable rule of the Warlock King of the Hiroth. But the price of peace is a pact with a hidden power whose motives may be deadly. To the south, the expansionist kingdom of Lether has devoured all lesser neighbors - except the Tiste Edur.",
                "_id": "78d01cc0-04b3-4a8e-adae-7792992c5ef2"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Bonehunters",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 6,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 1203,
                "year": 2006,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1399934281i/478951.jpg",
                "_createdOn": 1764599686232,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "The Seven Cities Rebellion has been crushed. Sha'ik is dead. One last rebel force remains, holed up in the city of Y'Ghatan and under the fanatical command of Leoman of the Flails. The prospect of laying siege to this ancient fortress makes the battle-weary Malaz 14th Army uneasy. For it was here that the Empire's greatest champion Dassem Ultor was slain and a tide of Malazan blood spilled. A place of foreboding, its smell is of death. But elsewhere, agents of a far greater conflict have made their opening moves. The Crippled God has been granted a place in the pantheon, a schism threatens and sides must be chosen. Whatever each god decides, the ground-rules have changed, irrevocably, terrifyingly and the first blood spilled will be in the mortal world. A world in which a host of characters, familiar and new, including Heboric Ghost Hands, the possessed Apsalar, Cutter, once a thief now a killer, the warrior Karsa Orlong and the two ancient wanderers Icarium and Mappo, each searching for such a fate as they might fashion with their own hands, guided by their own will. If only the gods would leave them alone. But now that knives have been unsheathed, the gods are disinclined to be kind. There shall be war, war in the heavens.And the prize? Nothing less than existence itself...\n\n\nHere is the stunning new chapter in Steven Erikson magnificent 'Malazan Book of the Fallen' - hailed an epic of the imagination and acknowledged as a fantasy classic in the making.",
                "_id": "cf0cb13e-6719-41f4-b4fc-4064899cf081"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Reaper's Gale",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 7,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 1280,
                "year": 2007,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1403011403i/459064.jpg",
                "_createdOn": 1764599686233,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "A truly epic fantasy series that has confirmed its author as one of the most original and exciting genre storytellers in years.\n\nErikson’s ‘ Malazan Book of the Fallen ’ has been recognised the world-over by writers, critics and fans alike — in a recent review of The Bonehunters, the sixth chapter in this remarkable tale, the UK’s Interzone magazine hailed it ‘a masterpiece’ and ‘the benchmark for all future works in the field’, while the hugely influential genre website, Ottawa-based SF Site, declared ‘this series has clearly established itself as the most significant work of epic fantasy since Donaldson’s Chronicles of Thomas Covenant’.\n\nNow comes Reaper’s Gale — the seventh Tale of the Malazan Book of the Fallen — and neither Erikson nor the excitement are showing any sign of letting up. Mauled and now cut adrift by the Malazan Empire, Tavore and her now infamous 14th army have landed on the coast of a strange, unknown continent and find themselves facing an even more dangerous the Tiste Edur, a nightmarish empire pledged to serve the Crippled God…\n\nA brutal, harrowing novel of war, intrigue and dark, uncontrollable magic, this is fantasy at its most imaginative and storytelling at its most thrilling.",
                "_id": "1b53bf06-31c8-4e90-9337-2af799dbc498"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Toll the Hounds",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 8,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 1008,
                "year": 2008,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1442456749i/938544.jpg",
                "_createdOn": 1764599686234,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "In Darujhistan, the city of blue fire, it is said that love and death shall arrive dancing. It is summer and the heat is oppressive, but for the small round man in the faded red waistcoat, discomfiture is not just because of the sun. All is not well. Dire portents plague his nights and haunt the city streets like fiends of shadow. Assassins skulk in alleyways, but the quarry has turned and the hunters become the hunted.\n\nHidden hands pluck the strings of tyranny like a fell chorus. While the bards sing their tragic tales, somewhere in the distance can be heard the baying of Hounds...And in the distant city of Black Coral, where rules Anomander Rake, Son of Darkness, ancient crimes awaken, intent on revenge. It seems Love and Death are indeed about to arrive...hand in hand, dancing.\n\nA thrilling, harrowing novel of war, intrigue and dark, uncontrollable magic, Toll the Hounds is the new chapter in Erikson's monumental series - epic fantasy at its most imaginative and storytelling at its most exciting.",
                "_id": "8a24d781-ca32-416a-9e17-5c8a5d2eb999"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Dust of Dreams",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 9,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 889,
                "year": 2009,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1388268201i/4703427.jpg",
                "_createdOn": 1764599686235,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "In war everyone loses. This brutal truth can be seen in the eyes of every soldier in every world…\n\nIn Letherii, the exiled Malazan army commanded by Adjunct Tavore begins its march into the eastern Wastelands, to fight for an unknown cause against an enemy it has never seen.\n\nAnd in these same Wastelands, others gather to confront their destinies. The warlike Barghast, thwarted in their vengeance against the Tiste Edur, seek new enemies beyond the border and Onos Toolan, once immortal T'lan Imass now mortal commander of the White Face clan, faces insurrection. To the south, the Perish Grey Helms parlay passage through the treacherous kingdom of Bolkando. Their intention is to rendezvous with the Bonehunters but their vow of allegiance to the Malazans will be sorely tested. And ancient enclaves of an Elder Race are in search of salvation--not among their own kind, but among humans--as an old enemy draws ever closer to the last surviving bastion of the K'Chain Che'Malle.\n\nSo this last great army of the Malazan Empire is resolved to make one final defiant, heroic stand in the name of redemption. But can deeds be heroic when there is no one to witness them? And can that which is not witnessed forever change the world? Destines are rarely simple, truths never clear but one certainty is that time is on no one's side. For the Deck of Dragons has been read, unleashing a dread power that none can comprehend…\n\nIn a faraway land and beneath indifferent skies, the final chapter of 'The Malazan Book of the Fallen' has begun…",
                "_id": "a586e22b-87e5-44c4-a166-f6be149d4026"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Crippled God",
                "series": "Malazan Book of the Fallen",
                "numberInSeries": 10,
                "author": "Steven Erikson",
                "genre": "Fantasy",
                "pages": 921,
                "year": 2011,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1320388198i/8447255.jpg",
                "_createdOn": 1764599686236,
                "tags": [
                    "adult",
                    "epic-fantasy",
                    "grimdark"
                ],
                "description": "The Bonehunters march for Kolanse, led by Adjunct Tavore. This woman with no gifts of magic, deemed plain, unprepossessing, displaying nothing to instill loyalty or confidence, will challenge the gods - if her own mutinous troops don't kill her first.\n\nHer enemy, the Forkrul Assail, seek to cleanse the world, to annihilate everything. In the realm of Kurald Galain, home to the long lost city of Kharkanas, a refugees commanded by Yedan Derryg, the Watch, await the breaching of Lightfall, and the coming of the Tiste Liosan. In this war they cannot win, they will die in the name of an empty city and a queen with no subjects.\n\nElsewhere, the three Elder Gods, Kilmandaros, Errastas and Sechul Lath, work to shatter the chains binding Korabas, the Otataral Dragon. Against her force of utter devastation, no mortal can stand. At the Gates of Starvald Demelain, the Azath House sealing the portal is dying. Soon will come the Eleint, dragons, and a final cataclysm.",
                "_id": "59a19460-0190-45d7-9d85-3d5d9f048ac0"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "New Spring",
                "series": "The Wheel of Time",
                "numberInSeries": 0,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 423,
                "year": 2004,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1311355164i/8892653.jpg",
                "_createdOn": 1764599686237,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The prequel novel to the globally bestselling Wheel of Time series - a fantasy phenomenon\n\nThe city of Canluum lies close to the scarred and desolate wastes of the Blight, a walled haven from the dangers away to the north, and a refuge from the ill works of those who serve the Dark One. Or so it is said. The city that greets Al'Lan Mandragoran, exiled king of Malkier and the finest swordsman of his generation, is instead one that is rife with rumour and the whisperings of Shadowspawn. Proof, should he have required it, that the Dark One grows powerful once more and that his minions are at work throughout the lands.\n\nAnd yet it is within Canluum's walls that Lan will meet a woman who will shape his destiny. Moiraine is a young and powerful Aes Sedai who has journeyed to the city in search of a bondsman. She requires aid in a desperate quest to prove the truth of a vague and largely discredited prophecy - one that speaks of a means to turn back the shadow, and of a child who may be the dragon reborn.",
                "_id": "73e303f1-f91c-4cf1-8949-da34d322a446"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Eye of the World",
                "series": "The Wheel of Time",
                "numberInSeries": 1,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 800,
                "year": 1990,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1465920672i/8153988.jpg",
                "_createdOn": 1764599686238,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The Wheel of Time turns and Ages come and pass, leaving memories that become legend. Legend fades to myth, and even myth is long forgotten when the Age that gave it birth returns again. What was, what will be, and what is, may yet fall under the Shadow.\n\nMoiraine Damodred arrives in Emond’s Field on a quest to find the one prophesized to stand against The Dark One, a malicious entity sowing the seeds of chaos and destruction. When a vicious band of half-men, half beasts invade the village seeking their master’s enemy, Moiraine persuades Rand al’Thor and his friends to leave their home and enter a larger unimaginable world filled with dangers waiting in the shadows and in the light.",
                "_id": "daede8cc-eafd-499a-9b32-f0c7dc4f48d3"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Great Hunt",
                "series": "The Wheel of Time",
                "numberInSeries": 2,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 705,
                "year": 1990,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1506238578i/8153989.jpg",
                "_createdOn": 1764599686239,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The Forsaken are loose, the Horn of Valere has been found and the Dead are rising from their dreamless sleep. The Prophecies are being fulfilled - but Rand al'Thor, the shepherd the Aes Sedai have proclaimed as the Dragon Reborn, desperately seeks to escape his destiny.\n\nRand cannot run for ever. With every passing day the Dark One grows in strength and strives to shatter his ancient prison, to break the Wheel, to bring an end to Time and sunder the weave of the Pattern.\n\nAnd the Pattern demands the Dragon.",
                "_id": "144158ce-53fe-4994-9488-47d644911b05"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Dragon Reborn",
                "series": "The Wheel of Time",
                "numberInSeries": 3,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 624,
                "year": 1991,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1328309587i/8153990.jpg",
                "_createdOn": 1764599686240,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The Dragon Reborn—the leader long prophesied who will save the world, but in the saving destroy it; the savior who will run mad and kill all those dearest to him—is on the run from his destiny.\n\nAble to touch the One Power, but unable to control it, and with no one to teach him how—for no man has done it in three thousand years—Rand al'Thor knows only that he must face the Dark One. But how?\n\nWinter has stopped the war—almost—yet men are dying, calling out for the Dragon. But where is he?\n\nPerrin Aybara is in pursuit with Moiraine Sedai, her Warder Lan, and Loial the Ogier. Bedeviled by dreams, Perrin is grappling with another deadly problem—how is he to escape the loss of his own humanity?\n\nEgwene, Elayne and Nynaeve are approaching Tar Valon, where Mat will be healed—if he lives until they arrive. But who will tell the Amyrlin their news—that the Black Ajah, long thought only a hideous rumor, is all too real? They cannot know that in Tar Valon far worse awaits...\n\nAhead, for all of them, in the Heart of the Stone, lies the next great test of the Dragon reborn....",
                "_id": "21308944-5938-4cf8-bbfb-c2d419f6860e"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Shadow Rising",
                "series": "The Wheel of Time",
                "numberInSeries": 4,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 1007,
                "year": 1992,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1328309590i/8153991.jpg",
                "_createdOn": 1764599686241,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The seals of Shayol Ghul are weak now, and the Dark One reaches out. The Shadow is rising to cover humankind.\n\nIn Tar Valon, Min sees portents of hideous doom. Will the White Tower itself be broken?\n\nIn the Two Rivers, the Whitecloaks ride in pursuit of a man with golden eyes, and in pursuit of the Dragon Reborn.\n\nIn Cantorin, among the Sea Folk, High Lady Suroth plans the return of the Seanchan armies to the mainland.\n\nIn the Stone of Tear, the Lord Dragon considers his next move. It will be something no one expects, not the Black Ajah, not Tairen nobles, not Aes Sedai, not Egwene or Elayne or Nynaeve.\n\nAgainst the Shadow rising stands the Dragon Reborn.....",
                "_id": "6881f7fc-8b5e-4722-be90-5f129fabac0a"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Fires of Heaven",
                "series": "The Wheel of Time",
                "numberInSeries": 5,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 989,
                "year": 1993,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1627891529i/8148129.jpg",
                "_createdOn": 1764599686242,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "Prophesized to defeat the Dark One, Rand al'Thor, the Dragon Reborn, has upset the balance of power across the land. Shaido Aiel are on the march, ravaging everything in their path. The White Tower's Amyrlin has been deposed, turning the Aes Sedai against one another. The forbidden city of Rhuidean is overrun by Shadowspawn.\n\nDespite the chaos swirling around him, Rand continues to learn how to harness his abilities, determined to wield the One Power--and ignoring the counsel of Moiraine Damodred at great cost.",
                "_id": "18d8f73e-9efc-4417-b913-f91338584567"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Lord of Chaos",
                "series": "The Wheel of Time",
                "numberInSeries": 6,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 1011,
                "year": 1994,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1328331731i/11203969.jpg",
                "_createdOn": 1764599686243,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "On the slopes of Shayol Ghul, the Myrddraal swords are forged, and the sky is not the sky of this world ...\n\nIn Salidar the White Tower in exile prepares an embassy to Caemlyn, where Rand Al'Thor, the Dragon Reborn, holds the throne -- and where an unexpected visitor may change the world ...\n\nIn Emond's Field, Perrin Goldeneyes, Lord of the Two Rivers, feels the pull of ta'veren to ta'veren and prepares to march ...\n\nMorgase of Caemlyn finds a most unexpected, and quite unwelcome, ally ...\n\nAnd south lies Illian, where Sammael holds sway ...",
                "_id": "86f42aa4-57e1-480b-8a9f-b8a853754948"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "A Crown of Swords",
                "series": "The Wheel of Time",
                "numberInSeries": 7,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 684,
                "year": 1996,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1328331735i/11203971.jpg",
                "_createdOn": 1764599686244,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The war for humanity's survival has begun.\n\nRand al'Thor, the Dragon Reborn, has escaped the snares of the White Tower and the first of the rebel Aes Sedai have sworn to follow him. Attacked by the servants of the Dark, threatened by the invading Seanchan, Rand rallies his forces and brings battle to bear upon Illian, stronghold of Sammael the Forsaken . . .\n\nIn the city of Ebou Dar, Elayne, Aviendha and Mat struggle to secure the ter'angreal that can break the Dark One's hold on the world's weather - and an ancient bane moves to oppose them. In the town of Salidar, Egwene al'Vere gathers an army to reclaim Tar Valon and reunite the Aes Sedai . . .\n\nAnd in Shadar Logoth, city of darkness, a terrible power awakens . . .",
                "_id": "4135cbb0-9ffc-4246-8165-2a2d108a8252"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Path of Daggers",
                "series": "The Wheel of Time",
                "numberInSeries": 8,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 685,
                "year": 1998,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1763068419i/75031540.jpg",
                "_createdOn": 1764599686245,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The Seanchan invasion force is in possession of Ebou Dar. Nynaeve, Elayne, and Aviendha head for Caemlyn and Elayne's rightful throne, but on the way they discover an enemy much worse than the Seanchan.\n\nIn Illian, Rand vows to throw the Seanchan back as he did once before. But signs of madness are appearing among the Asha'man.\n\nIn Ghealdan, Perrin faces the intrigues of Whitecloaks, Seanchan invaders, the scattered Shaido Aiel, and the Prophet himself. Perrin's beloved wife, Faile, may pay with her life, and Perrin himself may have to destroy his soul to save her.\n\nMeanwhile the rebel Aes Sedai under their young Amyrlin, Egwene al'Vere, face an army that intends to keep them away from the White Tower. But Egwene is determined to unseat the usurper Elaida and reunite the Aes Sedai. She does not yet understand the price that others—and she herself—will pay.",
                "_id": "a2dcc30c-4f95-4a1b-83a4-5a7418a2c9f2"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Winter's Heart",
                "series": "The Wheel of Time",
                "numberInSeries": 9,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 780,
                "year": 2000,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1316032011i/8479487.jpg",
                "_createdOn": 1764599686246,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "Rand is on the run with Min, and in Cairhein, Cadsuane is trying to figure out where he is headed. Rand's destination is, in fact, one she has never considered.\n\nMazrim Taim, leader of the Black Tower, is revealed to be a liar. But what is he up to?\n\nFaile, with the Aiel Maidens, Bain and Chiad, and her companions, Queen Alliandre and Morgase, is prisoner of Savanna's sept.\n\nPerrin is desperately searching for Faile. With Elyas Machera, Berelain, the Prophet and a very mixed \"army\" of disparate forces, he is moving through country rife with bandits and roving Seanchan. The Forsaken are ever more present, and united, and the man called Slayer stalks Tel'aran'rhiod and the wolfdream.\n\nIn Ebou Dar, the Seanchan princess known as Daughter of the Nine Moons arrives--and Mat, who had been recuperating in the Tarasin Palace, is introduced to her. Will the marriage that has been foretold come about?\n\nThere are neither beginnings or endings to the turning of the Wheel of Time. But it is a beginning....",
                "_id": "544aa42c-19cb-45ce-abe9-161e80efeede"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Crossroads of Twilight",
                "series": "The Wheel of Time",
                "numberInSeries": 10,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 704,
                "year": 2003,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1364691484i/11183587.jpg",
                "_createdOn": 1764599686247,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "Fleeing from Ebou Dar with the kidnapped Daughter of the Nine Moons, whom he is fated to marry, Mat Cauthon learns that he can neither keep her nor let her go, not in safety for either of them, for both the Shadow and the might of the Seanchan Empire are in deadly pursuit.\n\nPerrin Aybara seeks to free his wife, Faile, a captive of the Shaido, but his only hope may be an alliance with the enemy. Can he remain true to his friend Rand and to himself? For his love of Faile, Perrin is willing to sell his soul.\n\nAt Tar Valon, Egwene al'Vere, the young Amyrlin of the rebel Aes Sedai, lays siege to the heart of Aes Sedai power, but she must win quickly, with as little bloodshed as possible, for unless the Aes Sedai are reunited, only the male Asha'man will remain to defend the world against the Dark One, and nothing can hold the Asha'man themselves back from total power except the Aes Sedai and a unified White Tower.\n\nIn Andor, Elayne Trakland fights for the Lion Throne that is hers by right, but enemies and Darkfriends surround her, plotting her destruction. If she fails, Andor may fall to the Shadow, and the Dragon Reborn with it.\n\nRand al'Thor, the Dragon Reborn himself, has cleansed the Dark One's taint from the male half of the True Source, and everything has changed. Yet nothing has, for only men who can channel believe that saidin is clean again, and a man who can channel is still hated and feared-even one prophesied to save the world. Now, Rand must gamble again, with himself at stake, and he cannot be sure which of his allies are really enemies. ",
                "_id": "9c9d685c-a580-4aca-96db-492aba5b0ee3"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Knife of Dreams",
                "series": "The Wheel of Time",
                "numberInSeries": 11,
                "author": "Robert Jordan",
                "genre": "Fantasy",
                "pages": 860,
                "year": 2005,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1328321554i/8260859.jpg",
                "_createdOn": 1764599686248,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The dead are walking, men die impossible deaths, and it seems as though reality itself has become unstable: All are signs of the imminence of Tarmon Gai'don, the Last Battle, when Rand al'Thor, the Dragon Reborn, must confront the Dark One as humanity's only hope. But Rand dares not fight until he possesses all the surviving seals on the Dark One's prison and has dealt with the Seanchan, who threaten to overrun all nations this side of the Aryth Ocean and increasingly seem too entrenched to be fought off. But his attempt to make a truce with the Seanchan is shadowed by treachery that may cost him everything. Whatever the price, though, he must have that truce. And he faces other dangers.\n\nThe winds of time have become a storm, and things that everyone believes are fixed in place forever are changing before their eyes. Even the White Tower itself is no longer a place of safety. Now Rand, Perrin and Mat, Egwene and Elayne, Nynaeve and Lan, and even Loial, must ride those storm winds, or the Dark One will triumph.",
                "_id": "909f2088-397d-42e0-b697-f97dd2d28f91"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "The Gathering Storm",
                "series": "The Wheel of Time",
                "numberInSeries": 12,
                "author": "Robert Jordan & Brandon Sanderson",
                "genre": "Fantasy",
                "pages": 824,
                "year": 2009,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1412064722i/22522646.jpg",
                "_createdOn": 1764599686249,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "Tarmon Gai'don, the Last Battle, looms. And mankind is not ready.\n\nThe final volume of the Wheel of Time, A Memory of Light, was partially written by Robert Jordan before his untimely passing in 2007. Brandon Sanderson, New York Times bestselling author of the Mistborn books, and now Stormlight Archive, among others, was chosen by Jordan's editor--his wife, Harriet McDougal--to complete the final volume, later expanded to three books.\n\nIn this epic novel, Robert Jordan's international bestselling series begins its dramatic conclusion. Rand al'Thor, the Dragon Reborn, struggles to unite a fractured network of kingdoms and alliances in preparation for the Last Battle. As he attempts to halt the Seanchan encroachment northward--wishing he could form at least a temporary truce with the invaders--his allies watch in terror the shadow that seems to be growing within the heart of the Dragon Reborn himself.\n\nEgwene al'Vere, the Amyrlin Seat of the rebel Aes Sedai, is a captive of the White Tower and subject to the whims of their tyrannical leader. As days tick toward the Seanchan attack she knows is imminent, Egwene works to hold together the disparate factions of Aes Sedai while providing leadership in the face of increasing uncertainty and despair. Her fight will prove the mettle of the Aes Sedai, and her conflict will decide the future of the White Tower--and possibly the world itself.",
                "_id": "70f11040-4ef0-4b91-959b-ad2d8ea667cd"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "Towers of Midnight",
                "series": "The Wheel of Time",
                "numberInSeries": 13,
                "author": "Robert Jordan & Brandon Sanderson",
                "genre": "Fantasy",
                "pages": 863,
                "year": 2010,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1418113446i/23168792.jpg",
                "_createdOn": 1764599686250,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The end draws near....\n\nThe Last Battle has started. The seals on the Dark One’s prison are crumbling. The Pattern itself is unraveling, and the armies of the Shadow have begun to boil out of the Blight.\n\nThe sun has begun to set upon the Third Age.\n\nPerrin Aybara is now hunted by specters from his past: Whitecloaks, a slayer of wolves, and the responsibilities of leadership. All the while, an unseen foe is slowly pulling a noose tight around his neck. To prevail, he must seek answers in Tel’aran’rhiod and find a way--at long last--to master the wolf within him or lose himself to it forever\n\nMeanwhile, Matrim Cauthon prepares for the most difficult challenge of his life. The creatures beyond the stone gateways--the Aelfinn and the Eelfinn--have confused him, taunted him, and left him hanged, his memory stuffed with bits and pieces of other men’s lives. He had hoped that his last confrontation with them would be the end of it, but the Wheel weaves as the Wheel wills. The time is coming when he will again have to dance with the Snakes and the Foxes, playing a game that cannot be won. The Tower of Ghenjei awaits, and its secrets will reveal the fate of a friend long lost.\n\nThis penultimate novel of Robert Jordan’s #1 New York Times bestselling series--the second of three based on materials he left behind when he died in 2007--brings dramatic and compelling developments to many threads in the Pattern. The end draws near.\n\nDovie’andi se tovya sagain. It’s time to toss the dice.",
                "_id": "3d0b3913-b09d-4cf3-9f47-d2aece98759a"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "A Memory of Light",
                "series": "The Wheel of Time",
                "numberInSeries": 14,
                "author": "Robert Jordan & Brandon Sanderson",
                "genre": "Fantasy",
                "pages": 912,
                "year": 2013,
                "coverUrl": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1647270202i/7743175.jpg",
                "_createdOn": 1764599686251,
                "tags": [
                    "epic-fantasy",
                    "classic"
                ],
                "description": "The Wheel of Time turns and Ages come and go, leaving memories that become legend. Legend fades to myth, and even myth is long forgotten when the Age that gave it birth returns again. In the Third Age, an Age of Prophecy, the World and Time themselves hang in the balance. What was, what will be, and what is, may yet fall under the Shadow.\n\nWhen Robert Jordan died in 2007, all feared that these concluding scenes would never be written. But working from notes and partials left by Jordan, established fantasy writer Brandon Sanderson stepped in to complete the masterwork. With The Gathering Storm (Book 12) and Towers of Midnight (Book 13) behind him, Sanderson now re-creates the vision that Robert Jordan left behind.\n\nEdited by Jordan's widow, who edited all of Jordan's books, A Memory of Light will delight, enthrall, and deeply satisfy all of Jordan's legions of readers.\n\nThe Wheel of Time turns, and Ages come and pass.\nWhat was, what will be, and what is,\nmay yet fall under the Shadow.\nLet the Dragon ride again on the winds of time.",
                "_id": "8bee0f72-6877-4e06-9a2a-027a0b151a61"
            }
        ],
        reviews: [
            {
                "bookId": "101b4a2f-fd3d-4552-a2de-026a73cf8e5e",
                "reviewContent": "6/5 if BR would allow it. A cut above. Incredible. My book of the year.\n\nI started this series back in 2020 when Mike from Mike's Book Reviews on Youtube was reading it. He discovered it and mentioned he was reading it in one of his videos and despite the series being incredibly under the radar at the time my library had a copy of Empire of Silence. I was in the mood for sci fi so I thought what the hell I'll read along with Mike. That is how an epic journey starts with a small step. Each book escalated my interest and my advocacy for this series and on November 18, 2025 I began the end (an ending iykyk). What followed was an S tier reading experience that consumed every bit of my entertainment time for the last 2 weeks. I savored it like a fine dining meal I didn't want to end.\n\nThis book starts, as you might expect, a bit of time after the end of Disquiet Gods and starts hurtling toward \"what must be\". Even knowing where it was going from the beginning, the amount of anxiety I felt at points in this book shows you that Ruocchio was in his bag here. I'm not going to summarize the book because there would be spoilers and simply too much to cover, but what I can say is what made this my book of the year.\n\nFirst, I think Ruocchio's character work here is some of the best in the series. Some of the best scenes in this entire series are in this book and they aren't action sequences or trippy mind bending stuff but the scenes where it may just be two characters in a room talking. You not only get amazing lore drops but you also get some fantastic dialogue and characterization. These scenes have incredible weight. There were even some characters that didn't get introduced until Disquiet Gods that get some great development here. It was a pleasure to read. I think there is one fairly glaring exception, but I'll cover that later.\n\nSecond, in my opinion this is the best paced book in the series. I don't say that because it has non-stop action sequences. I say that because of the first point I made in this review. Some of the \"slower\" quieter moments are some of my favorites. In addition to that I think Ruocchio leveled up his action writing as well. There's plenty of it here and it is utilized in the best way possible. It holds your attention and gets your blood up, but none of these sequences felt overly long or draggy. They are also spaced out well throughout the text.\n\nThird, some of the lore, worldbuilding, and I don't know what to call it but \"cosmic trippy shit\" is dialed to 11 here. There are several chapters that while I was reading it I had to just pause and say \"This is something special here.\" There are a few chapters that are a conversation with a new character that shows up in this book that were utterly captivating from a lore perspective. There is another \"trippy\" chapter that almost had me throwing my kindle across the room. There were some chapters that would be right at home in a top tier horror novel. I was captivated 100 percent of the time.\n\nFourth, the ending I found incredibly satisfying and cathartic. Is Ruocchio going to spoonfeed you all the answers? No but I think by now we probably should realize that. What he does do is giving you what you know is coming but in ways you may not expect at all. It's handled in way that concludes the story of the Sun Eater and justifies not telling you any more than you need to know. It absolutely leaves you wanting more in the way that all the best performances or pieces of art do. It's also a full conclusion while leaving questions and openings to continue to write more in this world. Also, going back to the characters for a moment, there are just some fantastic moments near the conclusion that are just fantastic concluding arcs for side characters where they really get their time to shine. Just wonderful.\n\nWhat didn't I like? Not much honestly. This was everything I wanted and could have asked for. I do have a couple of minor complaints. First, even though I think this book has Ruocchio's best character work it sadly has one character that didn't get that treatment, Cassandra. She was the weak link in Disquiet Gods for me, and despite some early promise in this book and some memorable scenes early she really disappointed me overall. In the back half of the book she just doesn't do much besides say \"Abba!\" a lot and not want to get left behind. It's wild to me to hear Ruocchio say he considers her such an important character when there are several other characters who have far less page time that get way more development. My second complaint, if you want to call it that, is there are times when I was reading, particularly toward the end, where it felt like there were allusions and references being made that were important but I simply wasn't able to pick up on my own. I realize this is a me problem and asking for clarification leads to good book conversation but it did feel slightly over my head at times.\n\nAll that being said, I was telling others that were also reading the book that as I was reading I could tell that this book (and series honestly) is something special. Not just another work of sci fi or fantasy. Some books are like that for me. I can't explain it fully, but as I'm reading it I know that this isn't like other stuff I've read. I had that feeling with all my all time favorites like A Song of Ice and Fire, King Killer Chronicle, Second Apocalypse, and now Sun Eater. These series and books are a cut above even other books I love even inclusive of flaws. I'm sad I won't be able to experience it again for the first time but what a ride.",
                "_createdOn": 1764963515729,
                "_updatedOn": 1764963785890,
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "_id": "d3a3974f-da4b-49c7-b506-babda3123cf7"
            },
            {
                "bookId": "82107d6e-81c6-4f34-81e3-e9dcb97984bc",
                "reviewContent": "Empire of Silence is a stunning debut that combines the epic scale of Dune with the character-driven narrative of The Name of the Wind. Hadrian Marlowe is a compelling protagonist whose journey from aristocrat to gladiator to soldier is both tragic and inspiring. Ruocchio's prose is beautiful and evocative, painting vivid pictures of alien worlds and ancient civilizations. The worldbuilding is incredibly rich, blending science fiction and fantasy elements seamlessly. My only criticism is the pacing in the middle section, which drags a bit, but the payoff is absolutely worth it. Can't wait to continue the series!",
                "_createdOn": 1764965000000,
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "_id": "review-user-1"
            },
            {
                "bookId": "277dfec1-7cea-4eab-9aa2-5456eb68eb6f",
                "reviewContent": "Gardens of the Moon is a challenging but rewarding read. Erikson drops you into the deep end of his complex world without much explanation, which can be disorienting at first. However, once you start piecing together the various plotlines and understanding the magic system, it becomes incredibly satisfying. The Bridgeburners are some of the best military characters I've read in fantasy. The scope is massive, and while it took me two attempts to get through it, I'm so glad I stuck with it. This is fantasy for readers who want to work for their payoff.",
                "_createdOn": 1764966000000,
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "_id": "review-user-2"
            },
            {
                "bookId": "00cea304-fff3-4b3f-b015-ddd4a03fa871",
                "reviewContent": "Howling Dark takes everything great about Empire of Silence and amplifies it. The stakes are higher, the worldbuilding deeper, and Hadrian's character development is phenomenal. The sequences with the Cielcin are genuinely unsettling and make them feel like a real alien threat rather than just monsters. Ruocchio's exploration of what it means to be human in the face of the truly alien is thought-provoking. The ending left me desperate for the next book.",
                "_createdOn": 1764967000000,
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "_id": "review-peter-1"
            },
            {
                "bookId": "fcd39f63-7e0b-423c-8aec-1838b29a162e",
                "reviewContent": "Dark Age is a brutal, devastating masterpiece. Pierce Brown takes everything you love about this series and puts it through a meat grinder. The multiple POV structure works brilliantly here, showing the fractured state of the Republic and the Rising from all angles. Darrow's descent into darkness is painful to watch but feels earned. Lysander's chapters are surprisingly compelling—his idealism clashing with the reality of the Society creates fascinating tension. Lyria's storyline adds a grounded perspective that the series needed. The ending left me reeling. This is grimdark space opera at its finest.",
                "_createdOn": 1764968000000,
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "_id": "review-peter-2"
            },
            {
                "bookId": "952d7634-53b9-48c6-ab9b-3f7ef52c39e1",
                "reviewContent": "The Black Company is the book that started it all for grimdark fantasy. Glen Cook's no-nonsense, military-focused storytelling is refreshing in a genre that can sometimes get bogged down in flowery prose. These are soldiers doing their jobs, and the moral ambiguity is what makes it so compelling. You're never quite sure if the Company are the good guys or not, and that's the point. The annals-style narration gives it a unique flavor. Essential reading for any fantasy fan.",
                "_createdOn": 1764969000000,
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "_id": "review-admin-2"
            },
            {
                "bookId": "17935d4a-9ca4-478d-bdf5-86a3906d41a9",
                "reviewContent": "Empire of the Dawn is everything I loved about Empire of the Vampire turned up to eleven. Jay Kristoff's prose is as gorgeous and brutal as ever. Gabriel's quest for vengeance drives the plot relentlessly forward, but the character development never takes a backseat. The world of eternal night continues to be one of the most atmospheric settings in fantasy. The vampire lore and mythology are rich and compelling. The twist near the end absolutely destroyed me.",
                "_createdOn": 1764970000000,
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "_id": "review-user-3"
            },
            {
                "bookId": "17935d4a-9ca4-478d-bdf5-86a3906d41a9",
                "reviewContent": "Empire of the Dawn absolutely wrecked me. The father-daughter stuff between Gabriel and Dior is brutal in the best way, and the ending is going to live rent free in my head for a long time.",
                "_createdOn": 1764970000000,
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "_id": "review-user-3"
            },
            {
                "bookId": "c16329f7-a90c-4228-835d-77a14d69bf64",
                "reviewContent": "Empire of the Vampire is basically tailor-made for me: bleak world, gorgeous prose, and a main character who is a complete disaster but impossible to look away from. One of my all-time favorite vampire books.",
                "_createdOn": 1764975200000,
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "_id": "review-mitko-1"
            },
            {
                "bookId": "2d172481-4848-47fe-bf71-9c1e51b98773",
                "reviewContent": "Light Bringer felt like coming home and getting punched in the face at the same time. The character work is insane and there are several moments that had me just staring at the page in shock.",
                "_createdOn": 1764975250000,
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "_id": "review-mitko-2"
            },
            {
                "bookId": "c16329f7-a90c-4228-835d-77a14d69bf64", // Empire of the Vampire
                "reviewContent": "Empire of the Vampire is exactly the kind of gloomy, bloody epic I love. The framing device works so well and the emotional beats land hard.",
                "_createdOn": 1764978400000,
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "_id": "review-elena-1"
            },
            {
                "bookId": "277dfec1-7cea-4eab-9aa2-5456eb68eb6f", // Gardens of the Moon
                "reviewContent": "Gardens of the Moon is confusing at first, but on a reread the character arcs and worldbuilding really pay off. It absolutely rewards patience.",
                "_createdOn": 1764978450000,
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "_id": "review-elena-2"
            },
            {
                "bookId": "2d172481-4848-47fe-bf71-9c1e51b98773", // Light Bringer
                "reviewContent": "Light Bringer somehow raises the stakes again. The political manoeuvring and the last third had me completely wired.",
                "_createdOn": 1764978500000,
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "_id": "review-ivan-1"
            },
            {
                "bookId": "2aff9c38-d4ab-481b-87d0-20c114a46a67", // Red Rising
                "reviewContent": "Red Rising is still one of the most fun and brutal sci-fi books I have read. The academy arc never gets old.",
                "_createdOn": 1764978550000,
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "_id": "review-ivan-2"
            }
        ],
        ratings: [
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "bookId": "101b4a2f-fd3d-4552-a2de-026a73cf8e5e",
                "stars": 5,
                "_createdOn": 1764964261822,
                "_id": "2425b21e-2fc3-44c0-ba26-29a3916ee5f9"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "bookId": "82107d6e-81c6-4f34-81e3-e9dcb97984bc",
                "stars": 5,
                "_createdOn": 1764964300000,
                "_id": "rating-admin-2"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "bookId": "2aff9c38-d4ab-481b-87d0-20c114a46a67",
                "stars": 4,
                "_createdOn": 1764964400000,
                "_id": "rating-admin-3"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "bookId": "277dfec1-7cea-4eab-9aa2-5456eb68eb6f",
                "stars": 5,
                "_createdOn": 1764964500000,
                "_id": "rating-admin-4"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "bookId": "82107d6e-81c6-4f34-81e3-e9dcb97984bc",
                "stars": 5,
                "_createdOn": 1764965100000,
                "_id": "rating-user-1"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "bookId": "277dfec1-7cea-4eab-9aa2-5456eb68eb6f",
                "stars": 4,
                "_createdOn": 1764966100000,
                "_id": "rating-user-2"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "bookId": "17935d4a-9ca4-478d-bdf5-86a3906d41a9",
                "stars": 5,
                "_createdOn": 1764970100000,
                "_id": "rating-user-3"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "bookId": "fcd39f63-7e0b-423c-8aec-1838b29a162e",
                "stars": 4,
                "_createdOn": 1764971000000,
                "_id": "rating-user-4"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "bookId": "00cea304-fff3-4b3f-b015-ddd4a03fa871",
                "stars": 5,
                "_createdOn": 1764967100000,
                "_id": "rating-peter-1"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "bookId": "fcd39f63-7e0b-423c-8aec-1838b29a162e",
                "stars": 5,
                "_createdOn": 1764968100000,
                "_id": "rating-peter-2"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "bookId": "82107d6e-81c6-4f34-81e3-e9dcb97984bc",
                "stars": 4,
                "_createdOn": 1764969000000,
                "_id": "rating-peter-3"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "bookId": "101b4a2f-fd3d-4552-a2de-026a73cf8e5e",
                "stars": 5,
                "_createdOn": 1764972000000,
                "_id": "rating-peter-4"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "bookId": "101b4a2f-fd3d-4552-a2de-026a73cf8e5e",
                "stars": 5,
                "_createdOn": 1764972000000,
                "_id": "rating-peter-4"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "bookId": "c16329f7-a90c-4228-835d-77a14d69bf64", // Empire of the Vampire
                "stars": 5,
                "_createdOn": 1764975300000,
                "_id": "rating-mitko-1"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "bookId": "17935d4a-9ca4-478d-bdf5-86a3906d41a9", // Empire of the Dawn
                "stars": 5,
                "_createdOn": 1764975350000,
                "_id": "rating-mitko-2"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "bookId": "101b4a2f-fd3d-4552-a2de-026a73cf8e5e", // Shadows Upon Time
                "stars": 5,
                "_createdOn": 1764975400000,
                "_id": "rating-mitko-3"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "bookId": "2d172481-4848-47fe-bf71-9c1e51b98773", // Light Bringer
                "stars": 5,
                "_createdOn": 1764975450000,
                "_id": "rating-mitko-4"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "bookId": "c16329f7-a90c-4228-835d-77a14d69bf64", // Empire of the Vampire
                "stars": 5,
                "_createdOn": 1764978600000,
                "_id": "rating-elena-1"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "bookId": "17935d4a-9ca4-478d-bdf5-86a3906d41a9", // Empire of the Dawn
                "stars": 5,
                "_createdOn": 1764978650000,
                "_id": "rating-elena-2"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "bookId": "277dfec1-7cea-4eab-9aa2-5456eb68eb6f", // Gardens of the Moon
                "stars": 4,
                "_createdOn": 1764978700000,
                "_id": "rating-elena-3"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "bookId": "2d172481-4848-47fe-bf71-9c1e51b98773", // Light Bringer
                "stars": 5,
                "_createdOn": 1764978750000,
                "_id": "rating-ivan-1"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "bookId": "fcd39f63-7e0b-423c-8aec-1838b29a162e", // Dark Age
                "stars": 5,
                "_createdOn": 1764978800000,
                "_id": "rating-ivan-2"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "bookId": "2aff9c38-d4ab-481b-87d0-20c114a46a67", // Red Rising
                "stars": 5,
                "_createdOn": 1764978850000,
                "_id": "rating-ivan-3"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "bookId": "f9a471df-5c1e-4a72-b467-0726400778b7", // Red God
                "stars": 4,
                "_createdOn": 1764978900000,
                "_id": "rating-ivan-4"
            }
        ],
        comments: [
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "content": "That's a great review! I completely agree with your points, especially about the character development and pacing. Ruocchio really outdid himself in this one.",
                "_createdOn": 1764964261822,
                "_id": "0a272c58-b7ea-4e09-a000-7ec988248f66"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "content": "This review convinced me to finally pick up the series! I've had Empire of Silence on my TBR for ages.",
                "_createdOn": 1764965200000,
                "_id": "comment-user-1"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "content": "I just finished this yesterday and wow, what an ending. Your review captures exactly how I felt about it.",
                "_createdOn": 1764967200000,
                "_id": "comment-peter-1"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "reviewId": "review-user-1",
                "content": "Great review! The Dune comparison is spot on. Hadrian's story arc really does have that epic scope.",
                "_createdOn": 1764965300000,
                "_id": "comment-admin-2"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "review-user-2",
                "content": "I had the exact same experience with Gardens of the Moon! It took me two tries but once it clicked, I was hooked.",
                "_createdOn": 1764966200000,
                "_id": "comment-peter-2"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "reviewId": "review-peter-2",
                "content": "Dark Age hit different. Pierce Brown really wasn't holding back. Lysander's POV chapters were surprisingly good!",
                "_createdOn": 1764968200000,
                "_id": "comment-user-2"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "review-user-3",
                "content": "Kristoff's writing is absolutely brutal in the best way. Gabriel's journey just keeps getting darker!",
                "_createdOn": 1764970200000,
                "_id": "comment-peter-3"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "review-user-3",
                "content": "Kristoff really said: 'what if we just hurt them emotionally on every page?'",
                "_createdOn": 1764970200000,
                "_id": "comment-peter-3"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "content": "Sun Eater has set such a high bar it’s actually hard to pick up other sci-fi now. This review nails exactly why.",
                "_createdOn": 1764975400000,
                "_id": "comment-mitko-1"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "reviewId": "review-user-2",
                "content": "Same experience with Gardens of the Moon – total confusion at first, then suddenly everything clicks and it becomes incredible.",
                "_createdOn": 1764975450000,
                "_id": "comment-mitko-2"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "reviewId": "review-peter-2",
                "content": "Dark Age is pure suffering but I loved every second. That ending still haunts me.",
                "_createdOn": 1764975500000,
                "_id": "comment-mitko-3"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "reviewId": "review-user-3",
                "content": "Totally agree, Empire of the Dawn left me in a mini reading slump too. Hard to move on after that ending.",
                "_createdOn": 1764979000000,
                "_id": "comment-elena-1"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "reviewId": "review-peter-2",
                "content": "Dark Age is just pure pain. I love how your review mentions how relentless it feels.",
                "_createdOn": 1764979050000,
                "_id": "comment-elena-2"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "content": "Your breakdown of Hadrian's arc is spot on. This series really does keep getting better with every book.",
                "_createdOn": 1764979100000,
                "_id": "comment-elena-3"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "reviewId": "review-user-1",
                "content": "This was the review that finally pushed me to start Empire of Silence, no regrets at all.",
                "_createdOn": 1764979150000,
                "_id": "comment-ivan-1"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "reviewId": "review-user-2",
                "content": "Nice point about needing to trust Erikson. It really does all click after a while.",
                "_createdOn": 1764979200000,
                "_id": "comment-ivan-2"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "reviewId": "review-admin-2",
                "content": "Love that you highlighted how Red Rising stands on its own even if you only read book one.",
                "_createdOn": 1764979250000,
                "_id": "comment-ivan-3"
            }
        ],
        reviewLikes: [
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "_createdOn": 1765046038628,
                "_id": "2eeaafe2-92d1-4cf0-827a-821fc15a4035"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "_createdOn": 1764965250000,
                "_id": "like-user-1"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "_createdOn": 1764967250000,
                "_id": "like-peter-1"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "reviewId": "review-user-1",
                "_createdOn": 1764965350000,
                "_id": "like-admin-2"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "review-user-1",
                "_createdOn": 1764965450000,
                "_id": "like-peter-2"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "reviewId": "review-user-2",
                "_createdOn": 1764966250000,
                "_id": "like-admin-3"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "reviewId": "review-peter-1",
                "_createdOn": 1764967350000,
                "_id": "like-user-3"
            },
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "reviewId": "review-peter-2",
                "_createdOn": 1764968350000,
                "_id": "like-admin-4"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "reviewId": "review-admin-2",
                "_createdOn": 1764969200000,
                "_id": "like-user-4"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "review-user-3",
                "_createdOn": 1764970250000,
                "_id": "like-peter-4"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "reviewId": "review-user-3",
                "_createdOn": 1764970250000,
                "_id": "like-peter-4"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "_createdOn": 1764975600000,
                "_id": "like-mitko-1"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "reviewId": "review-user-1",
                "_createdOn": 1764975650000,
                "_id": "like-mitko-2"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "reviewId": "review-user-2",
                "_createdOn": 1764975700000,
                "_id": "like-mitko-3"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "reviewId": "review-peter-2",
                "_createdOn": 1764975750000,
                "_id": "like-mitko-4"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "reviewId": "review-user-3",
                "_createdOn": 1764979300000,
                "_id": "like-elena-1"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "reviewId": "review-peter-2",
                "_createdOn": 1764979350000,
                "_id": "like-elena-2"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "reviewId": "d3a3974f-da4b-49c7-b506-babda3123cf7",
                "_createdOn": 1764979400000,
                "_id": "like-elena-3"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "reviewId": "review-ivan-1",
                "_createdOn": 1764979450000,
                "_id": "like-elena-4"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "reviewId": "review-user-1",
                "_createdOn": 1764979500000,
                "_id": "like-ivan-1"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "reviewId": "review-user-2",
                "_createdOn": 1764979550000,
                "_id": "like-ivan-2"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "reviewId": "review-admin-2",
                "_createdOn": 1764979600000,
                "_id": "like-ivan-3"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "reviewId": "review-elena-1",
                "_createdOn": 1764979650000,
                "_id": "like-ivan-4"
            },
        ],
        shelves: [
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "read": ["82107d6e-81c6-4f34-81e3-e9dcb97984bc", "2aff9c38-d4ab-481b-87d0-20c114a46a67", "277dfec1-7cea-4eab-9aa2-5456eb68eb6f"],
                "currentlyReading": ["00cea304-fff3-4b3f-b015-ddd4a03fa871"],
                "to-read": ["0fcfc589-7de4-4227-99e2-d444c8354b6c", "952d7634-53b9-48c6-ab9b-3f7ef52c39e1"],
                "favoriteBooks": ["82107d6e-81c6-4f34-81e3-e9dcb97984bc", "277dfec1-7cea-4eab-9aa2-5456eb68eb6f"],
                "dnf": ["23405fcb-79df-49d7-a605-74e8a0a35de4"],
                "_createdOn": 1765046038629,
                "_id": "f4e5c3b1-FILLER-4c2a-9c3d-123456789abc"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "read": ["fcd39f63-7e0b-423c-8aec-1838b29a162e", "277dfec1-7cea-4eab-9aa2-5456eb68eb6f"],
                "currentlyReading": ["17935d4a-9ca4-478d-bdf5-86a3906d41a9"],
                "to-read": ["2aff9c38-d4ab-481b-87d0-20c114a46a67", "952d7634-53b9-48c6-ab9b-3f7ef52c39e1", "0fcfc589-7de4-4227-99e2-d444c8354b6c", "23405fcb-79df-49d7-a605-74e8a0a35de4"],
                "favoriteBooks": ["fcd39f63-7e0b-423c-8aec-1838b29a162e", "17935d4a-9ca4-478d-bdf5-86a3906d41a9"],
                "dnf": ["00cea304-fff3-4b3f-b015-ddd4a03fa871"],
                "_createdOn": 1764965100000,
                "_id": "shelf-user-userov"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "read": ["3c3bfe22-e5f8-46e8-8088-72a051ff7f52", "0fcfc589-7de4-4227-99e2-d444c8354b6c"],
                "currentlyReading": ["fcd39f63-7e0b-423c-8aec-1838b29a162e"],
                "to-read": ["82107d6e-81c6-4f34-81e3-e9dcb97984bc", "952d7634-53b9-48c6-ab9b-3f7ef52c39e1", "17935d4a-9ca4-478d-bdf5-86a3906d41a9"],
                "favoriteBooks": ["fcd39f63-7e0b-423c-8aec-1838b29a162e", "0fcfc589-7de4-4227-99e2-d444c8354b6c"],
                "dnf": [],
                "_createdOn": 1764967100000,
                "_id": "shelf-peter-petrov"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "read": [
                    "82107d6e-81c6-4f34-81e3-e9dcb97984bc", // Empire of Silence
                    "2aff9c38-d4ab-481b-87d0-20c114a46a67", // Red Rising
                    "277dfec1-7cea-4eab-9aa2-5456eb68eb6f", // Gardens of the Moon
                    "c16329f7-a90c-4228-835d-77a14d69bf64"  // Empire of the Vampire
                ],
                "currentlyReading": [
                    "17935d4a-9ca4-478d-bdf5-86a3906d41a9", // Empire of the Dawn
                    "fcd39f63-7e0b-423c-8aec-1838b29a162e"  // Dark Age
                ],
                "to-read": [
                    "101b4a2f-fd3d-4552-a2de-026a73cf8e5e", // Shadows Upon Time
                    "0ea35733-6a32-4146-aed4-d1dd01631417", // Lies Weeping
                    "73e303f1-f91c-4cf1-8949-da34d322a446"  // New Spring
                ],
                "favoriteBooks": [
                    "82107d6e-81c6-4f34-81e3-e9dcb97984bc",
                    "2aff9c38-d4ab-481b-87d0-20c114a46a67",
                    "c16329f7-a90c-4228-835d-77a14d69bf64"
                ],
                "dnf": [
                    "23405fcb-79df-49d7-a605-74e8a0a35de4" // Deadhouse Gates
                ],
                "_createdOn": 1764975050000,
                "_id": "shelf-mitko-mitev"
            },
            , {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "read": [
                    "101b4a2f-fd3d-4552-a2de-026a73cf8e5e", // Shadows Upon Time
                    "17935d4a-9ca4-478d-bdf5-86a3906d41a9", // Empire of the Dawn
                    "2d172481-4848-47fe-bf71-9c1e51b98773", // Light Bringer
                    "23405fcb-79df-49d7-a605-74e8a0a35de4", // Deadhouse Gates
                    "277dfec1-7cea-4eab-9aa2-5456eb68eb6f"  // Gardens of the Moon
                ],
                "currentlyReading": [
                    "c16329f7-a90c-4228-835d-77a14d69bf64", // Empire of the Vampire
                    "daede8cc-eafd-499a-9b32-f0c7dc4f48d3"  // The Eye of the World
                ],
                "to-read": [
                    "736c0499-72c6-4a16-89df-f761f23376f8", // Empire of the Damned
                    "952d7634-53b9-48c6-ab9b-3f7ef52c39e1", // The Black Company
                    "144158ce-53fe-4994-9488-47d644911b05", // The Great Hunt
                    "52d44f5c-6c18-4375-9f36-5f0c279eaff8"  // Disquiet Gods
                ],
                "favoriteBooks": [
                    "101b4a2f-fd3d-4552-a2de-026a73cf8e5e", // Shadows Upon Time
                    "17935d4a-9ca4-478d-bdf5-86a3906d41a9", // Empire of the Dawn
                    "2d172481-4848-47fe-bf71-9c1e51b98773"  // Light Bringer
                ],
                "dnf": [
                    "1eb22952-67f8-467b-b1c8-1fe291d50381"   // Memories of Ice
                ],
                "_createdOn": 1764978050000,
                "_id": "shelf-elena-stoyanova"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "read": [
                    "2aff9c38-d4ab-481b-87d0-20c114a46a67", // Red Rising
                    "0fcfc589-7de4-4227-99e2-d444c8354b6c", // Golden Son
                    "4032affc-615e-4e41-9eb5-6f9517d4d9c9", // Morning Star
                    "6aa9a204-67f3-4a97-9f66-15f999539e79", // Iron Gold
                    "fcd39f63-7e0b-423c-8aec-1838b29a162e", // Dark Age
                    "2d172481-4848-47fe-bf71-9c1e51b98773"  // Light Bringer
                ],
                "currentlyReading": [
                    "f9a471df-5c1e-4a72-b467-0726400778b7", // Red God
                    "52d44f5c-6c18-4375-9f36-5f0c279eaff8"  // Disquiet Gods
                ],
                "to-read": [
                    "82107d6e-81c6-4f34-81e3-e9dcb97984bc", // Empire of Silence
                    "00cea304-fff3-4b3f-b015-ddd4a03fa871", // Howling Dark
                    "5321337c-6c3e-4515-b034-fd905a39bb68", // Demon in White
                    "a73b1436-bbcf-4227-862a-def1b2226926", // Kingdoms of Death
                    "c78eeb93-6288-4486-989e-25092333a642", // Ashes of Man
                    "101b4a2f-fd3d-4552-a2de-026a73cf8e5e"  // Shadows Upon Time
                ],
                "favoriteBooks": [
                    "2aff9c38-d4ab-481b-87d0-20c114a46a67", // Red Rising
                    "fcd39f63-7e0b-423c-8aec-1838b29a162e", // Dark Age
                    "2d172481-4848-47fe-bf71-9c1e51b98773"  // Light Bringer
                ],
                "dnf": [
                    "277dfec1-7cea-4eab-9aa2-5456eb68eb6f", // Gardens of the Moon
                    "23405fcb-79df-49d7-a605-74e8a0a35de4"  // Deadhouse Gates
                ],
                "_createdOn": 1764978150000,
                "_id": "shelf-ivan-ivanov"
            },
        ],
        readingProgress: [
            {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "bookId": "00cea304-fff3-4b3f-b015-ddd4a03fa871",
                "currentPage": 150,
                "totalPages": 688,
                "_createdOn": 1765046038630,
                "_id": "progress-1"
            },
            {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "bookId": "17935d4a-9ca4-478d-bdf5-86a3906d41a9",
                "currentPage": 312,
                "totalPages": 656,
                "_createdOn": 1764965150000,
                "_id": "progress-user"
            },
            {
                "_ownerId": "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                "bookId": "fcd39f63-7e0b-423c-8aec-1838b29a162e",
                "currentPage": 421,
                "totalPages": 752,
                "_createdOn": 1764967150000,
                "_id": "progress-peter"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "bookId": "17935d4a-9ca4-478d-bdf5-86a3906d41a9", // Empire of the Dawn
                "currentPage": 450,
                "totalPages": 800,
                "_createdOn": 1764975100000,
                "_id": "progress-mitko"
            },
            {
                "_ownerId": "5a7d1234-9af0-4b30-9e21-b38484f6c1ab",
                "bookId": "fcd39f63-7e0b-423c-8aec-1838b29a162e", // Dark Age
                "currentPage": 693,
                "totalPages": 758,
                "_createdOn": 1764975100000,
                "_id": "progress-mitko2"
            },
            {
                "_ownerId": "9e3c6a2d-8bf0-4c91-92f4-1234567890ab",
                "bookId": "c16329f7-a90c-4228-835d-77a14d69bf64", // Empire of the Vampire
                "currentPage": 350,
                "totalPages": 752,
                "_createdOn": 1764978200000,
                "_id": "progress-elena"
            },
            {
                "_ownerId": "1a5d7c3e-b2a1-4d89-8c7f-abcdef123456",
                "bookId": "f9a471df-5c1e-4a72-b467-0726400778b7", // Red God
                "currentPage": 220,
                "totalPages": 680,
                "_createdOn": 1764978300000,
                "_id": "progress-ivan"
            }

        ]
    };
    var rules$1 = {
        users: {
            ".create": false,
            ".read": [
                "Owner"
            ],
            ".update": false,
            ".delete": false
        },
        members: {
            ".update": "isOwner(user, get('teams', data.teamId))",
            ".delete": "isOwner(user, get('teams', data.teamId)) || isOwner(user, data)",
            "*": {
                teamId: {
                    ".update": "newData.teamId = data.teamId"
                },
                status: {
                    ".create": "newData.status = 'pending'"
                }
            }
        },
        books: {
            ".create": "newData._ownerId = user._id",
            ".read": true,
            ".update": "isOwner(user, data) || user.isAdmin",
            ".delete": "isOwner(user, data) || user.isAdmin"
        },
        reviews: {
            ".create": "newData._ownerId = user._id",
            ".read": true,
            ".update": "isOwner(user, data) || user.isAdmin",
            ".delete": "isOwner(user, data) || user.isAdmin"
        },
        comments: {
            ".create": "newData._ownerId = user._id",
            ".read": true,
            ".update": "isOwner(user, data) || user.isAdmin",
            ".delete": "isOwner(user, data) || user.isAdmin"
        },
        reviewLikes: {
            ".create": "newData._ownerId = user._id",
            ".read": true,
            ".update": "isOwner(user, data)",
            ".delete": "isOwner(user, data)"
        },
        shelves: {
            ".create": "newData._ownerId = user._id",
            ".read": true,
            ".update": "isOwner(user, data)",
            ".delete": "isOwner(user, data)"
        },
        readingProgress: {
            ".create": "newData._ownerId = user._id",
            ".read": true,
            ".update": "isOwner(user, data)",
            ".delete": "isOwner(user, data)"
        },
    };
    var settings = {
        identity: identity,
        protectedData: protectedData,
        seedData: seedData,
        rules: rules$1
    };

    const plugins = [
        storage(settings),
        auth(settings),
        util$2(),
        rules(settings)
    ];

    const server = http__default['default'].createServer(requestHandler(plugins, services));

    const port = 3030;

    server.listen(port);
    // If I want to connect through wifi on mobile
    // server.listen(port, '0.0.0.0');

    console.log(`Server started on port ${port}. You can make requests to http://localhost:${port}/`);
    console.log(`Admin panel located at http://localhost:${port}/admin`);

    var softuniPracticeServer = server;

    return softuniPracticeServer;

})));
