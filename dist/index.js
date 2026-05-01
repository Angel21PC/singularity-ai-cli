#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
import { render } from 'ink';
import { App } from './ui/App.js';
import { getDb } from './db/init.js';
try {
    getDb();
}
catch (error) {
    console.error("Failed to initialize database", error);
}
render(_jsx(App, {}));
