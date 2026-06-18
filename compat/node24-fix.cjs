'use strict';
// Playwright 1.61 calls Array.includes() on context.conditions, but
// Node.js 24 changed that value from Array to Set. Add .includes() to
// Set so the call works without touching node_modules.
if (!Set.prototype.includes) {
  Set.prototype.includes = function (value) {
    return this.has(value);
  };
}
