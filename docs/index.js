
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function (React2, require$$0, fabric) {
	'use strict';

	function _interopNamespaceDefault(e) {
		var n = Object.create(null);
		if (e) {
			Object.keys(e).forEach(function (k) {
				if (k !== 'default') {
					var d = Object.getOwnPropertyDescriptor(e, k);
					Object.defineProperty(n, k, d.get ? d : {
						enumerable: true,
						get: function () { return e[k]; }
					});
				}
			});
		}
		n.default = e;
		return Object.freeze(n);
	}

	var React2__namespace = /*#__PURE__*/_interopNamespaceDefault(React2);

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var createRoot;
	var m$2 = require$$0;
	{
	  createRoot = m$2.createRoot;
	  m$2.hydrateRoot;
	}

	var dist = {};

	Object.defineProperty(dist, "__esModule", {
	  value: true
	});
	dist.parse = parse;
	dist.serialize = serialize;
	/**
	 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
	 * This refers out to the obsoleted definition of token in RFC 2616 sec 2.2
	 * which has been replaced by the token definition in RFC 7230 appendix B.
	 *
	 * cookie-name       = token
	 * token             = 1*tchar
	 * tchar             = "!" / "#" / "$" / "%" / "&" / "'" /
	 *                     "*" / "+" / "-" / "." / "^" / "_" /
	 *                     "`" / "|" / "~" / DIGIT / ALPHA
	 *
	 * Note: Allowing more characters - https://github.com/jshttp/cookie/issues/191
	 * Allow same range as cookie value, except `=`, which delimits end of name.
	 */
	const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
	/**
	 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
	 *
	 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
	 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
	 *                     ; US-ASCII characters excluding CTLs,
	 *                     ; whitespace DQUOTE, comma, semicolon,
	 *                     ; and backslash
	 *
	 * Allowing more characters: https://github.com/jshttp/cookie/issues/191
	 * Comma, backslash, and DQUOTE are not part of the parsing algorithm.
	 */
	const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
	/**
	 * RegExp to match domain-value in RFC 6265 sec 4.1.1
	 *
	 * domain-value      = <subdomain>
	 *                     ; defined in [RFC1034], Section 3.5, as
	 *                     ; enhanced by [RFC1123], Section 2.1
	 * <subdomain>       = <label> | <subdomain> "." <label>
	 * <label>           = <let-dig> [ [ <ldh-str> ] <let-dig> ]
	 *                     Labels must be 63 characters or less.
	 *                     'let-dig' not 'letter' in the first char, per RFC1123
	 * <ldh-str>         = <let-dig-hyp> | <let-dig-hyp> <ldh-str>
	 * <let-dig-hyp>     = <let-dig> | "-"
	 * <let-dig>         = <letter> | <digit>
	 * <letter>          = any one of the 52 alphabetic characters A through Z in
	 *                     upper case and a through z in lower case
	 * <digit>           = any one of the ten digits 0 through 9
	 *
	 * Keep support for leading dot: https://github.com/jshttp/cookie/issues/173
	 *
	 * > (Note that a leading %x2E ("."), if present, is ignored even though that
	 * character is not permitted, but a trailing %x2E ("."), if present, will
	 * cause the user agent to ignore the attribute.)
	 */
	const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
	/**
	 * RegExp to match path-value in RFC 6265 sec 4.1.1
	 *
	 * path-value        = <any CHAR except CTLs or ";">
	 * CHAR              = %x01-7F
	 *                     ; defined in RFC 5234 appendix B.1
	 */
	const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
	const __toString = Object.prototype.toString;
	const NullObject = /* @__PURE__ */(() => {
	  const C = function () {};
	  C.prototype = Object.create(null);
	  return C;
	})();
	/**
	 * Parse a cookie header.
	 *
	 * Parse the given cookie header string into an object
	 * The object has the various cookies as keys(names) => values
	 */
	function parse(str, options) {
	  const obj = new NullObject();
	  const len = str.length;
	  // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
	  if (len < 2) return obj;
	  const dec = options?.decode || decode;
	  let index = 0;
	  do {
	    const eqIdx = str.indexOf("=", index);
	    if (eqIdx === -1) break; // No more cookie pairs.
	    const colonIdx = str.indexOf(";", index);
	    const endIdx = colonIdx === -1 ? len : colonIdx;
	    if (eqIdx > endIdx) {
	      // backtrack on prior semicolon
	      index = str.lastIndexOf(";", eqIdx - 1) + 1;
	      continue;
	    }
	    const keyStartIdx = startIndex(str, index, eqIdx);
	    const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
	    const key = str.slice(keyStartIdx, keyEndIdx);
	    // only assign once
	    if (obj[key] === undefined) {
	      let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
	      let valEndIdx = endIndex(str, endIdx, valStartIdx);
	      const value = dec(str.slice(valStartIdx, valEndIdx));
	      obj[key] = value;
	    }
	    index = endIdx + 1;
	  } while (index < len);
	  return obj;
	}
	function startIndex(str, index, max) {
	  do {
	    const code = str.charCodeAt(index);
	    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index;
	  } while (++index < max);
	  return max;
	}
	function endIndex(str, index, min) {
	  while (index > min) {
	    const code = str.charCodeAt(--index);
	    if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index + 1;
	  }
	  return min;
	}
	/**
	 * Serialize data into a cookie header.
	 *
	 * Serialize a name value pair into a cookie string suitable for
	 * http headers. An optional options object specifies cookie parameters.
	 *
	 * serialize('foo', 'bar', { httpOnly: true })
	 *   => "foo=bar; httpOnly"
	 */
	function serialize(name, val, options) {
	  const enc = options?.encode || encodeURIComponent;
	  if (!cookieNameRegExp.test(name)) {
	    throw new TypeError(`argument name is invalid: ${name}`);
	  }
	  const value = enc(val);
	  if (!cookieValueRegExp.test(value)) {
	    throw new TypeError(`argument val is invalid: ${val}`);
	  }
	  let str = name + "=" + value;
	  if (!options) return str;
	  if (options.maxAge !== undefined) {
	    if (!Number.isInteger(options.maxAge)) {
	      throw new TypeError(`option maxAge is invalid: ${options.maxAge}`);
	    }
	    str += "; Max-Age=" + options.maxAge;
	  }
	  if (options.domain) {
	    if (!domainValueRegExp.test(options.domain)) {
	      throw new TypeError(`option domain is invalid: ${options.domain}`);
	    }
	    str += "; Domain=" + options.domain;
	  }
	  if (options.path) {
	    if (!pathValueRegExp.test(options.path)) {
	      throw new TypeError(`option path is invalid: ${options.path}`);
	    }
	    str += "; Path=" + options.path;
	  }
	  if (options.expires) {
	    if (!isDate(options.expires) || !Number.isFinite(options.expires.valueOf())) {
	      throw new TypeError(`option expires is invalid: ${options.expires}`);
	    }
	    str += "; Expires=" + options.expires.toUTCString();
	  }
	  if (options.httpOnly) {
	    str += "; HttpOnly";
	  }
	  if (options.secure) {
	    str += "; Secure";
	  }
	  if (options.partitioned) {
	    str += "; Partitioned";
	  }
	  if (options.priority) {
	    const priority = typeof options.priority === "string" ? options.priority.toLowerCase() : undefined;
	    switch (priority) {
	      case "low":
	        str += "; Priority=Low";
	        break;
	      case "medium":
	        str += "; Priority=Medium";
	        break;
	      case "high":
	        str += "; Priority=High";
	        break;
	      default:
	        throw new TypeError(`option priority is invalid: ${options.priority}`);
	    }
	  }
	  if (options.sameSite) {
	    const sameSite = typeof options.sameSite === "string" ? options.sameSite.toLowerCase() : options.sameSite;
	    switch (sameSite) {
	      case true:
	      case "strict":
	        str += "; SameSite=Strict";
	        break;
	      case "lax":
	        str += "; SameSite=Lax";
	        break;
	      case "none":
	        str += "; SameSite=None";
	        break;
	      default:
	        throw new TypeError(`option sameSite is invalid: ${options.sameSite}`);
	    }
	  }
	  return str;
	}
	/**
	 * URL-decode string value. Optimized to skip native call when no %.
	 */
	function decode(str) {
	  if (str.indexOf("%") === -1) return str;
	  try {
	    return decodeURIComponent(str);
	  } catch (e) {
	    return str;
	  }
	}
	/**
	 * Determine if value is a Date.
	 */
	function isDate(val) {
	  return __toString.call(val) === "[object Date]";
	}

	/**
	 * react-router v7.1.5
	 *
	 * Copyright (c) Remix Software Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE.md file in the root directory of this source tree.
	 *
	 * @license MIT
	 */

	var PopStateEventType = "popstate";
	function createBrowserHistory(options = {}) {
	  function createBrowserLocation(window2, globalHistory) {
	    let {
	      pathname,
	      search,
	      hash
	    } = window2.location;
	    return createLocation("", {
	      pathname,
	      search,
	      hash
	    },
	    // state defaults to `null` because `window.history.state` does
	    globalHistory.state && globalHistory.state.usr || null, globalHistory.state && globalHistory.state.key || "default");
	  }
	  function createBrowserHref(window2, to) {
	    return typeof to === "string" ? to : createPath$1(to);
	  }
	  return getUrlBasedHistory(createBrowserLocation, createBrowserHref, null, options);
	}
	function invariant(value, message) {
	  if (value === false || value === null || typeof value === "undefined") {
	    throw new Error(message);
	  }
	}
	function warning(cond, message) {
	  if (!cond) {
	    if (typeof console !== "undefined") console.warn(message);
	    try {
	      throw new Error(message);
	    } catch (e) {}
	  }
	}
	function createKey() {
	  return Math.random().toString(36).substring(2, 10);
	}
	function getHistoryState(location, index) {
	  return {
	    usr: location.state,
	    key: location.key,
	    idx: index
	  };
	}
	function createLocation(current, to, state = null, key) {
	  let location = {
	    pathname: typeof current === "string" ? current : current.pathname,
	    search: "",
	    hash: "",
	    ...(typeof to === "string" ? parsePath(to) : to),
	    state,
	    // TODO: This could be cleaned up.  push/replace should probably just take
	    // full Locations now and avoid the need to run through this flow at all
	    // But that's a pretty big refactor to the current test suite so going to
	    // keep as is for the time being and just let any incoming keys take precedence
	    key: to && to.key || key || createKey()
	  };
	  return location;
	}
	function createPath$1({
	  pathname = "/",
	  search = "",
	  hash = ""
	}) {
	  if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
	  if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
	  return pathname;
	}
	function parsePath(path) {
	  let parsedPath = {};
	  if (path) {
	    let hashIndex = path.indexOf("#");
	    if (hashIndex >= 0) {
	      parsedPath.hash = path.substring(hashIndex);
	      path = path.substring(0, hashIndex);
	    }
	    let searchIndex = path.indexOf("?");
	    if (searchIndex >= 0) {
	      parsedPath.search = path.substring(searchIndex);
	      path = path.substring(0, searchIndex);
	    }
	    if (path) {
	      parsedPath.pathname = path;
	    }
	  }
	  return parsedPath;
	}
	function getUrlBasedHistory(getLocation, createHref2, validateLocation, options = {}) {
	  let {
	    window: window2 = document.defaultView,
	    v5Compat = false
	  } = options;
	  let globalHistory = window2.history;
	  let action = "POP" /* Pop */;
	  let listener = null;
	  let index = getIndex();
	  if (index == null) {
	    index = 0;
	    globalHistory.replaceState({
	      ...globalHistory.state,
	      idx: index
	    }, "");
	  }
	  function getIndex() {
	    let state = globalHistory.state || {
	      idx: null
	    };
	    return state.idx;
	  }
	  function handlePop() {
	    action = "POP" /* Pop */;
	    let nextIndex = getIndex();
	    let delta = nextIndex == null ? null : nextIndex - index;
	    index = nextIndex;
	    if (listener) {
	      listener({
	        action,
	        location: history.location,
	        delta
	      });
	    }
	  }
	  function push(to, state) {
	    action = "PUSH" /* Push */;
	    let location = createLocation(history.location, to, state);
	    if (validateLocation) validateLocation(location, to);
	    index = getIndex() + 1;
	    let historyState = getHistoryState(location, index);
	    let url = history.createHref(location);
	    try {
	      globalHistory.pushState(historyState, "", url);
	    } catch (error) {
	      if (error instanceof DOMException && error.name === "DataCloneError") {
	        throw error;
	      }
	      window2.location.assign(url);
	    }
	    if (v5Compat && listener) {
	      listener({
	        action,
	        location: history.location,
	        delta: 1
	      });
	    }
	  }
	  function replace2(to, state) {
	    action = "REPLACE" /* Replace */;
	    let location = createLocation(history.location, to, state);
	    if (validateLocation) validateLocation(location, to);
	    index = getIndex();
	    let historyState = getHistoryState(location, index);
	    let url = history.createHref(location);
	    globalHistory.replaceState(historyState, "", url);
	    if (v5Compat && listener) {
	      listener({
	        action,
	        location: history.location,
	        delta: 0
	      });
	    }
	  }
	  function createURL(to) {
	    let base = window2.location.origin !== "null" ? window2.location.origin : window2.location.href;
	    let href = typeof to === "string" ? to : createPath$1(to);
	    href = href.replace(/ $/, "%20");
	    invariant(base, `No window.location.(origin|href) available to create URL for href: ${href}`);
	    return new URL(href, base);
	  }
	  let history = {
	    get action() {
	      return action;
	    },
	    get location() {
	      return getLocation(window2, globalHistory);
	    },
	    listen(fn) {
	      if (listener) {
	        throw new Error("A history only accepts one active listener");
	      }
	      window2.addEventListener(PopStateEventType, handlePop);
	      listener = fn;
	      return () => {
	        window2.removeEventListener(PopStateEventType, handlePop);
	        listener = null;
	      };
	    },
	    createHref(to) {
	      return createHref2(window2, to);
	    },
	    createURL,
	    encodeLocation(to) {
	      let url = createURL(to);
	      return {
	        pathname: url.pathname,
	        search: url.search,
	        hash: url.hash
	      };
	    },
	    push,
	    replace: replace2,
	    go(n) {
	      return globalHistory.go(n);
	    }
	  };
	  return history;
	}
	function matchRoutes(routes, locationArg, basename = "/") {
	  return matchRoutesImpl(routes, locationArg, basename, false);
	}
	function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
	  let location = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
	  let pathname = stripBasename(location.pathname || "/", basename);
	  if (pathname == null) {
	    return null;
	  }
	  let branches = flattenRoutes(routes);
	  rankRouteBranches(branches);
	  let matches = null;
	  for (let i = 0; matches == null && i < branches.length; ++i) {
	    let decoded = decodePath(pathname);
	    matches = matchRouteBranch(branches[i], decoded, allowPartial);
	  }
	  return matches;
	}
	function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = "") {
	  let flattenRoute = (route, index, relativePath) => {
	    let meta = {
	      relativePath: relativePath === void 0 ? route.path || "" : relativePath,
	      caseSensitive: route.caseSensitive === true,
	      childrenIndex: index,
	      route
	    };
	    if (meta.relativePath.startsWith("/")) {
	      invariant(meta.relativePath.startsWith(parentPath), `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`);
	      meta.relativePath = meta.relativePath.slice(parentPath.length);
	    }
	    let path = joinPaths([parentPath, meta.relativePath]);
	    let routesMeta = parentsMeta.concat(meta);
	    if (route.children && route.children.length > 0) {
	      invariant(
	      // Our types know better, but runtime JS may not!
	      // @ts-expect-error
	      route.index !== true, `Index routes must not have child routes. Please remove all child routes from route path "${path}".`);
	      flattenRoutes(route.children, branches, routesMeta, path);
	    }
	    if (route.path == null && !route.index) {
	      return;
	    }
	    branches.push({
	      path,
	      score: computeScore(path, route.index),
	      routesMeta
	    });
	  };
	  routes.forEach((route, index) => {
	    if (route.path === "" || !route.path?.includes("?")) {
	      flattenRoute(route, index);
	    } else {
	      for (let exploded of explodeOptionalSegments(route.path)) {
	        flattenRoute(route, index, exploded);
	      }
	    }
	  });
	  return branches;
	}
	function explodeOptionalSegments(path) {
	  let segments = path.split("/");
	  if (segments.length === 0) return [];
	  let [first, ...rest] = segments;
	  let isOptional = first.endsWith("?");
	  let required = first.replace(/\?$/, "");
	  if (rest.length === 0) {
	    return isOptional ? [required, ""] : [required];
	  }
	  let restExploded = explodeOptionalSegments(rest.join("/"));
	  let result = [];
	  result.push(...restExploded.map(subpath => subpath === "" ? required : [required, subpath].join("/")));
	  if (isOptional) {
	    result.push(...restExploded);
	  }
	  return result.map(exploded => path.startsWith("/") && exploded === "" ? "/" : exploded);
	}
	function rankRouteBranches(branches) {
	  branches.sort((a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(a.routesMeta.map(meta => meta.childrenIndex), b.routesMeta.map(meta => meta.childrenIndex)));
	}
	var paramRe = /^:[\w-]+$/;
	var dynamicSegmentValue = 3;
	var indexRouteValue = 2;
	var emptySegmentValue = 1;
	var staticSegmentValue = 10;
	var splatPenalty = -2;
	var isSplat = s => s === "*";
	function computeScore(path, index) {
	  let segments = path.split("/");
	  let initialScore = segments.length;
	  if (segments.some(isSplat)) {
	    initialScore += splatPenalty;
	  }
	  if (index) {
	    initialScore += indexRouteValue;
	  }
	  return segments.filter(s => !isSplat(s)).reduce((score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
	}
	function compareIndexes(a, b) {
	  let siblings = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);
	  return siblings ?
	  // If two routes are siblings, we should try to match the earlier sibling
	  // first. This allows people to have fine-grained control over the matching
	  // behavior by simply putting routes with identical paths in the order they
	  // want them tried.
	  a[a.length - 1] - b[b.length - 1] :
	  // Otherwise, it doesn't really make sense to rank non-siblings by index,
	  // so they sort equally.
	  0;
	}
	function matchRouteBranch(branch, pathname, allowPartial = false) {
	  let {
	    routesMeta
	  } = branch;
	  let matchedParams = {};
	  let matchedPathname = "/";
	  let matches = [];
	  for (let i = 0; i < routesMeta.length; ++i) {
	    let meta = routesMeta[i];
	    let end = i === routesMeta.length - 1;
	    let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
	    let match = matchPath({
	      path: meta.relativePath,
	      caseSensitive: meta.caseSensitive,
	      end
	    }, remainingPathname);
	    let route = meta.route;
	    if (!match && end && allowPartial && !routesMeta[routesMeta.length - 1].route.index) {
	      match = matchPath({
	        path: meta.relativePath,
	        caseSensitive: meta.caseSensitive,
	        end: false
	      }, remainingPathname);
	    }
	    if (!match) {
	      return null;
	    }
	    Object.assign(matchedParams, match.params);
	    matches.push({
	      // TODO: Can this as be avoided?
	      params: matchedParams,
	      pathname: joinPaths([matchedPathname, match.pathname]),
	      pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
	      route
	    });
	    if (match.pathnameBase !== "/") {
	      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
	    }
	  }
	  return matches;
	}
	function matchPath(pattern, pathname) {
	  if (typeof pattern === "string") {
	    pattern = {
	      path: pattern,
	      caseSensitive: false,
	      end: true
	    };
	  }
	  let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
	  let match = pathname.match(matcher);
	  if (!match) return null;
	  let matchedPathname = match[0];
	  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
	  let captureGroups = match.slice(1);
	  let params = compiledParams.reduce((memo2, {
	    paramName,
	    isOptional
	  }, index) => {
	    if (paramName === "*") {
	      let splatValue = captureGroups[index] || "";
	      pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
	    }
	    const value = captureGroups[index];
	    if (isOptional && !value) {
	      memo2[paramName] = void 0;
	    } else {
	      memo2[paramName] = (value || "").replace(/%2F/g, "/");
	    }
	    return memo2;
	  }, {});
	  return {
	    params,
	    pathname: matchedPathname,
	    pathnameBase,
	    pattern
	  };
	}
	function compilePath(path, caseSensitive = false, end = true) {
	  warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), `Route path "${path}" will be treated as if it were "${path.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${path.replace(/\*$/, "/*")}".`);
	  let params = [];
	  let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
	    params.push({
	      paramName,
	      isOptional: isOptional != null
	    });
	    return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
	  });
	  if (path.endsWith("*")) {
	    params.push({
	      paramName: "*"
	    });
	    regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
	  } else if (end) {
	    regexpSource += "\\/*$";
	  } else if (path !== "" && path !== "/") {
	    regexpSource += "(?:(?=\\/|$))";
	  } else ;
	  let matcher = new RegExp(regexpSource, caseSensitive ? void 0 : "i");
	  return [matcher, params];
	}
	function decodePath(value) {
	  try {
	    return value.split("/").map(v => decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
	  } catch (error) {
	    warning(false, `The URL path "${value}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${error}).`);
	    return value;
	  }
	}
	function stripBasename(pathname, basename) {
	  if (basename === "/") return pathname;
	  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
	    return null;
	  }
	  let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
	  let nextChar = pathname.charAt(startIndex);
	  if (nextChar && nextChar !== "/") {
	    return null;
	  }
	  return pathname.slice(startIndex) || "/";
	}
	function resolvePath(to, fromPathname = "/") {
	  let {
	    pathname: toPathname,
	    search = "",
	    hash = ""
	  } = typeof to === "string" ? parsePath(to) : to;
	  let pathname = toPathname ? toPathname.startsWith("/") ? toPathname : resolvePathname(toPathname, fromPathname) : fromPathname;
	  return {
	    pathname,
	    search: normalizeSearch(search),
	    hash: normalizeHash(hash)
	  };
	}
	function resolvePathname(relativePath, fromPathname) {
	  let segments = fromPathname.replace(/\/+$/, "").split("/");
	  let relativeSegments = relativePath.split("/");
	  relativeSegments.forEach(segment => {
	    if (segment === "..") {
	      if (segments.length > 1) segments.pop();
	    } else if (segment !== ".") {
	      segments.push(segment);
	    }
	  });
	  return segments.length > 1 ? segments.join("/") : "/";
	}
	function getInvalidPathError(char, field, dest, path) {
	  return `Cannot include a '${char}' character in a manually specified \`to.${field}\` field [${JSON.stringify(path)}].  Please separate it out to the \`to.${dest}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
	}
	function getPathContributingMatches(matches) {
	  return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
	}
	function getResolveToMatches(matches) {
	  let pathMatches = getPathContributingMatches(matches);
	  return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
	}
	function resolveTo(toArg, routePathnames, locationPathname, isPathRelative = false) {
	  let to;
	  if (typeof toArg === "string") {
	    to = parsePath(toArg);
	  } else {
	    to = {
	      ...toArg
	    };
	    invariant(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
	    invariant(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
	    invariant(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
	  }
	  let isEmptyPath = toArg === "" || to.pathname === "";
	  let toPathname = isEmptyPath ? "/" : to.pathname;
	  let from;
	  if (toPathname == null) {
	    from = locationPathname;
	  } else {
	    let routePathnameIndex = routePathnames.length - 1;
	    if (!isPathRelative && toPathname.startsWith("..")) {
	      let toSegments = toPathname.split("/");
	      while (toSegments[0] === "..") {
	        toSegments.shift();
	        routePathnameIndex -= 1;
	      }
	      to.pathname = toSegments.join("/");
	    }
	    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
	  }
	  let path = resolvePath(to, from);
	  let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
	  let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
	  if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
	    path.pathname += "/";
	  }
	  return path;
	}
	var joinPaths = paths => paths.join("/").replace(/\/\/+/g, "/");
	var normalizePathname = pathname => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
	var normalizeSearch = search => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
	var normalizeHash = hash => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
	function isRouteErrorResponse(error) {
	  return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
	}

	// lib/router/router.ts
	var validMutationMethodsArr = ["POST", "PUT", "PATCH", "DELETE"];
	new Set(validMutationMethodsArr);
	var validRequestMethodsArr = ["GET", ...validMutationMethodsArr];
	new Set(validRequestMethodsArr);
	var DataRouterContext = React2__namespace.createContext(null);
	DataRouterContext.displayName = "DataRouter";
	var DataRouterStateContext = React2__namespace.createContext(null);
	DataRouterStateContext.displayName = "DataRouterState";
	var ViewTransitionContext = React2__namespace.createContext({
	  isTransitioning: false
	});
	ViewTransitionContext.displayName = "ViewTransition";
	var FetchersContext = React2__namespace.createContext( /* @__PURE__ */new Map());
	FetchersContext.displayName = "Fetchers";
	var AwaitContext = React2__namespace.createContext(null);
	AwaitContext.displayName = "Await";
	var NavigationContext = React2__namespace.createContext(null);
	NavigationContext.displayName = "Navigation";
	var LocationContext = React2__namespace.createContext(null);
	LocationContext.displayName = "Location";
	var RouteContext = React2__namespace.createContext({
	  outlet: null,
	  matches: [],
	  isDataRoute: false
	});
	RouteContext.displayName = "Route";
	var RouteErrorContext = React2__namespace.createContext(null);
	RouteErrorContext.displayName = "RouteError";
	function useHref(to, {
	  relative
	} = {}) {
	  invariant(useInRouterContext(),
	  // TODO: This error is probably because they somehow have 2 versions of the
	  // router loaded. We can help them understand how to avoid that.
	  `useHref() may be used only in the context of a <Router> component.`);
	  let {
	    basename,
	    navigator: navigator2
	  } = React2__namespace.useContext(NavigationContext);
	  let {
	    hash,
	    pathname,
	    search
	  } = useResolvedPath(to, {
	    relative
	  });
	  let joinedPathname = pathname;
	  if (basename !== "/") {
	    joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
	  }
	  return navigator2.createHref({
	    pathname: joinedPathname,
	    search,
	    hash
	  });
	}
	function useInRouterContext() {
	  return React2__namespace.useContext(LocationContext) != null;
	}
	function useLocation() {
	  invariant(useInRouterContext(),
	  // TODO: This error is probably because they somehow have 2 versions of the
	  // router loaded. We can help them understand how to avoid that.
	  `useLocation() may be used only in the context of a <Router> component.`);
	  return React2__namespace.useContext(LocationContext).location;
	}
	var navigateEffectWarning = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;
	function useIsomorphicLayoutEffect(cb) {
	  let isStatic = React2__namespace.useContext(NavigationContext).static;
	  if (!isStatic) {
	    React2__namespace.useLayoutEffect(cb);
	  }
	}
	function useNavigate() {
	  let {
	    isDataRoute
	  } = React2__namespace.useContext(RouteContext);
	  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
	}
	function useNavigateUnstable() {
	  invariant(useInRouterContext(),
	  // TODO: This error is probably because they somehow have 2 versions of the
	  // router loaded. We can help them understand how to avoid that.
	  `useNavigate() may be used only in the context of a <Router> component.`);
	  let dataRouterContext = React2__namespace.useContext(DataRouterContext);
	  let {
	    basename,
	    navigator: navigator2
	  } = React2__namespace.useContext(NavigationContext);
	  let {
	    matches
	  } = React2__namespace.useContext(RouteContext);
	  let {
	    pathname: locationPathname
	  } = useLocation();
	  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
	  let activeRef = React2__namespace.useRef(false);
	  useIsomorphicLayoutEffect(() => {
	    activeRef.current = true;
	  });
	  let navigate = React2__namespace.useCallback((to, options = {}) => {
	    warning(activeRef.current, navigateEffectWarning);
	    if (!activeRef.current) return;
	    if (typeof to === "number") {
	      navigator2.go(to);
	      return;
	    }
	    let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
	    if (dataRouterContext == null && basename !== "/") {
	      path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
	    }
	    (!!options.replace ? navigator2.replace : navigator2.push)(path, options.state, options);
	  }, [basename, navigator2, routePathnamesJson, locationPathname, dataRouterContext]);
	  return navigate;
	}
	React2__namespace.createContext(null);
	function useResolvedPath(to, {
	  relative
	} = {}) {
	  let {
	    matches
	  } = React2__namespace.useContext(RouteContext);
	  let {
	    pathname: locationPathname
	  } = useLocation();
	  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
	  return React2__namespace.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [to, routePathnamesJson, locationPathname, relative]);
	}
	function useRoutesImpl(routes, locationArg, dataRouterState, future) {
	  invariant(useInRouterContext(),
	  // TODO: This error is probably because they somehow have 2 versions of the
	  // router loaded. We can help them understand how to avoid that.
	  `useRoutes() may be used only in the context of a <Router> component.`);
	  let {
	    navigator: navigator2,
	    static: isStatic
	  } = React2__namespace.useContext(NavigationContext);
	  let {
	    matches: parentMatches
	  } = React2__namespace.useContext(RouteContext);
	  let routeMatch = parentMatches[parentMatches.length - 1];
	  let parentParams = routeMatch ? routeMatch.params : {};
	  let parentPathname = routeMatch ? routeMatch.pathname : "/";
	  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
	  let parentRoute = routeMatch && routeMatch.route;
	  {
	    let parentPath = parentRoute && parentRoute.path || "";
	    warningOnce(parentPathname, !parentRoute || parentPath.endsWith("*") || parentPath.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${parentPathname}" (under <Route path="${parentPath}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${parentPath}"> to <Route path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`);
	  }
	  let locationFromContext = useLocation();
	  let location;
	  if (locationArg) {
	    let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
	    invariant(parentPathnameBase === "/" || parsedLocationArg.pathname?.startsWith(parentPathnameBase), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${parentPathnameBase}" but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`);
	    location = parsedLocationArg;
	  } else {
	    location = locationFromContext;
	  }
	  let pathname = location.pathname || "/";
	  let remainingPathname = pathname;
	  if (parentPathnameBase !== "/") {
	    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
	    let segments = pathname.replace(/^\//, "").split("/");
	    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
	  }
	  let matches = !isStatic && dataRouterState && dataRouterState.matches && dataRouterState.matches.length > 0 ? dataRouterState.matches : matchRoutes(routes, {
	    pathname: remainingPathname
	  });
	  {
	    warning(parentRoute || matches != null, `No routes matched location "${location.pathname}${location.search}${location.hash}" `);
	    warning(matches == null || matches[matches.length - 1].route.element !== void 0 || matches[matches.length - 1].route.Component !== void 0 || matches[matches.length - 1].route.lazy !== void 0, `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);
	  }
	  let renderedMatches = _renderMatches(matches && matches.map(match => Object.assign({}, match, {
	    params: Object.assign({}, parentParams, match.params),
	    pathname: joinPaths([parentPathnameBase,
	    // Re-encode pathnames that were decoded inside matchRoutes
	    navigator2.encodeLocation ? navigator2.encodeLocation(match.pathname).pathname : match.pathname]),
	    pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([parentPathnameBase,
	    // Re-encode pathnames that were decoded inside matchRoutes
	    navigator2.encodeLocation ? navigator2.encodeLocation(match.pathnameBase).pathname : match.pathnameBase])
	  })), parentMatches, dataRouterState, future);
	  if (locationArg && renderedMatches) {
	    return /* @__PURE__ */React2__namespace.createElement(LocationContext.Provider, {
	      value: {
	        location: {
	          pathname: "/",
	          search: "",
	          hash: "",
	          state: null,
	          key: "default",
	          ...location
	        },
	        navigationType: "POP" /* Pop */
	      }
	    }, renderedMatches);
	  }
	  return renderedMatches;
	}
	function DefaultErrorComponent() {
	  let error = useRouteError();
	  let message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : JSON.stringify(error);
	  let stack = error instanceof Error ? error.stack : null;
	  let lightgrey = "rgba(200,200,200, 0.5)";
	  let preStyles = {
	    padding: "0.5rem",
	    backgroundColor: lightgrey
	  };
	  let codeStyles = {
	    padding: "2px 4px",
	    backgroundColor: lightgrey
	  };
	  let devInfo = null;
	  {
	    console.error("Error handled by React Router default ErrorBoundary:", error);
	    devInfo = /* @__PURE__ */React2__namespace.createElement(React2__namespace.Fragment, null, /* @__PURE__ */React2__namespace.createElement("p", null, "\u{1F4BF} Hey developer \u{1F44B}"), /* @__PURE__ */React2__namespace.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */React2__namespace.createElement("code", {
	      style: codeStyles
	    }, "ErrorBoundary"), " or", " ", /* @__PURE__ */React2__namespace.createElement("code", {
	      style: codeStyles
	    }, "errorElement"), " prop on your route."));
	  }
	  return /* @__PURE__ */React2__namespace.createElement(React2__namespace.Fragment, null, /* @__PURE__ */React2__namespace.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */React2__namespace.createElement("h3", {
	    style: {
	      fontStyle: "italic"
	    }
	  }, message), stack ? /* @__PURE__ */React2__namespace.createElement("pre", {
	    style: preStyles
	  }, stack) : null, devInfo);
	}
	var defaultErrorElement = /* @__PURE__ */React2__namespace.createElement(DefaultErrorComponent, null);
	var RenderErrorBoundary = class extends React2__namespace.Component {
	  constructor(props) {
	    super(props);
	    this.state = {
	      location: props.location,
	      revalidation: props.revalidation,
	      error: props.error
	    };
	  }
	  static getDerivedStateFromError(error) {
	    return {
	      error
	    };
	  }
	  static getDerivedStateFromProps(props, state) {
	    if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") {
	      return {
	        error: props.error,
	        location: props.location,
	        revalidation: props.revalidation
	      };
	    }
	    return {
	      error: props.error !== void 0 ? props.error : state.error,
	      location: state.location,
	      revalidation: props.revalidation || state.revalidation
	    };
	  }
	  componentDidCatch(error, errorInfo) {
	    console.error("React Router caught the following error during render", error, errorInfo);
	  }
	  render() {
	    return this.state.error !== void 0 ? /* @__PURE__ */React2__namespace.createElement(RouteContext.Provider, {
	      value: this.props.routeContext
	    }, /* @__PURE__ */React2__namespace.createElement(RouteErrorContext.Provider, {
	      value: this.state.error,
	      children: this.props.component
	    })) : this.props.children;
	  }
	};
	function RenderedRoute({
	  routeContext,
	  match,
	  children
	}) {
	  let dataRouterContext = React2__namespace.useContext(DataRouterContext);
	  if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) {
	    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
	  }
	  return /* @__PURE__ */React2__namespace.createElement(RouteContext.Provider, {
	    value: routeContext
	  }, children);
	}
	function _renderMatches(matches, parentMatches = [], dataRouterState = null, future = null) {
	  if (matches == null) {
	    if (!dataRouterState) {
	      return null;
	    }
	    if (dataRouterState.errors) {
	      matches = dataRouterState.matches;
	    } else if (parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) {
	      matches = dataRouterState.matches;
	    } else {
	      return null;
	    }
	  }
	  let renderedMatches = matches;
	  let errors = dataRouterState?.errors;
	  if (errors != null) {
	    let errorIndex = renderedMatches.findIndex(m => m.route.id && errors?.[m.route.id] !== void 0);
	    invariant(errorIndex >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(errors).join(",")}`);
	    renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
	  }
	  let renderFallback = false;
	  let fallbackIndex = -1;
	  if (dataRouterState) {
	    for (let i = 0; i < renderedMatches.length; i++) {
	      let match = renderedMatches[i];
	      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
	        fallbackIndex = i;
	      }
	      if (match.route.id) {
	        let {
	          loaderData,
	          errors: errors2
	        } = dataRouterState;
	        let needsToRunLoader = match.route.loader && !loaderData.hasOwnProperty(match.route.id) && (!errors2 || errors2[match.route.id] === void 0);
	        if (match.route.lazy || needsToRunLoader) {
	          renderFallback = true;
	          if (fallbackIndex >= 0) {
	            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
	          } else {
	            renderedMatches = [renderedMatches[0]];
	          }
	          break;
	        }
	      }
	    }
	  }
	  return renderedMatches.reduceRight((outlet, match, index) => {
	    let error;
	    let shouldRenderHydrateFallback = false;
	    let errorElement = null;
	    let hydrateFallbackElement = null;
	    if (dataRouterState) {
	      error = errors && match.route.id ? errors[match.route.id] : void 0;
	      errorElement = match.route.errorElement || defaultErrorElement;
	      if (renderFallback) {
	        if (fallbackIndex < 0 && index === 0) {
	          warningOnce("route-fallback", false, "No `HydrateFallback` element provided to render during initial hydration");
	          shouldRenderHydrateFallback = true;
	          hydrateFallbackElement = null;
	        } else if (fallbackIndex === index) {
	          shouldRenderHydrateFallback = true;
	          hydrateFallbackElement = match.route.hydrateFallbackElement || null;
	        }
	      }
	    }
	    let matches2 = parentMatches.concat(renderedMatches.slice(0, index + 1));
	    let getChildren = () => {
	      let children;
	      if (error) {
	        children = errorElement;
	      } else if (shouldRenderHydrateFallback) {
	        children = hydrateFallbackElement;
	      } else if (match.route.Component) {
	        children = /* @__PURE__ */React2__namespace.createElement(match.route.Component, null);
	      } else if (match.route.element) {
	        children = match.route.element;
	      } else {
	        children = outlet;
	      }
	      return /* @__PURE__ */React2__namespace.createElement(RenderedRoute, {
	        match,
	        routeContext: {
	          outlet,
	          matches: matches2,
	          isDataRoute: dataRouterState != null
	        },
	        children
	      });
	    };
	    return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */React2__namespace.createElement(RenderErrorBoundary, {
	      location: dataRouterState.location,
	      revalidation: dataRouterState.revalidation,
	      component: errorElement,
	      error,
	      children: getChildren(),
	      routeContext: {
	        outlet: null,
	        matches: matches2,
	        isDataRoute: true
	      }
	    }) : getChildren();
	  }, null);
	}
	function getDataRouterConsoleError(hookName) {
	  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
	}
	function useDataRouterContext(hookName) {
	  let ctx = React2__namespace.useContext(DataRouterContext);
	  invariant(ctx, getDataRouterConsoleError(hookName));
	  return ctx;
	}
	function useDataRouterState(hookName) {
	  let state = React2__namespace.useContext(DataRouterStateContext);
	  invariant(state, getDataRouterConsoleError(hookName));
	  return state;
	}
	function useRouteContext(hookName) {
	  let route = React2__namespace.useContext(RouteContext);
	  invariant(route, getDataRouterConsoleError(hookName));
	  return route;
	}
	function useCurrentRouteId(hookName) {
	  let route = useRouteContext(hookName);
	  let thisRoute = route.matches[route.matches.length - 1];
	  invariant(thisRoute.route.id, `${hookName} can only be used on routes that contain a unique "id"`);
	  return thisRoute.route.id;
	}
	function useRouteId() {
	  return useCurrentRouteId("useRouteId" /* UseRouteId */);
	}
	function useRouteError() {
	  let error = React2__namespace.useContext(RouteErrorContext);
	  let state = useDataRouterState("useRouteError" /* UseRouteError */);
	  let routeId = useCurrentRouteId("useRouteError" /* UseRouteError */);
	  if (error !== void 0) {
	    return error;
	  }
	  return state.errors?.[routeId];
	}
	function useNavigateStable() {
	  let {
	    router
	  } = useDataRouterContext("useNavigate" /* UseNavigateStable */);
	  let id = useCurrentRouteId("useNavigate" /* UseNavigateStable */);
	  let activeRef = React2__namespace.useRef(false);
	  useIsomorphicLayoutEffect(() => {
	    activeRef.current = true;
	  });
	  let navigate = React2__namespace.useCallback(async (to, options = {}) => {
	    warning(activeRef.current, navigateEffectWarning);
	    if (!activeRef.current) return;
	    if (typeof to === "number") {
	      router.navigate(to);
	    } else {
	      await router.navigate(to, {
	        fromRouteId: id,
	        ...options
	      });
	    }
	  }, [router, id]);
	  return navigate;
	}
	var alreadyWarned = {};
	function warningOnce(key, cond, message) {
	  if (!cond && !alreadyWarned[key]) {
	    alreadyWarned[key] = true;
	    warning(false, message);
	  }
	}
	React2__namespace.memo(DataRoutes);
	function DataRoutes({
	  routes,
	  future,
	  state
	}) {
	  return useRoutesImpl(routes, void 0, state, future);
	}
	function Router({
	  basename: basenameProp = "/",
	  children = null,
	  location: locationProp,
	  navigationType = "POP" /* Pop */,
	  navigator: navigator2,
	  static: staticProp = false
	}) {
	  invariant(!useInRouterContext(), `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`);
	  let basename = basenameProp.replace(/^\/*/, "/");
	  let navigationContext = React2__namespace.useMemo(() => ({
	    basename,
	    navigator: navigator2,
	    static: staticProp,
	    future: {}
	  }), [basename, navigator2, staticProp]);
	  if (typeof locationProp === "string") {
	    locationProp = parsePath(locationProp);
	  }
	  let {
	    pathname = "/",
	    search = "",
	    hash = "",
	    state = null,
	    key = "default"
	  } = locationProp;
	  let locationContext = React2__namespace.useMemo(() => {
	    let trailingPathname = stripBasename(pathname, basename);
	    if (trailingPathname == null) {
	      return null;
	    }
	    return {
	      location: {
	        pathname: trailingPathname,
	        search,
	        hash,
	        state,
	        key
	      },
	      navigationType
	    };
	  }, [basename, pathname, search, hash, state, key, navigationType]);
	  warning(locationContext != null, `<Router basename="${basename}"> is not able to match the URL "${pathname}${search}${hash}" because it does not start with the basename, so the <Router> won't render anything.`);
	  if (locationContext == null) {
	    return null;
	  }
	  return /* @__PURE__ */React2__namespace.createElement(NavigationContext.Provider, {
	    value: navigationContext
	  }, /* @__PURE__ */React2__namespace.createElement(LocationContext.Provider, {
	    children,
	    value: locationContext
	  }));
	}

	// lib/dom/dom.ts
	var defaultMethod = "get";
	var defaultEncType = "application/x-www-form-urlencoded";
	function isHtmlElement(object) {
	  return object != null && typeof object.tagName === "string";
	}
	function isButtonElement(object) {
	  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
	}
	function isFormElement(object) {
	  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
	}
	function isInputElement(object) {
	  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
	}
	function isModifiedEvent(event) {
	  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
	}
	function shouldProcessLinkClick(event, target) {
	  return event.button === 0 && (
	  // Ignore everything but left clicks
	  !target || target === "_self") &&
	  // Let browser handle "target=_blank" etc.
	  !isModifiedEvent(event);
	}
	var _formDataSupportsSubmitter = null;
	function isFormDataSubmitterSupported() {
	  if (_formDataSupportsSubmitter === null) {
	    try {
	      new FormData(document.createElement("form"),
	      // @ts-expect-error if FormData supports the submitter parameter, this will throw
	      0);
	      _formDataSupportsSubmitter = false;
	    } catch (e) {
	      _formDataSupportsSubmitter = true;
	    }
	  }
	  return _formDataSupportsSubmitter;
	}
	var supportedFormEncTypes = /* @__PURE__ */new Set(["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]);
	function getFormEncType(encType) {
	  if (encType != null && !supportedFormEncTypes.has(encType)) {
	    warning(false, `"${encType}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${defaultEncType}"`);
	    return null;
	  }
	  return encType;
	}
	function getFormSubmissionInfo(target, basename) {
	  let method;
	  let action;
	  let encType;
	  let formData;
	  let body;
	  if (isFormElement(target)) {
	    let attr = target.getAttribute("action");
	    action = attr ? stripBasename(attr, basename) : null;
	    method = target.getAttribute("method") || defaultMethod;
	    encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
	    formData = new FormData(target);
	  } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
	    let form = target.form;
	    if (form == null) {
	      throw new Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);
	    }
	    let attr = target.getAttribute("formaction") || form.getAttribute("action");
	    action = attr ? stripBasename(attr, basename) : null;
	    method = target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
	    encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
	    formData = new FormData(form, target);
	    if (!isFormDataSubmitterSupported()) {
	      let {
	        name,
	        type,
	        value
	      } = target;
	      if (type === "image") {
	        let prefix = name ? `${name}.` : "";
	        formData.append(`${prefix}x`, "0");
	        formData.append(`${prefix}y`, "0");
	      } else if (name) {
	        formData.append(name, value);
	      }
	    }
	  } else if (isHtmlElement(target)) {
	    throw new Error(`Cannot submit element that is not <form>, <button>, or <input type="submit|image">`);
	  } else {
	    method = defaultMethod;
	    action = null;
	    encType = defaultEncType;
	    body = target;
	  }
	  if (formData && encType === "text/plain") {
	    body = formData;
	    formData = void 0;
	  }
	  return {
	    action,
	    method: method.toLowerCase(),
	    encType,
	    formData,
	    body
	  };
	}

	// lib/dom/ssr/invariant.ts
	function invariant2(value, message) {
	  if (value === false || value === null || typeof value === "undefined") {
	    throw new Error(message);
	  }
	}

	// lib/dom/ssr/routeModules.ts
	async function loadRouteModule(route, routeModulesCache) {
	  if (route.id in routeModulesCache) {
	    return routeModulesCache[route.id];
	  }
	  try {
	    let routeModule = await import( /* @vite-ignore */
	    /* webpackIgnore: true */
	    route.module);
	    routeModulesCache[route.id] = routeModule;
	    return routeModule;
	  } catch (error) {
	    console.error(`Error loading route module \`${route.module}\`, reloading page...`);
	    console.error(error);
	    if (window.__reactRouterContext && window.__reactRouterContext.isSpaMode &&
	    // @ts-expect-error
	    undefined) {
	      throw error;
	    }
	    window.location.reload();
	    return new Promise(() => {});
	  }
	}
	function isPageLinkDescriptor(object) {
	  return object != null && typeof object.page === "string";
	}
	function isHtmlLinkDescriptor(object) {
	  if (object == null) {
	    return false;
	  }
	  if (object.href == null) {
	    return object.rel === "preload" && typeof object.imageSrcSet === "string" && typeof object.imageSizes === "string";
	  }
	  return typeof object.rel === "string" && typeof object.href === "string";
	}
	async function getKeyedPrefetchLinks(matches, manifest, routeModules) {
	  let links = await Promise.all(matches.map(async match => {
	    let route = manifest.routes[match.route.id];
	    if (route) {
	      let mod = await loadRouteModule(route, routeModules);
	      return mod.links ? mod.links() : [];
	    }
	    return [];
	  }));
	  return dedupeLinkDescriptors(links.flat(1).filter(isHtmlLinkDescriptor).filter(link => link.rel === "stylesheet" || link.rel === "preload").map(link => link.rel === "stylesheet" ? {
	    ...link,
	    rel: "prefetch",
	    as: "style"
	  } : {
	    ...link,
	    rel: "prefetch"
	  }));
	}
	function getNewMatchesForLinks(page, nextMatches, currentMatches, manifest, location, mode) {
	  let isNew = (match, index) => {
	    if (!currentMatches[index]) return true;
	    return match.route.id !== currentMatches[index].route.id;
	  };
	  let matchPathChanged = (match, index) => {
	    return (
	      // param change, /users/123 -> /users/456
	      currentMatches[index].pathname !== match.pathname ||
	      // splat param changed, which is not present in match.path
	      // e.g. /files/images/avatar.jpg -> files/finances.xls
	      currentMatches[index].route.path?.endsWith("*") && currentMatches[index].params["*"] !== match.params["*"]
	    );
	  };
	  if (mode === "assets") {
	    return nextMatches.filter((match, index) => isNew(match, index) || matchPathChanged(match, index));
	  }
	  if (mode === "data") {
	    return nextMatches.filter((match, index) => {
	      let manifestRoute = manifest.routes[match.route.id];
	      if (!manifestRoute || !manifestRoute.hasLoader) {
	        return false;
	      }
	      if (isNew(match, index) || matchPathChanged(match, index)) {
	        return true;
	      }
	      if (match.route.shouldRevalidate) {
	        let routeChoice = match.route.shouldRevalidate({
	          currentUrl: new URL(location.pathname + location.search + location.hash, window.origin),
	          currentParams: currentMatches[0]?.params || {},
	          nextUrl: new URL(page, window.origin),
	          nextParams: match.params,
	          defaultShouldRevalidate: true
	        });
	        if (typeof routeChoice === "boolean") {
	          return routeChoice;
	        }
	      }
	      return true;
	    });
	  }
	  return [];
	}
	function getModuleLinkHrefs(matches, manifestPatch) {
	  return dedupeHrefs(matches.map(match => {
	    let route = manifestPatch.routes[match.route.id];
	    if (!route) return [];
	    let hrefs = [route.module];
	    if (route.imports) {
	      hrefs = hrefs.concat(route.imports);
	    }
	    return hrefs;
	  }).flat(1));
	}
	function dedupeHrefs(hrefs) {
	  return [...new Set(hrefs)];
	}
	function sortKeys(obj) {
	  let sorted = {};
	  let keys = Object.keys(obj).sort();
	  for (let key of keys) {
	    sorted[key] = obj[key];
	  }
	  return sorted;
	}
	function dedupeLinkDescriptors(descriptors, preloads) {
	  let set = /* @__PURE__ */new Set();
	  let preloadsSet = new Set(preloads);
	  return descriptors.reduce((deduped, descriptor) => {
	    let alreadyModulePreload = preloads && !isPageLinkDescriptor(descriptor) && descriptor.as === "script" && descriptor.href && preloadsSet.has(descriptor.href);
	    if (alreadyModulePreload) {
	      return deduped;
	    }
	    let key = JSON.stringify(sortKeys(descriptor));
	    if (!set.has(key)) {
	      set.add(key);
	      deduped.push({
	        key,
	        link: descriptor
	      });
	    }
	    return deduped;
	  }, []);
	}
	function singleFetchUrl(reqUrl) {
	  let url = typeof reqUrl === "string" ? new URL(reqUrl,
	  // This can be called during the SSR flow via PrefetchPageLinksImpl so
	  // don't assume window is available
	  typeof window === "undefined" ? "server://singlefetch/" : window.location.origin) : reqUrl;
	  if (url.pathname === "/") {
	    url.pathname = "_root.data";
	  } else {
	    url.pathname = `${url.pathname.replace(/\/$/, "")}.data`;
	  }
	  return url;
	}

	// lib/dom/ssr/components.tsx
	function useDataRouterContext2() {
	  let context = React2__namespace.useContext(DataRouterContext);
	  invariant2(context, "You must render this element inside a <DataRouterContext.Provider> element");
	  return context;
	}
	function useDataRouterStateContext() {
	  let context = React2__namespace.useContext(DataRouterStateContext);
	  invariant2(context, "You must render this element inside a <DataRouterStateContext.Provider> element");
	  return context;
	}
	var FrameworkContext = React2__namespace.createContext(void 0);
	FrameworkContext.displayName = "FrameworkContext";
	function useFrameworkContext() {
	  let context = React2__namespace.useContext(FrameworkContext);
	  invariant2(context, "You must render this element inside a <HydratedRouter> element");
	  return context;
	}
	function usePrefetchBehavior(prefetch, theirElementProps) {
	  let frameworkContext = React2__namespace.useContext(FrameworkContext);
	  let [maybePrefetch, setMaybePrefetch] = React2__namespace.useState(false);
	  let [shouldPrefetch, setShouldPrefetch] = React2__namespace.useState(false);
	  let {
	    onFocus,
	    onBlur,
	    onMouseEnter,
	    onMouseLeave,
	    onTouchStart
	  } = theirElementProps;
	  let ref = React2__namespace.useRef(null);
	  React2__namespace.useEffect(() => {
	    if (prefetch === "render") {
	      setShouldPrefetch(true);
	    }
	    if (prefetch === "viewport") {
	      let callback = entries => {
	        entries.forEach(entry => {
	          setShouldPrefetch(entry.isIntersecting);
	        });
	      };
	      let observer = new IntersectionObserver(callback, {
	        threshold: 0.5
	      });
	      if (ref.current) observer.observe(ref.current);
	      return () => {
	        observer.disconnect();
	      };
	    }
	  }, [prefetch]);
	  React2__namespace.useEffect(() => {
	    if (maybePrefetch) {
	      let id = setTimeout(() => {
	        setShouldPrefetch(true);
	      }, 100);
	      return () => {
	        clearTimeout(id);
	      };
	    }
	  }, [maybePrefetch]);
	  let setIntent = () => {
	    setMaybePrefetch(true);
	  };
	  let cancelIntent = () => {
	    setMaybePrefetch(false);
	    setShouldPrefetch(false);
	  };
	  if (!frameworkContext) {
	    return [false, ref, {}];
	  }
	  if (prefetch !== "intent") {
	    return [shouldPrefetch, ref, {}];
	  }
	  return [shouldPrefetch, ref, {
	    onFocus: composeEventHandlers(onFocus, setIntent),
	    onBlur: composeEventHandlers(onBlur, cancelIntent),
	    onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
	    onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
	    onTouchStart: composeEventHandlers(onTouchStart, setIntent)
	  }];
	}
	function composeEventHandlers(theirHandler, ourHandler) {
	  return event => {
	    theirHandler && theirHandler(event);
	    if (!event.defaultPrevented) {
	      ourHandler(event);
	    }
	  };
	}
	function PrefetchPageLinks({
	  page,
	  ...dataLinkProps
	}) {
	  let {
	    router
	  } = useDataRouterContext2();
	  let matches = React2__namespace.useMemo(() => matchRoutes(router.routes, page, router.basename), [router.routes, page, router.basename]);
	  if (!matches) {
	    return null;
	  }
	  return /* @__PURE__ */React2__namespace.createElement(PrefetchPageLinksImpl, {
	    page,
	    matches,
	    ...dataLinkProps
	  });
	}
	function useKeyedPrefetchLinks(matches) {
	  let {
	    manifest,
	    routeModules
	  } = useFrameworkContext();
	  let [keyedPrefetchLinks, setKeyedPrefetchLinks] = React2__namespace.useState([]);
	  React2__namespace.useEffect(() => {
	    let interrupted = false;
	    void getKeyedPrefetchLinks(matches, manifest, routeModules).then(links => {
	      if (!interrupted) {
	        setKeyedPrefetchLinks(links);
	      }
	    });
	    return () => {
	      interrupted = true;
	    };
	  }, [matches, manifest, routeModules]);
	  return keyedPrefetchLinks;
	}
	function PrefetchPageLinksImpl({
	  page,
	  matches: nextMatches,
	  ...linkProps
	}) {
	  let location = useLocation();
	  let {
	    manifest,
	    routeModules
	  } = useFrameworkContext();
	  let {
	    loaderData,
	    matches
	  } = useDataRouterStateContext();
	  let newMatchesForData = React2__namespace.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, manifest, location, "data"), [page, nextMatches, matches, manifest, location]);
	  let newMatchesForAssets = React2__namespace.useMemo(() => getNewMatchesForLinks(page, nextMatches, matches, manifest, location, "assets"), [page, nextMatches, matches, manifest, location]);
	  let dataHrefs = React2__namespace.useMemo(() => {
	    if (page === location.pathname + location.search + location.hash) {
	      return [];
	    }
	    let routesParams = /* @__PURE__ */new Set();
	    let foundOptOutRoute = false;
	    nextMatches.forEach(m => {
	      let manifestRoute = manifest.routes[m.route.id];
	      if (!manifestRoute || !manifestRoute.hasLoader) {
	        return;
	      }
	      if (!newMatchesForData.some(m2 => m2.route.id === m.route.id) && m.route.id in loaderData && routeModules[m.route.id]?.shouldRevalidate) {
	        foundOptOutRoute = true;
	      } else if (manifestRoute.hasClientLoader) {
	        foundOptOutRoute = true;
	      } else {
	        routesParams.add(m.route.id);
	      }
	    });
	    if (routesParams.size === 0) {
	      return [];
	    }
	    let url = singleFetchUrl(page);
	    if (foundOptOutRoute && routesParams.size > 0) {
	      url.searchParams.set("_routes", nextMatches.filter(m => routesParams.has(m.route.id)).map(m => m.route.id).join(","));
	    }
	    return [url.pathname + url.search];
	  }, [loaderData, location, manifest, newMatchesForData, nextMatches, page, routeModules]);
	  let moduleHrefs = React2__namespace.useMemo(() => getModuleLinkHrefs(newMatchesForAssets, manifest), [newMatchesForAssets, manifest]);
	  let keyedPrefetchLinks = useKeyedPrefetchLinks(newMatchesForAssets);
	  return /* @__PURE__ */React2__namespace.createElement(React2__namespace.Fragment, null, dataHrefs.map(href => /* @__PURE__ */React2__namespace.createElement("link", {
	    key: href,
	    rel: "prefetch",
	    as: "fetch",
	    href,
	    ...linkProps
	  })), moduleHrefs.map(href => /* @__PURE__ */React2__namespace.createElement("link", {
	    key: href,
	    rel: "modulepreload",
	    href,
	    ...linkProps
	  })), keyedPrefetchLinks.map(({
	    key,
	    link
	  }) =>
	  // these don't spread `linkProps` because they are full link descriptors
	  // already with their own props
	  /* @__PURE__ */
	  React2__namespace.createElement("link", {
	    key,
	    ...link
	  })));
	}
	function mergeRefs(...refs) {
	  return value => {
	    refs.forEach(ref => {
	      if (typeof ref === "function") {
	        ref(value);
	      } else if (ref != null) {
	        ref.current = value;
	      }
	    });
	  };
	}

	// lib/dom/lib.tsx
	var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
	try {
	  if (isBrowser) {
	    window.__reactRouterVersion = "7.1.5";
	  }
	} catch (e) {}
	function BrowserRouter({
	  basename,
	  children,
	  window: window2
	}) {
	  let historyRef = React2__namespace.useRef();
	  if (historyRef.current == null) {
	    historyRef.current = createBrowserHistory({
	      window: window2,
	      v5Compat: true
	    });
	  }
	  let history = historyRef.current;
	  let [state, setStateImpl] = React2__namespace.useState({
	    action: history.action,
	    location: history.location
	  });
	  let setState = React2__namespace.useCallback(newState => {
	    React2__namespace.startTransition(() => setStateImpl(newState));
	  }, [setStateImpl]);
	  React2__namespace.useLayoutEffect(() => history.listen(setState), [history, setState]);
	  return /* @__PURE__ */React2__namespace.createElement(Router, {
	    basename,
	    children,
	    location: state.location,
	    navigationType: state.action,
	    navigator: history
	  });
	}
	var ABSOLUTE_URL_REGEX2 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
	var Link = React2__namespace.forwardRef(function LinkWithRef({
	  onClick,
	  discover = "render",
	  prefetch = "none",
	  relative,
	  reloadDocument,
	  replace: replace2,
	  state,
	  target,
	  to,
	  preventScrollReset,
	  viewTransition,
	  ...rest
	}, forwardedRef) {
	  let {
	    basename
	  } = React2__namespace.useContext(NavigationContext);
	  let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX2.test(to);
	  let absoluteHref;
	  let isExternal = false;
	  if (typeof to === "string" && isAbsolute) {
	    absoluteHref = to;
	    if (isBrowser) {
	      try {
	        let currentUrl = new URL(window.location.href);
	        let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
	        let path = stripBasename(targetUrl.pathname, basename);
	        if (targetUrl.origin === currentUrl.origin && path != null) {
	          to = path + targetUrl.search + targetUrl.hash;
	        } else {
	          isExternal = true;
	        }
	      } catch (e) {
	        warning(false, `<Link to="${to}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`);
	      }
	    }
	  }
	  let href = useHref(to, {
	    relative
	  });
	  let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(prefetch, rest);
	  let internalOnClick = useLinkClickHandler(to, {
	    replace: replace2,
	    state,
	    target,
	    preventScrollReset,
	    relative,
	    viewTransition
	  });
	  function handleClick(event) {
	    if (onClick) onClick(event);
	    if (!event.defaultPrevented) {
	      internalOnClick(event);
	    }
	  }
	  let link =
	  // eslint-disable-next-line jsx-a11y/anchor-has-content
	  /* @__PURE__ */
	  React2__namespace.createElement("a", {
	    ...rest,
	    ...prefetchHandlers,
	    href: absoluteHref || href,
	    onClick: isExternal || reloadDocument ? onClick : handleClick,
	    ref: mergeRefs(forwardedRef, prefetchRef),
	    target,
	    "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
	  });
	  return shouldPrefetch && !isAbsolute ? /* @__PURE__ */React2__namespace.createElement(React2__namespace.Fragment, null, link, /* @__PURE__ */React2__namespace.createElement(PrefetchPageLinks, {
	    page: href
	  })) : link;
	});
	Link.displayName = "Link";
	var NavLink = React2__namespace.forwardRef(function NavLinkWithRef({
	  "aria-current": ariaCurrentProp = "page",
	  caseSensitive = false,
	  className: classNameProp = "",
	  end = false,
	  style: styleProp,
	  to,
	  viewTransition,
	  children,
	  ...rest
	}, ref) {
	  let path = useResolvedPath(to, {
	    relative: rest.relative
	  });
	  let location = useLocation();
	  let routerState = React2__namespace.useContext(DataRouterStateContext);
	  let {
	    navigator: navigator2,
	    basename
	  } = React2__namespace.useContext(NavigationContext);
	  let isTransitioning = routerState != null &&
	  // Conditional usage is OK here because the usage of a data router is static
	  // eslint-disable-next-line react-hooks/rules-of-hooks
	  useViewTransitionState(path) && viewTransition === true;
	  let toPathname = navigator2.encodeLocation ? navigator2.encodeLocation(path).pathname : path.pathname;
	  let locationPathname = location.pathname;
	  let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
	  if (!caseSensitive) {
	    locationPathname = locationPathname.toLowerCase();
	    nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
	    toPathname = toPathname.toLowerCase();
	  }
	  if (nextLocationPathname && basename) {
	    nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
	  }
	  const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
	  let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
	  let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
	  let renderProps = {
	    isActive,
	    isPending,
	    isTransitioning
	  };
	  let ariaCurrent = isActive ? ariaCurrentProp : void 0;
	  let className;
	  if (typeof classNameProp === "function") {
	    className = classNameProp(renderProps);
	  } else {
	    className = [classNameProp, isActive ? "active" : null, isPending ? "pending" : null, isTransitioning ? "transitioning" : null].filter(Boolean).join(" ");
	  }
	  let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
	  return /* @__PURE__ */React2__namespace.createElement(Link, {
	    ...rest,
	    "aria-current": ariaCurrent,
	    className,
	    ref,
	    style,
	    to,
	    viewTransition
	  }, typeof children === "function" ? children(renderProps) : children);
	});
	NavLink.displayName = "NavLink";
	var Form = React2__namespace.forwardRef(({
	  discover = "render",
	  fetcherKey,
	  navigate,
	  reloadDocument,
	  replace: replace2,
	  state,
	  method = defaultMethod,
	  action,
	  onSubmit,
	  relative,
	  preventScrollReset,
	  viewTransition,
	  ...props
	}, forwardedRef) => {
	  let submit = useSubmit();
	  let formAction = useFormAction(action, {
	    relative
	  });
	  let formMethod = method.toLowerCase() === "get" ? "get" : "post";
	  let isAbsolute = typeof action === "string" && ABSOLUTE_URL_REGEX2.test(action);
	  let submitHandler = event => {
	    onSubmit && onSubmit(event);
	    if (event.defaultPrevented) return;
	    event.preventDefault();
	    let submitter = event.nativeEvent.submitter;
	    let submitMethod = submitter?.getAttribute("formmethod") || method;
	    submit(submitter || event.currentTarget, {
	      fetcherKey,
	      method: submitMethod,
	      navigate,
	      replace: replace2,
	      state,
	      relative,
	      preventScrollReset,
	      viewTransition
	    });
	  };
	  return /* @__PURE__ */React2__namespace.createElement("form", {
	    ref: forwardedRef,
	    method: formMethod,
	    action: formAction,
	    onSubmit: reloadDocument ? onSubmit : submitHandler,
	    ...props,
	    "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
	  });
	});
	Form.displayName = "Form";
	function getDataRouterConsoleError2(hookName) {
	  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
	}
	function useDataRouterContext3(hookName) {
	  let ctx = React2__namespace.useContext(DataRouterContext);
	  invariant(ctx, getDataRouterConsoleError2(hookName));
	  return ctx;
	}
	function useLinkClickHandler(to, {
	  target,
	  replace: replaceProp,
	  state,
	  preventScrollReset,
	  relative,
	  viewTransition
	} = {}) {
	  let navigate = useNavigate();
	  let location = useLocation();
	  let path = useResolvedPath(to, {
	    relative
	  });
	  return React2__namespace.useCallback(event => {
	    if (shouldProcessLinkClick(event, target)) {
	      event.preventDefault();
	      let replace2 = replaceProp !== void 0 ? replaceProp : createPath$1(location) === createPath$1(path);
	      navigate(to, {
	        replace: replace2,
	        state,
	        preventScrollReset,
	        relative,
	        viewTransition
	      });
	    }
	  }, [location, navigate, path, replaceProp, state, target, to, preventScrollReset, relative, viewTransition]);
	}
	var fetcherId = 0;
	var getUniqueFetcherId = () => `__${String(++fetcherId)}__`;
	function useSubmit() {
	  let {
	    router
	  } = useDataRouterContext3("useSubmit" /* UseSubmit */);
	  let {
	    basename
	  } = React2__namespace.useContext(NavigationContext);
	  let currentRouteId = useRouteId();
	  return React2__namespace.useCallback(async (target, options = {}) => {
	    let {
	      action,
	      method,
	      encType,
	      formData,
	      body
	    } = getFormSubmissionInfo(target, basename);
	    if (options.navigate === false) {
	      let key = options.fetcherKey || getUniqueFetcherId();
	      await router.fetch(key, currentRouteId, options.action || action, {
	        preventScrollReset: options.preventScrollReset,
	        formData,
	        body,
	        formMethod: options.method || method,
	        formEncType: options.encType || encType,
	        flushSync: options.flushSync
	      });
	    } else {
	      await router.navigate(options.action || action, {
	        preventScrollReset: options.preventScrollReset,
	        formData,
	        body,
	        formMethod: options.method || method,
	        formEncType: options.encType || encType,
	        replace: options.replace,
	        state: options.state,
	        fromRouteId: currentRouteId,
	        flushSync: options.flushSync,
	        viewTransition: options.viewTransition
	      });
	    }
	  }, [router, basename, currentRouteId]);
	}
	function useFormAction(action, {
	  relative
	} = {}) {
	  let {
	    basename
	  } = React2__namespace.useContext(NavigationContext);
	  let routeContext = React2__namespace.useContext(RouteContext);
	  invariant(routeContext, "useFormAction must be used inside a RouteContext");
	  let [match] = routeContext.matches.slice(-1);
	  let path = {
	    ...useResolvedPath(action ? action : ".", {
	      relative
	    })
	  };
	  let location = useLocation();
	  if (action == null) {
	    path.search = location.search;
	    let params = new URLSearchParams(path.search);
	    let indexValues = params.getAll("index");
	    let hasNakedIndexParam = indexValues.some(v => v === "");
	    if (hasNakedIndexParam) {
	      params.delete("index");
	      indexValues.filter(v => v).forEach(v => params.append("index", v));
	      let qs = params.toString();
	      path.search = qs ? `?${qs}` : "";
	    }
	  }
	  if ((!action || action === ".") && match.route.index) {
	    path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
	  }
	  if (basename !== "/") {
	    path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
	  }
	  return createPath$1(path);
	}
	function useViewTransitionState(to, opts = {}) {
	  let vtContext = React2__namespace.useContext(ViewTransitionContext);
	  invariant(vtContext != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
	  let {
	    basename
	  } = useDataRouterContext3("useViewTransitionState" /* useViewTransitionState */);
	  let path = useResolvedPath(to, {
	    relative: opts.relative
	  });
	  if (!vtContext.isTransitioning) {
	    return false;
	  }
	  let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
	  let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
	  return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
	}

	// lib/server-runtime/crypto.ts
	new TextEncoder();

	var reactActivation = {exports: {}};

	var index_min$1 = {exports: {}};

	var flatten = {};

	var interopRequireDefault = {exports: {}};

	var hasRequiredInteropRequireDefault;
	function requireInteropRequireDefault() {
	  if (hasRequiredInteropRequireDefault) return interopRequireDefault.exports;
	  hasRequiredInteropRequireDefault = 1;
	  (function (module) {
	    function _interopRequireDefault(e) {
	      return e && e.__esModule ? e : {
	        "default": e
	      };
	    }
	    module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(interopRequireDefault);
	  return interopRequireDefault.exports;
	}

	var toConsumableArray = {exports: {}};

	var arrayWithoutHoles = {exports: {}};

	var arrayLikeToArray = {exports: {}};

	var hasRequiredArrayLikeToArray;
	function requireArrayLikeToArray() {
	  if (hasRequiredArrayLikeToArray) return arrayLikeToArray.exports;
	  hasRequiredArrayLikeToArray = 1;
	  (function (module) {
	    function _arrayLikeToArray(r, a) {
	      (null == a || a > r.length) && (a = r.length);
	      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	      return n;
	    }
	    module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(arrayLikeToArray);
	  return arrayLikeToArray.exports;
	}

	var hasRequiredArrayWithoutHoles;
	function requireArrayWithoutHoles() {
	  if (hasRequiredArrayWithoutHoles) return arrayWithoutHoles.exports;
	  hasRequiredArrayWithoutHoles = 1;
	  (function (module) {
	    var arrayLikeToArray = requireArrayLikeToArray();
	    function _arrayWithoutHoles(r) {
	      if (Array.isArray(r)) return arrayLikeToArray(r);
	    }
	    module.exports = _arrayWithoutHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(arrayWithoutHoles);
	  return arrayWithoutHoles.exports;
	}

	var iterableToArray = {exports: {}};

	var hasRequiredIterableToArray;
	function requireIterableToArray() {
	  if (hasRequiredIterableToArray) return iterableToArray.exports;
	  hasRequiredIterableToArray = 1;
	  (function (module) {
	    function _iterableToArray(r) {
	      if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	    }
	    module.exports = _iterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(iterableToArray);
	  return iterableToArray.exports;
	}

	var unsupportedIterableToArray = {exports: {}};

	var hasRequiredUnsupportedIterableToArray;
	function requireUnsupportedIterableToArray() {
	  if (hasRequiredUnsupportedIterableToArray) return unsupportedIterableToArray.exports;
	  hasRequiredUnsupportedIterableToArray = 1;
	  (function (module) {
	    var arrayLikeToArray = requireArrayLikeToArray();
	    function _unsupportedIterableToArray(r, a) {
	      if (r) {
	        if ("string" == typeof r) return arrayLikeToArray(r, a);
	        var t = {}.toString.call(r).slice(8, -1);
	        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? arrayLikeToArray(r, a) : void 0;
	      }
	    }
	    module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(unsupportedIterableToArray);
	  return unsupportedIterableToArray.exports;
	}

	var nonIterableSpread = {exports: {}};

	var hasRequiredNonIterableSpread;
	function requireNonIterableSpread() {
	  if (hasRequiredNonIterableSpread) return nonIterableSpread.exports;
	  hasRequiredNonIterableSpread = 1;
	  (function (module) {
	    function _nonIterableSpread() {
	      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	    }
	    module.exports = _nonIterableSpread, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(nonIterableSpread);
	  return nonIterableSpread.exports;
	}

	var hasRequiredToConsumableArray;
	function requireToConsumableArray() {
	  if (hasRequiredToConsumableArray) return toConsumableArray.exports;
	  hasRequiredToConsumableArray = 1;
	  (function (module) {
	    var arrayWithoutHoles = requireArrayWithoutHoles();
	    var iterableToArray = requireIterableToArray();
	    var unsupportedIterableToArray = requireUnsupportedIterableToArray();
	    var nonIterableSpread = requireNonIterableSpread();
	    function _toConsumableArray(r) {
	      return arrayWithoutHoles(r) || iterableToArray(r) || unsupportedIterableToArray(r) || nonIterableSpread();
	    }
	    module.exports = _toConsumableArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(toConsumableArray);
	  return toConsumableArray.exports;
	}

	var isArray = {};

	var hasRequiredIsArray;
	function requireIsArray() {
	  if (hasRequiredIsArray) return isArray;
	  hasRequiredIsArray = 1;
	  Object.defineProperty(isArray, "__esModule", {
	    value: true
	  });
	  isArray.default = void 0;
	  var isArray$1 = function isArray(value) {
	    return value instanceof Array;
	  };
	  var _default = isArray$1;
	  isArray.default = _default;
	  return isArray;
	}

	var hasRequiredFlatten;
	function requireFlatten() {
	  if (hasRequiredFlatten) return flatten;
	  hasRequiredFlatten = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(flatten, "__esModule", {
	    value: true
	  });
	  flatten.default = void 0;
	  var _toConsumableArray2 = _interopRequireDefault(requireToConsumableArray());
	  var _isArray = _interopRequireDefault(requireIsArray());
	  var flatten$1 = function flatten(array) {
	    return array.reduce(function (res, item) {
	      return [].concat((0, _toConsumableArray2.default)(res), (0, _toConsumableArray2.default)((0, _isArray.default)(item) ? flatten(item) : [item]));
	    }, []);
	  };
	  var _default = flatten$1;
	  flatten.default = _default;
	  return flatten;
	}

	var get = {};

	var isString = {};

	var hasRequiredIsString;
	function requireIsString() {
	  if (hasRequiredIsString) return isString;
	  hasRequiredIsString = 1;
	  Object.defineProperty(isString, "__esModule", {
	    value: true
	  });
	  isString.default = isString$1;
	  function isString$1(value) {
	    return typeof value === 'string';
	  }
	  return isString;
	}

	var isUndefined = {};

	var hasRequiredIsUndefined;
	function requireIsUndefined() {
	  if (hasRequiredIsUndefined) return isUndefined;
	  hasRequiredIsUndefined = 1;
	  Object.defineProperty(isUndefined, "__esModule", {
	    value: true
	  });
	  isUndefined.default = void 0;
	  var isUndefined$1 = function isUndefined(value) {
	    return typeof value === 'undefined';
	  };
	  var _default = isUndefined$1;
	  isUndefined.default = _default;
	  return isUndefined;
	}

	var isNumber = {};

	var _isNaN = {};

	var hasRequired_isNaN;
	function require_isNaN() {
	  if (hasRequired_isNaN) return _isNaN;
	  hasRequired_isNaN = 1;
	  Object.defineProperty(_isNaN, "__esModule", {
	    value: true
	  });
	  _isNaN.default = void 0;
	  var isNaN = function isNaN(value) {
	    return value !== value;
	  };
	  var _default = isNaN;
	  _isNaN.default = _default;
	  return _isNaN;
	}

	var hasRequiredIsNumber;
	function requireIsNumber() {
	  if (hasRequiredIsNumber) return isNumber;
	  hasRequiredIsNumber = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(isNumber, "__esModule", {
	    value: true
	  });
	  isNumber.default = void 0;
	  var _isNaN = _interopRequireDefault(require_isNaN());
	  var isNumber$1 = function isNumber(value) {
	    return typeof value === 'number' && !(0, _isNaN.default)(value);
	  };
	  var _default = isNumber$1;
	  isNumber.default = _default;
	  return isNumber;
	}

	var hasRequiredGet;
	function requireGet() {
	  if (hasRequiredGet) return get;
	  hasRequiredGet = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(get, "__esModule", {
	    value: true
	  });
	  get.default = get$1;
	  var _isString = _interopRequireDefault(requireIsString());
	  var _isUndefined = _interopRequireDefault(requireIsUndefined());
	  var _isNumber = _interopRequireDefault(requireIsNumber());
	  function get$1(obj) {
	    var keys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
	    var defaultValue = arguments.length > 2 ? arguments[2] : undefined;
	    try {
	      if ((0, _isNumber.default)(keys)) {
	        keys = String(keys);
	      }
	      var result = ((0, _isString.default)(keys) ? keys.split('.') : keys).reduce(function (res, key) {
	        return res[key];
	      }, obj);
	      return (0, _isUndefined.default)(result) ? defaultValue : result;
	    } catch (e) {
	      return defaultValue;
	    }
	  }
	  return get;
	}

	var run = {};

	var isFunction = {};

	var hasRequiredIsFunction;
	function requireIsFunction() {
	  if (hasRequiredIsFunction) return isFunction;
	  hasRequiredIsFunction = 1;
	  Object.defineProperty(isFunction, "__esModule", {
	    value: true
	  });
	  isFunction.default = void 0;
	  var isFunction$1 = function isFunction(value) {
	    return typeof value === 'function';
	  };
	  var _default = isFunction$1;
	  isFunction.default = _default;
	  return isFunction;
	}

	var hasRequiredRun;
	function requireRun() {
	  if (hasRequiredRun) return run;
	  hasRequiredRun = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(run, "__esModule", {
	    value: true
	  });
	  run.default = void 0;
	  var _isString = _interopRequireDefault(requireIsString());
	  var _isFunction = _interopRequireDefault(requireIsFunction());
	  var _get = _interopRequireDefault(requireGet());
	  var run$1 = function run(obj) {
	    var keys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
	    keys = (0, _isString.default)(keys) ? keys.split('.') : keys;
	    var func = (0, _get.default)(obj, keys);
	    var context = (0, _get.default)(obj, keys.slice(0, -1));
	    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
	      args[_key - 2] = arguments[_key];
	    }
	    return (0, _isFunction.default)(func) ? func.call.apply(func, [context].concat(args)) : func;
	  };
	  var _default = run$1;
	  run.default = _default;
	  return run;
	}

	var debounce = {};

	var hasRequiredDebounce;
	function requireDebounce() {
	  if (hasRequiredDebounce) return debounce;
	  hasRequiredDebounce = 1;
	  Object.defineProperty(debounce, "__esModule", {
	    value: true
	  });
	  debounce.default = void 0;

	  /**
	   * [防抖]
	   * @param {Function} func 执行函数
	   * @param {Number} wait 多少毫秒后运行一次
	   */
	  var debounce$1 = function debounce(func) {
	    var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;
	    var timeout;
	    return function () {
	      var _this = this;
	      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }
	      clearTimeout(timeout);
	      timeout = setTimeout(function () {
	        func.apply(_this, args);
	      }, wait);
	      return timeout;
	    };
	  };
	  var _default = debounce$1;
	  debounce.default = _default;
	  return debounce;
	}

	var lib = {exports: {}};

	var implementation = {exports: {}};

	var propTypes = {exports: {}};

	/**
	 * Copyright (c) 2013-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */
	var ReactPropTypesSecret_1;
	var hasRequiredReactPropTypesSecret;
	function requireReactPropTypesSecret() {
	  if (hasRequiredReactPropTypesSecret) return ReactPropTypesSecret_1;
	  hasRequiredReactPropTypesSecret = 1;
	  var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';
	  ReactPropTypesSecret_1 = ReactPropTypesSecret;
	  return ReactPropTypesSecret_1;
	}

	/**
	 * Copyright (c) 2013-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */
	var factoryWithThrowingShims;
	var hasRequiredFactoryWithThrowingShims;
	function requireFactoryWithThrowingShims() {
	  if (hasRequiredFactoryWithThrowingShims) return factoryWithThrowingShims;
	  hasRequiredFactoryWithThrowingShims = 1;
	  var ReactPropTypesSecret = requireReactPropTypesSecret();
	  function emptyFunction() {}
	  function emptyFunctionWithReset() {}
	  emptyFunctionWithReset.resetWarningCache = emptyFunction;
	  factoryWithThrowingShims = function () {
	    function shim(props, propName, componentName, location, propFullName, secret) {
	      if (secret === ReactPropTypesSecret) {
	        // It is still safe when called from React.
	        return;
	      }
	      var err = new Error('Calling PropTypes validators directly is not supported by the `prop-types` package. ' + 'Use PropTypes.checkPropTypes() to call them. ' + 'Read more at http://fb.me/use-check-prop-types');
	      err.name = 'Invariant Violation';
	      throw err;
	    }
	    shim.isRequired = shim;
	    function getShim() {
	      return shim;
	    }
	    // Important!
	    // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
	    var ReactPropTypes = {
	      array: shim,
	      bigint: shim,
	      bool: shim,
	      func: shim,
	      number: shim,
	      object: shim,
	      string: shim,
	      symbol: shim,
	      any: shim,
	      arrayOf: getShim,
	      element: shim,
	      elementType: shim,
	      instanceOf: getShim,
	      node: shim,
	      objectOf: getShim,
	      oneOf: getShim,
	      oneOfType: getShim,
	      shape: getShim,
	      exact: getShim,
	      checkPropTypes: emptyFunctionWithReset,
	      resetWarningCache: emptyFunction
	    };
	    ReactPropTypes.PropTypes = ReactPropTypes;
	    return ReactPropTypes;
	  };
	  return factoryWithThrowingShims;
	}

	/**
	 * Copyright (c) 2013-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */
	var hasRequiredPropTypes;
	function requirePropTypes() {
	  if (hasRequiredPropTypes) return propTypes.exports;
	  hasRequiredPropTypes = 1;
	  {
	    // By explicitly using `prop-types` you are opting into new production behavior.
	    // http://fb.me/prop-types-in-prod
	    propTypes.exports = requireFactoryWithThrowingShims()();
	  }
	  return propTypes.exports;
	}

	var gud;
	var hasRequiredGud;
	function requireGud() {
	  if (hasRequiredGud) return gud;
	  hasRequiredGud = 1;
	  var key = '__global_unique_id__';
	  gud = function () {
	    return commonjsGlobal[key] = (commonjsGlobal[key] || 0) + 1;
	  };
	  return gud;
	}

	/**
	 * Copyright (c) 2014-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */
	var warning_1;
	var hasRequiredWarning;
	function requireWarning() {
	  if (hasRequiredWarning) return warning_1;
	  hasRequiredWarning = 1;
	  var warning = function () {};
	  warning_1 = warning;
	  return warning_1;
	}

	var hasRequiredImplementation;
	function requireImplementation() {
	  if (hasRequiredImplementation) return implementation.exports;
	  hasRequiredImplementation = 1;
	  (function (module, exports) {

	    exports.__esModule = true;
	    var _react = React2;
	    _interopRequireDefault(_react);
	    var _propTypes = requirePropTypes();
	    var _propTypes2 = _interopRequireDefault(_propTypes);
	    var _gud = requireGud();
	    var _gud2 = _interopRequireDefault(_gud);
	    var _warning = requireWarning();
	    _interopRequireDefault(_warning);
	    function _interopRequireDefault(obj) {
	      return obj && obj.__esModule ? obj : {
	        default: obj
	      };
	    }
	    function _classCallCheck(instance, Constructor) {
	      if (!(instance instanceof Constructor)) {
	        throw new TypeError("Cannot call a class as a function");
	      }
	    }
	    function _possibleConstructorReturn(self, call) {
	      if (!self) {
	        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	      }
	      return call && (typeof call === "object" || typeof call === "function") ? call : self;
	    }
	    function _inherits(subClass, superClass) {
	      if (typeof superClass !== "function" && superClass !== null) {
	        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	      }
	      subClass.prototype = Object.create(superClass && superClass.prototype, {
	        constructor: {
	          value: subClass,
	          enumerable: false,
	          writable: true,
	          configurable: true
	        }
	      });
	      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	    }
	    var MAX_SIGNED_31_BIT_INT = 1073741823;

	    // Inlined Object.is polyfill.
	    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
	    function objectIs(x, y) {
	      if (x === y) {
	        return x !== 0 || 1 / x === 1 / y;
	      } else {
	        return x !== x && y !== y;
	      }
	    }
	    function createEventEmitter(value) {
	      var handlers = [];
	      return {
	        on: function on(handler) {
	          handlers.push(handler);
	        },
	        off: function off(handler) {
	          handlers = handlers.filter(function (h) {
	            return h !== handler;
	          });
	        },
	        get: function get() {
	          return value;
	        },
	        set: function set(newValue, changedBits) {
	          value = newValue;
	          handlers.forEach(function (handler) {
	            return handler(value, changedBits);
	          });
	        }
	      };
	    }
	    function onlyChild(children) {
	      return Array.isArray(children) ? children[0] : children;
	    }
	    function createReactContext(defaultValue, calculateChangedBits) {
	      var _Provider$childContex, _Consumer$contextType;
	      var contextProp = '__create-react-context-' + (0, _gud2.default)() + '__';
	      var Provider = function (_Component) {
	        _inherits(Provider, _Component);
	        function Provider() {
	          var _temp, _this, _ret;
	          _classCallCheck(this, Provider);
	          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	            args[_key] = arguments[_key];
	          }
	          return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.emitter = createEventEmitter(_this.props.value), _temp), _possibleConstructorReturn(_this, _ret);
	        }
	        Provider.prototype.getChildContext = function getChildContext() {
	          var _ref;
	          return _ref = {}, _ref[contextProp] = this.emitter, _ref;
	        };
	        Provider.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
	          if (this.props.value !== nextProps.value) {
	            var oldValue = this.props.value;
	            var newValue = nextProps.value;
	            var changedBits = void 0;
	            if (objectIs(oldValue, newValue)) {
	              changedBits = 0; // No change
	            } else {
	              changedBits = typeof calculateChangedBits === 'function' ? calculateChangedBits(oldValue, newValue) : MAX_SIGNED_31_BIT_INT;
	              changedBits |= 0;
	              if (changedBits !== 0) {
	                this.emitter.set(nextProps.value, changedBits);
	              }
	            }
	          }
	        };
	        Provider.prototype.render = function render() {
	          return this.props.children;
	        };
	        return Provider;
	      }(_react.Component);
	      Provider.childContextTypes = (_Provider$childContex = {}, _Provider$childContex[contextProp] = _propTypes2.default.object.isRequired, _Provider$childContex);
	      var Consumer = function (_Component2) {
	        _inherits(Consumer, _Component2);
	        function Consumer() {
	          var _temp2, _this2, _ret2;
	          _classCallCheck(this, Consumer);
	          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	            args[_key2] = arguments[_key2];
	          }
	          return _ret2 = (_temp2 = (_this2 = _possibleConstructorReturn(this, _Component2.call.apply(_Component2, [this].concat(args))), _this2), _this2.state = {
	            value: _this2.getValue()
	          }, _this2.onUpdate = function (newValue, changedBits) {
	            var observedBits = _this2.observedBits | 0;
	            if ((observedBits & changedBits) !== 0) {
	              _this2.setState({
	                value: _this2.getValue()
	              });
	            }
	          }, _temp2), _possibleConstructorReturn(_this2, _ret2);
	        }
	        Consumer.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
	          var observedBits = nextProps.observedBits;
	          this.observedBits = observedBits === undefined || observedBits === null ? MAX_SIGNED_31_BIT_INT // Subscribe to all changes by default
	          : observedBits;
	        };
	        Consumer.prototype.componentDidMount = function componentDidMount() {
	          if (this.context[contextProp]) {
	            this.context[contextProp].on(this.onUpdate);
	          }
	          var observedBits = this.props.observedBits;
	          this.observedBits = observedBits === undefined || observedBits === null ? MAX_SIGNED_31_BIT_INT // Subscribe to all changes by default
	          : observedBits;
	        };
	        Consumer.prototype.componentWillUnmount = function componentWillUnmount() {
	          if (this.context[contextProp]) {
	            this.context[contextProp].off(this.onUpdate);
	          }
	        };
	        Consumer.prototype.getValue = function getValue() {
	          if (this.context[contextProp]) {
	            return this.context[contextProp].get();
	          } else {
	            return defaultValue;
	          }
	        };
	        Consumer.prototype.render = function render() {
	          return onlyChild(this.props.children)(this.state.value);
	        };
	        return Consumer;
	      }(_react.Component);
	      Consumer.contextTypes = (_Consumer$contextType = {}, _Consumer$contextType[contextProp] = _propTypes2.default.object, _Consumer$contextType);
	      return {
	        Provider: Provider,
	        Consumer: Consumer
	      };
	    }
	    exports.default = createReactContext;
	    module.exports = exports['default'];
	  })(implementation, implementation.exports);
	  return implementation.exports;
	}

	var hasRequiredLib;
	function requireLib() {
	  if (hasRequiredLib) return lib.exports;
	  hasRequiredLib = 1;
	  (function (module, exports) {

	    exports.__esModule = true;
	    var _react = React2;
	    var _react2 = _interopRequireDefault(_react);
	    var _implementation = requireImplementation();
	    var _implementation2 = _interopRequireDefault(_implementation);
	    function _interopRequireDefault(obj) {
	      return obj && obj.__esModule ? obj : {
	        default: obj
	      };
	    }
	    exports.default = _react2.default.createContext || _implementation2.default;
	    module.exports = exports['default'];
	  })(lib, lib.exports);
	  return lib.exports;
	}

	var EventBus = {};

	var defineProperty = {exports: {}};

	var toPropertyKey = {exports: {}};

	var _typeof = {exports: {}};

	var hasRequired_typeof;
	function require_typeof() {
	  if (hasRequired_typeof) return _typeof.exports;
	  hasRequired_typeof = 1;
	  (function (module) {
	    function _typeof(o) {
	      "@babel/helpers - typeof";

	      return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	        return typeof o;
	      } : function (o) {
	        return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	      }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(o);
	    }
	    module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(_typeof);
	  return _typeof.exports;
	}

	var toPrimitive = {exports: {}};

	var hasRequiredToPrimitive;
	function requireToPrimitive() {
	  if (hasRequiredToPrimitive) return toPrimitive.exports;
	  hasRequiredToPrimitive = 1;
	  (function (module) {
	    var _typeof = require_typeof()["default"];
	    function toPrimitive(t, r) {
	      if ("object" != _typeof(t) || !t) return t;
	      var e = t[Symbol.toPrimitive];
	      if (void 0 !== e) {
	        var i = e.call(t, r || "default");
	        if ("object" != _typeof(i)) return i;
	        throw new TypeError("@@toPrimitive must return a primitive value.");
	      }
	      return ("string" === r ? String : Number)(t);
	    }
	    module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(toPrimitive);
	  return toPrimitive.exports;
	}

	var hasRequiredToPropertyKey;
	function requireToPropertyKey() {
	  if (hasRequiredToPropertyKey) return toPropertyKey.exports;
	  hasRequiredToPropertyKey = 1;
	  (function (module) {
	    var _typeof = require_typeof()["default"];
	    var toPrimitive = requireToPrimitive();
	    function toPropertyKey(t) {
	      var i = toPrimitive(t, "string");
	      return "symbol" == _typeof(i) ? i : i + "";
	    }
	    module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(toPropertyKey);
	  return toPropertyKey.exports;
	}

	var hasRequiredDefineProperty;
	function requireDefineProperty() {
	  if (hasRequiredDefineProperty) return defineProperty.exports;
	  hasRequiredDefineProperty = 1;
	  (function (module) {
	    var toPropertyKey = requireToPropertyKey();
	    function _defineProperty(e, r, t) {
	      return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
	        value: t,
	        enumerable: !0,
	        configurable: !0,
	        writable: !0
	      }) : e[r] = t, e;
	    }
	    module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(defineProperty);
	  return defineProperty.exports;
	}

	var classCallCheck = {exports: {}};

	var hasRequiredClassCallCheck;
	function requireClassCallCheck() {
	  if (hasRequiredClassCallCheck) return classCallCheck.exports;
	  hasRequiredClassCallCheck = 1;
	  (function (module) {
	    function _classCallCheck(a, n) {
	      if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	    }
	    module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;
	  })(classCallCheck);
	  return classCallCheck.exports;
	}

	var hasRequiredEventBus;
	function requireEventBus() {
	  if (hasRequiredEventBus) return EventBus;
	  hasRequiredEventBus = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(EventBus, "__esModule", {
	    value: true
	  });
	  EventBus.default = void 0;
	  var _defineProperty2 = _interopRequireDefault(requireDefineProperty());
	  var _classCallCheck2 = _interopRequireDefault(requireClassCallCheck());
	  var _isFunction = _interopRequireDefault(requireIsFunction());
	  var _isUndefined = _interopRequireDefault(requireIsUndefined());
	  function ownKeys(object, enumerableOnly) {
	    var keys = Object.keys(object);
	    if (Object.getOwnPropertySymbols) {
	      var symbols = Object.getOwnPropertySymbols(object);
	      if (enumerableOnly) symbols = symbols.filter(function (sym) {
	        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	      });
	      keys.push.apply(keys, symbols);
	    }
	    return keys;
	  }
	  function _objectSpread(target) {
	    for (var i = 1; i < arguments.length; i++) {
	      var source = arguments[i] != null ? arguments[i] : {};
	      if (i % 2) {
	        ownKeys(Object(source), true).forEach(function (key) {
	          (0, _defineProperty2.default)(target, key, source[key]);
	        });
	      } else if (Object.getOwnPropertyDescriptors) {
	        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	      } else {
	        ownKeys(Object(source)).forEach(function (key) {
	          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	        });
	      }
	    }
	    return target;
	  }
	  var EventBus$1 = function EventBus() {
	    var _this = this;
	    (0, _classCallCheck2.default)(this, EventBus);
	    this.listeners = {};
	    this.getEventMap = function (event) {
	      if (!_this.listeners[event]) {
	        _this.listeners[event] = new Map();
	      }
	      return _this.listeners[event];
	    };
	    this.on = function (event, listener) {
	      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
	        _ref$once = _ref.once,
	        once = _ref$once === void 0 ? false : _ref$once;
	      if (!(0, _isFunction.default)(listener)) {
	        console.error('[EventBus Error] listener is not a function');
	        return _this;
	      }
	      _this.getEventMap(event).set(listener, once ? function () {
	        listener.apply(void 0, arguments);
	        _this.off(event, listener);
	      } : listener);
	      return _this;
	    };
	    this.once = function (event, listener) {
	      var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	      return _this.on(event, listener, _objectSpread(_objectSpread({}, config), {}, {
	        once: true
	      }));
	    };
	    this.off = function (event, listener) {
	      var eventMap = _this.getEventMap(event);
	      if ((0, _isUndefined.default)(listener)) {
	        eventMap.clear();
	      } else {
	        eventMap.delete(listener);
	      }
	      return _this;
	    };
	    this.emit = function (event) {
	      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	        args[_key - 1] = arguments[_key];
	      }
	      return _this.getEventMap(event).forEach(function (listener) {
	        return listener.apply(void 0, args);
	      });
	    };
	  };
	  EventBus.default = EventBus$1;
	  return EventBus;
	}

	var nextTick = {};

	var hasRequiredNextTick;
	function requireNextTick() {
	  if (hasRequiredNextTick) return nextTick;
	  hasRequiredNextTick = 1;
	  Object.defineProperty(nextTick, "__esModule", {
	    value: true
	  });
	  nextTick.default = void 0;
	  var nextTick$1 = function nextTick(func) {
	    return Promise.resolve().then(func);
	  };
	  var _default = nextTick$1;
	  nextTick.default = _default;
	  return nextTick;
	}

	var isExist = {};

	var isNull = {};

	var hasRequiredIsNull;
	function requireIsNull() {
	  if (hasRequiredIsNull) return isNull;
	  hasRequiredIsNull = 1;
	  Object.defineProperty(isNull, "__esModule", {
	    value: true
	  });
	  isNull.default = void 0;
	  var isNull$1 = function isNull(value) {
	    return value === null;
	  };
	  var _default = isNull$1;
	  isNull.default = _default;
	  return isNull;
	}

	var hasRequiredIsExist;
	function requireIsExist() {
	  if (hasRequiredIsExist) return isExist;
	  hasRequiredIsExist = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(isExist, "__esModule", {
	    value: true
	  });
	  isExist.default = void 0;
	  var _isUndefined = _interopRequireDefault(requireIsUndefined());
	  var _isNull = _interopRequireDefault(requireIsNull());
	  var isExist$1 = function isExist(value) {
	    return !((0, _isUndefined.default)(value) || (0, _isNull.default)(value));
	  };
	  var _default = isExist$1;
	  isExist.default = _default;
	  return isExist;
	}

	var memoize = {};

	var hasRequiredMemoize;
	function requireMemoize() {
	  if (hasRequiredMemoize) return memoize;
	  hasRequiredMemoize = 1;
	  Object.defineProperty(memoize, "__esModule", {
	    value: true
	  });
	  memoize.default = void 0;

	  /**
	   * [缓存函数结果]
	   * @param {Function} func 被处理的函数
	   */
	  var memoize$1 = function memoize(func) {
	    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	      _ref$disable = _ref.disable,
	      disable = _ref$disable === void 0 ? function () {
	        return false;
	      } : _ref$disable;
	    var cache = new Map();
	    var memoizedFunc = function memoizedFunc(key) {
	      if (cache.has(key)) {
	        return cache.get(key);
	      }
	      for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	        rest[_key - 1] = arguments[_key];
	      }
	      var result = func.call.apply(func, [this, key].concat(rest));
	      if (!disable.call(this, {
	        cache: cache,
	        key: key,
	        result: result,
	        drop: function drop() {
	          return cache.delete(key);
	        }
	      })) {
	        cache.set(key, result);
	      }
	      return result;
	    };
	    memoizedFunc.cache = cache;
	    return memoizedFunc;
	  };
	  var _default = memoize$1;
	  memoize.default = _default;
	  return memoize;
	}

	var isObject = {};

	var hasRequiredIsObject;
	function requireIsObject() {
	  if (hasRequiredIsObject) return isObject;
	  hasRequiredIsObject = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(isObject, "__esModule", {
	    value: true
	  });
	  isObject.default = void 0;
	  var _typeof2 = _interopRequireDefault(require_typeof());
	  var _isArray = _interopRequireDefault(requireIsArray());
	  var _isNull = _interopRequireDefault(requireIsNull());
	  var isObject$1 = function isObject(value) {
	    return (0, _typeof2.default)(value) === 'object' && !((0, _isArray.default)(value) || (0, _isNull.default)(value));
	  };
	  var _default = isObject$1;
	  isObject.default = _default;
	  return isObject;
	}

	var reactIs = {exports: {}};

	var reactIs_production_min = {};

	/** @license React v16.13.1
	 * react-is.production.min.js
	 *
	 * Copyright (c) Facebook, Inc. and its affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */
	var hasRequiredReactIs_production_min;
	function requireReactIs_production_min() {
	  if (hasRequiredReactIs_production_min) return reactIs_production_min;
	  hasRequiredReactIs_production_min = 1;
	  var b = "function" === typeof Symbol && Symbol.for,
	    c = b ? Symbol.for("react.element") : 60103,
	    d = b ? Symbol.for("react.portal") : 60106,
	    e = b ? Symbol.for("react.fragment") : 60107,
	    f = b ? Symbol.for("react.strict_mode") : 60108,
	    g = b ? Symbol.for("react.profiler") : 60114,
	    h = b ? Symbol.for("react.provider") : 60109,
	    k = b ? Symbol.for("react.context") : 60110,
	    l = b ? Symbol.for("react.async_mode") : 60111,
	    m = b ? Symbol.for("react.concurrent_mode") : 60111,
	    n = b ? Symbol.for("react.forward_ref") : 60112,
	    p = b ? Symbol.for("react.suspense") : 60113,
	    q = b ? Symbol.for("react.suspense_list") : 60120,
	    r = b ? Symbol.for("react.memo") : 60115,
	    t = b ? Symbol.for("react.lazy") : 60116,
	    v = b ? Symbol.for("react.block") : 60121,
	    w = b ? Symbol.for("react.fundamental") : 60117,
	    x = b ? Symbol.for("react.responder") : 60118,
	    y = b ? Symbol.for("react.scope") : 60119;
	  function z(a) {
	    if ("object" === typeof a && null !== a) {
	      var u = a.$$typeof;
	      switch (u) {
	        case c:
	          switch (a = a.type, a) {
	            case l:
	            case m:
	            case e:
	            case g:
	            case f:
	            case p:
	              return a;
	            default:
	              switch (a = a && a.$$typeof, a) {
	                case k:
	                case n:
	                case t:
	                case r:
	                case h:
	                  return a;
	                default:
	                  return u;
	              }
	          }
	        case d:
	          return u;
	      }
	    }
	  }
	  function A(a) {
	    return z(a) === m;
	  }
	  reactIs_production_min.AsyncMode = l;
	  reactIs_production_min.ConcurrentMode = m;
	  reactIs_production_min.ContextConsumer = k;
	  reactIs_production_min.ContextProvider = h;
	  reactIs_production_min.Element = c;
	  reactIs_production_min.ForwardRef = n;
	  reactIs_production_min.Fragment = e;
	  reactIs_production_min.Lazy = t;
	  reactIs_production_min.Memo = r;
	  reactIs_production_min.Portal = d;
	  reactIs_production_min.Profiler = g;
	  reactIs_production_min.StrictMode = f;
	  reactIs_production_min.Suspense = p;
	  reactIs_production_min.isAsyncMode = function (a) {
	    return A(a) || z(a) === l;
	  };
	  reactIs_production_min.isConcurrentMode = A;
	  reactIs_production_min.isContextConsumer = function (a) {
	    return z(a) === k;
	  };
	  reactIs_production_min.isContextProvider = function (a) {
	    return z(a) === h;
	  };
	  reactIs_production_min.isElement = function (a) {
	    return "object" === typeof a && null !== a && a.$$typeof === c;
	  };
	  reactIs_production_min.isForwardRef = function (a) {
	    return z(a) === n;
	  };
	  reactIs_production_min.isFragment = function (a) {
	    return z(a) === e;
	  };
	  reactIs_production_min.isLazy = function (a) {
	    return z(a) === t;
	  };
	  reactIs_production_min.isMemo = function (a) {
	    return z(a) === r;
	  };
	  reactIs_production_min.isPortal = function (a) {
	    return z(a) === d;
	  };
	  reactIs_production_min.isProfiler = function (a) {
	    return z(a) === g;
	  };
	  reactIs_production_min.isStrictMode = function (a) {
	    return z(a) === f;
	  };
	  reactIs_production_min.isSuspense = function (a) {
	    return z(a) === p;
	  };
	  reactIs_production_min.isValidElementType = function (a) {
	    return "string" === typeof a || "function" === typeof a || a === e || a === m || a === g || a === f || a === p || a === q || "object" === typeof a && null !== a && (a.$$typeof === t || a.$$typeof === r || a.$$typeof === h || a.$$typeof === k || a.$$typeof === n || a.$$typeof === w || a.$$typeof === x || a.$$typeof === y || a.$$typeof === v);
	  };
	  reactIs_production_min.typeOf = z;
	  return reactIs_production_min;
	}

	var hasRequiredReactIs;
	function requireReactIs() {
	  if (hasRequiredReactIs) return reactIs.exports;
	  hasRequiredReactIs = 1;
	  {
	    reactIs.exports = requireReactIs_production_min();
	  }
	  return reactIs.exports;
	}

	var hoistNonReactStatics_cjs;
	var hasRequiredHoistNonReactStatics_cjs;
	function requireHoistNonReactStatics_cjs() {
	  if (hasRequiredHoistNonReactStatics_cjs) return hoistNonReactStatics_cjs;
	  hasRequiredHoistNonReactStatics_cjs = 1;
	  var reactIs = requireReactIs();

	  /**
	   * Copyright 2015, Yahoo! Inc.
	   * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	   */
	  var REACT_STATICS = {
	    childContextTypes: true,
	    contextType: true,
	    contextTypes: true,
	    defaultProps: true,
	    displayName: true,
	    getDefaultProps: true,
	    getDerivedStateFromError: true,
	    getDerivedStateFromProps: true,
	    mixins: true,
	    propTypes: true,
	    type: true
	  };
	  var KNOWN_STATICS = {
	    name: true,
	    length: true,
	    prototype: true,
	    caller: true,
	    callee: true,
	    arguments: true,
	    arity: true
	  };
	  var FORWARD_REF_STATICS = {
	    '$$typeof': true,
	    render: true,
	    defaultProps: true,
	    displayName: true,
	    propTypes: true
	  };
	  var MEMO_STATICS = {
	    '$$typeof': true,
	    compare: true,
	    defaultProps: true,
	    displayName: true,
	    propTypes: true,
	    type: true
	  };
	  var TYPE_STATICS = {};
	  TYPE_STATICS[reactIs.ForwardRef] = FORWARD_REF_STATICS;
	  TYPE_STATICS[reactIs.Memo] = MEMO_STATICS;
	  function getStatics(component) {
	    // React v16.11 and below
	    if (reactIs.isMemo(component)) {
	      return MEMO_STATICS;
	    } // React v16.12 and above

	    return TYPE_STATICS[component['$$typeof']] || REACT_STATICS;
	  }
	  var defineProperty = Object.defineProperty;
	  var getOwnPropertyNames = Object.getOwnPropertyNames;
	  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	  var getPrototypeOf = Object.getPrototypeOf;
	  var objectPrototype = Object.prototype;
	  function hoistNonReactStatics(targetComponent, sourceComponent, blacklist) {
	    if (typeof sourceComponent !== 'string') {
	      // don't hoist over string (html) components
	      if (objectPrototype) {
	        var inheritedComponent = getPrototypeOf(sourceComponent);
	        if (inheritedComponent && inheritedComponent !== objectPrototype) {
	          hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
	        }
	      }
	      var keys = getOwnPropertyNames(sourceComponent);
	      if (getOwnPropertySymbols) {
	        keys = keys.concat(getOwnPropertySymbols(sourceComponent));
	      }
	      var targetStatics = getStatics(targetComponent);
	      var sourceStatics = getStatics(sourceComponent);
	      for (var i = 0; i < keys.length; ++i) {
	        var key = keys[i];
	        if (!KNOWN_STATICS[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
	          var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
	          try {
	            // Avoid failures from read-only properties
	            defineProperty(targetComponent, key, descriptor);
	          } catch (e) {}
	        }
	      }
	    }
	    return targetComponent;
	  }
	  hoistNonReactStatics_cjs = hoistNonReactStatics;
	  return hoistNonReactStatics_cjs;
	}

	var value = {};

	var hasRequiredValue;
	function requireValue() {
	  if (hasRequiredValue) return value;
	  hasRequiredValue = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(value, "__esModule", {
	    value: true
	  });
	  value.default = void 0;
	  var _isUndefined = _interopRequireDefault(requireIsUndefined());
	  var _run = _interopRequireDefault(requireRun());
	  var value$1 = function value() {
	    for (var _len = arguments.length, values = new Array(_len), _key = 0; _key < _len; _key++) {
	      values[_key] = arguments[_key];
	    }
	    return values.reduce(function (value, nextValue) {
	      return (0, _isUndefined.default)(value) ? (0, _run.default)(nextValue) : (0, _run.default)(value);
	    }, undefined);
	  };
	  var _default = value$1;
	  value.default = _default;
	  return value;
	}

	var globalThis$1 = {};

	var hasRequiredGlobalThis;
	function requireGlobalThis() {
	  if (hasRequiredGlobalThis) return globalThis$1;
	  hasRequiredGlobalThis = 1;
	  var _interopRequireDefault = requireInteropRequireDefault();
	  Object.defineProperty(globalThis$1, "__esModule", {
	    value: true
	  });
	  globalThis$1.default = void 0;
	  var _typeof2 = _interopRequireDefault(require_typeof());

	  /* ts-ignore */
	  var getImplementation = function getImplementation() {
	    if (typeof window !== 'undefined') {
	      return window;
	    }
	    if (typeof self !== 'undefined') {
	      return self;
	    } // @ts-ignore

	    if (typeof commonjsGlobal !== 'undefined') {
	      // @ts-ignore
	      return commonjsGlobal;
	    }
	    return Function('return this')();
	  };
	  var implementation = getImplementation();
	  var getGlobal = function getGlobal() {
	    if (
	    // @ts-ignore
	    (typeof commonjsGlobal === "undefined" ? "undefined" : (0, _typeof2.default)(commonjsGlobal)) !== 'object' ||
	    // @ts-ignore
	    !commonjsGlobal ||
	    // @ts-ignore
	    commonjsGlobal.Math !== Math ||
	    // @ts-ignore
	    commonjsGlobal.Array !== Array) {
	      return implementation;
	    } // @ts-ignore

	    return commonjsGlobal; // return implementation
	  };
	  var globalThis = getGlobal();
	  var _default = globalThis;
	  globalThis$1.default = _default;
	  return globalThis$1;
	}

	var reactNodeKey = {exports: {}};

	var index_min = {exports: {}};

	var hasRequiredIndex_min;
	function requireIndex_min() {
	  if (hasRequiredIndex_min) return index_min.exports;
	  hasRequiredIndex_min = 1;
	  (function (module, exports) {
	    !function (t, e) {
	      e(exports, requireRun(), React2, requireIsFunction(), requireIsString(), requireGet()) ;
	    }(commonjsGlobal, function (t, c, n, i, a, u) {

	      function f(t, e) {
	        for (var r = 0; r < e.length; r++) {
	          var n = e[r];
	          n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n);
	        }
	      }
	      function l(t, e, r) {
	        return e in t ? Object.defineProperty(t, e, {
	          value: r,
	          enumerable: !0,
	          configurable: !0,
	          writable: !0
	        }) : t[e] = r, t;
	      }
	      function s(t) {
	        return (s = Object.setPrototypeOf ? Object.getPrototypeOf : function (t) {
	          return t.__proto__ || Object.getPrototypeOf(t);
	        })(t);
	      }
	      function p(t, e) {
	        return (p = Object.setPrototypeOf || function (t, e) {
	          return t.__proto__ = e, t;
	        })(t, e);
	      }
	      function y(t) {
	        if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	        return t;
	      }
	      function d(i) {
	        var c = function () {
	          if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
	          if (Reflect.construct.sham) return !1;
	          if ("function" == typeof Proxy) return !0;
	          try {
	            return Date.prototype.toString.call(Reflect.construct(Date, [], function () {})), !0;
	          } catch (t) {
	            return !1;
	          }
	        }();
	        return function () {
	          var t,
	            e,
	            r,
	            n,
	            o = s(i);
	          return e = c ? (t = s(this).constructor, Reflect.construct(o, arguments, t)) : o.apply(this, arguments), r = this, !(n = e) || "object" != typeof n && "function" != typeof n ? y(r) : n;
	        };
	      }
	      function b(t) {
	        return function (t) {
	          if (Array.isArray(t)) return o(t);
	        }(t) || function (t) {
	          if ("undefined" != typeof Symbol && Symbol.iterator in Object(t)) return Array.from(t);
	        }(t) || function (t, e) {
	          if (!t) return;
	          if ("string" == typeof t) return o(t, e);
	          var r = Object.prototype.toString.call(t).slice(8, -1);
	          "Object" === r && t.constructor && (r = t.constructor.name);
	          if ("Map" === r || "Set" === r) return Array.from(t);
	          if ("Arguments" === r || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return o(t, e);
	        }(t) || function () {
	          throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	        }();
	      }
	      function o(t, e) {
	        (null == e || e > t.length) && (e = t.length);
	        for (var r = 0, n = new Array(e); r < e; r++) n[r] = t[r];
	        return n;
	      }
	      function e() {
	        var r = 0,
	          n = new Map();
	        return function (t) {
	          var e = n.get(t);
	          return e || (e = (++r).toString(32), n.set(t, e)), e;
	        };
	      }
	      c = c && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c, i = i && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i, a = a && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a, u = u && Object.prototype.hasOwnProperty.call(u, "default") ? u.default : u;
	      function v(t) {
	        var e,
	          r,
	          n,
	          o = g(u(t, "type.$$typeof", t.type)),
	          i = (r = u(e = t, "key") || e.index, n = u(e, "memoizedProps._nk") || u(e, "pendingProps._nk"), a(n) && m.test(n) ? "".concat(n, ".").concat(r) : n || r);
	        return "".concat(o, ",").concat(i);
	      }
	      function h(t) {
	        var e,
	          r,
	          n,
	          o = w(t.type),
	          i = (r = u(e = t, "key") || e.index, n = u(e, "props._nk"), a(n) && j.test(n) ? "".concat(n, ".").concat(r) : n || r);
	        return "".concat(o, ",").concat(i);
	      }
	      var _,
	        m = /^iAr/,
	        g = e(),
	        O = function (t, e) {
	          var r,
	            n,
	            o = (r = function t(e) {
	              return e.return ? [e].concat(b(t(e.return))) : [e];
	            }(t), n = e, r.map(function (t) {
	              var e = v(t);
	              return i(n) ? c(n, void 0, t, e) : e;
	            }).filter(Boolean).join("|"));
	          return g(o);
	        },
	        j = /^iAr/,
	        w = e(),
	        P = function (t, e) {
	          var r,
	            n,
	            o = (r = function t(e) {
	              return e.__ ? [e].concat(b(t(e.__))) : [e];
	            }(t), n = e, r.map(function (t) {
	              var e = h(t);
	              return i(n) ? c(n, void 0, t, e) : e;
	            }).filter(Boolean).join("|"));
	          return w(o);
	        },
	        r = function () {
	          !function (t, e) {
	            if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
	            t.prototype = Object.create(e && e.prototype, {
	              constructor: {
	                value: t,
	                writable: !0,
	                configurable: !0
	              }
	            }), e && p(t, e);
	          }(i, n.Component);
	          var t,
	            e,
	            o = d(i);
	          function i() {
	            var r;
	            !function (t, e) {
	              if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
	            }(this, i);
	            for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++) e[n] = arguments[n];
	            return l(y(r = o.call.apply(o, [this].concat(e))), "key", null), l(y(r), "genKey", function (t) {
	              switch (_ || ((r._reactInternalFiber || r._reactInternals) && (_ = "React"), r.__v && (_ = "Preact")), _) {
	                case "Preact":
	                  r.key = P(r.__v, t);
	                  break;
	                case "React":
	                  var e = r._reactInternalFiber || r._reactInternals;
	                  r.key = O(e, t);
	              }
	              return r.key;
	            }), r;
	          }
	          return t = i, (e = [{
	            key: "render",
	            value: function () {
	              var t = this.props,
	                e = (t.manualKey, t.children),
	                r = t.prefix,
	                n = t.onHandleNode;
	              return c(e, void 0, "".concat(r).concat(this.key || this.genKey(n)));
	            }
	          }]) && f(t.prototype, e), i;
	        }();
	      l(r, "defaultProps", {
	        onHandleNode: void 0,
	        manualKey: void 0,
	        prefix: ""
	      }), t.default = r, Object.defineProperty(t, "__esModule", {
	        value: !0
	      });
	    });
	  })(index_min, index_min.exports);
	  return index_min.exports;
	}

	var hasRequiredReactNodeKey;
	function requireReactNodeKey() {
	  if (hasRequiredReactNodeKey) return reactNodeKey.exports;
	  hasRequiredReactNodeKey = 1;
	  {
	    reactNodeKey.exports = requireIndex_min();
	  }
	  return reactNodeKey.exports;
	}

	(function (module, exports) {
	  ((e, t) => {
	    t(exports, requireFlatten(), requireGet(), requireRun(), requireDebounce(), React2, requireIsFunction(), requireLib(), requireEventBus(), requireNextTick(), require$$0, requireIsString(), requireIsExist(), requireMemoize(), requireIsUndefined(), requireIsObject(), requireHoistNonReactStatics_cjs(), requireValue(), requireIsArray(), requireGlobalThis(), requireReactNodeKey()) ;
	  })(commonjsGlobal, function (e, i, u, l, o, a, s, n, c, f, T, p, r, t, d, h, v, y, m, b, g) {
	    i = i && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i, u = u && Object.prototype.hasOwnProperty.call(u, "default") ? u.default : u, l = l && Object.prototype.hasOwnProperty.call(l, "default") ? l.default : l, o = o && Object.prototype.hasOwnProperty.call(o, "default") ? o.default : o;
	    var w = "default" in a ? a.default : a;
	    function U(e, t) {
	      (null == t || t > e.length) && (t = e.length);
	      for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	      return r;
	    }
	    function q(e) {
	      if (Array.isArray(e)) return e;
	    }
	    function k(e, t, n) {
	      return t = R(t), V(e, L() ? Reflect.construct(t, n || [], R(e).constructor) : t.apply(e, n));
	    }
	    function S(e, t) {
	      if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
	    }
	    function D(e, t) {
	      for (var n = 0; n < t.length; n++) {
	        var r = t[n];
	        r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, X(r.key), r);
	      }
	    }
	    function E(e, t, n) {
	      return t && D(e.prototype, t), n && D(e, n), Object.defineProperty(e, "prototype", {
	        writable: !1
	      }), e;
	    }
	    function O(e, t, n) {
	      return (t = X(t)) in e ? Object.defineProperty(e, t, {
	        value: n,
	        enumerable: !0,
	        configurable: !0,
	        writable: !0
	      }) : e[t] = n, e;
	    }
	    function P() {
	      return (P = Object.assign ? Object.assign.bind() : function (e) {
	        for (var t = 1; t < arguments.length; t++) {
	          var n,
	            r = arguments[t];
	          for (n in r) !{}.hasOwnProperty.call(r, n) || (e[n] = r[n]);
	        }
	        return e;
	      }).apply(null, arguments);
	    }
	    function R(e) {
	      return (R = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (e) {
	        return e.__proto__ || Object.getPrototypeOf(e);
	      })(e);
	    }
	    function C(e, t) {
	      if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function");
	      e.prototype = Object.create(t && t.prototype, {
	        constructor: {
	          value: e,
	          writable: !0,
	          configurable: !0
	        }
	      }), Object.defineProperty(e, "prototype", {
	        writable: !1
	      }), t && K(e, t);
	    }
	    function L() {
	      try {
	        var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
	      } catch (e) {}
	      return (L = function () {
	        return !!e;
	      })();
	    }
	    function M(e) {
	      if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
	    }
	    function F() {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	    }
	    function W(t, e) {
	      var n,
	        r = Object.keys(t);
	      return Object.getOwnPropertySymbols && (n = Object.getOwnPropertySymbols(t), e && (n = n.filter(function (e) {
	        return Object.getOwnPropertyDescriptor(t, e).enumerable;
	      })), r.push.apply(r, n)), r;
	    }
	    function _(t) {
	      for (var e = 1; e < arguments.length; e++) {
	        var n = null != arguments[e] ? arguments[e] : {};
	        e % 2 ? W(Object(n), !0).forEach(function (e) {
	          O(t, e, n[e]);
	        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : W(Object(n)).forEach(function (e) {
	          Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e));
	        });
	      }
	      return t;
	    }
	    function j(e, t) {
	      if (null == e) return {};
	      var n,
	        r = ((e, t) => {
	          if (null == e) return {};
	          var n,
	            r = {};
	          for (n in e) if ({}.hasOwnProperty.call(e, n)) {
	            if (t.includes(n)) continue;
	            r[n] = e[n];
	          }
	          return r;
	        })(e, t);
	      if (Object.getOwnPropertySymbols) for (var o = Object.getOwnPropertySymbols(e), c = 0; c < o.length; c++) n = o[c], t.includes(n) || {}.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
	      return r;
	    }
	    function V(e, t) {
	      if (t && ("object" == typeof t || "function" == typeof t)) return t;
	      if (void 0 !== t) throw new TypeError("Derived constructors may only return object or undefined");
	      t = e;
	      if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	      return t;
	    }
	    function K(e, t) {
	      return (K = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (e, t) {
	        return e.__proto__ = t, e;
	      })(e, t);
	    }
	    function x(e, t) {
	      return q(e) || ((e, t) => {
	        var n = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
	        if (null != n) {
	          var r,
	            o,
	            c,
	            i,
	            a = [],
	            u = !0,
	            l = !1;
	          try {
	            if (c = (n = n.call(e)).next, 0 === t) {
	              if (Object(n) !== n) return;
	              u = !1;
	            } else for (; !(u = (r = c.call(n)).done) && (a.push(r.value), a.length !== t); u = !0);
	          } catch (e) {
	            l = !0, o = e;
	          } finally {
	            try {
	              if (!u && null != n.return && (i = n.return(), Object(i) !== i)) return;
	            } finally {
	              if (l) throw o;
	            }
	          }
	          return a;
	        }
	      })(e, t) || G(e, t) || F();
	    }
	    function H(e) {
	      return q(e) || M(e) || G(e) || F();
	    }
	    function z(e) {
	      return (e => {
	        if (Array.isArray(e)) return U(e);
	      })(e) || M(e) || G(e) || (() => {
	        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	      })();
	    }
	    function X(e) {
	      e = ((e, t) => {
	        if ("object" != typeof e || !e) return e;
	        var n = e[Symbol.toPrimitive];
	        if (void 0 === n) return ("string" === t ? String : Number)(e);
	        if ("object" != typeof (n = n.call(e, t || "default"))) return n;
	        throw new TypeError("@@toPrimitive must return a primitive value.");
	      })(e, "string");
	      return "symbol" == typeof e ? e : e + "";
	    }
	    function G(e, t) {
	      var n;
	      if (e) return "string" == typeof e ? U(e, t) : "Map" === (n = "Object" === (n = {}.toString.call(e).slice(8, -1)) && e.constructor ? e.constructor.name : n) || "Set" === n ? Array.from(e) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? U(e, t) : void 0;
	    }
	    s = s && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s, n = n && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n, c = c && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c, f = f && Object.prototype.hasOwnProperty.call(f, "default") ? f.default : f, p = p && Object.prototype.hasOwnProperty.call(p, "default") ? p.default : p, r = r && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r, t = t && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t, d = d && Object.prototype.hasOwnProperty.call(d, "default") ? d.default : d, h = h && Object.prototype.hasOwnProperty.call(h, "default") ? h.default : h, v = v && Object.prototype.hasOwnProperty.call(v, "default") ? v.default : v, y = y && Object.prototype.hasOwnProperty.call(y, "default") ? y.default : y, m = m && Object.prototype.hasOwnProperty.call(m, "default") ? m.default : m, b = b && Object.prototype.hasOwnProperty.call(b, "default") ? b.default : b, g = g && Object.prototype.hasOwnProperty.call(g, "default") ? g.default : g;
	    function Y() {
	      var e, t, n;
	      return s(a.useContext) ? a.useContext(Z) || (t = (e = x(a.useState(ce.currentContextValue), 2))[0], n = e[1], a.useEffect(function () {
	        var e = o(n);
	        return A.on("update", e), function () {
	          return A.off("update", e);
	        };
	      }, []), t) : {};
	    }
	    function J(e) {
	      var t = e.children,
	        e = j(e, ae);
	      return w.createElement(ee, P({}, e, {
	        _nk: "".concat(ue, "11")
	      }), w.createElement(ce, P({}, e, {
	        _nk: "".concat(ue, "21")
	      }), t));
	    }
	    function Q(e) {
	      var t = e.children;
	      return w.createElement(te, {
	        _nk: "".concat(ue, "31")
	      }, function (e) {
	        return e ? l(t, void 0, e) : w.createElement(ie, {
	          _nk: "".concat(ue, "41")
	        }, t);
	      });
	    }
	    var Z = n(),
	      ee = Z.Provider,
	      te = Z.Consumer,
	      ne = n(),
	      re = ne.Provider,
	      oe = ne.Consumer,
	      A = new c(),
	      ce = (() => {
	        function n(e) {
	          var t;
	          return S(this, n), t = k(this, n, [e]), n.currentContextValue = e.value, t;
	        }
	        return C(n, a.Component), E(n, [{
	          key: "shouldComponentUpdate",
	          value: function (e) {
	            return e.value !== this.props.value && (n.currentContextValue = e.value, A.emit("update", e.value)), e.children !== this.props.children || e.value !== this.props.value;
	          }
	        }, {
	          key: "render",
	          value: function () {
	            return this.props.children;
	          }
	        }]);
	      })(),
	      ie = (O(ce, "eventBus", A), O(ce, "currentContextValue", void 0), (() => {
	        function n(e) {
	          var t;
	          return S(this, n), O(t = k(this, n, [e]), "state", {
	            context: ce.currentContextValue
	          }), O(t, "updateListener", o(function (e) {
	            t.setState({
	              context: e
	            });
	          })), A.on("update", t.updateListener), t;
	        }
	        return C(n, a.PureComponent), E(n, [{
	          key: "componentWillUnmount",
	          value: function () {
	            A.off("update", this.updateListener);
	          }
	        }, {
	          key: "render",
	          value: function () {
	            var e = this.props.children,
	              t = this.state.context;
	            return l(e, void 0, t);
	          }
	        }]);
	      })()),
	      ae = ["children"],
	      ue = "qj9A",
	      le = (() => {
	        function o() {
	          var e;
	          S(this, o);
	          for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++) n[r] = arguments[r];
	          return O(e = k(this, o, [].concat(n)), "promiseCache", {}), e;
	        }
	        return C(o, a.Component), E(o, [{
	          key: "render",
	          value: function () {
	            var e = this.props,
	              t = e.freeze,
	              e = e.children,
	              n = this.promiseCache;
	            if (t && !n.promise) throw n.promise = new Promise(function (e) {
	              n.resolve = e;
	            }), n.promise;
	            if (t) throw n.promise;
	            return n.promise && (n.resolve(), n.promise = void 0), w.createElement(a.Fragment, null, e);
	          }
	        }]);
	      })();
	    function se() {
	      try {
	        for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
	        t.forEach(function (e) {
	          var e = H(e),
	            t = e[0];
	          e.slice(1).forEach(function (e) {
	            var o;
	            s(u(t, e)) && !u(t, [e, "_overridden"]) && (o = t[e].bind(t), t[e] = function (e) {
	              p(e) || ye(e);
	              for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	              return o.apply(void 0, [e].concat(n));
	            }, t[e]._overridden = !0);
	          });
	        });
	      } catch (e) {
	        console.warn("activation override failed:", e);
	      }
	    }
	    function fe(e) {
	      return e = e.children, l(e);
	    }
	    var pe = [],
	      de = new Map(),
	      he = new c(),
	      ve = t(function (n) {
	        r(n) && ![Z, ne].includes(n) && (r(n.Consumer) || (n.Consumer = function (e) {
	          var e = e.children,
	            t = l(a.useContext, void 0, n);
	          return w.createElement(a.Fragment, null, l(e, void 0, t));
	        }), pe.push(n), setTimeout(function () {
	          return he.emit("update");
	        }));
	      }),
	      ye = t(function (e) {
	        e = u(e, "_context") || u(e, "context");
	        u(e, "$$typeof") === u(Z, "$$typeof") && ve(e);
	      }),
	      me = (se([w, "createElement"]), (() => {
	        function o(e) {
	          S(this, o), O(t = k(this, o, [e]), "unmount", null);
	          var t,
	            n,
	            e = e.value;
	          return 0 === e.length ? (t.state = {
	            ctxValue: null
	          }, V(t)) : ((e = x(e, 1)[0]).ctx, n = e.onUpdate, t.state = {
	            ctxValue: e.value
	          }, t.unmount = n(function (e) {
	            t.setState({
	              ctxValue: e
	            });
	          }), t);
	        }
	        return C(o, a.PureComponent), E(o, [{
	          key: "componentWillUnmount",
	          value: function () {
	            l(this.unmount);
	          }
	        }, {
	          key: "render",
	          value: function () {
	            var e,
	              t,
	              n = this.props,
	              r = n.value,
	              n = n.children,
	              r = r.filter(Boolean);
	            return 0 === r.length ? n : (e = this.state.ctxValue, t = (r = H(r))[0].ctx, r = r.slice(1), t = t.Provider, t = d(e) ? n : w.createElement(t, {
	              value: e,
	              _nk: "".concat("lqEk", "11")
	            }, n), 0 < r.length ? w.createElement(o, {
	              value: r,
	              _nk: "".concat("lqEk", "21")
	            }, t) : t);
	          }
	        }]);
	      })()),
	      be = (() => {
	        function o(e) {
	          S(this, o), O(t = k(this, o, [e]), "updateListener", null), O(t, "ctxInfo", null);
	          var t,
	            n = e.value,
	            r = e.ctx,
	            e = e.id;
	          return d(n) ? V(t) : (t.updateListener = u(de.get(r), e, new Map()), l(t.updateListener, "forEach", function (e) {
	            return e(n);
	          }), t.ctxInfo = {
	            ctx: r,
	            value: n,
	            onUpdate: function (e) {
	              return t.updateListener.set(e, e), function () {
	                return t.updateListener.delete(e);
	              };
	            }
	          }, t);
	        }
	        return C(o, a.Component), E(o, [{
	          key: "componentWillUnmount",
	          value: function () {
	            var e = this.props,
	              t = e.value,
	              n = e.ctx,
	              e = e.id;
	            d(t) || de.set(n, _(_({}, u(de.get(n), void 0, {})), {}, O({}, e, this.updateListener)));
	          }
	        }, {
	          key: "shouldComponentUpdate",
	          value: function (e) {
	            var t = e.value;
	            return this.props.value !== t && l(this.updateListener, "forEach", function (e) {
	              return e(t);
	            }), !0;
	          }
	        }, {
	          key: "render",
	          value: function () {
	            var t = this,
	              e = this.props,
	              n = e.value,
	              r = e.renderWrapper,
	              o = e.renderContent;
	            return r(function (e) {
	              return o(d(n) ? e : [].concat(z(e), [t.ctxInfo]));
	            });
	          }
	        }]);
	      })(),
	      ge = {},
	      we = (() => {
	        function n(e) {
	          S(this, n), O(t = k(this, n, [e]), "renderWrapper", function (e) {
	            var o = t.props.id;
	            return ge[o].reduce(function (n, r) {
	              var e = r.Consumer;
	              return function (t) {
	                return w.createElement(e, {
	                  _nk: "".concat("SsUr", "11")
	                }, function (e) {
	                  return w.createElement(be, {
	                    value: e,
	                    ctx: r,
	                    renderWrapper: n,
	                    renderContent: t,
	                    id: o,
	                    _nk: "".concat("SsUr", "21")
	                  });
	                });
	              };
	            }, function (e) {
	              return e([]);
	            })(e);
	          });
	          var t,
	            e = e.id;
	          return ge[e] || (ge[e] = z(pe).filter(function (e) {
	            return r(e.Consumer);
	          })), t;
	        }
	        return C(n, a.PureComponent), E(n, [{
	          key: "render",
	          value: function () {
	            var e = this.props.children;
	            return this.renderWrapper(e);
	          }
	        }]);
	      })(),
	      ke = "46lG",
	      t = s(a.lazy) && !d(a.Suspense),
	      Se = t ? a.lazy(function () {
	        return new Promise(function () {
	          return null;
	        });
	      }) : function () {
	        return null;
	      },
	      Ee = (() => {
	        function e() {
	          return S(this, e), k(this, e, arguments);
	        }
	        return C(e, a.Component), E(e, [{
	          key: "componentDidMount",
	          value: function () {
	            l(this.props, "onStart");
	          }
	        }, {
	          key: "componentWillUnmount",
	          value: function () {
	            l(this.props, "onEnd");
	          }
	        }, {
	          key: "render",
	          value: function () {
	            return null;
	          }
	        }]);
	      })();
	    var Oe = t ? (() => {
	        function o() {
	          var e;
	          S(this, o);
	          for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++) n[r] = arguments[r];
	          return O(e = k(this, o, [].concat(n)), "state", {
	            suspense: !1
	          }), O(e, "onSuspenseStart", function () {
	            e.setState({
	              suspense: !0
	            });
	          }), O(e, "onSuspenseEnd", function () {
	            e.setState({
	              suspense: !1
	            });
	          }), O(e, "sus$$", {
	            onSuspenseStart: e.onSuspenseStart,
	            onSuspenseEnd: e.onSuspenseEnd
	          }), e;
	        }
	        return C(o, a.Component), E(o, [{
	          key: "render",
	          value: function () {
	            var e = this.props.children;
	            return w.createElement(a.Fragment, null, l(e, void 0, this.sus$$), this.state.suspense && w.createElement(Se, {
	              _nk: "".concat(ke, "31")
	            }));
	          }
	        }]);
	      })() : fe,
	      Pe = t ? function (e) {
	        var t = e.children,
	          e = e.sus$$;
	        return w.createElement(a.Suspense, {
	          fallback: w.createElement(Ee, {
	            onStart: e.onSuspenseStart,
	            onEnd: e.onSuspenseEnd,
	            _nk: "".concat(ke, "21")
	          }),
	          _nk: "".concat(ke, "11")
	        }, t);
	      } : fe,
	      Ce = (() => {
	        function e() {
	          return S(this, e), k(this, e, arguments);
	        }
	        return C(e, a.Component), E(e, [{
	          key: "componentDidCatch",
	          value: function (e) {
	            var t = this.props.error$$;
	            l(t, void 0, e, function () {
	              l(t, void 0, null);
	            });
	          }
	        }, {
	          key: "render",
	          value: function () {
	            return this.props.children;
	          }
	        }]);
	      })(),
	      _e = (O(Ce, "getDerivedStateFromError", function () {
	        return null;
	      }), (() => {
	        function o() {
	          var n;
	          S(this, o);
	          for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++) t[r] = arguments[r];
	          return O(n = k(this, o, [].concat(t)), "state", {
	            error: null
	          }), O(n, "throwError", function (e, t) {
	            return n.setState({
	              error: e
	            }, t);
	          }), n;
	        }
	        return C(o, a.Component), E(o, [{
	          key: "render",
	          value: function () {
	            if (this.state.error) throw this.state.error;
	            return l(this.props.children, void 0, this.throwError);
	          }
	        }]);
	      })()),
	      N = "lajT";
	    function je(e) {
	      var t = e.id,
	        n = e.children,
	        e = e.bridgeProps,
	        r = e.sus$$,
	        o = e.ctx$$;
	      return w.createElement(Ce, {
	        error$$: e.error$$,
	        _nk: "".concat(N, "11")
	      }, w.createElement(Pe, {
	        sus$$: r,
	        _nk: "".concat(N, "21")
	      }, w.createElement(me, {
	        id: t,
	        value: o,
	        _nk: "".concat(N, "31")
	      }, n)));
	    }
	    function xe(e) {
	      var r = e.id,
	        o = e.children;
	      return w.createElement(_e, {
	        _nk: "".concat(N, "41")
	      }, function (n) {
	        return w.createElement(Oe, {
	          _nk: "".concat(N, "51")
	        }, function (t) {
	          return w.createElement(we, {
	            id: r,
	            _nk: "".concat(N, "61")
	          }, function (e) {
	            return l(o, void 0, {
	              bridgeProps: {
	                sus$$: t,
	                ctx$$: e,
	                error$$: n
	              }
	            });
	          });
	        });
	      });
	    }
	    function ze(c) {
	      var n = (() => {
	        function o() {
	          var e;
	          S(this, o);
	          for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++) n[r] = arguments[r];
	          return O(e = k(this, o, [].concat(n)), "drop", null), e;
	        }
	        return C(o, a.Component), E(o, [{
	          key: "componentWillUnmount",
	          value: function () {
	            l(this.drop);
	          }
	        }, {
	          key: "render",
	          value: function () {
	            var n = this,
	              e = this.props,
	              r = e.forwardedRef,
	              t = j(e, Ne);
	            return w.createElement(oe, {
	              _nk: "".concat(Ie, "11")
	            }, function () {
	              var e = (0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {}).attach;
	              return w.createElement(c, P({
	                ref: function (t) {
	                  [I, B].every(function (e) {
	                    return !s(u(t, e));
	                  }) || (n.drop = l(e, void 0, t), d(r)) || (h(r) && "current" in r ? r.current = t : l(r, void 0, t));
	                }
	              }, t, {
	                _nk: "".concat(Ie, "21")
	              }));
	            });
	          }
	        }]);
	      })();
	      return s(c.prototype.componentDidMount) && (c.prototype._componentDidMount = c.prototype.componentDidMount, c.prototype.componentDidMount = function () {
	        var e = this;
	        f(function () {
	          return c.prototype._componentDidMount.call(e);
	        });
	      }), s(a.forwardRef) ? v(a.forwardRef(function (e, t) {
	        return w.createElement(n, P({}, e, {
	          forwardedRef: t,
	          _nk: "".concat(Ie, "31")
	        }));
	      }), c) : v(n, c);
	    }
	    function Ae(e, t) {
	      var n, r;
	      [a.useRef, a.useContext, a.useEffect].some(function (e) {
	        return !s(e);
	      }) || (r = a.useContext(ne)) && (n = a.useRef({}).current, r = r.attach, n[e] = t, n.drop = r(n), a.useEffect(function () {
	        return function () {
	          return l(n.drop);
	        };
	      }, []));
	    }
	    var Ne = ["forwardedRef"],
	      Ie = "XKTv",
	      I = "componentDidActivate",
	      B = "componentWillUnactivate",
	      t = Ae.bind(null, I),
	      Be = Ae.bind(null, B),
	      $e = ["id", "autoFreeze", "contentProps"],
	      Te = "bNyU",
	      Ue = a.Suspense ? function (e) {
	        var t = e.freeze,
	          n = e.children,
	          e = e.placeholder;
	        return w.createElement(a.Suspense, {
	          fallback: void 0 === e ? null : e,
	          _nk: "".concat("Leb+", "11")
	        }, w.createElement(le, {
	          freeze: t,
	          _nk: "".concat("Leb+", "21")
	        }, n));
	      } : function (e) {
	        return e.children;
	      },
	      qe = (() => {
	        function o(e) {
	          var a;
	          S(this, o);
	          for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	          return O(a = k(this, o, [e].concat(n)), "eventBus", new c()), O(a, "listeners", new Map()), O(a, "wrapper", null), O(a, "cache", void 0), O(a, "unmounted", !1), O(a, "safeSetState", function (e, t) {
	            a.unmounted || a.setState(e, t);
	          }), O(a, "freezeTimeout", null), O(a, "attach", function (n) {
	            var e = a.listeners;
	            return n ? (n.isKeepAlive && f(function () {
	              var e = a.props,
	                t = e.id,
	                e = e.store.get(t);
	              e.aliveNodesId = new Set([].concat(z(e.aliveNodesId), [n.id]));
	            }), e.set(n, O(O({}, I, function () {
	              return l(n, I);
	            }), B, function () {
	              return l(n, B);
	            })), function () {
	              e.delete(n);
	            }) : function () {
	              return null;
	            };
	          }), O(a, "contextValue", {
	            id: a.props.id,
	            attach: a.attach
	          }), O(a, "drop", function () {
	            var e = (0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {}).delay,
	              i = void 0 === e ? 1200 : e;
	            return new Promise(function (e) {
	              var t,
	                n = a.props,
	                r = n.scope,
	                o = n.id,
	                c = function () {
	                  clearTimeout(t), a.eventBus.off(B, c), a.cache.willDrop = !0, r.nodes.delete(o), r.helpers = _({}, r.helpers), r.smartForceUpdate(function () {
	                    return e(!0);
	                  });
	                };
	              u(a.cache, "cached") || u(a.cache, "willDrop") ? c() : (a.eventBus.on(B, c), t = setTimeout(function () {
	                a.eventBus.off(B, c), e(!1);
	              }, i));
	            });
	          }), O(a, "refresh", function () {
	            return new Promise(function (e) {
	              u(a.cache, "cached") && e(!1), a.safeSetState({
	                key: Math.random()
	              }, function () {
	                return e(!0);
	              });
	            });
	          }), a.state = {
	            children: e.children,
	            bridgeProps: e.bridgeProps,
	            key: Math.random(),
	            freeze: !1
	          }, a;
	        }
	        return C(o, a.PureComponent), E(o, [{
	          key: "componentDidMount",
	          value: function () {
	            var t,
	              e = this,
	              n = this.props,
	              r = n.store,
	              n = n.id,
	              o = this.listeners,
	              c = this.wrapper;
	            if (!r.has(n)) {
	              try {
	                t = z(c.children);
	              } catch (e) {
	                t = [c.children];
	              }
	              this.cache = O(O({
	                listeners: o,
	                aliveNodesId: [],
	                inited: !1,
	                cached: !1,
	                wrapper: c,
	                nodes: t
	              }, I, function () {
	                return e[I]();
	              }), B, function () {
	                return e[B]();
	              }), r.set(n, this.cache);
	            }
	          }
	        }, {
	          key: "componentWillUnmount",
	          value: function () {
	            var e = this.props,
	              t = e.store,
	              n = e.keepers,
	              e = e.id;
	            try {
	              var r = t.get(e);
	              r.nodes.forEach(function (e) {
	                r.wrapper.appendChild(e);
	              });
	            } catch (e) {}
	            t.delete(e), n.delete(e), this.unmounted = !0;
	          }
	        }, {
	          key: I,
	          value: function () {
	            clearTimeout(this.freezeTimeout), this.safeSetState({
	              freeze: !1
	            }), this.eventBus.emit(I), this.listeners.forEach(function (e) {
	              return l(e, [I]);
	            });
	          }
	        }, {
	          key: B,
	          value: function () {
	            var e = this;
	            this.eventBus.emit(B), z(this.listeners).reverse().forEach(function (e) {
	              e = x(e, 2)[1];
	              return l(e, [B]);
	            }), clearTimeout(this.freezeTimeout), this.freezeTimeout = setTimeout(function () {
	              T.flushSync(function () {
	                e.safeSetState({
	                  freeze: !0
	                });
	              });
	            }, 1e3);
	          }
	        }, {
	          key: "render",
	          value: function () {
	            var t = this,
	              e = this.props,
	              n = e.id,
	              r = e.autoFreeze,
	              r = void 0 === r || r,
	              o = e.contentProps,
	              o = void 0 === o ? {} : o,
	              e = (j(e, $e), this.state),
	              c = e.children,
	              i = e.bridgeProps,
	              a = e.key;
	            return w.createElement(Ue, {
	              freeze: r && e.freeze,
	              _nk: "".concat(Te, "11")
	            }, w.createElement("div", {
	              ref: function (e) {
	                t.wrapper = e;
	              },
	              _nk: "".concat(Te, "21")
	            }, w.createElement("div", P({}, o, {
	              key: "keeper-container",
	              className: "ka-content ".concat(o.className || "")
	            }), w.createElement(je, {
	              id: n,
	              bridgeProps: i,
	              _nk: "".concat(Te, "31")
	            }, w.createElement(re, {
	              value: this.contextValue,
	              _nk: "".concat(Te, "41")
	            }, w.Children.map(c, function (e, t) {
	              return w.cloneElement(e, {
	                key: "".concat(e.key || "", ":").concat(a, ":").concat(t)
	              });
	            }))))));
	          }
	        }]);
	      })(),
	      De = ["children"],
	      Re = "UVSV",
	      Le = "drop",
	      Me = "refresh",
	      Fe = (() => {
	        function r() {
	          var a;
	          S(this, r);
	          for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
	          return O(a = k(this, r, [].concat(t)), "store", new Map()), O(a, "nodes", new Map()), O(a, "keepers", new Map()), O(a, "debouncedForceUpdate", o(function (e) {
	            return a.forceUpdate(e);
	          })), O(a, "updateCallbackList", []), O(a, "smartForceUpdate", function (e) {
	            a.updateCallbackList.push(e), a.debouncedForceUpdate(function () {
	              a.updateCallbackList.forEach(function (e) {
	                return l(e);
	              }), a.updateCallbackList = [];
	            });
	          }), O(a, "update", function (c, i) {
	            return new Promise(function (e) {
	              var t = a.keepers.get(c),
	                n = !t,
	                r = Date.now(),
	                o = a.nodes.get(c) || null;
	              a.nodes.set(c, _(_({
	                id: c,
	                createTime: r,
	                updateTime: r
	              }, o), i)), n ? (a.helpers = _({}, a.helpers), a.forceUpdate(e)) : (r = i.children, t.setState({
	                children: r,
	                bridgeProps: i.bridgeProps
	              }, e));
	            });
	          }), O(a, "keep", function (t, n) {
	            return new Promise(function (e) {
	              a.update(t, _({
	                id: t
	              }, n)).then(function () {
	                e(a.store.get(t));
	              });
	            });
	          }), O(a, "getCachingNodesByName", function (t) {
	            return a.getCachingNodes().filter(function (e) {
	              return t instanceof RegExp ? t.test(e.name) : e.name === t;
	            });
	          }), O(a, "getScopeIds", function (e) {
	            var n = function (e) {
	              var t = u(a.getCache(e), "aliveNodesId", []);
	              return 0 < t.size ? [e, z(t).map(n)] : [e].concat(z(t));
	            };
	            return i(e.map(function (e) {
	              return n(e);
	            }));
	          }), O(a, "dropById", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.handleNodes.apply(a, [[e], Le].concat(n));
	          }), O(a, "dropScopeByIds", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.handleNodes.apply(a, [a.getScopeIds(e), Le].concat(n));
	          }), O(a, "drop", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.handleNodes.apply(a, [a.getCachingNodesByName(e).map(function (e) {
	              return e.id;
	            }), Le].concat(n));
	          }), O(a, "dropScope", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.dropScopeByIds.apply(a, [a.getCachingNodesByName(e).map(function (e) {
	              return e.id;
	            })].concat(n));
	          }), O(a, "refreshById", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.handleNodes.apply(a, [[e], Me].concat(n));
	          }), O(a, "refreshScopeByIds", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.handleNodes.apply(a, [a.getScopeIds(e), Me].concat(n));
	          }), O(a, "refresh", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.handleNodes.apply(a, [a.getCachingNodesByName(e).map(function (e) {
	              return e.id;
	            }), Me].concat(n));
	          }), O(a, "refreshScope", function (e) {
	            for (var t = arguments.length, n = new Array(1 < t ? t - 1 : 0), r = 1; r < t; r++) n[r - 1] = arguments[r];
	            return a.refreshScopeByIds.apply(a, [a.getCachingNodesByName(e).map(function (e) {
	              return e.id;
	            })].concat(n));
	          }), O(a, "handleNodes", function (e) {
	            for (var r = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : Le, t = arguments.length, o = new Array(2 < t ? t - 2 : 0), n = 2; n < t; n++) o[n - 2] = arguments[n];
	            return new Promise(function (t) {
	              var n = [];
	              e.forEach(function (e) {
	                a.store.get(e) && (e = a.keepers.get(e), n.push(e));
	              }), 0 === n.length ? t(!1) : Promise.all(n.map(function (e) {
	                return l.apply(void 0, [e, r].concat(o));
	              })).then(function (e) {
	                return t(e.every(Boolean));
	              });
	            });
	          }), O(a, "clear", function () {
	            for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
	            return a.handleNodes.apply(a, [a.getCachingNodes().map(function (e) {
	              return e.id;
	            }), Le].concat(t));
	          }), O(a, "getCache", function (e) {
	            return a.store.get(e);
	          }), O(a, "getNode", function (e) {
	            return a.nodes.get(e);
	          }), O(a, "getCachingNodes", function () {
	            return z(a.nodes.values());
	          }), O(a, "helpers", {
	            keep: a.keep,
	            update: a.update,
	            drop: a.drop,
	            dropScope: a.dropScope,
	            dropById: a.dropById,
	            dropScopeByIds: a.dropScopeByIds,
	            refresh: a.refresh,
	            refreshScope: a.refreshScope,
	            refreshById: a.refreshById,
	            refreshScopeByIds: a.refreshScopeByIds,
	            getScopeIds: a.getScopeIds,
	            clear: a.clear,
	            getCache: a.getCache,
	            getNode: a.getNode,
	            getCachingNodes: a.getCachingNodes
	          }), a;
	        }
	        return C(r, a.Component), E(r, [{
	          key: "render",
	          value: function () {
	            var r = this,
	              e = this.props.children,
	              e = void 0 === e ? null : e;
	            return w.createElement(J, {
	              value: this.helpers,
	              _nk: "".concat(Re, "11")
	            }, e, w.createElement("div", {
	              style: {
	                display: "none"
	              },
	              _nk: "".concat(Re, "21")
	            }, z(this.nodes.values()).map(function (e) {
	              var t = e.children,
	                n = j(e, De);
	              return w.createElement(qe, P({
	                key: n.id
	              }, n, {
	                scope: r,
	                store: r.store,
	                keepers: r.keepers,
	                ref: function (e) {
	                  r.keepers.set(n.id, e);
	                },
	                _nk: "iAr".concat(Re, "31")
	              }), t);
	            })));
	          }
	        }]);
	      })(),
	      We = ["id"],
	      Ve = ["id"],
	      Ke = ["forwardedRef"],
	      He = ["forwardedRef"],
	      $ = "X7Aa";
	    function Xe(e) {
	      return {
	        drop: e.drop,
	        dropScope: e.dropScope,
	        refresh: e.refresh,
	        refreshScope: e.refreshScope,
	        clear: e.clear,
	        getCachingNodes: e.getCachingNodes
	      };
	    }
	    function Ge() {
	      var e = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {};
	      return !!r(e) && (e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight);
	    }
	    function Ye(e) {
	      return s(u(b, "document.querySelectorAll")) ? [].concat(z(y(l(e, "querySelectorAll", "*"), [])), [e]).filter(Ge) : [];
	    }
	    var Je = ["_helpers", "id", "children"],
	      Qe = ["_helpers", "id", "name"],
	      Ze = u(b, "document.body"),
	      et = u(b, "document.scrollingElement", u(b, "document.documentElement", {})),
	      tt = (() => {
	        function t(e) {
	          var c;
	          return S(this, t), O(c = k(this, t, [e]), "id", null), O(c, "isKeepAlive", !0), O(c, "cached", !1), O(c, "inject", function () {
	            var e = !(0 < arguments.length && void 0 !== arguments[0]) || arguments[0],
	              t = c.props,
	              n = t.id,
	              r = t.saveScrollPosition,
	              t = t._helpers.getCache(n);
	            try {
	              t.nodes.forEach(function (e) {
	                c.placeholder.appendChild(e);
	              }), e && r && l(t.revertScrollPos);
	            } catch (e) {}
	          }), O(c, "eject", function () {
	            var e,
	              t = !(0 < arguments.length && void 0 !== arguments[0]) || arguments[0],
	              n = c.props,
	              r = n.id,
	              o = n._helpers.getCache(r),
	              n = i(i([c.props.saveScrollPosition]).map(function (e) {
	                return !0 === e ? o.nodes : "screen" === e ? [et, Ze] : z(y(l(b, "document.querySelectorAll", e), []));
	              })).filter(Boolean);
	            try {
	              t && 0 < n.length && (o.revertScrollPos = (e = z(new Set(z(i(n.map(Ye))))).map(function (e) {
	                return [e, {
	                  x: e.scrollLeft,
	                  y: e.scrollTop
	                }];
	              }), function () {
	                e.forEach(function (e) {
	                  var e = x(e, 2),
	                    t = e[0],
	                    e = e[1],
	                    n = e.x,
	                    e = e.y;
	                  t.scrollLeft = n, t.scrollTop = e;
	                });
	              })), o.nodes.forEach(function (e) {
	                t ? c.placeholder.removeChild(e) : o.wrapper.appendChild(e);
	              });
	            } catch (e) {}
	          }), O(c, "init", function () {
	            var e = c.props,
	              t = e._helpers,
	              n = e.id,
	              r = e.children,
	              e = j(e, Je);
	            t.keep(n, _({
	              children: r,
	              getInstance: function () {
	                return c;
	              }
	            }, e)).then(function (e) {
	              e && (c.inject(), e.inited ? l(c, I) : e.inited = !0, c.cached = !1);
	            });
	          }), O(c, "update", function () {
	            var e = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
	              t = e._helpers,
	              n = e.id,
	              r = e.name,
	              e = j(e, Qe);
	            t && !c.cached && t.update(n, _({
	              name: r,
	              getInstance: function () {
	                return c;
	              }
	            }, e));
	          }), c.id = e.id, c.init(), [I, B].forEach(function (r) {
	            c[r] = function () {
	              var e = c.props,
	                t = e.id,
	                e = e._helpers,
	                n = e.getCache(t),
	                e = e.getNode(t),
	                t = (e && r === I && (e.updateTime = Date.now()), r === B);
	              !n || n.willDrop ? c.cached && !t && c.init() : (l(n, r), n.cached = t, c.cached = t);
	            };
	          }), c;
	        }
	        return C(t, a.Component), E(t, [{
	          key: "shouldComponentUpdate",
	          value: function (e) {
	            return this.update(e), !1;
	          }
	        }, {
	          key: "componentWillUnmount",
	          value: function () {
	            var e = this.props,
	              t = e.id,
	              n = e._helpers,
	              e = e.when,
	              e = void 0 === e || e,
	              r = n.getCache(t);
	            e = l(e);
	            var e = x(m(e) ? e : [e], 2),
	              o = e[0],
	              e = e[1];
	            r && (this.eject(), delete r.getInstance, o || (e ? ([r].concat(z(n.getScopeIds([t]).map(function (e) {
	              return n.getCache(e);
	            }))).filter(Boolean).forEach(function (e) {
	              e.willDrop = !0;
	            }), f(function () {
	              return n.dropScopeByIds([t]);
	            })) : (r.willDrop = !0, f(function () {
	              return n.dropById(t);
	            }))), l(this, B));
	          }
	        }, {
	          key: "render",
	          value: function () {
	            var t = this,
	              e = (this.props || {}).wrapperProps,
	              e = void 0 === e ? {} : e;
	            return w.createElement("div", P({}, e, {
	              key: "keep-alive-placeholder",
	              className: "ka-wrapper ".concat(e.className || ""),
	              ref: function (e) {
	                t.placeholder = e;
	              }
	            }));
	          }
	        }]);
	      })();
	    O(tt, "defaultProps", {
	      saveScrollPosition: !0
	    });
	    var nt,
	      tt = s(u(b, "document.getElementById")) ? (nt = ze(tt), s(a.useContext) ? function (e) {
	        var t = e.id,
	          e = j(e, We);
	        return rt({
	          idPrefix: t,
	          helpers: Y(),
	          props: e
	        });
	      } : function (e) {
	        var t = e.id,
	          n = j(e, Ve);
	        return w.createElement(Q, {
	          _nk: "".concat($, "41")
	        }, function (e) {
	          return rt({
	            idPrefix: t,
	            helpers: e,
	            props: n
	          });
	        });
	      }) : function (e) {
	        var e = e.children,
	          t = this.props || {},
	          n = void 0 === (n = t.wrapperProps) ? {} : n,
	          t = void 0 === (t = t.contentProps) ? {} : t;
	        return w.createElement("div", P({}, n, {
	          key: "keep-alive-placeholder",
	          className: "ka-wrapper ".concat(n.className || "")
	        }), w.createElement("div", P({}, t, {
	          key: "keeper-container",
	          className: "ka-content ".concat(t.className || "")
	        }), e));
	      };
	    function rt(e) {
	      var t = e.idPrefix,
	        n = e.helpers,
	        r = e.props;
	      return (e = d(n)) && console.error("You should not use <KeepAlive /> outside a <AliveScope>"), e ? u(r, "children", null) : w.createElement(g, {
	        prefix: t,
	        key: r._nk,
	        manualKey: r.cacheKey,
	        _nk: "".concat($, "11")
	      }, function (e) {
	        var t = r.cacheKey || e;
	        return w.createElement(xe, {
	          key: t,
	          id: t,
	          _nk: "".concat($, "21")
	        }, function (e) {
	          return w.createElement(nt, P({
	            key: t
	          }, r, e, {
	            id: t,
	            _helpers: n,
	            _nk: "".concat($, "31")
	          }));
	        });
	      });
	    }
	    e.AliveScope = Fe, e.KeepAlive = tt, e.NodeKey = g, e.autoFixContext = se, e.createContext = function (e, t) {
	      e = n(e, t);
	      return ve(e), e;
	    }, e.default = tt, e.fixContext = ve, e.useActivate = t, e.useAliveController = function () {
	      var e;
	      return s(a.useContext) && (e = Y()) ? Xe(e) : {};
	    }, e.useUnactivate = Be, e.withActivation = ze, e.withAliveScope = function (n) {
	      function r(e) {
	        var t = e.helpers;
	        return w.createElement(n, P({}, e.props, t, {
	          ref: e.forwardedRef,
	          _nk: "".concat($, "51")
	        }));
	      }
	      var o = s(a.useContext) ? function (e) {
	        var t = e.forwardedRef,
	          e = j(e, Ke);
	        return r({
	          helpers: Xe(Y() || {}),
	          props: e,
	          forwardedRef: t
	        });
	      } : function (e) {
	        var t = e.forwardedRef,
	          n = j(e, He);
	        return w.createElement(Q, {
	          _nk: "".concat($, "42")
	        }, function () {
	          return r({
	            helpers: Xe(0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {}),
	            props: n,
	            forwardedRef: t
	          });
	        });
	      };
	      return s(a.forwardRef) ? v(a.forwardRef(function (e, t) {
	        return w.createElement(o, P({}, e, {
	          forwardedRef: t,
	          _nk: "".concat($, "61")
	        }));
	      }), n) : v(o, n);
	    }, Object.defineProperty(e, "__esModule", {
	      value: !0
	    });
	  });
	})(index_min$1, index_min$1.exports);
	var index_minExports = index_min$1.exports;

	{
	  reactActivation.exports = index_minExports;
	}
	var reactActivationExports = reactActivation.exports;

	/******************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise, SuppressedError, Symbol */

	function __rest(s, e) {
	  var t = {};
	  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
	    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	  }
	  return t;
	}
	function __awaiter(thisArg, _arguments, P, generator) {
	  function adopt(value) {
	    return value instanceof P ? value : new P(function (resolve) {
	      resolve(value);
	    });
	  }
	  return new (P || (P = Promise))(function (resolve, reject) {
	    function fulfilled(value) {
	      try {
	        step(generator.next(value));
	      } catch (e) {
	        reject(e);
	      }
	    }
	    function rejected(value) {
	      try {
	        step(generator["throw"](value));
	      } catch (e) {
	        reject(e);
	      }
	    }
	    function step(result) {
	      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
	    }
	    step((generator = generator.apply(thisArg, _arguments || [])).next());
	  });
	}
	typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
	  var e = new Error(message);
	  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
	};

	var classnames$1 = {exports: {}};

	/*!
		Copyright (c) 2018 Jed Watson.
		Licensed under the MIT License (MIT), see
		http://jedwatson.github.io/classnames
	*/
	(function (module) {
	  /* global define */

	  (function () {

	    var hasOwn = {}.hasOwnProperty;
	    function classNames() {
	      var classes = '';
	      for (var i = 0; i < arguments.length; i++) {
	        var arg = arguments[i];
	        if (arg) {
	          classes = appendClass(classes, parseValue(arg));
	        }
	      }
	      return classes;
	    }
	    function parseValue(arg) {
	      if (typeof arg === 'string' || typeof arg === 'number') {
	        return arg;
	      }
	      if (typeof arg !== 'object') {
	        return '';
	      }
	      if (Array.isArray(arg)) {
	        return classNames.apply(null, arg);
	      }
	      if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
	        return arg.toString();
	      }
	      var classes = '';
	      for (var key in arg) {
	        if (hasOwn.call(arg, key) && arg[key]) {
	          classes = appendClass(classes, key);
	        }
	      }
	      return classes;
	    }
	    function appendClass(value, newClass) {
	      if (!newClass) {
	        return value;
	      }
	      if (value) {
	        return value + ' ' + newClass;
	      }
	      return value + newClass;
	    }
	    if (module.exports) {
	      classNames.default = classNames;
	      module.exports = classNames;
	    } else {
	      window.classNames = classNames;
	    }
	  })();
	})(classnames$1);
	var classnamesExports = classnames$1.exports;
	var classnames = /*@__PURE__*/getDefaultExportFromCjs(classnamesExports);

	const useMarkDown = (path) => {
	    const [content, setContent] = React2.useState('');
	    const loadFile = React2.useCallback(() => {
	        fetch(path)
	            .then((response) => response.text())
	            .then((text) => {
	            setContent(text);
	        });
	    }, []);
	    React2.useEffect(loadFile, []);
	    return [content, setContent];
	};

	const loadFont = (name, url, timeout = 30000) => {
	    if (url) {
	        const font = new FontFace(name, `url(${url})`);
	        // @ts-ignore
	        document.fonts.add(font);
	    }
	    const startTime = performance.now();
	    let endTime;
	    return new Promise((resolve, reject) => {
	        const load = () => {
	            document.fonts
	                .load(`16px "${name}"`)
	                .then((_font) => {
	                if (_font.length)
	                    return resolve();
	                endTime = performance.now();
	                if (endTime - startTime >= timeout) {
	                    reject(`${timeout}ms timeout exceeded`);
	                }
	                else
	                    setTimeout(load, 25);
	            })
	                .catch(reject);
	        };
	        load();
	    });
	};

	function styleInject(css, ref) {
	  if (ref === void 0) ref = {};
	  var insertAt = ref.insertAt;
	  if (!css || typeof document === 'undefined') {
	    return;
	  }
	  var head = document.head || document.getElementsByTagName('head')[0];
	  var style = document.createElement('style');
	  style.type = 'text/css';
	  if (insertAt === 'top') {
	    if (head.firstChild) {
	      head.insertBefore(style, head.firstChild);
	    } else {
	      head.appendChild(style);
	    }
	  } else {
	    head.appendChild(style);
	  }
	  if (style.styleSheet) {
	    style.styleSheet.cssText = css;
	  } else {
	    style.appendChild(document.createTextNode(css));
	  }
	}

	var css_248z$1 = ".style_note-paper__abbna{align-items:center;box-shadow:0 0 1px 0 #a5a5a5;display:flex;height:350px;justify-content:center;position:absolute;text-align:center;width:400px}";
	var styles$1 = {"note-paper":"style_note-paper__abbna","notePaper":"style_note-paper__abbna"};
	styleInject(css_248z$1);

	const NotePaper = (_a) => {
	    var { className, style, paperLink, active } = _a, rest = __rest(_a, ["className", "style", "paperLink", "active"]);
	    const canvasRef = React2.useRef(null);
	    const [content] = useMarkDown(paperLink);
	    const [translate, setTranslate] = React2.useState({ x: 0, y: 0 });
	    const [loading, setLoading] = React2.useState(true);
	    const registerDragEvent = React2.useCallback((canvas, handler) => {
	        let dragging = false;
	        canvas.on('mouse:down', (e) => {
	            if (e.target === handler)
	                dragging = true;
	        });
	        canvas.on('mouse:move', (e) => {
	            if (dragging) {
	                setTranslate((pre) => ({
	                    x: pre.x + e.e.movementX,
	                    y: pre.y + e.e.movementY,
	                }));
	            }
	        });
	        canvas.on('mouse:up', (e) => {
	            dragging = false;
	        });
	    }, []);
	    const initPaperCanvas = React2.useCallback(() => __awaiter(void 0, void 0, void 0, function* () {
	        if (!content)
	            return;
	        if (!canvasRef.current)
	            return;
	        yield loadFont('handwriting');
	        const canvas = canvasRef.current;
	        const fabricCanvas = new fabric.fabric.Canvas(canvas, {
	            width: 400,
	            height: 350,
	            selection: false,
	            hoverCursor: 'default',
	        });
	        const topBar = new fabric.fabric.Rect({
	            width: fabricCanvas.getWidth(),
	            height: 60,
	            fill: 'transparent',
	            selectable: false,
	            originX: 'left',
	            originY: 'top',
	        });
	        const textbox = new fabric.fabric.Textbox(content, {
	            width: 800,
	            left: 20,
	            top: topBar.getScaledHeight() + 10,
	            lineHeight: 1.8,
	            fontSize: 14,
	            fontFamily: 'handwriting',
	            fill: '#333',
	            lockMovementX: true,
	            lockMovementY: true,
	            hasBorders: false,
	            hasControls: false,
	            selectionColor: 'rgba(132, 131, 124, 0.2)',
	        });
	        const scale = Math.min(1, (fabricCanvas.getHeight() - topBar.getScaledHeight() - 20) / textbox.getScaledHeight());
	        textbox.scale(scale);
	        fabricCanvas.add(topBar, textbox);
	        fabricCanvas.requestRenderAll();
	        registerDragEvent(fabricCanvas, topBar);
	        setLoading(false);
	    }), [content]);
	    React2.useEffect(() => {
	        initPaperCanvas();
	    }, [initPaperCanvas]);
	    return (React2.createElement("div", Object.assign({ className: classnames(styles$1.notePaper, className), style: Object.assign(Object.assign({}, style), { background: active
	                ? 'linear-gradient(to bottom, rgba(248, 232, 82, 1) 45px, rgba(250, 243, 155, 1) 60px)'
	                : 'linear-gradient(to bottom, rgba(213, 213, 213, 1) 45px, rgba(235, 235, 235, 1) 60px)', transform: `translate3d(${translate.x}px, ${translate.y}px, 0)`, filter: active ? 'drop-shadow(2px 2px 10px rgba(0, 0, 0, 0.08))' : 'unset' }) }, rest),
	        loading && React2.createElement("span", null, "loading..."),
	        React2.createElement("div", { style: { display: loading ? 'none' : 'block' } },
	            React2.createElement("canvas", { ref: canvasRef }))));
	};

	function e$1(t, e, i, n) {
	  return new (i || (i = Promise))(function (r, o) {
	    function s(t) {
	      try {
	        h(n.next(t));
	      } catch (t) {
	        o(t);
	      }
	    }
	    function a(t) {
	      try {
	        h(n.throw(t));
	      } catch (t) {
	        o(t);
	      }
	    }
	    function h(t) {
	      var e;
	      t.done ? r(t.value) : (e = t.value, e instanceof i ? e : new i(function (t) {
	        t(e);
	      })).then(s, a);
	    }
	    h((n = n.apply(t, e || [])).next());
	  });
	}
	"function" == typeof SuppressedError && SuppressedError;
	const {
	  abs: i$1,
	  cos: n$1,
	  sin: r$1,
	  acos: o$1,
	  atan2: s$1,
	  sqrt: a$1,
	  pow: h$1
	} = Math;
	function c$1(t) {
	  return t < 0 ? -h$1(-t, 1 / 3) : h$1(t, 1 / 3);
	}
	const l$1 = Math.PI,
	  u$1 = 2 * l$1,
	  p$1 = l$1 / 2,
	  g$1 = Number.MAX_SAFE_INTEGER || 9007199254740991,
	  x$1 = Number.MIN_SAFE_INTEGER || -9007199254740991,
	  f$1 = {
	    x: 0,
	    y: 0,
	    z: 0
	  },
	  y$1 = {
	    Tvalues: [-.06405689286260563, .06405689286260563, -.1911188674736163, .1911188674736163, -.3150426796961634, .3150426796961634, -.4337935076260451, .4337935076260451, -.5454214713888396, .5454214713888396, -.6480936519369755, .6480936519369755, -.7401241915785544, .7401241915785544, -.820001985973903, .820001985973903, -.8864155270044011, .8864155270044011, -.9382745520027328, .9382745520027328, -.9747285559713095, .9747285559713095, -.9951872199970213, .9951872199970213],
	    Cvalues: [.12793819534675216, .12793819534675216, .1258374563468283, .1258374563468283, .12167047292780339, .12167047292780339, .1155056680537256, .1155056680537256, .10744427011596563, .10744427011596563, .09761865210411388, .09761865210411388, .08619016153195327, .08619016153195327, .0733464814110803, .0733464814110803, .05929858491543678, .05929858491543678, .04427743881741981, .04427743881741981, .028531388628933663, .028531388628933663, .0123412297999872, .0123412297999872],
	    arcfn: function (t, e) {
	      const i = e(t);
	      let n = i.x * i.x + i.y * i.y;
	      return void 0 !== i.z && (n += i.z * i.z), a$1(n);
	    },
	    compute: function (t, e, i) {
	      if (0 === t) return e[0].t = 0, e[0];
	      const n = e.length - 1;
	      if (1 === t) return e[n].t = 1, e[n];
	      const r = 1 - t;
	      let o = e;
	      if (0 === n) return e[0].t = t, e[0];
	      if (1 === n) {
	        const e = {
	          x: r * o[0].x + t * o[1].x,
	          y: r * o[0].y + t * o[1].y,
	          t: t
	        };
	        return i && (e.z = r * o[0].z + t * o[1].z), e;
	      }
	      if (n < 4) {
	        let e,
	          s,
	          a,
	          h = r * r,
	          c = t * t,
	          l = 0;
	        2 === n ? (o = [o[0], o[1], o[2], f$1], e = h, s = r * t * 2, a = c) : 3 === n && (e = h * r, s = h * t * 3, a = r * c * 3, l = t * c);
	        const u = {
	          x: e * o[0].x + s * o[1].x + a * o[2].x + l * o[3].x,
	          y: e * o[0].y + s * o[1].y + a * o[2].y + l * o[3].y,
	          t: t
	        };
	        return i && (u.z = e * o[0].z + s * o[1].z + a * o[2].z + l * o[3].z), u;
	      }
	      const s = JSON.parse(JSON.stringify(e));
	      for (; s.length > 1;) {
	        for (let e = 0; e < s.length - 1; e++) s[e] = {
	          x: s[e].x + (s[e + 1].x - s[e].x) * t,
	          y: s[e].y + (s[e + 1].y - s[e].y) * t
	        }, void 0 !== s[e].z && (s[e].z = s[e].z + (s[e + 1].z - s[e].z) * t);
	        s.splice(s.length - 1, 1);
	      }
	      return s[0].t = t, s[0];
	    },
	    computeWithRatios: function (t, e, i, n) {
	      const r = 1 - t,
	        o = i,
	        s = e;
	      let a,
	        h = o[0],
	        c = o[1],
	        l = o[2],
	        u = o[3];
	      return h *= r, c *= t, 2 === s.length ? (a = h + c, {
	        x: (h * s[0].x + c * s[1].x) / a,
	        y: (h * s[0].y + c * s[1].y) / a,
	        z: !!n && (h * s[0].z + c * s[1].z) / a,
	        t: t
	      }) : (h *= r, c *= 2 * r, l *= t * t, 3 === s.length ? (a = h + c + l, {
	        x: (h * s[0].x + c * s[1].x + l * s[2].x) / a,
	        y: (h * s[0].y + c * s[1].y + l * s[2].y) / a,
	        z: !!n && (h * s[0].z + c * s[1].z + l * s[2].z) / a,
	        t: t
	      }) : (h *= r, c *= 1.5 * r, l *= 3 * r, u *= t * t * t, 4 === s.length ? (a = h + c + l + u, {
	        x: (h * s[0].x + c * s[1].x + l * s[2].x + u * s[3].x) / a,
	        y: (h * s[0].y + c * s[1].y + l * s[2].y + u * s[3].y) / a,
	        z: !!n && (h * s[0].z + c * s[1].z + l * s[2].z + u * s[3].z) / a,
	        t: t
	      }) : void 0));
	    },
	    derive: function (t, e) {
	      const i = [];
	      for (let n = t, r = n.length, o = r - 1; r > 1; r--, o--) {
	        const t = [];
	        for (let i, r = 0; r < o; r++) i = {
	          x: o * (n[r + 1].x - n[r].x),
	          y: o * (n[r + 1].y - n[r].y)
	        }, e && (i.z = o * (n[r + 1].z - n[r].z)), t.push(i);
	        i.push(t), n = t;
	      }
	      return i;
	    },
	    between: function (t, e, i) {
	      return e <= t && t <= i || y$1.approximately(t, e) || y$1.approximately(t, i);
	    },
	    approximately: function (t, e, n) {
	      return i$1(t - e) <= (n || 1e-6);
	    },
	    length: function (t) {
	      const e = y$1.Tvalues.length;
	      let i = 0;
	      for (let n, r = 0; r < e; r++) n = .5 * y$1.Tvalues[r] + .5, i += y$1.Cvalues[r] * y$1.arcfn(n, t);
	      return .5 * i;
	    },
	    map: function (t, e, i, n, r) {
	      return n + (r - n) * ((t - e) / (i - e));
	    },
	    lerp: function (t, e, i) {
	      const n = {
	        x: e.x + t * (i.x - e.x),
	        y: e.y + t * (i.y - e.y)
	      };
	      return void 0 !== e.z && void 0 !== i.z && (n.z = e.z + t * (i.z - e.z)), n;
	    },
	    pointToString: function (t) {
	      let e = t.x + "/" + t.y;
	      return void 0 !== t.z && (e += "/" + t.z), e;
	    },
	    pointsToString: function (t) {
	      return "[" + t.map(y$1.pointToString).join(", ") + "]";
	    },
	    copy: function (t) {
	      return JSON.parse(JSON.stringify(t));
	    },
	    angle: function (t, e, i) {
	      const n = e.x - t.x,
	        r = e.y - t.y,
	        o = i.x - t.x,
	        a = i.y - t.y;
	      return s$1(n * a - r * o, n * o + r * a);
	    },
	    round: function (t, e) {
	      const i = "" + t,
	        n = i.indexOf(".");
	      return parseFloat(i.substring(0, n + 1 + e));
	    },
	    dist: function (t, e) {
	      const i = t.x - e.x,
	        n = t.y - e.y;
	      return a$1(i * i + n * n);
	    },
	    closest: function (t, e) {
	      let i,
	        n,
	        r = h$1(2, 63);
	      return t.forEach(function (t, o) {
	        n = y$1.dist(e, t), n < r && (r = n, i = o);
	      }), {
	        mdist: r,
	        mpos: i
	      };
	    },
	    abcratio: function (t, e) {
	      if (2 !== e && 3 !== e) return !1;
	      if (void 0 === t) t = .5;else if (0 === t || 1 === t) return t;
	      const n = h$1(t, e) + h$1(1 - t, e);
	      return i$1((n - 1) / n);
	    },
	    projectionratio: function (t, e) {
	      if (2 !== e && 3 !== e) return !1;
	      if (void 0 === t) t = .5;else if (0 === t || 1 === t) return t;
	      const i = h$1(1 - t, e);
	      return i / (h$1(t, e) + i);
	    },
	    lli8: function (t, e, i, n, r, o, s, a) {
	      const h = (t - i) * (o - a) - (e - n) * (r - s);
	      return 0 != h && {
	        x: ((t * n - e * i) * (r - s) - (t - i) * (r * a - o * s)) / h,
	        y: ((t * n - e * i) * (o - a) - (e - n) * (r * a - o * s)) / h
	      };
	    },
	    lli4: function (t, e, i, n) {
	      const r = t.x,
	        o = t.y,
	        s = e.x,
	        a = e.y,
	        h = i.x,
	        c = i.y,
	        l = n.x,
	        u = n.y;
	      return y$1.lli8(r, o, s, a, h, c, l, u);
	    },
	    lli: function (t, e) {
	      return y$1.lli4(t, t.c, e, e.c);
	    },
	    makeline: function (t, e) {
	      return new T$1(t.x, t.y, (t.x + e.x) / 2, (t.y + e.y) / 2, e.x, e.y);
	    },
	    findbbox: function (t) {
	      let e = g$1,
	        i = g$1,
	        n = x$1,
	        r = x$1;
	      return t.forEach(function (t) {
	        const o = t.bbox();
	        e > o.x.min && (e = o.x.min), i > o.y.min && (i = o.y.min), n < o.x.max && (n = o.x.max), r < o.y.max && (r = o.y.max);
	      }), {
	        x: {
	          min: e,
	          mid: (e + n) / 2,
	          max: n,
	          size: n - e
	        },
	        y: {
	          min: i,
	          mid: (i + r) / 2,
	          max: r,
	          size: r - i
	        }
	      };
	    },
	    shapeintersections: function (t, e, i, n, r) {
	      if (!y$1.bboxoverlap(e, n)) return [];
	      const o = [],
	        s = [t.startcap, t.forward, t.back, t.endcap],
	        a = [i.startcap, i.forward, i.back, i.endcap];
	      return s.forEach(function (e) {
	        e.virtual || a.forEach(function (n) {
	          if (n.virtual) return;
	          const s = e.intersects(n, r);
	          s.length > 0 && (s.c1 = e, s.c2 = n, s.s1 = t, s.s2 = i, o.push(s));
	        });
	      }), o;
	    },
	    makeshape: function (t, e, i) {
	      const n = e.points.length,
	        r = t.points.length,
	        o = y$1.makeline(e.points[n - 1], t.points[0]),
	        s = y$1.makeline(t.points[r - 1], e.points[0]),
	        a = {
	          startcap: o,
	          forward: t,
	          back: e,
	          endcap: s,
	          bbox: y$1.findbbox([o, t, e, s]),
	          intersections: function (t) {
	            return y$1.shapeintersections(a, a.bbox, t, t.bbox, i);
	          }
	        };
	      return a;
	    },
	    getminmax: function (t, e, i) {
	      if (!i) return {
	        min: 0,
	        max: 0
	      };
	      let n,
	        r,
	        o = g$1,
	        s = x$1;
	      -1 === i.indexOf(0) && (i = [0].concat(i)), -1 === i.indexOf(1) && i.push(1);
	      for (let a = 0, h = i.length; a < h; a++) n = i[a], r = t.get(n), r[e] < o && (o = r[e]), r[e] > s && (s = r[e]);
	      return {
	        min: o,
	        mid: (o + s) / 2,
	        max: s,
	        size: s - o
	      };
	    },
	    align: function (t, e) {
	      const i = e.p1.x,
	        o = e.p1.y,
	        a = -s$1(e.p2.y - o, e.p2.x - i);
	      return t.map(function (t) {
	        return {
	          x: (t.x - i) * n$1(a) - (t.y - o) * r$1(a),
	          y: (t.x - i) * r$1(a) + (t.y - o) * n$1(a)
	        };
	      });
	    },
	    roots: function (t, e) {
	      e = e || {
	        p1: {
	          x: 0,
	          y: 0
	        },
	        p2: {
	          x: 1,
	          y: 0
	        }
	      };
	      const i = t.length - 1,
	        r = y$1.align(t, e),
	        s = function (t) {
	          return 0 <= t && t <= 1;
	        };
	      if (2 === i) {
	        const t = r[0].y,
	          e = r[1].y,
	          i = r[2].y,
	          n = t - 2 * e + i;
	        if (0 !== n) {
	          const r = -a$1(e * e - t * i),
	            o = -t + e;
	          return [-(r + o) / n, -(-r + o) / n].filter(s);
	        }
	        return e !== i && 0 === n ? [(2 * e - i) / (2 * e - 2 * i)].filter(s) : [];
	      }
	      const h = r[0].y,
	        l = r[1].y,
	        p = r[2].y;
	      let g = 3 * l - h - 3 * p + r[3].y,
	        x = 3 * h - 6 * l + 3 * p,
	        f = -3 * h + 3 * l,
	        d = h;
	      if (y$1.approximately(g, 0)) {
	        if (y$1.approximately(x, 0)) return y$1.approximately(f, 0) ? [] : [-d / f].filter(s);
	        const t = a$1(f * f - 4 * x * d),
	          e = 2 * x;
	        return [(t - f) / e, (-f - t) / e].filter(s);
	      }
	      x /= g, f /= g, d /= g;
	      const m = (3 * f - x * x) / 3,
	        v = m / 3,
	        _ = (2 * x * x * x - 9 * x * f + 27 * d) / 27,
	        b = _ / 2,
	        E = b * b + v * v * v;
	      let w, C, z, T, R;
	      if (E < 0) {
	        const t = -m / 3,
	          e = a$1(t * t * t),
	          i = -_ / (2 * e),
	          r = o$1(i < -1 ? -1 : i > 1 ? 1 : i),
	          h = 2 * c$1(e);
	        return z = h * n$1(r / 3) - x / 3, T = h * n$1((r + u$1) / 3) - x / 3, R = h * n$1((r + 2 * u$1) / 3) - x / 3, [z, T, R].filter(s);
	      }
	      if (0 === E) return w = b < 0 ? c$1(-b) : -c$1(b), z = 2 * w - x / 3, T = -w - x / 3, [z, T].filter(s);
	      {
	        const t = a$1(E);
	        return w = c$1(-b + t), C = c$1(b + t), [w - C - x / 3].filter(s);
	      }
	    },
	    droots: function (t) {
	      if (3 === t.length) {
	        const e = t[0],
	          i = t[1],
	          n = t[2],
	          r = e - 2 * i + n;
	        if (0 !== r) {
	          const t = -a$1(i * i - e * n),
	            o = -e + i;
	          return [-(t + o) / r, -(-t + o) / r];
	        }
	        return i !== n && 0 === r ? [(2 * i - n) / (2 * (i - n))] : [];
	      }
	      if (2 === t.length) {
	        const e = t[0],
	          i = t[1];
	        return e !== i ? [e / (e - i)] : [];
	      }
	      return [];
	    },
	    curvature: function (t, e, n, r, o) {
	      let s,
	        c,
	        l,
	        u,
	        p = 0,
	        g = 0;
	      const x = y$1.compute(t, e),
	        f = y$1.compute(t, n),
	        d = x.x * x.x + x.y * x.y;
	      if (r ? (s = a$1(h$1(x.y * f.z - f.y * x.z, 2) + h$1(x.z * f.x - f.z * x.x, 2) + h$1(x.x * f.y - f.x * x.y, 2)), c = h$1(d + x.z * x.z, 1.5)) : (s = x.x * f.y - x.y * f.x, c = h$1(d, 1.5)), 0 === s || 0 === c) return {
	        k: 0,
	        r: 0
	      };
	      if (p = s / c, g = c / s, !o) {
	        const o = y$1.curvature(t - .001, e, n, r, !0).k,
	          s = y$1.curvature(t + .001, e, n, r, !0).k;
	        u = (s - p + (p - o)) / 2, l = (i$1(s - p) + i$1(p - o)) / 2;
	      }
	      return {
	        k: p,
	        r: g,
	        dk: u,
	        adk: l
	      };
	    },
	    inflections: function (t) {
	      if (t.length < 4) return [];
	      const e = y$1.align(t, {
	          p1: t[0],
	          p2: t.slice(-1)[0]
	        }),
	        i = e[2].x * e[1].y,
	        n = e[3].x * e[1].y,
	        r = e[1].x * e[2].y,
	        o = 18 * (-3 * i + 2 * n + 3 * r - e[3].x * e[2].y),
	        s = 18 * (3 * i - n - 3 * r),
	        a = 18 * (r - i);
	      if (y$1.approximately(o, 0)) {
	        if (!y$1.approximately(s, 0)) {
	          let t = -a / s;
	          if (0 <= t && t <= 1) return [t];
	        }
	        return [];
	      }
	      const h = 2 * o;
	      if (y$1.approximately(h, 0)) return [];
	      const c = s * s - 4 * o * a;
	      if (c < 0) return [];
	      const l = Math.sqrt(c);
	      return [(l - s) / h, -(s + l) / h].filter(function (t) {
	        return 0 <= t && t <= 1;
	      });
	    },
	    bboxoverlap: function (t, e) {
	      const n = ["x", "y"],
	        r = n.length;
	      for (let o, s, a, h, c = 0; c < r; c++) if (o = n[c], s = t[o].mid, a = e[o].mid, h = (t[o].size + e[o].size) / 2, i$1(s - a) >= h) return !1;
	      return !0;
	    },
	    expandbox: function (t, e) {
	      e.x.min < t.x.min && (t.x.min = e.x.min), e.y.min < t.y.min && (t.y.min = e.y.min), e.z && e.z.min < t.z.min && (t.z.min = e.z.min), e.x.max > t.x.max && (t.x.max = e.x.max), e.y.max > t.y.max && (t.y.max = e.y.max), e.z && e.z.max > t.z.max && (t.z.max = e.z.max), t.x.mid = (t.x.min + t.x.max) / 2, t.y.mid = (t.y.min + t.y.max) / 2, t.z && (t.z.mid = (t.z.min + t.z.max) / 2), t.x.size = t.x.max - t.x.min, t.y.size = t.y.max - t.y.min, t.z && (t.z.size = t.z.max - t.z.min);
	    },
	    pairiteration: function (t, e, i) {
	      const n = t.bbox(),
	        r = e.bbox(),
	        o = 1e5,
	        s = i || .5;
	      if (n.x.size + n.y.size < s && r.x.size + r.y.size < s) return [(o * (t._t1 + t._t2) / 2 | 0) / o + "/" + (o * (e._t1 + e._t2) / 2 | 0) / o];
	      let a = t.split(.5),
	        h = e.split(.5),
	        c = [{
	          left: a.left,
	          right: h.left
	        }, {
	          left: a.left,
	          right: h.right
	        }, {
	          left: a.right,
	          right: h.right
	        }, {
	          left: a.right,
	          right: h.left
	        }];
	      c = c.filter(function (t) {
	        return y$1.bboxoverlap(t.left.bbox(), t.right.bbox());
	      });
	      let l = [];
	      return 0 === c.length || (c.forEach(function (t) {
	        l = l.concat(y$1.pairiteration(t.left, t.right, s));
	      }), l = l.filter(function (t, e) {
	        return l.indexOf(t) === e;
	      })), l;
	    },
	    getccenter: function (t, e, i) {
	      const o = e.x - t.x,
	        a = e.y - t.y,
	        h = i.x - e.x,
	        c = i.y - e.y,
	        l = o * n$1(p$1) - a * r$1(p$1),
	        g = o * r$1(p$1) + a * n$1(p$1),
	        x = h * n$1(p$1) - c * r$1(p$1),
	        f = h * r$1(p$1) + c * n$1(p$1),
	        d = (t.x + e.x) / 2,
	        m = (t.y + e.y) / 2,
	        v = (e.x + i.x) / 2,
	        _ = (e.y + i.y) / 2,
	        b = d + l,
	        E = m + g,
	        w = v + x,
	        C = _ + f,
	        z = y$1.lli8(d, m, b, E, v, _, w, C),
	        T = y$1.dist(z, t);
	      let R,
	        S = s$1(t.y - z.y, t.x - z.x),
	        P = s$1(e.y - z.y, e.x - z.x),
	        M = s$1(i.y - z.y, i.x - z.x);
	      return S < M ? ((S > P || P > M) && (S += u$1), S > M && (R = M, M = S, S = R)) : M < P && P < S ? (R = M, M = S, S = R) : M += u$1, z.s = S, z.e = M, z.r = T, z;
	    },
	    numberSort: function (t, e) {
	      return t - e;
	    }
	  };
	let d$1 = class d {
	  constructor(t) {
	    this.curves = [], this._3d = !1, t && (this.curves = t, this._3d = this.curves[0]._3d);
	  }
	  valueOf() {
	    return this.toString();
	  }
	  toString() {
	    return "[" + this.curves.map(function (t) {
	      return y$1.pointsToString(t.points);
	    }).join(", ") + "]";
	  }
	  addCurve(t) {
	    this.curves.push(t), this._3d = this._3d || t._3d;
	  }
	  length() {
	    return this.curves.map(function (t) {
	      return t.length();
	    }).reduce(function (t, e) {
	      return t + e;
	    });
	  }
	  curve(t) {
	    return this.curves[t];
	  }
	  bbox() {
	    const t = this.curves;
	    for (var e = t[0].bbox(), i = 1; i < t.length; i++) y$1.expandbox(e, t[i].bbox());
	    return e;
	  }
	  offset(t) {
	    const e = [];
	    return this.curves.forEach(function (i) {
	      e.push(...i.offset(t));
	    }), new d(e);
	  }
	};
	const {
	    abs: m$1,
	    min: v$1,
	    max: _$1,
	    cos: b$1,
	    sin: E$1,
	    acos: w$1,
	    sqrt: C$1
	  } = Math,
	  z$1 = Math.PI;
	let T$1 = class T {
	  constructor(t) {
	    let e = t && t.forEach ? t : Array.from(arguments).slice(),
	      i = !1;
	    if ("object" == typeof e[0]) {
	      i = e.length;
	      const t = [];
	      e.forEach(function (e) {
	        ["x", "y", "z"].forEach(function (i) {
	          void 0 !== e[i] && t.push(e[i]);
	        });
	      }), e = t;
	    }
	    let n = !1;
	    const r = e.length;
	    if (i) {
	      if (i > 4) {
	        if (1 !== arguments.length) throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
	        n = !0;
	      }
	    } else if (6 !== r && 8 !== r && 9 !== r && 12 !== r && 1 !== arguments.length) throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
	    const o = this._3d = !n && (9 === r || 12 === r) || t && t[0] && void 0 !== t[0].z,
	      s = this.points = [];
	    for (let t = 0, i = o ? 3 : 2; t < r; t += i) {
	      var a = {
	        x: e[t],
	        y: e[t + 1]
	      };
	      o && (a.z = e[t + 2]), s.push(a);
	    }
	    const h = this.order = s.length - 1,
	      c = this.dims = ["x", "y"];
	    o && c.push("z"), this.dimlen = c.length;
	    const l = y$1.align(s, {
	        p1: s[0],
	        p2: s[h]
	      }),
	      u = y$1.dist(s[0], s[h]);
	    this._linear = l.reduce((t, e) => t + m$1(e.y), 0) < u / 50, this._lut = [], this._t1 = 0, this._t2 = 1, this.update();
	  }
	  static quadraticFromPoints(t, e, i, n) {
	    if (void 0 === n && (n = .5), 0 === n) return new T(e, e, i);
	    if (1 === n) return new T(t, e, e);
	    const r = T.getABC(2, t, e, i, n);
	    return new T(t, r.A, i);
	  }
	  static cubicFromPoints(t, e, i, n, r) {
	    void 0 === n && (n = .5);
	    const o = T.getABC(3, t, e, i, n);
	    void 0 === r && (r = y$1.dist(e, o.C));
	    const s = r * (1 - n) / n,
	      a = y$1.dist(t, i),
	      h = (i.x - t.x) / a,
	      c = (i.y - t.y) / a,
	      l = r * h,
	      u = r * c,
	      p = s * h,
	      g = s * c,
	      x = e.x - l,
	      f = e.y - u,
	      d = e.x + p,
	      m = e.y + g,
	      v = o.A,
	      _ = v.x + (x - v.x) / (1 - n),
	      b = v.y + (f - v.y) / (1 - n),
	      E = v.x + (d - v.x) / n,
	      w = v.y + (m - v.y) / n,
	      C = {
	        x: t.x + (_ - t.x) / n,
	        y: t.y + (b - t.y) / n
	      },
	      z = {
	        x: i.x + (E - i.x) / (1 - n),
	        y: i.y + (w - i.y) / (1 - n)
	      };
	    return new T(t, C, z, i);
	  }
	  static getUtils() {
	    return y$1;
	  }
	  getUtils() {
	    return T.getUtils();
	  }
	  static get PolyBezier() {
	    return d$1;
	  }
	  valueOf() {
	    return this.toString();
	  }
	  toString() {
	    return y$1.pointsToString(this.points);
	  }
	  toSVG() {
	    if (this._3d) return !1;
	    const t = this.points,
	      e = ["M", t[0].x, t[0].y, 2 === this.order ? "Q" : "C"];
	    for (let i = 1, n = t.length; i < n; i++) e.push(t[i].x), e.push(t[i].y);
	    return e.join(" ");
	  }
	  setRatios(t) {
	    if (t.length !== this.points.length) throw new Error("incorrect number of ratio values");
	    this.ratios = t, this._lut = [];
	  }
	  verify() {
	    const t = this.coordDigest();
	    t !== this._print && (this._print = t, this.update());
	  }
	  coordDigest() {
	    return this.points.map(function (t, e) {
	      return "" + e + t.x + t.y + (t.z ? t.z : 0);
	    }).join("");
	  }
	  update() {
	    this._lut = [], this.dpoints = y$1.derive(this.points, this._3d), this.computedirection();
	  }
	  computedirection() {
	    const t = this.points,
	      e = y$1.angle(t[0], t[this.order], t[1]);
	    this.clockwise = e > 0;
	  }
	  length() {
	    return y$1.length(this.derivative.bind(this));
	  }
	  static getABC(t = 2, e, i, n, r = .5) {
	    const o = y$1.projectionratio(r, t),
	      s = 1 - o,
	      a = {
	        x: o * e.x + s * n.x,
	        y: o * e.y + s * n.y
	      },
	      h = y$1.abcratio(r, t);
	    return {
	      A: {
	        x: i.x + (i.x - a.x) / h,
	        y: i.y + (i.y - a.y) / h
	      },
	      B: i,
	      C: a,
	      S: e,
	      E: n
	    };
	  }
	  getABC(t, e) {
	    e = e || this.get(t);
	    let i = this.points[0],
	      n = this.points[this.order];
	    return T.getABC(this.order, i, e, n, t);
	  }
	  getLUT(t) {
	    if (this.verify(), t = t || 100, this._lut.length === t + 1) return this._lut;
	    this._lut = [], t++, this._lut = [];
	    for (let e, i, n = 0; n < t; n++) i = n / (t - 1), e = this.compute(i), e.t = i, this._lut.push(e);
	    return this._lut;
	  }
	  on(e, i) {
	    i = i || 5;
	    const n = this.getLUT(),
	      r = [];
	    for (let t, o = 0, s = 0; o < n.length; o++) t = n[o], y$1.dist(t, e) < i && (r.push(t), s += o / n.length);
	    return !!r.length && (t /= r.length);
	  }
	  project(t) {
	    const e = this.getLUT(),
	      i = e.length - 1,
	      n = y$1.closest(e, t),
	      r = n.mpos,
	      o = (r - 1) / i,
	      s = (r + 1) / i,
	      a = .1 / i;
	    let h,
	      c = n.mdist,
	      l = o,
	      u = l;
	    c += 1;
	    for (let e; l < s + a; l += a) h = this.compute(l), e = y$1.dist(t, h), e < c && (c = e, u = l);
	    return u = u < 0 ? 0 : u > 1 ? 1 : u, h = this.compute(u), h.t = u, h.d = c, h;
	  }
	  get(t) {
	    return this.compute(t);
	  }
	  point(t) {
	    return this.points[t];
	  }
	  compute(t) {
	    return this.ratios ? y$1.computeWithRatios(t, this.points, this.ratios, this._3d) : y$1.compute(t, this.points, this._3d, this.ratios);
	  }
	  raise() {
	    const t = this.points,
	      e = [t[0]],
	      i = t.length;
	    for (let n, r, o = 1; o < i; o++) n = t[o], r = t[o - 1], e[o] = {
	      x: (i - o) / i * n.x + o / i * r.x,
	      y: (i - o) / i * n.y + o / i * r.y
	    };
	    return e[i] = t[i - 1], new T(e);
	  }
	  derivative(t) {
	    return y$1.compute(t, this.dpoints[0], this._3d);
	  }
	  dderivative(t) {
	    return y$1.compute(t, this.dpoints[1], this._3d);
	  }
	  align() {
	    let t = this.points;
	    return new T(y$1.align(t, {
	      p1: t[0],
	      p2: t[t.length - 1]
	    }));
	  }
	  curvature(t) {
	    return y$1.curvature(t, this.dpoints[0], this.dpoints[1], this._3d);
	  }
	  inflections() {
	    return y$1.inflections(this.points);
	  }
	  normal(t) {
	    return this._3d ? this.__normal3(t) : this.__normal2(t);
	  }
	  __normal2(t) {
	    const e = this.derivative(t),
	      i = C$1(e.x * e.x + e.y * e.y);
	    return {
	      t: t,
	      x: -e.y / i,
	      y: e.x / i
	    };
	  }
	  __normal3(t) {
	    const e = this.derivative(t),
	      i = this.derivative(t + .01),
	      n = C$1(e.x * e.x + e.y * e.y + e.z * e.z),
	      r = C$1(i.x * i.x + i.y * i.y + i.z * i.z);
	    e.x /= n, e.y /= n, e.z /= n, i.x /= r, i.y /= r, i.z /= r;
	    const o = {
	        x: i.y * e.z - i.z * e.y,
	        y: i.z * e.x - i.x * e.z,
	        z: i.x * e.y - i.y * e.x
	      },
	      s = C$1(o.x * o.x + o.y * o.y + o.z * o.z);
	    o.x /= s, o.y /= s, o.z /= s;
	    const a = [o.x * o.x, o.x * o.y - o.z, o.x * o.z + o.y, o.x * o.y + o.z, o.y * o.y, o.y * o.z - o.x, o.x * o.z - o.y, o.y * o.z + o.x, o.z * o.z];
	    return {
	      t: t,
	      x: a[0] * e.x + a[1] * e.y + a[2] * e.z,
	      y: a[3] * e.x + a[4] * e.y + a[5] * e.z,
	      z: a[6] * e.x + a[7] * e.y + a[8] * e.z
	    };
	  }
	  hull(t) {
	    let e = this.points,
	      i = [],
	      n = [],
	      r = 0;
	    for (n[r++] = e[0], n[r++] = e[1], n[r++] = e[2], 3 === this.order && (n[r++] = e[3]); e.length > 1;) {
	      i = [];
	      for (let o, s = 0, a = e.length - 1; s < a; s++) o = y$1.lerp(t, e[s], e[s + 1]), n[r++] = o, i.push(o);
	      e = i;
	    }
	    return n;
	  }
	  split(t, e) {
	    if (0 === t && e) return this.split(e).left;
	    if (1 === e) return this.split(t).right;
	    const i = this.hull(t),
	      n = {
	        left: 2 === this.order ? new T([i[0], i[3], i[5]]) : new T([i[0], i[4], i[7], i[9]]),
	        right: 2 === this.order ? new T([i[5], i[4], i[2]]) : new T([i[9], i[8], i[6], i[3]]),
	        span: i
	      };
	    return n.left._t1 = y$1.map(0, 0, 1, this._t1, this._t2), n.left._t2 = y$1.map(t, 0, 1, this._t1, this._t2), n.right._t1 = y$1.map(t, 0, 1, this._t1, this._t2), n.right._t2 = y$1.map(1, 0, 1, this._t1, this._t2), e ? (e = y$1.map(e, t, 1, 0, 1), n.right.split(e).left) : n;
	  }
	  extrema() {
	    const t = {};
	    let e = [];
	    return this.dims.forEach(function (i) {
	      let n = function (t) {
	          return t[i];
	        },
	        r = this.dpoints[0].map(n);
	      t[i] = y$1.droots(r), 3 === this.order && (r = this.dpoints[1].map(n), t[i] = t[i].concat(y$1.droots(r))), t[i] = t[i].filter(function (t) {
	        return t >= 0 && t <= 1;
	      }), e = e.concat(t[i].sort(y$1.numberSort));
	    }.bind(this)), t.values = e.sort(y$1.numberSort).filter(function (t, i) {
	      return e.indexOf(t) === i;
	    }), t;
	  }
	  bbox() {
	    const t = this.extrema(),
	      e = {};
	    return this.dims.forEach(function (i) {
	      e[i] = y$1.getminmax(this, i, t[i]);
	    }.bind(this)), e;
	  }
	  overlaps(t) {
	    const e = this.bbox(),
	      i = t.bbox();
	    return y$1.bboxoverlap(e, i);
	  }
	  offset(t, e) {
	    if (void 0 !== e) {
	      const i = this.get(t),
	        n = this.normal(t),
	        r = {
	          c: i,
	          n: n,
	          x: i.x + n.x * e,
	          y: i.y + n.y * e
	        };
	      return this._3d && (r.z = i.z + n.z * e), r;
	    }
	    if (this._linear) {
	      const e = this.normal(0),
	        i = this.points.map(function (i) {
	          const n = {
	            x: i.x + t * e.x,
	            y: i.y + t * e.y
	          };
	          return i.z && e.z && (n.z = i.z + t * e.z), n;
	        });
	      return [new T(i)];
	    }
	    return this.reduce().map(function (e) {
	      return e._linear ? e.offset(t)[0] : e.scale(t);
	    });
	  }
	  simple() {
	    if (3 === this.order) {
	      const t = y$1.angle(this.points[0], this.points[3], this.points[1]),
	        e = y$1.angle(this.points[0], this.points[3], this.points[2]);
	      if (t > 0 && e < 0 || t < 0 && e > 0) return !1;
	    }
	    const t = this.normal(0),
	      e = this.normal(1);
	    let i = t.x * e.x + t.y * e.y;
	    return this._3d && (i += t.z * e.z), m$1(w$1(i)) < z$1 / 3;
	  }
	  reduce() {
	    let t,
	      e,
	      i = 0,
	      n = 0,
	      r = .01,
	      o = [],
	      s = [],
	      a = this.extrema().values;
	    for (-1 === a.indexOf(0) && (a = [0].concat(a)), -1 === a.indexOf(1) && a.push(1), i = a[0], t = 1; t < a.length; t++) n = a[t], e = this.split(i, n), e._t1 = i, e._t2 = n, o.push(e), i = n;
	    return o.forEach(function (t) {
	      for (i = 0, n = 0; n <= 1;) for (n = i + r; n <= 1.01; n += r) if (e = t.split(i, n), !e.simple()) {
	        if (n -= r, m$1(i - n) < r) return [];
	        e = t.split(i, n), e._t1 = y$1.map(i, 0, 1, t._t1, t._t2), e._t2 = y$1.map(n, 0, 1, t._t1, t._t2), s.push(e), i = n;
	        break;
	      }
	      i < 1 && (e = t.split(i, 1), e._t1 = y$1.map(i, 0, 1, t._t1, t._t2), e._t2 = t._t2, s.push(e));
	    }), s;
	  }
	  translate(t, e, i) {
	    i = "number" == typeof i ? i : e;
	    const n = this.order;
	    let r = this.points.map((t, r) => (1 - r / n) * e + r / n * i);
	    return new T(this.points.map((e, i) => ({
	      x: e.x + t.x * r[i],
	      y: e.y + t.y * r[i]
	    })));
	  }
	  scale(t) {
	    const e = this.order;
	    let i = !1;
	    if ("function" == typeof t && (i = t), i && 2 === e) return this.raise().scale(i);
	    const n = this.clockwise,
	      r = this.points;
	    if (this._linear) return this.translate(this.normal(0), i ? i(0) : t, i ? i(1) : t);
	    const o = i ? i(0) : t,
	      s = i ? i(1) : t,
	      a = [this.offset(0, 10), this.offset(1, 10)],
	      h = [],
	      c = y$1.lli4(a[0], a[0].c, a[1], a[1].c);
	    if (!c) throw new Error("cannot scale this curve. Try reducing it first.");
	    return [0, 1].forEach(function (t) {
	      const i = h[t * e] = y$1.copy(r[t * e]);
	      i.x += (t ? s : o) * a[t].n.x, i.y += (t ? s : o) * a[t].n.y;
	    }), i ? ([0, 1].forEach(function (o) {
	      if (2 !== e || !o) {
	        var s = r[o + 1],
	          a = {
	            x: s.x - c.x,
	            y: s.y - c.y
	          },
	          l = i ? i((o + 1) / e) : t;
	        i && !n && (l = -l);
	        var u = C$1(a.x * a.x + a.y * a.y);
	        a.x /= u, a.y /= u, h[o + 1] = {
	          x: s.x + l * a.x,
	          y: s.y + l * a.y
	        };
	      }
	    }), new T(h)) : ([0, 1].forEach(t => {
	      if (2 === e && t) return;
	      const i = h[t * e],
	        n = this.derivative(t),
	        o = {
	          x: i.x + n.x,
	          y: i.y + n.y
	        };
	      h[t + 1] = y$1.lli4(i, o, c, r[t + 1]);
	    }), new T(h));
	  }
	  outline(t, e, i, n) {
	    if (e = void 0 === e ? t : e, this._linear) {
	      const r = this.normal(0),
	        o = this.points[0],
	        s = this.points[this.points.length - 1];
	      let a, h, c;
	      void 0 === i && (i = t, n = e), a = {
	        x: o.x + r.x * t,
	        y: o.y + r.y * t
	      }, c = {
	        x: s.x + r.x * i,
	        y: s.y + r.y * i
	      }, h = {
	        x: (a.x + c.x) / 2,
	        y: (a.y + c.y) / 2
	      };
	      const l = [a, h, c];
	      a = {
	        x: o.x - r.x * e,
	        y: o.y - r.y * e
	      }, c = {
	        x: s.x - r.x * n,
	        y: s.y - r.y * n
	      }, h = {
	        x: (a.x + c.x) / 2,
	        y: (a.y + c.y) / 2
	      };
	      const u = [c, h, a],
	        p = y$1.makeline(u[2], l[0]),
	        g = y$1.makeline(l[2], u[0]),
	        x = [p, new T(l), g, new T(u)];
	      return new d$1(x);
	    }
	    const r = this.reduce(),
	      o = r.length,
	      s = [];
	    let a,
	      h = [],
	      c = 0,
	      l = this.length();
	    const u = void 0 !== i && void 0 !== n;
	    function p(t, e, i, n, r) {
	      return function (o) {
	        const s = n / i,
	          a = (n + r) / i,
	          h = e - t;
	        return y$1.map(o, 0, 1, t + s * h, t + a * h);
	      };
	    }
	    r.forEach(function (r) {
	      const o = r.length();
	      u ? (s.push(r.scale(p(t, i, l, c, o))), h.push(r.scale(p(-e, -n, l, c, o)))) : (s.push(r.scale(t)), h.push(r.scale(-e))), c += o;
	    }), h = h.map(function (t) {
	      return a = t.points, a[3] ? t.points = [a[3], a[2], a[1], a[0]] : t.points = [a[2], a[1], a[0]], t;
	    }).reverse();
	    const g = s[0].points[0],
	      x = s[o - 1].points[s[o - 1].points.length - 1],
	      f = h[o - 1].points[h[o - 1].points.length - 1],
	      m = h[0].points[0],
	      v = y$1.makeline(f, g),
	      _ = y$1.makeline(x, m),
	      b = [v].concat(s).concat([_]).concat(h);
	    return new d$1(b);
	  }
	  outlineshapes(t, e, i) {
	    e = e || t;
	    const n = this.outline(t, e).curves,
	      r = [];
	    for (let t = 1, e = n.length; t < e / 2; t++) {
	      const o = y$1.makeshape(n[t], n[e - t], i);
	      o.startcap.virtual = t > 1, o.endcap.virtual = t < e / 2 - 1, r.push(o);
	    }
	    return r;
	  }
	  intersects(t, e) {
	    return t ? t.p1 && t.p2 ? this.lineIntersects(t) : (t instanceof T && (t = t.reduce()), this.curveintersects(this.reduce(), t, e)) : this.selfintersects(e);
	  }
	  lineIntersects(t) {
	    const e = v$1(t.p1.x, t.p2.x),
	      i = v$1(t.p1.y, t.p2.y),
	      n = _$1(t.p1.x, t.p2.x),
	      r = _$1(t.p1.y, t.p2.y);
	    return y$1.roots(this.points, t).filter(t => {
	      var o = this.get(t);
	      return y$1.between(o.x, e, n) && y$1.between(o.y, i, r);
	    });
	  }
	  selfintersects(t) {
	    const e = this.reduce(),
	      i = e.length - 2,
	      n = [];
	    for (let r, o, s, a = 0; a < i; a++) o = e.slice(a, a + 1), s = e.slice(a + 2), r = this.curveintersects(o, s, t), n.push(...r);
	    return n;
	  }
	  curveintersects(t, e, i) {
	    const n = [];
	    t.forEach(function (t) {
	      e.forEach(function (e) {
	        t.overlaps(e) && n.push({
	          left: t,
	          right: e
	        });
	      });
	    });
	    let r = [];
	    return n.forEach(function (t) {
	      const e = y$1.pairiteration(t.left, t.right, i);
	      e.length > 0 && (r = r.concat(e));
	    }), r;
	  }
	  arcs(t) {
	    return t = t || .5, this._iterate(t, []);
	  }
	  _error(t, e, i, n) {
	    const r = (n - i) / 4,
	      o = this.get(i + r),
	      s = this.get(n - r),
	      a = y$1.dist(t, e),
	      h = y$1.dist(t, o),
	      c = y$1.dist(t, s);
	    return m$1(h - a) + m$1(c - a);
	  }
	  _iterate(t, e) {
	    let i,
	      n = 0,
	      r = 1;
	    do {
	      i = 0, r = 1;
	      let o,
	        s,
	        a,
	        h,
	        c,
	        l = this.get(n),
	        u = !1,
	        p = !1,
	        g = r,
	        x = 1;
	      do {
	        if (p = u, h = a, g = (n + r) / 2, o = this.get(g), s = this.get(r), a = y$1.getccenter(l, o, s), a.interval = {
	          start: n,
	          end: r
	        }, u = this._error(a, l, n, r) <= t, c = p && !u, c || (x = r), u) {
	          if (r >= 1) {
	            if (a.interval.end = x = 1, h = a, r > 1) {
	              let t = {
	                x: a.x + a.r * b$1(a.e),
	                y: a.y + a.r * E$1(a.e)
	              };
	              a.e += y$1.angle({
	                x: a.x,
	                y: a.y
	              }, t, this.get(1));
	            }
	            break;
	          }
	          r += (r - n) / 2;
	        } else r = g;
	      } while (!c && i++ < 100);
	      if (i >= 100) break;
	      h = h || a, e.push(h), n = x;
	    } while (r < 1);
	    return e;
	  }
	};
	const R = (t, e, i) => {
	    if (t.x === e.x) return {
	      x: t.x,
	      y: i.y
	    };
	    if (t.y === e.y) return {
	      x: i.x,
	      y: t.y
	    };
	    const n = (e.y - t.y) / (e.x - t.x),
	      r = -1 / n,
	      o = (-n * t.x + t.y + r * i.x - i.y) / (r - n);
	    return {
	      x: o,
	      y: n * (o - t.x) + t.y
	    };
	  },
	  S$1 = (t, e) => Math.sqrt(Math.pow(e.x - t.x, 2) + Math.pow(e.y - t.y, 2)),
	  P = (t, e, i) => {
	    const n = Math.min(t.x, e.x, i.x),
	      r = Math.max(t.x, e.x, i.x),
	      o = Math.min(t.y, e.y, i.y);
	    return {
	      width: r - n,
	      height: Math.max(t.y, e.y, i.y) - o
	    };
	  },
	  M$1 = (t, e, i) => {
	    const n = Object.assign({}, t),
	      r = {
	        x: e.x - t.x,
	        y: e.y - t.y
	      };
	    if (0 === r.x && 0 === r.y) return n;
	    if (0 === r.x) n.y += i * Math.sign(r.y);else if (0 === r.y) n.x += i * Math.sign(r.x);else {
	      const t = Math.sqrt(Math.pow(r.x, 2) + Math.pow(r.y, 2));
	      n.x += r.x * (i / t), n.y += r.y * (i / t);
	    }
	    return n;
	  },
	  O$1 = (t, e) => {
	    const [i, n, r] = t,
	      [o, s, a] = e,
	      h = .1 / Math.abs([...t, ...e].reduce((t, e) => Math.min(t, e.x, e.y), -1)),
	      c = (t, e, i) => {
	        const [n, r, o, s] = t.map(Number),
	          [a, h, c, l] = e.map(Number),
	          [u, p, g, x] = i.map(Number),
	          f = o - r * c / h,
	          y = c - h * g / p,
	          d = l - h * x / p,
	          m = a - h * u / p,
	          v = (f / y * d - (s - r * l / h)) / (f / y * m - (n - r * a / h)),
	          _ = (d - m * v) / y;
	        return {
	          x: v,
	          y: (s - n * v - o * _) / r,
	          z: _
	        };
	      },
	      l = [o.x + h, o.y + h, 1, i.x + h],
	      u = [s.x + h, s.y + h, 1, n.x + h],
	      p = [a.x + h, a.y + h, 1, r.x + h],
	      g = c(l, u, p);
	    l[3] = i.y + h, u[3] = n.y + h, p[3] = r.y + h;
	    const x = c(l, u, p),
	      f = g.x,
	      y = g.y,
	      d = g.z;
	    return [f, x.x, y, x.y, d, x.z];
	  },
	  B$1 = (t, e, i, n, r = .1) => {
	    const o = (t, e, i) => Math.abs(t.x * (e.y - i.y) + e.x * (i.y - t.y) + i.x * (t.y - e.y)) / 2,
	      s = o(e, i, n);
	    return o(e, i, t) + o(i, n, t) + o(n, e, t) <= s + r;
	  };
	const A = (t, e, i, n, r) => {
	    var o;
	    const {
	        x: s,
	        y: a,
	        sourceScale: h = 1,
	        destinationScale: c = 1
	      } = n,
	      {
	        gridColor: l = {
	          r: 255,
	          g: 0,
	          b: 0,
	          a: 1
	        },
	        enableContentDisplay: u = !0,
	        enableGridDisplay: p = !1,
	        enableGridVertexDisplay: g = !1
	      } = null !== (o = t.renderingConfig) && void 0 !== o ? o : {},
	      {
	        calcBoundingBox: x,
	        calcPerpendicularIntersection: f,
	        calcCoordDistance: y,
	        calcRelativeCoord: d,
	        calcMatrix: m
	      } = r,
	      v = (t, e, i, n = 1) => {
	        const r = f(e, i, t),
	          o = y(t, r),
	          s = d(t, r, o + n);
	        return {
	          x: s.x - r.x + e.x,
	          y: s.y - r.y + e.y
	        };
	      },
	      _ = i.getContext("2d");
	    _.clearRect(0, 0, i.width, i.height);
	    const b = Math.ceil(1 / (h * c));
	    _.save(), _.transform(h * c, 0, 0, h * c, s * h * c, a * h * c);
	    const E = (t, i, n, r, o, s, a) => {
	      const c = [t, n, o],
	        f = new Path2D();
	      for (let t = 0; t < 3; t++) {
	        const e = c[t],
	          i = c[(t + 1) % 3],
	          n = c[(t + 2) % 3],
	          r = v(e, i, n, b),
	          o = v(e, n, i, b);
	        f.lineTo(r.x, r.y), f.lineTo(o.x, o.y);
	      }
	      if (u) {
	        _.save(), _.clip(f);
	        const c = m([t, n, o], [i, r, s]);
	        _.transform(...c);
	        const l = x(i, r, s),
	          u = (a.x - 1) * h,
	          p = (a.y - 1) * h,
	          g = (l.width + 2) * h,
	          y = (l.height + 2) * h,
	          d = a.x - 1 / h,
	          v = a.y - 1 / h,
	          b = l.width + 2 / h,
	          E = l.height + 2 / h;
	        _.drawImage(e, u, p, g, y, d, v, b, E), _.restore();
	      }
	      if (g) {
	        const e = Math.floor(2 / h);
	        _.fillStyle = `rgba(${l.r}, ${l.g}, ${l.b}, ${l.a})`, _.fillRect(t.x - e / 2, t.y - e / 2, e, e);
	      }
	      if (p) {
	        const t = Math.floor(1 / h);
	        _.lineWidth = t, _.strokeStyle = "rgba(255, 0, 0, 0.5)", _.stroke(f);
	      }
	    };
	    return t.regionPoints.forEach((e, i) => {
	      e.forEach((e, n) => {
	        const r = e,
	          o = t.regionCurves[i][n].vertical.length - 1;
	        r.forEach((e, s) => {
	          const a = r[s],
	            h = r[s + 1],
	            c = r[s + o + 2],
	            l = r[s + o + 1],
	            u = t.originalRegionPoints[i][n][s],
	            p = t.originalRegionPoints[i][n][s + 1],
	            g = t.originalRegionPoints[i][n][s + o + 2],
	            x = t.originalRegionPoints[i][n][s + o + 1];
	          h && c && s % (o + 1) < o && (E(a, u, h, p, l, x, u), E(c, g, h, p, l, x, u));
	        });
	      });
	    }), _.restore(), i;
	  },
	  L = (t, e, i, n) => {
	    const {
	      width: r,
	      height: o,
	      sourceScale: s = 1,
	      destinationScale: a = 1
	    } = n;
	    (i = null != i ? i : document.createElement("canvas")).width = r * a * s, i.height = o * a * s;
	    return A(t, e, i, n, {
	      calcBoundingBox: P,
	      calcPerpendicularIntersection: R,
	      calcCoordDistance: S$1,
	      calcRelativeCoord: M$1,
	      calcMatrix: O$1
	    });
	  },
	  F = (t, e, i, n) => {
	    var r;
	    const {
	        x: o,
	        y: s,
	        width: a,
	        height: h,
	        sourceScale: c = 1
	      } = n,
	      {
	        enableAntialias: l = !0,
	        gridColor: u = {
	          r: 255,
	          g: 0,
	          b: 0,
	          a: 1
	        },
	        enableContentDisplay: p = !0,
	        enableGridDisplay: g = !1,
	        enableGridVertexDisplay: x = !1
	      } = null !== (r = t.renderingConfig) && void 0 !== r ? r : {},
	      {
	        width: f,
	        height: y
	      } = e,
	      d = i.getContext("webgl", {
	        antialias: l
	      });
	    if (!d) throw Error("[Warpvas] Failed to initialize WebGL. Your browser or device may not support it.");
	    const m = {
	      before: [],
	      after: []
	    };
	    t.regionPoints.forEach((e, i) => {
	      e.forEach((e, n) => {
	        const r = e,
	          o = t.regionCurves[i][n].vertical.length - 1;
	        r.forEach((e, s) => {
	          const a = r[s],
	            h = r[s + 1],
	            c = r[s + o + 2],
	            l = r[s + o + 1],
	            u = t.originalRegionPoints[i][n][s],
	            p = t.originalRegionPoints[i][n][s + 1],
	            g = t.originalRegionPoints[i][n][s + o + 2],
	            x = t.originalRegionPoints[i][n][s + o + 1];
	          h && c && s % (o + 1) < o && (m.before.push(u, p, x, g, p, x), m.after.push(a, h, l, c, h, l));
	        });
	      });
	    });
	    const v = "\n      attribute vec4 aVertexPosition;\n      attribute vec2 aTextureCoord;\n      varying highp vec2 vTextureCoord;\n      void main(void) {\n          gl_Position = aVertexPosition;\n          gl_PointSize = 2.0;\n          vTextureCoord = aTextureCoord;\n      }\n  ",
	      _ = (t, e) => {
	        const i = d.createShader(t);
	        return i ? (d.shaderSource(i, e), d.compileShader(i), d.getShaderParameter(i, d.COMPILE_STATUS) ? i : (console.error("[Warpvas] Shader compilation error:", d.getShaderInfoLog(i)), d.deleteShader(i), null)) : (console.error("[Warpvas] Failed to create shader."), null);
	      },
	      b = (t, e) => {
	        const i = _(d.VERTEX_SHADER, t);
	        if (!i) return console.error("[Warpvas] Failed to initialize vertex shader."), null;
	        const n = _(d.FRAGMENT_SHADER, e);
	        if (!n) return console.error("[Warpvas] Failed to initialize fragment shader."), null;
	        const r = d.createProgram();
	        return r ? (d.attachShader(r, i), d.attachShader(r, n), d.linkProgram(r), d.getProgramParameter(r, d.LINK_STATUS) ? r : (console.error("[Warpvas] Shader program linking error:", d.getProgramInfoLog(r)), null)) : (console.error("[Warpvas] Failed to create shader program."), null);
	      },
	      E = t => !(t & t - 1),
	      w = b(v, "\n      varying highp vec2 vTextureCoord;\n      uniform sampler2D uSampler;\n      void main(void) {\n          gl_FragColor = texture2D(uSampler, vTextureCoord);\n      }\n  ");
	    if (!w) throw Error("[Warpvas] Failed to initialize shader program.");
	    const C = {
	        program: w,
	        attribLocations: {
	          vertexPosition: d.getAttribLocation(w, "aVertexPosition"),
	          textureCoord: d.getAttribLocation(w, "aTextureCoord")
	        },
	        uniformLocations: {
	          uSampler: d.getUniformLocation(w, "uSampler")
	        }
	      },
	      z = d.createTexture();
	    if (!z) throw Error("[Warpvas] Failed to create WebGL texture object.");
	    d.bindTexture(d.TEXTURE_2D, z), d.texImage2D(d.TEXTURE_2D, 0, d.RGBA, d.RGBA, d.UNSIGNED_BYTE, e), E(e.width) && E(e.height) && d.generateMipmap(d.TEXTURE_2D), d.enable(d.BLEND), d.blendFunc(d.SRC_ALPHA, d.ONE_MINUS_SRC_ALPHA), d.texParameteri(d.TEXTURE_2D, d.TEXTURE_WRAP_S, d.CLAMP_TO_EDGE), d.texParameteri(d.TEXTURE_2D, d.TEXTURE_WRAP_T, d.CLAMP_TO_EDGE), d.texParameteri(d.TEXTURE_2D, d.TEXTURE_MIN_FILTER, d.LINEAR), d.viewport(0, 0, i.width, i.height);
	    return ((t, e, i) => {
	      d.clearColor(0, 0, 0, 0), d.clear(d.COLOR_BUFFER_BIT);
	      const n = d.FLOAT,
	        r = !1,
	        o = 4 * Float32Array.BYTES_PER_ELEMENT;
	      d.bindBuffer(d.ARRAY_BUFFER, e.position), d.vertexAttribPointer(t.attribLocations.vertexPosition, 2, n, r, o, 0), d.enableVertexAttribArray(t.attribLocations.vertexPosition), d.bindBuffer(d.ARRAY_BUFFER, e.textureCoord), d.vertexAttribPointer(t.attribLocations.textureCoord, 2, n, r, o, 0), d.enableVertexAttribArray(t.attribLocations.textureCoord), d.useProgram(t.program), d.activeTexture(d.TEXTURE0), d.bindTexture(d.TEXTURE_2D, i), d.uniform1i(t.uniformLocations.uSampler, 0), p && d.drawArrays(d.TRIANGLES, 0, m.before.length);
	      const {
	          r: s,
	          g: a,
	          b: h,
	          a: c
	        } = u,
	        l = `${(s / 255).toFixed(1)}, ${(a / 255).toFixed(1)}, ${(h / 255).toFixed(1)}, ${c.toFixed(1)}`,
	        f = b(v, `\n      void main(void) {\n        gl_FragColor = vec4(${l});\n      }\n    `);
	      if (!f) throw Error("[Warpvas] Failed to initialize outline shader program.");
	      d.bindBuffer(d.ARRAY_BUFFER, e.position), d.vertexAttribPointer(d.getAttribLocation(f, "aVertexPosition"), 2, n, r, 0, 0), d.enableVertexAttribArray(d.getAttribLocation(f, "aVertexPosition")), d.bindBuffer(d.ARRAY_BUFFER, e.textureCoord), d.vertexAttribPointer(d.getAttribLocation(f, "aTextureCoord"), 2, n, r, 0, 0), d.enableVertexAttribArray(d.getAttribLocation(f, "aTextureCoord")), d.useProgram(f), g && d.drawArrays(d.LINES, 0, 2 * m.before.length), x && d.drawArrays(d.POINTS, 0, 2 * m.before.length);
	    })(C, (() => {
	      const t = d.createBuffer();
	      d.bindBuffer(d.ARRAY_BUFFER, t);
	      const e = m.before.map((t, e) => {
	        const i = [t.x / (f / c), t.y / (y / c)];
	        return (e + 1) % 3 == 0 ? i.push(m.before[e - 2].x / (f / c), m.before[e - 2].y / (y / c)) : i.push(m.before[e + 1].x / (f / c), m.before[e + 1].y / (y / c)), i;
	      }).flat(1);
	      d.bufferData(d.ARRAY_BUFFER, new Float32Array(e), d.STATIC_DRAW);
	      const i = d.createBuffer();
	      d.bindBuffer(d.ARRAY_BUFFER, i);
	      const n = m.after.map((t, e) => {
	        const i = [(t.x + o) / (a / 2) - 1, -((t.y + s) / (h / 2) - 1)];
	        return (e + 1) % 3 == 0 ? i.push((m.after[e - 2].x + o) / (a / 2) - 1, -((m.after[e - 2].y + s) / (h / 2) - 1)) : i.push((m.after[e + 1].x + o) / (a / 2) - 1, -((m.after[e + 1].y + s) / (h / 2) - 1)), i;
	      }).flat(1);
	      return d.bufferData(d.ARRAY_BUFFER, new Float32Array(n), d.STATIC_DRAW), {
	        position: i,
	        textureCoord: t
	      };
	    })(), z), i;
	  },
	  D = (t, e, i, n) => {
	    const {
	      width: r,
	      height: o,
	      sourceScale: s = 1,
	      destinationScale: a = 1
	    } = n;
	    (i = null != i ? i : document.createElement("canvas")).width = r * a * s, i.height = o * a * s;
	    return F(t, e, i, n);
	  },
	  U = "WORKER_MESSAGE",
	  W = "JOB_RESULT",
	  G = t => t instanceof ArrayBuffer || t instanceof MessagePort || self.ImageBitmap && t instanceof ImageBitmap,
	  k$1 = () => {
	    const t = [];
	    let e,
	      i = new Map();
	    const n = {
	      collect: t => {
	        for (let e in t) i.set(e, t[e]);
	        return n;
	      },
	      onMessage: t => (e = t, n),
	      create: n => {
	        const r = n.toString(),
	          o = `\n        // 将收集到的变量声明和定义加入脚本字符串，后面函数执行的时候便不会出现not defined的错误了\n        $collections = {};\n        ${Object.entries(Object.fromEntries(i)).reduce((t, [e, i]) => t + `$collections['${e}']=` + ("function" == typeof i ? `${i};` : `JSON.parse(\`${JSON.stringify(i)}\`);`), "")}\n  \n        // 声明定义用于判断是否是可转移对象的函数\n        $isTransferables = ${G}\n  \n        // 在脚本中声明并定义一个包含工作流程的函数体\n        $job=${r};\n  \n        // 给worker线程添加消息监听，等待主线程的发号施令\n        onmessage=e=>{\n          const { index, args } = e.data;\n  \n          Promise.resolve(\n            $job.apply($job, args.concat([{\n              collections: $collections,\n              postMessage: (message) => postMessage({ type: '${U}', message }),\n              close: self.close,\n            }]))\n          ).then(result => {\n            postMessage({ type: '${W}', message: { index, result } }, [result].filter($isTransferables))\n          }).catch(error => {\n            postMessage({ type: '${W}', message: { index, error } })\n          })\n        }\n      `,
	          s = URL.createObjectURL(new Blob([o], {
	            type: "text/javascript"
	          })),
	          a = new Worker(s);
	        return a.onmessage = function (i) {
	          const n = i.data;
	          if (n.type === U && e && e.call(e, n.message), n.type === W) {
	            const {
	                index: e,
	                result: i,
	                error: r
	              } = n.message,
	              {
	                done: o
	              } = t[e];
	            o(r, i);
	          }
	        }, {
	          run: (...e) => new Promise((i, n) => {
	            const r = t.length;
	            t.push({
	              done: (t, e) => {
	                t ? n(t) : i(e);
	              }
	            }), a.postMessage({
	              index: r,
	              args: e
	            }, e.filter(G));
	          }),
	          terminate: () => {
	            a.terminate(), URL.revokeObjectURL(s), t.length = 0, i.clear(), e = void 0;
	          }
	        };
	      }
	    };
	    return n;
	  },
	  N = (t, i, n, r) => e$1(void 0, void 0, void 0, function* () {
	    const {
	        regionPoints: e,
	        renderingConfig: o,
	        regionCurves: s,
	        originalRegionPoints: a
	      } = t,
	      h = {
	        renderingConfig: o,
	        regionCurves: s.map(t => t.map(t => ({
	          horizontal: {
	            length: t.horizontal.length
	          },
	          vertical: {
	            length: t.vertical.length
	          }
	        }))),
	        regionPoints: e,
	        originalRegionPoints: a
	      },
	      c = k$1().collect({
	        warpvas: h,
	        options: r,
	        createWarpedCanvas: A,
	        calcBoundingBox: P,
	        calcPerpendicularIntersection: R,
	        calcCoordDistance: S$1,
	        calcRelativeCoord: M$1,
	        calcMatrix: O$1
	      }).create((t, {
	        collections: e
	      }) => {
	        const {
	            options: i,
	            warpvas: n,
	            createWarpedCanvas: r,
	            calcBoundingBox: o,
	            calcPerpendicularIntersection: s,
	            calcCoordDistance: a,
	            calcRelativeCoord: h,
	            calcMatrix: c
	          } = e,
	          {
	            width: l,
	            height: u,
	            sourceScale: p = 1,
	            destinationScale: g = 1
	          } = i,
	          x = new OffscreenCanvas(l * g * p, u * g * p),
	          f = new OffscreenCanvas(t.width, t.height),
	          y = f.getContext("2d");
	        null == y || y.putImageData(t, 0, 0);
	        return r(n, f, x, i, {
	          calcBoundingBox: o,
	          calcPerpendicularIntersection: s,
	          calcCoordDistance: a,
	          calcRelativeCoord: h,
	          calcMatrix: c
	        }).transferToImageBitmap();
	      }),
	      l = yield c.run(i);
	    return c.terminate(), (n = null != n ? n : document.createElement("canvas")).width = l.width, n.height = l.height, n.getContext("2d").drawImage(l, 0, 0), n;
	  }),
	  H = (t, i, n, r) => e$1(void 0, void 0, void 0, function* () {
	    const {
	        regionPoints: e,
	        renderingConfig: o,
	        regionCurves: s,
	        originalRegionPoints: a
	      } = t,
	      h = {
	        renderingConfig: o,
	        regionCurves: s.map(t => t.map(t => ({
	          horizontal: {
	            length: t.horizontal.length
	          },
	          vertical: {
	            length: t.vertical.length
	          }
	        }))),
	        regionPoints: e,
	        originalRegionPoints: a
	      },
	      c = k$1().collect({
	        warpvas: h,
	        options: r,
	        createWarpedCanvas: F
	      }).create((t, {
	        collections: e
	      }) => {
	        const {
	            options: i,
	            warpvas: n,
	            createWarpedCanvas: r
	          } = e,
	          {
	            width: o,
	            height: s,
	            sourceScale: a = 1,
	            destinationScale: h = 1
	          } = i;
	        return r(n, t, new OffscreenCanvas(o * h * a, s * h * a), i).transferToImageBitmap();
	      }),
	      l = yield c.run(i);
	    return c.terminate(), (n = null != n ? n : document.createElement("canvas")).width = l.width, n.height = l.height, n.getContext("2d").drawImage(l, 0, 0), n;
	  });
	var $, j;
	!function (t) {
	  t.TOP_LEFT = "tl", t.TOP_RIGHT = "tr", t.BOTTOM_LEFT = "bl", t.BOTTOM_RIGHT = "br";
	}($ || ($ = {})), function (t) {
	  t.TOP = "top", t.BOTTOM = "bottom", t.LEFT = "left", t.RIGHT = "right";
	}(j || (j = {}));
	class V {
	  constructor(t, e = 1, i = 1) {
	    if (this.splitPoints = [], this.originalRegions = [], this.originalRegionPoints = [], this.regionBoundaryCurves = [], this.regionCurves = [], this.regionPoints = [], this.splitUnit = .05, this.splitStrategy = {
	      name: "default",
	      execute: V.strategy
	    }, this.renderingContext = "webgl", this.renderingConfig = {
	      padding: 0,
	      enableAntialias: !0,
	      enableSafeRendering: !0,
	      enableContentDisplay: !0,
	      enableGridDisplay: !1,
	      enableGridVertexDisplay: !1,
	      gridColor: {
	        r: 255,
	        g: 0,
	        b: 0,
	        a: 1
	      }
	    }, this._safeModeEnabled = !1, this._cacheSourceSize = null, this._cacheSourceImageData = null, this._cacheInputCanvas = null, this._cacheOutputCanvas = null, this._inputLimitScale = 1, this._outputLimitScale = 1, !(t instanceof HTMLCanvasElement || t instanceof HTMLImageElement)) throw new TypeError("[Warpvas] source must be either HTMLCanvasElement or HTMLImageElement!");
	    if (t instanceof HTMLImageElement) {
	      const e = document.createElement("canvas"),
	        i = e.getContext("2d");
	      if (!i) throw new Error("Failed to get 2D rendering context for canvas");
	      e.width = t.naturalWidth, e.height = t.naturalHeight, i.drawImage(t, 0, 0), this.source = e;
	    } else this.source = t;
	    this.splitPoints = this._initializeSplitPoints(e, i), this.setWarpState(this.splitPoints);
	  }
	  get maxSplitUnitPixel() {
	    return this.splitUnit * this.source.width;
	  }
	  get scale() {
	    return {
	      x: this._inputLimitScale * this._outputLimitScale,
	      y: this._inputLimitScale * this._outputLimitScale
	    };
	  }
	  static strategy(t) {
	    if (!t.regionCurves) return [];
	    const e = [];
	    return t.regionBoundaryCurves.forEach((i, n) => {
	      const r = [];
	      i.forEach((e, i) => {
	        const o = [],
	          {
	            vertical: s,
	            horizontal: a
	          } = t.regionCurves[n][i];
	        for (let t = 0; t < a.length; t++) for (let e = 0; e < s.length; e++) {
	          const i = s[e].get(t / (a.length - 1)),
	            n = a[t].get(e / (s.length - 1));
	          o.push({
	            x: (i.x + n.x) / 2,
	            y: (i.y + n.y) / 2
	          });
	        }
	        r.push(o);
	      }), e.push(r);
	    }), e;
	  }
	  static serializeWarpState(t) {
	    const {
	        splitPoints: e,
	        regionBounds: i
	      } = t,
	      n = [e.length, i.length, i[0].length];
	    e.forEach(t => {
	      n.push(t.x, t.y);
	    });
	    const r = ["top", "right", "bottom", "left"];
	    i.forEach(t => t.forEach(t => [r.forEach(e => t[e].forEach(t => {
	      n.push(t.x, t.y);
	    }))]));
	    const o = new Float32Array(n),
	      s = new Uint8Array(o.buffer);
	    return btoa(String.fromCharCode.apply(null, s));
	  }
	  static deserializeWarpState(t) {
	    const e = atob(t),
	      i = new Uint8Array(e.length);
	    for (let t = 0; t < e.length; t++) i[t] = e.charCodeAt(t);
	    const n = new Float32Array(i.buffer),
	      r = Array.from(n),
	      o = ["top", "right", "bottom", "left"],
	      s = r[0],
	      a = r[1],
	      h = r[2];
	    let c = 3;
	    const l = [];
	    for (let t = 0; t < s; t++) l.push({
	      x: r[c],
	      y: r[c + 1]
	    }), c += 2;
	    const u = [];
	    for (let t = 0; t < a; t++) {
	      const t = [];
	      for (let e = 0; e < h; e++) {
	        const e = {};
	        for (const t of o) {
	          e[t] = [];
	          for (let i = 0; i < 4; i++) e[t].push({
	            x: r[c],
	            y: r[c + 1]
	          }), c += 2;
	        }
	        t.push(e);
	      }
	      u.push(t);
	    }
	    return {
	      splitPoints: l,
	      regionBounds: u
	    };
	  }
	  _initializeSplitPoints(t = 1, e = 1) {
	    const i = Math.max(Math.floor(t), 1),
	      n = Math.max(Math.floor(e), 1),
	      r = [];
	    for (let o = 1; o < i; o++) for (let i = 1; i < n; i++) o === i && r.push({
	      x: i / e,
	      y: o / t
	    });
	    return r;
	  }
	  _initializeOriginalRegions() {
	    const {
	      width: t,
	      height: e
	    } = this.source;
	    let i = [],
	      n = [];
	    this.splitPoints.forEach(t => {
	      t.x < 0 || t.x > 1 || t.y < 0 || t.y > 1 || (i.push(t.x), n.push(t.y));
	    }), i = [...new Set([0, ...i, 1])], n = [...new Set([0, ...n, 1])], i.sort((t, e) => t - e), n.sort((t, e) => t - e);
	    const r = [];
	    for (let o = 0; o < n.length - 1; o++) {
	      r.push([]);
	      for (let s = 0; s < i.length - 1; s++) r[r.length - 1].push({
	        tl: {
	          x: i[s] * t,
	          y: n[o] * e
	        },
	        tr: {
	          x: i[s + 1] * t,
	          y: n[o] * e
	        },
	        bl: {
	          x: i[s] * t,
	          y: n[o + 1] * e
	        },
	        br: {
	          x: i[s + 1] * t,
	          y: n[o + 1] * e
	        }
	      });
	    }
	    return r;
	  }
	  _calculateSamplingPoints(t) {
	    const e = t.tr.x - t.tl.x,
	      i = t.bl.y - t.tl.y,
	      n = Math.max(Math.ceil(e / this.maxSplitUnitPixel), 1) + 1,
	      r = Math.max(Math.ceil(i / this.maxSplitUnitPixel), 1) + 1;
	    return {
	      hts: Array.from({
	        length: n
	      }).map((t, e) => e / (n - 1)),
	      vts: Array.from({
	        length: r
	      }).map((t, e) => e / (r - 1))
	    };
	  }
	  _initializeOriginalRegionPoints() {
	    return this.originalRegions.map(t => t.map(t => {
	      const {
	          hts: e,
	          vts: i
	        } = this._calculateSamplingPoints(t),
	        n = [],
	        {
	          tl: r,
	          tr: o,
	          bl: s
	        } = t,
	        a = o.x - r.x,
	        h = s.y - r.y;
	      for (let t = 0; t < i.length; t++) for (let o = 0; o < e.length; o++) n.push({
	        x: r.x + a * e[o],
	        y: r.y + h * i[t]
	      });
	      return n;
	    }));
	  }
	  _initializeBoundaryControlPoints(t) {
	    const e = [];
	    return t.forEach(t => {
	      e.push([]), t.forEach(t => {
	        const {
	            tl: i,
	            tr: n,
	            br: r,
	            bl: o
	          } = t,
	          s = {
	            top: [i, n],
	            bottom: [o, r],
	            left: [i, o],
	            right: [n, r]
	          },
	          a = {};
	        for (const t in s) {
	          const [e, i] = s[t];
	          a[t] = [e, {
	            x: e.x + 1 * (i.x - e.x) / 3,
	            y: e.y + 1 * (i.y - e.y) / 3
	          }, {
	            x: i.x - 1 * (i.x - e.x) / 3,
	            y: i.y - 1 * (i.y - e.y) / 3
	          }, i];
	        }
	        e[e.length - 1].push(a);
	      });
	    }), e;
	  }
	  _generateRegionCurves(t, e, i) {
	    const n = {
	      horizontal: [],
	      vertical: []
	    };
	    return e.forEach(e => {
	      if (0 === e) return void n.vertical.push(t.left);
	      if (1 === e) return void n.vertical.push(t.right);
	      const i = t.top.get(e),
	        r = t.bottom.get(e),
	        o = new T$1([i, {
	          x: i.x + ((t.left.points[1].x - t.left.points[0].x) * (1 - e) + (t.right.points[1].x - t.right.points[0].x) * e),
	          y: i.y + ((t.left.points[1].y - t.left.points[0].y) * (1 - e) + (t.right.points[1].y - t.right.points[0].y) * e)
	        }, {
	          x: r.x + ((t.left.points[2].x - t.left.points[3].x) * (1 - e) + (t.right.points[2].x - t.right.points[3].x) * e),
	          y: r.y + ((t.left.points[2].y - t.left.points[3].y) * (1 - e) + (t.right.points[2].y - t.right.points[3].y) * e)
	        }, r]);
	      n.vertical.push(o);
	    }), i.forEach(e => {
	      if (0 === e) return void n.horizontal.push(t.top);
	      if (1 === e) return void n.horizontal.push(t.bottom);
	      const i = t.left.get(e),
	        r = t.right.get(e),
	        o = new T$1([i, {
	          x: i.x + ((t.top.points[1].x - t.top.points[0].x) * (1 - e) + (t.bottom.points[1].x - t.bottom.points[0].x) * e),
	          y: i.y + ((t.top.points[1].y - t.top.points[0].y) * (1 - e) + (t.bottom.points[1].y - t.bottom.points[0].y) * e)
	        }, {
	          x: r.x + ((t.top.points[2].x - t.top.points[3].x) * (1 - e) + (t.bottom.points[2].x - t.bottom.points[3].x) * e),
	          y: r.y + ((t.top.points[2].y - t.top.points[3].y) * (1 - e) + (t.bottom.points[2].y - t.bottom.points[3].y) * e)
	        }, r]);
	      n.horizontal.push(o);
	    }), n;
	  }
	  _generateAllRegionCurves(t) {
	    const e = [];
	    return t.forEach((t, i) => {
	      const n = [];
	      e.push(n), t.forEach((t, e) => {
	        const r = t,
	          o = this.originalRegions[i][e],
	          {
	            hts: s,
	            vts: a
	          } = this._calculateSamplingPoints(o);
	        n.push(this._generateRegionCurves(r, s, a));
	      });
	    }), e;
	  }
	  setSplitUnit(t) {
	    return this.splitUnit = t <= 0 ? 1 : Math.min(1, t), this.originalRegionPoints = this._initializeOriginalRegionPoints(), this;
	  }
	  setSplitStrategy(t) {
	    return this.splitStrategy = t, this;
	  }
	  setInputLimitSize(t) {
	    return this._inputLimitSize = t, t || (this._inputLimitScale = 1, this._cacheInputCanvas = null), this._cacheSourceImageData = null, this;
	  }
	  setOutputLimitSize(t) {
	    return this._outputLimitSize = t, t || (this._outputLimitScale = 1), this;
	  }
	  setRenderingContext(t) {
	    return this.renderingContext = t, this;
	  }
	  setRenderingCanvas(t) {
	    return this._cacheOutputCanvas = t, this;
	  }
	  setRenderingConfig(t) {
	    return this.renderingConfig = Object.assign(Object.assign({}, this.renderingConfig), t), this;
	  }
	  getBoundingBoxInfo() {
	    const {
	        padding: t
	      } = this.renderingConfig,
	      e = this.regionCurves.length,
	      i = this.regionCurves[0].length,
	      n = {
	        left: 1 / 0,
	        right: -1 / 0,
	        top: 1 / 0,
	        bottom: -1 / 0
	      };
	    for (let t = 0; t < e; t++) for (let e = 0; e < i; e++) {
	      const i = this.regionCurves[t][e];
	      Object.values(i).forEach(t => {
	        const e = t.length;
	        for (let i = 0; i < e; i++) {
	          const e = t[i].bbox();
	          n.left = Math.min(n.left, e.x.min), n.right = Math.max(n.right, e.x.max), n.top = Math.min(n.top, e.y.min), n.bottom = Math.max(n.bottom, e.y.max);
	        }
	      });
	    }
	    return {
	      offsetX: -n.left + t,
	      offsetY: -n.top + t,
	      width: n.right - n.left + 2 * t,
	      height: n.bottom - n.top + 2 * t
	    };
	  }
	  _cloneCanvas(t, e = t.width, i = t.height) {
	    const n = document.createElement("canvas");
	    n.width = e, n.height = i;
	    const r = n.getContext("2d");
	    return null == r || r.drawImage(t, 0, 0, e, i), n;
	  }
	  _createLinearBezier(t, e) {
	    return [t, {
	      x: t.x + 1 * (e.x - t.x) / 3,
	      y: t.y + 1 * (e.y - t.y) / 3
	    }, {
	      x: e.x - 1 * (e.x - t.x) / 3,
	      y: e.y - 1 * (e.y - t.y) / 3
	    }, e];
	  }
	  _mergeBezierCurves(t, e) {
	    const i = (t, e, i) => {
	        const {
	            x: n,
	            y: r
	          } = e,
	          {
	            x: o,
	            y: s
	          } = i,
	          a = Math.atan2(r, n),
	          h = Math.atan2(s, o) - a,
	          c = Math.sqrt(Math.pow(o, 2) + Math.pow(s, 2)) * Math.cos(h),
	          l = c * Math.cos(a),
	          u = c * Math.sin(a);
	        return {
	          x: t.x + l,
	          y: t.y + u
	        };
	      },
	      n = i(t[1], {
	        x: t[1].x - t[0].x,
	        y: t[1].y - t[0].y
	      }, {
	        x: e[1].x - e[0].x,
	        y: e[1].y - e[0].y
	      }),
	      r = i(e[2], {
	        x: e[2].x - e[3].x,
	        y: e[2].y - e[3].y
	      }, {
	        x: t[2].x - t[3].x,
	        y: t[2].y - t[3].y
	      });
	    return [t[0], n, r, e[3]];
	  }
	  _findConnectedVertex(t, e) {
	    const i = {
	      top: [["left", 0], ["right", 0]],
	      bottom: [["left", 3], ["right", 3]],
	      left: [["top", 0], ["bottom", 0]],
	      right: [["top", 3], ["bottom", 3]]
	    }[t];
	    if (!i || !["first", "last"].includes(e)) throw TypeError(`[Warpvas] Invalid vertex connection parameters: direction="${t}", position="${e}"\nExpected values:\n- direction: "top" | "bottom" | "left" | "right"\n- position: "first" | "last"`);
	    const n = i[{
	      first: 0,
	      last: 1
	    }[e]];
	    return {
	      direction: n[0],
	      position: {
	        0: "first",
	        3: "last"
	      }[n[1]]
	    };
	  }
	  _setSingleRegionVertexCoord(t, e, i, n, r = !0) {
	    const o = (i, n, o) => {
	        var s, a;
	        const h = null === (a = null === (s = this.regionBoundaryCurves[t]) || void 0 === s ? void 0 : s[e]) || void 0 === a ? void 0 : a[i];
	        if (!h) return;
	        const c = "first" === n ? o : h.points[0],
	          l = "last" === n ? o : h.points[3];
	        h.points.forEach((t, e) => {
	          if (!r && [1, 2].includes(e)) return;
	          const i = this._createLinearBezier(c, l)[e];
	          t.x = i.x, t.y = i.y;
	        });
	      },
	      [s, a] = {
	        [$.TOP_LEFT]: ["top", "first"],
	        [$.TOP_RIGHT]: ["top", "last"],
	        [$.BOTTOM_LEFT]: ["bottom", "first"],
	        [$.BOTTOM_RIGHT]: ["bottom", "last"]
	      }[i];
	    o(s, a, n);
	    const h = this._findConnectedVertex(s, a);
	    o(h.direction, h.position, n);
	  }
	  updateVertexCoord(t, e, i, n, r = !0) {
	    this._setSingleRegionVertexCoord(t, e, i, n, r);
	    return {
	      [$.TOP_LEFT]: [{
	        row: t - 1,
	        col: e - 1,
	        type: $.BOTTOM_RIGHT
	      }, {
	        row: t - 1,
	        col: e,
	        type: $.BOTTOM_LEFT
	      }, {
	        row: t,
	        col: e - 1,
	        type: $.TOP_RIGHT
	      }],
	      [$.TOP_RIGHT]: [{
	        row: t - 1,
	        col: e + 1,
	        type: $.BOTTOM_LEFT
	      }, {
	        row: t,
	        col: e + 1,
	        type: $.TOP_LEFT
	      }, {
	        row: t - 1,
	        col: e,
	        type: $.BOTTOM_RIGHT
	      }],
	      [$.BOTTOM_LEFT]: [{
	        row: t,
	        col: e - 1,
	        type: $.BOTTOM_RIGHT
	      }, {
	        row: t + 1,
	        col: e,
	        type: $.TOP_LEFT
	      }, {
	        row: t + 1,
	        col: e - 1,
	        type: $.TOP_RIGHT
	      }],
	      [$.BOTTOM_RIGHT]: [{
	        row: t,
	        col: e + 1,
	        type: $.BOTTOM_LEFT
	      }, {
	        row: t + 1,
	        col: e,
	        type: $.TOP_RIGHT
	      }, {
	        row: t + 1,
	        col: e + 1,
	        type: $.TOP_LEFT
	      }]
	    }[i].forEach(({
	      row: t,
	      col: e,
	      type: i
	    }) => {
	      this._setSingleRegionVertexCoord(t, e, i, n, r);
	    }), this;
	  }
	  updateRegionBoundCoords(t, e, i, n) {
	    return this.regionBoundaryCurves = this._initializeRegionBoundaryCurves(this.forEachRegionBoundCoords((r, o, s, a) => r === t && o === e && i === s ? n : a.points.map(t => ({
	      x: t.x,
	      y: t.y
	    })))), this.updateVertexCoord(t, e, {
	      top: $.TOP_LEFT,
	      right: $.TOP_RIGHT,
	      bottom: $.BOTTOM_LEFT,
	      left: $.TOP_LEFT
	    }[i], n[0], !1), this.updateVertexCoord(t, e, {
	      top: $.TOP_RIGHT,
	      right: $.BOTTOM_RIGHT,
	      bottom: $.BOTTOM_RIGHT,
	      left: $.BOTTOM_LEFT
	    }[i], n[3], !1), this;
	  }
	  forEachRegionBoundCoords(t = (t, e, i, n) => n.points) {
	    const e = [];
	    return this.regionBoundaryCurves.forEach((i, n) => {
	      e.push([]), i.forEach((i, r) => {
	        e[e.length - 1].push(["top", "right", "left", "bottom"].reduce((e, o) => (e[o] = t(n, r, o, i[o]), e), {}));
	      });
	    }), e;
	  }
	  _initializeRegionBoundaryCurves(t) {
	    const e = [];
	    return t.forEach((t, i) => {
	      e.push([]), t.forEach((t, n) => {
	        var r, o, s, a;
	        const h = {};
	        for (const c in t) {
	          switch (c) {
	            case "top":
	              {
	                const t = null === (o = null === (r = e[i - 1]) || void 0 === r ? void 0 : r[n]) || void 0 === o ? void 0 : o.bottom;
	                t && (h[c] = t);
	                break;
	              }
	            case "left":
	              {
	                const t = null === (a = null === (s = e[i]) || void 0 === s ? void 0 : s[n - 1]) || void 0 === a ? void 0 : a.right;
	                t && (h[c] = t);
	                break;
	              }
	          }
	          if (!h[c]) {
	            const e = t[c];
	            h[c] = new T$1(e[0].x, e[0].y, e[1].x, e[1].y, e[2].x, e[2].y, e[3].x, e[3].y);
	          }
	        }
	        e[e.length - 1].push(h);
	      });
	    }), e;
	  }
	  getWarpState() {
	    const t = this.forEachRegionBoundCoords();
	    return {
	      splitPoints: this.splitPoints,
	      regionBounds: t
	    };
	  }
	  setWarpState(t, e = null) {
	    this.splitPoints = t;
	    const {
	      width: i,
	      height: n
	    } = this.source;
	    if (this._cacheSourceSize = {
	      width: i,
	      height: n
	    }, this.originalRegions = this._initializeOriginalRegions(), this.originalRegionPoints = this._initializeOriginalRegionPoints(), e) this.regionBoundaryCurves = this._initializeRegionBoundaryCurves(e);else {
	      const t = this._initializeBoundaryControlPoints(this.originalRegions);
	      this.regionBoundaryCurves = this._initializeRegionBoundaryCurves(t);
	    }
	    return this;
	  }
	  resetWarpState(t = 1, e = 1) {
	    return this.splitPoints = this._initializeSplitPoints(t, e), this.setWarpState(this.splitPoints);
	  }
	  isUnwarped() {
	    const t = this.forEachRegionBoundCoords((t, e, i, n) => n.points.map(t => ({
	      x: t.x / this.source.width,
	      y: t.y / this.source.height
	    })));
	    return 0 === this.splitPoints.length && Object.entries(t[0][0]).every(([t, e]) => {
	      const i = ["right", "bottom"].includes(t) ? 1 : 0,
	        n = {
	          top: "y",
	          bottom: "y",
	          left: "x",
	          right: "x"
	        }[t],
	        r = {
	          top: "x",
	          bottom: "x",
	          left: "y",
	          right: "y"
	        }[t];
	      return e.every(t => t[n] === i) && 0 === e[0][r] && Math.abs(e[1][r] - 1 / 3) < Number.EPSILON && Math.abs(e[2][r] - 2 / 3) < Number.EPSILON && 1 === e[3][r];
	    });
	  }
	  getHitInfo(t) {
	    let e = null;
	    try {
	      this.forEachSplitRegion(([i, n, r, o], s, a, h, c, l) => {
	        const u = B$1(t, i, n, o),
	          p = B$1(t, r, n, o);
	        if (u || p) throw e = {
	          rowIndex: c,
	          colIndex: l,
	          row: a,
	          col: h,
	          after: [i, n, r, o],
	          before: s,
	          clickPart: u ? 0 : 1
	        }, Error();
	      });
	    } catch (t) {}
	    return e;
	  }
	  splitRegionByPoint(t, e, i, n = .05) {
	    const {
	      tl: r,
	      tr: o,
	      bl: s
	    } = this.originalRegions[t][e];
	    let a = (i.x - r.x) / (o.x - r.x),
	      h = (i.y - r.y) / (s.y - r.y);
	    a < n && (a = 0), a > 1 - n && (a = 1), h < n && (h = 0), h > 1 - n && (h = 1);
	    const c = [];
	    this.regionBoundaryCurves.forEach((e, i) => {
	      if (i !== t || 0 === h || 1 === h) return void c.push(e.map(t => {
	        const e = {};
	        for (const i in t) e[i] = t[i].points;
	        return e;
	      }));
	      const n = [],
	        r = [];
	      e.forEach(t => {
	        const {
	            horizontal: e,
	            vertical: i
	          } = this._generateRegionCurves(t, [0, 1], [0, h, 1]),
	          {
	            left: o,
	            right: s
	          } = i[0].split(h),
	          {
	            left: a,
	            right: c
	          } = i[1].split(h);
	        n.push({
	          left: o.points,
	          right: a.points,
	          top: e[0].points,
	          bottom: e[1].points
	        }), r.push({
	          left: s.points,
	          right: c.points,
	          top: e[1].points,
	          bottom: e[2].points
	        });
	      }), c.push(n, r);
	    }), 0 !== a && 1 !== a && c.forEach((t, i) => {
	      const {
	          horizontal: n,
	          vertical: r
	        } = this._generateRegionCurves({
	          left: new T$1(t[e].left),
	          right: new T$1(t[e].right),
	          top: new T$1(t[e].top),
	          bottom: new T$1(t[e].bottom)
	        }, [0, a, 1], [0, 1]),
	        {
	          left: o,
	          right: s
	        } = n[0].split(a),
	        {
	          left: h,
	          right: l
	        } = n[1].split(a);
	      c[i].splice(e, 1, {
	        left: r[0].points,
	        right: r[1].points,
	        top: o.points,
	        bottom: h.points
	      }, {
	        left: r[1].points,
	        right: r[2].points,
	        top: s.points,
	        bottom: l.points
	      });
	    }), this.setWarpState([...this.splitPoints, {
	      x: (0 === a ? r.x : 1 === a ? o.x : i.x) / this.source.width,
	      y: (0 === h ? r.y : 1 === h ? s.y : i.y) / this.source.height
	    }], c);
	  }
	  removeRegion(...t) {
	    const e = [],
	      {
	        width: i,
	        height: n
	      } = this.source,
	      r = (r, o, s) => {
	        t.some(t => t.row === o || t.column === s) || 0 === o && 0 === s || o === this.originalRegions.length && 0 === s || 0 === o && s === this.originalRegions[0].length || o === this.originalRegions.length && s === this.originalRegions[0].length || e.some(t => t.x === r.x || 0 === s || s === this.originalRegions[0].length) && e.some(t => t.y === r.y || 0 === o || o === this.originalRegions.length) || e.push({
	          x: r.x / i,
	          y: r.y / n
	        });
	      };
	    this.originalRegions.forEach((t, e) => {
	      t.forEach((i, n) => {
	        const {
	          tl: o,
	          tr: s,
	          bl: a,
	          br: h
	        } = i;
	        r(o, e, n), n === t.length - 1 && r(s, e, n + 1), e === this.originalRegions.length - 1 && (r(a, e + 1, n), n === t.length - 1 && r(h, e + 1, n + 1));
	      });
	    });
	    const o = this.forEachRegionBoundCoords(),
	      s = [...new Set(t.map(t => t.row))];
	    s.sort((t, e) => e - t), s.forEach(t => {
	      const e = o[t],
	        i = o[t - 1];
	      e && i && o.splice(t - 1, 2, i.map((t, i) => ({
	        top: t.top,
	        left: this._mergeBezierCurves(t.left, e[i].left),
	        right: this._mergeBezierCurves(t.right, e[i].right),
	        bottom: e[i].bottom
	      })));
	    });
	    const a = [...new Set(t.map(t => t.column))];
	    a.sort((t, e) => e - t), a.forEach(t => {
	      o.forEach(e => {
	        const i = e[t],
	          n = e[t - 1];
	        i && n && e.splice(t - 1, 2, {
	          top: this._mergeBezierCurves(n.top, i.top),
	          left: n.left,
	          right: i.right,
	          bottom: this._mergeBezierCurves(n.bottom, i.bottom)
	        });
	      });
	    }), this.setWarpState(e, o);
	  }
	  forEachSplitRegion(t) {
	    this.regionPoints.forEach((e, i) => {
	      e.forEach((e, n) => {
	        const r = e,
	          o = this.regionCurves[i][n].vertical.length - 1;
	        r.forEach((e, s) => {
	          const a = Math.floor(s / (o + 1)),
	            h = s % (o + 1),
	            c = r[s],
	            l = r[s + 1],
	            u = r[s + o + 2],
	            p = r[s + o + 1],
	            g = this.originalRegionPoints[i][n][s],
	            x = this.originalRegionPoints[i][n][s + 1],
	            f = this.originalRegionPoints[i][n][s + o + 2],
	            y = this.originalRegionPoints[i][n][s + o + 1];
	          l && u && s % (o + 1) < o && t([c, l, u, p], [g, x, f, y], a, h, i, n);
	        });
	      });
	    });
	  }
	  _generateRenderOptions() {
	    var t, e;
	    !this._cacheSourceSize || this._cacheSourceSize.width === this.source.width && this._cacheSourceSize.height === this.source.height || this.setWarpState(this.splitPoints), this.regionCurves = this._generateAllRegionCurves(this.regionBoundaryCurves), this.regionPoints = this.splitStrategy.execute(this);
	    const {
	      offsetX: i,
	      offsetY: n,
	      width: r,
	      height: o
	    } = this.getBoundingBoxInfo();
	    if (this._inputLimitSize && !this._cacheInputCanvas) {
	      const t = this._inputLimitSize,
	        {
	          width: e,
	          height: i
	        } = this.source,
	        n = {
	          width: t.width ? Math.min(1, t.width / e) : 0,
	          height: t.height ? Math.min(1, t.height / i) : 0
	        };
	      n.width = n.width || n.height, n.height = n.height || n.width;
	      const r = Math.min(n.width, n.height),
	        o = document.createElement("canvas");
	      o.width = Math.ceil(e * r), o.height = Math.ceil(i * r);
	      const s = o.getContext("2d");
	      null == s || s.drawImage(this.source, 0, 0, o.width, o.height), this._inputLimitScale = r, this._cacheInputCanvas = o;
	    }
	    if (this._outputLimitSize) {
	      let t = 1;
	      this._outputLimitSize.width && (t = Math.min(t, this._outputLimitSize.width / r)), this._outputLimitSize.height && (t = Math.min(t, this._outputLimitSize.height / o)), this._outputLimitScale = t;
	    }
	    let s = null !== (t = this._cacheInputCanvas) && void 0 !== t ? t : this.source;
	    const a = null !== (e = this._cacheOutputCanvas) && void 0 !== e ? e : null;
	    s === a && (console.warn("[Warpvas] Do not use the same canvas as both input and output. This will require creating a copy of the input canvas before each render operation."), s = this._cloneCanvas(s));
	    return {
	      inputCanvas: s,
	      outputCanvas: a,
	      options: {
	        x: i,
	        y: n,
	        width: r,
	        height: o,
	        sourceScale: this._inputLimitScale,
	        destinationScale: this._outputLimitScale
	      }
	    };
	  }
	  _getInputCanvasImageData(t = !0) {
	    var e;
	    if (t && this._cacheSourceImageData) return this._cacheSourceImageData;
	    const i = null !== (e = this._cacheInputCanvas) && void 0 !== e ? e : this.source,
	      n = i.getContext("2d");
	    if (!n) throw new Error("[Warpvas] Failed to get 2D rendering context. Please ensure that:\n1. The inputCanvas is a valid <canvas> element\n2. The browser supports Canvas API\n3. The canvas has not been tainted by cross-origin content");
	    const r = n.getImageData(0, 0, i.width, i.height);
	    return this._cacheSourceImageData = r, r;
	  }
	  render() {
	    const {
	      inputCanvas: t,
	      outputCanvas: e,
	      options: i
	    } = this._generateRenderOptions();
	    if (this._safeModeEnabled) return L(this, t, e, i);
	    const n = {
	      "2d": L,
	      webgl: D
	    }[this.renderingContext];
	    try {
	      return n(this, t, e, i);
	    } catch (n) {
	      if (this.renderingConfig.enableSafeRendering && "webgl" === this.renderingContext) return this._safeModeEnabled = !0, L(this, t, e, i);
	      throw n;
	    }
	  }
	  renderWithWorker(t = !0) {
	    return e$1(this, void 0, void 0, function* () {
	      const {
	          outputCanvas: e,
	          options: i
	        } = this._generateRenderOptions(),
	        n = this._getInputCanvasImageData(t);
	      if (this._safeModeEnabled) return H(this, n, e, i);
	      const r = {
	        "2d": N,
	        webgl: H
	      }[this.renderingContext];
	      try {
	        return r(this, n, e, i);
	      } catch (t) {
	        if (this.renderingConfig.enableSafeRendering && "webgl" === this.renderingContext) return this._safeModeEnabled = !0, H(this, n, e, i);
	        throw t;
	      }
	    });
	  }
	  dispose() {
	    this._safeModeEnabled = !1, this._cacheInputCanvas && (this._cacheInputCanvas.width = 0, this._cacheInputCanvas.height = 0, this._cacheInputCanvas = null), this._cacheOutputCanvas && (this._cacheOutputCanvas.width = 0, this._cacheOutputCanvas.height = 0, this._cacheOutputCanvas = null), this._cacheSourceImageData = null, this._cacheSourceSize = null, this.splitPoints = [], this.originalRegions = [], this.originalRegionPoints = [], this.regionBoundaryCurves = [], this.regionCurves = [], this.regionPoints = [];
	  }
	}

	"function" == typeof SuppressedError && SuppressedError;
	const n = (t, n, e) => {
	    if (t.x === n.x) return {
	      x: t.x,
	      y: e.y
	    };
	    if (t.y === n.y) return {
	      x: e.x,
	      y: t.y
	    };
	    const r = (n.y - t.y) / (n.x - t.x),
	      i = -1 / r,
	      s = (-r * t.x + t.y + i * e.x - e.y) / (i - r);
	    return {
	      x: s,
	      y: r * (s - t.x) + t.y
	    };
	  },
	  e = (t, n) => Math.sqrt(Math.pow(n.x - t.x, 2) + Math.pow(n.y - t.y, 2)),
	  r = (t, n, e) => {
	    const r = Object.assign({}, t),
	      i = {
	        x: n.x - t.x,
	        y: n.y - t.y
	      };
	    if (0 === i.x && 0 === i.y) return r;
	    if (0 === i.x) r.y += e * Math.sign(i.y);else if (0 === i.y) r.x += e * Math.sign(i.x);else {
	      const t = Math.sqrt(Math.pow(i.x, 2) + Math.pow(i.y, 2));
	      r.x += i.x * (e / t), r.y += i.y * (e / t);
	    }
	    return r;
	  };
	var i,
	  s,
	  o = Object.freeze({
	    __proto__: null,
	    calcBoundingBox: (t, n, e) => {
	      const r = Math.min(t.x, n.x, e.x),
	        i = Math.max(t.x, n.x, e.x),
	        s = Math.min(t.y, n.y, e.y);
	      return {
	        width: i - r,
	        height: Math.max(t.y, n.y, e.y) - s
	      };
	    },
	    calcCoordDistance: e,
	    calcExpandCoord: (t, i, s, o = 1) => {
	      const c = n(i, s, t),
	        u = e(t, c),
	        a = r(t, c, u + o);
	      return {
	        x: a.x - c.x + i.x,
	        y: a.y - c.y + i.y
	      };
	    },
	    calcIntersection: (t, n, e, r) => {
	      const i = (t, n) => Math.abs(t - n) < Math.pow(.1, 12);
	      if (i(t.x, n.x) && i(e.x, r.x)) return null;
	      if (i(t.y, n.y) && i(e.y, r.y)) return null;
	      const s = 1e4 * (n.y - t.y) / Math.round(1e4 * (n.x - t.x)),
	        o = 1e4 * (r.y - e.y) / Math.round(1e4 * (r.x - e.x)),
	        c = t.y - s * t.x,
	        u = e.y - o * e.x;
	      if (Math.abs(s) === 1 / 0) return {
	        x: t.x,
	        y: o * t.x + u
	      };
	      if (Math.abs(o) === 1 / 0) return {
	        x: e.x,
	        y: s * e.x + c
	      };
	      const a = (u - c) / (s - o);
	      return {
	        x: a,
	        y: s * a + c
	      };
	    },
	    calcMatrix: (t, n) => {
	      const [e, r, i] = t,
	        [s, o, c] = n,
	        u = .1 / Math.abs([...t, ...n].reduce((t, n) => Math.min(t, n.x, n.y), -1)),
	        a = (t, n, e) => {
	          const [r, i, s, o] = t.map(Number),
	            [c, u, a, h] = n.map(Number),
	            [l, x, y, f] = e.map(Number),
	            p = s - i * a / u,
	            m = a - u * y / x,
	            d = h - u * f / x,
	            g = c - u * l / x,
	            z = (p / m * d - (o - i * h / u)) / (p / m * g - (r - i * c / u)),
	            b = (d - g * z) / m;
	          return {
	            x: z,
	            y: (o - r * z - s * b) / i,
	            z: b
	          };
	        },
	        h = [s.x + u, s.y + u, 1, e.x + u],
	        l = [o.x + u, o.y + u, 1, r.x + u],
	        x = [c.x + u, c.y + u, 1, i.x + u],
	        y = a(h, l, x);
	      h[3] = e.y + u, l[3] = r.y + u, x[3] = i.y + u;
	      const f = a(h, l, x),
	        p = y.x,
	        m = y.y,
	        d = y.z;
	      return [p, f.x, m, f.y, d, f.z];
	    },
	    calcPerpendicularIntersection: n,
	    calcRelativeCoord: r,
	    isTriangleContainsPoint: (t, n, e, r, i = .1) => {
	      const s = (t, n, e) => Math.abs(t.x * (n.y - e.y) + n.x * (e.y - t.y) + e.x * (t.y - n.y)) / 2,
	        o = s(n, e, r);
	      return s(n, e, t) + s(e, r, t) + s(r, n, t) <= o + i;
	    }
	  });
	!function (t) {
	  t.TOP_LEFT = "tl", t.TOP_RIGHT = "tr", t.BOTTOM_LEFT = "bl", t.BOTTOM_RIGHT = "br";
	}(i || (i = {})), function (t) {
	  t.TOP = "top", t.BOTTOM = "bottom", t.LEFT = "left", t.RIGHT = "right";
	}(s || (s = {}));
	const {
	  abs: c,
	  cos: u,
	  sin: a,
	  acos: h,
	  atan2: l,
	  sqrt: x,
	  pow: y
	} = Math;
	function f(t) {
	  return t < 0 ? -y(-t, 1 / 3) : y(t, 1 / 3);
	}
	const p = Math.PI,
	  m = 2 * p,
	  d = p / 2,
	  g = Number.MAX_SAFE_INTEGER || 9007199254740991,
	  z = Number.MIN_SAFE_INTEGER || -9007199254740991,
	  b = {
	    x: 0,
	    y: 0,
	    z: 0
	  },
	  v = {
	    Tvalues: [-.06405689286260563, .06405689286260563, -.1911188674736163, .1911188674736163, -.3150426796961634, .3150426796961634, -.4337935076260451, .4337935076260451, -.5454214713888396, .5454214713888396, -.6480936519369755, .6480936519369755, -.7401241915785544, .7401241915785544, -.820001985973903, .820001985973903, -.8864155270044011, .8864155270044011, -.9382745520027328, .9382745520027328, -.9747285559713095, .9747285559713095, -.9951872199970213, .9951872199970213],
	    Cvalues: [.12793819534675216, .12793819534675216, .1258374563468283, .1258374563468283, .12167047292780339, .12167047292780339, .1155056680537256, .1155056680537256, .10744427011596563, .10744427011596563, .09761865210411388, .09761865210411388, .08619016153195327, .08619016153195327, .0733464814110803, .0733464814110803, .05929858491543678, .05929858491543678, .04427743881741981, .04427743881741981, .028531388628933663, .028531388628933663, .0123412297999872, .0123412297999872],
	    arcfn: function (t, n) {
	      const e = n(t);
	      let r = e.x * e.x + e.y * e.y;
	      return void 0 !== e.z && (r += e.z * e.z), x(r);
	    },
	    compute: function (t, n, e) {
	      if (0 === t) return n[0].t = 0, n[0];
	      const r = n.length - 1;
	      if (1 === t) return n[r].t = 1, n[r];
	      const i = 1 - t;
	      let s = n;
	      if (0 === r) return n[0].t = t, n[0];
	      if (1 === r) {
	        const n = {
	          x: i * s[0].x + t * s[1].x,
	          y: i * s[0].y + t * s[1].y,
	          t: t
	        };
	        return e && (n.z = i * s[0].z + t * s[1].z), n;
	      }
	      if (r < 4) {
	        let n,
	          o,
	          c,
	          u = i * i,
	          a = t * t,
	          h = 0;
	        2 === r ? (s = [s[0], s[1], s[2], b], n = u, o = i * t * 2, c = a) : 3 === r && (n = u * i, o = u * t * 3, c = i * a * 3, h = t * a);
	        const l = {
	          x: n * s[0].x + o * s[1].x + c * s[2].x + h * s[3].x,
	          y: n * s[0].y + o * s[1].y + c * s[2].y + h * s[3].y,
	          t: t
	        };
	        return e && (l.z = n * s[0].z + o * s[1].z + c * s[2].z + h * s[3].z), l;
	      }
	      const o = JSON.parse(JSON.stringify(n));
	      for (; o.length > 1;) {
	        for (let n = 0; n < o.length - 1; n++) o[n] = {
	          x: o[n].x + (o[n + 1].x - o[n].x) * t,
	          y: o[n].y + (o[n + 1].y - o[n].y) * t
	        }, void 0 !== o[n].z && (o[n].z = o[n].z + (o[n + 1].z - o[n].z) * t);
	        o.splice(o.length - 1, 1);
	      }
	      return o[0].t = t, o[0];
	    },
	    computeWithRatios: function (t, n, e, r) {
	      const i = 1 - t,
	        s = e,
	        o = n;
	      let c,
	        u = s[0],
	        a = s[1],
	        h = s[2],
	        l = s[3];
	      return u *= i, a *= t, 2 === o.length ? (c = u + a, {
	        x: (u * o[0].x + a * o[1].x) / c,
	        y: (u * o[0].y + a * o[1].y) / c,
	        z: !!r && (u * o[0].z + a * o[1].z) / c,
	        t: t
	      }) : (u *= i, a *= 2 * i, h *= t * t, 3 === o.length ? (c = u + a + h, {
	        x: (u * o[0].x + a * o[1].x + h * o[2].x) / c,
	        y: (u * o[0].y + a * o[1].y + h * o[2].y) / c,
	        z: !!r && (u * o[0].z + a * o[1].z + h * o[2].z) / c,
	        t: t
	      }) : (u *= i, a *= 1.5 * i, h *= 3 * i, l *= t * t * t, 4 === o.length ? (c = u + a + h + l, {
	        x: (u * o[0].x + a * o[1].x + h * o[2].x + l * o[3].x) / c,
	        y: (u * o[0].y + a * o[1].y + h * o[2].y + l * o[3].y) / c,
	        z: !!r && (u * o[0].z + a * o[1].z + h * o[2].z + l * o[3].z) / c,
	        t: t
	      }) : void 0));
	    },
	    derive: function (t, n) {
	      const e = [];
	      for (let r = t, i = r.length, s = i - 1; i > 1; i--, s--) {
	        const t = [];
	        for (let e, i = 0; i < s; i++) e = {
	          x: s * (r[i + 1].x - r[i].x),
	          y: s * (r[i + 1].y - r[i].y)
	        }, n && (e.z = s * (r[i + 1].z - r[i].z)), t.push(e);
	        e.push(t), r = t;
	      }
	      return e;
	    },
	    between: function (t, n, e) {
	      return n <= t && t <= e || v.approximately(t, n) || v.approximately(t, e);
	    },
	    approximately: function (t, n, e) {
	      return c(t - n) <= (e || 1e-6);
	    },
	    length: function (t) {
	      const n = v.Tvalues.length;
	      let e = 0;
	      for (let r, i = 0; i < n; i++) r = .5 * v.Tvalues[i] + .5, e += v.Cvalues[i] * v.arcfn(r, t);
	      return .5 * e;
	    },
	    map: function (t, n, e, r, i) {
	      return r + (i - r) * ((t - n) / (e - n));
	    },
	    lerp: function (t, n, e) {
	      const r = {
	        x: n.x + t * (e.x - n.x),
	        y: n.y + t * (e.y - n.y)
	      };
	      return void 0 !== n.z && void 0 !== e.z && (r.z = n.z + t * (e.z - n.z)), r;
	    },
	    pointToString: function (t) {
	      let n = t.x + "/" + t.y;
	      return void 0 !== t.z && (n += "/" + t.z), n;
	    },
	    pointsToString: function (t) {
	      return "[" + t.map(v.pointToString).join(", ") + "]";
	    },
	    copy: function (t) {
	      return JSON.parse(JSON.stringify(t));
	    },
	    angle: function (t, n, e) {
	      const r = n.x - t.x,
	        i = n.y - t.y,
	        s = e.x - t.x,
	        o = e.y - t.y;
	      return l(r * o - i * s, r * s + i * o);
	    },
	    round: function (t, n) {
	      const e = "" + t,
	        r = e.indexOf(".");
	      return parseFloat(e.substring(0, r + 1 + n));
	    },
	    dist: function (t, n) {
	      const e = t.x - n.x,
	        r = t.y - n.y;
	      return x(e * e + r * r);
	    },
	    closest: function (t, n) {
	      let e,
	        r,
	        i = y(2, 63);
	      return t.forEach(function (t, s) {
	        r = v.dist(n, t), r < i && (i = r, e = s);
	      }), {
	        mdist: i,
	        mpos: e
	      };
	    },
	    abcratio: function (t, n) {
	      if (2 !== n && 3 !== n) return !1;
	      if (void 0 === t) t = .5;else if (0 === t || 1 === t) return t;
	      const e = y(t, n) + y(1 - t, n);
	      return c((e - 1) / e);
	    },
	    projectionratio: function (t, n) {
	      if (2 !== n && 3 !== n) return !1;
	      if (void 0 === t) t = .5;else if (0 === t || 1 === t) return t;
	      const e = y(1 - t, n);
	      return e / (y(t, n) + e);
	    },
	    lli8: function (t, n, e, r, i, s, o, c) {
	      const u = (t - e) * (s - c) - (n - r) * (i - o);
	      return 0 != u && {
	        x: ((t * r - n * e) * (i - o) - (t - e) * (i * c - s * o)) / u,
	        y: ((t * r - n * e) * (s - c) - (n - r) * (i * c - s * o)) / u
	      };
	    },
	    lli4: function (t, n, e, r) {
	      const i = t.x,
	        s = t.y,
	        o = n.x,
	        c = n.y,
	        u = e.x,
	        a = e.y,
	        h = r.x,
	        l = r.y;
	      return v.lli8(i, s, o, c, u, a, h, l);
	    },
	    lli: function (t, n) {
	      return v.lli4(t, t.c, n, n.c);
	    },
	    makeline: function (t, n) {
	      return new I(t.x, t.y, (t.x + n.x) / 2, (t.y + n.y) / 2, n.x, n.y);
	    },
	    findbbox: function (t) {
	      let n = g,
	        e = g,
	        r = z,
	        i = z;
	      return t.forEach(function (t) {
	        const s = t.bbox();
	        n > s.x.min && (n = s.x.min), e > s.y.min && (e = s.y.min), r < s.x.max && (r = s.x.max), i < s.y.max && (i = s.y.max);
	      }), {
	        x: {
	          min: n,
	          mid: (n + r) / 2,
	          max: r,
	          size: r - n
	        },
	        y: {
	          min: e,
	          mid: (e + i) / 2,
	          max: i,
	          size: i - e
	        }
	      };
	    },
	    shapeintersections: function (t, n, e, r, i) {
	      if (!v.bboxoverlap(n, r)) return [];
	      const s = [],
	        o = [t.startcap, t.forward, t.back, t.endcap],
	        c = [e.startcap, e.forward, e.back, e.endcap];
	      return o.forEach(function (n) {
	        n.virtual || c.forEach(function (r) {
	          if (r.virtual) return;
	          const o = n.intersects(r, i);
	          o.length > 0 && (o.c1 = n, o.c2 = r, o.s1 = t, o.s2 = e, s.push(o));
	        });
	      }), s;
	    },
	    makeshape: function (t, n, e) {
	      const r = n.points.length,
	        i = t.points.length,
	        s = v.makeline(n.points[r - 1], t.points[0]),
	        o = v.makeline(t.points[i - 1], n.points[0]),
	        c = {
	          startcap: s,
	          forward: t,
	          back: n,
	          endcap: o,
	          bbox: v.findbbox([s, t, n, o]),
	          intersections: function (t) {
	            return v.shapeintersections(c, c.bbox, t, t.bbox, e);
	          }
	        };
	      return c;
	    },
	    getminmax: function (t, n, e) {
	      if (!e) return {
	        min: 0,
	        max: 0
	      };
	      let r,
	        i,
	        s = g,
	        o = z;
	      -1 === e.indexOf(0) && (e = [0].concat(e)), -1 === e.indexOf(1) && e.push(1);
	      for (let c = 0, u = e.length; c < u; c++) r = e[c], i = t.get(r), i[n] < s && (s = i[n]), i[n] > o && (o = i[n]);
	      return {
	        min: s,
	        mid: (s + o) / 2,
	        max: o,
	        size: o - s
	      };
	    },
	    align: function (t, n) {
	      const e = n.p1.x,
	        r = n.p1.y,
	        i = -l(n.p2.y - r, n.p2.x - e);
	      return t.map(function (t) {
	        return {
	          x: (t.x - e) * u(i) - (t.y - r) * a(i),
	          y: (t.x - e) * a(i) + (t.y - r) * u(i)
	        };
	      });
	    },
	    roots: function (t, n) {
	      n = n || {
	        p1: {
	          x: 0,
	          y: 0
	        },
	        p2: {
	          x: 1,
	          y: 0
	        }
	      };
	      const e = t.length - 1,
	        r = v.align(t, n),
	        i = function (t) {
	          return 0 <= t && t <= 1;
	        };
	      if (2 === e) {
	        const t = r[0].y,
	          n = r[1].y,
	          e = r[2].y,
	          s = t - 2 * n + e;
	        if (0 !== s) {
	          const r = -x(n * n - t * e),
	            o = -t + n;
	          return [-(r + o) / s, -(-r + o) / s].filter(i);
	        }
	        return n !== e && 0 === s ? [(2 * n - e) / (2 * n - 2 * e)].filter(i) : [];
	      }
	      const s = r[0].y,
	        o = r[1].y,
	        c = r[2].y;
	      let a = 3 * o - s - 3 * c + r[3].y,
	        l = 3 * s - 6 * o + 3 * c,
	        y = -3 * s + 3 * o,
	        p = s;
	      if (v.approximately(a, 0)) {
	        if (v.approximately(l, 0)) return v.approximately(y, 0) ? [] : [-p / y].filter(i);
	        const t = x(y * y - 4 * l * p),
	          n = 2 * l;
	        return [(t - y) / n, (-y - t) / n].filter(i);
	      }
	      l /= a, y /= a, p /= a;
	      const d = (3 * y - l * l) / 3,
	        g = d / 3,
	        z = (2 * l * l * l - 9 * l * y + 27 * p) / 27,
	        b = z / 2,
	        _ = b * b + g * g * g;
	      let w, E, M, T, O;
	      if (_ < 0) {
	        const t = -d / 3,
	          n = x(t * t * t),
	          e = -z / (2 * n),
	          r = h(e < -1 ? -1 : e > 1 ? 1 : e),
	          s = 2 * f(n);
	        return M = s * u(r / 3) - l / 3, T = s * u((r + m) / 3) - l / 3, O = s * u((r + 2 * m) / 3) - l / 3, [M, T, O].filter(i);
	      }
	      if (0 === _) return w = b < 0 ? f(-b) : -f(b), M = 2 * w - l / 3, T = -w - l / 3, [M, T].filter(i);
	      {
	        const t = x(_);
	        return w = f(-b + t), E = f(b + t), [w - E - l / 3].filter(i);
	      }
	    },
	    droots: function (t) {
	      if (3 === t.length) {
	        const n = t[0],
	          e = t[1],
	          r = t[2],
	          i = n - 2 * e + r;
	        if (0 !== i) {
	          const t = -x(e * e - n * r),
	            s = -n + e;
	          return [-(t + s) / i, -(-t + s) / i];
	        }
	        return e !== r && 0 === i ? [(2 * e - r) / (2 * (e - r))] : [];
	      }
	      if (2 === t.length) {
	        const n = t[0],
	          e = t[1];
	        return n !== e ? [n / (n - e)] : [];
	      }
	      return [];
	    },
	    curvature: function (t, n, e, r, i) {
	      let s,
	        o,
	        u,
	        a,
	        h = 0,
	        l = 0;
	      const f = v.compute(t, n),
	        p = v.compute(t, e),
	        m = f.x * f.x + f.y * f.y;
	      if (r ? (s = x(y(f.y * p.z - p.y * f.z, 2) + y(f.z * p.x - p.z * f.x, 2) + y(f.x * p.y - p.x * f.y, 2)), o = y(m + f.z * f.z, 1.5)) : (s = f.x * p.y - f.y * p.x, o = y(m, 1.5)), 0 === s || 0 === o) return {
	        k: 0,
	        r: 0
	      };
	      if (h = s / o, l = o / s, !i) {
	        const i = v.curvature(t - .001, n, e, r, !0).k,
	          s = v.curvature(t + .001, n, e, r, !0).k;
	        a = (s - h + (h - i)) / 2, u = (c(s - h) + c(h - i)) / 2;
	      }
	      return {
	        k: h,
	        r: l,
	        dk: a,
	        adk: u
	      };
	    },
	    inflections: function (t) {
	      if (t.length < 4) return [];
	      const n = v.align(t, {
	          p1: t[0],
	          p2: t.slice(-1)[0]
	        }),
	        e = n[2].x * n[1].y,
	        r = n[3].x * n[1].y,
	        i = n[1].x * n[2].y,
	        s = 18 * (-3 * e + 2 * r + 3 * i - n[3].x * n[2].y),
	        o = 18 * (3 * e - r - 3 * i),
	        c = 18 * (i - e);
	      if (v.approximately(s, 0)) {
	        if (!v.approximately(o, 0)) {
	          let t = -c / o;
	          if (0 <= t && t <= 1) return [t];
	        }
	        return [];
	      }
	      const u = 2 * s;
	      if (v.approximately(u, 0)) return [];
	      const a = o * o - 4 * s * c;
	      if (a < 0) return [];
	      const h = Math.sqrt(a);
	      return [(h - o) / u, -(o + h) / u].filter(function (t) {
	        return 0 <= t && t <= 1;
	      });
	    },
	    bboxoverlap: function (t, n) {
	      const e = ["x", "y"],
	        r = e.length;
	      for (let i, s, o, u, a = 0; a < r; a++) if (i = e[a], s = t[i].mid, o = n[i].mid, u = (t[i].size + n[i].size) / 2, c(s - o) >= u) return !1;
	      return !0;
	    },
	    expandbox: function (t, n) {
	      n.x.min < t.x.min && (t.x.min = n.x.min), n.y.min < t.y.min && (t.y.min = n.y.min), n.z && n.z.min < t.z.min && (t.z.min = n.z.min), n.x.max > t.x.max && (t.x.max = n.x.max), n.y.max > t.y.max && (t.y.max = n.y.max), n.z && n.z.max > t.z.max && (t.z.max = n.z.max), t.x.mid = (t.x.min + t.x.max) / 2, t.y.mid = (t.y.min + t.y.max) / 2, t.z && (t.z.mid = (t.z.min + t.z.max) / 2), t.x.size = t.x.max - t.x.min, t.y.size = t.y.max - t.y.min, t.z && (t.z.size = t.z.max - t.z.min);
	    },
	    pairiteration: function (t, n, e) {
	      const r = t.bbox(),
	        i = n.bbox(),
	        s = 1e5,
	        o = e || .5;
	      if (r.x.size + r.y.size < o && i.x.size + i.y.size < o) return [(s * (t._t1 + t._t2) / 2 | 0) / s + "/" + (s * (n._t1 + n._t2) / 2 | 0) / s];
	      let c = t.split(.5),
	        u = n.split(.5),
	        a = [{
	          left: c.left,
	          right: u.left
	        }, {
	          left: c.left,
	          right: u.right
	        }, {
	          left: c.right,
	          right: u.right
	        }, {
	          left: c.right,
	          right: u.left
	        }];
	      a = a.filter(function (t) {
	        return v.bboxoverlap(t.left.bbox(), t.right.bbox());
	      });
	      let h = [];
	      return 0 === a.length || (a.forEach(function (t) {
	        h = h.concat(v.pairiteration(t.left, t.right, o));
	      }), h = h.filter(function (t, n) {
	        return h.indexOf(t) === n;
	      })), h;
	    },
	    getccenter: function (t, n, e) {
	      const r = n.x - t.x,
	        i = n.y - t.y,
	        s = e.x - n.x,
	        o = e.y - n.y,
	        c = r * u(d) - i * a(d),
	        h = r * a(d) + i * u(d),
	        x = s * u(d) - o * a(d),
	        y = s * a(d) + o * u(d),
	        f = (t.x + n.x) / 2,
	        p = (t.y + n.y) / 2,
	        g = (n.x + e.x) / 2,
	        z = (n.y + e.y) / 2,
	        b = f + c,
	        _ = p + h,
	        w = g + x,
	        E = z + y,
	        M = v.lli8(f, p, b, _, g, z, w, E),
	        T = v.dist(M, t);
	      let O,
	        C = l(t.y - M.y, t.x - M.x),
	        k = l(n.y - M.y, n.x - M.x),
	        S = l(e.y - M.y, e.x - M.x);
	      return C < S ? ((C > k || k > S) && (C += m), C > S && (O = S, S = C, C = O)) : S < k && k < C ? (O = S, S = C, C = O) : S += m, M.s = C, M.e = S, M.r = T, M;
	    },
	    numberSort: function (t, n) {
	      return t - n;
	    }
	  };
	class _ {
	  constructor(t) {
	    this.curves = [], this._3d = !1, t && (this.curves = t, this._3d = this.curves[0]._3d);
	  }
	  valueOf() {
	    return this.toString();
	  }
	  toString() {
	    return "[" + this.curves.map(function (t) {
	      return v.pointsToString(t.points);
	    }).join(", ") + "]";
	  }
	  addCurve(t) {
	    this.curves.push(t), this._3d = this._3d || t._3d;
	  }
	  length() {
	    return this.curves.map(function (t) {
	      return t.length();
	    }).reduce(function (t, n) {
	      return t + n;
	    });
	  }
	  curve(t) {
	    return this.curves[t];
	  }
	  bbox() {
	    const t = this.curves;
	    for (var n = t[0].bbox(), e = 1; e < t.length; e++) v.expandbox(n, t[e].bbox());
	    return n;
	  }
	  offset(t) {
	    const n = [];
	    return this.curves.forEach(function (e) {
	      n.push(...e.offset(t));
	    }), new _(n);
	  }
	}
	const {
	    abs: w,
	    min: E,
	    max: M,
	    cos: T,
	    sin: O,
	    acos: C,
	    sqrt: k
	  } = Math,
	  S = Math.PI;
	class I {
	  constructor(t) {
	    let n = t && t.forEach ? t : Array.from(arguments).slice(),
	      e = !1;
	    if ("object" == typeof n[0]) {
	      e = n.length;
	      const t = [];
	      n.forEach(function (n) {
	        ["x", "y", "z"].forEach(function (e) {
	          void 0 !== n[e] && t.push(n[e]);
	        });
	      }), n = t;
	    }
	    let r = !1;
	    const i = n.length;
	    if (e) {
	      if (e > 4) {
	        if (1 !== arguments.length) throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
	        r = !0;
	      }
	    } else if (6 !== i && 8 !== i && 9 !== i && 12 !== i && 1 !== arguments.length) throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
	    const s = this._3d = !r && (9 === i || 12 === i) || t && t[0] && void 0 !== t[0].z,
	      o = this.points = [];
	    for (let t = 0, e = s ? 3 : 2; t < i; t += e) {
	      var c = {
	        x: n[t],
	        y: n[t + 1]
	      };
	      s && (c.z = n[t + 2]), o.push(c);
	    }
	    const u = this.order = o.length - 1,
	      a = this.dims = ["x", "y"];
	    s && a.push("z"), this.dimlen = a.length;
	    const h = v.align(o, {
	        p1: o[0],
	        p2: o[u]
	      }),
	      l = v.dist(o[0], o[u]);
	    this._linear = h.reduce((t, n) => t + w(n.y), 0) < l / 50, this._lut = [], this._t1 = 0, this._t2 = 1, this.update();
	  }
	  static quadraticFromPoints(t, n, e, r) {
	    if (void 0 === r && (r = .5), 0 === r) return new I(n, n, e);
	    if (1 === r) return new I(t, n, n);
	    const i = I.getABC(2, t, n, e, r);
	    return new I(t, i.A, e);
	  }
	  static cubicFromPoints(t, n, e, r, i) {
	    void 0 === r && (r = .5);
	    const s = I.getABC(3, t, n, e, r);
	    void 0 === i && (i = v.dist(n, s.C));
	    const o = i * (1 - r) / r,
	      c = v.dist(t, e),
	      u = (e.x - t.x) / c,
	      a = (e.y - t.y) / c,
	      h = i * u,
	      l = i * a,
	      x = o * u,
	      y = o * a,
	      f = n.x - h,
	      p = n.y - l,
	      m = n.x + x,
	      d = n.y + y,
	      g = s.A,
	      z = g.x + (f - g.x) / (1 - r),
	      b = g.y + (p - g.y) / (1 - r),
	      _ = g.x + (m - g.x) / r,
	      w = g.y + (d - g.y) / r,
	      E = {
	        x: t.x + (z - t.x) / r,
	        y: t.y + (b - t.y) / r
	      },
	      M = {
	        x: e.x + (_ - e.x) / (1 - r),
	        y: e.y + (w - e.y) / (1 - r)
	      };
	    return new I(t, E, M, e);
	  }
	  static getUtils() {
	    return v;
	  }
	  getUtils() {
	    return I.getUtils();
	  }
	  static get PolyBezier() {
	    return _;
	  }
	  valueOf() {
	    return this.toString();
	  }
	  toString() {
	    return v.pointsToString(this.points);
	  }
	  toSVG() {
	    if (this._3d) return !1;
	    const t = this.points,
	      n = ["M", t[0].x, t[0].y, 2 === this.order ? "Q" : "C"];
	    for (let e = 1, r = t.length; e < r; e++) n.push(t[e].x), n.push(t[e].y);
	    return n.join(" ");
	  }
	  setRatios(t) {
	    if (t.length !== this.points.length) throw new Error("incorrect number of ratio values");
	    this.ratios = t, this._lut = [];
	  }
	  verify() {
	    const t = this.coordDigest();
	    t !== this._print && (this._print = t, this.update());
	  }
	  coordDigest() {
	    return this.points.map(function (t, n) {
	      return "" + n + t.x + t.y + (t.z ? t.z : 0);
	    }).join("");
	  }
	  update() {
	    this._lut = [], this.dpoints = v.derive(this.points, this._3d), this.computedirection();
	  }
	  computedirection() {
	    const t = this.points,
	      n = v.angle(t[0], t[this.order], t[1]);
	    this.clockwise = n > 0;
	  }
	  length() {
	    return v.length(this.derivative.bind(this));
	  }
	  static getABC(t = 2, n, e, r, i = .5) {
	    const s = v.projectionratio(i, t),
	      o = 1 - s,
	      c = {
	        x: s * n.x + o * r.x,
	        y: s * n.y + o * r.y
	      },
	      u = v.abcratio(i, t);
	    return {
	      A: {
	        x: e.x + (e.x - c.x) / u,
	        y: e.y + (e.y - c.y) / u
	      },
	      B: e,
	      C: c,
	      S: n,
	      E: r
	    };
	  }
	  getABC(t, n) {
	    n = n || this.get(t);
	    let e = this.points[0],
	      r = this.points[this.order];
	    return I.getABC(this.order, e, n, r, t);
	  }
	  getLUT(t) {
	    if (this.verify(), t = t || 100, this._lut.length === t + 1) return this._lut;
	    this._lut = [], t++, this._lut = [];
	    for (let n, e, r = 0; r < t; r++) e = r / (t - 1), n = this.compute(e), n.t = e, this._lut.push(n);
	    return this._lut;
	  }
	  on(n, e) {
	    e = e || 5;
	    const r = this.getLUT(),
	      i = [];
	    for (let t, s = 0, o = 0; s < r.length; s++) t = r[s], v.dist(t, n) < e && (i.push(t), o += s / r.length);
	    return !!i.length && (t /= i.length);
	  }
	  project(t) {
	    const n = this.getLUT(),
	      e = n.length - 1,
	      r = v.closest(n, t),
	      i = r.mpos,
	      s = (i - 1) / e,
	      o = (i + 1) / e,
	      c = .1 / e;
	    let u,
	      a = r.mdist,
	      h = s,
	      l = h;
	    a += 1;
	    for (let n; h < o + c; h += c) u = this.compute(h), n = v.dist(t, u), n < a && (a = n, l = h);
	    return l = l < 0 ? 0 : l > 1 ? 1 : l, u = this.compute(l), u.t = l, u.d = a, u;
	  }
	  get(t) {
	    return this.compute(t);
	  }
	  point(t) {
	    return this.points[t];
	  }
	  compute(t) {
	    return this.ratios ? v.computeWithRatios(t, this.points, this.ratios, this._3d) : v.compute(t, this.points, this._3d, this.ratios);
	  }
	  raise() {
	    const t = this.points,
	      n = [t[0]],
	      e = t.length;
	    for (let r, i, s = 1; s < e; s++) r = t[s], i = t[s - 1], n[s] = {
	      x: (e - s) / e * r.x + s / e * i.x,
	      y: (e - s) / e * r.y + s / e * i.y
	    };
	    return n[e] = t[e - 1], new I(n);
	  }
	  derivative(t) {
	    return v.compute(t, this.dpoints[0], this._3d);
	  }
	  dderivative(t) {
	    return v.compute(t, this.dpoints[1], this._3d);
	  }
	  align() {
	    let t = this.points;
	    return new I(v.align(t, {
	      p1: t[0],
	      p2: t[t.length - 1]
	    }));
	  }
	  curvature(t) {
	    return v.curvature(t, this.dpoints[0], this.dpoints[1], this._3d);
	  }
	  inflections() {
	    return v.inflections(this.points);
	  }
	  normal(t) {
	    return this._3d ? this.__normal3(t) : this.__normal2(t);
	  }
	  __normal2(t) {
	    const n = this.derivative(t),
	      e = k(n.x * n.x + n.y * n.y);
	    return {
	      t: t,
	      x: -n.y / e,
	      y: n.x / e
	    };
	  }
	  __normal3(t) {
	    const n = this.derivative(t),
	      e = this.derivative(t + .01),
	      r = k(n.x * n.x + n.y * n.y + n.z * n.z),
	      i = k(e.x * e.x + e.y * e.y + e.z * e.z);
	    n.x /= r, n.y /= r, n.z /= r, e.x /= i, e.y /= i, e.z /= i;
	    const s = {
	        x: e.y * n.z - e.z * n.y,
	        y: e.z * n.x - e.x * n.z,
	        z: e.x * n.y - e.y * n.x
	      },
	      o = k(s.x * s.x + s.y * s.y + s.z * s.z);
	    s.x /= o, s.y /= o, s.z /= o;
	    const c = [s.x * s.x, s.x * s.y - s.z, s.x * s.z + s.y, s.x * s.y + s.z, s.y * s.y, s.y * s.z - s.x, s.x * s.z - s.y, s.y * s.z + s.x, s.z * s.z];
	    return {
	      t: t,
	      x: c[0] * n.x + c[1] * n.y + c[2] * n.z,
	      y: c[3] * n.x + c[4] * n.y + c[5] * n.z,
	      z: c[6] * n.x + c[7] * n.y + c[8] * n.z
	    };
	  }
	  hull(t) {
	    let n = this.points,
	      e = [],
	      r = [],
	      i = 0;
	    for (r[i++] = n[0], r[i++] = n[1], r[i++] = n[2], 3 === this.order && (r[i++] = n[3]); n.length > 1;) {
	      e = [];
	      for (let s, o = 0, c = n.length - 1; o < c; o++) s = v.lerp(t, n[o], n[o + 1]), r[i++] = s, e.push(s);
	      n = e;
	    }
	    return r;
	  }
	  split(t, n) {
	    if (0 === t && n) return this.split(n).left;
	    if (1 === n) return this.split(t).right;
	    const e = this.hull(t),
	      r = {
	        left: 2 === this.order ? new I([e[0], e[3], e[5]]) : new I([e[0], e[4], e[7], e[9]]),
	        right: 2 === this.order ? new I([e[5], e[4], e[2]]) : new I([e[9], e[8], e[6], e[3]]),
	        span: e
	      };
	    return r.left._t1 = v.map(0, 0, 1, this._t1, this._t2), r.left._t2 = v.map(t, 0, 1, this._t1, this._t2), r.right._t1 = v.map(t, 0, 1, this._t1, this._t2), r.right._t2 = v.map(1, 0, 1, this._t1, this._t2), n ? (n = v.map(n, t, 1, 0, 1), r.right.split(n).left) : r;
	  }
	  extrema() {
	    const t = {};
	    let n = [];
	    return this.dims.forEach(function (e) {
	      let r = function (t) {
	          return t[e];
	        },
	        i = this.dpoints[0].map(r);
	      t[e] = v.droots(i), 3 === this.order && (i = this.dpoints[1].map(r), t[e] = t[e].concat(v.droots(i))), t[e] = t[e].filter(function (t) {
	        return t >= 0 && t <= 1;
	      }), n = n.concat(t[e].sort(v.numberSort));
	    }.bind(this)), t.values = n.sort(v.numberSort).filter(function (t, e) {
	      return n.indexOf(t) === e;
	    }), t;
	  }
	  bbox() {
	    const t = this.extrema(),
	      n = {};
	    return this.dims.forEach(function (e) {
	      n[e] = v.getminmax(this, e, t[e]);
	    }.bind(this)), n;
	  }
	  overlaps(t) {
	    const n = this.bbox(),
	      e = t.bbox();
	    return v.bboxoverlap(n, e);
	  }
	  offset(t, n) {
	    if (void 0 !== n) {
	      const e = this.get(t),
	        r = this.normal(t),
	        i = {
	          c: e,
	          n: r,
	          x: e.x + r.x * n,
	          y: e.y + r.y * n
	        };
	      return this._3d && (i.z = e.z + r.z * n), i;
	    }
	    if (this._linear) {
	      const n = this.normal(0),
	        e = this.points.map(function (e) {
	          const r = {
	            x: e.x + t * n.x,
	            y: e.y + t * n.y
	          };
	          return e.z && n.z && (r.z = e.z + t * n.z), r;
	        });
	      return [new I(e)];
	    }
	    return this.reduce().map(function (n) {
	      return n._linear ? n.offset(t)[0] : n.scale(t);
	    });
	  }
	  simple() {
	    if (3 === this.order) {
	      const t = v.angle(this.points[0], this.points[3], this.points[1]),
	        n = v.angle(this.points[0], this.points[3], this.points[2]);
	      if (t > 0 && n < 0 || t < 0 && n > 0) return !1;
	    }
	    const t = this.normal(0),
	      n = this.normal(1);
	    let e = t.x * n.x + t.y * n.y;
	    return this._3d && (e += t.z * n.z), w(C(e)) < S / 3;
	  }
	  reduce() {
	    let t,
	      n,
	      e = 0,
	      r = 0,
	      i = .01,
	      s = [],
	      o = [],
	      c = this.extrema().values;
	    for (-1 === c.indexOf(0) && (c = [0].concat(c)), -1 === c.indexOf(1) && c.push(1), e = c[0], t = 1; t < c.length; t++) r = c[t], n = this.split(e, r), n._t1 = e, n._t2 = r, s.push(n), e = r;
	    return s.forEach(function (t) {
	      for (e = 0, r = 0; r <= 1;) for (r = e + i; r <= 1.01; r += i) if (n = t.split(e, r), !n.simple()) {
	        if (r -= i, w(e - r) < i) return [];
	        n = t.split(e, r), n._t1 = v.map(e, 0, 1, t._t1, t._t2), n._t2 = v.map(r, 0, 1, t._t1, t._t2), o.push(n), e = r;
	        break;
	      }
	      e < 1 && (n = t.split(e, 1), n._t1 = v.map(e, 0, 1, t._t1, t._t2), n._t2 = t._t2, o.push(n));
	    }), o;
	  }
	  translate(t, n, e) {
	    e = "number" == typeof e ? e : n;
	    const r = this.order;
	    let i = this.points.map((t, i) => (1 - i / r) * n + i / r * e);
	    return new I(this.points.map((n, e) => ({
	      x: n.x + t.x * i[e],
	      y: n.y + t.y * i[e]
	    })));
	  }
	  scale(t) {
	    const n = this.order;
	    let e = !1;
	    if ("function" == typeof t && (e = t), e && 2 === n) return this.raise().scale(e);
	    const r = this.clockwise,
	      i = this.points;
	    if (this._linear) return this.translate(this.normal(0), e ? e(0) : t, e ? e(1) : t);
	    const s = e ? e(0) : t,
	      o = e ? e(1) : t,
	      c = [this.offset(0, 10), this.offset(1, 10)],
	      u = [],
	      a = v.lli4(c[0], c[0].c, c[1], c[1].c);
	    if (!a) throw new Error("cannot scale this curve. Try reducing it first.");
	    return [0, 1].forEach(function (t) {
	      const e = u[t * n] = v.copy(i[t * n]);
	      e.x += (t ? o : s) * c[t].n.x, e.y += (t ? o : s) * c[t].n.y;
	    }), e ? ([0, 1].forEach(function (s) {
	      if (2 !== n || !s) {
	        var o = i[s + 1],
	          c = {
	            x: o.x - a.x,
	            y: o.y - a.y
	          },
	          h = e ? e((s + 1) / n) : t;
	        e && !r && (h = -h);
	        var l = k(c.x * c.x + c.y * c.y);
	        c.x /= l, c.y /= l, u[s + 1] = {
	          x: o.x + h * c.x,
	          y: o.y + h * c.y
	        };
	      }
	    }), new I(u)) : ([0, 1].forEach(t => {
	      if (2 === n && t) return;
	      const e = u[t * n],
	        r = this.derivative(t),
	        s = {
	          x: e.x + r.x,
	          y: e.y + r.y
	        };
	      u[t + 1] = v.lli4(e, s, a, i[t + 1]);
	    }), new I(u));
	  }
	  outline(t, n, e, r) {
	    if (n = void 0 === n ? t : n, this._linear) {
	      const i = this.normal(0),
	        s = this.points[0],
	        o = this.points[this.points.length - 1];
	      let c, u, a;
	      void 0 === e && (e = t, r = n), c = {
	        x: s.x + i.x * t,
	        y: s.y + i.y * t
	      }, a = {
	        x: o.x + i.x * e,
	        y: o.y + i.y * e
	      }, u = {
	        x: (c.x + a.x) / 2,
	        y: (c.y + a.y) / 2
	      };
	      const h = [c, u, a];
	      c = {
	        x: s.x - i.x * n,
	        y: s.y - i.y * n
	      }, a = {
	        x: o.x - i.x * r,
	        y: o.y - i.y * r
	      }, u = {
	        x: (c.x + a.x) / 2,
	        y: (c.y + a.y) / 2
	      };
	      const l = [a, u, c],
	        x = v.makeline(l[2], h[0]),
	        y = v.makeline(h[2], l[0]),
	        f = [x, new I(h), y, new I(l)];
	      return new _(f);
	    }
	    const i = this.reduce(),
	      s = i.length,
	      o = [];
	    let c,
	      u = [],
	      a = 0,
	      h = this.length();
	    const l = void 0 !== e && void 0 !== r;
	    function x(t, n, e, r, i) {
	      return function (s) {
	        const o = r / e,
	          c = (r + i) / e,
	          u = n - t;
	        return v.map(s, 0, 1, t + o * u, t + c * u);
	      };
	    }
	    i.forEach(function (i) {
	      const s = i.length();
	      l ? (o.push(i.scale(x(t, e, h, a, s))), u.push(i.scale(x(-n, -r, h, a, s)))) : (o.push(i.scale(t)), u.push(i.scale(-n))), a += s;
	    }), u = u.map(function (t) {
	      return c = t.points, c[3] ? t.points = [c[3], c[2], c[1], c[0]] : t.points = [c[2], c[1], c[0]], t;
	    }).reverse();
	    const y = o[0].points[0],
	      f = o[s - 1].points[o[s - 1].points.length - 1],
	      p = u[s - 1].points[u[s - 1].points.length - 1],
	      m = u[0].points[0],
	      d = v.makeline(p, y),
	      g = v.makeline(f, m),
	      z = [d].concat(o).concat([g]).concat(u);
	    return new _(z);
	  }
	  outlineshapes(t, n, e) {
	    n = n || t;
	    const r = this.outline(t, n).curves,
	      i = [];
	    for (let t = 1, n = r.length; t < n / 2; t++) {
	      const s = v.makeshape(r[t], r[n - t], e);
	      s.startcap.virtual = t > 1, s.endcap.virtual = t < n / 2 - 1, i.push(s);
	    }
	    return i;
	  }
	  intersects(t, n) {
	    return t ? t.p1 && t.p2 ? this.lineIntersects(t) : (t instanceof I && (t = t.reduce()), this.curveintersects(this.reduce(), t, n)) : this.selfintersects(n);
	  }
	  lineIntersects(t) {
	    const n = E(t.p1.x, t.p2.x),
	      e = E(t.p1.y, t.p2.y),
	      r = M(t.p1.x, t.p2.x),
	      i = M(t.p1.y, t.p2.y);
	    return v.roots(this.points, t).filter(t => {
	      var s = this.get(t);
	      return v.between(s.x, n, r) && v.between(s.y, e, i);
	    });
	  }
	  selfintersects(t) {
	    const n = this.reduce(),
	      e = n.length - 2,
	      r = [];
	    for (let i, s, o, c = 0; c < e; c++) s = n.slice(c, c + 1), o = n.slice(c + 2), i = this.curveintersects(s, o, t), r.push(...i);
	    return r;
	  }
	  curveintersects(t, n, e) {
	    const r = [];
	    t.forEach(function (t) {
	      n.forEach(function (n) {
	        t.overlaps(n) && r.push({
	          left: t,
	          right: n
	        });
	      });
	    });
	    let i = [];
	    return r.forEach(function (t) {
	      const n = v.pairiteration(t.left, t.right, e);
	      n.length > 0 && (i = i.concat(n));
	    }), i;
	  }
	  arcs(t) {
	    return t = t || .5, this._iterate(t, []);
	  }
	  _error(t, n, e, r) {
	    const i = (r - e) / 4,
	      s = this.get(e + i),
	      o = this.get(r - i),
	      c = v.dist(t, n),
	      u = v.dist(t, s),
	      a = v.dist(t, o);
	    return w(u - c) + w(a - c);
	  }
	  _iterate(t, n) {
	    let e,
	      r = 0,
	      i = 1;
	    do {
	      e = 0, i = 1;
	      let s,
	        o,
	        c,
	        u,
	        a,
	        h = this.get(r),
	        l = !1,
	        x = !1,
	        y = i,
	        f = 1;
	      do {
	        if (x = l, u = c, y = (r + i) / 2, s = this.get(y), o = this.get(i), c = v.getccenter(h, s, o), c.interval = {
	          start: r,
	          end: i
	        }, l = this._error(c, h, r, i) <= t, a = x && !l, a || (f = i), l) {
	          if (i >= 1) {
	            if (c.interval.end = f = 1, u = c, i > 1) {
	              let t = {
	                x: c.x + c.r * T(c.e),
	                y: c.y + c.r * O(c.e)
	              };
	              c.e += v.angle({
	                x: c.x,
	                y: c.y
	              }, t, this.get(1));
	            }
	            break;
	          }
	          i += (i - r) / 2;
	        } else i = y;
	      } while (!a && e++ < 100);
	      if (e >= 100) break;
	      u = u || c, n.push(u), r = f;
	    } while (i < 1);
	    return n;
	  }
	}
	const B = {
	  name: "perspective",
	  execute: t => {
	    const n = [],
	      e = (t, n, e, r) => {
	        if (t === n) return e / r;
	        const i = 1 - (1 / (1 + e / r * (t / n - 1)) * t - n) / (t - n);
	        return Math.min(1, Math.max(0, i));
	      };
	    return t.regionBoundaryCurves.forEach((r, i) => {
	      const s = [];
	      r.forEach((n, r) => {
	        const c = [],
	          u = n,
	          a = {
	            tl: u.top.points[0],
	            tr: u.top.points[3],
	            bl: u.bottom.points[0],
	            br: u.bottom.points[3]
	          };
	        if ((t => {
	          const n = o.calcIntersection(t.tl, t.tr, t.bl, t.br),
	            e = o.calcIntersection(t.tl, t.bl, t.tr, t.br),
	            r = n => n && Object.values(t).some((t, e, r) => o.isTriangleContainsPoint(n, r[e], r[(e + 1) % 4], r[(e + 2) % 4]));
	          return r(n) || r(e);
	        })(a)) throw new Error("[Warpvas: Perspective] Invalid perspective shape: The four control points cannot form a triangle or cross each other");
	        const h = {
	            left: new I(u.left.points).length(),
	            right: new I(u.right.points).length(),
	            top: new I(u.top.points).length(),
	            bottom: new I(u.bottom.points).length()
	          },
	          l = o.calcIntersection(a.tl, a.bl, a.tr, a.br),
	          x = o.calcIntersection(a.tl, a.tr, a.bl, a.br),
	          {
	            vertical: y,
	            horizontal: f
	          } = t.regionCurves[i][r],
	          p = f.length - 1,
	          m = y.length - 1;
	        for (let t = 0; t < f.length; t++) for (let n = 0; n < y.length; n++) {
	          let r = u.top.get(n / m),
	            i = u.bottom.get(n / m);
	          if (x) {
	            const t = o.calcCoordDistance(a.tl, x) / o.calcCoordDistance(a.tr, x),
	              s = e(h.left, h.left / t, n, m);
	            r = u.top.get(s);
	            const c = o.calcCoordDistance(a.bl, x) / o.calcCoordDistance(a.br, x),
	              l = e(h.left, h.left / c, n, m);
	            i = u.bottom.get(l);
	          }
	          let s = u.left.get(t / p),
	            y = u.right.get(t / p);
	          if (l) {
	            const n = o.calcCoordDistance(a.tl, l) / o.calcCoordDistance(a.bl, l),
	              r = e(h.top, h.top / n, t, p);
	            s = u.left.get(r);
	            const i = o.calcCoordDistance(a.tr, l) / o.calcCoordDistance(a.br, l),
	              c = e(h.top, h.top / i, t, p);
	            y = u.right.get(c);
	          }
	          const f = o.calcIntersection(r, i, s, y);
	          f ? c.push(f) : c.push(r);
	        }
	        s.push(c);
	      }), n.push(s);
	    }), n;
	  }
	};

	const CANVAS_PADDING = 8;
	const LOGO_WIDTH = 460;
	const LOGO_HEIGHT = 150;
	const INDICATOR_THEME_COLOR = 'rgba(206, 102, 91, 1)';
	const INDICATOR_SUB_THEME_COLOR = 'rgba(206, 102, 91, 0.6)';
	const createLOGO = () => {
	    const width = LOGO_WIDTH;
	    const height = LOGO_HEIGHT;
	    const background = new fabric.fabric.Rect({
	        width: width,
	        height: height,
	        left: width / 2,
	        fill: 'transparent',
	        originX: 'center',
	    });
	    const title = new fabric.fabric.Text('Warpvas', {
	        left: width / 2,
	        top: 24,
	        fontSize: 50,
	        fontFamily: 'sharpie-black',
	        originX: 'center',
	        originY: 'top',
	    });
	    const description = new fabric.fabric.Text('A JavaScript Library for Rapid Canvas Distortion', {
	        left: width / 2,
	        top: 126,
	        fontSize: 16,
	        fontFamily: 'handwriting',
	        originX: 'center',
	        originY: 'bottom',
	    });
	    const group = new fabric.fabric.Group([background, title, description], {
	        originX: 'center',
	        originY: 'center',
	    });
	    return group.toCanvasElement({ enableRetinaScaling: true });
	};
	const createPath = (path, options = {}) => {
	    return new fabric.fabric.Path(path, Object.assign({ fill: 'transparent', stroke: INDICATOR_SUB_THEME_COLOR, strokeWidth: 1, strokeDashArray: [2, 2] }, options));
	};
	const createLine = (p0, p1, options = {}) => {
	    return new fabric.fabric.Line([p0.x, p0.y, p1.x, p1.y], Object.assign({ stroke: INDICATOR_SUB_THEME_COLOR, strokeWidth: 1 }, options));
	};
	const createPoint = (options = {}) => {
	    return new fabric.fabric.Circle(Object.assign({ radius: 4, fill: INDICATOR_THEME_COLOR, stroke: INDICATOR_SUB_THEME_COLOR, strokeWidth: 6, originX: 'center', originY: 'center' }, options));
	};
	const createRect = (width, height, options = {}) => {
	    return new fabric.fabric.Rect(Object.assign({ width,
	        height, fill: 'transparent', stroke: INDICATOR_SUB_THEME_COLOR, strokeWidth: 1, strokeDashArray: [2, 2] }, options));
	};
	const createLabel = (text, options = {}) => {
	    return new fabric.fabric.Text(text, Object.assign({ fontSize: 12, fontFamily: 'handwriting', fill: INDICATOR_THEME_COLOR, originX: 'center', originY: 'top' }, options));
	};
	const WarpedCanvas = ({ className, step }) => {
	    const canvasRef = React2.useRef(null);
	    const fabricCanvasRef = React2.useRef();
	    const initialWarpedCanvas = React2.useCallback((step) => __awaiter(void 0, void 0, void 0, function* () {
	        if (!canvasRef.current)
	            return;
	        if (fabricCanvasRef.current) {
	            fabricCanvasRef.current.dispose();
	        }
	        yield loadFont('sharpie-black');
	        yield loadFont('handwriting');
	        const offset = (...objects) => {
	            objects.map((object) => {
	                object.set({
	                    left: object.left + CANVAS_PADDING,
	                    top: object.top + CANVAS_PADDING,
	                });
	            });
	            return objects;
	        };
	        const applyDistortionEffects = (warpvas, step) => {
	            const ratio = window.devicePixelRatio;
	            switch (step) {
	                case 2: {
	                    warpvas.updateVertexCoord(0, 0, 'tl', { x: 50 * ratio, y: 50 * ratio }, true);
	                    break;
	                }
	                case 3: {
	                    warpvas.updateRegionBoundCoords(0, 0, 'bottom', [
	                        { x: 0, y: LOGO_HEIGHT * ratio },
	                        { x: (LOGO_WIDTH * ratio) / 3, y: (LOGO_HEIGHT * ratio) / 2 },
	                        { x: ((LOGO_WIDTH * ratio) / 3) * 2, y: (LOGO_HEIGHT * ratio) / 2 },
	                        { x: LOGO_WIDTH * ratio, y: LOGO_HEIGHT * ratio },
	                    ]);
	                    break;
	                }
	                case 4: {
	                    const region = warpvas.originalRegions[0][0];
	                    warpvas.splitRegionByPoint(0, 0, {
	                        x: (region.tl.x + region.br.x) / 2,
	                        y: (region.tl.y + region.br.y) / 2,
	                    }, 0.1);
	                    break;
	                }
	                case 6: {
	                    warpvas.setRenderingConfig({
	                        enableGridDisplay: true,
	                        enableGridVertexDisplay: true,
	                        gridColor: { r: 206, g: 102, b: 91, a: 1 },
	                    });
	                    break;
	                }
	                case 7: {
	                    warpvas.setSplitUnit(0.02).setRenderingConfig({
	                        enableGridDisplay: true,
	                        gridColor: { r: 206, g: 102, b: 91, a: 1 },
	                    });
	                    break;
	                }
	                case 8: {
	                    warpvas.updateVertexCoord(0, 0, 'tl', { x: 0, y: 100 * ratio }, true);
	                    warpvas.setSplitStrategy(B);
	                    warpvas.setRenderingConfig({
	                        enableGridDisplay: true,
	                        gridColor: { r: 206, g: 102, b: 91, a: 1 },
	                    });
	                    break;
	                }
	                case 9: {
	                    warpvas.setInputLimitSize({
	                        height: 100 * ratio,
	                    });
	                    break;
	                }
	                case 10: {
	                    warpvas.setOutputLimitSize({
	                        height: 100 * ratio,
	                    });
	                    break;
	                }
	                case 11: {
	                    warpvas.setRenderingContext('2d');
	                    break;
	                }
	            }
	        };
	        const addIndicators = (canvas, step) => {
	            switch (step) {
	                case 2: {
	                    const path = createPath(`M 0 ${LOGO_HEIGHT} L 50 50 L ${LOGO_WIDTH} 0`);
	                    const point = createPoint({
	                        left: 50,
	                        top: 50,
	                    });
	                    const text = createLabel('Move to (50, 50)', {
	                        left: 50,
	                        top: 50 + 20,
	                    });
	                    canvas.add(...offset(path, point, text));
	                    break;
	                }
	                case 3: {
	                    const curve = [
	                        { x: 0, y: LOGO_HEIGHT },
	                        { x: LOGO_WIDTH / 3, y: LOGO_HEIGHT / 2 },
	                        { x: (LOGO_WIDTH / 3) * 2, y: LOGO_HEIGHT / 2 },
	                        { x: LOGO_WIDTH, y: LOGO_HEIGHT },
	                    ];
	                    const path = createPath(`M 0 ${LOGO_HEIGHT} C ${curve
                        .slice(1)
                        .map((i) => `${i.x} ${i.y}`)
                        .join(' ')}`);
	                    const lines = [
	                        [curve[0], curve[1]],
	                        [curve[2], curve[3]],
	                    ].map(([p0, p1]) => {
	                        return createLine(p0, p1);
	                    });
	                    const points = curve.map((pos) => {
	                        return createPoint({
	                            left: pos.x,
	                            top: pos.y,
	                        });
	                    });
	                    canvas.add(...offset(path, ...lines, ...points));
	                    break;
	                }
	                case 4: {
	                    const path = createPath(`M 0 ${LOGO_HEIGHT / 2} L ${LOGO_WIDTH} ${LOGO_HEIGHT / 2} M ${LOGO_WIDTH / 2} 0 L ${LOGO_WIDTH / 2} ${LOGO_HEIGHT}`);
	                    const point = createPoint({
	                        left: LOGO_WIDTH / 2,
	                        top: LOGO_HEIGHT / 2,
	                    });
	                    const text = createLabel('Split at center', {
	                        left: LOGO_WIDTH / 2,
	                        top: LOGO_HEIGHT / 2 + 20,
	                    });
	                    canvas.add(...offset(path, point, text));
	                    break;
	                }
	                case 5: {
	                    const rect1 = createRect(LOGO_WIDTH / 2, LOGO_HEIGHT, {
	                        left: LOGO_WIDTH / 2,
	                        top: 0,
	                    });
	                    const rect2 = createRect(LOGO_WIDTH, LOGO_HEIGHT / 2, {
	                        left: 0,
	                        top: LOGO_HEIGHT / 2,
	                    });
	                    const text = createLabel('Remove region at row 1, column 1', {
	                        left: LOGO_WIDTH / 2,
	                        top: LOGO_HEIGHT / 2 + 10,
	                    });
	                    canvas.add(...offset(rect1, rect2, text));
	                    break;
	                }
	                case 9:
	                case 10: {
	                    const path = createPath(`M 0 100 L 0 0`);
	                    const text = createLabel('Limit height to 100px', {
	                        left: 10,
	                        top: 100 / 2,
	                        originX: 'left',
	                    });
	                    canvas.add(...offset(path, text));
	                    break;
	                }
	            }
	        };
	        // Generate pre-deformation canvas
	        const logoCanvas = createLOGO();
	        // Apply deformation based on steps
	        const warpvas = new V(logoCanvas);
	        applyDistortionEffects(warpvas, step);
	        const warpedCanvas = warpvas.render();
	        const image = new fabric.fabric.Image(warpedCanvas, {
	            originX: 'center',
	            originY: 'center',
	            scaleX: 1 / window.devicePixelRatio,
	            scaleY: 1 / window.devicePixelRatio,
	        });
	        // Generate preview canvas
	        const canvas = canvasRef.current;
	        const fabricCanvas = new fabric.fabric.StaticCanvas(canvas, {
	            width: image.getScaledWidth() + CANVAS_PADDING * 2,
	            height: image.getScaledHeight() + CANVAS_PADDING * 2,
	        });
	        image.set({
	            left: fabricCanvas.getWidth() / 2,
	            top: fabricCanvas.getHeight() / 2,
	        });
	        fabricCanvas.add(image);
	        // Add hint elements
	        addIndicators(fabricCanvas, step);
	        fabricCanvasRef.current = fabricCanvas;
	    }), []);
	    React2.useEffect(() => {
	        initialWarpedCanvas(step);
	    }, [step]);
	    return (React2.createElement("div", { className: className },
	        React2.createElement("canvas", { ref: canvasRef })));
	};

	const Icon = (_a) => {
	    var { className, name, size = 48, color = 'currentColor' } = _a, rest = __rest(_a, ["className", "name", "size", "color"]);
	    return (React2.createElement("svg", Object.assign({}, rest, { className: classnames('icon', className), "aria-hidden": "true", fontSize: size, color: color }),
	        React2.createElement("use", { xlinkHref: `#icon-${name}` })));
	};
	var Icon$1 = React2.memo(Icon);

	var css_248z = "*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{height:8px;width:8px}::-webkit-scrollbar-track{background:transparent;border-radius:2px}::-webkit-scrollbar-thumb{background:#66666633;border-radius:8px;transition:all .1s}::-webkit-scrollbar-thumb:hover{background:#66666666}::-webkit-scrollbar-corner{background:transparent}body,html{overflow:hidden}body{background-color:#fff;background-image:radial-gradient(#f1f1f1 10%,transparent 0);background-size:20px 20px;color:#333;font-family:handwriting}.style_docs__hZIAM{align-items:center;display:flex;flex-direction:column;height:100vh;justify-content:center;overflow:hidden;scroll-behavior:smooth}.style_docs__hZIAM .style_logo__L5bpy{pointer-events:none;position:relative;z-index:1}.style_docs__hZIAM .style_examples__Lfqyh{height:350px;position:relative;width:400px;z-index:0}.style_docs__hZIAM .style_buttons__FEoDM{display:flex;justify-content:space-between;margin:18px 0;position:relative;width:400px;z-index:1}.style_docs__hZIAM .style_buttons__FEoDM>button{background-color:unset;border:unset;font-family:inherit}.style_docs__hZIAM .style_buttons__FEoDM>button:not(:disabled){cursor:pointer}.style_docs__hZIAM .style_github__oNq0W{align-items:center;bottom:16px;color:#5b5b5b;cursor:pointer;display:flex;position:absolute;transition:color .2s}.style_docs__hZIAM .style_github__oNq0W:hover{color:#333}.style_docs__hZIAM .style_githubLabel__e5i-8{font-size:14px;margin:0 8px}";
	var styles = {"docs":"style_docs__hZIAM","logo":"style_logo__L5bpy","examples":"style_examples__Lfqyh","buttons":"style_buttons__FEoDM","github":"style_github__oNq0W","githubLabel":"style_githubLabel__e5i-8"};
	styleInject(css_248z);

	const Docs = () => {
	    const examples = React2.useMemo(() => [
	        './codes/00-installation-and-tips.md',
	        './codes/01-initial-warpvas.md',
	        './codes/02-update-vertex-coord.md',
	        './codes/03-update-boundary-coords.md',
	        './codes/04-add-split-point.md',
	        './codes/05-remove-region.md',
	        './codes/06-set-configuration.md',
	        './codes/07-set-split-unit.md',
	        './codes/08-set-strategy.md',
	        './codes/09-set-Input-limit-size.md',
	        './codes/10-set-output-limit-size.md',
	        './codes/11-set-rendering-context.md',
	        './codes/12-render-with-worker.md',
	    ], []);
	    const [indexs, setIndexs] = React2.useState(examples.map((_, index, arr) => arr.length - index));
	    const step = React2.useMemo(() => {
	        let index = 0;
	        let max = indexs[0];
	        for (let i = 1; i < indexs.length; i++) {
	            if (indexs[i] > max) {
	                max = indexs[i];
	                index = i;
	            }
	        }
	        return index;
	    }, [indexs]);
	    const handleTopDemo = React2.useCallback((index) => {
	        setIndexs((list) => {
	            const newList = [...list];
	            newList[index] = Math.max(...list) + 1;
	            return newList;
	        });
	    }, []);
	    const handleTopPreDemo = React2.useCallback(() => {
	        setIndexs((list) => {
	            const newList = [...list];
	            newList[step - 1] = newList[step] + 1;
	            return newList;
	        });
	    }, [step]);
	    const handleTopNextDemo = React2.useCallback(() => {
	        setIndexs((list) => {
	            const newList = [...list];
	            newList[step + 1] = newList[step] + 1;
	            return newList;
	        });
	    }, [step]);
	    return (React2.createElement("div", { className: styles.docs },
	        React2.createElement(WarpedCanvas, { className: styles.logo, step: step }),
	        React2.createElement("div", { className: styles.examples }, examples.map((link, index) => {
	            return (React2.createElement(NotePaper, { key: index, active: step === index, style: { zIndex: indexs[index] }, paperLink: link, onMouseDown: () => handleTopDemo(index) }));
	        })),
	        React2.createElement("div", { className: styles.buttons },
	            React2.createElement("button", { type: "button", disabled: step === 0, onClick: handleTopPreDemo }, "<\u00A0pre"),
	            React2.createElement("button", { type: "button", disabled: step === examples.length - 1, onClick: handleTopNextDemo }, "next\u00A0>")),
	        React2.createElement("div", { className: styles.github, onClick: () => {
	                window.open('https://github.com/huanjinliu/warpvas.git', '__target');
	            } },
	            React2.createElement(Icon$1, { name: "github", size: 24 }),
	            React2.createElement("span", { className: styles.githubLabel }, "GitHub"))));
	};

	const root = createRoot(document.getElementById('docs'));
	root.render(React2.createElement(reactActivationExports.AliveScope, null,
	    React2.createElement(BrowserRouter, null,
	        React2.createElement(Docs, null))));

})(React, ReactDOM, fabric);
