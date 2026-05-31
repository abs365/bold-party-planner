(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/@sentry/core/build/esm/constants.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_ENVIRONMENT",
    ()=>DEFAULT_ENVIRONMENT
]);
const DEFAULT_ENVIRONMENT = 'production';
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/version.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SDK_VERSION",
    ()=>SDK_VERSION
]);
// This is a magic string replaced by rollup
const SDK_VERSION = "8.55.2";
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GLOBAL_OBJ",
    ()=>GLOBAL_OBJ,
    "getGlobalSingleton",
    ()=>getGlobalSingleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/version.js [app-client] (ecmascript)");
;
/** Get's the global object for the current JavaScript runtime */ const GLOBAL_OBJ = globalThis;
/**
 * Returns a global singleton contained in the global `__SENTRY__[]` object.
 *
 * If the singleton doesn't already exist in `__SENTRY__`, it will be created using the given factory
 * function and added to the `__SENTRY__` object.
 *
 * @param name name of the global singleton on __SENTRY__
 * @param creator creator Factory function to create the singleton if it doesn't already exist on `__SENTRY__`
 * @param obj (Optional) The global object on which to look for `__SENTRY__`, if not `GLOBAL_OBJ`'s return value
 * @returns the singleton
 */ function getGlobalSingleton(name, creator, obj) {
    const gbl = obj || GLOBAL_OBJ;
    const __SENTRY__ = gbl.__SENTRY__ = gbl.__SENTRY__ || {};
    const versionedCarrier = __SENTRY__[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SDK_VERSION"]] = __SENTRY__[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SDK_VERSION"]] || {};
    return versionedCarrier[name] || (versionedCarrier[name] = creator());
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/carrier.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMainCarrier",
    ()=>getMainCarrier,
    "getSentryCarrier",
    ()=>getSentryCarrier
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/version.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
;
/**
 * An object that contains globally accessible properties and maintains a scope stack.
 * @hidden
 */ /**
 * Returns the global shim registry.
 *
 * FIXME: This function is problematic, because despite always returning a valid Carrier,
 * it has an optional `__SENTRY__` property, which then in turn requires us to always perform an unnecessary check
 * at the call-site. We always access the carrier through this function, so we can guarantee that `__SENTRY__` is there.
 **/ function getMainCarrier() {
    // This ensures a Sentry carrier exists
    getSentryCarrier(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"]);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"];
}
/** Will either get the existing sentry carrier, or create a new one. */ function getSentryCarrier(carrier) {
    const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
    // For now: First SDK that sets the .version property wins
    __SENTRY__.version = __SENTRY__.version || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SDK_VERSION"];
    // Intentionally populating and returning the version of "this" SDK instance
    // rather than what's set in .version so that "this" SDK always gets its carrier
    return __SENTRY__[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SDK_VERSION"]] = __SENTRY__[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$version$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SDK_VERSION"]] || {};
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isDOMError",
    ()=>isDOMError,
    "isDOMException",
    ()=>isDOMException,
    "isElement",
    ()=>isElement,
    "isError",
    ()=>isError,
    "isErrorEvent",
    ()=>isErrorEvent,
    "isEvent",
    ()=>isEvent,
    "isInstanceOf",
    ()=>isInstanceOf,
    "isParameterizedString",
    ()=>isParameterizedString,
    "isPlainObject",
    ()=>isPlainObject,
    "isPrimitive",
    ()=>isPrimitive,
    "isRegExp",
    ()=>isRegExp,
    "isString",
    ()=>isString,
    "isSyntheticEvent",
    ()=>isSyntheticEvent,
    "isThenable",
    ()=>isThenable,
    "isVueViewModel",
    ()=>isVueViewModel
]);
// eslint-disable-next-line @typescript-eslint/unbound-method
const objectToString = Object.prototype.toString;
/**
 * Checks whether given value's type is one of a few Error or Error-like
 * {@link isError}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isError(wat) {
    switch(objectToString.call(wat)){
        case '[object Error]':
        case '[object Exception]':
        case '[object DOMException]':
        case '[object WebAssembly.Exception]':
            return true;
        default:
            return isInstanceOf(wat, Error);
    }
}
/**
 * Checks whether given value is an instance of the given built-in class.
 *
 * @param wat The value to be checked
 * @param className
 * @returns A boolean representing the result.
 */ function isBuiltin(wat, className) {
    return objectToString.call(wat) === `[object ${className}]`;
}
/**
 * Checks whether given value's type is ErrorEvent
 * {@link isErrorEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isErrorEvent(wat) {
    return isBuiltin(wat, 'ErrorEvent');
}
/**
 * Checks whether given value's type is DOMError
 * {@link isDOMError}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isDOMError(wat) {
    return isBuiltin(wat, 'DOMError');
}
/**
 * Checks whether given value's type is DOMException
 * {@link isDOMException}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isDOMException(wat) {
    return isBuiltin(wat, 'DOMException');
}
/**
 * Checks whether given value's type is a string
 * {@link isString}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isString(wat) {
    return isBuiltin(wat, 'String');
}
/**
 * Checks whether given string is parameterized
 * {@link isParameterizedString}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isParameterizedString(wat) {
    return typeof wat === 'object' && wat !== null && '__sentry_template_string__' in wat && '__sentry_template_values__' in wat;
}
/**
 * Checks whether given value is a primitive (undefined, null, number, boolean, string, bigint, symbol)
 * {@link isPrimitive}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isPrimitive(wat) {
    return wat === null || isParameterizedString(wat) || typeof wat !== 'object' && typeof wat !== 'function';
}
/**
 * Checks whether given value's type is an object literal, or a class instance.
 * {@link isPlainObject}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isPlainObject(wat) {
    return isBuiltin(wat, 'Object');
}
/**
 * Checks whether given value's type is an Event instance
 * {@link isEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isEvent(wat) {
    return typeof Event !== 'undefined' && isInstanceOf(wat, Event);
}
/**
 * Checks whether given value's type is an Element instance
 * {@link isElement}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isElement(wat) {
    return typeof Element !== 'undefined' && isInstanceOf(wat, Element);
}
/**
 * Checks whether given value's type is an regexp
 * {@link isRegExp}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isRegExp(wat) {
    return isBuiltin(wat, 'RegExp');
}
/**
 * Checks whether given value has a then function.
 * @param wat A value to be checked.
 */ function isThenable(wat) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return Boolean(wat && wat.then && typeof wat.then === 'function');
}
/**
 * Checks whether given value's type is a SyntheticEvent
 * {@link isSyntheticEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isSyntheticEvent(wat) {
    return isPlainObject(wat) && 'nativeEvent' in wat && 'preventDefault' in wat && 'stopPropagation' in wat;
}
/**
 * Checks whether given value's type is an instance of provided constructor.
 * {@link isInstanceOf}.
 *
 * @param wat A value to be checked.
 * @param base A constructor to be used in a check.
 * @returns A boolean representing the result.
 */ function isInstanceOf(wat, base) {
    try {
        return wat instanceof base;
    } catch (_e) {
        return false;
    }
}
/**
 * Checks whether given value's type is a Vue ViewModel.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */ function isVueViewModel(wat) {
    // Not using Object.prototype.toString because in Vue 3 it would read the instance's Symbol(Symbol.toStringTag) property.
    return !!(typeof wat === 'object' && wat !== null && (wat.__isVue || wat._isVue));
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/browser.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getComponentName",
    ()=>getComponentName,
    "getDomElement",
    ()=>getDomElement,
    "getLocationHref",
    ()=>getLocationHref,
    "htmlTreeAsString",
    ()=>htmlTreeAsString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
;
const WINDOW = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"];
const DEFAULT_MAX_STRING_LENGTH = 80;
/**
 * Given a child DOM element, returns a query-selector statement describing that
 * and its ancestors
 * e.g. [HTMLElement] => body > div > input#foo.btn[name=baz]
 * @returns generated DOM path
 */ function htmlTreeAsString(elem, options = {}) {
    if (!elem) {
        return '<unknown>';
    }
    // try/catch both:
    // - accessing event.target (see getsentry/raven-js#838, #768)
    // - `htmlTreeAsString` because it's complex, and just accessing the DOM incorrectly
    // - can throw an exception in some circumstances.
    try {
        let currentElem = elem;
        const MAX_TRAVERSE_HEIGHT = 5;
        const out = [];
        let height = 0;
        let len = 0;
        const separator = ' > ';
        const sepLength = separator.length;
        let nextStr;
        const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
        const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
        while(currentElem && height++ < MAX_TRAVERSE_HEIGHT){
            nextStr = _htmlElementAsString(currentElem, keyAttrs);
            // bail out if
            // - nextStr is the 'html' element
            // - the length of the string that would be created exceeds maxStringLength
            //   (ignore this limit if we are on the first iteration)
            if (nextStr === 'html' || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) {
                break;
            }
            out.push(nextStr);
            len += nextStr.length;
            currentElem = currentElem.parentNode;
        }
        return out.reverse().join(separator);
    } catch (_oO) {
        return '<unknown>';
    }
}
/**
 * Returns a simple, query-selector representation of a DOM element
 * e.g. [HTMLElement] => input#foo.btn[name=baz]
 * @returns generated DOM path
 */ function _htmlElementAsString(el, keyAttrs) {
    const elem = el;
    const out = [];
    if (!elem || !elem.tagName) {
        return '';
    }
    // @ts-expect-error WINDOW has HTMLElement
    if (WINDOW.HTMLElement) {
        // If using the component name annotation plugin, this value may be available on the DOM node
        if (elem instanceof HTMLElement && elem.dataset) {
            if (elem.dataset['sentryComponent']) {
                return elem.dataset['sentryComponent'];
            }
            if (elem.dataset['sentryElement']) {
                return elem.dataset['sentryElement'];
            }
        }
    }
    out.push(elem.tagName.toLowerCase());
    // Pairs of attribute keys defined in `serializeAttribute` and their values on element.
    const keyAttrPairs = keyAttrs && keyAttrs.length ? keyAttrs.filter((keyAttr)=>elem.getAttribute(keyAttr)).map((keyAttr)=>[
            keyAttr,
            elem.getAttribute(keyAttr)
        ]) : null;
    if (keyAttrPairs && keyAttrPairs.length) {
        keyAttrPairs.forEach((keyAttrPair)=>{
            out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
        });
    } else {
        if (elem.id) {
            out.push(`#${elem.id}`);
        }
        const className = elem.className;
        if (className && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isString"])(className)) {
            const classes = className.split(/\s+/);
            for (const c of classes){
                out.push(`.${c}`);
            }
        }
    }
    const allowedAttrs = [
        'aria-label',
        'type',
        'name',
        'title',
        'alt'
    ];
    for (const k of allowedAttrs){
        const attr = elem.getAttribute(k);
        if (attr) {
            out.push(`[${k}="${attr}"]`);
        }
    }
    return out.join('');
}
/**
 * A safe form of location.href
 */ function getLocationHref() {
    try {
        return WINDOW.document.location.href;
    } catch (oO) {
        return '';
    }
}
/**
 * Gets a DOM element by using document.querySelector.
 *
 * This wrapper will first check for the existence of the function before
 * actually calling it so that we don't have to take care of this check,
 * every time we want to access the DOM.
 *
 * Reason: DOM/querySelector is not available in all environments.
 *
 * We have to cast to any because utils can be consumed by a variety of environments,
 * and we don't want to break TS users. If you know what element will be selected by
 * `document.querySelector`, specify it as part of the generic call. For example,
 * `const element = getDomElement<Element>('selector');`
 *
 * @param selector the selector string passed on to document.querySelector
 *
 * @deprecated This method is deprecated and will be removed in the next major version.
 */ // eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDomElement(selector) {
    if (WINDOW.document && WINDOW.document.querySelector) {
        return WINDOW.document.querySelector(selector);
    }
    return null;
}
/**
 * Given a DOM element, traverses up the tree until it finds the first ancestor node
 * that has the `data-sentry-component` or `data-sentry-element` attribute with `data-sentry-component` taking
 * precedence. This attribute is added at build-time by projects that have the component name annotation plugin installed.
 *
 * @returns a string representation of the component for the provided DOM element, or `null` if not found
 */ function getComponentName(elem) {
    // @ts-expect-error WINDOW has HTMLElement
    if (!WINDOW.HTMLElement) {
        return null;
    }
    let currentElem = elem;
    const MAX_TRAVERSE_HEIGHT = 5;
    for(let i = 0; i < MAX_TRAVERSE_HEIGHT; i++){
        if (!currentElem) {
            return null;
        }
        if (currentElem instanceof HTMLElement) {
            if (currentElem.dataset['sentryComponent']) {
                return currentElem.dataset['sentryComponent'];
            }
            if (currentElem.dataset['sentryElement']) {
                return currentElem.dataset['sentryElement'];
            }
        }
        currentElem = currentElem.parentNode;
    }
    return null;
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/debug-build.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEBUG_BUILD",
    ()=>DEBUG_BUILD
]);
/**
 * This serves as a build time flag that will be true by default, but false in non-debug builds or if users replace `__SENTRY_DEBUG__` in their generated code.
 *
 * ATTENTION: This constant must never cross package boundaries (i.e. be exported) to guarantee that it can be used for tree shaking.
 */ const DEBUG_BUILD = typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__;
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/logger.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONSOLE_LEVELS",
    ()=>CONSOLE_LEVELS,
    "consoleSandbox",
    ()=>consoleSandbox,
    "logger",
    ()=>logger,
    "originalConsoleMethods",
    ()=>originalConsoleMethods
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/debug-build.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
;
/** Prefix for logging strings */ const PREFIX = 'Sentry Logger ';
const CONSOLE_LEVELS = [
    'debug',
    'info',
    'warn',
    'error',
    'log',
    'assert',
    'trace'
];
/** This may be mutated by the console instrumentation. */ const originalConsoleMethods = {};
/** JSDoc */ /**
 * Temporarily disable sentry console instrumentations.
 *
 * @param callback The function to run against the original `console` messages
 * @returns The results of the callback
 */ function consoleSandbox(callback) {
    if (!('console' in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"])) {
        return callback();
    }
    const console = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"].console;
    const wrappedFuncs = {};
    const wrappedLevels = Object.keys(originalConsoleMethods);
    // Restore all wrapped console methods
    wrappedLevels.forEach((level)=>{
        const originalConsoleMethod = originalConsoleMethods[level];
        wrappedFuncs[level] = console[level];
        console[level] = originalConsoleMethod;
    });
    try {
        return callback();
    } finally{
        // Revert restoration to wrapped state
        wrappedLevels.forEach((level)=>{
            console[level] = wrappedFuncs[level];
        });
    }
}
function makeLogger() {
    let enabled = false;
    const logger = {
        enable: ()=>{
            enabled = true;
        },
        disable: ()=>{
            enabled = false;
        },
        isEnabled: ()=>enabled
    };
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"]) {
        CONSOLE_LEVELS.forEach((name)=>{
            logger[name] = (...args)=>{
                if (enabled) {
                    consoleSandbox(()=>{
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"].console[name](`${PREFIX}[${name}]:`, ...args);
                    });
                }
            };
        });
    } else {
        CONSOLE_LEVELS.forEach((name)=>{
            logger[name] = ()=>undefined;
        });
    }
    return logger;
}
/**
 * This is a logger singleton which either logs things or no-ops if logging is not enabled.
 * The logger is a singleton on the carrier, to ensure that a consistent logger is used throughout the SDK.
 */ const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalSingleton"])('logger', makeLogger);
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/string.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isMatchingPattern",
    ()=>isMatchingPattern,
    "safeJoin",
    ()=>safeJoin,
    "snipLine",
    ()=>snipLine,
    "stringMatchesSomePattern",
    ()=>stringMatchesSomePattern,
    "truncate",
    ()=>truncate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
;
/**
 * Truncates given string to the maximum characters count
 *
 * @param str An object that contains serializable values
 * @param max Maximum number of characters in truncated string (0 = unlimited)
 * @returns string Encoded
 */ function truncate(str, max = 0) {
    if (typeof str !== 'string' || max === 0) {
        return str;
    }
    return str.length <= max ? str : `${str.slice(0, max)}...`;
}
/**
 * This is basically just `trim_line` from
 * https://github.com/getsentry/sentry/blob/master/src/sentry/lang/javascript/processor.py#L67
 *
 * @param str An object that contains serializable values
 * @param max Maximum number of characters in truncated string
 * @returns string Encoded
 */ function snipLine(line, colno) {
    let newLine = line;
    const lineLength = newLine.length;
    if (lineLength <= 150) {
        return newLine;
    }
    if (colno > lineLength) {
        // eslint-disable-next-line no-param-reassign
        colno = lineLength;
    }
    let start = Math.max(colno - 60, 0);
    if (start < 5) {
        start = 0;
    }
    let end = Math.min(start + 140, lineLength);
    if (end > lineLength - 5) {
        end = lineLength;
    }
    if (end === lineLength) {
        start = Math.max(end - 140, 0);
    }
    newLine = newLine.slice(start, end);
    if (start > 0) {
        newLine = `'{snip} ${newLine}`;
    }
    if (end < lineLength) {
        newLine += ' {snip}';
    }
    return newLine;
}
/**
 * Join values in array
 * @param input array of values to be joined together
 * @param delimiter string to be placed in-between values
 * @returns Joined values
 */ function safeJoin(input, delimiter) {
    if (!Array.isArray(input)) {
        return '';
    }
    const output = [];
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for(let i = 0; i < input.length; i++){
        const value = input[i];
        try {
            // This is a hack to fix a Vue3-specific bug that causes an infinite loop of
            // console warnings. This happens when a Vue template is rendered with
            // an undeclared variable, which we try to stringify, ultimately causing
            // Vue to issue another warning which repeats indefinitely.
            // see: https://github.com/getsentry/sentry-javascript/pull/8981
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVueViewModel"])(value)) {
                output.push('[VueViewModel]');
            } else {
                output.push(String(value));
            }
        } catch (e) {
            output.push('[value cannot be serialized]');
        }
    }
    return output.join(delimiter);
}
/**
 * Checks if the given value matches a regex or string
 *
 * @param value The string to test
 * @param pattern Either a regex or a string against which `value` will be matched
 * @param requireExactStringMatch If true, `value` must match `pattern` exactly. If false, `value` will match
 * `pattern` if it contains `pattern`. Only applies to string-type patterns.
 */ function isMatchingPattern(value, pattern, requireExactStringMatch = false) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isString"])(value)) {
        return false;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isRegExp"])(pattern)) {
        return pattern.test(value);
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isString"])(pattern)) {
        return requireExactStringMatch ? value === pattern : value.includes(pattern);
    }
    return false;
}
/**
 * Test the given string against an array of strings and regexes. By default, string matching is done on a
 * substring-inclusion basis rather than a strict equality basis
 *
 * @param testString The string to test
 * @param patterns The patterns against which to test the string
 * @param requireExactStringMatch If true, `testString` must match one of the given string patterns exactly in order to
 * count. If false, `testString` will match a string pattern if it contains that pattern.
 * @returns
 */ function stringMatchesSomePattern(testString, patterns = [], requireExactStringMatch = false) {
    return patterns.some((pattern)=>isMatchingPattern(testString, pattern, requireExactStringMatch));
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addNonEnumerableProperty",
    ()=>addNonEnumerableProperty,
    "convertToPlainObject",
    ()=>convertToPlainObject,
    "dropUndefinedKeys",
    ()=>dropUndefinedKeys,
    "extractExceptionKeysForMessage",
    ()=>extractExceptionKeysForMessage,
    "fill",
    ()=>fill,
    "getOriginalFunction",
    ()=>getOriginalFunction,
    "markFunctionWrapped",
    ()=>markFunctionWrapped,
    "objectify",
    ()=>objectify,
    "urlEncode",
    ()=>urlEncode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/browser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/debug-build.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/string.js [app-client] (ecmascript)");
;
;
;
;
;
/**
 * Replace a method in an object with a wrapped version of itself.
 *
 * @param source An object that contains a method to be wrapped.
 * @param name The name of the method to be wrapped.
 * @param replacementFactory A higher-order function that takes the original version of the given method and returns a
 * wrapped version. Note: The function returned by `replacementFactory` needs to be a non-arrow function, in order to
 * preserve the correct value of `this`, and the original method must be called using `origMethod.call(this, <other
 * args>)` or `origMethod.apply(this, [<other args>])` (rather than being called directly), again to preserve `this`.
 * @returns void
 */ function fill(source, name, replacementFactory) {
    if (!(name in source)) {
        return;
    }
    const original = source[name];
    const wrapped = replacementFactory(original);
    // Make sure it's a function first, as we need to attach an empty prototype for `defineProperties` to work
    // otherwise it'll throw "TypeError: Object.defineProperties called on non-object"
    if (typeof wrapped === 'function') {
        markFunctionWrapped(wrapped, original);
    }
    try {
        source[name] = wrapped;
    } catch (e) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].log(`Failed to replace method "${name}" in object`, source);
    }
}
/**
 * Defines a non-enumerable property on the given object.
 *
 * @param obj The object on which to set the property
 * @param name The name of the property to be set
 * @param value The value to which to set the property
 */ function addNonEnumerableProperty(obj, name, value) {
    try {
        Object.defineProperty(obj, name, {
            // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
            value: value,
            writable: true,
            configurable: true
        });
    } catch (o_O) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].log(`Failed to add non-enumerable property "${name}" to object`, obj);
    }
}
/**
 * Remembers the original function on the wrapped function and
 * patches up the prototype.
 *
 * @param wrapped the wrapper function
 * @param original the original function that gets wrapped
 */ function markFunctionWrapped(wrapped, original) {
    try {
        const proto = original.prototype || {};
        wrapped.prototype = original.prototype = proto;
        addNonEnumerableProperty(wrapped, '__sentry_original__', original);
    } catch (o_O) {} // eslint-disable-line no-empty
}
/**
 * This extracts the original function if available.  See
 * `markFunctionWrapped` for more information.
 *
 * @param func the function to unwrap
 * @returns the unwrapped version of the function if available.
 */ // eslint-disable-next-line @typescript-eslint/ban-types
function getOriginalFunction(func) {
    return func.__sentry_original__;
}
/**
 * Encodes given object into url-friendly format
 *
 * @param object An object that contains serializable values
 * @returns string Encoded
 *
 * @deprecated This function is deprecated and will be removed in the next major version of the SDK.
 */ // eslint-disable-next-line @typescript-eslint/no-explicit-any
function urlEncode(object) {
    return Object.entries(object).map(([key, value])=>`${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
}
/**
 * Transforms any `Error` or `Event` into a plain object with all of their enumerable properties, and some of their
 * non-enumerable properties attached.
 *
 * @param value Initial source that we have to transform in order for it to be usable by the serializer
 * @returns An Event or Error turned into an object - or the value argument itself, when value is neither an Event nor
 *  an Error.
 */ function convertToPlainObject(value) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isError"])(value)) {
        return {
            message: value.message,
            name: value.name,
            stack: value.stack,
            ...getOwnProperties(value)
        };
    } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isEvent"])(value)) {
        const newObj = {
            type: value.type,
            target: serializeEventTarget(value.target),
            currentTarget: serializeEventTarget(value.currentTarget),
            ...getOwnProperties(value)
        };
        if (typeof CustomEvent !== 'undefined' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isInstanceOf"])(value, CustomEvent)) {
            newObj.detail = value.detail;
        }
        return newObj;
    } else {
        return value;
    }
}
/** Creates a string representation of the target of an `Event` object */ function serializeEventTarget(target) {
    try {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isElement"])(target) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["htmlTreeAsString"])(target) : Object.prototype.toString.call(target);
    } catch (_oO) {
        return '<unknown>';
    }
}
/** Filters out all but an object's own properties */ function getOwnProperties(obj) {
    if (typeof obj === 'object' && obj !== null) {
        const extractedProps = {};
        for(const property in obj){
            if (Object.prototype.hasOwnProperty.call(obj, property)) {
                extractedProps[property] = obj[property];
            }
        }
        return extractedProps;
    } else {
        return {};
    }
}
/**
 * Given any captured exception, extract its keys and create a sorted
 * and truncated list that will be used inside the event message.
 * eg. `Non-error exception captured with keys: foo, bar, baz`
 */ function extractExceptionKeysForMessage(exception, maxLength = 40) {
    const keys = Object.keys(convertToPlainObject(exception));
    keys.sort();
    const firstKey = keys[0];
    if (!firstKey) {
        return '[object has no keys]';
    }
    if (firstKey.length >= maxLength) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["truncate"])(firstKey, maxLength);
    }
    for(let includedKeys = keys.length; includedKeys > 0; includedKeys--){
        const serialized = keys.slice(0, includedKeys).join(', ');
        if (serialized.length > maxLength) {
            continue;
        }
        if (includedKeys === keys.length) {
            return serialized;
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["truncate"])(serialized, maxLength);
    }
    return '';
}
/**
 * Given any object, return a new object having removed all fields whose value was `undefined`.
 * Works recursively on objects and arrays.
 *
 * Attention: This function keeps circular references in the returned object.
 */ function dropUndefinedKeys(inputValue) {
    // This map keeps track of what already visited nodes map to.
    // Our Set - based memoBuilder doesn't work here because we want to the output object to have the same circular
    // references as the input object.
    const memoizationMap = new Map();
    // This function just proxies `_dropUndefinedKeys` to keep the `memoBuilder` out of this function's API
    return _dropUndefinedKeys(inputValue, memoizationMap);
}
function _dropUndefinedKeys(inputValue, memoizationMap) {
    if (isPojo(inputValue)) {
        // If this node has already been visited due to a circular reference, return the object it was mapped to in the new object
        const memoVal = memoizationMap.get(inputValue);
        if (memoVal !== undefined) {
            return memoVal;
        }
        const returnValue = {};
        // Store the mapping of this value in case we visit it again, in case of circular data
        memoizationMap.set(inputValue, returnValue);
        for (const key of Object.getOwnPropertyNames(inputValue)){
            if (typeof inputValue[key] !== 'undefined') {
                returnValue[key] = _dropUndefinedKeys(inputValue[key], memoizationMap);
            }
        }
        return returnValue;
    }
    if (Array.isArray(inputValue)) {
        // If this node has already been visited due to a circular reference, return the array it was mapped to in the new object
        const memoVal = memoizationMap.get(inputValue);
        if (memoVal !== undefined) {
            return memoVal;
        }
        const returnValue = [];
        // Store the mapping of this value in case we visit it again, in case of circular data
        memoizationMap.set(inputValue, returnValue);
        inputValue.forEach((item)=>{
            returnValue.push(_dropUndefinedKeys(item, memoizationMap));
        });
        return returnValue;
    }
    return inputValue;
}
function isPojo(input) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPlainObject"])(input)) {
        return false;
    }
    try {
        const name = Object.getPrototypeOf(input).constructor.name;
        return !name || name === 'Object';
    } catch (e2) {
        return true;
    }
}
/**
 * Ensure that something is an object.
 *
 * Turns `undefined` and `null` into `String`s and all other primitives into instances of their respective wrapper
 * classes (String, Boolean, Number, etc.). Acts as the identity function on non-primitives.
 *
 * @param wat The subject of the objectification
 * @returns A version of `wat` which can safely be used with `Object` class methods
 */ function objectify(wat) {
    let objectified;
    switch(true){
        // this will catch both undefined and null
        case wat == undefined:
            objectified = new String(wat);
            break;
        // Though symbols and bigints do have wrapper classes (`Symbol` and `BigInt`, respectively), for whatever reason
        // those classes don't have constructors which can be used with the `new` keyword. We therefore need to cast each as
        // an object in order to wrap it.
        case typeof wat === 'symbol' || typeof wat === 'bigint':
            objectified = Object(wat);
            break;
        // this will catch the remaining primitives: `String`, `Number`, and `Boolean`
        case (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPrimitive"])(wat):
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            objectified = new wat.constructor(wat);
            break;
        // by process of elimination, at this point we know that `wat` must already be an object
        default:
            objectified = wat;
            break;
    }
    return objectified;
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/time.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_browserPerformanceTimeOriginMode",
    ()=>_browserPerformanceTimeOriginMode,
    "browserPerformanceTimeOrigin",
    ()=>browserPerformanceTimeOrigin,
    "dateTimestampInSeconds",
    ()=>dateTimestampInSeconds,
    "timestampInSeconds",
    ()=>timestampInSeconds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
const ONE_SECOND_IN_MS = 1000;
/**
 * A partial definition of the [Performance Web API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
 * for accessing a high-resolution monotonic clock.
 */ /**
 * Returns a timestamp in seconds since the UNIX epoch using the Date API.
 *
 * TODO(v8): Return type should be rounded.
 */ function dateTimestampInSeconds() {
    return Date.now() / ONE_SECOND_IN_MS;
}
/**
 * Returns a wrapper around the native Performance API browser implementation, or undefined for browsers that do not
 * support the API.
 *
 * Wrapping the native API works around differences in behavior from different browsers.
 */ function createUnixTimestampInSecondsFunc() {
    const { performance } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"];
    if (!performance || !performance.now) {
        return dateTimestampInSeconds;
    }
    // Some browser and environments don't have a timeOrigin, so we fallback to
    // using Date.now() to compute the starting time.
    const approxStartingTimeOrigin = Date.now() - performance.now();
    const timeOrigin = performance.timeOrigin == undefined ? approxStartingTimeOrigin : performance.timeOrigin;
    // performance.now() is a monotonic clock, which means it starts at 0 when the process begins. To get the current
    // wall clock time (actual UNIX timestamp), we need to add the starting time origin and the current time elapsed.
    //
    // TODO: This does not account for the case where the monotonic clock that powers performance.now() drifts from the
    // wall clock time, which causes the returned timestamp to be inaccurate. We should investigate how to detect and
    // correct for this.
    // See: https://github.com/getsentry/sentry-javascript/issues/2590
    // See: https://github.com/mdn/content/issues/4713
    // See: https://dev.to/noamr/when-a-millisecond-is-not-a-millisecond-3h6
    return ()=>{
        return (timeOrigin + performance.now()) / ONE_SECOND_IN_MS;
    };
}
/**
 * Returns a timestamp in seconds since the UNIX epoch using either the Performance or Date APIs, depending on the
 * availability of the Performance API.
 *
 * BUG: Note that because of how browsers implement the Performance API, the clock might stop when the computer is
 * asleep. This creates a skew between `dateTimestampInSeconds` and `timestampInSeconds`. The
 * skew can grow to arbitrary amounts like days, weeks or months.
 * See https://github.com/getsentry/sentry-javascript/issues/2590.
 */ const timestampInSeconds = createUnixTimestampInSecondsFunc();
/**
 * Internal helper to store what is the source of browserPerformanceTimeOrigin below. For debugging only.
 *
 * @deprecated This variable will be removed in the next major version.
 */ let _browserPerformanceTimeOriginMode;
/**
 * The number of milliseconds since the UNIX epoch. This value is only usable in a browser, and only when the
 * performance API is available.
 */ const browserPerformanceTimeOrigin = (()=>{
    // Unfortunately browsers may report an inaccurate time origin data, through either performance.timeOrigin or
    // performance.timing.navigationStart, which results in poor results in performance data. We only treat time origin
    // data as reliable if they are within a reasonable threshold of the current time.
    const { performance } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"];
    if (!performance || !performance.now) {
        // eslint-disable-next-line deprecation/deprecation
        _browserPerformanceTimeOriginMode = 'none';
        return undefined;
    }
    const threshold = 3600 * 1000;
    const performanceNow = performance.now();
    const dateNow = Date.now();
    // if timeOrigin isn't available set delta to threshold so it isn't used
    const timeOriginDelta = performance.timeOrigin ? Math.abs(performance.timeOrigin + performanceNow - dateNow) : threshold;
    const timeOriginIsReliable = timeOriginDelta < threshold;
    // While performance.timing.navigationStart is deprecated in favor of performance.timeOrigin, performance.timeOrigin
    // is not as widely supported. Namely, performance.timeOrigin is undefined in Safari as of writing.
    // Also as of writing, performance.timing is not available in Web Workers in mainstream browsers, so it is not always
    // a valid fallback. In the absence of an initial time provided by the browser, fallback to the current time from the
    // Date API.
    // eslint-disable-next-line deprecation/deprecation
    const navigationStart = performance.timing && performance.timing.navigationStart;
    const hasNavigationStart = typeof navigationStart === 'number';
    // if navigationStart isn't available set delta to threshold so it isn't used
    const navigationStartDelta = hasNavigationStart ? Math.abs(navigationStart + performanceNow - dateNow) : threshold;
    const navigationStartIsReliable = navigationStartDelta < threshold;
    if (timeOriginIsReliable || navigationStartIsReliable) {
        // Use the more reliable time origin
        if (timeOriginDelta <= navigationStartDelta) {
            // eslint-disable-next-line deprecation/deprecation
            _browserPerformanceTimeOriginMode = 'timeOrigin';
            return performance.timeOrigin;
        } else {
            // eslint-disable-next-line deprecation/deprecation
            _browserPerformanceTimeOriginMode = 'navigationStart';
            return navigationStart;
        }
    }
    // Either both timeOrigin and navigationStart are skewed or neither is available, fallback to Date.
    // eslint-disable-next-line deprecation/deprecation
    _browserPerformanceTimeOriginMode = 'dateNow';
    return dateNow;
})();
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/misc.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addContextToFrame",
    ()=>addContextToFrame,
    "addExceptionMechanism",
    ()=>addExceptionMechanism,
    "addExceptionTypeValue",
    ()=>addExceptionTypeValue,
    "arrayify",
    ()=>arrayify,
    "checkOrSetAlreadyCaught",
    ()=>checkOrSetAlreadyCaught,
    "getEventDescription",
    ()=>getEventDescription,
    "parseSemver",
    ()=>parseSemver,
    "uuid4",
    ()=>uuid4
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/string.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
;
;
/**
 * UUID4 generator
 *
 * @returns string Generated UUID4.
 */ function uuid4() {
    const gbl = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"];
    const crypto = gbl.crypto || gbl.msCrypto;
    let getRandomByte = ()=>Math.random() * 16;
    try {
        if (crypto && crypto.randomUUID) {
            return crypto.randomUUID().replace(/-/g, '');
        }
        if (crypto && crypto.getRandomValues) {
            getRandomByte = ()=>{
                // crypto.getRandomValues might return undefined instead of the typed array
                // in old Chromium versions (e.g. 23.0.1235.0 (151422))
                // However, `typedArray` is still filled in-place.
                // @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#typedarray
                const typedArray = new Uint8Array(1);
                crypto.getRandomValues(typedArray);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return typedArray[0];
            };
        }
    } catch (_) {
    // some runtimes can crash invoking crypto
    // https://github.com/getsentry/sentry-javascript/issues/8935
    }
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
    // Concatenating the following numbers as strings results in '10000000100040008000100000000000'
    return ([
        1e7
    ] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, (c)=>// eslint-disable-next-line no-bitwise
        (c ^ (getRandomByte() & 15) >> c / 4).toString(16));
}
function getFirstException(event) {
    return event.exception && event.exception.values ? event.exception.values[0] : undefined;
}
/**
 * Extracts either message or type+value from an event that can be used for user-facing logs
 * @returns event's description
 */ function getEventDescription(event) {
    const { message, event_id: eventId } = event;
    if (message) {
        return message;
    }
    const firstException = getFirstException(event);
    if (firstException) {
        if (firstException.type && firstException.value) {
            return `${firstException.type}: ${firstException.value}`;
        }
        return firstException.type || firstException.value || eventId || '<unknown>';
    }
    return eventId || '<unknown>';
}
/**
 * Adds exception values, type and value to an synthetic Exception.
 * @param event The event to modify.
 * @param value Value of the exception.
 * @param type Type of the exception.
 * @hidden
 */ function addExceptionTypeValue(event, value, type) {
    const exception = event.exception = event.exception || {};
    const values = exception.values = exception.values || [];
    const firstException = values[0] = values[0] || {};
    if (!firstException.value) {
        firstException.value = value || '';
    }
    if (!firstException.type) {
        firstException.type = type || 'Error';
    }
}
/**
 * Adds exception mechanism data to a given event. Uses defaults if the second parameter is not passed.
 *
 * @param event The event to modify.
 * @param newMechanism Mechanism data to add to the event.
 * @hidden
 */ function addExceptionMechanism(event, newMechanism) {
    const firstException = getFirstException(event);
    if (!firstException) {
        return;
    }
    const defaultMechanism = {
        type: 'generic',
        handled: true
    };
    const currentMechanism = firstException.mechanism;
    firstException.mechanism = {
        ...defaultMechanism,
        ...currentMechanism,
        ...newMechanism
    };
    if (newMechanism && 'data' in newMechanism) {
        const mergedData = {
            ...currentMechanism && currentMechanism.data,
            ...newMechanism.data
        };
        firstException.mechanism.data = mergedData;
    }
}
// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
/**
 * Represents Semantic Versioning object
 */ function _parseInt(input) {
    return parseInt(input || '', 10);
}
/**
 * Parses input into a SemVer interface
 * @param input string representation of a semver version
 */ function parseSemver(input) {
    const match = input.match(SEMVER_REGEXP) || [];
    const major = _parseInt(match[1]);
    const minor = _parseInt(match[2]);
    const patch = _parseInt(match[3]);
    return {
        buildmetadata: match[5],
        major: isNaN(major) ? undefined : major,
        minor: isNaN(minor) ? undefined : minor,
        patch: isNaN(patch) ? undefined : patch,
        prerelease: match[4]
    };
}
/**
 * This function adds context (pre/post/line) lines to the provided frame
 *
 * @param lines string[] containing all lines
 * @param frame StackFrame that will be mutated
 * @param linesOfContext number of context lines we want to add pre/post
 */ function addContextToFrame(lines, frame, linesOfContext = 5) {
    // When there is no line number in the frame, attaching context is nonsensical and will even break grouping
    if (frame.lineno === undefined) {
        return;
    }
    const maxLines = lines.length;
    const sourceLine = Math.max(Math.min(maxLines - 1, frame.lineno - 1), 0);
    frame.pre_context = lines.slice(Math.max(0, sourceLine - linesOfContext), sourceLine).map((line)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["snipLine"])(line, 0));
    // We guard here to ensure this is not larger than the existing number of lines
    const lineIndex = Math.min(maxLines - 1, sourceLine);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    frame.context_line = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["snipLine"])(lines[lineIndex], frame.colno || 0);
    frame.post_context = lines.slice(Math.min(sourceLine + 1, maxLines), sourceLine + 1 + linesOfContext).map((line)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["snipLine"])(line, 0));
}
/**
 * Checks whether or not we've already captured the given exception (note: not an identical exception - the very object
 * in question), and marks it captured if not.
 *
 * This is useful because it's possible for an error to get captured by more than one mechanism. After we intercept and
 * record an error, we rethrow it (assuming we've intercepted it before it's reached the top-level global handlers), so
 * that we don't interfere with whatever effects the error might have had were the SDK not there. At that point, because
 * the error has been rethrown, it's possible for it to bubble up to some other code we've instrumented. If it's not
 * caught after that, it will bubble all the way up to the global handlers (which of course we also instrument). This
 * function helps us ensure that even if we encounter the same error more than once, we only record it the first time we
 * see it.
 *
 * Note: It will ignore primitives (always return `false` and not mark them as seen), as properties can't be set on
 * them. {@link: Object.objectify} can be used on exceptions to convert any that are primitives into their equivalent
 * object wrapper forms so that this check will always work. However, because we need to flag the exact object which
 * will get rethrown, and because that rethrowing happens outside of the event processing pipeline, the objectification
 * must be done before the exception captured.
 *
 * @param A thrown exception to check or flag as having been seen
 * @returns `true` if the exception has already been captured, `false` if not (with the side effect of marking it seen)
 */ function checkOrSetAlreadyCaught(exception) {
    if (isAlreadyCaptured(exception)) {
        return true;
    }
    try {
        // set it this way rather than by assignment so that it's not ennumerable and therefore isn't recorded by the
        // `ExtraErrorData` integration
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addNonEnumerableProperty"])(exception, '__sentry_captured__', true);
    } catch (err) {
    // `exception` is a primitive, so we can't mark it seen
    }
    return false;
}
function isAlreadyCaptured(exception) {
    try {
        return exception.__sentry_captured__;
    } catch (e) {} // eslint-disable-line no-empty
}
/**
 * Checks whether the given input is already an array, and if it isn't, wraps it in one.
 *
 * @param maybeArray Input to turn into an array, if necessary
 * @returns The input, if already an array, or an array with the input as the only element, if not
 *
 * @deprecated This function has been deprecated and will not be replaced.
 */ function arrayify(maybeArray) {
    return Array.isArray(maybeArray) ? maybeArray : [
        maybeArray
    ];
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/session.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "closeSession",
    ()=>closeSession,
    "makeSession",
    ()=>makeSession,
    "updateSession",
    ()=>updateSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/time.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/misc.js [app-client] (ecmascript)");
;
;
;
;
;
;
/**
 * Creates a new `Session` object by setting certain default parameters. If optional @param context
 * is passed, the passed properties are applied to the session object.
 *
 * @param context (optional) additional properties to be applied to the returned session object
 *
 * @returns a new `Session` object
 */ function makeSession(context) {
    // Both timestamp and started are in seconds since the UNIX epoch.
    const startingTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["timestampInSeconds"])();
    const session = {
        sid: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])(),
        init: true,
        timestamp: startingTime,
        started: startingTime,
        duration: 0,
        status: 'ok',
        errors: 0,
        ignoreDuration: false,
        toJSON: ()=>sessionToJSON(session)
    };
    if (context) {
        updateSession(session, context);
    }
    return session;
}
/**
 * Updates a session object with the properties passed in the context.
 *
 * Note that this function mutates the passed object and returns void.
 * (Had to do this instead of returning a new and updated session because closing and sending a session
 * makes an update to the session after it was passed to the sending logic.
 * @see BaseClient.captureSession )
 *
 * @param session the `Session` to update
 * @param context the `SessionContext` holding the properties that should be updated in @param session
 */ // eslint-disable-next-line complexity
function updateSession(session, context = {}) {
    if (context.user) {
        if (!session.ipAddress && context.user.ip_address) {
            session.ipAddress = context.user.ip_address;
        }
        if (!session.did && !context.did) {
            session.did = context.user.id || context.user.email || context.user.username;
        }
    }
    session.timestamp = context.timestamp || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["timestampInSeconds"])();
    if (context.abnormal_mechanism) {
        session.abnormal_mechanism = context.abnormal_mechanism;
    }
    if (context.ignoreDuration) {
        session.ignoreDuration = context.ignoreDuration;
    }
    if (context.sid) {
        // Good enough uuid validation. — Kamil
        session.sid = context.sid.length === 32 ? context.sid : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])();
    }
    if (context.init !== undefined) {
        session.init = context.init;
    }
    if (!session.did && context.did) {
        session.did = `${context.did}`;
    }
    if (typeof context.started === 'number') {
        session.started = context.started;
    }
    if (session.ignoreDuration) {
        session.duration = undefined;
    } else if (typeof context.duration === 'number') {
        session.duration = context.duration;
    } else {
        const duration = session.timestamp - session.started;
        session.duration = duration >= 0 ? duration : 0;
    }
    if (context.release) {
        session.release = context.release;
    }
    if (context.environment) {
        session.environment = context.environment;
    }
    if (!session.ipAddress && context.ipAddress) {
        session.ipAddress = context.ipAddress;
    }
    if (!session.userAgent && context.userAgent) {
        session.userAgent = context.userAgent;
    }
    if (typeof context.errors === 'number') {
        session.errors = context.errors;
    }
    if (context.status) {
        session.status = context.status;
    }
}
/**
 * Closes a session by setting its status and updating the session object with it.
 * Internally calls `updateSession` to update the passed session object.
 *
 * Note that this function mutates the passed session (@see updateSession for explanation).
 *
 * @param session the `Session` object to be closed
 * @param status the `SessionStatus` with which the session was closed. If you don't pass a status,
 *               this function will keep the previously set status, unless it was `'ok'` in which case
 *               it is changed to `'exited'`.
 */ function closeSession(session, status) {
    let context = {};
    if (status) {
        context = {
            status
        };
    } else if (session.status === 'ok') {
        context = {
            status: 'exited'
        };
    }
    updateSession(session, context);
}
/**
 * Serializes a passed session object to a JSON object with a slightly different structure.
 * This is necessary because the Sentry backend requires a slightly different schema of a session
 * than the one the JS SDKs use internally.
 *
 * @param session the session to be converted
 *
 * @returns a JSON object of the passed session
 */ function sessionToJSON(session) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])({
        sid: `${session.sid}`,
        init: session.init,
        // Make sure that sec is converted to ms for date constructor
        started: new Date(session.started * 1000).toISOString(),
        timestamp: new Date(session.timestamp * 1000).toISOString(),
        status: session.status,
        errors: session.errors,
        did: typeof session.did === 'number' || typeof session.did === 'string' ? `${session.did}` : undefined,
        duration: session.duration,
        abnormal_mechanism: session.abnormal_mechanism,
        attrs: {
            release: session.release,
            environment: session.environment,
            ip_address: session.ipAddress,
            user_agent: session.userAgent
        }
    });
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/propagationContext.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generatePropagationContext",
    ()=>generatePropagationContext,
    "generateSpanId",
    ()=>generateSpanId,
    "generateTraceId",
    ()=>generateTraceId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/misc.js [app-client] (ecmascript)");
;
/**
 * Returns a new minimal propagation context.
 *
 * @deprecated Use `generateTraceId` and `generateSpanId` instead.
 */ function generatePropagationContext() {
    return {
        traceId: generateTraceId(),
        spanId: generateSpanId()
    };
}
/**
 * Generate a random, valid trace ID.
 */ function generateTraceId() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])();
}
/**
 * Generate a random, valid span ID.
 */ function generateSpanId() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])().substring(16);
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils/merge.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "merge",
    ()=>merge
]);
/**
 * Shallow merge two objects.
 * Does not mutate the passed in objects.
 * Undefined/empty values in the merge object will overwrite existing values.
 *
 * By default, this merges 2 levels deep.
 */ function merge(initialObj, mergeObj, levels = 2) {
    // If the merge value is not an object, or we have no merge levels left,
    // we just set the value to the merge value
    if (!mergeObj || typeof mergeObj !== 'object' || levels <= 0) {
        return mergeObj;
    }
    // If the merge object is an empty object, and the initial object is not undefined, we return the initial object
    if (initialObj && mergeObj && Object.keys(mergeObj).length === 0) {
        return initialObj;
    }
    // Clone object
    const output = {
        ...initialObj
    };
    // Merge values into output, resursively
    for(const key in mergeObj){
        if (Object.prototype.hasOwnProperty.call(mergeObj, key)) {
            output[key] = merge(output[key], mergeObj[key], levels - 1);
        }
    }
    return output;
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils/spanOnScope.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_getSpanForScope",
    ()=>_getSpanForScope,
    "_setSpanForScope",
    ()=>_setSpanForScope
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
;
const SCOPE_SPAN_FIELD = '_sentrySpan';
/**
 * Set the active span for a given scope.
 * NOTE: This should NOT be used directly, but is only used internally by the trace methods.
 */ function _setSpanForScope(scope, span) {
    if (span) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addNonEnumerableProperty"])(scope, SCOPE_SPAN_FIELD, span);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete scope[SCOPE_SPAN_FIELD];
    }
}
/**
 * Get the active span for a given scope.
 * NOTE: This should NOT be used directly, but is only used internally by the trace methods.
 */ function _getSpanForScope(scope) {
    return scope[SCOPE_SPAN_FIELD];
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/scope.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Scope",
    ()=>Scope
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/session.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/misc.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/propagationContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/time.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/merge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanOnScope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/spanOnScope.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
/**
 * Default value for maximum number of breadcrumbs added to an event.
 */ const DEFAULT_MAX_BREADCRUMBS = 100;
/**
 * Holds additional event information.
 */ class ScopeClass {
    /** Flag if notifying is happening. */ /** Callback for client to receive scope changes. */ /** Callback list that will be called during event processing. */ /** Array of breadcrumbs. */ /** User */ /** Tags */ /** Extra */ /** Contexts */ /** Attachments */ /** Propagation Context for distributed tracing */ /**
   * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
   * sent to Sentry
   */ /** Fingerprint */ /** Severity */ /**
   * Transaction Name
   *
   * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
   * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
   */ /** Session */ /** Request Mode Session Status */ // eslint-disable-next-line deprecation/deprecation
    /** The client on this scope */ /** Contains the last event id of a captured event.  */ // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
    constructor(){
        this._notifyingListeners = false;
        this._scopeListeners = [];
        this._eventProcessors = [];
        this._breadcrumbs = [];
        this._attachments = [];
        this._user = {};
        this._tags = {};
        this._extra = {};
        this._contexts = {};
        this._sdkProcessingMetadata = {};
        this._propagationContext = {
            traceId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateTraceId"])(),
            spanId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSpanId"])()
        };
    }
    /**
   * @inheritDoc
   */ clone() {
        const newScope = new ScopeClass();
        newScope._breadcrumbs = [
            ...this._breadcrumbs
        ];
        newScope._tags = {
            ...this._tags
        };
        newScope._extra = {
            ...this._extra
        };
        newScope._contexts = {
            ...this._contexts
        };
        if (this._contexts.flags) {
            // We need to copy the `values` array so insertions on a cloned scope
            // won't affect the original array.
            newScope._contexts.flags = {
                values: [
                    ...this._contexts.flags.values
                ]
            };
        }
        newScope._user = this._user;
        newScope._level = this._level;
        newScope._session = this._session;
        newScope._transactionName = this._transactionName;
        newScope._fingerprint = this._fingerprint;
        newScope._eventProcessors = [
            ...this._eventProcessors
        ];
        newScope._requestSession = this._requestSession;
        newScope._attachments = [
            ...this._attachments
        ];
        newScope._sdkProcessingMetadata = {
            ...this._sdkProcessingMetadata
        };
        newScope._propagationContext = {
            ...this._propagationContext
        };
        newScope._client = this._client;
        newScope._lastEventId = this._lastEventId;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanOnScope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_setSpanForScope"])(newScope, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanOnScope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_getSpanForScope"])(this));
        return newScope;
    }
    /**
   * @inheritDoc
   */ setClient(client) {
        this._client = client;
    }
    /**
   * @inheritDoc
   */ setLastEventId(lastEventId) {
        this._lastEventId = lastEventId;
    }
    /**
   * @inheritDoc
   */ getClient() {
        return this._client;
    }
    /**
   * @inheritDoc
   */ lastEventId() {
        return this._lastEventId;
    }
    /**
   * @inheritDoc
   */ addScopeListener(callback) {
        this._scopeListeners.push(callback);
    }
    /**
   * @inheritDoc
   */ addEventProcessor(callback) {
        this._eventProcessors.push(callback);
        return this;
    }
    /**
   * @inheritDoc
   */ setUser(user) {
        // If null is passed we want to unset everything, but still define keys,
        // so that later down in the pipeline any existing values are cleared.
        this._user = user || {
            email: undefined,
            id: undefined,
            ip_address: undefined,
            username: undefined
        };
        if (this._session) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateSession"])(this._session, {
                user
            });
        }
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ getUser() {
        return this._user;
    }
    /**
   * @inheritDoc
   */ // eslint-disable-next-line deprecation/deprecation
    getRequestSession() {
        return this._requestSession;
    }
    /**
   * @inheritDoc
   */ // eslint-disable-next-line deprecation/deprecation
    setRequestSession(requestSession) {
        this._requestSession = requestSession;
        return this;
    }
    /**
   * @inheritDoc
   */ setTags(tags) {
        this._tags = {
            ...this._tags,
            ...tags
        };
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ setTag(key, value) {
        this._tags = {
            ...this._tags,
            [key]: value
        };
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ setExtras(extras) {
        this._extra = {
            ...this._extra,
            ...extras
        };
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ setExtra(key, extra) {
        this._extra = {
            ...this._extra,
            [key]: extra
        };
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ setFingerprint(fingerprint) {
        this._fingerprint = fingerprint;
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ setLevel(level) {
        this._level = level;
        this._notifyScopeListeners();
        return this;
    }
    /**
   * Sets the transaction name on the scope so that the name of e.g. taken server route or
   * the page location is attached to future events.
   *
   * IMPORTANT: Calling this function does NOT change the name of the currently active
   * root span. If you want to change the name of the active root span, use
   * `Sentry.updateSpanName(rootSpan, 'new name')` instead.
   *
   * By default, the SDK updates the scope's transaction name automatically on sensible
   * occasions, such as a page navigation or when handling a new request on the server.
   */ setTransactionName(name) {
        this._transactionName = name;
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ setContext(key, context) {
        if (context === null) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this._contexts[key];
        } else {
            this._contexts[key] = context;
        }
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ setSession(session) {
        if (!session) {
            delete this._session;
        } else {
            this._session = session;
        }
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ getSession() {
        return this._session;
    }
    /**
   * @inheritDoc
   */ update(captureContext) {
        if (!captureContext) {
            return this;
        }
        const scopeToMerge = typeof captureContext === 'function' ? captureContext(this) : captureContext;
        const [scopeInstance, requestSession] = scopeToMerge instanceof Scope ? [
            scopeToMerge.getScopeData(),
            scopeToMerge.getRequestSession()
        ] : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isPlainObject"])(scopeToMerge) ? [
            captureContext,
            captureContext.requestSession
        ] : [];
        const { tags, extra, user, contexts, level, fingerprint = [], propagationContext } = scopeInstance || {};
        this._tags = {
            ...this._tags,
            ...tags
        };
        this._extra = {
            ...this._extra,
            ...extra
        };
        this._contexts = {
            ...this._contexts,
            ...contexts
        };
        if (user && Object.keys(user).length) {
            this._user = user;
        }
        if (level) {
            this._level = level;
        }
        if (fingerprint.length) {
            this._fingerprint = fingerprint;
        }
        if (propagationContext) {
            this._propagationContext = propagationContext;
        }
        if (requestSession) {
            this._requestSession = requestSession;
        }
        return this;
    }
    /**
   * @inheritDoc
   */ clear() {
        // client is not cleared here on purpose!
        this._breadcrumbs = [];
        this._tags = {};
        this._extra = {};
        this._user = {};
        this._contexts = {};
        this._level = undefined;
        this._transactionName = undefined;
        this._fingerprint = undefined;
        this._requestSession = undefined;
        this._session = undefined;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanOnScope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_setSpanForScope"])(this, undefined);
        this._attachments = [];
        this.setPropagationContext({
            traceId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateTraceId"])()
        });
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ addBreadcrumb(breadcrumb, maxBreadcrumbs) {
        const maxCrumbs = typeof maxBreadcrumbs === 'number' ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
        // No data has been changed, so don't notify scope listeners
        if (maxCrumbs <= 0) {
            return this;
        }
        const mergedBreadcrumb = {
            timestamp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dateTimestampInSeconds"])(),
            ...breadcrumb
        };
        this._breadcrumbs.push(mergedBreadcrumb);
        if (this._breadcrumbs.length > maxCrumbs) {
            this._breadcrumbs = this._breadcrumbs.slice(-maxCrumbs);
            if (this._client) {
                this._client.recordDroppedEvent('buffer_overflow', 'log_item');
            }
        }
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ getLastBreadcrumb() {
        return this._breadcrumbs[this._breadcrumbs.length - 1];
    }
    /**
   * @inheritDoc
   */ clearBreadcrumbs() {
        this._breadcrumbs = [];
        this._notifyScopeListeners();
        return this;
    }
    /**
   * @inheritDoc
   */ addAttachment(attachment) {
        this._attachments.push(attachment);
        return this;
    }
    /**
   * @inheritDoc
   */ clearAttachments() {
        this._attachments = [];
        return this;
    }
    /** @inheritDoc */ getScopeData() {
        return {
            breadcrumbs: this._breadcrumbs,
            attachments: this._attachments,
            contexts: this._contexts,
            tags: this._tags,
            extra: this._extra,
            user: this._user,
            level: this._level,
            fingerprint: this._fingerprint || [],
            eventProcessors: this._eventProcessors,
            propagationContext: this._propagationContext,
            sdkProcessingMetadata: this._sdkProcessingMetadata,
            transactionName: this._transactionName,
            span: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanOnScope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_getSpanForScope"])(this)
        };
    }
    /**
   * @inheritDoc
   */ setSDKProcessingMetadata(newData) {
        this._sdkProcessingMetadata = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["merge"])(this._sdkProcessingMetadata, newData, 2);
        return this;
    }
    /**
   * @inheritDoc
   */ setPropagationContext(context) {
        this._propagationContext = {
            // eslint-disable-next-line deprecation/deprecation
            spanId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSpanId"])(),
            ...context
        };
        return this;
    }
    /**
   * @inheritDoc
   */ getPropagationContext() {
        return this._propagationContext;
    }
    /**
   * @inheritDoc
   */ captureException(exception, hint) {
        const eventId = hint && hint.event_id ? hint.event_id : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])();
        if (!this._client) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('No client configured on scope - will not capture exception!');
            return eventId;
        }
        const syntheticException = new Error('Sentry syntheticException');
        this._client.captureException(exception, {
            originalException: exception,
            syntheticException,
            ...hint,
            event_id: eventId
        }, this);
        return eventId;
    }
    /**
   * @inheritDoc
   */ captureMessage(message, level, hint) {
        const eventId = hint && hint.event_id ? hint.event_id : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])();
        if (!this._client) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('No client configured on scope - will not capture message!');
            return eventId;
        }
        const syntheticException = new Error(message);
        this._client.captureMessage(message, level, {
            originalException: message,
            syntheticException,
            ...hint,
            event_id: eventId
        }, this);
        return eventId;
    }
    /**
   * @inheritDoc
   */ captureEvent(event, hint) {
        const eventId = hint && hint.event_id ? hint.event_id : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])();
        if (!this._client) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('No client configured on scope - will not capture event!');
            return eventId;
        }
        this._client.captureEvent(event, {
            ...hint,
            event_id: eventId
        }, this);
        return eventId;
    }
    /**
   * This will be called on every set call.
   */ _notifyScopeListeners() {
        // We need this check for this._notifyingListeners to be able to work on scope during updates
        // If this check is not here we'll produce endless recursion when something is done with the scope
        // during the callback.
        if (!this._notifyingListeners) {
            this._notifyingListeners = true;
            this._scopeListeners.forEach((callback)=>{
                callback(this);
            });
            this._notifyingListeners = false;
        }
    }
}
/**
 * Holds additional event information.
 */ const Scope = ScopeClass;
;
}),
"[project]/node_modules/@sentry/core/build/esm/defaultScopes.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDefaultCurrentScope",
    ()=>getDefaultCurrentScope,
    "getDefaultIsolationScope",
    ()=>getDefaultIsolationScope
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/scope.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
;
/** Get the default current scope. */ function getDefaultCurrentScope() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalSingleton"])('defaultCurrentScope', ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scope"]());
}
/** Get the default isolation scope. */ function getDefaultIsolationScope() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalSingleton"])('defaultIsolationScope', ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scope"]());
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/asyncContext/stackStrategy.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AsyncContextStack",
    ()=>AsyncContextStack,
    "getStackAsyncContextStrategy",
    ()=>getStackAsyncContextStrategy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$defaultScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/defaultScopes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/scope.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/carrier.js [app-client] (ecmascript)");
;
;
;
;
/**
 * This is an object that holds a stack of scopes.
 */ class AsyncContextStack {
    constructor(scope, isolationScope){
        let assignedScope;
        if (!scope) {
            assignedScope = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scope"]();
        } else {
            assignedScope = scope;
        }
        let assignedIsolationScope;
        if (!isolationScope) {
            assignedIsolationScope = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scope"]();
        } else {
            assignedIsolationScope = isolationScope;
        }
        // scope stack for domains or the process
        this._stack = [
            {
                scope: assignedScope
            }
        ];
        this._isolationScope = assignedIsolationScope;
    }
    /**
   * Fork a scope for the stack.
   */ withScope(callback) {
        const scope = this._pushScope();
        let maybePromiseResult;
        try {
            maybePromiseResult = callback(scope);
        } catch (e) {
            this._popScope();
            throw e;
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isThenable"])(maybePromiseResult)) {
            // @ts-expect-error - isThenable returns the wrong type
            return maybePromiseResult.then((res)=>{
                this._popScope();
                return res;
            }, (e)=>{
                this._popScope();
                throw e;
            });
        }
        this._popScope();
        return maybePromiseResult;
    }
    /**
   * Get the client of the stack.
   */ getClient() {
        return this.getStackTop().client;
    }
    /**
   * Returns the scope of the top stack.
   */ getScope() {
        return this.getStackTop().scope;
    }
    /**
   * Get the isolation scope for the stack.
   */ getIsolationScope() {
        return this._isolationScope;
    }
    /**
   * Returns the topmost scope layer in the order domain > local > process.
   */ getStackTop() {
        return this._stack[this._stack.length - 1];
    }
    /**
   * Push a scope to the stack.
   */ _pushScope() {
        // We want to clone the content of prev scope
        const scope = this.getScope().clone();
        this._stack.push({
            client: this.getClient(),
            scope
        });
        return scope;
    }
    /**
   * Pop a scope from the stack.
   */ _popScope() {
        if (this._stack.length <= 1) return false;
        return !!this._stack.pop();
    }
}
/**
 * Get the global async context stack.
 * This will be removed during the v8 cycle and is only here to make migration easier.
 */ function getAsyncContextStack() {
    const registry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMainCarrier"])();
    const sentry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSentryCarrier"])(registry);
    return sentry.stack = sentry.stack || new AsyncContextStack((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$defaultScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultCurrentScope"])(), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$defaultScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultIsolationScope"])());
}
function withScope(callback) {
    return getAsyncContextStack().withScope(callback);
}
function withSetScope(scope, callback) {
    const stack = getAsyncContextStack();
    return stack.withScope(()=>{
        stack.getStackTop().scope = scope;
        return callback(scope);
    });
}
function withIsolationScope(callback) {
    return getAsyncContextStack().withScope(()=>{
        return callback(getAsyncContextStack().getIsolationScope());
    });
}
/**
 * Get the stack-based async context strategy.
 */ function getStackAsyncContextStrategy() {
    return {
        withIsolationScope,
        withScope,
        withSetScope,
        withSetIsolationScope: (_isolationScope, callback)=>{
            return withIsolationScope(callback);
        },
        getCurrentScope: ()=>getAsyncContextStack().getScope(),
        getIsolationScope: ()=>getAsyncContextStack().getIsolationScope()
    };
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/asyncContext/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAsyncContextStrategy",
    ()=>getAsyncContextStrategy,
    "setAsyncContextStrategy",
    ()=>setAsyncContextStrategy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/carrier.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$stackStrategy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/asyncContext/stackStrategy.js [app-client] (ecmascript)");
;
;
/**
 * @private Private API with no semver guarantees!
 *
 * Sets the global async context strategy
 */ function setAsyncContextStrategy(strategy) {
    // Get main carrier (global for every environment)
    const registry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMainCarrier"])();
    const sentry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSentryCarrier"])(registry);
    sentry.acs = strategy;
}
/**
 * Get the current async context strategy.
 * If none has been setup, the default will be used.
 */ function getAsyncContextStrategy(carrier) {
    const sentry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSentryCarrier"])(carrier);
    if (sentry.acs) {
        return sentry.acs;
    }
    // Otherwise, use the default one (stack)
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$stackStrategy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStackAsyncContextStrategy"])();
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/currentScopes.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getClient",
    ()=>getClient,
    "getCurrentScope",
    ()=>getCurrentScope,
    "getGlobalScope",
    ()=>getGlobalScope,
    "getIsolationScope",
    ()=>getIsolationScope,
    "getTraceContextFromScope",
    ()=>getTraceContextFromScope,
    "withIsolationScope",
    ()=>withIsolationScope,
    "withScope",
    ()=>withScope
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/asyncContext/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/carrier.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/scope.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
;
;
;
;
/**
 * Get the currently active scope.
 */ function getCurrentScope() {
    const carrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMainCarrier"])();
    const acs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAsyncContextStrategy"])(carrier);
    return acs.getCurrentScope();
}
/**
 * Get the currently active isolation scope.
 * The isolation scope is active for the current execution context.
 */ function getIsolationScope() {
    const carrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMainCarrier"])();
    const acs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAsyncContextStrategy"])(carrier);
    return acs.getIsolationScope();
}
/**
 * Get the global scope.
 * This scope is applied to _all_ events.
 */ function getGlobalScope() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalSingleton"])('globalScope', ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scope"]());
}
/**
 * Creates a new scope with and executes the given operation within.
 * The scope is automatically removed once the operation
 * finishes or throws.
 */ /**
 * Either creates a new active scope, or sets the given scope as active scope in the given callback.
 */ function withScope(...rest) {
    const carrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMainCarrier"])();
    const acs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAsyncContextStrategy"])(carrier);
    // If a scope is defined, we want to make this the active scope instead of the default one
    if (rest.length === 2) {
        const [scope, callback] = rest;
        if (!scope) {
            return acs.withScope(callback);
        }
        return acs.withSetScope(scope, callback);
    }
    return acs.withScope(rest[0]);
}
/**
 * Attempts to fork the current isolation scope and the current scope based on the current async context strategy. If no
 * async context strategy is set, the isolation scope and the current scope will not be forked (this is currently the
 * case, for example, in the browser).
 *
 * Usage of this function in environments without async context strategy is discouraged and may lead to unexpected behaviour.
 *
 * This function is intended for Sentry SDK and SDK integration development. It is not recommended to be used in "normal"
 * applications directly because it comes with pitfalls. Use at your own risk!
 */ /**
 * Either creates a new active isolation scope, or sets the given isolation scope as active scope in the given callback.
 */ function withIsolationScope(...rest) {
    const carrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMainCarrier"])();
    const acs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAsyncContextStrategy"])(carrier);
    // If a scope is defined, we want to make this the active scope instead of the default one
    if (rest.length === 2) {
        const [isolationScope, callback] = rest;
        if (!isolationScope) {
            return acs.withIsolationScope(callback);
        }
        return acs.withSetIsolationScope(isolationScope, callback);
    }
    return acs.withIsolationScope(rest[0]);
}
/**
 * Get the currently active client.
 */ function getClient() {
    return getCurrentScope().getClient();
}
/**
 * Get a trace context for the given scope.
 */ function getTraceContextFromScope(scope) {
    const propagationContext = scope.getPropagationContext();
    // TODO(v9): Use generateSpanId() instead of spanId
    // eslint-disable-next-line deprecation/deprecation
    const { traceId, spanId, parentSpanId } = propagationContext;
    const traceContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])({
        trace_id: traceId,
        span_id: spanId,
        parent_span_id: parentSpanId
    });
    return traceContext;
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/debug-build.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEBUG_BUILD",
    ()=>DEBUG_BUILD
]);
/**
 * This serves as a build time flag that will be true by default, but false in non-debug builds or if users replace `__SENTRY_DEBUG__` in their generated code.
 *
 * ATTENTION: This constant must never cross package boundaries (i.e. be exported) to guarantee that it can be used for tree shaking.
 */ const DEBUG_BUILD = typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__;
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/syncpromise.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SyncPromise",
    ()=>SyncPromise,
    "rejectedSyncPromise",
    ()=>rejectedSyncPromise,
    "resolvedSyncPromise",
    ()=>resolvedSyncPromise
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
;
/* eslint-disable @typescript-eslint/explicit-function-return-type */ /* eslint-disable @typescript-eslint/no-explicit-any */ /** SyncPromise internal states */ var States;
(function(States) {
    /** Pending */ const PENDING = 0;
    States[States["PENDING"] = PENDING] = "PENDING";
    /** Resolved / OK */ const RESOLVED = 1;
    States[States["RESOLVED"] = RESOLVED] = "RESOLVED";
    /** Rejected / Error */ const REJECTED = 2;
    States[States["REJECTED"] = REJECTED] = "REJECTED";
})(States || (States = {}));
// Overloads so we can call resolvedSyncPromise without arguments and generic argument
/**
 * Creates a resolved sync promise.
 *
 * @param value the value to resolve the promise with
 * @returns the resolved sync promise
 */ function resolvedSyncPromise(value) {
    return new SyncPromise((resolve)=>{
        resolve(value);
    });
}
/**
 * Creates a rejected sync promise.
 *
 * @param value the value to reject the promise with
 * @returns the rejected sync promise
 */ function rejectedSyncPromise(reason) {
    return new SyncPromise((_, reject)=>{
        reject(reason);
    });
}
/**
 * Thenable class that behaves like a Promise and follows it's interface
 * but is not async internally
 */ class SyncPromise {
    constructor(executor){
        SyncPromise.prototype.__init.call(this);
        SyncPromise.prototype.__init2.call(this);
        SyncPromise.prototype.__init3.call(this);
        SyncPromise.prototype.__init4.call(this);
        this._state = States.PENDING;
        this._handlers = [];
        try {
            executor(this._resolve, this._reject);
        } catch (e) {
            this._reject(e);
        }
    }
    /** JSDoc */ then(onfulfilled, onrejected) {
        return new SyncPromise((resolve, reject)=>{
            this._handlers.push([
                false,
                (result)=>{
                    if (!onfulfilled) {
                        // TODO: ¯\_(ツ)_/¯
                        // TODO: FIXME
                        resolve(result);
                    } else {
                        try {
                            resolve(onfulfilled(result));
                        } catch (e) {
                            reject(e);
                        }
                    }
                },
                (reason)=>{
                    if (!onrejected) {
                        reject(reason);
                    } else {
                        try {
                            resolve(onrejected(reason));
                        } catch (e) {
                            reject(e);
                        }
                    }
                }
            ]);
            this._executeHandlers();
        });
    }
    /** JSDoc */ catch(onrejected) {
        return this.then((val)=>val, onrejected);
    }
    /** JSDoc */ finally(onfinally) {
        return new SyncPromise((resolve, reject)=>{
            let val;
            let isRejected;
            return this.then((value)=>{
                isRejected = false;
                val = value;
                if (onfinally) {
                    onfinally();
                }
            }, (reason)=>{
                isRejected = true;
                val = reason;
                if (onfinally) {
                    onfinally();
                }
            }).then(()=>{
                if (isRejected) {
                    reject(val);
                    return;
                }
                resolve(val);
            });
        });
    }
    /** JSDoc */ __init() {
        this._resolve = (value)=>{
            this._setResult(States.RESOLVED, value);
        };
    }
    /** JSDoc */ __init2() {
        this._reject = (reason)=>{
            this._setResult(States.REJECTED, reason);
        };
    }
    /** JSDoc */ __init3() {
        this._setResult = (state, value)=>{
            if (this._state !== States.PENDING) {
                return;
            }
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isThenable"])(value)) {
                void value.then(this._resolve, this._reject);
                return;
            }
            this._state = state;
            this._value = value;
            this._executeHandlers();
        };
    }
    /** JSDoc */ __init4() {
        this._executeHandlers = ()=>{
            if (this._state === States.PENDING) {
                return;
            }
            const cachedHandlers = this._handlers.slice();
            this._handlers = [];
            cachedHandlers.forEach((handler)=>{
                if (handler[0]) {
                    return;
                }
                if (this._state === States.RESOLVED) {
                    handler[1](this._value);
                }
                if (this._state === States.REJECTED) {
                    handler[2](this._value);
                }
                handler[0] = true;
            });
        };
    }
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/eventProcessors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "notifyEventProcessors",
    ()=>notifyEventProcessors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/debug-build.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$syncpromise$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/syncpromise.js [app-client] (ecmascript)");
;
;
;
;
/**
 * Process an array of event processors, returning the processed event (or `null` if the event was dropped).
 */ function notifyEventProcessors(processors, event, hint, index = 0) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$syncpromise$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SyncPromise"]((resolve, reject)=>{
        const processor = processors[index];
        if (event === null || typeof processor !== 'function') {
            resolve(event);
        } else {
            const result = processor({
                ...event
            }, hint);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && processor.id && result === null && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].log(`Event processor "${processor.id}" dropped event`);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isThenable"])(result)) {
                void result.then((final)=>notifyEventProcessors(processors, final, hint, index + 1).then(resolve)).then(null, reject);
            } else {
                void notifyEventProcessors(processors, result, hint, index + 1).then(resolve).then(null, reject);
            }
        }
    });
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/debug-ids.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDebugImagesForResources",
    ()=>getDebugImagesForResources,
    "getFilenameToDebugIdMap",
    ()=>getFilenameToDebugIdMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
;
let parsedStackResults;
let lastKeysCount;
let cachedFilenameDebugIds;
/**
 * Returns a map of filenames to debug identifiers.
 */ function getFilenameToDebugIdMap(stackParser) {
    const debugIdMap = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"]._sentryDebugIds;
    if (!debugIdMap) {
        return {};
    }
    const debugIdKeys = Object.keys(debugIdMap);
    // If the count of registered globals hasn't changed since the last call, we
    // can just return the cached result.
    if (cachedFilenameDebugIds && debugIdKeys.length === lastKeysCount) {
        return cachedFilenameDebugIds;
    }
    lastKeysCount = debugIdKeys.length;
    // Build a map of filename -> debug_id.
    cachedFilenameDebugIds = debugIdKeys.reduce((acc, stackKey)=>{
        if (!parsedStackResults) {
            parsedStackResults = {};
        }
        const result = parsedStackResults[stackKey];
        if (result) {
            acc[result[0]] = result[1];
        } else {
            const parsedStack = stackParser(stackKey);
            for(let i = parsedStack.length - 1; i >= 0; i--){
                const stackFrame = parsedStack[i];
                const filename = stackFrame && stackFrame.filename;
                const debugId = debugIdMap[stackKey];
                if (filename && debugId) {
                    acc[filename] = debugId;
                    parsedStackResults[stackKey] = [
                        filename,
                        debugId
                    ];
                    break;
                }
            }
        }
        return acc;
    }, {});
    return cachedFilenameDebugIds;
}
/**
 * Returns a list of debug images for the given resources.
 */ function getDebugImagesForResources(stackParser, resource_paths) {
    const filenameDebugIdMap = getFilenameToDebugIdMap(stackParser);
    if (!filenameDebugIdMap) {
        return [];
    }
    const images = [];
    for (const path of resource_paths){
        if (path && filenameDebugIdMap[path]) {
            images.push({
                type: 'sourcemap',
                code_file: path,
                debug_id: filenameDebugIdMap[path]
            });
        }
    }
    return images;
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/memo.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "memoBuilder",
    ()=>memoBuilder
]);
/* eslint-disable @typescript-eslint/no-unsafe-member-access */ /* eslint-disable @typescript-eslint/no-explicit-any */ /**
 * Helper to decycle json objects
 *
 * @deprecated This function is deprecated and will be removed in the next major version.
 */ // TODO(v9): Move this function into normalize() directly
function memoBuilder() {
    const hasWeakSet = typeof WeakSet === 'function';
    const inner = hasWeakSet ? new WeakSet() : [];
    function memoize(obj) {
        if (hasWeakSet) {
            if (inner.has(obj)) {
                return true;
            }
            inner.add(obj);
            return false;
        }
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for(let i = 0; i < inner.length; i++){
            const value = inner[i];
            if (value === obj) {
                return true;
            }
        }
        inner.push(obj);
        return false;
    }
    function unmemoize(obj) {
        if (hasWeakSet) {
            inner.delete(obj);
        } else {
            for(let i = 0; i < inner.length; i++){
                if (inner[i] === obj) {
                    inner.splice(i, 1);
                    break;
                }
            }
        }
    }
    return [
        memoize,
        unmemoize
    ];
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/stacktrace.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UNKNOWN_FUNCTION",
    ()=>UNKNOWN_FUNCTION,
    "createStackParser",
    ()=>createStackParser,
    "getFramesFromEvent",
    ()=>getFramesFromEvent,
    "getFunctionName",
    ()=>getFunctionName,
    "stackParserFromStackParserOptions",
    ()=>stackParserFromStackParserOptions,
    "stripSentryFramesAndReverse",
    ()=>stripSentryFramesAndReverse
]);
const STACKTRACE_FRAME_LIMIT = 50;
const UNKNOWN_FUNCTION = '?';
// Used to sanitize webpack (error: *) wrapped stack errors
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STRIP_FRAME_REGEXP = /captureMessage|captureException/;
/**
 * Creates a stack parser with the supplied line parsers
 *
 * StackFrames are returned in the correct order for Sentry Exception
 * frames and with Sentry SDK internal frames removed from the top and bottom
 *
 */ function createStackParser(...parsers) {
    const sortedParsers = parsers.sort((a, b)=>a[0] - b[0]).map((p)=>p[1]);
    return (stack, skipFirstLines = 0, framesToPop = 0)=>{
        const frames = [];
        const lines = stack.split('\n');
        for(let i = skipFirstLines; i < lines.length; i++){
            const line = lines[i];
            // Ignore lines over 1kb as they are unlikely to be stack frames.
            // Many of the regular expressions use backtracking which results in run time that increases exponentially with
            // input size. Huge strings can result in hangs/Denial of Service:
            // https://github.com/getsentry/sentry-javascript/issues/2286
            if (line.length > 1024) {
                continue;
            }
            // https://github.com/getsentry/sentry-javascript/issues/5459
            // Remove webpack (error: *) wrappers
            const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, '$1') : line;
            // https://github.com/getsentry/sentry-javascript/issues/7813
            // Skip Error: lines
            if (cleanedLine.match(/\S*Error: /)) {
                continue;
            }
            for (const parser of sortedParsers){
                const frame = parser(cleanedLine);
                if (frame) {
                    frames.push(frame);
                    break;
                }
            }
            if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) {
                break;
            }
        }
        return stripSentryFramesAndReverse(frames.slice(framesToPop));
    };
}
/**
 * Gets a stack parser implementation from Options.stackParser
 * @see Options
 *
 * If options contains an array of line parsers, it is converted into a parser
 */ function stackParserFromStackParserOptions(stackParser) {
    if (Array.isArray(stackParser)) {
        return createStackParser(...stackParser);
    }
    return stackParser;
}
/**
 * Removes Sentry frames from the top and bottom of the stack if present and enforces a limit of max number of frames.
 * Assumes stack input is ordered from top to bottom and returns the reverse representation so call site of the
 * function that caused the crash is the last frame in the array.
 * @hidden
 */ function stripSentryFramesAndReverse(stack) {
    if (!stack.length) {
        return [];
    }
    const localStack = Array.from(stack);
    // If stack starts with one of our API calls, remove it (starts, meaning it's the top of the stack - aka last call)
    if (/sentryWrapped/.test(getLastStackFrame(localStack).function || '')) {
        localStack.pop();
    }
    // Reversing in the middle of the procedure allows us to just pop the values off the stack
    localStack.reverse();
    // If stack ends with one of our internal API calls, remove it (ends, meaning it's the bottom of the stack - aka top-most call)
    if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || '')) {
        localStack.pop();
        // When using synthetic events, we will have a 2 levels deep stack, as `new Error('Sentry syntheticException')`
        // is produced within the hub itself, making it:
        //
        //   Sentry.captureException()
        //   getCurrentHub().captureException()
        //
        // instead of just the top `Sentry` call itself.
        // This forces us to possibly strip an additional frame in the exact same was as above.
        if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || '')) {
            localStack.pop();
        }
    }
    return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame)=>({
            ...frame,
            filename: frame.filename || getLastStackFrame(localStack).filename,
            function: frame.function || UNKNOWN_FUNCTION
        }));
}
function getLastStackFrame(arr) {
    return arr[arr.length - 1] || {};
}
const defaultFunctionName = '<anonymous>';
/**
 * Safely extract function name from itself
 */ function getFunctionName(fn) {
    try {
        if (!fn || typeof fn !== 'function') {
            return defaultFunctionName;
        }
        return fn.name || defaultFunctionName;
    } catch (e) {
        // Just accessing custom props in some Selenium environments
        // can cause a "Permission denied" exception (see raven-js#495).
        return defaultFunctionName;
    }
}
/**
 * Get's stack frames from an event without needing to check for undefined properties.
 */ function getFramesFromEvent(event) {
    const exception = event.exception;
    if (exception) {
        const frames = [];
        try {
            // @ts-expect-error Object could be undefined
            exception.values.forEach((value)=>{
                // @ts-expect-error Value could be undefined
                if (value.stacktrace.frames) {
                    // @ts-expect-error Value could be undefined
                    frames.push(...value.stacktrace.frames);
                }
            });
            return frames;
        } catch (_oO) {
            return undefined;
        }
    }
    return undefined;
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/normalize.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalize",
    ()=>normalize,
    "normalizeToSize",
    ()=>normalizeToSize,
    "normalizeUrlToBase",
    ()=>normalizeUrlToBase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$memo$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/memo.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$stacktrace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/stacktrace.js [app-client] (ecmascript)");
;
;
;
;
/**
 * Recursively normalizes the given object.
 *
 * - Creates a copy to prevent original input mutation
 * - Skips non-enumerable properties
 * - When stringifying, calls `toJSON` if implemented
 * - Removes circular references
 * - Translates non-serializable values (`undefined`/`NaN`/functions) to serializable format
 * - Translates known global objects/classes to a string representations
 * - Takes care of `Error` object serialization
 * - Optionally limits depth of final output
 * - Optionally limits number of properties/elements included in any single object/array
 *
 * @param input The object to be normalized.
 * @param depth The max depth to which to normalize the object. (Anything deeper stringified whole.)
 * @param maxProperties The max number of elements or properties to be included in any single array or
 * object in the normalized output.
 * @returns A normalized version of the object, or `"**non-serializable**"` if any errors are thrown during normalization.
 */ // eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(input, depth = 100, maxProperties = +Infinity) {
    try {
        // since we're at the outermost level, we don't provide a key
        return visit('', input, depth, maxProperties);
    } catch (err) {
        return {
            ERROR: `**non-serializable** (${err})`
        };
    }
}
/** JSDoc */ function normalizeToSize(// eslint-disable-next-line @typescript-eslint/no-explicit-any
object, // Default Node.js REPL depth
depth = 3, // 100kB, as 200kB is max payload size, so half sounds reasonable
maxSize = 100 * 1024) {
    const normalized = normalize(object, depth);
    if (jsonSize(normalized) > maxSize) {
        return normalizeToSize(object, depth - 1, maxSize);
    }
    return normalized;
}
/**
 * Visits a node to perform normalization on it
 *
 * @param key The key corresponding to the given node
 * @param value The node to be visited
 * @param depth Optional number indicating the maximum recursion depth
 * @param maxProperties Optional maximum number of properties/elements included in any single object/array
 * @param memo Optional Memo class handling decycling
 */ function visit(key, value, depth = +Infinity, maxProperties = +Infinity, // eslint-disable-next-line deprecation/deprecation
memo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$memo$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memoBuilder"])()) {
    const [memoize, unmemoize] = memo;
    // Get the simple cases out of the way first
    if (value == null || // this matches null and undefined -> eqeq not eqeqeq
    [
        'boolean',
        'string'
    ].includes(typeof value) || typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    const stringified = stringifyValue(key, value);
    // Anything we could potentially dig into more (objects or arrays) will have come back as `"[object XXXX]"`.
    // Everything else will have already been serialized, so if we don't see that pattern, we're done.
    if (!stringified.startsWith('[object ')) {
        return stringified;
    }
    // From here on, we can assert that `value` is either an object or an array.
    // Do not normalize objects that we know have already been normalized. As a general rule, the
    // "__sentry_skip_normalization__" property should only be used sparingly and only should only be set on objects that
    // have already been normalized.
    if (value['__sentry_skip_normalization__']) {
        return value;
    }
    // We can set `__sentry_override_normalization_depth__` on an object to ensure that from there
    // We keep a certain amount of depth.
    // This should be used sparingly, e.g. we use it for the redux integration to ensure we get a certain amount of state.
    const remainingDepth = typeof value['__sentry_override_normalization_depth__'] === 'number' ? value['__sentry_override_normalization_depth__'] : depth;
    // We're also done if we've reached the max depth
    if (remainingDepth === 0) {
        // At this point we know `serialized` is a string of the form `"[object XXXX]"`. Clean it up so it's just `"[XXXX]"`.
        return stringified.replace('object ', '');
    }
    // If we've already visited this branch, bail out, as it's circular reference. If not, note that we're seeing it now.
    if (memoize(value)) {
        return '[Circular ~]';
    }
    // If the value has a `toJSON` method, we call it to extract more information
    const valueWithToJSON = value;
    if (valueWithToJSON && typeof valueWithToJSON.toJSON === 'function') {
        try {
            const jsonValue = valueWithToJSON.toJSON();
            // We need to normalize the return value of `.toJSON()` in case it has circular references
            return visit('', jsonValue, remainingDepth - 1, maxProperties, memo);
        } catch (err) {
        // pass (The built-in `toJSON` failed, but we can still try to do it ourselves)
        }
    }
    // At this point we know we either have an object or an array, we haven't seen it before, and we're going to recurse
    // because we haven't yet reached the max depth. Create an accumulator to hold the results of visiting each
    // property/entry, and keep track of the number of items we add to it.
    const normalized = Array.isArray(value) ? [] : {};
    let numAdded = 0;
    // Before we begin, convert`Error` and`Event` instances into plain objects, since some of each of their relevant
    // properties are non-enumerable and otherwise would get missed.
    const visitable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["convertToPlainObject"])(value);
    for(const visitKey in visitable){
        // Avoid iterating over fields in the prototype if they've somehow been exposed to enumeration.
        if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) {
            continue;
        }
        if (numAdded >= maxProperties) {
            normalized[visitKey] = '[MaxProperties ~]';
            break;
        }
        // Recursively visit all the child nodes
        const visitValue = visitable[visitKey];
        normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
        numAdded++;
    }
    // Once we've visited all the branches, remove the parent from memo storage
    unmemoize(value);
    // Return accumulated values
    return normalized;
}
/* eslint-disable complexity */ /**
 * Stringify the given value. Handles various known special values and types.
 *
 * Not meant to be used on simple primitives which already have a string representation, as it will, for example, turn
 * the number 1231 into "[Object Number]", nor on `null`, as it will throw.
 *
 * @param value The value to stringify
 * @returns A stringified representation of the given value
 */ function stringifyValue(key, // this type is a tiny bit of a cheat, since this function does handle NaN (which is technically a number), but for
// our internal use, it'll do
value) {
    try {
        if (key === 'domain' && value && typeof value === 'object' && value._events) {
            return '[Domain]';
        }
        if (key === 'domainEmitter') {
            return '[DomainEmitter]';
        }
        // It's safe to use `global`, `window`, and `document` here in this manner, as we are asserting using `typeof` first
        // which won't throw if they are not present.
        if (("TURBOPACK compile-time value", "object") !== 'undefined' && value === /*TURBOPACK member replacement*/ __turbopack_context__.g) {
            return '[Global]';
        }
        // eslint-disable-next-line no-restricted-globals
        if (typeof window !== 'undefined' && value === window) {
            return '[Window]';
        }
        // eslint-disable-next-line no-restricted-globals
        if (typeof document !== 'undefined' && value === document) {
            return '[Document]';
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVueViewModel"])(value)) {
            return '[VueViewModel]';
        }
        // React's SyntheticEvent thingy
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSyntheticEvent"])(value)) {
            return '[SyntheticEvent]';
        }
        if (typeof value === 'number' && !Number.isFinite(value)) {
            return `[${value}]`;
        }
        if (typeof value === 'function') {
            return `[Function: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$stacktrace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFunctionName"])(value)}]`;
        }
        if (typeof value === 'symbol') {
            return `[${String(value)}]`;
        }
        // stringified BigInts are indistinguishable from regular numbers, so we need to label them to avoid confusion
        if (typeof value === 'bigint') {
            return `[BigInt: ${String(value)}]`;
        }
        // Now that we've knocked out all the special cases and the primitives, all we have left are objects. Simply casting
        // them to strings means that instances of classes which haven't defined their `toStringTag` will just come out as
        // `"[object Object]"`. If we instead look at the constructor's name (which is the same as the name of the class),
        // we can make sure that only plain objects come out that way.
        const objName = getConstructorName(value);
        // Handle HTML Elements
        if (/^HTML(\w*)Element$/.test(objName)) {
            return `[HTMLElement: ${objName}]`;
        }
        return `[object ${objName}]`;
    } catch (err) {
        return `**non-serializable** (${err})`;
    }
}
/* eslint-enable complexity */ function getConstructorName(value) {
    const prototype = Object.getPrototypeOf(value);
    return prototype ? prototype.constructor.name : 'null prototype';
}
/** Calculates bytes size of input string */ function utf8Length(value) {
    // eslint-disable-next-line no-bitwise
    return ~-encodeURI(value).split(/%..|./).length;
}
/** Calculates bytes size of input object */ // eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonSize(value) {
    return utf8Length(JSON.stringify(value));
}
/**
 * Normalizes URLs in exceptions and stacktraces to a base path so Sentry can fingerprint
 * across platforms and working directory.
 *
 * @param url The URL to be normalized.
 * @param basePath The application base path.
 * @returns The normalized URL.
 */ function normalizeUrlToBase(url, basePath) {
    const escapedBase = basePath// Backslash to forward
    .replace(/\\/g, '/')// Escape RegExp special characters
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    let newUrl = url;
    try {
        newUrl = decodeURI(url);
    } catch (_Oo) {
    // Sometime this breaks
    }
    return newUrl.replace(/\\/g, '/').replace(/webpack:\/?/g, '') // Remove intermediate base path
    // eslint-disable-next-line @sentry-internal/sdk/no-regexp-constructor
    .replace(new RegExp(`(file://)?/*${escapedBase}/*`, 'ig'), 'app:///');
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/semanticAttributes.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SEMANTIC_ATTRIBUTE_CACHE_HIT",
    ()=>SEMANTIC_ATTRIBUTE_CACHE_HIT,
    "SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE",
    ()=>SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE,
    "SEMANTIC_ATTRIBUTE_CACHE_KEY",
    ()=>SEMANTIC_ATTRIBUTE_CACHE_KEY,
    "SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME",
    ()=>SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME,
    "SEMANTIC_ATTRIBUTE_HTTP_REQUEST_METHOD",
    ()=>SEMANTIC_ATTRIBUTE_HTTP_REQUEST_METHOD,
    "SEMANTIC_ATTRIBUTE_PROFILE_ID",
    ()=>SEMANTIC_ATTRIBUTE_PROFILE_ID,
    "SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME,
    "SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON,
    "SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT,
    "SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE,
    "SEMANTIC_ATTRIBUTE_SENTRY_OP",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_OP,
    "SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
    "SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE,
    "SEMANTIC_ATTRIBUTE_SENTRY_SOURCE",
    ()=>SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
    "SEMANTIC_ATTRIBUTE_URL_FULL",
    ()=>SEMANTIC_ATTRIBUTE_URL_FULL
]);
/**
 * Use this attribute to represent the source of a span.
 * Should be one of: custom, url, route, view, component, task, unknown
 *
 */ const SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = 'sentry.source';
/**
 * Use this attribute to represent the sample rate used for a span.
 */ const SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = 'sentry.sample_rate';
/**
 * Use this attribute to represent the operation of a span.
 */ const SEMANTIC_ATTRIBUTE_SENTRY_OP = 'sentry.op';
/**
 * Use this attribute to represent the origin of a span.
 */ const SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = 'sentry.origin';
/** The reason why an idle span finished. */ const SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON = 'sentry.idle_span_finish_reason';
/** The unit of a measurement, which may be stored as a TimedEvent. */ const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT = 'sentry.measurement_unit';
/** The value of a measurement, which may be stored as a TimedEvent. */ const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE = 'sentry.measurement_value';
/**
 * A custom span name set by users guaranteed to be taken over any automatically
 * inferred name. This attribute is removed before the span is sent.
 *
 * @internal only meant for internal SDK usage
 * @hidden
 */ const SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME = 'sentry.custom_span_name';
/**
 * The id of the profile that this span occurred in.
 */ const SEMANTIC_ATTRIBUTE_PROFILE_ID = 'sentry.profile_id';
const SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = 'sentry.exclusive_time';
const SEMANTIC_ATTRIBUTE_CACHE_HIT = 'cache.hit';
const SEMANTIC_ATTRIBUTE_CACHE_KEY = 'cache.key';
const SEMANTIC_ATTRIBUTE_CACHE_ITEM_SIZE = 'cache.item_size';
/** TODO: Remove these once we update to latest semantic conventions */ const SEMANTIC_ATTRIBUTE_HTTP_REQUEST_METHOD = 'http.request.method';
const SEMANTIC_ATTRIBUTE_URL_FULL = 'url.full';
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/baggage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BAGGAGE_HEADER_NAME",
    ()=>BAGGAGE_HEADER_NAME,
    "MAX_BAGGAGE_STRING_LENGTH",
    ()=>MAX_BAGGAGE_STRING_LENGTH,
    "SENTRY_BAGGAGE_KEY_PREFIX",
    ()=>SENTRY_BAGGAGE_KEY_PREFIX,
    "SENTRY_BAGGAGE_KEY_PREFIX_REGEX",
    ()=>SENTRY_BAGGAGE_KEY_PREFIX_REGEX,
    "baggageHeaderToDynamicSamplingContext",
    ()=>baggageHeaderToDynamicSamplingContext,
    "dynamicSamplingContextToSentryBaggageHeader",
    ()=>dynamicSamplingContextToSentryBaggageHeader,
    "parseBaggageHeader",
    ()=>parseBaggageHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/debug-build.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/logger.js [app-client] (ecmascript)");
;
;
;
/**
 * @deprecated Use a `"baggage"` string directly
 */ const BAGGAGE_HEADER_NAME = 'baggage';
const SENTRY_BAGGAGE_KEY_PREFIX = 'sentry-';
const SENTRY_BAGGAGE_KEY_PREFIX_REGEX = /^sentry-/;
/**
 * Max length of a serialized baggage string
 *
 * https://www.w3.org/TR/baggage/#limits
 */ const MAX_BAGGAGE_STRING_LENGTH = 8192;
/**
 * Takes a baggage header and turns it into Dynamic Sampling Context, by extracting all the "sentry-" prefixed values
 * from it.
 *
 * @param baggageHeader A very bread definition of a baggage header as it might appear in various frameworks.
 * @returns The Dynamic Sampling Context that was found on `baggageHeader`, if there was any, `undefined` otherwise.
 */ function baggageHeaderToDynamicSamplingContext(// Very liberal definition of what any incoming header might look like
baggageHeader) {
    const baggageObject = parseBaggageHeader(baggageHeader);
    if (!baggageObject) {
        return undefined;
    }
    // Read all "sentry-" prefixed values out of the baggage object and put it onto a dynamic sampling context object.
    const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value])=>{
        if (key.match(SENTRY_BAGGAGE_KEY_PREFIX_REGEX)) {
            const nonPrefixedKey = key.slice(SENTRY_BAGGAGE_KEY_PREFIX.length);
            acc[nonPrefixedKey] = value;
        }
        return acc;
    }, {});
    // Only return a dynamic sampling context object if there are keys in it.
    // A keyless object means there were no sentry values on the header, which means that there is no DSC.
    if (Object.keys(dynamicSamplingContext).length > 0) {
        return dynamicSamplingContext;
    } else {
        return undefined;
    }
}
/**
 * Turns a Dynamic Sampling Object into a baggage header by prefixing all the keys on the object with "sentry-".
 *
 * @param dynamicSamplingContext The Dynamic Sampling Context to turn into a header. For convenience and compatibility
 * with the `getDynamicSamplingContext` method on the Transaction class ,this argument can also be `undefined`. If it is
 * `undefined` the function will return `undefined`.
 * @returns a baggage header, created from `dynamicSamplingContext`, or `undefined` either if `dynamicSamplingContext`
 * was `undefined`, or if `dynamicSamplingContext` didn't contain any values.
 */ function dynamicSamplingContextToSentryBaggageHeader(// this also takes undefined for convenience and bundle size in other places
dynamicSamplingContext) {
    if (!dynamicSamplingContext) {
        return undefined;
    }
    // Prefix all DSC keys with "sentry-" and put them into a new object
    const sentryPrefixedDSC = Object.entries(dynamicSamplingContext).reduce((acc, [dscKey, dscValue])=>{
        if (dscValue) {
            acc[`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`] = dscValue;
        }
        return acc;
    }, {});
    return objectToBaggageHeader(sentryPrefixedDSC);
}
/**
 * Take a baggage header and parse it into an object.
 */ function parseBaggageHeader(baggageHeader) {
    if (!baggageHeader || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isString"])(baggageHeader) && !Array.isArray(baggageHeader)) {
        return undefined;
    }
    if (Array.isArray(baggageHeader)) {
        // Combine all baggage headers into one object containing the baggage values so we can later read the Sentry-DSC-values from it
        return baggageHeader.reduce((acc, curr)=>{
            const currBaggageObject = baggageHeaderToObject(curr);
            Object.entries(currBaggageObject).forEach(([key, value])=>{
                acc[key] = value;
            });
            return acc;
        }, {});
    }
    return baggageHeaderToObject(baggageHeader);
}
/**
 * Will parse a baggage header, which is a simple key-value map, into a flat object.
 *
 * @param baggageHeader The baggage header to parse.
 * @returns a flat object containing all the key-value pairs from `baggageHeader`.
 */ function baggageHeaderToObject(baggageHeader) {
    return baggageHeader.split(',').map((baggageEntry)=>baggageEntry.split('=').map((keyOrValue)=>decodeURIComponent(keyOrValue.trim()))).reduce((acc, [key, value])=>{
        if (key && value) {
            acc[key] = value;
        }
        return acc;
    }, {});
}
/**
 * Turns a flat object (key-value pairs) into a baggage header, which is also just key-value pairs.
 *
 * @param object The object to turn into a baggage header.
 * @returns a baggage header string, or `undefined` if the object didn't have any values, since an empty baggage header
 * is not spec compliant.
 */ function objectToBaggageHeader(object) {
    if (Object.keys(object).length === 0) {
        // An empty baggage header is not spec compliant: We return undefined.
        return undefined;
    }
    return Object.entries(object).reduce((baggageHeader, [objectKey, objectValue], currentIndex)=>{
        const baggageEntry = `${encodeURIComponent(objectKey)}=${encodeURIComponent(objectValue)}`;
        const newBaggageHeader = currentIndex === 0 ? baggageEntry : `${baggageHeader},${baggageEntry}`;
        if (newBaggageHeader.length > MAX_BAGGAGE_STRING_LENGTH) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn(`Not adding key: ${objectKey} with val: ${objectValue} to baggage header due to exceeding baggage size limits.`);
            return baggageHeader;
        } else {
            return newBaggageHeader;
        }
    }, '');
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils/hasTracingEnabled.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hasTracingEnabled",
    ()=>hasTracingEnabled
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/currentScopes.js [app-client] (ecmascript)");
;
// Treeshakable guard to remove all code related to tracing
/**
 * Determines if tracing is currently enabled.
 *
 * Tracing is enabled when at least one of `tracesSampleRate` and `tracesSampler` is defined in the SDK config.
 */ function hasTracingEnabled(maybeOptions) {
    if (typeof __SENTRY_TRACING__ === 'boolean' && !__SENTRY_TRACING__) {
        return false;
    }
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    const options = maybeOptions || client && client.getOptions();
    // eslint-disable-next-line deprecation/deprecation
    return !!options && (options.enableTracing || 'tracesSampleRate' in options || 'tracesSampler' in options);
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/metrics/metric-summary.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMetricSummaryJsonForSpan",
    ()=>getMetricSummaryJsonForSpan,
    "updateMetricSummaryOnSpan",
    ()=>updateMetricSummaryOnSpan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
;
/**
 * key: bucketKey
 * value: [exportKey, MetricSummary]
 */ const METRICS_SPAN_FIELD = '_sentryMetrics';
/**
 * Fetches the metric summary if it exists for the passed span
 */ function getMetricSummaryJsonForSpan(span) {
    const storage = span[METRICS_SPAN_FIELD];
    if (!storage) {
        return undefined;
    }
    const output = {};
    for (const [, [exportKey, summary]] of storage){
        const arr = output[exportKey] || (output[exportKey] = []);
        arr.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])(summary));
    }
    return output;
}
/**
 * Updates the metric summary on a span.
 */ function updateMetricSummaryOnSpan(span, metricType, sanitizedName, value, unit, tags, bucketKey) {
    const existingStorage = span[METRICS_SPAN_FIELD];
    const storage = existingStorage || (span[METRICS_SPAN_FIELD] = new Map());
    const exportKey = `${metricType}:${sanitizedName}@${unit}`;
    const bucketItem = storage.get(bucketKey);
    if (bucketItem) {
        const [, summary] = bucketItem;
        storage.set(bucketKey, [
            exportKey,
            {
                min: Math.min(summary.min, value),
                max: Math.max(summary.max, value),
                count: summary.count += 1,
                sum: summary.sum += value,
                tags: summary.tags
            }
        ]);
    } else {
        storage.set(bucketKey, [
            exportKey,
            {
                min: value,
                max: value,
                count: 1,
                sum: value,
                tags
            }
        ]);
    }
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/tracing/spanstatus.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SPAN_STATUS_ERROR",
    ()=>SPAN_STATUS_ERROR,
    "SPAN_STATUS_OK",
    ()=>SPAN_STATUS_OK,
    "SPAN_STATUS_UNSET",
    ()=>SPAN_STATUS_UNSET,
    "getSpanStatusFromHttpCode",
    ()=>getSpanStatusFromHttpCode,
    "setHttpStatus",
    ()=>setHttpStatus
]);
const SPAN_STATUS_UNSET = 0;
const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;
/**
 * Converts a HTTP status code into a sentry status with a message.
 *
 * @param httpStatus The HTTP response status code.
 * @returns The span status or unknown_error.
 */ // https://develop.sentry.dev/sdk/event-payloads/span/
function getSpanStatusFromHttpCode(httpStatus) {
    if (httpStatus < 400 && httpStatus >= 100) {
        return {
            code: SPAN_STATUS_OK
        };
    }
    if (httpStatus >= 400 && httpStatus < 500) {
        switch(httpStatus){
            case 401:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'unauthenticated'
                };
            case 403:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'permission_denied'
                };
            case 404:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'not_found'
                };
            case 409:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'already_exists'
                };
            case 413:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'failed_precondition'
                };
            case 429:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'resource_exhausted'
                };
            case 499:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'cancelled'
                };
            default:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'invalid_argument'
                };
        }
    }
    if (httpStatus >= 500 && httpStatus < 600) {
        switch(httpStatus){
            case 501:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'unimplemented'
                };
            case 503:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'unavailable'
                };
            case 504:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'deadline_exceeded'
                };
            default:
                return {
                    code: SPAN_STATUS_ERROR,
                    message: 'internal_error'
                };
        }
    }
    return {
        code: SPAN_STATUS_ERROR,
        message: 'unknown_error'
    };
}
/**
 * Sets the Http status attributes on the current span based on the http code.
 * Additionally, the span's status is updated, depending on the http code.
 */ function setHttpStatus(span, httpStatus) {
    span.setAttribute('http.response.status_code', httpStatus);
    const spanStatus = getSpanStatusFromHttpCode(httpStatus);
    if (spanStatus.message !== 'unknown_error') {
        span.setStatus(spanStatus);
    }
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils-hoist/tracing.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TRACEPARENT_REGEXP",
    ()=>TRACEPARENT_REGEXP,
    "extractTraceparentData",
    ()=>extractTraceparentData,
    "generateSentryTraceHeader",
    ()=>generateSentryTraceHeader,
    "propagationContextFromHeaders",
    ()=>propagationContextFromHeaders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$baggage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/baggage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/propagationContext.js [app-client] (ecmascript)");
;
;
// eslint-disable-next-line @sentry-internal/sdk/no-regexp-constructor -- RegExp is used for readability here
const TRACEPARENT_REGEXP = new RegExp('^[ \\t]*' + // whitespace
'([0-9a-f]{32})?' + // trace_id
'-?([0-9a-f]{16})?' + // span_id
'-?([01])?' + // sampled
'[ \\t]*$');
/**
 * Extract transaction context data from a `sentry-trace` header.
 *
 * @param traceparent Traceparent string
 *
 * @returns Object containing data from the header, or undefined if traceparent string is malformed
 */ function extractTraceparentData(traceparent) {
    if (!traceparent) {
        return undefined;
    }
    const matches = traceparent.match(TRACEPARENT_REGEXP);
    if (!matches) {
        return undefined;
    }
    let parentSampled;
    if (matches[3] === '1') {
        parentSampled = true;
    } else if (matches[3] === '0') {
        parentSampled = false;
    }
    return {
        traceId: matches[1],
        parentSampled,
        parentSpanId: matches[2]
    };
}
/**
 * Create a propagation context from incoming headers or
 * creates a minimal new one if the headers are undefined.
 */ function propagationContextFromHeaders(sentryTrace, baggage) {
    const traceparentData = extractTraceparentData(sentryTrace);
    const dynamicSamplingContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$baggage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["baggageHeaderToDynamicSamplingContext"])(baggage);
    if (!traceparentData || !traceparentData.traceId) {
        return {
            traceId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateTraceId"])(),
            spanId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSpanId"])()
        };
    }
    const { traceId, parentSpanId, parentSampled } = traceparentData;
    const virtualSpanId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSpanId"])();
    return {
        traceId,
        parentSpanId,
        spanId: virtualSpanId,
        sampled: parentSampled,
        dsc: dynamicSamplingContext || {}
    };
}
/**
 * Create sentry-trace header from span context values.
 */ function generateSentryTraceHeader(traceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateTraceId"])(), spanId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSpanId"])(), sampled) {
    let sampledString = '';
    if (sampled !== undefined) {
        sampledString = sampled ? '-1' : '-0';
    }
    return `${traceId}-${spanId}${sampledString}`;
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils/spanUtils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TRACE_FLAG_NONE",
    ()=>TRACE_FLAG_NONE,
    "TRACE_FLAG_SAMPLED",
    ()=>TRACE_FLAG_SAMPLED,
    "addChildSpanToSpan",
    ()=>addChildSpanToSpan,
    "getActiveSpan",
    ()=>getActiveSpan,
    "getRootSpan",
    ()=>getRootSpan,
    "getSpanDescendants",
    ()=>getSpanDescendants,
    "getStatusMessage",
    ()=>getStatusMessage,
    "removeChildSpanFromSpan",
    ()=>removeChildSpanFromSpan,
    "showSpanDropWarning",
    ()=>showSpanDropWarning,
    "spanIsSampled",
    ()=>spanIsSampled,
    "spanTimeInputToSeconds",
    ()=>spanTimeInputToSeconds,
    "spanToJSON",
    ()=>spanToJSON,
    "spanToTraceContext",
    ()=>spanToTraceContext,
    "spanToTraceHeader",
    ()=>spanToTraceHeader,
    "spanToTransactionTraceContext",
    ()=>spanToTransactionTraceContext,
    "updateMetricSummaryOnActiveSpan",
    ()=>updateMetricSummaryOnActiveSpan,
    "updateSpanName",
    ()=>updateSpanName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/asyncContext/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/carrier.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/currentScopes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$metrics$2f$metric$2d$summary$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/metrics/metric-summary.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/semanticAttributes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$tracing$2f$spanstatus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/tracing/spanstatus.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/propagationContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/time.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$tracing$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/tracing.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanOnScope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/spanOnScope.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
// These are aligned with OpenTelemetry trace flags
const TRACE_FLAG_NONE = 0x0;
const TRACE_FLAG_SAMPLED = 0x1;
// todo(v9): Remove this once we've stopped dropping spans via `beforeSendSpan`
let hasShownSpanDropWarning = false;
/**
 * Convert a span to a trace context, which can be sent as the `trace` context in an event.
 * By default, this will only include trace_id, span_id & parent_span_id.
 * If `includeAllData` is true, it will also include data, op, status & origin.
 */ function spanToTransactionTraceContext(span) {
    const { spanId: span_id, traceId: trace_id } = span.spanContext();
    const { data, op, parent_span_id, status, origin } = spanToJSON(span);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])({
        parent_span_id,
        span_id,
        trace_id,
        data,
        op,
        status,
        origin
    });
}
/**
 * Convert a span to a trace context, which can be sent as the `trace` context in a non-transaction event.
 */ function spanToTraceContext(span) {
    const { spanId, traceId: trace_id, isRemote } = span.spanContext();
    // If the span is remote, we use a random/virtual span as span_id to the trace context,
    // and the remote span as parent_span_id
    const parent_span_id = isRemote ? spanId : spanToJSON(span).parent_span_id;
    const span_id = isRemote ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$propagationContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSpanId"])() : spanId;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])({
        parent_span_id,
        span_id,
        trace_id
    });
}
/**
 * Convert a Span to a Sentry trace header.
 */ function spanToTraceHeader(span) {
    const { traceId, spanId } = span.spanContext();
    const sampled = spanIsSampled(span);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$tracing$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSentryTraceHeader"])(traceId, spanId, sampled);
}
/**
 * Convert a span time input into a timestamp in seconds.
 */ function spanTimeInputToSeconds(input) {
    if (typeof input === 'number') {
        return ensureTimestampInSeconds(input);
    }
    if (Array.isArray(input)) {
        // See {@link HrTime} for the array-based time format
        return input[0] + input[1] / 1e9;
    }
    if (input instanceof Date) {
        return ensureTimestampInSeconds(input.getTime());
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["timestampInSeconds"])();
}
/**
 * Converts a timestamp to second, if it was in milliseconds, or keeps it as second.
 */ function ensureTimestampInSeconds(timestamp) {
    const isMs = timestamp > 9999999999;
    return isMs ? timestamp / 1000 : timestamp;
}
/**
 * Convert a span to a JSON representation.
 */ // Note: Because of this, we currently have a circular type dependency (which we opted out of in package.json).
// This is not avoidable as we need `spanToJSON` in `spanUtils.ts`, which in turn is needed by `span.ts` for backwards compatibility.
// And `spanToJSON` needs the Span class from `span.ts` to check here.
function spanToJSON(span) {
    if (spanIsSentrySpan(span)) {
        return span.getSpanJSON();
    }
    try {
        const { spanId: span_id, traceId: trace_id } = span.spanContext();
        // Handle a span from @opentelemetry/sdk-base-trace's `Span` class
        if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
            const { attributes, startTime, name, endTime, parentSpanId, status } = span;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])({
                span_id,
                trace_id,
                data: attributes,
                description: name,
                parent_span_id: parentSpanId,
                start_timestamp: spanTimeInputToSeconds(startTime),
                // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
                timestamp: spanTimeInputToSeconds(endTime) || undefined,
                status: getStatusMessage(status),
                op: attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_ATTRIBUTE_SENTRY_OP"]],
                origin: attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN"]],
                _metrics_summary: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$metrics$2f$metric$2d$summary$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMetricSummaryJsonForSpan"])(span)
            });
        }
        // Finally, at least we have `spanContext()`....
        return {
            span_id,
            trace_id
        };
    } catch (e) {
        return {};
    }
}
function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
    const castSpan = span;
    return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
}
/** Exported only for tests. */ /**
 * Sadly, due to circular dependency checks we cannot actually import the Span class here and check for instanceof.
 * :( So instead we approximate this by checking if it has the `getSpanJSON` method.
 */ function spanIsSentrySpan(span) {
    return typeof span.getSpanJSON === 'function';
}
/**
 * Returns true if a span is sampled.
 * In most cases, you should just use `span.isRecording()` instead.
 * However, this has a slightly different semantic, as it also returns false if the span is finished.
 * So in the case where this distinction is important, use this method.
 */ function spanIsSampled(span) {
    // We align our trace flags with the ones OpenTelemetry use
    // So we also check for sampled the same way they do.
    const { traceFlags } = span.spanContext();
    return traceFlags === TRACE_FLAG_SAMPLED;
}
/** Get the status message to use for a JSON representation of a span. */ function getStatusMessage(status) {
    if (!status || status.code === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$tracing$2f$spanstatus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SPAN_STATUS_UNSET"]) {
        return undefined;
    }
    if (status.code === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$tracing$2f$spanstatus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SPAN_STATUS_OK"]) {
        return 'ok';
    }
    return status.message || 'unknown_error';
}
const CHILD_SPANS_FIELD = '_sentryChildSpans';
const ROOT_SPAN_FIELD = '_sentryRootSpan';
/**
 * Adds an opaque child span reference to a span.
 */ function addChildSpanToSpan(span, childSpan) {
    // We store the root span reference on the child span
    // We need this for `getRootSpan()` to work
    const rootSpan = span[ROOT_SPAN_FIELD] || span;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addNonEnumerableProperty"])(childSpan, ROOT_SPAN_FIELD, rootSpan);
    // We store a list of child spans on the parent span
    // We need this for `getSpanDescendants()` to work
    if (span[CHILD_SPANS_FIELD]) {
        span[CHILD_SPANS_FIELD].add(childSpan);
    } else {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addNonEnumerableProperty"])(span, CHILD_SPANS_FIELD, new Set([
            childSpan
        ]));
    }
}
/** This is only used internally by Idle Spans. */ function removeChildSpanFromSpan(span, childSpan) {
    if (span[CHILD_SPANS_FIELD]) {
        span[CHILD_SPANS_FIELD].delete(childSpan);
    }
}
/**
 * Returns an array of the given span and all of its descendants.
 */ function getSpanDescendants(span) {
    const resultSet = new Set();
    function addSpanChildren(span) {
        // This exit condition is required to not infinitely loop in case of a circular dependency.
        if (resultSet.has(span)) {
            return;
        // We want to ignore unsampled spans (e.g. non recording spans)
        } else if (spanIsSampled(span)) {
            resultSet.add(span);
            const childSpans = span[CHILD_SPANS_FIELD] ? Array.from(span[CHILD_SPANS_FIELD]) : [];
            for (const childSpan of childSpans){
                addSpanChildren(childSpan);
            }
        }
    }
    addSpanChildren(span);
    return Array.from(resultSet);
}
/**
 * Returns the root span of a given span.
 */ function getRootSpan(span) {
    return span[ROOT_SPAN_FIELD] || span;
}
/**
 * Returns the currently active span.
 */ function getActiveSpan() {
    const carrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$carrier$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMainCarrier"])();
    const acs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$asyncContext$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAsyncContextStrategy"])(carrier);
    if (acs.getActiveSpan) {
        return acs.getActiveSpan();
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanOnScope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_getSpanForScope"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])());
}
/**
 * Updates the metric summary on the currently active span
 */ function updateMetricSummaryOnActiveSpan(metricType, sanitizedName, value, unit, tags, bucketKey) {
    const span = getActiveSpan();
    if (span) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$metrics$2f$metric$2d$summary$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateMetricSummaryOnSpan"])(span, metricType, sanitizedName, value, unit, tags, bucketKey);
    }
}
/**
 * Logs a warning once if `beforeSendSpan` is used to drop spans.
 *
 * todo(v9): Remove this once we've stopped dropping spans via `beforeSendSpan`.
 */ function showSpanDropWarning() {
    if (!hasShownSpanDropWarning) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["consoleSandbox"])(()=>{
            // eslint-disable-next-line no-console
            console.warn('[Sentry] Deprecation warning: Returning null from `beforeSendSpan` will be disallowed from SDK version 9.0.0 onwards. The callback will only support mutating spans. To drop certain spans, configure the respective integrations directly.');
        });
        hasShownSpanDropWarning = true;
    }
}
/**
 * Updates the name of the given span and ensures that the span name is not
 * overwritten by the Sentry SDK.
 *
 * Use this function instead of `span.updateName()` if you want to make sure that
 * your name is kept. For some spans, for example root `http.server` spans the
 * Sentry SDK would otherwise overwrite the span name with a high-quality name
 * it infers when the span ends.
 *
 * Use this function in server code or when your span is started on the server
 * and on the client (browser). If you only update a span name on the client,
 * you can also use `span.updateName()` the SDK does not overwrite the name.
 *
 * @param span - The span to update the name of.
 * @param name - The name to set on the span.
 */ function updateSpanName(span, name) {
    span.updateName(name);
    span.setAttributes({
        [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_ATTRIBUTE_SENTRY_SOURCE"]]: 'custom',
        [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME"]]: name
    });
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/tracing/dynamicSamplingContext.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "freezeDscOnSpan",
    ()=>freezeDscOnSpan,
    "getDynamicSamplingContextFromClient",
    ()=>getDynamicSamplingContextFromClient,
    "getDynamicSamplingContextFromScope",
    ()=>getDynamicSamplingContextFromScope,
    "getDynamicSamplingContextFromSpan",
    ()=>getDynamicSamplingContextFromSpan,
    "spanToBaggageHeader",
    ()=>spanToBaggageHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/currentScopes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/semanticAttributes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$baggage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/baggage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$hasTracingEnabled$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/hasTracingEnabled.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/spanUtils.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
/**
 * If you change this value, also update the terser plugin config to
 * avoid minification of the object property!
 */ const FROZEN_DSC_FIELD = '_frozenDsc';
/**
 * Freeze the given DSC on the given span.
 */ function freezeDscOnSpan(span, dsc) {
    const spanWithMaybeDsc = span;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addNonEnumerableProperty"])(spanWithMaybeDsc, FROZEN_DSC_FIELD, dsc);
}
/**
 * Creates a dynamic sampling context from a client.
 *
 * Dispatches the `createDsc` lifecycle hook as a side effect.
 */ function getDynamicSamplingContextFromClient(trace_id, client) {
    const options = client.getOptions();
    const { publicKey: public_key } = client.getDsn() || {};
    const dsc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])({
        environment: options.environment || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_ENVIRONMENT"],
        release: options.release,
        public_key,
        trace_id
    });
    client.emit('createDsc', dsc);
    return dsc;
}
/**
 * Get the dynamic sampling context for the currently active scopes.
 */ function getDynamicSamplingContextFromScope(client, scope) {
    const propagationContext = scope.getPropagationContext();
    return propagationContext.dsc || getDynamicSamplingContextFromClient(propagationContext.traceId, client);
}
/**
 * Creates a dynamic sampling context from a span (and client and scope)
 *
 * @param span the span from which a few values like the root span name and sample rate are extracted.
 *
 * @returns a dynamic sampling context
 */ function getDynamicSamplingContextFromSpan(span) {
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    if (!client) {
        return {};
    }
    const rootSpan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRootSpan"])(span);
    // For core implementation, we freeze the DSC onto the span as a non-enumerable property
    const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
    if (frozenDsc) {
        return frozenDsc;
    }
    // For OpenTelemetry, we freeze the DSC on the trace state
    const traceState = rootSpan.spanContext().traceState;
    const traceStateDsc = traceState && traceState.get('sentry.dsc');
    // If the span has a DSC, we want it to take precedence
    const dscOnTraceState = traceStateDsc && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$baggage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["baggageHeaderToDynamicSamplingContext"])(traceStateDsc);
    if (dscOnTraceState) {
        return dscOnTraceState;
    }
    // Else, we generate it from the span
    const dsc = getDynamicSamplingContextFromClient(span.spanContext().traceId, client);
    const jsonSpan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spanToJSON"])(rootSpan);
    const attributes = jsonSpan.data || {};
    const maybeSampleRate = attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE"]];
    if (maybeSampleRate != null) {
        dsc.sample_rate = `${maybeSampleRate}`;
    }
    // We don't want to have a transaction name in the DSC if the source is "url" because URLs might contain PII
    const source = attributes[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$semanticAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_ATTRIBUTE_SENTRY_SOURCE"]];
    // after JSON conversion, txn.name becomes jsonSpan.description
    const name = jsonSpan.description;
    if (source !== 'url' && name) {
        dsc.transaction = name;
    }
    // How can we even land here with hasTracingEnabled() returning false?
    // Otel creates a Non-recording span in Tracing Without Performance mode when handling incoming requests
    // So we end up with an active span that is not sampled (neither positively nor negatively)
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$hasTracingEnabled$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasTracingEnabled"])()) {
        dsc.sampled = String((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spanIsSampled"])(rootSpan));
    }
    client.emit('createDsc', dsc, rootSpan);
    return dsc;
}
/**
 * Convert a Span to a baggage header.
 */ function spanToBaggageHeader(span) {
    const dsc = getDynamicSamplingContextFromSpan(span);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$baggage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dynamicSamplingContextToSentryBaggageHeader"])(dsc);
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils/applyScopeDataToEvent.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyScopeDataToEvent",
    ()=>applyScopeDataToEvent,
    "mergeAndOverwriteScopeData",
    ()=>mergeAndOverwriteScopeData,
    "mergeScopeData",
    ()=>mergeScopeData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$tracing$2f$dynamicSamplingContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/tracing/dynamicSamplingContext.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/object.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/merge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/spanUtils.js [app-client] (ecmascript)");
;
;
;
;
/**
 * Applies data from the scope to the event and runs all event processors on it.
 */ function applyScopeDataToEvent(event, data) {
    const { fingerprint, span, breadcrumbs, sdkProcessingMetadata } = data;
    // Apply general data
    applyDataToEvent(event, data);
    // We want to set the trace context for normal events only if there isn't already
    // a trace context on the event. There is a product feature in place where we link
    // errors with transaction and it relies on that.
    if (span) {
        applySpanToEvent(event, span);
    }
    applyFingerprintToEvent(event, fingerprint);
    applyBreadcrumbsToEvent(event, breadcrumbs);
    applySdkMetadataToEvent(event, sdkProcessingMetadata);
}
/** Merge data of two scopes together. */ function mergeScopeData(data, mergeData) {
    const { extra, tags, user, contexts, level, sdkProcessingMetadata, breadcrumbs, fingerprint, eventProcessors, attachments, propagationContext, transactionName, span } = mergeData;
    mergeAndOverwriteScopeData(data, 'extra', extra);
    mergeAndOverwriteScopeData(data, 'tags', tags);
    mergeAndOverwriteScopeData(data, 'user', user);
    mergeAndOverwriteScopeData(data, 'contexts', contexts);
    data.sdkProcessingMetadata = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["merge"])(data.sdkProcessingMetadata, sdkProcessingMetadata, 2);
    if (level) {
        data.level = level;
    }
    if (transactionName) {
        data.transactionName = transactionName;
    }
    if (span) {
        data.span = span;
    }
    if (breadcrumbs.length) {
        data.breadcrumbs = [
            ...data.breadcrumbs,
            ...breadcrumbs
        ];
    }
    if (fingerprint.length) {
        data.fingerprint = [
            ...data.fingerprint,
            ...fingerprint
        ];
    }
    if (eventProcessors.length) {
        data.eventProcessors = [
            ...data.eventProcessors,
            ...eventProcessors
        ];
    }
    if (attachments.length) {
        data.attachments = [
            ...data.attachments,
            ...attachments
        ];
    }
    data.propagationContext = {
        ...data.propagationContext,
        ...propagationContext
    };
}
/**
 * Merges certain scope data. Undefined values will overwrite any existing values.
 * Exported only for tests.
 */ function mergeAndOverwriteScopeData(data, prop, mergeVal) {
    data[prop] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["merge"])(data[prop], mergeVal, 1);
}
function applyDataToEvent(event, data) {
    const { extra, tags, user, contexts, level, transactionName } = data;
    const cleanedExtra = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])(extra);
    if (cleanedExtra && Object.keys(cleanedExtra).length) {
        event.extra = {
            ...cleanedExtra,
            ...event.extra
        };
    }
    const cleanedTags = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])(tags);
    if (cleanedTags && Object.keys(cleanedTags).length) {
        event.tags = {
            ...cleanedTags,
            ...event.tags
        };
    }
    const cleanedUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])(user);
    if (cleanedUser && Object.keys(cleanedUser).length) {
        event.user = {
            ...cleanedUser,
            ...event.user
        };
    }
    const cleanedContexts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$object$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dropUndefinedKeys"])(contexts);
    if (cleanedContexts && Object.keys(cleanedContexts).length) {
        event.contexts = {
            ...cleanedContexts,
            ...event.contexts
        };
    }
    if (level) {
        event.level = level;
    }
    // transaction events get their `transaction` from the root span name
    if (transactionName && event.type !== 'transaction') {
        event.transaction = transactionName;
    }
}
function applyBreadcrumbsToEvent(event, breadcrumbs) {
    const mergedBreadcrumbs = [
        ...event.breadcrumbs || [],
        ...breadcrumbs
    ];
    event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : undefined;
}
function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
    event.sdkProcessingMetadata = {
        ...event.sdkProcessingMetadata,
        ...sdkProcessingMetadata
    };
}
function applySpanToEvent(event, span) {
    event.contexts = {
        trace: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spanToTraceContext"])(span),
        ...event.contexts
    };
    event.sdkProcessingMetadata = {
        dynamicSamplingContext: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$tracing$2f$dynamicSamplingContext$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDynamicSamplingContextFromSpan"])(span),
        ...event.sdkProcessingMetadata
    };
    const rootSpan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRootSpan"])(span);
    const transactionName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$spanUtils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spanToJSON"])(rootSpan).description;
    if (transactionName && !event.transaction && event.type === 'transaction') {
        event.transaction = transactionName;
    }
}
/**
 * Applies fingerprint from the scope to the event if there's one,
 * uses message if there's one instead or get rid of empty fingerprint
 */ function applyFingerprintToEvent(event, fingerprint) {
    // Make sure it's an array first and we actually have something in place
    event.fingerprint = event.fingerprint ? Array.isArray(event.fingerprint) ? event.fingerprint : [
        event.fingerprint
    ] : [];
    // If we have something on the scope, then merge it with event
    if (fingerprint) {
        event.fingerprint = event.fingerprint.concat(fingerprint);
    }
    // If we have no data at all, remove empty array default
    if (event.fingerprint && !event.fingerprint.length) {
        delete event.fingerprint;
    }
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/utils/prepareEvent.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyClientOptions",
    ()=>applyClientOptions,
    "applyDebugIds",
    ()=>applyDebugIds,
    "applyDebugMeta",
    ()=>applyDebugMeta,
    "parseEventHintOrCaptureContext",
    ()=>parseEventHintOrCaptureContext,
    "prepareEvent",
    ()=>prepareEvent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/currentScopes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$eventProcessors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/eventProcessors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/scope.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$ids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/debug-ids.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/misc.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/normalize.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/string.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/time.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$applyScopeDataToEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/applyScopeDataToEvent.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
/**
 * This type makes sure that we get either a CaptureContext, OR an EventHint.
 * It does not allow mixing them, which could lead to unexpected outcomes, e.g. this is disallowed:
 * { user: { id: '123' }, mechanism: { handled: false } }
 */ /**
 * Adds common information to events.
 *
 * The information includes release and environment from `options`,
 * breadcrumbs and context (extra, tags and user) from the scope.
 *
 * Information that is already present in the event is never overwritten. For
 * nested objects, such as the context, keys are merged.
 *
 * @param event The original event.
 * @param hint May contain additional information about the original exception.
 * @param scope A scope containing event metadata.
 * @returns A new event with more information.
 * @hidden
 */ function prepareEvent(options, event, hint, scope, client, isolationScope) {
    const { normalizeDepth = 3, normalizeMaxBreadth = 1000 } = options;
    const prepared = {
        ...event,
        event_id: event.event_id || hint.event_id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])(),
        timestamp: event.timestamp || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dateTimestampInSeconds"])()
    };
    const integrations = hint.integrations || options.integrations.map((i)=>i.name);
    applyClientOptions(prepared, options);
    applyIntegrationsMetadata(prepared, integrations);
    if (client) {
        client.emit('applyFrameMetadata', event);
    }
    // Only put debug IDs onto frames for error events.
    if (event.type === undefined) {
        applyDebugIds(prepared, options.stackParser);
    }
    // If we have scope given to us, use it as the base for further modifications.
    // This allows us to prevent unnecessary copying of data if `captureContext` is not provided.
    const finalScope = getFinalScope(scope, hint.captureContext);
    if (hint.mechanism) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addExceptionMechanism"])(prepared, hint.mechanism);
    }
    const clientEventProcessors = client ? client.getEventProcessors() : [];
    // This should be the last thing called, since we want that
    // {@link Scope.addEventProcessor} gets the finished prepared event.
    // Merge scope data together
    const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalScope"])().getScopeData();
    if (isolationScope) {
        const isolationData = isolationScope.getScopeData();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$applyScopeDataToEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeScopeData"])(data, isolationData);
    }
    if (finalScope) {
        const finalScopeData = finalScope.getScopeData();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$applyScopeDataToEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeScopeData"])(data, finalScopeData);
    }
    const attachments = [
        ...hint.attachments || [],
        ...data.attachments
    ];
    if (attachments.length) {
        hint.attachments = attachments;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$applyScopeDataToEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["applyScopeDataToEvent"])(prepared, data);
    const eventProcessors = [
        ...clientEventProcessors,
        // Run scope event processors _after_ all other processors
        ...data.eventProcessors
    ];
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$eventProcessors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notifyEventProcessors"])(eventProcessors, prepared, hint);
    return result.then((evt)=>{
        if (evt) {
            // We apply the debug_meta field only after all event processors have ran, so that if any event processors modified
            // file names (e.g.the RewriteFrames integration) the filename -> debug ID relationship isn't destroyed.
            // This should not cause any PII issues, since we're only moving data that is already on the event and not adding
            // any new data
            applyDebugMeta(evt);
        }
        if (typeof normalizeDepth === 'number' && normalizeDepth > 0) {
            return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
        }
        return evt;
    });
}
/**
 * Enhances event using the client configuration.
 * It takes care of all "static" values like environment, release and `dist`,
 * as well as truncating overly long values.
 *
 * Only exported for tests.
 *
 * @param event event instance to be enhanced
 */ function applyClientOptions(event, options) {
    const { environment, release, dist, maxValueLength = 250 } = options;
    // empty strings do not make sense for environment, release, and dist
    // so we handle them the same as if they were not provided
    event.environment = event.environment || environment || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_ENVIRONMENT"];
    if (!event.release && release) {
        event.release = release;
    }
    if (!event.dist && dist) {
        event.dist = dist;
    }
    if (event.message) {
        event.message = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["truncate"])(event.message, maxValueLength);
    }
    const exception = event.exception && event.exception.values && event.exception.values[0];
    if (exception && exception.value) {
        exception.value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["truncate"])(exception.value, maxValueLength);
    }
    const request = event.request;
    if (request && request.url) {
        request.url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$string$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["truncate"])(request.url, maxValueLength);
    }
}
/**
 * Puts debug IDs into the stack frames of an error event.
 */ function applyDebugIds(event, stackParser) {
    // Build a map of filename -> debug_id
    const filenameDebugIdMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$debug$2d$ids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFilenameToDebugIdMap"])(stackParser);
    try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        event.exception.values.forEach((exception)=>{
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            exception.stacktrace.frames.forEach((frame)=>{
                if (filenameDebugIdMap && frame.filename) {
                    frame.debug_id = filenameDebugIdMap[frame.filename];
                }
            });
        });
    } catch (e) {
    // To save bundle size we're just try catching here instead of checking for the existence of all the different objects.
    }
}
/**
 * Moves debug IDs from the stack frames of an error event into the debug_meta field.
 */ function applyDebugMeta(event) {
    // Extract debug IDs and filenames from the stack frames on the event.
    const filenameDebugIdMap = {};
    try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        event.exception.values.forEach((exception)=>{
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            exception.stacktrace.frames.forEach((frame)=>{
                if (frame.debug_id) {
                    if (frame.abs_path) {
                        filenameDebugIdMap[frame.abs_path] = frame.debug_id;
                    } else if (frame.filename) {
                        filenameDebugIdMap[frame.filename] = frame.debug_id;
                    }
                    delete frame.debug_id;
                }
            });
        });
    } catch (e) {
    // To save bundle size we're just try catching here instead of checking for the existence of all the different objects.
    }
    if (Object.keys(filenameDebugIdMap).length === 0) {
        return;
    }
    // Fill debug_meta information
    event.debug_meta = event.debug_meta || {};
    event.debug_meta.images = event.debug_meta.images || [];
    const images = event.debug_meta.images;
    Object.entries(filenameDebugIdMap).forEach(([filename, debug_id])=>{
        images.push({
            type: 'sourcemap',
            code_file: filename,
            debug_id
        });
    });
}
/**
 * This function adds all used integrations to the SDK info in the event.
 * @param event The event that will be filled with all integrations.
 */ function applyIntegrationsMetadata(event, integrationNames) {
    if (integrationNames.length > 0) {
        event.sdk = event.sdk || {};
        event.sdk.integrations = [
            ...event.sdk.integrations || [],
            ...integrationNames
        ];
    }
}
/**
 * Applies `normalize` function on necessary `Event` attributes to make them safe for serialization.
 * Normalized keys:
 * - `breadcrumbs.data`
 * - `user`
 * - `contexts`
 * - `extra`
 * @param event Event
 * @returns Normalized event
 */ function normalizeEvent(event, depth, maxBreadth) {
    if (!event) {
        return null;
    }
    const normalized = {
        ...event,
        ...event.breadcrumbs && {
            breadcrumbs: event.breadcrumbs.map((b)=>({
                    ...b,
                    ...b.data && {
                        data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalize"])(b.data, depth, maxBreadth)
                    }
                }))
        },
        ...event.user && {
            user: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalize"])(event.user, depth, maxBreadth)
        },
        ...event.contexts && {
            contexts: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalize"])(event.contexts, depth, maxBreadth)
        },
        ...event.extra && {
            extra: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalize"])(event.extra, depth, maxBreadth)
        }
    };
    // event.contexts.trace stores information about a Transaction. Similarly,
    // event.spans[] stores information about child Spans. Given that a
    // Transaction is conceptually a Span, normalization should apply to both
    // Transactions and Spans consistently.
    // For now the decision is to skip normalization of Transactions and Spans,
    // so this block overwrites the normalized event to add back the original
    // Transaction information prior to normalization.
    if (event.contexts && event.contexts.trace && normalized.contexts) {
        normalized.contexts.trace = event.contexts.trace;
        // event.contexts.trace.data may contain circular/dangerous data so we need to normalize it
        if (event.contexts.trace.data) {
            normalized.contexts.trace.data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalize"])(event.contexts.trace.data, depth, maxBreadth);
        }
    }
    // event.spans[].data may contain circular/dangerous data so we need to normalize it
    if (event.spans) {
        normalized.spans = event.spans.map((span)=>{
            return {
                ...span,
                ...span.data && {
                    data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalize"])(span.data, depth, maxBreadth)
                }
            };
        });
    }
    // event.contexts.flags (FeatureFlagContext) stores context for our feature
    // flag integrations. It has a greater nesting depth than our other typed
    // Contexts, so we re-normalize with a fixed depth of 3 here. We do not want
    // to skip this in case of conflicting, user-provided context.
    if (event.contexts && event.contexts.flags && normalized.contexts) {
        normalized.contexts.flags = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$normalize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalize"])(event.contexts.flags, 3, maxBreadth);
    }
    return normalized;
}
function getFinalScope(scope, captureContext) {
    if (!captureContext) {
        return scope;
    }
    const finalScope = scope ? scope.clone() : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scope"]();
    finalScope.update(captureContext);
    return finalScope;
}
/**
 * Parse either an `EventHint` directly, or convert a `CaptureContext` to an `EventHint`.
 * This is used to allow to update method signatures that used to accept a `CaptureContext` but should now accept an `EventHint`.
 */ function parseEventHintOrCaptureContext(hint) {
    if (!hint) {
        return undefined;
    }
    // If you pass a Scope or `() => Scope` as CaptureContext, we just return this as captureContext
    if (hintIsScopeOrFunction(hint)) {
        return {
            captureContext: hint
        };
    }
    if (hintIsScopeContext(hint)) {
        return {
            captureContext: hint
        };
    }
    return hint;
}
function hintIsScopeOrFunction(hint) {
    return hint instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$scope$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scope"] || typeof hint === 'function';
}
const captureContextKeys = [
    'user',
    'level',
    'extra',
    'contexts',
    'tags',
    'fingerprint',
    'requestSession',
    'propagationContext'
];
function hintIsScopeContext(hint) {
    return Object.keys(hint).some((key)=>captureContextKeys.includes(key));
}
;
}),
"[project]/node_modules/@sentry/core/build/esm/exports.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addEventProcessor",
    ()=>addEventProcessor,
    "captureCheckIn",
    ()=>captureCheckIn,
    "captureEvent",
    ()=>captureEvent,
    "captureException",
    ()=>captureException,
    "captureMessage",
    ()=>captureMessage,
    "captureSession",
    ()=>captureSession,
    "close",
    ()=>close,
    "endSession",
    ()=>endSession,
    "flush",
    ()=>flush,
    "isEnabled",
    ()=>isEnabled,
    "isInitialized",
    ()=>isInitialized,
    "lastEventId",
    ()=>lastEventId,
    "setContext",
    ()=>setContext,
    "setExtra",
    ()=>setExtra,
    "setExtras",
    ()=>setExtras,
    "setTag",
    ()=>setTag,
    "setTags",
    ()=>setTags,
    "setUser",
    ()=>setUser,
    "startSession",
    ()=>startSession,
    "withMonitor",
    ()=>withMonitor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/currentScopes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/debug-build.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/session.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/is.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/misc.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/time.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$prepareEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@sentry/core/build/esm/utils/prepareEvent.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
/**
 * Captures an exception event and sends it to Sentry.
 *
 * @param exception The exception to capture.
 * @param hint Optional additional data to attach to the Sentry event.
 * @returns the id of the captured Sentry event.
 */ function captureException(exception, hint) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])().captureException(exception, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2f$prepareEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseEventHintOrCaptureContext"])(hint));
}
/**
 * Captures a message event and sends it to Sentry.
 *
 * @param message The message to send to Sentry.
 * @param captureContext Define the level of the message or pass in additional data to attach to the message.
 * @returns the id of the captured message.
 */ function captureMessage(message, captureContext) {
    // This is necessary to provide explicit scopes upgrade, without changing the original
    // arity of the `captureMessage(message, level)` method.
    const level = typeof captureContext === 'string' ? captureContext : undefined;
    const context = typeof captureContext !== 'string' ? {
        captureContext
    } : undefined;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])().captureMessage(message, level, context);
}
/**
 * Captures a manually created event and sends it to Sentry.
 *
 * @param event The event to send to Sentry.
 * @param hint Optional additional data to attach to the Sentry event.
 * @returns the id of the captured event.
 */ function captureEvent(event, hint) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])().captureEvent(event, hint);
}
/**
 * Sets context data with the given name.
 * @param name of the context
 * @param context Any kind of data. This data will be normalized.
 */ function setContext(name, context) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().setContext(name, context);
}
/**
 * Set an object that will be merged sent as extra data with the event.
 * @param extras Extras object to merge into current context.
 */ function setExtras(extras) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().setExtras(extras);
}
/**
 * Set key:value that will be sent as extra data with the event.
 * @param key String of extra
 * @param extra Any kind of data. This data will be normalized.
 */ function setExtra(key, extra) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().setExtra(key, extra);
}
/**
 * Set an object that will be merged sent as tags data with the event.
 * @param tags Tags context object to merge into current context.
 */ function setTags(tags) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().setTags(tags);
}
/**
 * Set key:value that will be sent as tags data with the event.
 *
 * Can also be used to unset a tag, by passing `undefined`.
 *
 * @param key String key of tag
 * @param value Value of tag
 */ function setTag(key, value) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().setTag(key, value);
}
/**
 * Updates user context information for future events.
 *
 * @param user User context object to be set in the current context. Pass `null` to unset the user.
 */ function setUser(user) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().setUser(user);
}
/**
 * The last error event id of the isolation scope.
 *
 * Warning: This function really returns the last recorded error event id on the current
 * isolation scope. If you call this function after handling a certain error and another error
 * is captured in between, the last one is returned instead of the one you might expect.
 * Also, ids of events that were never sent to Sentry (for example because
 * they were dropped in `beforeSend`) could be returned.
 *
 * @returns The last event id of the isolation scope.
 */ function lastEventId() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().lastEventId();
}
/**
 * Create a cron monitor check in and send it to Sentry.
 *
 * @param checkIn An object that describes a check in.
 * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
 * to create a monitor automatically when sending a check in.
 */ function captureCheckIn(checkIn, upsertMonitorConfig) {
    const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])();
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    if (!client) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Cannot capture check-in. No client defined.');
    } else if (!client.captureCheckIn) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Cannot capture check-in. Client does not support sending check-ins.');
    } else {
        return client.captureCheckIn(checkIn, upsertMonitorConfig, scope);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$misc$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuid4"])();
}
/**
 * Wraps a callback with a cron monitor check in. The check in will be sent to Sentry when the callback finishes.
 *
 * @param monitorSlug The distinct slug of the monitor.
 * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
 * to create a monitor automatically when sending a check in.
 */ function withMonitor(monitorSlug, callback, upsertMonitorConfig) {
    const checkInId = captureCheckIn({
        monitorSlug,
        status: 'in_progress'
    }, upsertMonitorConfig);
    const now = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["timestampInSeconds"])();
    function finishCheckIn(status) {
        captureCheckIn({
            monitorSlug,
            status,
            checkInId,
            duration: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["timestampInSeconds"])() - now
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["withIsolationScope"])(()=>{
        let maybePromiseResult;
        try {
            maybePromiseResult = callback();
        } catch (e) {
            finishCheckIn('error');
            throw e;
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$is$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isThenable"])(maybePromiseResult)) {
            Promise.resolve(maybePromiseResult).then(()=>{
                finishCheckIn('ok');
            }, (e)=>{
                finishCheckIn('error');
                throw e;
            });
        } else {
            finishCheckIn('ok');
        }
        return maybePromiseResult;
    });
}
/**
 * Call `flush()` on the current client, if there is one. See {@link Client.flush}.
 *
 * @param timeout Maximum time in ms the client should wait to flush its event queue. Omitting this parameter will cause
 * the client to wait until all events are sent before resolving the promise.
 * @returns A promise which resolves to `true` if the queue successfully drains before the timeout, or `false` if it
 * doesn't (or if there's no client defined).
 */ async function flush(timeout) {
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    if (client) {
        return client.flush(timeout);
    }
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Cannot flush events. No client defined.');
    return Promise.resolve(false);
}
/**
 * Call `close()` on the current client, if there is one. See {@link Client.close}.
 *
 * @param timeout Maximum time in ms the client should wait to flush its event queue before shutting down. Omitting this
 * parameter will cause the client to wait until all events are sent before disabling itself.
 * @returns A promise which resolves to `true` if the queue successfully drains before the timeout, or `false` if it
 * doesn't (or if there's no client defined).
 */ async function close(timeout) {
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    if (client) {
        return client.close(timeout);
    }
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$debug$2d$build$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEBUG_BUILD"] && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Cannot flush events and disable SDK. No client defined.');
    return Promise.resolve(false);
}
/**
 * Returns true if Sentry has been properly initialized.
 */ function isInitialized() {
    return !!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
}
/** If the SDK is initialized & enabled. */ function isEnabled() {
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    return !!client && client.getOptions().enabled !== false && !!client.getTransport();
}
/**
 * Add an event processor.
 * This will be added to the current isolation scope, ensuring any event that is processed in the current execution
 * context will have the processor applied.
 */ function addEventProcessor(callback) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])().addEventProcessor(callback);
}
/**
 * Start a session on the current isolation scope.
 *
 * @param context (optional) additional properties to be applied to the returned session object
 *
 * @returns the new active session
 */ function startSession(context) {
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    const isolationScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])();
    const currentScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])();
    const { release, environment = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_ENVIRONMENT"] } = client && client.getOptions() || {};
    // Will fetch userAgent if called from browser sdk
    const { userAgent } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$utils$2d$hoist$2f$worldwide$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GLOBAL_OBJ"].navigator || {};
    const session = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["makeSession"])({
        release,
        environment,
        user: currentScope.getUser() || isolationScope.getUser(),
        ...userAgent && {
            userAgent
        },
        ...context
    });
    // End existing session if there's one
    const currentSession = isolationScope.getSession();
    if (currentSession && currentSession.status === 'ok') {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateSession"])(currentSession, {
            status: 'exited'
        });
    }
    endSession();
    // Afterwards we set the new session on the scope
    isolationScope.setSession(session);
    // TODO (v8): Remove this and only use the isolation scope(?).
    // For v7 though, we can't "soft-break" people using getCurrentHub().getScope().setSession()
    currentScope.setSession(session);
    return session;
}
/**
 * End the session on the current isolation scope.
 */ function endSession() {
    const isolationScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])();
    const currentScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])();
    const session = currentScope.getSession() || isolationScope.getSession();
    if (session) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["closeSession"])(session);
    }
    _sendSessionUpdate();
    // the session is over; take it off of the scope
    isolationScope.setSession();
    // TODO (v8): Remove this and only use the isolation scope(?).
    // For v7 though, we can't "soft-break" people using getCurrentHub().getScope().setSession()
    currentScope.setSession();
}
/**
 * Sends the current Session on the scope
 */ function _sendSessionUpdate() {
    const isolationScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getIsolationScope"])();
    const currentScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentScope"])();
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$core$2f$build$2f$esm$2f$currentScopes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getClient"])();
    // TODO (v8): Remove currentScope and only use the isolation scope(?).
    // For v7 though, we can't "soft-break" people using getCurrentHub().getScope().setSession()
    const session = currentScope.getSession() || isolationScope.getSession();
    if (session && client) {
        client.captureSession(session);
    }
}
/**
 * Sends the current session on the scope to Sentry
 *
 * @param end If set the session will be marked as exited and removed from the scope.
 *            Defaults to `false`.
 */ function captureSession(end = false) {
    // both send the update and pull the session from the scope
    if (end) {
        endSession();
        return;
    }
    // only send the update
    _sendSessionUpdate();
}
;
}),
]);

//# sourceMappingURL=node_modules_%40sentry_core_build_esm_0h7nxpl._.js.map